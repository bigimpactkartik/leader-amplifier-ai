import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, Trash2, RefreshCw, Loader2, Edit, Power, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useSources } from "@/hooks/useSources";
import { useToast } from "@/hooks/use-toast";

const SourcesTab = () => {
  const { toast } = useToast();
  const { 
    sources, 
    loading, 
    createSource, 
    deleteSource, 
    toggleSourceStatus,
    fetchSources 
  } = useSources();

  const [newSource, setNewSource] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

  // Form state for detailed source creation
  const [sourceForm, setSourceForm] = useState({
    url: "",
    description: "",
    source_type: ""
  });

  // Predefined source types
  const sourceTypes = [
    { value: "Website", label: "Website", icon: "🌐", placeholder: "https://example.com" },
    { value: "RSS Feed", label: "RSS Feed", icon: "📡", placeholder: "https://example.com/feed.xml" },
    { value: "Social Media", label: "Social Media", icon: "📱", placeholder: "@username or profile URL" },
    { value: "Blog", label: "Blog", icon: "📝", placeholder: "https://blog.example.com" },
    { value: "News Site", label: "News Site", icon: "📰", placeholder: "https://news.example.com" },
    { value: "YouTube Channel", label: "YouTube Channel", icon: "📺", placeholder: "https://youtube.com/@channel" },
    { value: "Podcast", label: "Podcast", icon: "🎙️", placeholder: "https://podcast.example.com" },
    { value: "Newsletter", label: "Newsletter", icon: "📧", placeholder: "Newsletter subscription URL" }
  ];

  const addSource = async () => {
    if (!newSource.trim()) {
      toast({
        title: "Error",
        description: "Please enter a source URL",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSourceType) {
      toast({
        title: "Error",
        description: "Please select a source type",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await createSource({
        url: newSource.trim(),
        description: `${selectedSourceType} source`,
        source_type: selectedSourceType,
        key: 'Active'
      });
      setNewSource("");
      setSelectedSourceType("");
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const addDetailedSource = async () => {
    if (!sourceForm.url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a source URL",
        variant: "destructive"
      });
      return;
    }

    if (!sourceForm.source_type) {
      toast({
        title: "Error",
        description: "Please select a source type",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await createSource({
        url: sourceForm.url.trim(),
        description: sourceForm.description.trim() || `${sourceForm.source_type} source`,
        source_type: sourceForm.source_type,
        key: 'Active'
      });
      
      setSourceForm({
        url: "",
        description: "",
        source_type: ""
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const removeSource = async (id: number) => {
    try {
      await deleteSource(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await toggleSourceStatus(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEditSource = (source: any) => {
    setEditingSource(source);
    setSourceForm({
      url: source.url || "",
      description: source.description || "",
      source_type: source.source_type || ""
    });
    setIsEditDialogOpen(true);
  };

  const toggleDescription = (sourceId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getSourceTypeColor = (type: string | null) => {
    const colors = {
      "Website": "bg-blue-600 text-white",
      "RSS Feed": "bg-green-600 text-white",
      "Social Media": "bg-purple-600 text-white",
      "Blog": "bg-orange-600 text-white",
      "News Site": "bg-red-600 text-white",
      "YouTube Channel": "bg-red-500 text-white",
      "Podcast": "bg-indigo-600 text-white",
      "Newsletter": "bg-yellow-600 text-white"
    };
    return colors[type as keyof typeof colors] || "bg-gray-600 text-white";
  };

  const getSourceTypeIcon = (type: string | null) => {
    const sourceType = sourceTypes.find(st => st.value === type);
    return sourceType?.icon || "🔗";
  };

  const getStatusColor = (status: string | null) => {
    return status === "Active" ? "bg-green-600 text-white" : "bg-gray-600 text-white";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Globe className="mr-2 h-5 w-5" />
            Content Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">Loading sources...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Globe className="mr-2 h-5 w-5" />
          Content Sources
        </CardTitle>
        <p className="text-gray-300">Manage your content sources and feeds</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Quick Add Source with Dropdown */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={selectedSourceType} onValueChange={setSelectedSourceType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {sourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                      <div className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder={
                  selectedSourceType 
                    ? sourceTypes.find(t => t.value === selectedSourceType)?.placeholder || "Enter URL..."
                    : "Select type first..."
                }
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && addSource()}
                disabled={!selectedSourceType}
              />
              
              <Button 
                onClick={addSource} 
                disabled={isCreating || !selectedSourceType || !newSource.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Source
              </Button>
            </div>
            
            {selectedSourceType && (
              <div className="text-sm text-gray-400 flex items-center space-x-2">
                <span>{getSourceTypeIcon(selectedSourceType)}</span>
                <span>Adding {selectedSourceType} source</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Detailed Source
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Source</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="source-type" className="text-white">Source Type *</Label>
                    <Select value={sourceForm.source_type} onValueChange={(value) => setSourceForm(prev => ({ ...prev, source_type: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {sourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                            <div className="flex items-center space-x-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="url" className="text-white">URL *</Label>
                    <Input
                      id="url"
                      placeholder={
                        sourceForm.source_type 
                          ? sourceTypes.find(t => t.value === sourceForm.source_type)?.placeholder || "Enter URL..."
                          : "Select source type first..."
                      }
                      value={sourceForm.url}
                      onChange={(e) => setSourceForm(prev => ({ ...prev, url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this source..."
                      value={sourceForm.description}
                      onChange={(e) => setSourceForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <Button 
                    onClick={addDetailedSource}
                    disabled={isCreating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Source"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={fetchSources}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Sources List */}
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">No sources found. Add your first source to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSourceTypeIcon(source.source_type)}</span>
                        <Badge className={getSourceTypeColor(source.source_type)}>
                          {source.source_type || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium break-all" title={source.url || ''}>
                          {source.url || 'No URL'}
                        </div>
                        {source.description && (
                          <div className="mt-2">
                            <div className="text-gray-400 text-sm">
                              {expandedDescriptions.has(source.id) 
                                ? source.description 
                                : truncateText(source.description, 100)
                              }
                            </div>
                            {source.description.length > 100 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDescription(source.id)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 p-0 h-auto mt-1"
                              >
                                {expandedDescriptions.has(source.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Show more
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                          Added {formatDate(source.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className={getStatusColor(source.key)}>
                        {source.key || 'Unknown'}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(source.id)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                          title={`Mark as ${source.key === 'Active' ? 'Inactive' : 'Active'}`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSource(source)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSource(source.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Source Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Source</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-source-type" className="text-white">Source Type *</Label>
                <Select value={sourceForm.source_type} onValueChange={(value) => setSourceForm(prev => ({ ...prev, source_type: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {sourceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-url" className="text-white">URL *</Label>
                <Input
                  id="edit-url"
                  placeholder="https://example.com or @username"
                  value={sourceForm.url}
                  onChange={(e) => setSourceForm(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description" className="text-white">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Brief description of this source..."
                  value={sourceForm.description}
                  onChange={(e) => setSourceForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              <Button 
                onClick={() => {
                  // For now, we'll just close the dialog
                  // In a real app, you'd implement the update functionality
                  setIsEditDialogOpen(false);
                  toast({
                    title: "Info",
                    description: "Edit functionality will be implemented in the next update"
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Update Source
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SourcesTab;