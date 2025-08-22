import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CatalogItem } from '@/types/catalog'
import { Settings, Cog, Package, Wrench, Box } from 'lucide-react'

interface ResultCardProps {
  item: CatalogItem
}

export function ResultCard({ item }: ResultCardProps) {
  const getIcon = () => {
    switch (item.level) {
      case 'Equipamento':
        return <Settings className="w-4 h-4" />
      case 'Conjunto':
        return <Cog className="w-4 h-4" />
      case 'Parte':
        return <Wrench className="w-4 h-4" />
      case 'Peça':
        return <Package className="w-4 h-4" />
      case 'Kit':
        return <Box className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getTypeLabel = () => {
    return item.level
  }

  const getVariant = () => {
    switch (item.level) {
      case 'Equipamento':
        return 'default' as const
      case 'Conjunto':
        return 'secondary' as const
      case 'Parte':
        return 'outline' as const
      case 'Peça':
        return 'outline' as const
      case 'Kit':
        return 'destructive' as const
      default:
        return 'outline' as const
    }
  }

  const getHref = () => {
    const baseUrl = '/catalog'
    return `${baseUrl}/${item.id}`
  }

  const getTitle = () => {
    return item.name
  }

  const getSubtitle = () => {
    const parts = []
    
    if (item.code) {
      parts.push(`Código: ${item.code}`)
    }
    
    if (item.attributes && typeof item.attributes === 'object') {
      const attrs = item.attributes as Record<string, any>
      Object.entries(attrs).slice(0, 2).forEach(([key, value]) => {
        parts.push(`${key}: ${value}`)
      })
    }
    
    return parts.join(' | ') || 'Sem informações adicionais'
  }

  const getContext = () => {
    if (item.context && typeof item.context === 'object') {
      const ctx = item.context as Record<string, any>
      const contextParts = Object.entries(ctx).map(([key, value]) => `${key}: ${value}`)
      return contextParts.join(' | ')
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
            {item.code && (
              <span className="text-xs text-muted-foreground">
                {item.code}
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