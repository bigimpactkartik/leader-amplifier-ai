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
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all scheduled content
  const fetchScheduledContent = async () => {
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

      setScheduledContent(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scheduled content'
      setError(errorMessage)
      console.error('Error fetching scheduled content:', err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Schedule content
  const scheduleContent = async (contentData: ScheduledContentInsert) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_content')
        .insert([{
          ...contentData,
          status: contentData.status || 'pending'
        }])
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setScheduledContent(prev => [...prev, data])
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

  // Schedule multiple content items
  const scheduleMultipleContent = async (contentItems: ScheduledContentInsert[]) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_content')
        .insert(contentItems.map(item => ({
          ...item,
          status: item.status || 'pending'
        })))
        .select()

      if (error) {
        throw error
      }

      if (data) {
        setScheduledContent(prev => [...prev, ...data])
        return data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule content'
      console.error('Error scheduling multiple content:', err)
      toast({
        title: "Error",
        description: "Something went wrong while scheduling. Please try again.",
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
        setScheduledContent(prev => prev.map(item => item.id === id ? data : item))
        toast({
          title: "Success",
          description: "Scheduled content updated successfully"
        })
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

      setScheduledContent(prev => prev.filter(item => item.id !== id))
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

  // Load scheduled content on mount
  useEffect(() => {
    fetchScheduledContent()
  }, [])

  return {
    scheduledContent,
    loading,
    error,
    fetchScheduledContent,
    scheduleContent,
    scheduleMultipleContent,
    updateScheduledContent,
    deleteScheduledContent
  }
}