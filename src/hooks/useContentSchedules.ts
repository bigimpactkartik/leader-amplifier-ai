import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface ContentScheduleInfo {
  contentId: number
  schedules: Array<{
    id: number
    scheduled_at: string
    status: string
    posted_at: string | null
  }>
  hasSchedule: boolean
  nextSchedule: string | null
}

export function useContentSchedules() {
  const [contentSchedules, setContentSchedules] = useState<Map<number, ContentScheduleInfo>>(new Map())
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch schedules for specific content IDs
  const fetchContentSchedules = async (contentIds: number[]) => {
    if (contentIds.length === 0) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('scheduled_content')
        .select('*')
        .in('content_id', contentIds)
        .gte('scheduled_at', new Date().toISOString()) // Only future schedules
        .order('scheduled_at', { ascending: true })

      if (error) {
        throw error
      }

      // Group schedules by content_id
      const scheduleMap = new Map<number, ContentScheduleInfo>()
      
      // Initialize all content IDs
      contentIds.forEach(id => {
        scheduleMap.set(id, {
          contentId: id,
          schedules: [],
          hasSchedule: false,
          nextSchedule: null
        })
      })

      // Populate with actual schedule data
      data?.forEach(schedule => {
        const contentId = schedule.content_id!
        const existing = scheduleMap.get(contentId)
        
        if (existing) {
          existing.schedules.push({
            id: schedule.id,
            scheduled_at: schedule.scheduled_at!,
            status: schedule.status || 'pending',
            posted_at: schedule.posted_at
          })
          existing.hasSchedule = true
          if (!existing.nextSchedule) {
            existing.nextSchedule = schedule.scheduled_at!
          }
        }
      })

      setContentSchedules(scheduleMap)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content schedules'
      console.error('Error fetching content schedules:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Get schedule info for a specific content ID
  const getScheduleInfo = (contentId: number): ContentScheduleInfo => {
    return contentSchedules.get(contentId) || {
      contentId,
      schedules: [],
      hasSchedule: false,
      nextSchedule: null
    }
  }

  // Update a schedule
  const updateSchedule = async (scheduleId: number, newScheduledAt: string) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_content')
        .update({ scheduled_at: newScheduledAt })
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        // Update local state
        const contentId = data.content_id!
        const existing = contentSchedules.get(contentId)
        
        if (existing) {
          const updatedSchedules = existing.schedules.map(schedule =>
            schedule.id === scheduleId
              ? { ...schedule, scheduled_at: newScheduledAt }
              : schedule
          ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

          const updatedInfo: ContentScheduleInfo = {
            ...existing,
            schedules: updatedSchedules,
            nextSchedule: updatedSchedules[0]?.scheduled_at || null
          }

          setContentSchedules(prev => new Map(prev.set(contentId, updatedInfo)))
        }

        toast({
          title: "Success",
          description: "Schedule updated successfully"
        })

        return data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule'
      console.error('Error updating schedule:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  // Delete a schedule
  const deleteSchedule = async (scheduleId: number, contentId: number) => {
    try {
      const { error } = await supabase
        .from('scheduled_content')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        throw error
      }

      // Update local state
      const existing = contentSchedules.get(contentId)
      if (existing) {
        const updatedSchedules = existing.schedules.filter(schedule => schedule.id !== scheduleId)
        const updatedInfo: ContentScheduleInfo = {
          ...existing,
          schedules: updatedSchedules,
          hasSchedule: updatedSchedules.length > 0,
          nextSchedule: updatedSchedules[0]?.scheduled_at || null
        }

        setContentSchedules(prev => new Map(prev.set(contentId, updatedInfo)))
      }

      toast({
        title: "Success",
        description: "Schedule deleted successfully"
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule'
      console.error('Error deleting schedule:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  return {
    contentSchedules,
    loading,
    fetchContentSchedules,
    getScheduleInfo,
    updateSchedule,
    deleteSchedule
  }
}