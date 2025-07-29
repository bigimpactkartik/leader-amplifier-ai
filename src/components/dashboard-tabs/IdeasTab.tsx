import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIdeas } from "@/hooks/useIdeas";
import { ChevronDown, Plus, Loader2, Trash2, RefreshCw, Edit, Save, Eye } from "lucide-react";

interface ContentSelection {
  ideaId: number;
  platform: string;
  contentType: string;
}

const IdeasTab = () => {
  const { toast } = useToast();
  const { ideas, loading, createIdea, deleteIdea, markIdeasAsUsed, updateIdea, fetchIdeas } = useIdeas();
  
  const [selectedIdeas, setSelectedIdeas] = useState<number[]>([]);
  const [contentSelections, setContentSelections] = useState<ContentSelection[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<any>(null);
  const [viewingIdea, setViewingIdea] = useState<any>(null);
  const [newIdeaContent, setNewIdeaContent] = useState("");
  const [editIdeaContent, setEditIdeaContent] = useState("");
  const [editIdeaTitle, setEditIdeaTitle] = useState("");
  const [editIdeaDescription, setEditIdeaDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const platformContentTypes = {
    LinkedIn: ["Article", "Text Post", "Newsletter", "Image Post", "Video scripts"],
    Instagram: ["Reels", "Post", "Story", "Image"],
    YouTube: ["Video", "Shorts"],
    Twitter: ["Tweet", "Thread", "Image"],
    Facebook: ["Post", "Article", "Image", "Video"],
    TikTok: ["Video", "Shorts"]
  };

  // Webhook URLs for different platforms
  const webhookUrls = {
    LinkedIn: "https://hook.eu2.make.com/uo1mv8iqh5dnljhodml75kppe8e6j1fy",
    Instagram: "https://hook.eu2.make.com/jd7mofm8w2622mjadxlya9w481f7rboq",
    Facebook: "https://hook.eu2.make.com/eeia98ktnu8vth9epzmv89ym4a6eeyi3"
  };

  const handleRowClick = (ideaId: number) => {
    setSelectedIdeas(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  const handleContentSelection = (ideaId: number, platform: string, contentType: string) => {
    if (contentType === "None") {
      setContentSelections(prev => 
        prev.filter(sel => !(sel.ideaId === ideaId && sel.platform === platform))
      );
      
      toast({
        title: "Content Selection Removed",
        description: `Removed ${platform} content for idea`
      });
      return;
    }

    const newSelection: ContentSelection = { ideaId, platform, contentType };
    
    setContentSelections(prev => {
      const filtered = prev.filter(sel => !(sel.ideaId === ideaId && sel.platform === platform));
      return [...filtered, newSelection];
    });

    toast({
      title: "Content Type Selected",
      description: `${platform} ${contentType} selected for idea`
    });
  };

  // Function to call webhook for specific platform with idea ID
  const callPlatformWebhook = async (platform: string, ideaId: number, contentType: string) => {
    const webhookUrl = webhookUrls[platform as keyof typeof webhookUrls];
    
    if (!webhookUrl) {
      console.warn(`No webhook URL configured for platform: ${platform}`);
      return false;
    }

    try {
      console.log(`Calling ${platform} webhook for idea ID: ${ideaId}, content type: ${contentType}`);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Add this to handle CORS issues
        body: JSON.stringify({
        id: ideaId,
          contentType: contentType // Add content type to the payload
        }),
      });

      // Note: With no-cors mode, we can't check response status
      // but the request will be sent successfully
      console.log(`${platform} webhook called successfully for idea ID ${ideaId}`);
      return true;
    } catch (error) {
      console.error(`Error calling ${platform} webhook for idea ID ${ideaId}:`, error);
      throw error;
    }
  };

  const handleGenerateContent = async () => {
    if (selectedIdeas.length === 0) {
      toast({
        title: "No ideas selected",
        description: "Please select at least one idea to generate content",
        variant: "destructive"
      });
      return;
    }

    if (contentSelections.length === 0) {
      toast({
        title: "No content types selected",
        description: "Please select content types for your ideas",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Group selections by platform
      const platformGroups = contentSelections.reduce((groups, selection) => {
        if (!groups[selection.platform]) {
          groups[selection.platform] = [];
        }
        groups[selection.platform].push(selection);
        return groups;
      }, {} as Record<string, ContentSelection[]>);

      // Process webhook-enabled platforms
      const webhookPlatforms = Object.keys(webhookUrls);
      const webhookResults = [];
      const otherPlatforms = [];

      // Process each platform
      for (const [platform, selections] of Object.entries(platformGroups)) {
        if (webhookPlatforms.includes(platform)) {
          console.log(`Processing webhook platform: ${platform} with ${selections.length} selections`);
          
          // Call webhook for each idea in this platform
          const platformPromises = selections.map(async (selection) => {
            try {
              await callPlatformWebhook(platform, selection.ideaId, selection.contentType);
              return { success: true, ideaId: selection.ideaId };
            } catch (error) {
              console.error(`Failed webhook call for ${platform}, idea ${selection.ideaId}:`, error);
              return { success: false, ideaId: selection.ideaId, error };
            }
          });

          const results = await Promise.all(platformPromises);
          const successCount = results.filter(r => r.success).length;
          const failureCount = results.filter(r => !r.success).length;

          webhookResults.push({
            platform,
            totalCount: selections.length,
            successCount,
            failureCount,
            success: successCount > 0,
            ideaIds: selections.map(s => s.ideaId)
          });
        } else {
          otherPlatforms.push({ 
            platform, 
            count: selections.length,
            ideaIds: selections.map(s => s.ideaId)
          });
        }
      }

      // Provide detailed feedback for webhook platforms
      for (const result of webhookResults) {
        if (result.successCount > 0) {
          toast({
            title: `${result.platform} Webhook Success`,
            description: `Successfully initiated content generation for ${result.successCount} idea(s). IDs: ${result.ideaIds.join(', ')}`
          });
        }
        
        if (result.failureCount > 0) {
          toast({
            title: `${result.platform} Webhook Errors`,
            description: `Failed to process ${result.failureCount} idea(s). Check console for details.`,
            variant: "destructive"
          });
        }
      }

      // Handle other platforms (existing logic)
      if (otherPlatforms.length > 0) {
        const totalOtherCount = otherPlatforms.reduce((sum, p) => sum + p.count, 0);
        const allOtherIdeaIds = otherPlatforms.flatMap(p => p.ideaIds);
        
        toast({
          title: "Standard Content Generation",
          description: `Processing ${totalOtherCount} content pieces for other platforms. Idea IDs: ${[...new Set(allOtherIdeaIds)].join(', ')}`
        });
      }

      // Mark all selected ideas as used
      await markIdeasAsUsed(selectedIdeas);
      
      // Summary toast
      const totalWebhookCalls = webhookResults.reduce((sum, r) => sum + r.successCount, 0);
      const totalFailures = webhookResults.reduce((sum, r) => sum + r.failureCount, 0);
      
      toast({
        title: "Content Generation Summary",
        description: `Processed ${selectedIdeas.length} ideas. Webhook calls: ${totalWebhookCalls} successful, ${totalFailures} failed. Selected IDs: ${selectedIdeas.join(', ')}`
      });

      // Clear selections
      setSelectedIdeas([]);
      setContentSelections([]);
    } catch (error) {
      console.error("Error in content generation:", error);
      toast({
        title: "Error",
        description: "Failed to process some content generation requests",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateIdea = async () => {
    if (!newIdeaContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter idea content",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      await createIdea({
        content: newIdeaContent,
        status: 'new',
        priority_score: 0.5,
        user_id: 1 // Using demo user ID - replace with actual user when auth is implemented
      });

      setNewIdeaContent("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewIdea = (idea: any) => {
    setViewingIdea(idea);
    setIsViewDialogOpen(true);
  };

  const handleEditIdea = (idea: any) => {
    setEditingIdea(idea);
    setEditIdeaContent(idea.content || "");
    // Extract title and description from content if they exist
    const content = idea.content || "";
    const lines = content.split('\n');
    if (lines.length > 1) {
      setEditIdeaTitle(lines[0]);
      setEditIdeaDescription(lines.slice(1).join('\n'));
    } else {
      setEditIdeaTitle("");
      setEditIdeaDescription(content);
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdateIdea = async () => {
    if (!editingIdea) {
      toast({
        title: "Error",
        description: "No idea selected for editing",
        variant: "destructive"
      });
      return;
    }

    // Combine title and description into content
    let combinedContent = "";
    if (editIdeaTitle.trim()) {
      combinedContent = editIdeaTitle.trim();
      if (editIdeaDescription.trim()) {
        combinedContent += '\n' + editIdeaDescription.trim();
      }
    } else if (editIdeaDescription.trim()) {
      combinedContent = editIdeaDescription.trim();
    } else if (editIdeaContent.trim()) {
      combinedContent = editIdeaContent.trim();
    }

    if (!combinedContent) {
      toast({
        title: "Error",
        description: "Please enter some content",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      await updateIdea(editingIdea.id, {
        content: combinedContent
      });

      setEditIdeaContent("");
      setEditIdeaTitle("");
      setEditIdeaDescription("");
      setEditingIdea(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteIdea = async (ideaId: number) => {
    try {
      await deleteIdea(ideaId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleRefresh = () => {
    fetchIdeas();
  };

  const getSelectionForIdea = (ideaId: number, platform: string) => {
    return contentSelections.find(sel => sel.ideaId === ideaId && sel.platform === platform);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "used": return "bg-green-500/20 text-green-300";
      case "new": return "bg-blue-500/20 text-blue-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isPlatformWebhookEnabled = (platform: string) => {
    return Object.keys(webhookUrls).includes(platform);
  };

  const getWebhookIcon = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return '🔗';
      case 'Instagram': return '📸';
      case 'Facebook': return '📘';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Content Ideas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">Loading ideas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Content Ideas</CardTitle>
        <p className="text-gray-300">Click on ideas to select them, then choose content types for each platform</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Button 
            onClick={handleGenerateContent}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            disabled={selectedIdeas.length === 0 || contentSelections.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              `Generate Content (${contentSelections.length} pieces)`
            )}
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Idea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content" className="text-white">Idea Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your content idea..."
                    value={newIdeaContent}
                    onChange={(e) => setNewIdeaContent(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <Button 
                  onClick={handleCreateIdea}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Idea"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {ideas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No ideas found. Create your first idea to get started!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Content</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Priority</TableHead>
                <TableHead className="text-white">Created</TableHead>
                <TableHead className="text-white">Category </TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((idea) => (
                <TableRow 
                  key={idea.id} 
                  className={`border-white/10 cursor-pointer transition-all hover:bg-white/5 ${
                    selectedIdeas.includes(idea.id) ? 'bg-purple-500/20 border-purple-400/30' : ''
                  }`}
                  onClick={() => handleRowClick(idea.id)}
                >
                  <TableCell className="text-white font-mono text-sm">
                    {idea.id}
                  </TableCell>
                  <TableCell className="text-white font-medium max-w-xs">
                    <div 
                      className="truncate" 
                      title={idea.content || ''}
                    >
                      {idea.content || 'No content'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(idea.status)}`}>
                      {idea.status || 'new'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {idea.priority_score ? Math.round(idea.priority_score) : '50'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {formatDate(idea.created_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {selectedIdeas.includes(idea.id) && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(platformContentTypes).map(([platform, contentTypes]) => (
                          <DropdownMenu key={platform}>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className={`text-xs ${
                                  getSelectionForIdea(idea.id, platform) 
                                    ? isPlatformWebhookEnabled(platform)
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 ring-2 ring-blue-400' 
                                      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                    : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                                }`}
                              >
                                {platform}
                                {isPlatformWebhookEnabled(platform) && getSelectionForIdea(idea.id, platform) && ` ${getWebhookIcon(platform)}`}
                                {getSelectionForIdea(idea.id, platform) && 
                                  `: ${getSelectionForIdea(idea.id, platform)?.contentType}`
                                }
                                <ChevronDown className="ml-1 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-700" align="start">
                              <DropdownMenuLabel className="text-white">
                                {platform} Content Types
                                {isPlatformWebhookEnabled(platform) && ` (Webhook ${getWebhookIcon(platform)})`}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-gray-700" />
                              <DropdownMenuItem
                                onClick={() => handleContentSelection(idea.id, platform, "None")}
                                className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                              >
                                None
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-700" />
                              {contentTypes.map((contentType) => (
                                <DropdownMenuItem
                                  key={contentType}
                                  onClick={() => handleContentSelection(idea.id, platform, contentType)}
                                  className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                                >
                                  {contentType}
                                  {isPlatformWebhookEnabled(platform) && ` ${getWebhookIcon(platform)}`}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewIdea(idea)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditIdea(idea)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* View Idea Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">View Idea</DialogTitle>
            </DialogHeader>
            {viewingIdea && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">ID</Label>
                  <p className="text-gray-300">{viewingIdea.id}</p>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(viewingIdea.status)}`}>
                    {viewingIdea.status || 'new'}
                  </span>
                </div>
                <div>
                  <Label className="text-white">Priority Score</Label>
                  <p className="text-gray-300">{viewingIdea.priority_score ? Math.round(viewingIdea.priority_score) : '5'}/10</p>
                </div>
                <div>
                  <Label className="text-white">Content</Label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3 text-gray-300 max-h-60 overflow-y-auto">
                    {viewingIdea.content || 'No content'}
                  </div>
                </div>
                <div>
                  <Label className="text-white">Created</Label>
                  <p className="text-gray-300">{formatDate(viewingIdea.created_at)}</p>
                </div>
                {viewingIdea.used_at && (
                  <div>
                    <Label className="text-white">Used At</Label>
                    <p className="text-gray-300">{formatDate(viewingIdea.used_at)}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditIdea(viewingIdea);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Idea
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Idea Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Idea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">ID</Label>
                <p className="text-gray-300">{editingIdea?.id}</p>
              </div>
              
              <div>
                <Label htmlFor="edit-title" className="text-white">Title (Optional)</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter a title for your idea..."
                  value={editIdeaTitle}
                  onChange={(e) => setEditIdeaTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description" className="text-white">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter the main content/description of your idea..."
                  value={editIdeaDescription}
                  onChange={(e) => setEditIdeaDescription(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[120px]"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-content-full" className="text-white">Full Content (Alternative)</Label>
                <Textarea
                  id="edit-content-full"
                  placeholder="Or enter your complete idea content here..."
                  value={editIdeaContent}
                  onChange={(e) => setEditIdeaContent(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use either Title + Description above, or Full Content here
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdateIdea}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info about Webhook Integrations */}
        {contentSelections.some(sel => isPlatformWebhookEnabled(sel.platform)) && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 text-lg">🚀</span>
                <span className="text-blue-300 font-medium">Webhook Integrations Active</span>
              </div>
              <div className="text-sm text-blue-200 space-y-1">
                {contentSelections
                  .filter(sel => isPlatformWebhookEnabled(sel.platform))
                  .reduce((platforms, sel) => {
                    const existing = platforms.find(p => p.platform === sel.platform);
                    if (existing) {
                      existing.ideaIds.push(sel.ideaId);
                    } else {
                      platforms.push({
                        platform: sel.platform,
                        ideaIds: [sel.ideaId]
                      });
                    }
                    return platforms;
                  }, [] as Array<{platform: string, ideaIds: number[]}>)
                  .map(({ platform, ideaIds }) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <span>{getWebhookIcon(platform)}</span>
                      <span>{platform} content will be generated via webhook for idea IDs: {ideaIds.join(', ')}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IdeasTab;