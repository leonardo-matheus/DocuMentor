import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, Folder, Loader2, Edit2, Trash, Check, Copy
} from 'lucide-react'
import { publicationsApi, type Category, type Publication } from '@/services/api'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Copy Button Component - completely isolated
function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = () => {
    const url = `${window.location.origin}/docs/${slug}`
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        toast.success('Link copiado!')
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {
        fallbackCopy(url)
      })
    } else {
      fallbackCopy(url)
    }
  }
  
  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
    document.body.removeChild(textArea)
  }
  
  return (
    <div 
      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ zIndex: 9999 }}
    >
      <button
        type="button"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
        onTouchStart={(e) => { e.stopPropagation() }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          copyToClipboard()
        }}
        className={`w-7 h-7 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer select-none ${
          copied 
            ? 'bg-green-500 text-white scale-110' 
            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-slate-600'
        }`}
        title="Copiar link"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 pointer-events-none" />
        ) : (
          <Copy className="w-3.5 h-3.5 pointer-events-none" />
        )}
      </button>
    </div>
  )
}

// Sortable Publication Card (App style)
function SortableAppCard({ publication, wasDragging }: { 
  publication: Publication
  wasDragging: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: publication.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  const handleClick = (e: React.MouseEvent) => {
    // Bloqueia navegação se estava arrastando
    if (wasDragging || isDragging) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50 opacity-80' : ''}`}
    >
      {/* Copy Link Button - isolated component */}
      <CopyLinkButton slug={publication.slug} />
      
      {/* App Icon Style Card - drag area */}
      <div {...attributes} {...listeners}>
        <Link
          to={`/docs/${publication.slug}`}
          className="block"
          onClick={handleClick}
          draggable={false}
        >
          <div 
            className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {publication.icon || '📄'}
          </div>
          <p className="mt-2 text-center text-sm font-medium text-gray-900 truncate max-w-[100px] mx-auto">
            {publication.title}
          </p>
          {publication.version && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">v{publication.version}</p>
          )}
        </Link>
      </div>
    </div>
  )
}

// Simple Publication Card (for uncategorized items)
function SimpleAppCard({ publication }: { publication: Publication }) {
  return (
    <div className="relative group">
      {/* Copy Link Button - isolated component */}
      <CopyLinkButton slug={publication.slug} />
      
      <Link to={`/docs/${publication.slug}`} className="block">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
          {publication.icon || '📄'}
        </div>
        <p className="mt-2 text-center text-sm font-medium text-gray-900 truncate max-w-[100px] mx-auto">
          {publication.title}
        </p>
      </Link>
    </div>
  )
}

