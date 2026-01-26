import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, Folder, Loader2, Edit2, Trash, Check
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

// Sortable Publication Card (App style)
function SortableAppCard({ publication, onEdit, onDelete }: { 
  publication: Publication
  onEdit: () => void
  onDelete: () => void 
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
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50 opacity-80' : ''}`}
    >
      {/* App Icon Style Card */}
      <Link
        to={`/docs/${publication.slug}`}
        className="block"
        {...attributes}
        {...listeners}
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-grab active:cursor-grabbing">
          {publication.icon || '📄'}
        </div>
        <p className="mt-2 text-center text-sm font-medium text-gray-900 truncate max-w-[100px] mx-auto">
          {publication.title}
        </p>
        {publication.version && (
          <p className="text-center text-xs text-gray-500">v{publication.version}</p>
        )}
      </Link>
      
      {/* Actions on hover */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => { e.preventDefault(); onEdit() }}
          className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete() }}
          className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-red-500"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// Category Card with drag-drop apps inside
function CategoryCard({ 
  category, 
  publications,
  onEditCategory,
  onDeleteCategory,
  onEditPub,
  onDeletePub,
  onReorderPubs
}: { 
  category: Category
  publications: Publication[]
  onEditCategory: () => void
  onDeleteCategory: () => void
  onEditPub: (pub: Publication) => void
  onDeletePub: (pub: Publication) => void
  onReorderPubs: (pubIds: string[], categoryId: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
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
          <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
          <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full text-gray-700">
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
        <p className="text-sm text-gray-600 mb-4">{category.description}</p>
      )}
      
      {/* Apps Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={publications.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {publications.map(pub => (
              <SortableAppCard
                key={pub.id}
                publication={pub}
                onEdit={() => onEditPub(pub)}
                onDelete={() => onDeletePub(pub)}
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
  const navigate = useNavigate()
  
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
  
  // Delete publication mutation
  const deletePublicationMutation = useMutation({
    mutationFn: (id: string) => publicationsApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      toast.success('Publicação removida!')
    },
    onError: () => toast.error('Erro ao remover publicação')
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
  
  const handleDeletePublication = (pub: Publication) => {
    if (confirm(`Remover publicação "${pub.title}"? O projeto não será afetado.`)) {
      deletePublicationMutation.mutate(pub.id)
    }
  }
  
  const handleEditPublication = (pub: Publication) => {
    // Navigate to editor with the project
    navigate(`/projects/${pub.projectId}/edit`)
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
              onEditPub={handleEditPublication}
              onDeletePub={handleDeletePublication}
              onReorderPubs={handleReorderPubs}
            />
          )
        })}
        
        {/* Uncategorized */}
        {uncategorizedPubs.length > 0 && (
          <div className="rounded-3xl p-6 bg-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📄</span>
              <h3 className="text-lg font-bold text-gray-900">Sem Categoria</h3>
              <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full text-gray-700">
                {uncategorizedPubs.length}
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {uncategorizedPubs.map(pub => (
                <div key={pub.id} className="relative group">
                  <Link to={`/docs/${pub.slug}`} className="block">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                      {pub.icon || '📄'}
                    </div>
                    <p className="mt-2 text-center text-sm font-medium text-gray-900 truncate max-w-[100px] mx-auto">
                      {pub.title}
                    </p>
                  </Link>
                  
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => handleEditPublication(pub)}
                      className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeletePublication(pub)}
                      className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-red-500"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {categories.length === 0 && uncategorizedPubs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma publicação ainda</h2>
            <p className="text-gray-600 mb-6">
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
