'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { Settings, Cog, Package, ShoppingCart, Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('equipments')

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Administração</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Área Administrativa</h1>
        <p className="text-muted-foreground">
          Gerencie equipamentos, conjuntos, peças e itens vendáveis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipments" className="gap-2">
            <Settings className="w-4 h-4" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="assemblies" className="gap-2">
            <Cog className="w-4 h-4" />
            Conjuntos
          </TabsTrigger>
          <TabsTrigger value="parts" className="gap-2">
            <Package className="w-4 h-4" />
            Peças
          </TabsTrigger>
          <TabsTrigger value="sellables" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Vendáveis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Gerenciar Equipamentos
                  </CardTitle>
                  <CardDescription>
                    Adicione, edite ou remova equipamentos do catálogo
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Equipamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">CRUD de Equipamentos</p>
                <p className="text-sm">
                  Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todos os equipamentos aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assemblies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    Gerenciar Conjuntos
                  </CardTitle>
                  <CardDescription>
                    Adicione, edite ou remova conjuntos (motores, bombas injetoras, etc.)
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Conjunto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Cog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">CRUD de Conjuntos</p>
                <p className="text-sm">
                  Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todos os conjuntos aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Gerenciar Peças
                  </CardTitle>
                  <CardDescription>
                    Adicione, edite ou remova peças e configure compatibilidades
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Peça
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">CRUD de Peças</p>
                <p className="text-sm">
                  Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todas as peças aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellables" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Gerenciar Vendáveis
                  </CardTitle>
                  <CardDescription>
                    Configure preços e disponibilidade de itens para venda
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Vendável
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">CRUD de Vendáveis</p>
                <p className="text-sm">
                  Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todos os itens vendáveis aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Próximas Funcionalidades</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Formulários completos de CRUD para cada entidade</li>
          <li>• Configuração de compatibilidades entre peças</li>
          <li>• Gerenciamento de substituições de peças</li>
          <li>• Upload de imagens para produtos</li>
          <li>• Relatórios e estatísticas</li>
        </ul>
      </div>
    </div>
  )
}