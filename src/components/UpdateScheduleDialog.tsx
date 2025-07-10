import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";

interface UpdateScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentData: {
    content: any;
    schedule: any;
  } | null;
  onUpdate: (newDateTime: string) => Promise<void>;
  convertUTCToIST: (utcDateString: string) => string;
}

const UpdateScheduleDialog = ({ 
  isOpen, 
  onClose, 
  contentData, 
  onUpdate, 
  convertUTCToIST 
}: UpdateScheduleDialogProps) => {
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Initialize datetime when dialog opens
  useEffect(() => {
    if (isOpen && contentData?.schedule?.scheduled_at) {
      const istDateTime = convertUTCToIST(contentData.schedule.scheduled_at);
      setSelectedDateTime(istDateTime);
      setValidationError("");
    }
  }, [isOpen, contentData, convertUTCToIST]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDateTime("");
      setValidationError("");
      setIsUpdating(false);
    }
  }, [isOpen]);

  const validateDateTime = (dateTimeString: string) => {
    if (!dateTimeString) {
      return "Please select a date and time";
    }

    const selectedDate = new Date(dateTimeString);
    const now = new Date();

    if (selectedDate <= now) {
      return "Scheduled time must be in the future";
    }

    return "";
  };

  const handleSave = async () => {
    const error = validateDateTime(selectedDateTime);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(selectedDateTime);
      onClose();
    } catch (error) {
      console.error("Error updating schedule:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateTimeChange = (value: string) => {
    setSelectedDateTime(value);
    if (validationError) {
      setValidationError("");
    }
  };

  const formatContentPreview = (content: string | null) => {
    if (!content) return 'No content available';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  if (!contentData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Update Schedule</DialogTitle>
          <p className="text-gray-300 text-sm">
            Modify the scheduled posting time for this content
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Content Preview */}
          <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Content #{contentData.content.id}</span>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Platform: {contentData.content.platform || 'Not set'}</span>
                  <span>•</span>
                  <span>Type: {contentData.content.type || 'Not set'}</span>
                </div>
              </div>
              <div className="text-gray-300 text-sm leading-relaxed">
                {formatContentPreview(contentData.content.content)}
              </div>
            </div>
          </div>

          {/* Current Schedule Info */}
          <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <div className="text-blue-300 text-sm">
              <strong>Current Schedule:</strong> {new Date(contentData.schedule.scheduled_at).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })} IST
            </div>
          </div>

          {/* DateTime Input */}
          <div className="space-y-2">
            <Label htmlFor="schedule-datetime" className="text-white">
              New Schedule Date & Time (IST)
            </Label>
            <Input
              id="schedule-datetime"
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => handleDateTimeChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              min={new Date().toISOString().slice(0, 16)}
            />
            {validationError && (
              <p className="text-red-400 text-sm">{validationError}</p>
            )}
            <p className="text-gray-400 text-xs">
              Time zone: India Standard Time (IST, UTC+5:30)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button 
              onClick={handleSave}
              disabled={isUpdating || !selectedDateTime}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateScheduleDialog;