import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useScheduledContent } from "@/hooks/useScheduledContent";
import { useUsers } from "@/hooks/useUsers";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Content {
  id: number
  content: string | null
  platform: string | null
  type: string | null
}

interface ScheduleContentDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedContent: Content[]
}

interface ContentSchedule {
  contentId: number
  date: Date | undefined
  time: string
  platform: string
}

const ScheduleContentDialog = ({ isOpen, onClose, selectedContent }: ScheduleContentDialogProps) => {
  const { scheduleMultipleContent } = useScheduledContent()
  const { currentUser } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize schedule state for each selected content
  const [contentSchedules, setContentSchedules] = useState<ContentSchedule[]>(
    selectedContent.map(content => ({
      contentId: content.id,
      date: undefined,
      time: "09:00",
      platform: content.platform || "linkedin"
    }))
  )

  const platforms = [
    { value: "linkedin", label: "LinkedIn" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "X (Twitter)" }
  ]

  const updateContentSchedule = (contentId: number, field: keyof ContentSchedule, value: any) => {
    setContentSchedules(prev => prev.map(schedule => 
      schedule.contentId === contentId 
        ? { ...schedule, [field]: value }
        : schedule
    ))
  }

  const handleSubmit = async () => {
    // Validate that all content has date and time selected
    const invalidSchedules = contentSchedules.filter(schedule => !schedule.date || !schedule.time || !schedule.platform)
    
    if (invalidSchedules.length > 0) {
      return
    }

    if (!currentUser) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare scheduled content data
      const scheduledContentData = contentSchedules.map(schedule => {
        // Combine date and time into a single datetime
        const scheduledDateTime = new Date(schedule.date!)
        const [hours, minutes] = schedule.time.split(':').map(Number)
        scheduledDateTime.setHours(hours, minutes, 0, 0)

        return {
          user_id: currentUser.id,
          content_id: schedule.contentId,
          scheduled_at: scheduledDateTime.toISOString(),
          status: 'pending'
        }
      })

      await scheduleMultipleContent(scheduledContentData)
      onClose()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const truncateContent = (content: string | null, maxLength: number = 50) => {
    if (!content) return 'No content'
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  const isFormValid = contentSchedules.every(schedule => schedule.date && schedule.time && schedule.platform)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Schedule Content Posting</DialogTitle>
          <p className="text-gray-300 text-sm">
            Set the date, time, and platform for each selected content item
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {selectedContent.map((content, index) => {
            const schedule = contentSchedules.find(s => s.contentId === content.id)
            if (!schedule) return null

            return (
              <div key={content.id} className="p-4 bg-white/5 border border-white/20 rounded-lg space-y-4">
                <div>
                  <Label className="text-white font-medium">Content #{content.id}</Label>
                  <p className="text-gray-300 text-sm mt-1" title={content.content || ''}>
                    {truncateContent(content.content)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Current platform: {content.platform || 'Not set'} • Type: {content.type || 'Not set'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date Picker */}
                  <div>
                    <Label className="text-white">Choose Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                            !schedule.date && "text-gray-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {schedule.date ? format(schedule.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                        <Calendar
                          mode="single"
                          selected={schedule.date}
                          onSelect={(date) => updateContentSchedule(content.id, 'date', date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div>
                    <Label className="text-white">Choose Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => updateContentSchedule(content.id, 'time', e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  {/* Platform Selector */}
                  <div>
                    <Label className="text-white">Select Platform</Label>
                    <Select 
                      value={schedule.platform} 
                      onValueChange={(value) => updateContentSchedule(content.id, 'platform', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {platforms.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value} className="text-white hover:bg-gray-700">
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Submit Schedule"
              )}
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleContentDialog