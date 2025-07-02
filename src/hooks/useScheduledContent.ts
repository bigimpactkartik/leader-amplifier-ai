import { useState, useEffect } from 'react'
import { supabase, type ScheduledContent, type ScheduledContentInsert, type ScheduledContentUpdate } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
        .order('created_at', { ascending: false })

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

  // Schedule content for posting
  const scheduleContent = async (contentIds: number[], userId: number) => {
    try {
      const scheduledItems: ScheduledContentInsert[] = contentIds.map(contentId => ({
        user_id: userId,
        content_id: contentId,
        status: 'pending'
      }))

      const { data, error } = await supabase
        .from('scheduled_content')
        .insert(scheduledItems)
        .select()

      if (error) {
        throw error
      }

      if (data) {
        setScheduledContent(prev => [...data, ...prev])
        toast({
          title: "Success",
          description: "Selected content scheduled successfully for posting."
        })
        return data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong while scheduling. Please try again.'
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
    updateScheduledContent,
    deleteScheduledContent
  }
}