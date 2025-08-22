import { supabase } from './client'

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

export interface CatalogRelation {
  parent_id: string
  child_id: string
  relation: string
  created_at: string
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
  data: any
  warnings?: string[]
}

// RPC: Criar ou atualizar item
export async function createOrUpdateItem(payload: {
  code?: string
  name: string
  level?: string
  is_kit?: boolean
  context?: Record<string, any>
  attributes?: Record<string, any>
  tags?: string[]
}): Promise<CatalogResponse> {
  const { data, error } = await supabase.rpc('create_or_update_item', { payload })
  
  if (error) {
    console.error('Erro ao criar/atualizar item:', error)
    return {
      status: 'error',
      message: error.message,
      data: null
    }
  }
  
  return data as CatalogResponse
}

// RPC: Anexar filho (criar relacionamento)
export async function attachChild(
  parentCode: string,
  childCode: string,
  relation: string = 'contains'
): Promise<CatalogResponse> {
  const { data, error } = await supabase.rpc('attach_child', {
    parent_code: parentCode,
    child_code: childCode,
    relation
  })
  
  if (error) {
    console.error('Erro ao anexar filho:', error)
    return {
      status: 'error',
      message: error.message,
      data: null
    }
  }
  
  return data as CatalogResponse
}

// RPC: Buscar itens
export async function searchItems(
  query?: string,
  tag?: string,
  level?: string
): Promise<CatalogResponse> {
  const { data, error } = await supabase.rpc('search_items', {
    q: query,
    tag,
    level
  })
  
  if (error) {
    console.error('Erro ao buscar itens:', error)
    return {
      status: 'error',
      message: error.message,
      data: null
    }
  }
  
  return data as CatalogResponse
}

// RPC: Deletar item
export async function deleteItem(
  code: string,
  cascade: boolean = false
): Promise<CatalogResponse> {
  const { data, error } = await supabase.rpc('delete_item', {
    item_code: code,
    cascade_delete: cascade
  })
  
  if (error) {
    console.error('Erro ao deletar item:', error)
    return {
      status: 'error',
      message: error.message,
      data: null
    }
  }
  
  return data as CatalogResponse
}

// RPC: Re-tagar item
export async function retagItem(
  code: string,
  tags: string[]
): Promise<CatalogResponse> {
  const { data, error } = await supabase.rpc('retag_item', {
    item_code: code,
    new_tags: tags
  })
  
  if (error) {
    console.error('Erro ao re-tagar item:', error)
    return {
      status: 'error',
      message: error.message,
      data: null
    }
  }
  
  return data as CatalogResponse
}

// RPC: Mover item
export async function moveItem(
  childCode: string,
  fromParentCode: string,
  toParentCode: string
): Promise<CatalogResponse> {
  const { data, error } = await supabase.rpc('move_item', {
    child_code: childCode,
    from_parent_code: fromParentCode,
    to_parent_code: toParentCode
  })
  
  if (error) {
    console.error('Erro ao mover item:', error)
    return {
      status: 'error',
      message: error.message,
      data: null
    }
  }
  
  return data as CatalogResponse
}

// Buscar todas as tags
export async function getAllTags(): Promise<CatalogTag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Erro ao buscar tags:', error)
    return []
  }
  
  return data as CatalogTag[]
}

// Buscar relacionamentos de um item
export async function getItemRelations(itemId: string): Promise<{
  parents: CatalogItem[]
  children: CatalogItem[]
}> {
  const [parentsRes, childrenRes] = await Promise.all([
    // Buscar pais
    supabase
      .from('item_relations')
      .select(`
        parent:parent_id (
          id, code, name, level, context, attributes, created_at, updated_at
        )
      `)
      .eq('child_id', itemId),
    
    // Buscar filhos
    supabase
      .from('item_relations')
      .select(`
        child:child_id (
          id, code, name, level, context, attributes, created_at, updated_at
        )
      `)
      .eq('parent_id', itemId)
  ])
  
  const parents = parentsRes.data?.map(r => r.parent).filter(Boolean) || []
  const children = childrenRes.data?.map(r => r.child).filter(Boolean) || []
  
  return { parents, children }
}

// Buscar logs de auditoria
export async function getAuditLogs(
  itemCode?: string,
  limit: number = 100
): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (itemCode) {
    query = query.eq('item_code', itemCode)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Erro ao buscar logs:', error)
    return []
  }
  
  return data as AuditLog[]
}

// Importar itens de CSV
export async function importCsvItems(csvData: string): Promise<{
  success: number
  errors: Array<{ row: number; error: string }>
  warnings: string[]
}> {
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  const results = {
    success: 0,
    errors: [] as Array<{ row: number; error: string }>,
    warnings: [] as string[]
  }
  
  // Processar cada linha (pular cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    
    // Mapear valores para colunas
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    try {
      // Preparar payload do item
      const payload: any = {
        code: row.code || undefined,
        name: row.name,
        level: row.level || undefined,
        is_kit: row.is_kit === 'true' || row.is_kit === '1',
        context: row.context ? JSON.parse(row.context) : {},
        attributes: row.attributes ? JSON.parse(row.attributes) : {},
        tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : []
      }
      
      // Criar/atualizar item
      const itemResult = await createOrUpdateItem(payload)
      
      if (itemResult.status === 'error') {
        results.errors.push({ row: i + 1, error: itemResult.message })
        continue
      }
      
      results.success++
      
      // Se tem parent_code, criar relacionamento
      if (row.parent_code && row.code) {
        const relationResult = await attachChild(row.parent_code, row.code)
        
        if (relationResult.status === 'error') {
          results.warnings.push(`Linha ${i + 1}: Erro ao criar relacionamento - ${relationResult.message}`)
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      results.errors.push({ row: i + 1, error: errorMessage })
    }
  }
  
  return results
}

// Exportar itens para CSV
export async function exportItemsToCsv(): Promise<string> {
  const searchResult = await searchItems()
  
  if (searchResult.status === 'error' || !searchResult.data) {
    throw new Error('Erro ao buscar itens para exportação')
  }
  
  const items = searchResult.data as CatalogItem[]
  
  // Cabeçalho CSV
  const headers = ['code', 'name', 'level', 'tags', 'context', 'attributes', 'created_at', 'updated_at']
  
  // Linhas de dados
  const rows = items.map(item => [
    item.code || '',
    item.name,
    item.level,
    (item.tags || []).join(';'),
    JSON.stringify(item.context),
    JSON.stringify(item.attributes),
    item.created_at,
    item.updated_at
  ])
  
  // Montar CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csvContent
}