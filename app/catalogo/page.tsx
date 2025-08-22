'use client'

import { useState, useEffect, Suspense } from 'react'
import { Filters } from '@/components/Filters'
import { ResultCard } from '@/components/ResultCard'
import { CatalogItem, CatalogFilters } from '@/types/catalog'
import { searchItems } from '@/lib/supabase/catalog'
import { Loader2 } from 'lucide-react'

function CatalogoContent() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<CatalogItem[]>([])

  const handleFiltersChange = async (filters: CatalogFilters) => {
    setLoading(true)
    
    try {
      const result = await searchItems(filters.query, filters.tag, filters.level)
      setItems(result.data || [])
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      
      // Verificar diferentes tipos de erro
      if (error instanceof Error) {
        if (error.message.includes('Missing env.')) {
          alert('Erro de configuração: ' + error.message + '\n\nVerifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no arquivo .env.local')
        } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          alert('Erro de conexão com Supabase:\n\n1. Verifique se seu projeto Supabase está ativo\n2. Confirme se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão corretas no .env.local\n3. Reinicie o servidor de desenvolvimento após alterar o .env.local\n4. Verifique sua conexão de internet')
        } else {
          alert('Erro inesperado: ' + error.message)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    handleFiltersChange({})
  }, [])

  const totalResults = items.length
  
  // Agrupar itens por nível
  const equipamentos = items.filter(item => item.level === 'Equipamento')
  const conjuntos = items.filter(item => item.level === 'Conjunto')
  const partes = items.filter(item => item.level === 'Parte')
  const pecas = items.filter(item => item.level === 'Peça')
  const kits = items.filter(item => item.level === 'Kit')

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catálogo de Produtos</h1>
        <p className="text-muted-foreground">
          Use os filtros abaixo para encontrar equipamentos, conjuntos e peças
        </p>
      </div>

      <div className="mb-8">
        <Filters onFiltersChange={handleFiltersChange} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Buscando produtos...</span>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Resultados encontrados: {totalResults}
            </h2>
            {totalResults > 0 && (
              <span className="text-muted-foreground">
                {equipamentos.length} equipamento(s), {conjuntos.length} conjunto(s), {partes.length} parte(s), {pecas.length} peça(s), {kits.length} kit(s)
              </span>
            )}
          </div>

          <div className="space-y-8">
            {equipamentos.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Equipamentos ({equipamentos.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {equipamentos.map((item) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            )}

            {conjuntos.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Conjuntos ({conjuntos.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {conjuntos.map((item) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            )}

            {partes.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Partes ({partes.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {partes.map((item) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            )}

            {pecas.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Peças ({pecas.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pecas.map((item) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            )}

            {kits.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Kits ({kits.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {kits.map((item) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            )}

            {totalResults === 0 && !loading && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros para encontrar outros produtos
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  )
}