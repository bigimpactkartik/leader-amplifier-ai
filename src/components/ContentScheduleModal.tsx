import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useContentSchedules, type ContentScheduleInfo } from "@/hooks/useContentSchedules";
import { Calendar as CalendarIcon, Clock, Loader2, Trash2, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ContentScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: number
  contentTitle: string
  scheduleInfo: ContentScheduleInfo
  onScheduleUpdated: () => void
}

interface EditingSchedule {
  id: number
  date: Date | undefined
  time: string
}

const ContentScheduleModal = ({ 
  isOpen, 
  onClose, 
  contentId, 
  contentTitle, 
  scheduleInfo,
  onScheduleUpdated 
}: ContentScheduleModalProps) => {
  const { updateSchedule, deleteSchedule } = useContentSchedules()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<EditingSchedule | null>(null)

  // Reset editing state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEditingSchedule(null)
    }
  }, [isOpen])

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, "MMM dd, yyyy"),
      time: format(date, "HH:mm"),
      full: format(date, "MMM dd, yyyy 'at' HH:mm")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600 text-white'
      case 'posted': return 'bg-green-600 text-white'
      case 'failed': return 'bg-red-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const handleEditSchedule = (schedule: any) => {
    const scheduleDate = new Date(schedule.scheduled_at)
    setEditingSchedule({
      id: schedule.id,
      date: scheduleDate,
      time: format(scheduleDate, "HH:mm")
    })
  }

  const handleSaveSchedule = async () => {
    if (!editingSchedule || !editingSchedule.date) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive"
      })
      return
    }

    // Combine date and time
    const scheduledDateTime = new Date(editingSchedule.date)
    const [hours, minutes] = editingSchedule.time.split(':').map(Number)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    // Validate future date
    if (scheduledDateTime <= new Date()) {
      toast({
        title: "Error",
        description: "Scheduled time must be in the future",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      await updateSchedule(editingSchedule.id, scheduledDateTime.toISOString())
      setEditingSchedule(null)
      onScheduleUpdated()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    setIsUpdating(true)
    try {
      await deleteSchedule(scheduleId, contentId)
      onScheduleUpdated()
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingSchedule(null)
  }

  const truncateTitle = (title: string, maxLength: number = 60) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Content Schedule Details</DialogTitle>
          <p className="text-gray-300 text-sm">
            {truncateTitle(contentTitle)}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {scheduleInfo.schedules.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No schedules found for this content</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-white font-medium">Scheduled Posts ({scheduleInfo.schedules.length})</h3>
              
              {scheduleInfo.schedules.map((schedule) => (
                <div key={schedule.id} className="p-4 bg-white/5 border border-white/20 rounded-lg">
                  {editingSchedule?.id === schedule.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                                  !editingSchedule.date && "text-gray-400"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editingSchedule.date ? format(editingSchedule.date, "MMM dd, yyyy") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                              <Calendar
                                mode="single"
                                selected={editingSchedule.date}
                                onSelect={(date) => setEditingSchedule(prev => prev ? { ...prev, date } : null)}
                                disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                                initialFocus
                                className="text-white"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label className="text-white">Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="time"
                              value={editingSchedule.time}
                              onChange={(e) => setEditingSchedule(prev => prev ? { ...prev, time: e.target.value } : null)}
                              className="pl-10 bg-white/10 border-white/20 text-white"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveSchedule}
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
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
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-white">
                            {formatScheduleDate(schedule.scheduled_at).full}
                          </span>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                        {schedule.posted_at && (
                          <div className="text-sm text-gray-400">
                            Posted: {formatScheduleDate(schedule.posted_at).full}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSchedule(schedule)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={isUpdating}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={onClose}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ContentScheduleModal