// Category Card with drag-drop apps inside
function CategoryCard({ 
  category, 
  publications,
  onEditCategory,
  onDeleteCategory,
  onReorderPubs
}: { 
  category: Category
  publications: Publication[]
  onEditCategory: () => void
  onDeleteCategory: () => void
  onReorderPubs: (pubIds: string[], categoryId: string) => void
}) {
  const [wasDragging, setWasDragging] = useState(false)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  
  const handleDragStart = () => {
    setWasDragging(true)
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    // Reset wasDragging after a small delay to prevent click
    dragTimeoutRef.current = setTimeout(() => {
      setWasDragging(false)
    }, 100)
    
    if (!over || active.id === over.id) return
    
    const oldIndex = publications.findIndex(p => p.id === active.id)
    const newIndex = publications.findIndex(p => p.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(publications, oldIndex, newIndex)
      onReorderPubs(newOrder.map(p => p.id), category.id)
    }
  }
  
  return (
    <div 
      className="rounded-3xl p-6 relative group"
      style={{ 
        backgroundColor: category.color || '#f3f4f6',
        minHeight: '200px'
      }}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon || '📁'}</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900">{category.name}</h3>
          <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-700">
            {publications.length}
          </span>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={onEditCategory}
            className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-gray-600 hover:text-primary transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDeleteCategory}
            className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-gray-600 hover:text-red-500 transition-colors"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {category.description && (
        <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">{category.description}</p>
      )}
      
      {/* Apps Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={publications.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {publications.map(pub => (
              <SortableAppCard
                key={pub.id}
                publication={pub}
                wasDragging={wasDragging}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {publications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma documentação nesta categoria</p>
        </div>
      )}
    </div>
  )
}

export default function PublicationsPage() {
  const queryClient = useQueryClient()
  
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '📁', color: '#e0e7ff' })
  
  // Fetch categories with publications
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => publicationsApi.getCategories().then(res => res.data)
  })
  
  // Fetch all publications (including uncategorized)
  const { data: allPublications = [] } = useQuery({
    queryKey: ['publications'],
    queryFn: () => publicationsApi.list().then(res => res.data)
  })
  
  // Get uncategorized publications
  const uncategorizedPubs = allPublications.filter(p => !p.categoryId)
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string; color?: string }) =>
      publicationsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowNewCategoryModal(false)
      setCategoryForm({ name: '', description: '', icon: '📁', color: '#e0e7ff' })
      toast.success('Categoria criada!')
    },
    onError: () => toast.error('Erro ao criar categoria')
  })
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      publicationsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategory(null)
      toast.success('Categoria atualizada!')
    },
    onError: () => toast.error('Erro ao atualizar categoria')
  })
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => publicationsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      toast.success('Categoria removida!')
    },
    onError: () => toast.error('Erro ao remover categoria')
  })
  
  // Reorder publications mutation
  const reorderMutation = useMutation({
    mutationFn: (publications: { id: string; order: number; categoryId?: string }[]) =>
      publicationsApi.reorder(publications),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
  
  const handleReorderPubs = (pubIds: string[], categoryId: string) => {
    const updates = pubIds.map((id, index) => ({ id, order: index, categoryId }))
    reorderMutation.mutate(updates)
  }
  
  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Remover categoria "${category.name}"? As documentações serão movidas para "Sem categoria".`)) {
      deleteCategoryMutation.mutate(category.id)
    }
  }
  
  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📁',
      color: category.color || '#e0e7ff'
    })
  }
  
  const CATEGORY_ICONS = ['📁', '🚗', '💳', '📊', '🔧', '📱', '🖥️', '🗄️', '🔐', '📈', '🏢', '⚡']
  const CATEGORY_COLORS = [
    '#e0e7ff', // indigo-100
    '#d1fae5', // emerald-100
    '#fef3c7', // amber-100
    '#fce7f3', // pink-100
    '#e0f2fe', // sky-100
    '#f3e8ff', // purple-100
    '#fef9c3', // yellow-100
    '#f1f5f9', // slate-100
  ]
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 transition-colors">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Publicações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Documentações publicadas e acessíveis</p>
          </div>
          <button
            onClick={() => {
              setCategoryForm({ name: '', description: '', icon: '📁', color: '#e0e7ff' })
              setShowNewCategoryModal(true)
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>
      </div>
      
      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Render categories */}
        {categories.map(category => {
          const categoryPubs = allPublications
            .filter(p => p.categoryId === category.id)
            .sort((a, b) => a.order - b.order)
          
          return (
            <CategoryCard
              key={category.id}
              category={category}
              publications={categoryPubs}
              onEditCategory={() => openEditCategoryModal(category)}
              onDeleteCategory={() => handleDeleteCategory(category)}
              onReorderPubs={handleReorderPubs}
            />
          )
        })}
        
        {/* Uncategorized */}
        {uncategorizedPubs.length > 0 && (
          <div className="rounded-3xl p-6 bg-gray-100 dark:bg-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📄</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Sem Categoria</h3>
              <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-700 dark:text-slate-300">
                {uncategorizedPubs.length}
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {uncategorizedPubs.map(pub => (
                <SimpleAppCard key={pub.id} publication={pub} />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {categories.length === 0 && uncategorizedPubs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="w-12 h-12 text-gray-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Nenhuma publicação ainda</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Publique documentações a partir do editor para vê-las aqui.
            </p>
            <Link to="/projects" className="btn btn-primary">
              Ver Projetos
            </Link>
          </div>
        )}
      </div>
      
      {/* New/Edit Category Modal */}
      {(showNewCategoryModal || editingCategory) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowNewCategoryModal(false)
            setEditingCategory(null)
          }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Estacionamento"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Sistemas de estacionamento..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryForm(f => ({ ...f, icon }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        categoryForm.icon === icon 
                          ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm(f => ({ ...f, color }))}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        categoryForm.color === color 
                          ? 'ring-2 ring-gray-900 ring-offset-2' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  if (editingCategory) {
                    updateCategoryMutation.mutate({
                      id: editingCategory.id,
                      data: categoryForm
                    })
                  } else {
                    createCategoryMutation.mutate(categoryForm)
                  }
                }}
                disabled={!categoryForm.name.trim()}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingCategory ? 'Salvar' : 'Criar'}
              </button>
              <button
                onClick={() => {
                  setShowNewCategoryModal(false)
                  setEditingCategory(null)
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
