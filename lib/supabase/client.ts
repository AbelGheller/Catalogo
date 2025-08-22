import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return supabaseUrl !== 'https://your-project-id.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key-here' &&
         supabaseUrl.includes('supabase.co')
}

// Helper function to get configuration status
export function getSupabaseConfigStatus(): {
  configured: boolean
  message: string
} {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      message: 'Supabase não está configurado. Por favor, atualize as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local com suas credenciais reais do Supabase.'
    }
  }
  
  return {
    configured: true,
    message: 'Supabase configurado corretamente'
  }
}

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