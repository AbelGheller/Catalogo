export interface Equipment {
  id: string
  tipo: string
  marca: string
  modelo: string
  ano?: number
  serie?: string
  created_at: string
}

export interface Assembly {
  id: string
  equipment_id: string
  tipo: 'MOTOR' | 'BOMBA_INJETORA' | 'OUTRO'
  marca: string
  modelo: string
  ano?: number
  serie?: string
  created_at: string
  equipment?: Equipment
}

export interface Part {
  id: string
  nome: string
  sku: string
  marca: string
  notas?: string
  equipment_id?: string
  assembly_id?: string
  created_at: string
  equipment?: Equipment
  assembly?: Assembly
}

export interface PartCompatibility {
  id: string
  part_id: string
  equipment_id?: string
  assembly_id?: string
  created_at: string
  equipment?: Equipment
  assembly?: Assembly
}

export interface PartSubstitution {
  id: string
  part_a: string
  part_b: string
  created_at: string
  partA?: Part
  partB?: Part
}

export interface Sellable {
  id: string
  tipo: 'EQUIPMENT' | 'ASSEMBLY' | 'PART'
  ref_id: string
  preco: number
  created_at: string
  equipment?: Equipment
  assembly?: Assembly
  part?: Part
}

export interface CatalogFilters {
  equipmentMarca?: string
  equipmentModelo?: string
  equipmentTipo?: string
  equipmentAno?: string
  motorMarca?: string
  bombaInjetoraMarca?: string
  sku?: string
}