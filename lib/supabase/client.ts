import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

// Create a function to get the Supabase client with proper validation
function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
    throw new Error('Missing or invalid env.NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file and replace the placeholder values with your actual Supabase project credentials.')
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
    throw new Error('Missing or invalid env.NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file and replace the placeholder values with your actual Supabase project credentials.')
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Export a proxy object that creates the client only when methods are called
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof typeof client]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

export type Database = {
  public: {
    Tables: {
      equipment: {
        Row: {
          id: string
          tipo: string
          marca: string
          modelo: string
          ano: number | null
          serie: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo: string
          marca: string
          modelo: string
          ano?: number | null
          serie?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: string
          marca?: string
          modelo?: string
          ano?: number | null
          serie?: string | null
          created_at?: string
        }
      }
      assembly: {
        Row: {
          id: string
          equipment_id: string
          tipo: 'MOTOR' | 'BOMBA_INJETORA' | 'OUTRO'
          marca: string
          modelo: string
          ano: number | null
          serie: string | null
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          tipo: 'MOTOR' | 'BOMBA_INJETORA' | 'OUTRO'
          marca: string
          modelo: string
          ano?: number | null
          serie?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          tipo?: 'MOTOR' | 'BOMBA_INJETORA' | 'OUTRO'
          marca?: string
          modelo?: string
          ano?: number | null
          serie?: string | null
          created_at?: string
        }
      }
      part: {
        Row: {
          id: string
          nome: string
          sku: string
          marca: string
          notas: string | null
          equipment_id: string | null
          assembly_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          sku: string
          marca: string
          notas?: string | null
          equipment_id?: string | null
          assembly_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          sku?: string
          marca?: string
          notas?: string | null
          equipment_id?: string | null
          assembly_id?: string | null
          created_at?: string
        }
      }
      part_compatibility: {
        Row: {
          id: string
          part_id: string
          equipment_id: string | null
          assembly_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          part_id: string
          equipment_id?: string | null
          assembly_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          part_id?: string
          equipment_id?: string | null
          assembly_id?: string | null
          created_at?: string
        }
      }
      part_substitution: {
        Row: {
          id: string
          part_a: string
          part_b: string
          created_at: string
        }
        Insert: {
          id?: string
          part_a: string
          part_b: string
          created_at?: string
        }
        Update: {
          id?: string
          part_a?: string
          part_b?: string
          created_at?: string
        }
      }
      sellable: {
        Row: {
          id: string
          tipo: 'EQUIPMENT' | 'ASSEMBLY' | 'PART'
          ref_id: string
          preco: number
          created_at: string
        }
        Insert: {
          id?: string
          tipo: 'EQUIPMENT' | 'ASSEMBLY' | 'PART'
          ref_id: string
          preco: number
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: 'EQUIPMENT' | 'ASSEMBLY' | 'PART'
          ref_id?: string
          preco?: number
          created_at?: string
        }
      }
    }
  }
}