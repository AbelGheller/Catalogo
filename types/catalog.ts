export interface CatalogItem {
  id: string
  code?: string
  name: string
  level: 'Equipamento' | 'Conjunto' | 'Parte' | 'Peça' | 'Kit'
  context: Record<string, any>
  attributes: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface CatalogTag {
  id: string
  name: string
  kind: string
}

export interface AuditLog {
  id: string
  item_code?: string
  action: string
  payload: Record<string, any>
  status: string
  message?: string
  created_at: string
}

export interface CatalogResponse {
  status: 'success' | 'error'
  message: string
  data: CatalogItem[] | null
  warnings?: string[]
}

export interface CatalogFilters {
  query?: string
  tag?: string
  level?: 'Equipamento' | 'Conjunto' | 'Parte' | 'Peça' | 'Kit'
  hasParent?: boolean
  hasChildren?: boolean
}

export interface ImportResult {
  success: number
  errors: Array<{ row: number; error: string }>
  warnings: string[]
}

export interface CsvRow {
  code?: string
  name: string
  level?: string
  tags?: string
  parent_code?: string
  is_kit?: string
  context?: string
  attributes?: string
}

// Constantes para validação
export const CATALOG_LEVELS = [
  'Equipamento',
  'Conjunto', 
  'Parte',
  'Peça',
  'Kit'
] as const

export const CONTAINMENT_MATRIX: Record<string, string[]> = {
  'Equipamento': ['Conjunto', 'Parte', 'Kit'],
  'Conjunto': ['Parte', 'Peça', 'Kit'],
  'Parte': ['Peça', 'Kit'],
  'Kit': ['Peça', 'Parte'],
  'Peça': []
}

// Mapeamento para inferência de níveis
export const LEVEL_INFERENCE_RULES = {
  kit: 'Kit',
  peças: ['pistão', 'cabeçote', 'virabrequim', 'bomba', 'bico', 'anel', 'junta', 'parafuso', 'porca', 'arruela'],
  partes: ['trem de força', 'chassis', 'transmissão', 'diferencial', 'eixo'],
  equipamentos: ['máquina', 'empilhadeira', 'escavadeira', 'pá-carregadeira', 'trator', 'rolo', 'guindaste', 'retroescavadeira'],
  conjuntos: ['conjunto', 'sistema', 'módulo']
}

// Tags especiais que afetam classificação
export const SPECIAL_TAGS = {
  naval: 'naval',
  motor: 'motor'
}