'use client'

import { useState, useEffect, Suspense } from 'react'
import { Filters } from '@/components/Filters'
import { ResultCard } from '@/components/ResultCard'
import { Equipment, Assembly, Part, CatalogFilters } from '@/types'
import { getEquipmentsByFilters } from '@/lib/queries/equipment'
import { getAssembliesByFilters } from '@/lib/queries/assembly'
import { getPartsByFilters } from '@/lib/queries/part'
import { Loader2 } from 'lucide-react'

function CatalogoContent() {
  const [loading, setLoading] = useState(false)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [parts, setParts] = useState<Part[]>([])

  const handleFiltersChange = async (filters: CatalogFilters) => {
    setLoading(true)
    
    try {
      // Buscar equipamentos primeiro
      const equipmentFilters = {
        marca: filters.equipmentMarca,
        modelo: filters.equipmentModelo,
        tipo: filters.equipmentTipo,
        ano: filters.equipmentAno
      }
      
      const foundEquipments = await getEquipmentsByFilters(equipmentFilters)
      setEquipments(foundEquipments)
      
      const equipmentIds = foundEquipments.map(eq => eq.id)
      
      // Buscar conjuntos baseado nos equipamentos encontrados e filtros de motor/bomba
      const assemblyFilters = {
        equipmentIds: equipmentIds.length > 0 ? equipmentIds : undefined,
        motorMarca: filters.motorMarca,
        bombaInjetoraMarca: filters.bombaInjetoraMarca
      }
      
      const foundAssemblies = await getAssembliesByFilters(assemblyFilters)
      setAssemblies(foundAssemblies)
      
      const assemblyIds = foundAssemblies.map(as => as.id)
      
      // Buscar peças baseado nos equipamentos e conjuntos encontrados
      const partFilters = {
        equipmentIds: equipmentIds.length > 0 ? equipmentIds : undefined,
        assemblyIds: assemblyIds.length > 0 ? assemblyIds : undefined,
        sku: filters.sku
      }
      
      const foundParts = await getPartsByFilters(partFilters)
      setParts(foundParts)
      
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

  const totalResults = equipments.length + assemblies.length + parts.length

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
            {equipments.length > 0 && (
              <span className="text-muted-foreground">
                {equipments.length} equipamento(s), {assemblies.length} conjunto(s), {parts.length} peça(s)
              </span>
            )}
          </div>

          <div className="space-y-8">
            {equipments.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Equipamentos ({equipments.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {equipments.map((equipment) => (
                    <ResultCard
                      key={equipment.id}
                      item={equipment}
                      type="equipment"
                    />
                  ))}
                </div>
              </section>
            )}

            {assemblies.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Conjuntos ({assemblies.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assemblies.map((assembly) => (
                    <ResultCard
                      key={assembly.id}
                      item={assembly}
                      type="assembly"
                    />
                  ))}
                </div>
              </section>
            )}

            {parts.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Peças ({parts.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {parts.map((part) => (
                    <ResultCard
                      key={part.id}
                      item={part}
                      type="part"
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