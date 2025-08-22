import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, ShoppingCart, Settings, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Sistema de Catálogo</h1>
        <p className="text-xl text-muted-foreground">
          Gerencie equipamentos, conjuntos e peças com filtros inteligentes
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Catálogo
            </CardTitle>
            <CardDescription>
              Pesquise equipamentos, conjuntos e peças usando filtros cascateados inteligentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/catalogo">
                Explorar Catálogo
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Vendáveis
            </CardTitle>
            <CardDescription>
              Visualize todos os itens disponíveis para venda com preços atualizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/vendaveis">
                Ver Vendáveis
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Administração
            </CardTitle>
            <CardDescription>
              Área administrativa para gerenciar equipamentos, conjuntos e peças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/admin">
                Área Admin
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Documentação
            </CardTitle>
            <CardDescription>
              Aprenda como usar os filtros e navegar pelo sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="ghost">
              <Link href="/sobre">
                Saiba Mais
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Como funciona</h2>
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto text-left">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">1. Filtros Inteligentes</h3>
            <p className="text-muted-foreground">
              Use filtros cascateados para encontrar peças sem precisar digitar SKUs. 
              Comece filtrando por equipamento, depois conjunto.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">2. Navegação Hierárquica</h3>
            <p className="text-muted-foreground">
              Navegue naturalmente de Equipamento → Conjunto → Peça, 
              seguindo a hierarquia lógica dos componentes.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">3. Compatibilidades</h3>
            <p className="text-muted-foreground">
              Veja todas as compatibilidades e substituições de peças,
              com caminho completo de onde cada peça se encaixa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}