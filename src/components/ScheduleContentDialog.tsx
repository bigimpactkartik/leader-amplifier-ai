import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useScheduledContent } from "@/hooks/useScheduledContent";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Loader2 } from "lucide-react";

interface Content {
  id: number
  content: string | null
  platform: string | null
  type: string | null
}

interface ScheduleContentDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedContents: Content[]
  onScheduleComplete: () => void
}

interface ScheduleItem {
  contentId: number
  platform: string
  scheduledAt: Date | undefined
}

const ScheduleContentDialog = ({ 
  isOpen, 
  onClose, 
  selectedContents, 
  onScheduleComplete 
}: ScheduleContentDialogProps) => {
  const { scheduleMultipleContent } = useScheduledContent()
  const { currentUser } = useUsers()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize schedule items for each selected content
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(
    selectedContents.map(content => ({
      contentId: content.id,
      platform: content.platform || 'linkedin',
      scheduledAt: undefined
    }))
  )

  const socialMediaPlatforms = [
    { value: "linkedin", label: "LinkedIn" },
    { value: "twitter", label: "X (Twitter)" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" }
  ]

  const updateScheduleItem = (contentId: number, field: keyof ScheduleItem, value: any) => {
    setScheduleItems(prev => prev.map(item => 
      item.contentId === contentId 
        ? { ...item, [field]: value }
        : item
    ))
  }

  const handleSubmitSchedule = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No user logged in",
        variant: "destructive"
      })
      return
    }

    // Validate that all items have required fields
    const invalidItems = scheduleItems.filter(item => !item.scheduledAt || !item.platform)
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please set date, time, and platform for all content items",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const scheduleData = scheduleItems.map(item => ({
        contentId: item.contentId,
        platform: item.platform,
        scheduledAt: item.scheduledAt!.toISOString(),
        userId: currentUser.id
      }))

      await scheduleMultipleContent(scheduleData)
      onScheduleComplete()
      onClose()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const truncateContent = (content: string | null, maxLength: number = 100) => {
    if (!content) return 'No content'
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  const getScheduleItem = (contentId: number) => {
    return scheduleItems.find(item => item.contentId === contentId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Content Posting
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-300 text-sm">
            Schedule {selectedContents.length} content item{selectedContents.length !== 1 ? 's' : ''} for posting
          </p>

          {selectedContents.map((content) => {
            const scheduleItem = getScheduleItem(content.id)
            return (
              <div key={content.id} className="p-4 bg-white/5 border border-white/20 rounded-lg space-y-4">
                {/* Content Preview */}
                <div>
                  <Label className="text-white text-sm font-medium">Content Preview</Label>
                  <div className="mt-1 p-3 bg-white/5 border border-white/10 rounded text-gray-300 text-sm">
                    {truncateContent(content.content)}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    ID: {content.id} | Type: {content.type || 'Unknown'} | Current Platform: {content.platform || 'Unknown'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Platform Selection */}
                  <div>
                    <Label className="text-white text-sm font-medium">Select Platform</Label>
                    <Select 
                      value={scheduleItem?.platform || 'linkedin'} 
                      onValueChange={(value) => updateScheduleItem(content.id, 'platform', value)}
                    >
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

                  {/* Date and Time Selection */}
                  <div>
                    <Label className="text-white text-sm font-medium">Schedule Date & Time</Label>
                    <DateTimePicker
                      date={scheduleItem?.scheduledAt}
                      onDateTimeChange={(date) => updateScheduleItem(content.id, 'scheduledAt', date)}
                      placeholder="Choose date and time"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
            <Button 
              onClick={onClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSchedule}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Submit Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleContentDialog