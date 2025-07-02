import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: number
          created_at: string
          user_id: number | null
          content: string | null
          priority_score: number | null
          used_at: string | null
          status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id?: number | null
          content?: string | null
          priority_score?: number | null
          used_at?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: number | null
          content?: string | null
          priority_score?: number | null
          used_at?: string | null
          status?: string | null
        }
      }
      users: {
        Row: {
          id: number
          created_at: string
          name: string | null
          email: string | null
          domain: string | null
          linkedin_url: string | null
          facebook_url: string | null
          instagram_url: string | null
          twitter_url: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          email?: string | null
          domain?: string | null
          linkedin_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          email?: string | null
          domain?: string | null
          linkedin_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
        }
      }
      contents: {
        Row: {
          id: number
          created_at: string
          user_id: number | null
          idea_id: number | null
          platform: string | null
          type: string | null
          content_url: string | null
          status: string | null
          content: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id?: number | null
          idea_id?: number | null
          platform?: string | null
          type?: string | null
          content_url?: string | null
          status?: string | null
          content?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: number | null
          idea_id?: number | null
          platform?: string | null
          type?: string | null
          content_url?: string | null
          status?: string | null
          content?: string | null
        }
      }
      sources: {
        Row: {
          id: number
          created_at: string
          user_id: number | null
          source_type: string | null
          description: string | null
          url: string | null
          key: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id?: number | null
          source_type?: string | null
          description?: string | null
          url?: string | null
          key?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: number | null
          source_type?: string | null
          description?: string | null
          url?: string | null
          key?: string | null
        }
      }
      idea_generation_prompt: {
        Row: {
          id: number
          created_at: string
          name: string | null
          prompt: string | null
          status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          prompt?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          prompt?: string | null
          status?: string | null
        }
      }
      cotent_generation_prompt: {
        Row: {
          id: number
          created_at: string
          name: string | null
          prompt: string | null
          status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          prompt?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          prompt?: string | null
          status?: string | null
        }
      }
    }
  }
}

export type Idea = Database['public']['Tables']['ideas']['Row']
export type IdeaInsert = Database['public']['Tables']['ideas']['Insert']
export type IdeaUpdate = Database['public']['Tables']['ideas']['Update']

export type Content = Database['public']['Tables']['contents']['Row']
export type ContentInsert = Database['public']['Tables']['contents']['Insert']
export type ContentUpdate = Database['public']['Tables']['contents']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Source = Database['public']['Tables']['sources']['Row']
export type SourceInsert = Database['public']['Tables']['sources']['Insert']
export type SourceUpdate = Database['public']['Tables']['sources']['Update']

export type IdeaGenerationPrompt = Database['public']['Tables']['idea_generation_prompt']['Row']
export type IdeaGenerationPromptInsert = Database['public']['Tables']['idea_generation_prompt']['Insert']
export type IdeaGenerationPromptUpdate = Database['public']['Tables']['idea_generation_prompt']['Update']

export type ContentGenerationPrompt = Database['public']['Tables']['cotent_generation_prompt']['Row']
export type ContentGenerationPromptInsert = Database['public']['Tables']['cotent_generation_prompt']['Insert']
export type ContentGenerationPromptUpdate = Database['public']['Tables']['cotent_generation_prompt']['Update']

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connection successful')
    return true
  } catch (err) {
    console.error('Supabase connection failed:', err)
    return false
  }
}