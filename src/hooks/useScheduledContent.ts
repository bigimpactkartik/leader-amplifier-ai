import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface ScheduledContent {
  id: number
  created_at: string
  user_id: number | null
  content_id: number | null
  status: string | null
  scheduled_at: string | null
  posted_at: string | null
}

export interface ScheduledContentInsert {
  user_id?: number | null
  content_id?: number | null
  status?: string | null
  scheduled_at?: string | null
  posted_at?: string | null
}

export interface ScheduledContentUpdate {
  user_id?: number | null
  content_id?: number | null
  status?: string | null
  scheduled_at?: string | null
  posted_at?: string | null
}

export function useScheduledContent() {
  const [scheduledContents, setScheduledContents] = useState<ScheduledContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all scheduled contents
  const fetchScheduledContents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('scheduled_content')
        .select('*')
        .order('scheduled_at', { ascending: true })

      if (error) {
        throw error
      }

      setScheduledContents(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scheduled contents'
      setError(errorMessage)
      console.error('Error fetching scheduled contents:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create new scheduled content
  const createScheduledContent = async (scheduledData: ScheduledContentInsert) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_content')
        .insert([{
          ...scheduledData,
          status: scheduledData.status || 'pending'
        }])
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setScheduledContents(prev => [...prev, data])
        return data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule content'
      console.error('Error scheduling content:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  // Update scheduled content
  const updateScheduledContent = async (id: number, updates: ScheduledContentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setScheduledContents(prev => prev.map(item => item.id === id ? data : item))
        return data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scheduled content'
      console.error('Error updating scheduled content:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  // Delete scheduled content
  const deleteScheduledContent = async (id: number) => {
    try {
      const { error } = await supabase
        .from('scheduled_content')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setScheduledContents(prev => prev.filter(item => item.id !== id))
      toast({
        title: "Success",
        description: "Scheduled content deleted successfully"
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scheduled content'
      console.error('Error deleting scheduled content:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  // Schedule multiple content items
  const scheduleMultipleContent = async (scheduleData: Array<{
    contentId: number
    platform: string
    scheduledAt: string
    userId: number
  }>) => {
    try {
      const insertData = scheduleData.map(item => ({
        user_id: item.userId,
        content_id: item.contentId,
        scheduled_at: item.scheduledAt,
        status: 'pending'
      }))

      const { data, error } = await supabase
        .from('scheduled_content')
        .insert(insertData)
        .select()

      if (error) {
        throw error
      }

      if (data) {
        setScheduledContents(prev => [...prev, ...data])
        toast({
          title: "Success",
          description: `Successfully scheduled ${data.length} content items`
        })
        return data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule content'
      console.error('Error scheduling multiple content:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  // Load scheduled contents on mount
  useEffect(() => {
    fetchScheduledContents()
  }, [])

  return {
    scheduledContents,
    loading,
    error,
    fetchScheduledContents,
    createScheduledContent,
    updateScheduledContent,
    deleteScheduledContent,
    scheduleMultipleContent
  }
}