import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date
  onDateTimeChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({
  date,
  onDateTimeChange,
  placeholder = "Pick a date and time",
  className
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "09:00"
  )

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      onDateTimeChange?.(undefined)
      return
    }

    // Combine the selected date with the current time
    const [hours, minutes] = timeValue.split(':').map(Number)
    const combinedDateTime = new Date(newDate)
    combinedDateTime.setHours(hours, minutes, 0, 0)
    
    setSelectedDate(combinedDateTime)
    onDateTimeChange?.(combinedDateTime)
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    
    if (!selectedDate) return

    const [hours, minutes] = newTime.split(':').map(Number)
    const newDateTime = new Date(selectedDate)
    newDateTime.setHours(hours, minutes, 0, 0)
    
    setSelectedDate(newDateTime)
    onDateTimeChange?.(newDateTime)
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="time" className="text-sm">Time:</Label>
        <Input
          id="time"
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-32"
        />
      </div>
    </div>
  )
}