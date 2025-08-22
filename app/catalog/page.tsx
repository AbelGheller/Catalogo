'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Tag, 
  Link2, 
  Settings,
  Cog,
  Package,
  Box,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react'
import { 
  searchItems,
  createOrUpdateItem,
  deleteItem,
  getAllTags,
  importCsvItems,
  exportItemsToCsv,
  attachChild,
  getAuditLogs,
  validateCsvData
} from '@/lib/supabase/catalog'
import { CatalogItem, CatalogTag, AuditLog, CATALOG_LEVELS } from '@/types/catalog'

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [tags, setTags] = useState<CatalogTag[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  
  // Estados para formulários
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  
  // Estados para formulário de item
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    level: '',
    is_kit: false,
    context: '{}',
    attributes: '{}',
    tags: ''
  })
  
  // Estados para importação
  const [csvData, setCsvData] = useState('')
  const [importResult, setImportResult] = useState<any>(null)
  const [csvValidation, setCsvValidation] = useState<any>(null)

  // Carregar dados iniciais
  useEffect(() => {
    loadItems()
    loadTags()
    loadAuditLogs()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const result = await searchItems(searchQuery || undefined, selectedTag || undefined, selectedLevel || undefined)
      if (result.status === 'success') {
        setItems(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const tagList = await getAllTags()
      setTags(tagList)
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const logs = await getAuditLogs(undefined, 50)
      setAuditLogs(logs)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const handleSearch = () => {
    loadItems()
  }

  const handleCreateItem = async () => {
    setLoading(true)
    try {
      const payload = {
        code: itemForm.code || undefined,
        name: itemForm.name,
        level: itemForm.level || undefined,
        is_kit: itemForm.is_kit,
        context: itemForm.context ? JSON.parse(itemForm.context) : {},
        attributes: itemForm.attributes ? JSON.parse(itemForm.attributes) : {},
        tags: itemForm.tags ? itemForm.tags.split(';').map(t => t.trim()).filter(Boolean) : []
      }

      const result = await createOrUpdateItem(payload)
      
      if (result.status === 'success') {
        setIsCreateDialogOpen(false)
        setItemForm({ code: '', name: '', level: '', is_kit: false, context: '{}', attributes: '{}', tags: '' })
        loadItems()
        loadTags()
        loadAuditLogs()
      } else {
        alert('Erro: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao criar item:', error)
      alert('Erro ao criar item')
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = (item: CatalogItem) => {
    setEditingItem(item)
    setItemForm({
      code: item.code || '',
      name: item.name,
      level: item.level,
      is_kit: item.level === 'Kit',
      context: JSON.stringify(item.context, null, 2),
      attributes: JSON.stringify(item.attributes, null, 2),
      tags: (item.tags || []).join(';')
    })
    setIsCreateDialogOpen(true)
  }

  const handleDeleteItem = async (code: string) => {
    if (!code) return
    
    setLoading(true)
    try {
      const result = await deleteItem(code, false)
      
      if (result.status === 'success') {
        loadItems()
        loadAuditLogs()
      } else {
        alert('Erro: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao deletar item:', error)
      alert('Erro ao deletar item')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCsv = async () => {
    if (!csvData.trim()) return
    
    setLoading(true)
    try {
      const result = await importCsvItems(csvData)
      setImportResult(result)
      
      if (result.status === 'success' && result.data?.success_count > 0) {
        loadItems()
        loadTags()
        loadAuditLogs()
      }
    } catch (error) {
      console.error('Erro ao importar CSV:', error)
      alert('Erro ao importar CSV')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateCsv = async () => {
    if (!csvData.trim()) return
    
    try {
      const validation = await validateCsvData(csvData)
      setCsvValidation(validation)
    } catch (error) {
      console.error('Erro ao validar CSV:', error)
    }
  }

  const handleExportCsv = async () => {
    try {
      const csvContent = await exportItemsToCsv()
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'catalog-items.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao exportar CSV')
    }
  }

  const getIcon = (level: string) => {
    switch (level) {
      case 'Equipamento': return <Settings className="w-4 h-4" />
      case 'Conjunto': return <Cog className="w-4 h-4" />
      case 'Parte': return <Package className="w-4 h-4" />
      case 'Peça': return <Box className="w-4 h-4" />
      case 'Kit': return <Layers className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getVariant = (level: string) => {
    switch (level) {
      case 'Equipamento': return 'default' as const
      case 'Conjunto': return 'secondary' as const
      case 'Parte': return 'outline' as const
      case 'Peça': return 'destructive' as const
      case 'Kit': return 'default' as const
      default: return 'outline' as const
    }
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
            <BreadcrumbPage>Catálogo Técnico</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catálogo Técnico</h1>
        <p className="text-muted-foreground">
          Sistema de taxonomia hierárquica com tags flexíveis para equipamentos, conjuntos, partes, peças e kits
        </p>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Itens ({items.length})</TabsTrigger>
          <TabsTrigger value="import">Importação</TabsTrigger>
          <TabsTrigger value="logs">Logs ({auditLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Filtros e Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Busca e Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Busca</Label>
                  <Input
                    id="search"
                    placeholder="Nome ou código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tag-filter">Tag</Label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.name}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="level-filter">Nível</Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os níveis</SelectItem>
                      {CATALOG_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Ações</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => {
                      setSearchQuery('')
                      setSelectedTag('')
                      setSelectedLevel('')
                      loadItems()
                    }} variant="outline" size="sm">
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Novo Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Editar Item' : 'Criar Novo Item'}
                      </DialogTitle>
                      <DialogDescription>
                        Preencha os dados do item. O nível será inferido automaticamente se não especificado.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="item-code">Código (opcional)</Label>
                          <Input
                            id="item-code"
                            placeholder="EQP-0001"
                            value={itemForm.code}
                            onChange={(e) => setItemForm(prev => ({ ...prev, code: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="item-name">Nome *</Label>
                          <Input
                            id="item-name"
                            placeholder="Nome do item"
                            value={itemForm.name}
                            onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="item-level">Nível (opcional)</Label>
                          <Select value={itemForm.level} onValueChange={(value) => setItemForm(prev => ({ ...prev, level: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Inferir automaticamente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Inferir automaticamente</SelectItem>
                              {CATALOG_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="item-tags">Tags (separar por ;)</Label>
                          <Input
                            id="item-tags"
                            placeholder="motor;yuchai;naval"
                            value={itemForm.tags}
                            onChange={(e) => setItemForm(prev => ({ ...prev, tags: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="item-context">Contexto (JSON)</Label>
                          <Textarea
                            id="item-context"
                            placeholder='{"setor":"construcao","naval":true}'
                            value={itemForm.context}
                            onChange={(e) => setItemForm(prev => ({ ...prev, context: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="item-attributes">Atributos (JSON)</Label>
                          <Textarea
                            id="item-attributes"
                            placeholder='{"potencia_kw":58,"cilindros":4}'
                            value={itemForm.attributes}
                            onChange={(e) => setItemForm(prev => ({ ...prev, attributes: e.target.value }))}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreateDialogOpen(false)
                        setEditingItem(null)
                        setItemForm({ code: '', name: '', level: '', is_kit: false, context: '{}', attributes: '{}', tags: '' })
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateItem} disabled={loading || !itemForm.name}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {editingItem ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" onClick={handleExportCsv} className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Itens */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Carregando itens...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={getVariant(item.level)} className="gap-1">
                        {getIcon(item.level)}
                        {item.level}
                      </Badge>
                      {item.code && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.code}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {Object.keys(item.attributes).length > 0 && (
                      <div className="text-sm text-muted-foreground mb-3">
                        {Object.entries(item.attributes).slice(0, 2).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </Button>
                      
                      {item.code && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-1">
                              <Trash2 className="w-3 h-3" />
                              Deletar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar o item "{item.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(item.code!)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou criar um novo item
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Importação de CSV
              </CardTitle>
              <CardDescription>
                Importe itens em lote usando formato CSV. Colunas aceitas: code, name, level, tags, parent_code, is_kit, context, attributes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-data">Dados CSV</Label>
                <Textarea
                  id="csv-data"
                  placeholder="code,name,level,tags,parent_code,is_kit,context,attributes&#10;EQP-0001,Pá-carregadeira 3T,Equipamento,&quot;construção;XGMA&quot;,,false,{},{}&#10;MTR-0001,Motor 4D80,Parte,&quot;motor;yuchai&quot;,EQP-0001,false,{},{}"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleValidateCsv} 
                  disabled={loading || !csvData.trim()} 
                  className="gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Validar CSV
                </Button>
                
                <Button onClick={handleImportCsv} disabled={loading || !csvData.trim()} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Importar CSV
                </Button>
                
                <Button variant="outline" onClick={() => setCsvData('')}>
                  Limpar
                </Button>
              </div>
              
              {csvValidation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {csvValidation.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      Validação do CSV
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {csvValidation.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Erros encontrados:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {csvValidation.errors.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {csvValidation.warnings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-600 mb-2">Avisos:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {csvValidation.warnings.map((warning: string, index: number) => (
                            <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {csvValidation.preview.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Preview (primeiras 5 linhas):</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border p-2 text-left">Code</th>
                                <th className="border p-2 text-left">Name</th>
                                <th className="border p-2 text-left">Level</th>
                                <th className="border p-2 text-left">Tags</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvValidation.preview.map((row: any, index: number) => (
                                <tr key={index}>
                                  <td className="border p-2">{row.code || '-'}</td>
                                  <td className="border p-2">{row.name}</td>
                                  <td className="border p-2">{row.level || 'Auto'}</td>
                                  <td className="border p-2">{row.tags || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {importResult.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      Resultado da Importação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.data?.success_count || 0}
                        </div>
                        <div className="text-sm text-green-700">Sucessos</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {importResult.data?.error_count || 0}
                        </div>
                        <div className="text-sm text-red-700">Erros</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {importResult.data?.warnings?.length || 0}
                        </div>
                        <div className="text-sm text-yellow-700">Avisos</div>
                      </div>
                    </div>
                    
                    {importResult.data?.errors?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Erros:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {importResult.data.errors.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {importResult.data?.warnings?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-600 mb-2">Avisos:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {importResult.data.warnings.map((warning: string, index: number) => (
                            <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico de todas as operações realizadas no catálogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.action}</span>
                        {log.item_code && (
                          <Badge variant="outline" className="text-xs">
                            {log.item_code}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.message && (
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}