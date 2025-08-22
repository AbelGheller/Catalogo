import { supabase } from '@/lib/supabase/client'
import { Assembly } from '@/types'

export async function getAssemblies() {
  const { data, error } = await supabase
    .from('assembly')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Assembly[]
}

export async function getAssemblyById(id: string) {
  const { data, error } = await supabase
    .from('assembly')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Assembly
}

export async function getAssembliesByEquipmentId(equipmentId: string) {
  const { data, error } = await supabase
    .from('assembly')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Assembly[]
}

export async function getAssembliesByFilters(filters: {
  equipmentIds?: string[]
  motorMarca?: string
  bombaInjetoraMarca?: string
}) {
  let query = supabase.from('assembly').select(`
    *,
    equipment:equipment_id (*)
  `)

  if (filters.equipmentIds && filters.equipmentIds.length > 0) {
    query = query.in('equipment_id', filters.equipmentIds)
  }

  if (filters.motorMarca) {
    query = query.eq('tipo', 'MOTOR').ilike('marca', `%${filters.motorMarca}%`)
  }

  if (filters.bombaInjetoraMarca) {
    query = query.eq('tipo', 'BOMBA_INJETORA').ilike('marca', `%${filters.bombaInjetoraMarca}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data as Assembly[]
}

export async function getDistinctAssemblyValues() {
  const [motorMarcasRes, bombaMarcasRes] = await Promise.all([
    supabase.from('assembly').select('marca').eq('tipo', 'MOTOR'),
    supabase.from('assembly').select('marca').eq('tipo', 'BOMBA_INJETORA'),
  ])

  return {
    motorMarcas: [...new Set(motorMarcasRes.data?.map(item => item.marca) || [])].sort(),
    bombaMarcas: [...new Set(bombaMarcasRes.data?.map(item => item.marca) || [])].sort(),
  }
}