import { supabase } from '@/lib/supabase/client'
import { Part, PartCompatibility, PartSubstitution } from '@/types'

export async function getParts() {
  const { data, error } = await supabase
    .from('part')
    .select(`
      *,
      equipment:equipment_id (*),
      assembly:assembly_id (*, equipment:equipment_id (*))
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Part[]
}

export async function getPartById(id: string) {
  const { data, error } = await supabase
    .from('part')
    .select(`
      *,
      equipment:equipment_id (*),
      assembly:assembly_id (*, equipment:equipment_id (*))
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Part
}

export async function getPartsByFilters(filters: {
  equipmentIds?: string[]
  assemblyIds?: string[]
  sku?: string
}) {
  let query = supabase.from('part').select(`
    *,
    equipment:equipment_id (*),
    assembly:assembly_id (*, equipment:equipment_id (*))
  `)

  if (filters.equipmentIds && filters.equipmentIds.length > 0) {
    query = query.in('equipment_id', filters.equipmentIds)
  }

  if (filters.assemblyIds && filters.assemblyIds.length > 0) {
    query = query.in('assembly_id', filters.assemblyIds)
  }

  if (filters.sku) {
    query = query.ilike('sku', `%${filters.sku}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data as Part[]
}

export async function getPartCompatibilities(partId: string) {
  const { data, error } = await supabase
    .from('part_compatibility')
    .select(`
      *,
      equipment:equipment_id (*),
      assembly:assembly_id (*, equipment:equipment_id (*))
    `)
    .eq('part_id', partId)

  if (error) throw error
  return data as PartCompatibility[]
}

export async function getPartSubstitutions(partId: string) {
  const { data, error } = await supabase
    .from('part_substitution')
    .select(`
      *,
      partA:part_a (*),
      partB:part_b (*)
    `)
    .or(`part_a.eq.${partId},part_b.eq.${partId}`)

  if (error) throw error
  return data as PartSubstitution[]
}