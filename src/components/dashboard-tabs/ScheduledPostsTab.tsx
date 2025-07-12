import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScheduledContent } from "@/hooks/useScheduledContent";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Calendar, Clock, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";

const ScheduledPostsTab = () => {
  const { scheduledContent, loading, fetchScheduledContent, updateScheduledContent } = useScheduledContent();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDateTime, setEditDateTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Filter scheduled content for current user
  const userScheduledContent = scheduledContent.filter(
    item => currentUser && item.user_id === currentUser.id
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchScheduledContent();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post.id);
    
    // Format the current scheduled time for the datetime-local input
    if (post.scheduled_at) {
      const date = new Date(post.scheduled_at);
      // Convert to local timezone and format for datetime-local input (YYYY-MM-DDTHH:mm)
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEditDateTime(localDateTime);
    } else {
      // Default to current time + 1 hour
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      const localDateTime = new Date(defaultTime.getTime() - defaultTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEditDateTime(localDateTime);
    }
    
    setIsEditDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingPost || !editDateTime) {
      toast({
        title: "Error",
        description: "Please select a valid date and time",
        variant: "destructive"
      });
      return;
    }

    // Validate that the selected time is in the future
    const selectedDate = new Date(editDateTime);
    const now = new Date();
    
    if (selectedDate <= now) {
      toast({
        title: "Error",
        description: "Please select a future date and time",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Convert local datetime to UTC for storage
      const utcDateTime = selectedDate.toISOString();
      
      await updateScheduledContent(editingPost, {
        scheduled_at: utcDateTime
      });
      
      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingPost(null);
      setEditDateTime("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingPost(null);
    setEditDateTime("");
  };

  // Get minimum datetime (current time) for the input
  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const formatScheduledTime = (scheduledAt: string | null) => {
    if (!scheduledAt) return 'Not set';
    
    try {
      // Convert UTC to local timezone and format
      const date = new Date(scheduledAt);
      return format(date, "dd MMM yyyy, hh:mm a");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusValue = status || 'pending';
    
    switch (statusValue.toLowerCase()) {
      case 'posted':
        return (
          <Badge className="bg-green-600 text-white">
            Posted
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-600 text-white">
            Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-600 text-white">
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Calendar className="mr-2 h-5 w-5" />
            Scheduled Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">Loading scheduled posts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Scheduled Posts
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardTitle>
        <p className="text-gray-300">View and manage your scheduled content posts</p>
      </CardHeader>
      <CardContent>
        {userScheduledContent.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">No scheduled posts found</p>
            <p className="text-gray-400 text-sm">
              Schedule some content to see it appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {userScheduledContent.filter(item => item.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-300">Pending Posts</div>
              </div>
              <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {userScheduledContent.filter(item => item.status === 'posted').length}
                </div>
                <div className="text-sm text-gray-300">Posted</div>
              </div>
              <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {userScheduledContent.length}
                </div>
                <div className="text-sm text-gray-300">Total Scheduled</div>
              </div>
            </div>

            {/* Scheduled Posts Table */}
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white text-left">Content ID</TableHead>
                  <TableHead className="text-white">Scheduled At</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Posted At</TableHead>
                  <TableHead className="text-white">Created</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userScheduledContent.map((item) => (
                  <TableRow key={item.id} className="border-white/10">
                    <TableCell className="text-white font-mono text-sm text-left">
                      {item.content_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatScheduledTime(item.scheduled_at)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {item.posted_at ? formatScheduledTime(item.posted_at) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(item.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {item.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(item)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination placeholder - can be implemented later if needed */}
            {userScheduledContent.length > 10 && (
              <div className="flex justify-center mt-6">
                <p className="text-gray-400 text-sm">
                  Showing {userScheduledContent.length} scheduled posts
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Scheduled Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-datetime" className="text-white">
                Scheduled Date & Time
              </Label>
              <Input
                id="edit-datetime"
                type="datetime-local"
                value={editDateTime}
                min={getMinDateTime()}
                onChange={(e) => setEditDateTime(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Select a future date and time for posting
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveSchedule}
                disabled={isSaving || !editDateTime}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCancelEdit}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ScheduledPostsTab;