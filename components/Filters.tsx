'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CatalogFilters } from '@/types'
import { getDistinctEquipmentValues } from '@/lib/queries/equipment'
import { getDistinctAssemblyValues } from '@/lib/queries/assembly'

interface FiltersProps {
  onFiltersChange: (filters: CatalogFilters) => void
}

export function Filters({ onFiltersChange }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<CatalogFilters>({})
  const [options, setOptions] = useState({
    equipmentMarcas: [] as string[],
    equipmentModelos: [] as string[],
    equipmentTipos: [] as string[],
    equipmentAnos: [] as string[],
    motorMarcas: [] as string[],
    bombaMarcas: [] as string[]
  })

  useEffect(() => {
    // Carregar opções para os selects
    Promise.all([
      getDistinctEquipmentValues(),
      getDistinctAssemblyValues()
    ]).then(([equipmentValues, assemblyValues]) => {
      setOptions({
        equipmentMarcas: equipmentValues.marcas,
        equipmentModelos: equipmentValues.modelos,
        equipmentTipos: equipmentValues.tipos,
        equipmentAnos: equipmentValues.anos,
        motorMarcas: assemblyValues.motorMarcas,
        bombaMarcas: assemblyValues.bombaMarcas
      })
    })
  }, [])

  useEffect(() => {
    // Carregar filtros da URL
    const urlFilters: CatalogFilters = {
      equipmentMarca: searchParams.get('equipmentMarca') || undefined,
      equipmentModelo: searchParams.get('equipmentModelo') || undefined,
      equipmentTipo: searchParams.get('equipmentTipo') || undefined,
      equipmentAno: searchParams.get('equipmentAno') || undefined,
      motorMarca: searchParams.get('motorMarca') || undefined,
      bombaInjetoraMarca: searchParams.get('bombaInjetoraMarca') || undefined,
      sku: searchParams.get('sku') || undefined,
    }
    setFilters(urlFilters)
    onFiltersChange(urlFilters)
  }, [searchParams])

  const updateFilters = (newFilters: Partial<CatalogFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // Atualizar URL
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    router.push(`/catalogo?${params.toString()}`, { scroll: false })
    onFiltersChange(updatedFilters)
  }

  const removeFilter = (key: keyof CatalogFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    updateFilters(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({})
    router.push('/catalogo', { scroll: false })
    onFiltersChange({})
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {activeFiltersCount > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Limpar todos ({activeFiltersCount})
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="equipment-marca">Marca do Equipamento</Label>
          <Select
            value={filters.equipmentMarca || ''}
            onValueChange={(value) => updateFilters({ equipmentMarca: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {options.equipmentMarcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipment-modelo">Modelo do Equipamento</Label>
          <Select
            value={filters.equipmentModelo || ''}
            onValueChange={(value) => updateFilters({ equipmentModelo: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modelos</SelectItem>
              {options.equipmentModelos.map((modelo) => (
                <SelectItem key={modelo} value={modelo}>
                  {modelo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="motor-marca">Marca do Motor</Label>
          <Select
            value={filters.motorMarca || ''}
            onValueChange={(value) => updateFilters({ motorMarca: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {options.motorMarcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bomba-marca">Marca da Bomba Injetora</Label>
          <Select
            value={filters.bombaInjetoraMarca || ''}
            onValueChange={(value) => updateFilters({ bombaInjetoraMarca: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {options.bombaMarcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sku">SKU da Peça (opcional)</Label>
        <Input
          id="sku"
          placeholder="Digite o SKU da peça..."
          value={filters.sku || ''}
          onChange={(e) => updateFilters({ sku: e.target.value || undefined })}
        />
      </div>

      {/* Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <Label>Filtros ativos:</Label>
          <div className="flex flex-wrap gap-2">
            {filters.equipmentMarca && (
              <Badge variant="secondary" className="gap-1">
                Equip. Marca: {filters.equipmentMarca}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('equipmentMarca')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {filters.equipmentModelo && (
              <Badge variant="secondary" className="gap-1">
                Equip. Modelo: {filters.equipmentModelo}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('equipmentModelo')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {filters.motorMarca && (
              <Badge variant="secondary" className="gap-1">
                Motor: {filters.motorMarca}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('motorMarca')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {filters.bombaInjetoraMarca && (
              <Badge variant="secondary" className="gap-1">
                Bomba: {filters.bombaInjetoraMarca}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('bombaInjetoraMarca')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {filters.sku && (
              <Badge variant="secondary" className="gap-1">
                SKU: {filters.sku}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('sku')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}