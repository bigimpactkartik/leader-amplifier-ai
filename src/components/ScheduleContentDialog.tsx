import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useScheduledContent } from "@/hooks/useScheduledContent";
import { useUsers } from "@/hooks/useUsers";
import { Calendar as CalendarIcon, Clock, Loader2, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  isValid: boolean
}

const ScheduleContentDialog = ({ isOpen, onClose, selectedContent }: ScheduleContentDialogProps) => {
  const { scheduleMultipleContent } = useScheduledContent()
  const { currentUser } = useUsers()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contentSchedules, setContentSchedules] = useState<ContentSchedule[]>([])

  // Initialize or update schedule state when selectedContent changes
  useEffect(() => {
    if (selectedContent.length > 0) {
      const newSchedules = selectedContent.map(content => ({
        contentId: content.id,
        date: undefined,
        time: "09:00",
        isValid: false
      }))
      setContentSchedules(newSchedules)
    }
  }, [selectedContent])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setContentSchedules([])
      setIsSubmitting(false)
    }
  }, [isOpen])

  const updateContentSchedule = (contentId: number, field: keyof ContentSchedule, value: any) => {
    setContentSchedules(prev => prev.map(schedule => {
      if (schedule.contentId === contentId) {
        const updated = { ...schedule, [field]: value }
        
        // Validate the schedule - only check date and time now
        if (field === 'date' || field === 'time') {
          const isDateValid = (field === 'date' ? value : updated.date) && 
                             (field === 'date' ? value : updated.date) >= new Date().setHours(0, 0, 0, 0)
          const isTimeValid = (field === 'time' ? value : updated.time) !== ''
          
          updated.isValid = isDateValid && isTimeValid
        }
        
        return updated
      }
      return schedule
    }))
  }

  const handleSubmit = async () => {
    // Final validation
    const invalidSchedules = contentSchedules.filter(schedule => !schedule.isValid)
    
    if (invalidSchedules.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please complete all date and time selections",
        variant: "destructive"
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "No user logged in",
        variant: "destructive"
      })
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
      
      // Show success message
      toast({
        title: "Success!",
        description: `Successfully scheduled ${selectedContent.length} content item(s) for posting`,
      })
      
      onClose()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const truncateContent = (content: string | null, maxLength: number = 80) => {
    if (!content) return 'No content available'
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  const getStatusBadge = (schedule: ContentSchedule) => {
    if (schedule.isValid) {
      return (
        <Badge className="bg-green-600 text-white">
          <Check className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-600 text-white">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  const isFormValid = contentSchedules.length > 0 && contentSchedules.every(schedule => schedule.isValid)

  // Don't render if no content is selected
  if (selectedContent.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white text-xl">Schedule Content Posting</DialogTitle>
          <p className="text-gray-300 text-sm">
            Set the date and time for each selected content item ({selectedContent.length} items selected)
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {contentSchedules.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white mr-2" />
              <span className="text-white">Loading selected content...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white">Content Title/Description</TableHead>
                  <TableHead className="text-white">Date Picker</TableHead>
                  <TableHead className="text-white">Time Picker</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedContent.map((content) => {
                  const schedule = contentSchedules.find(s => s.contentId === content.id)
                  if (!schedule) return null

                  return (
                    <TableRow key={content.id} className="border-white/10">
                      {/* Content Title/Description */}
                      <TableCell className="text-white max-w-md">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Content #{content.id}</div>
                          <div 
                            className="text-gray-300 text-sm leading-relaxed"
                            title={content.content || ''}
                          >
                            {truncateContent(content.content)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            Platform: {content.platform || 'Not set'} • Type: {content.type || 'Not set'}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date Picker */}
                      <TableCell>
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
                              {schedule.date ? format(schedule.date, "MMM dd, yyyy") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                            <Calendar
                              mode="single"
                              selected={schedule.date}
                              onSelect={(date) => updateContentSchedule(content.id, 'date', date)}
                              disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                              initialFocus
                              className="text-white"
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      {/* Time Picker */}
                      <TableCell>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="time"
                            value={schedule.time}
                            onChange={(e) => updateContentSchedule(content.id, 'time', e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(schedule)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-white/10">
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
              <>
                Submit Schedule ({contentSchedules.filter(s => s.isValid).length}/{selectedContent.length} ready)
              </>
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
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleContentDialog