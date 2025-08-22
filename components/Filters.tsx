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
import { CatalogFilters, CATALOG_LEVELS } from '@/types/catalog'
import { getAllTags } from '@/lib/supabase/catalog'

interface FiltersProps {
  onFiltersChange: (filters: CatalogFilters) => void
}

export function Filters({ onFiltersChange }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<CatalogFilters>({})
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    // Carregar tags disponíveis
    getAllTags().then((allTags) => {
      setTags(allTags.map(tag => tag.name))
    })
  }, [])

  useEffect(() => {
    // Carregar filtros da URL
    const urlFilters: CatalogFilters = {
      query: searchParams.get('query') || undefined,
      tag: searchParams.get('tag') || undefined,
      level: searchParams.get('level') || undefined,
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="query">Busca Geral</Label>
          <Input
            id="query"
            placeholder="Digite nome, código ou descrição..."
            value={filters.query || ''}
            onChange={(e) => updateFilters({ query: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Nível</Label>
          <Select
            value={filters.level || ''}
            onValueChange={(value) => updateFilters({ level: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os níveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {CATALOG_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tag">Tag</Label>
          <Select
            value={filters.tag || ''}
            onValueChange={(value) => updateFilters({ tag: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <Label>Filtros ativos:</Label>
          <div className="flex flex-wrap gap-2">
            {filters.query && (
              <Badge variant="secondary" className="gap-1">
                Busca: {filters.query}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('query')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {filters.level && (
              <Badge variant="secondary" className="gap-1">
                Nível: {filters.level}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('level')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {filters.tag && (
              <Badge variant="secondary" className="gap-1">
                Tag: {filters.tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeFilter('tag')}
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