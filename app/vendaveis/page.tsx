'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { getSellables } from '@/lib/queries/sellable'
import { Sellable } from '@/types'
import { Loader2, ShoppingCart, Settings, Cog, Package, Plus } from 'lucide-react'

export default function VendaveisPage() {
  const [sellables, setSellables] = useState<Sellable[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<string[]>([])

  useEffect(() => {
    const loadSellables = async () => {
      try {
        const data = await getSellables()
        setSellables(data)
      } catch (error) {
        console.error('Erro ao carregar vendáveis:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSellables()
  }, [])

  const addToCart = (sellableId: string) => {
    setCart(prev => [...prev, sellableId])
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'EQUIPMENT':
        return <Settings className="w-4 h-4" />
      case 'ASSEMBLY':
        return <Cog className="w-4 h-4" />
      case 'PART':
        return <Package className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'EQUIPMENT':
        return 'Equipamento'
      case 'ASSEMBLY':
        return 'Conjunto'
      case 'PART':
        return 'Peça'
      default:
        return 'Item'
    }
  }

  const getVariant = (tipo: string) => {
    switch (tipo) {
      case 'EQUIPMENT':
        return 'default' as const
      case 'ASSEMBLY':
        return 'secondary' as const
      case 'PART':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  const getItemName = (sellable: Sellable) => {
    if (sellable.equipment) {
      return `${sellable.equipment.marca} ${sellable.equipment.modelo}`
    }
    if (sellable.assembly) {
      return `${sellable.assembly.marca} ${sellable.assembly.modelo}`
    }
    if (sellable.part) {
      return sellable.part.nome
    }
    return 'Item não encontrado'
  }

  const getItemDescription = (sellable: Sellable) => {
    if (sellable.equipment) {
      return `${sellable.equipment.tipo} ${sellable.equipment.ano ? `(${sellable.equipment.ano})` : ''}`
    }
    if (sellable.assembly) {
      return `${sellable.assembly.tipo} ${sellable.assembly.ano ? `(${sellable.assembly.ano})` : ''}`
    }
    if (sellable.part) {
      return `SKU: ${sellable.part.sku} | Marca: ${sellable.part.marca}`
    }
    return ''
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando vendáveis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Vendáveis</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Itens Vendáveis</h1>
          <p className="text-muted-foreground">
            Produtos disponíveis para venda com preços atualizados
          </p>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">{cart.length} item(s) no carrinho</span>
          </div>
        )}
      </div>

      {sellables.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Nenhum item vendável encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Não há produtos disponíveis para venda no momento
          </p>
          <Button asChild>
            <Link href="/admin">
              Gerenciar Vendáveis
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sellables.map((sellable) => (
            <Card key={sellable.id} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getVariant(sellable.tipo)} className="gap-1">
                    {getIcon(sellable.tipo)}
                    {getTypeLabel(sellable.tipo)}
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(sellable.preco)}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg">{getItemName(sellable)}</CardTitle>
                <CardDescription>{getItemDescription(sellable)}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {sellable.equipment?.serie && (
                    <div className="text-sm text-muted-foreground">
                      Série: {sellable.equipment.serie}
                    </div>
                  )}
                  {sellable.assembly?.serie && (
                    <div className="text-sm text-muted-foreground">
                      Série: {sellable.assembly.serie}
                    </div>
                  )}
                  {sellable.part?.notas && (
                    <div className="text-sm text-muted-foreground">
                      {sellable.part.notas}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => addToCart(sellable.id)}
                      disabled={cart.includes(sellable.id)}
                      className="flex-1 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {cart.includes(sellable.id) ? 'Adicionado' : 'Adicionar ao Pedido'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Simulação de Pedido</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {cart.length} item(s) selecionado(s). Esta é apenas uma simulação.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCart([])}>
              Limpar Carrinho
            </Button>
            <Button>
              Finalizar Pedido (Simulado)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}