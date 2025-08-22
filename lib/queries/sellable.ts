import { supabase } from '@/lib/supabase/client'
import { Sellable } from '@/types'

export async function getSellables() {
  const { data, error } = await supabase
    .from('sellable')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Enriquecer com dados dos itens referenciados
  const enrichedData = await Promise.all(
    data.map(async (sellable) => {
      let itemData = null
      
      if (sellable.tipo === 'EQUIPMENT') {
        const { data: equipment } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', sellable.ref_id)
          .single()
        itemData = { equipment }
      } else if (sellable.tipo === 'ASSEMBLY') {
        const { data: assembly } = await supabase
          .from('assembly')
          .select(`*, equipment:equipment_id (*)`)
          .eq('id', sellable.ref_id)
          .single()
        itemData = { assembly }
      } else if (sellable.tipo === 'PART') {
        const { data: part } = await supabase
          .from('part')
          .select(`*, equipment:equipment_id (*), assembly:assembly_id (*)`)
          .eq('id', sellable.ref_id)
          .single()
        itemData = { part }
      }

      return { ...sellable, ...itemData }
    })
  )

  return enrichedData as Sellable[]
}