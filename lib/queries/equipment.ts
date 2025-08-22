import { supabase } from '@/lib/supabase/client'
import { Equipment } from '@/types'

export async function getEquipments() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Equipment[]
}

export async function getEquipmentById(id: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Equipment
}

export async function getEquipmentsByFilters(filters: {
  marca?: string
  modelo?: string
  tipo?: string
  ano?: string
}) {
  let query = supabase.from('equipment').select('*')

  if (filters.marca) {
    query = query.ilike('marca', `%${filters.marca}%`)
  }
  if (filters.modelo) {
    query = query.ilike('modelo', `%${filters.modelo}%`)
  }
  if (filters.tipo) {
    query = query.ilike('tipo', `%${filters.tipo}%`)
  }
  if (filters.ano) {
    query = query.eq('ano', parseInt(filters.ano))
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data as Equipment[]
}

export async function getDistinctEquipmentValues() {
  const [marcasRes, modelosRes, tiposRes, anosRes] = await Promise.all([
    supabase.from('equipment').select('marca').not('marca', 'is', null),
    supabase.from('equipment').select('modelo').not('modelo', 'is', null),
    supabase.from('equipment').select('tipo').not('tipo', 'is', null),
    supabase.from('equipment').select('ano').not('ano', 'is', null),
  ])

  return {
    marcas: [...new Set(marcasRes.data?.map(item => item.marca) || [])].sort(),
    modelos: [...new Set(modelosRes.data?.map(item => item.modelo) || [])].sort(),
    tipos: [...new Set(tiposRes.data?.map(item => item.tipo) || [])].sort(),
    anos: [...new Set(anosRes.data?.map(item => item.ano?.toString()) || [])].sort(),
  }
}