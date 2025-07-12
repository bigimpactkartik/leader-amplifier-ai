import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useScheduledContent } from "@/hooks/useScheduledContent";
import { useUsers } from "@/hooks/useUsers";
import { Loader2, RefreshCw, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

const ScheduledPostsTab = () => {
  const { scheduledContent, loading, fetchScheduledContent } = useScheduledContent();
  const { currentUser } = useUsers();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    </Card>
  );
};

export default ScheduledPostsTab;