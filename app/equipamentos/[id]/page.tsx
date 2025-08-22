import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { getEquipmentById } from '@/lib/queries/equipment'
import { getAssembliesByEquipmentId } from '@/lib/queries/assembly'
import { getParts } from '@/lib/queries/part'
import { ArrowLeft, Calendar, Hash, Settings, Cog, Package } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function EquipmentPage({ params }: Props) {
  try {
    const [equipment, assemblies, allParts] = await Promise.all([
      getEquipmentById(params.id),
      getAssembliesByEquipmentId(params.id),
      getParts()
    ])

    // Filtrar peças relacionadas diretamente ao equipamento
    const directParts = allParts.filter(part => part.equipment_id === params.id)

    return (
      <div className="container mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/catalogo">Catálogo</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Equipamento</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/catalogo" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao catálogo
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="gap-1 mb-4">
                    <Settings className="w-4 h-4" />
                    Equipamento
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{equipment.marca} {equipment.modelo}</CardTitle>
                <CardDescription>{equipment.tipo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Ano: {equipment.ano || 'Não informado'}
                    </span>
                  </div>
                  {equipment.serie && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Série: {equipment.serie}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {assemblies.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    Conjuntos ({assemblies.length})
                  </CardTitle>
                  <CardDescription>
                    Conjuntos pertencentes a este equipamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {assemblies.map((assembly) => (
                      <Link key={assembly.id} href={`/conjuntos/${assembly.id}`}>
                        <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {assembly.tipo}
                            </Badge>
                            {assembly.serie && (
                              <span className="text-xs text-muted-foreground">
                                Série: {assembly.serie}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium">{assembly.marca} {assembly.modelo}</h4>
                          {assembly.ano && (
                            <p className="text-sm text-muted-foreground">Ano: {assembly.ano}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {directParts.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Peças Diretas ({directParts.length})
                  </CardTitle>
                  <CardDescription>
                    Peças relacionadas diretamente a este equipamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {directParts.map((part) => (
                      <Link key={part.id} href={`/pecas/${part.id}`}>
                        <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              SKU: {part.sku}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {part.marca}
                            </span>
                          </div>
                          <h4 className="font-medium">{part.nome}</h4>
                          {part.notas && (
                            <p className="text-sm text-muted-foreground mt-1">{part.notas}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-sm">{equipment.tipo}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marca</label>
                  <p className="text-sm">{equipment.marca}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                  <p className="text-sm">{equipment.modelo}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ano</label>
                  <p className="text-sm">{equipment.ano || 'Não informado'}</p>
                </div>
                {equipment.serie && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Série</label>
                      <p className="text-sm">{equipment.serie}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Conjuntos</span>
                  <span className="text-sm font-medium">{assemblies.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Peças Diretas</span>
                  <span className="text-sm font-medium">{directParts.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Erro ao carregar equipamento:', error)
    return notFound()
  }
}