import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-6xl font-bold text-muted-foreground mb-4">
              404
            </CardTitle>
            <CardTitle className="text-2xl">Página não encontrada</CardTitle>
            <CardDescription>
              A página que você está procurando não existe ou foi movida.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/" className="gap-2">
                  <Home className="w-4 h-4" />
                  Voltar ao início
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/catalogo" className="gap-2">
                  <Search className="w-4 h-4" />
                  Explorar catálogo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}