import { supabase } from '@/lib/supabase/client'
import { CatalogItem, CatalogTag, AuditLog, CatalogResponse } from '@/types/catalog'

// Função para buscar itens
export async function searchItems(query?: string, tag?: string, level?: string): Promise<CatalogResponse> {
  try {
    const { data, error } = await supabase.rpc('rpc_search_items', {
      q: query || '',
      tag: tag || '',
      level: level || ''
    })

    if (error) throw error
    return {
      status: 'success',
      message: 'Busca realizada com sucesso',
      data: data || []
    }
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: []
    }
  }
}

// Função para criar ou atualizar item
export async function createOrUpdateItem(payload: {
  code?: string
  name: string
  level?: string
  is_kit?: boolean
  context?: Record<string, any>
  attributes?: Record<string, any>
  tags?: string[]
}): Promise<CatalogResponse> {
  try {
    const { data, error } = await supabase.rpc('rpc_create_or_update_item', {
      payload: payload
    })

    if (error) throw error
    return data as CatalogResponse
  } catch (error) {
    console.error('Erro ao criar/atualizar item:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    }
  }
}

// Função para anexar filho (criar relacionamento)
export async function attachChild(parentCode: string, childCode: string, relation: string = 'contains'): Promise<CatalogResponse> {
  try {
    const { data, error } = await supabase.rpc('rpc_attach_child_auto', {
      parent_code: parentCode,
      child_code: childCode,
      p_relation: relation
    })

    if (error) throw error
    return data as CatalogResponse
  } catch (error) {
    console.error('Erro ao anexar filho:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    }
  }
}

// Função para deletar item
export async function deleteItem(code: string, cascade: boolean = false): Promise<CatalogResponse> {
  try {
    const { data, error } = await supabase.rpc('rpc_delete_item', {
      item_code: code,
      cascade_delete: cascade
    })

    if (error) throw error
    return data as CatalogResponse
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    }
  }
}

// Função para importar CSV
export async function importCsvItems(csvData: string): Promise<CatalogResponse> {
  try {
    const { data, error } = await supabase.rpc('rpc_import_csv_items', {
      csv_data: csvData
    })

    if (error) throw error
    return data as CatalogResponse
  } catch (error) {
    console.error('Erro ao importar CSV:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    }
  }
}

// Função para obter todas as tags
export async function getAllTags(): Promise<CatalogTag[]> {
  try {
    const { data, error } = await supabase
      .from('item_tags')
      .select('id, tag')
      .order('name')

    if (error) throw error
    return (data || []).map(item => ({ id: item.id, name: item.tag }))
  } catch (error) {
    console.error('Erro ao buscar tags:', error)
    return []
  }
}

// Função para obter logs de auditoria
export async function getAuditLogs(itemCode?: string, limit: number = 100): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemCode) {
      query = query.eq('item_code', itemCode)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return []
  }
}

// Função para validar dados CSV
export async function validateCsvData(csvData: string): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
  preview: any[]
}> {
  const lines = csvData.trim().split('\n')
  const errors: string[] = []
  const warnings: string[] = []
  const preview: any[] = []

  if (lines.length === 0) {
    errors.push('CSV vazio')
    return { valid: false, errors, warnings, preview }
  }

  // Verificar cabeçalho
  const header = lines[0]
  const expectedColumns = ['code', 'name', 'level', 'tags', 'parent_code', 'is_kit', 'context', 'attributes']
  
  if (!header.includes('name')) {
    errors.push('Coluna "name" é obrigatória')
  }

  // Processar primeiras 5 linhas para preview
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    const fields = lines[i].split(',')
    if (fields.length >= 2) {
      preview.push({
        code: fields[0]?.trim() || '',
        name: fields[1]?.trim() || '',
        level: fields[2]?.trim() || '',
        tags: fields[3]?.trim() || ''
      })
    }
  }

  // Validações básicas
  if (lines.length === 1) {
    warnings.push('Apenas cabeçalho encontrado, nenhum dado para importar')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    preview
  }
}

// Função para exportar itens para CSV
export async function exportItemsToCsv(): Promise<string> {
  try {
    const result = await searchItems()
    
    if (result.status !== 'success' || !result.data) {
      throw new Error('Erro ao buscar itens para exportação')
    }

    const items = result.data as CatalogItem[]
    
    // Cabeçalho CSV
    const header = 'code,name,level,tags,context,attributes\n'
    
    // Linhas de dados
    const rows = items.map(item => {
      const tags = (item.tags || []).join(';')
      const context = JSON.stringify(item.context || {})
      const attributes = JSON.stringify(item.attributes || {})
      
      return `"${item.code || ''}","${item.name}","${item.level}","${tags}","${context}","${attributes}"`
    }).join('\n')
    
    return header + rows
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    throw error
  }
}

// Função para obter hierarquia de um item
export async function getItemHierarchy(itemId: string): Promise<{
  parents: CatalogItem[]
  children: CatalogItem[]
}> {
  try {
    // Buscar pais
    const { data: parentData, error: parentError } = await supabase
      .from('catalog_item_relations')
      .select(`
        parent_id,
        catalog_items!catalog_item_relations_parent_id_fkey (*)
      `)
      .eq('child_id', itemId)

    // Buscar filhos
    const { data: childData, error: childError } = await supabase
      .from('catalog_item_relations')
      .select(`
        child_id,
        catalog_items!catalog_item_relations_child_id_fkey (*)
      `)
      .eq('parent_id', itemId)

    if (parentError) throw parentError
    if (childError) throw childError

    return {
      parents: parentData?.map(p => p.catalog_items).filter(Boolean) || [],
      children: childData?.map(c => c.catalog_items).filter(Boolean) || []
    }
  } catch (error) {
    console.error('Erro ao buscar hierarquia:', error)
    return { parents: [], children: [] }
  }
}