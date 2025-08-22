import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Equipment, Assembly, Part } from '@/types'
import { Settings, Cog, Package } from 'lucide-react'

interface ResultCardProps {
  item: Equipment | Assembly | Part
  type: 'equipment' | 'assembly' | 'part'
}

export function ResultCard({ item, type }: ResultCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'equipment':
        return <Settings className="w-4 h-4" />
      case 'assembly':
        return <Cog className="w-4 h-4" />
      case 'part':
        return <Package className="w-4 h-4" />
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'equipment':
        return 'Equipamento'
      case 'assembly':
        return 'Conjunto'
      case 'part':
        return 'Peça'
    }
  }

  const getVariant = () => {
    switch (type) {
      case 'equipment':
        return 'default' as const
      case 'assembly':
        return 'secondary' as const
      case 'part':
        return 'outline' as const
    }
  }

  const getHref = () => {
    const baseUrl = type === 'equipment' ? '/equipamentos' : 
                   type === 'assembly' ? '/conjuntos' : '/pecas'
    return `${baseUrl}/${item.id}`
  }

  const getTitle = () => {
    if (type === 'part') {
      const part = item as Part
      return part.nome
    }
    return `${item.marca} ${item.modelo}`
  }

  const getSubtitle = () => {
    if (type === 'equipment') {
      const equipment = item as Equipment
      return `${equipment.tipo} ${equipment.ano ? `(${equipment.ano})` : ''}`
    }
    
    if (type === 'assembly') {
      const assembly = item as Assembly
      return `${assembly.tipo} ${assembly.ano ? `(${assembly.ano})` : ''}`
    }
    
    if (type === 'part') {
      const part = item as Part
      return `SKU: ${part.sku} | Marca: ${part.marca}`
    }
  }

  const getContext = () => {
    if (type === 'assembly') {
      const assembly = item as Assembly
      if (assembly.equipment) {
        return `Equipamento: ${assembly.equipment.marca} ${assembly.equipment.modelo}`
      }
    }
    
    if (type === 'part') {
      const part = item as Part
      const contexts = []
      
      if (part.equipment) {
        contexts.push(`Equipamento: ${part.equipment.marca} ${part.equipment.modelo}`)
      }
      
      if (part.assembly) {
        contexts.push(`Conjunto: ${part.assembly.marca} ${part.assembly.modelo}`)
      }
      
      return contexts.join(' | ')
    }
    
    return null
  }

  return (
    <Link href={getHref()}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant={getVariant()} className="gap-1">
              {getIcon()}
              {getTypeLabel()}
            </Badge>
            {item.serie && (
              <span className="text-xs text-muted-foreground">
                Série: {item.serie}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h3 className="font-semibold text-lg mb-1">{getTitle()}</h3>
          <p className="text-sm text-muted-foreground mb-2">{getSubtitle()}</p>
          {getContext() && (
            <p className="text-xs text-muted-foreground">{getContext()}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}