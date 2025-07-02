import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useContents } from "@/hooks/useContents";
import { Loader2, Plus, RefreshCw, Trash2, Eye, ExternalLink, Edit, Save, Send } from "lucide-react";

const ContentTab = () => {
  const { toast } = useToast();
  const { 
    contents, 
    loading, 
    createContent, 
    deleteContent, 
    publishContent, 
    generateMoreContent,
    updateContent,
    fetchContents 
  } = useContents();

  const [selectedContent, setSelectedContent] = useState<number[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingContent, setViewingContent] = useState<any>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editContentText, setEditContentText] = useState("");
  const [editContentTitle, setEditContentTitle] = useState("");
  const [editContentDescription, setEditContentDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Form state for creating new content
  const [newContent, setNewContent] = useState({
    content: "",
    platform: "",
    type: "",
    status: "draft"
  });

  const socialMediaPlatforms = [
    { value: "linkedin", label: "LinkedIn" },
    { value: "twitter", label: "Twitter" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" }
  ];

  const contentTypes = [
    { value: "article", label: "Article" },
    { value: "post", label: "Post" },
    { value: "tweet", label: "Tweet" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "story", label: "Story" }
  ];

  const handleSelectContent = (contentId: number) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      await generateMoreContent();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublishSelected = async () => {
    if (selectedContent.length === 0) {
      toast({
        title: "No Content Selected",
        description: "Please select content to publish",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select platforms to publish to",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      // Call LinkedIn webhook for selected content if LinkedIn is in selected platforms
      if (selectedPlatforms.includes('linkedin')) {
        const linkedinWebhookUrl = "https://hook.eu2.make.com/xaikyfjrn4tbhuut7klil7e3f2slqt8w";
        
        for (const contentId of selectedContent) {
          try {
            await fetch(linkedinWebhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              mode: "no-cors",
              body: JSON.stringify({
                content_id: contentId
              }),
            });
            console.log(`LinkedIn webhook called for content ID: ${contentId}`);
          } catch (error) {
            console.error(`Error calling LinkedIn webhook for content ${contentId}:`, error);
          }
        }
      }

      // Call Facebook webhook for selected content if Facebook is in selected platforms
      if (selectedPlatforms.includes('facebook')) {
        const facebookWebhookUrl = "https://hook.eu2.make.com/2fx3hwsl626vxuefc6g8jkbnwqn6wvje";
        
        for (const contentId of selectedContent) {
          try {
            await fetch(facebookWebhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              mode: "no-cors",
              body: JSON.stringify({
                content_id: contentId
              }),
            });
            console.log(`Facebook webhook called for content ID: ${contentId}`);
          } catch (error) {
            console.error(`Error calling Facebook webhook for content ${contentId}:`, error);
          }
        }
      }

      await publishContent(selectedContent, selectedPlatforms);
      setSelectedContent([]);
      setSelectedPlatforms([]);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateContent = async () => {
    if (!newContent.content.trim() || !newContent.platform || !newContent.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      await createContent({
        content: newContent.content,
        platform: newContent.platform,
        type: newContent.type,
        status: newContent.status,
        user_id: 1 // Using demo user ID
      });

      setNewContent({
        content: "",
        platform: "",
        type: "",
        status: "draft"
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    try {
      await deleteContent(contentId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleViewContent = (content: any) => {
    setViewingContent(content);
    setIsViewDialogOpen(true);
  };

  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setEditContentText(content.content || "");
    
    // Extract title and description from content if they exist
    const contentText = content.content || "";
    const lines = contentText.split('\n');
    if (lines.length > 1) {
      setEditContentTitle(lines[0]);
      setEditContentDescription(lines.slice(1).join('\n'));
    } else {
      setEditContentTitle("");
      setEditContentDescription(contentText);
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdateContent = async () => {
    if (!editingContent) {
      toast({
        title: "Error",
        description: "No content selected for editing",
        variant: "destructive"
      });
      return;
    }

    // Combine title and description into content
    let combinedContent = "";
    if (editContentTitle.trim()) {
      combinedContent = editContentTitle.trim();
      if (editContentDescription.trim()) {
        combinedContent += '\n' + editContentDescription.trim();
      }
    } else if (editContentDescription.trim()) {
      combinedContent = editContentDescription.trim();
    } else if (editContentText.trim()) {
      combinedContent = editContentText.trim();
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
      await updateContent(editingContent.id, {
        content: combinedContent
      });

      setEditContentText("");
      setEditContentTitle("");
      setEditContentDescription("");
      setEditingContent(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublishSingle = async (contentId: number, platform: string) => {
    setIsPublishing(true);
    try {
      // Call appropriate webhook based on platform
      if (platform === 'linkedin') {
        const linkedinWebhookUrl = "https://hook.eu2.make.com/xaikyfjrn4tbhuut7klil7e3f2slqt8w";
        
        await fetch(linkedinWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            content_id: contentId
          }),
        });
        console.log(`LinkedIn webhook called for content ID: ${contentId}`);
      } else if (platform === 'facebook') {
        const facebookWebhookUrl = "https://hook.eu2.make.com/2fx3hwsl626vxuefc6g8jkbnwqn6wvje";
        
        await fetch(facebookWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            content_id: contentId
          }),
        });
        console.log(`Facebook webhook called for content ID: ${contentId}`);
      }

      await publishContent([contentId], [platform]);
      
      toast({
        title: "Success",
        description: `Content published to ${platform}`
      });
    } catch (error) {
      console.error(`Error publishing to ${platform}:`, error);
      toast({
        title: "Error",
        description: `Failed to publish to ${platform}`,
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "published": return "bg-green-500/20 text-green-300";
      case "ready": return "bg-blue-500/20 text-blue-300";
      case "draft": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const capitalizeFirst = (str: string | null) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Generated Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">Loading content...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Generated Content</CardTitle>
        <p className="text-gray-300">Manage and publish your content</p>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateMore}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate More Content"
              )}
            </Button>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Content</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="content" className="text-white">Content *</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your content..."
                      value={newContent.content}
                      onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="platform" className="text-white">Platform *</Label>
                      <Select value={newContent.platform} onValueChange={(value) => setNewContent(prev => ({ ...prev, platform: value }))}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {socialMediaPlatforms.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value} className="text-white hover:bg-gray-700">
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-white">Content Type *</Label>
                      <Select value={newContent.type} onValueChange={(value) => setNewContent(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {contentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateContent}
                    disabled={isCreating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Content"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={fetchContents}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {/* Platform Selection for Publishing */}
          {selectedContent.length > 0 && (
            <div className="p-4 bg-white/5 border border-white/20 rounded-lg space-y-3">
              <h3 className="text-white font-medium">Publish Selected Content ({selectedContent.length})</h3>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Select platforms to publish to:</label>
                <div className="flex flex-wrap gap-2">
                  {socialMediaPlatforms.map((platform) => (
                    <button
                      key={platform.value}
                      onClick={() => handlePlatformToggle(platform.value)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedPlatforms.includes(platform.value)
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {platform.label}
                      {(platform.value === 'linkedin' || platform.value === 'facebook') && selectedPlatforms.includes(platform.value) && ' 🔗'}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handlePublishSelected}
                disabled={selectedPlatforms.length === 0 || isPublishing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish to Selected Platforms"
                )}
              </Button>
            </div>
          )}
        </div>
        
        {contents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No content found. Generate or create your first content piece!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white">Select</TableHead>
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Content</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Platform</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Created</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((item) => (
                <TableRow key={item.id} className="border-white/10">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedContent.includes(item.id)}
                      onChange={() => handleSelectContent(item.id)}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded"
                    />
                  </TableCell>
                  <TableCell className="text-white font-mono text-sm">
                    {item.id}
                  </TableCell>
                  <TableCell className="text-white font-medium max-w-xs">
                    <div 
                      className="truncate" 
                      title={item.content || ''}
                    >
                      {item.content || 'No content'}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{capitalizeFirst(item.type)}</TableCell>
                  <TableCell className="text-gray-300">{capitalizeFirst(item.platform)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                      {capitalizeFirst(item.status) || 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{formatDate(item.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewContent(item)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditContent(item)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {item.platform && (item.platform === 'linkedin' || item.platform === 'facebook') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublishSingle(item.id, item.platform!)}
                          disabled={isPublishing}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          title={`Publish to ${capitalizeFirst(item.platform)}`}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {item.content_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.content_url!, '_blank')}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContent(item.id)}
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

        {/* View Content Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">View Content</DialogTitle>
            </DialogHeader>
            {viewingContent && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">ID</Label>
                  <p className="text-gray-300">{viewingContent.id}</p>
                </div>
                <div>
                  <Label className="text-white">Platform</Label>
                  <p className="text-gray-300">{capitalizeFirst(viewingContent.platform)}</p>
                </div>
                <div>
                  <Label className="text-white">Type</Label>
                  <p className="text-gray-300">{capitalizeFirst(viewingContent.type)}</p>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(viewingContent.status)}`}>
                    {capitalizeFirst(viewingContent.status) || 'Draft'}
                  </span>
                </div>
                <div>
                  <Label className="text-white">Content</Label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3 text-gray-300 max-h-60 overflow-y-auto">
                    {viewingContent.content || 'No content'}
                  </div>
                </div>
                {viewingContent.content_url && (
                  <div>
                    <Label className="text-white">URL</Label>
                    <a 
                      href={viewingContent.content_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline block"
                    >
                      {viewingContent.content_url}
                    </a>
                  </div>
                )}
                <div>
                  <Label className="text-white">Created</Label>
                  <p className="text-gray-300">{formatDate(viewingContent.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditContent(viewingContent);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Content
                  </Button>
                  {viewingContent.platform && (viewingContent.platform === 'linkedin' || viewingContent.platform === 'facebook') && (
                    <Button
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handlePublishSingle(viewingContent.id, viewingContent.platform);
                      }}
                      disabled={isPublishing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Publish to {capitalizeFirst(viewingContent.platform)}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Content Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Content</DialogTitle>
            </DialogHeader>
            {editingContent && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">ID</Label>
                  <p className="text-gray-300">{editingContent.id}</p>
                </div>
                <div>
                  <Label className="text-white">Platform</Label>
                  <p className="text-gray-300">{capitalizeFirst(editingContent.platform)}</p>
                </div>
                <div>
                  <Label className="text-white">Type</Label>
                  <p className="text-gray-300">{capitalizeFirst(editingContent.type)}</p>
                </div>
                
                <div>
                  <Label htmlFor="edit-content-title" className="text-white">Title (Optional)</Label>
                  <Input
                    id="edit-content-title"
                    placeholder="Enter a title for your content..."
                    value={editContentTitle}
                    onChange={(e) => setEditContentTitle(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-content-description" className="text-white">Description</Label>
                  <Textarea
                    id="edit-content-description"
                    placeholder="Enter the main content/description..."
                    value={editContentDescription}
                    onChange={(e) => setEditContentDescription(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[120px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-content-text" className="text-white">Full Content (Alternative)</Label>
                  <Textarea
                    id="edit-content-text"
                    placeholder="Or enter your complete content here..."
                    value={editContentText}
                    onChange={(e) => setEditContentText(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Use either Title + Description above, or Full Content here
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdateContent}
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
                  {editingContent.platform && (editingContent.platform === 'linkedin' || editingContent.platform === 'facebook') && (
                    <Button
                      onClick={async () => {
                        await handleUpdateContent();
                        if (!isUpdating) {
                          setIsEditDialogOpen(false);
                          handlePublishSingle(editingContent.id, editingContent.platform);
                        }
                      }}
                      disabled={isUpdating || isPublishing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Save & Publish
                    </Button>
                  )}
                  <Button 
                    onClick={() => setIsEditDialogOpen(false)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ContentTab;