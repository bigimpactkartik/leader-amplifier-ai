import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Calendar, Clock } from "lucide-react";

interface ScheduleDisplayProps {
  contentId: number;
  onScheduleUpdate?: () => void;
}

interface ScheduledContentRecord {
  id: number;
  scheduled_at: string;
  status: string;
}

const ScheduleDisplay = ({ contentId, onScheduleUpdate }: ScheduleDisplayProps) => {
  const { toast } = useToast();
  const [scheduledContent, setScheduledContent] = useState<ScheduledContentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [validationError, setValidationError] = useState("");

  // Fetch schedule data for this content
  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('scheduled_content')
        .select('id, scheduled_at, status')
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      setScheduledContent(data || null);
    } catch (err) {
      console.error('Error fetching schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert UTC to IST for display
  const convertUTCToIST = (utcString: string): string => {
    const utcDate = new Date(utcString);
    // Add 5.5 hours for IST
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    return istDate.toISOString().slice(0, 16);
  };

  // Convert IST to UTC for storage
  const convertISTToUTC = (istString: string): string => {
    const istDate = new Date(istString);
    // Subtract 5.5 hours to get UTC
    const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
    return utcDate.toISOString();
  };

  // Validate future date
  const validateDateTime = (dateTimeString: string): boolean => {
    const selectedDate = new Date(dateTimeString);
    const now = new Date();
    return selectedDate > now;
  };

  // Handle modal open
  const handleOpenModal = () => {
    if (scheduledContent?.scheduled_at) {
      setScheduleDateTime(convertUTCToIST(scheduledContent.scheduled_at));
    } else {
      // Default to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setScheduleDateTime(defaultTime.toISOString().slice(0, 16));
    }
    setValidationError("");
    setIsModalOpen(true);
  };

  // Handle schedule update
  const handleUpdateSchedule = async () => {
    // Validate input
    if (!scheduleDateTime) {
      setValidationError("Please select a date and time");
      return;
    }

    if (!validateDateTime(scheduleDateTime)) {
      setValidationError("Schedule time must be in the future");
      return;
    }

    setIsUpdating(true);
    setValidationError("");

    try {
      const utcDateTime = convertISTToUTC(scheduleDateTime);

      if (scheduledContent) {
        // Update existing schedule
        const { error } = await supabase
          .from('scheduled_content')
          .update({ 
            scheduled_at: utcDateTime,
            status: 'pending'
          })
          .eq('id', scheduledContent.id);

        if (error) throw error;
      } else {
        // Create new schedule
        const { error } = await supabase
          .from('scheduled_content')
          .insert({
            content_id: contentId,
            scheduled_at: utcDateTime,
            status: 'pending',
            user_id: 1 // Using demo user ID
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });

      setIsModalOpen(false);
      await fetchScheduleData();
      onScheduleUpdate?.();
    } catch (err) {
      console.error('Error updating schedule:', err);
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Format display date
  const formatDisplayDate = (utcString: string): string => {
    const date = new Date(utcString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchScheduleData();
  }, [contentId]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        {scheduledContent ? (
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
            title={`Scheduled for ${formatDisplayDate(scheduledContent.scheduled_at)}`}
          >
            <Calendar className="h-3 w-3" />
            <span>Scheduled</span>
          </button>
        ) : (
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-500/20 transition-colors"
            style={{ color: '#666666' }}
          >
            <Clock className="h-3 w-3" />
            <span>Not Scheduled</span>
          </button>
        )}
      </div>

      {/* Schedule Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Update Schedule</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-datetime" className="text-white">
                Schedule Date & Time (IST)
              </Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => {
                  setScheduleDateTime(e.target.value);
                  setValidationError("");
                }}
                className="bg-white/10 border-white/20 text-white"
                min={new Date().toISOString().slice(0, 16)}
              />
              {validationError && (
                <p className="text-red-400 text-sm mt-1">{validationError}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Time will be converted to UTC for storage
              </p>
            </div>

            {scheduledContent && (
              <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Current Schedule:</strong><br />
                  {formatDisplayDate(scheduledContent.scheduled_at)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateSchedule}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Schedule"
                )}
              </Button>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScheduleDisplay;