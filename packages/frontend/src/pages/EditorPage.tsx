import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Eye, Sparkles, Plus, Trash, 
  Loader2, FileText, Settings, CheckCircle2, Clock, Zap, AlertTriangle,
  GripVertical, GitCommit, RotateCcw, History, Check, X, ChevronUp, ChevronDown,
  RefreshCw, Globe, ExternalLink
} from 'lucide-react'
import { projectsApi, aiApi, publicationsApi, type Category } from '@/services/api'
import toast from 'react-hot-toast'
import AIChat from '@/components/AIChat'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DocumentSection {
  id: string
  type: string
  title: string
  content: unknown
  order: number
}

interface GenerationProgress {
  isGenerating: boolean
  currentSection: string
  currentIndex: number
  totalSections: number
  percent: number
  elapsed: number
  estimatedRemaining: number
  completedSections: string[]
  message: string
}

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero / Cabeçalho', icon: '🎯' },
  { type: 'overview', label: 'Visão Geral', icon: '📋' },
  { type: 'architecture', label: 'Arquitetura', icon: '🏗️' },
  { type: 'technologies', label: 'Tecnologias', icon: '⚙️' },
  { type: 'flow', label: 'Fluxo / Diagrama', icon: '🔄' },
  { type: 'comparison', label: 'Comparativo', icon: '📊' },
  { type: 'changelog', label: 'Release Notes', icon: '📝' },
  { type: 'faq', label: 'FAQ / Troubleshooting', icon: '❓' },
  { type: 'api', label: 'API / Endpoints', icon: '🔌' },
  { type: 'installation', label: 'Instalação', icon: '📦' },
  { type: 'custom', label: 'Seção Personalizada', icon: '✏️' },
]

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`
}

// =====================================================
// SORTABLE SECTION ITEM (Drag and Drop)
// =====================================================
interface SortableSectionItemProps {
  section: DocumentSection
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}

function SortableSectionItem({ section, isSelected, onSelect, onRemove }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-3 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-gray-200 bg-white'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab hover:bg-gray-100 rounded active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-lg">
            {SECTION_TYPES.find(s => s.type === section.type)?.icon || '📄'}
          </span>
          <span className="font-medium text-sm text-gray-900">{section.title}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Excluir seção"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showNavbarPreview, setShowNavbarPreview] = useState(true)
  const [commitMessage, setCommitMessage] = useState('')
  const [showCommitModal, setShowCommitModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    isGenerating: false,
    currentSection: '',
    currentIndex: 0,
    totalSections: 7,
    percent: 0,
    elapsed: 0,
    estimatedRemaining: 0,
    completedSections: [],
    message: ''
  })
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!).then(res => res.data),
    enabled: !!id,
  })
  
  // Fetch versions
  const { data: versions = [], refetch: refetchVersions } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => projectsApi.getVersions(id!).then(res => res.data),
    enabled: !!id,
  })
  
  // Fetch additional repositories
  // Fetch Git sync status
  const { data: syncStatus, refetch: refetchSync } = useQuery({
    queryKey: ['gitSync', id],
    queryFn: () => projectsApi.getSyncStatus(id!).then(res => res.data),
    enabled: !!id,
    refetchInterval: 60000, // Refetch every minute
  })
  
  // State for syncing
  const [isSyncing, setIsSyncing] = useState(false)
  const [showReleaseNotes, setShowReleaseNotes] = useState(false)
  
  // State for publication
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishData, setPublishData] = useState({
    slug: '',
    title: '',
    description: '',
    icon: '📄',
    categoryId: '',
    version: ''
  })
  const [isPublishing, setIsPublishing] = useState(false)
  
  // Fetch publication status
  const { data: publicationStatus, refetch: refetchPublicationStatus } = useQuery({
    queryKey: ['publicationStatus', id],
    queryFn: () => publicationsApi.getStatus(id!).then(res => res.data),
    enabled: !!id,
  })
  
  // Fetch categories for publication
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => publicationsApi.getCategories().then(res => res.data),
  })
  
  // State for collapsible panels
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({
    sections: false,
    versions: true,
    sync: false
  })
  
  const togglePanel = (panel: string) => {
    setCollapsedPanels(prev => ({ ...prev, [panel]: !prev[panel] }))
  }
  
  // Load sections from project when it loads
  useEffect(() => {
    if (project?.sections) {
      const loadedSections = typeof project.sections === 'string' 
        ? JSON.parse(project.sections) 
        : project.sections
      // Sort by order field to maintain correct ordering
      const sortedSections = [...loadedSections].sort((a: DocumentSection, b: DocumentSection) => 
        (a.order ?? 0) - (b.order ?? 0)
      )
      setSections(sortedSections)
      setHasUnsavedChanges(false)
    }
  }, [project])
  
  // Auto-save function
  const autoSave = useCallback(async (sectionsToSave: DocumentSection[]) => {
    if (!id) return
    setIsSaving(true)
    try {
      await projectsApi.update(id, { sections: JSON.stringify(sectionsToSave) } as any)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [id])
  
  // Debounced auto-save when sections change
  useEffect(() => {
    if (sections.length === 0) return
    if (!project) return
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (1.5 seconds debounce)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(sections)
    }, 1500)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [sections, autoSave, project])
  
  // Timer for elapsed time
  useEffect(() => {
    if (!generationProgress.isGenerating) return
    const interval = setInterval(() => {
      setGenerationProgress(prev => ({
        ...prev,
        elapsed: prev.elapsed + 1000
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [generationProgress.isGenerating])
  
  // Block navigation while generating - prevent user from leaving
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      generationProgress.isGenerating && currentLocation.pathname !== nextLocation.pathname
  )
  
  // Show warning when user tries to leave during generation
  useEffect(() => {
    if (!generationProgress.isGenerating) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'A geração de documentação está em andamento. Sair agora irá interromper o processo.'
      return e.returnValue
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [generationProgress.isGenerating])
  
  const startStreamGeneration = useCallback(() => {
    // For EventSource, we need the full URL. Use window.location.origin for relative URLs
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
    const eventSource = new EventSource(`${apiUrl}/api/ai/generate-stream/${id}`)
    
    setGenerationProgress({
      isGenerating: true,
      currentSection: '',
      currentIndex: 0,
      totalSections: 7,
      percent: 0,
      elapsed: 0,
      estimatedRemaining: 0,
      completedSections: [],
      message: 'Conectando...'
    })
    
    eventSource.addEventListener('start', (e) => {
      const data = JSON.parse(e.data)
      setGenerationProgress(prev => ({
        ...prev,
        totalSections: data.totalSections,
        message: data.message
      }))
    })
    
    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data)
      setGenerationProgress(prev => ({
        ...prev,
        percent: data.percent,
        message: data.message
      }))
    })
    
    eventSource.addEventListener('section-start', (e) => {
      const data = JSON.parse(e.data)
      setGenerationProgress(prev => ({
        ...prev,
        currentSection: data.title,
        currentIndex: data.index,
        percent: data.percent,
        message: data.message
      }))
    })
    
    eventSource.addEventListener('section-complete', (e) => {
      const data = JSON.parse(e.data)
      setSections(prev => {
        const exists = prev.find(s => s.type === data.section.type)
        if (exists) {
          return prev.map(s => s.type === data.section.type ? data.section : s)
        }
        return [...prev, data.section]
      })
      setGenerationProgress(prev => ({
        ...prev,
        completedSections: [...prev.completedSections, data.title],
        percent: data.percent,
        estimatedRemaining: data.estimatedRemaining
      }))
    })
    
    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data)
      eventSource.close()
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        percent: 100,
        message: data.message
      }))
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success(`${data.sectionsGenerated} seções geradas em ${formatTime(data.totalTime)}!`)
      // Navigate to preview
      setTimeout(() => {
        navigate(`/projects/${id}/preview`)
      }, 1500)
    })
    
    eventSource.addEventListener('error', (e) => {
      console.error('SSE Error:', e)
      eventSource.close()
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        message: 'Erro na geração'
      }))
      toast.error('Erro ao gerar documentação')
    })
    
    eventSource.onerror = () => {
      eventSource.close()
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false
      }))
    }
  }, [id, navigate, queryClient])
  
  const generateMutation = useMutation({
    mutationFn: ({ sectionType }: { sectionId: string; sectionType: string }) => 
      aiApi.generateSection(id!, sectionType, { project }),
    onSuccess: (response, { sectionId }) => {
      // Update existing section instead of creating a new one
      const updatedSections = sections.map(s => 
        s.id === sectionId 
          ? { ...s, title: response.data.title, content: response.data.content }
          : s
      )
      setSections(updatedSections)
      // Force immediate save after AI generation
      autoSave(updatedSections)
      toast.success('Seção preenchida com IA e salva!')
    },
    onError: () => toast.error('Erro ao gerar seção'),
  })
  
  const addSection = (type: string) => {
    const sectionInfo = SECTION_TYPES.find(s => s.type === type)
    const newSection: DocumentSection = {
      id: `section-${Date.now()}`,
      type,
      title: sectionInfo?.label || 'Nova Seção',
      content: {},
      order: sections.length,
    }
    setSections([...sections, newSection])
    setSelectedSection(newSection.id)
    setShowAddSection(false)
  }
  
  const removeSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    
    const confirmed = window.confirm(
      `Deseja excluir a seção "${section.title}"?\n\nEssa ação não pode ser desfeita (a menos que você tenha uma versão salva).`
    )
    
    if (!confirmed) return
    
    setSections(sections.filter(s => s.id !== sectionId))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }
    toast.success(`Seção "${section.title}" excluída`)
  }
  
  // Drag and Drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update order property
        newItems.forEach((s, i) => s.order = i)
        return newItems
      })
    }
  }
  
  // Commit (create version)
  const handleCommit = async () => {
    if (!id || !commitMessage.trim()) return
    
    try {
      await projectsApi.createVersion(id, commitMessage)
      toast.success(`Versão criada: "${commitMessage}"`)
      setCommitMessage('')
      setShowCommitModal(false)
      refetchVersions()
    } catch (error) {
      toast.error('Erro ao criar versão')
    }
  }
  
  // Checkout to version
  const handleCheckout = async (versionId: string, versionNum: number) => {
    if (!id) return
    
    const confirmed = window.confirm(
      `Deseja fazer checkout para a versão ${versionNum}?\n\nIsso substituirá o conteúdo atual. Um backup será criado automaticamente.`
    )
    
    if (!confirmed) return
    
    try {
      await projectsApi.checkout(id, versionId, true)
      toast.success(`Checkout para versão ${versionNum} realizado!`)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      refetchVersions()
    } catch (error) {
      toast.error('Erro ao fazer checkout')
    }
  }
  
  // Rollback to version
  const handleRollback = async (versionId: string, versionNum: number) => {
    if (!id) return
    
    const confirmed = window.confirm(
      `Deseja fazer rollback para a versão ${versionNum}?\n\nIsso criará uma nova versão com o conteúdo da versão ${versionNum}.`
    )
    
    if (!confirmed) return
    
    try {
      await projectsApi.rollback(id, versionId)
      toast.success(`Rollback para versão ${versionNum} realizado!`)
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      refetchVersions()
    } catch (error) {
      toast.error('Erro ao fazer rollback')
    }
  }
  
  // Sync with Gitea
  const handleSync = async () => {
    if (!id) return
    
    setIsSyncing(true)
    try {
      const result = await projectsApi.sync(id, true)
      
      if (result.data.upToDate) {
        toast.success('Já está sincronizado com a versão mais recente!')
      } else {
        toast.success(`Sincronizado! ${result.data.commitsIncluded || 0} commit(s) incluído(s)`)
        if (result.data.sync?.releaseNotes) {
          setShowReleaseNotes(true)
        }
      }
      
      refetchSync()
      refetchVersions()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">{project?.name || 'Novo Projeto'}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Editor de Documentação</span>
              {isSaving && (
                <span className="flex items-center gap-1 text-blue-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Salvando...
                </span>
              )}
              {!isSaving && lastSaved && !hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-green-500">
                  <Check className="w-3 h-3" />
                  Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {!isSaving && hasUnsavedChanges && (
                <span className="text-amber-500">• Alterações não salvas</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className={`btn ${showVersions ? 'btn-primary' : 'btn-secondary'}`}
            >
              <History className="w-4 h-4" />
              Versões
              {versions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
                  {versions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCommitModal(true)}
              className="btn btn-success"
            >
              <GitCommit className="w-4 h-4" />
              Commit
            </button>
            <button
              onClick={() => {
                // Pre-fill publish data
                setPublishData({
                  slug: publicationStatus?.publication?.slug || project?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
                  title: publicationStatus?.publication?.title || project?.name || '',
                  description: publicationStatus?.publication?.description || '',
                  icon: publicationStatus?.publication?.icon || '📄',
                  categoryId: publicationStatus?.publication?.categoryId || '',
                  version: publicationStatus?.publication?.version || '1.0.0'
                })
                setShowPublishModal(true)
              }}
              className={`btn ${publicationStatus?.isPublished ? 'btn-secondary' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'}`}
            >
              <Globe className="w-4 h-4" />
              {publicationStatus?.isPublished ? 'Atualizar' : 'Publicar'}
            </button>
            <button
              onClick={() => navigate(`/projects/${id}/preview`)}
              className="btn btn-secondary"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Collapsible Panels */}
          <div className="col-span-4">
            <div className="sticky top-40 space-y-3">
              
              {/* Sections Panel */}
              <div className="doc-card overflow-hidden">
                <button
                  onClick={() => togglePanel('sections')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Seções
                    <span className="text-xs text-gray-400 font-normal">({sections.length})</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setShowAddSection(!showAddSection) }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setShowAddSection(!showAddSection) } }}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </div>
                    {collapsedPanels.sections ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {!collapsedPanels.sections && (
                  <div className="p-3 pt-0 border-t border-gray-100">
              
              {/* NavBar Preview */}
              {sections.filter(s => s.type !== 'hero').length > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <button
                    onClick={() => setShowNavbarPreview(!showNavbarPreview)}
                    className="w-full text-xs font-medium text-gray-500 flex items-center justify-between hover:text-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <Eye className={`w-3 h-3 transition-opacity ${showNavbarPreview ? '' : 'opacity-50'}`} />
                      Preview da NavBar
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${showNavbarPreview ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                      {showNavbarPreview ? 'Visível' : 'Oculto'}
                    </span>
                  </button>
                  {showNavbarPreview && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sections
                        .filter(s => s.type !== 'hero')
                        .map((section) => (
                          <span
                            key={section.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-100"
                          >
                            <span>{SECTION_TYPES.find(s => s.type === section.type)?.icon || '📄'}</span>
                            <span className="truncate max-w-[80px]">{section.title}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Add Section Modal */}
              {showAddSection && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Adicionar Seção:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_TYPES.map((section) => (
                      <button
                        key={section.type}
                        onClick={() => addSection(section.type)}
                        className="flex items-center gap-2 p-2 text-left text-sm rounded-lg hover:bg-white transition-colors"
                      >
                        <span>{section.icon}</span>
                        <span className="truncate">{section.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gray-200 mt-3">
                    <button
                      onClick={() => startStreamGeneration()}
                      disabled={generationProgress.isGenerating}
                      className="w-full btn btn-success text-sm py-2"
                    >
                      {generationProgress.isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Automaticamente com IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Generation Progress Modal */}
              {generationProgress.isGenerating && (
                <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="font-semibold text-gray-900">Gerando Documentação</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                      style={{ width: `${generationProgress.percent}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">{generationProgress.percent}%</div>
                      <div className="text-xs text-gray-500">Progresso</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(generationProgress.elapsed)}
                      </div>
                      <div className="text-xs text-gray-500">Decorrido</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-purple-600">
                        ~{formatTime(generationProgress.estimatedRemaining)}
                      </div>
                      <div className="text-xs text-gray-500">Restante</div>
                    </div>
                  </div>
                  
                  {/* Current Section */}
                  <div className="text-sm text-gray-600 mb-2">
                    {generationProgress.message}
                  </div>
                  
                  {/* Completed Sections */}
                  <div className="space-y-1">
                    {generationProgress.completedSections.map((title, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sections List with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <SortableSectionItem
                        key={section.id}
                        section={section}
                        isSelected={selectedSection === section.id}
                        onSelect={() => setSelectedSection(section.id)}
                        onRemove={() => removeSection(section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
                
                {sections.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Nenhuma seção ainda</p>
                  </div>
                )}
                  </div>
                )}
              </div>
            
              {/* Versions Panel */}
              <div className="doc-card overflow-hidden">
                <button
                  onClick={() => togglePanel('versions')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Histórico
                    <span className="text-xs text-gray-400 font-normal">({versions.length})</span>
                  </h3>
                  {collapsedPanels.versions ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {!collapsedPanels.versions && (
                  <div className="p-3 pt-0 border-t border-gray-100 max-h-[200px] overflow-y-auto">
                {versions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <GitCommit className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Nenhuma versão ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {versions.slice(0, 5).map((version) => (
                      <div
                        key={version.id}
                        className="p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                v{version.version}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(version.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                              {version.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCheckout(version.id, version.version)}
                              className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                              title="Checkout"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRollback(version.id, version.version)}
                              className="p-1.5 hover:bg-amber-100 rounded text-amber-600"
                              title="Rollback"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                )}
              </div>
            
              {/* Git Sync Panel */}
              <div className="doc-card overflow-hidden">
                <button
                  onClick={() => togglePanel('sync')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sincronização Git
                    {syncStatus?.hasPendingChanges && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); if (!isSyncing && syncStatus?.hasPendingChanges) handleSync() }}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isSyncing && syncStatus?.hasPendingChanges) { e.stopPropagation(); handleSync() } }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                        syncStatus?.hasPendingChanges 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={syncStatus?.hasPendingChanges ? 'Sincronizar' : 'Atualizado'}
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </div>
                    {collapsedPanels.sync ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {!collapsedPanels.sync && (
                  <div className="p-3 pt-0 border-t border-gray-100">
              
              {/* Sync Status */}
              {syncStatus?.hasPendingChanges && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {syncStatus.pendingCommits.length} commit(s) pendente(s)
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {syncStatus.pendingCommits.slice(0, 5).map((commit) => (
                      <div key={commit.sha} className="text-xs text-amber-600 truncate flex items-center gap-1">
                        <GitCommit className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{commit.message.split('\n')[0]}</span>
                      </div>
                    ))}
                    {syncStatus.pendingCommits.length > 5 && (
                      <p className="text-xs text-amber-500">
                        +{syncStatus.pendingCommits.length - 5} mais commits...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {!syncStatus?.hasPendingChanges && syncStatus?.lastSync && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Sincronizado</span>
                  </div>
                </div>
              )}
              
              {/* Last Sync Info */}
              {syncStatus?.lastSync ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                            {syncStatus.lastSync.version || 'v?'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(syncStatus.lastSync.syncedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate">
                          {syncStatus.lastSync.commitMessage.split('\n')[0]}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          por {syncStatus.lastSync.commitAuthor}
                        </p>
                      </div>
                      {syncStatus.lastSync.releaseNotes && (
                        <button
                          onClick={() => setShowReleaseNotes(true)}
                          className="p-1.5 hover:bg-gray-200 rounded text-gray-500"
                          title="Ver Release Notes"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Sync History */}
                  {syncStatus.syncHistory.length > 1 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Histórico de sincronizações ({syncStatus.syncHistory.length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {syncStatus.syncHistory.slice(1, 6).map((sync) => (
                          <div key={sync.id} className="flex items-center gap-2 text-gray-500 py-1">
                            <GitCommit className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate flex-1">{sync.commitMessage.split('\n')[0]}</span>
                            <span className="text-gray-400 flex-shrink-0">
                              {new Date(sync.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <RefreshCw className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Nenhuma sincronização ainda</p>
                </div>
              )}
                  </div>
                )}
              </div>

            </div>
          </div>
          
          {/* Main Editor Area */}
          <div className="col-span-8">
            {selectedSection ? (
              <SectionEditor
                section={sections.find(s => s.id === selectedSection)!}
                onUpdate={(updated) => {
                  setSections(sections.map(s => s.id === updated.id ? updated : s))
                }}
                onGenerateWithAI={() => {
                  const section = sections.find(s => s.id === selectedSection)
                  if (section) {
                    generateMutation.mutate({ sectionId: section.id, sectionType: section.type })
                  }
                }}
                isGenerating={generateMutation.isPending}
              />
            ) : (
              <div className="doc-card p-12 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selecione uma seção para editar
                </h3>
                <p className="text-gray-500 mb-6">
                  Ou adicione uma nova seção usando o botão + na barra lateral
                </p>
                <button
                  onClick={() => setShowAddSection(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Primeira Seção
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Chat */}
      {project && (
        <AIChat projectId={id!} projectName={project.name} />
      )}
      
      {/* Navigation Block Modal - appears when user tries to leave during generation */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            {/* Header with warning */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Geração em Andamento</h3>
                  <p className="text-white/80 text-sm">A documentação está sendo gerada</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-gray-700 mb-4">
                <strong>Atenção!</strong> Se você sair agora, o processo de geração será interrompido e 
                você perderá o progresso atual.
              </p>
              
              {/* Current progress */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-900">{generationProgress.currentSection}</span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${generationProgress.percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-blue-600">
                  <span>{generationProgress.percent}% concluído</span>
                  <span>~{formatTime(generationProgress.estimatedRemaining)} restante</span>
                </div>
              </div>
              
              <p className="text-gray-500 text-sm">
                Recomendamos aguardar a conclusão para garantir que toda a documentação seja gerada corretamente.
              </p>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => blocker.reset?.()}
                className="flex-1 btn btn-primary"
              >
                <Zap className="w-4 h-4" />
                Continuar Gerando
              </button>
              <button
                onClick={() => blocker.proceed?.()}
                className="btn btn-secondary text-red-600 hover:bg-red-50"
              >
                Sair Mesmo Assim
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Commit Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCommitModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <GitCommit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Criar Nova Versão</h3>
                  <p className="text-white/80 text-sm">Salve o estado atual da documentação</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem do Commit
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Ex: Adicionado seção de FAQ, corrigido diagrama..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commitMessage.trim()) {
                    handleCommit()
                  }
                }}
              />
              <p className="text-xs text-gray-400 mt-2">
                Descreva as alterações feitas nesta versão
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                className="flex-1 btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GitCommit className="w-4 h-4" />
                Criar Versão
              </button>
              <button
                onClick={() => {
                  setShowCommitModal(false)
                  setCommitMessage('')
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Release Notes Modal */}
      {showReleaseNotes && syncStatus?.lastSync?.releaseNotes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReleaseNotes(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Release Notes</h3>
                  <p className="text-white/80 text-sm">
                    Versão {syncStatus.lastSync.version || 'N/A'} - {new Date(syncStatus.lastSync.syncedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: syncStatus.lastSync.releaseNotes
                    .replace(/\n/g, '<br/>')
                    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                    .replace(/^### (.+)$/gm, '<h4 class="font-medium mt-3 mb-1">$1</h4>')
                    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                    .replace(/✨/g, '<span class="text-yellow-500">✨</span>')
                    .replace(/🐛/g, '<span class="text-red-500">🐛</span>')
                    .replace(/🔧/g, '<span class="text-blue-500">🔧</span>')
                    .replace(/⚠️/g, '<span class="text-orange-500">⚠️</span>')
                }} />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <GitCommit className="w-3 h-3 inline mr-1" />
                {syncStatus.lastSync.commitSha.slice(0, 7)} por {syncStatus.lastSync.commitAuthor}
              </div>
              <button
                onClick={() => setShowReleaseNotes(false)}
                className="btn btn-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {publicationStatus?.isPublished ? 'Atualizar Publicação' : 'Publicar Documentação'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {publicationStatus?.isPublished 
                      ? 'Atualize a documentação pública'
                      : 'Torne a documentação acessível publicamente'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* URL Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Documentação
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/docs/</span>
                  <input
                    type="text"
                    value={publishData.slug}
                    onChange={(e) => setPublishData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="nome-do-sistema"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  URL final: /docs/{publishData.slug || 'nome-do-sistema'}
                </p>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={publishData.title}
                  onChange={(e) => setPublishData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Nome do Sistema"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição Curta
                </label>
                <textarea
                  value={publishData.description}
                  onChange={(e) => setPublishData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Uma breve descrição do sistema..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              
              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ícone
                </label>
                <div className="flex flex-wrap gap-2">
                  {['📄', '🚗', '💳', '📊', '🔧', '📱', '🖥️', '🗄️', '🔐', '📈', '🎯', '⚡'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setPublishData(p => ({ ...p, icon }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        publishData.icon === icon 
                          ? 'bg-emerald-100 ring-2 ring-emerald-500' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={publishData.categoryId}
                  onChange={(e) => setPublishData(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat: Category) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Agrupe sistemas por categoria para facilitar a navegação
                </p>
              </div>
              
              {/* Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Versão
                </label>
                <input
                  type="text"
                  value={publishData.version}
                  onChange={(e) => setPublishData(p => ({ ...p, version: e.target.value }))}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                />
              </div>
              
              {/* Warning for existing publication */}
              {publicationStatus?.isPublished && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Esta documentação já está publicada. Atualizar irá substituir a versão atual.
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={async () => {
                  if (!id || !publishData.slug.trim() || !publishData.title.trim()) {
                    toast.error('Preencha o URL e o título')
                    return
                  }
                  
                  setIsPublishing(true)
                  try {
                    const result = await publicationsApi.publish(id, {
                      slug: publishData.slug,
                      title: publishData.title,
                      description: publishData.description,
                      icon: publishData.icon,
                      categoryId: publishData.categoryId || undefined,
                      version: publishData.version
                    })
                    
                    toast.success(
                      publicationStatus?.isPublished 
                        ? 'Publicação atualizada!' 
                        : 'Documentação publicada!'
                    )
                    
                    refetchPublicationStatus()
                    setShowPublishModal(false)
                    
                    // Show link to published doc
                    toast((t) => (
                      <div className="flex items-center gap-3">
                        <span>Acessar:</span>
                        <a 
                          href={result.data.publicUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 font-medium underline flex items-center gap-1"
                          onClick={() => toast.dismiss(t.id)}
                        >
                          {result.data.publicUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ), { duration: 10000 })
                    
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Erro ao publicar')
                  } finally {
                    setIsPublishing(false)
                  }
                }}
                disabled={isPublishing || !publishData.slug.trim() || !publishData.title.trim()}
                className="flex-1 btn bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                {publicationStatus?.isPublished ? 'Atualizar Publicação' : 'Publicar'}
              </button>
              <button
                onClick={() => setShowPublishModal(false)}
                className="btn btn-secondary"
                disabled={isPublishing}
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

// Section Editor Component
interface SectionEditorProps {
  section: DocumentSection
  onUpdate: (section: DocumentSection) => void
  onGenerateWithAI: () => void
  isGenerating: boolean
}

// =====================================================
// OVERVIEW EDITOR
// =====================================================
interface OverviewContent {
  description?: string
  objectives?: string[]
  targetAudience?: string
  benefits?: Array<{ title: string; description: string; icon: string }>
}

function OverviewEditor({ 
  content, 
  onChange 
}: { 
  content: OverviewContent
  onChange: (content: OverviewContent) => void 
}) {
  const [localContent, setLocalContent] = useState<OverviewContent>({
    description: content?.description || '',
    objectives: content?.objectives || [''],
    targetAudience: content?.targetAudience || '',
    benefits: content?.benefits || [{ title: '', description: '', icon: '✨' }]
  })

  useEffect(() => {
    setLocalContent({
      description: content?.description || '',
      objectives: content?.objectives || [''],
      targetAudience: content?.targetAudience || '',
      benefits: content?.benefits || [{ title: '', description: '', icon: '✨' }]
    })
  }, [content])

  const updateField = <K extends keyof OverviewContent>(field: K, value: OverviewContent[K]) => {
    const updated = { ...localContent, [field]: value }
    setLocalContent(updated)
    onChange(updated)
  }

  const addObjective = () => {
    const objectives = [...(localContent.objectives || []), '']
    updateField('objectives', objectives)
  }

  const updateObjective = (index: number, value: string) => {
    const objectives = [...(localContent.objectives || [])]
    objectives[index] = value
    updateField('objectives', objectives)
  }

  const removeObjective = (index: number) => {
    const objectives = (localContent.objectives || []).filter((_, i) => i !== index)
    updateField('objectives', objectives.length > 0 ? objectives : [''])
  }

  const addBenefit = () => {
    const benefits = [...(localContent.benefits || []), { title: '', description: '', icon: '✨' }]
    updateField('benefits', benefits)
  }

  const updateBenefit = (index: number, field: 'title' | 'description' | 'icon', value: string) => {
    const benefits = [...(localContent.benefits || [])]
    benefits[index] = { ...benefits[index], [field]: value }
    updateField('benefits', benefits)
  }

  const removeBenefit = (index: number) => {
    const benefits = (localContent.benefits || []).filter((_, i) => i !== index)
    updateField('benefits', benefits.length > 0 ? benefits : [{ title: '', description: '', icon: '✨' }])
  }

  const EMOJI_OPTIONS = ['✨', '🚀', '💡', '🎯', '⚡', '🔒', '📈', '💰', '🛡️', '🔧', '📊', '🌐', '⏱️', '🤝', '📱', '💻']

  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Descrição do Projeto
        </label>
        <textarea
          value={localContent.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Descreva o projeto de forma clara e detalhada..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          rows={4}
        />
        <p className="text-xs text-gray-400 mt-1">
          Descreva em 2-3 parágrafos o que o sistema faz e seu propósito principal.
        </p>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          👥 Público-Alvo
        </label>
        <input
          type="text"
          value={localContent.targetAudience || ''}
          onChange={(e) => updateField('targetAudience', e.target.value)}
          placeholder="Ex: Desenvolvedores, Gestores de Estacionamento, Operadores..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Objectives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            🎯 Objetivos Principais
          </label>
          <button
            type="button"
            onClick={addObjective}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {(localContent.objectives || ['']).map((objective, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
              <input
                type="text"
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder="Descreva um objetivo do projeto..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => removeObjective(index)}
                className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                disabled={(localContent.objectives || []).length <= 1}
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            ⭐ Benefícios
          </label>
          <button
            type="button"
            onClick={addBenefit}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
        <div className="space-y-4">
          {(localContent.benefits || []).map((benefit, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
              <div className="flex items-start gap-3">
                {/* Icon Selector */}
                <div className="relative">
                  <div className="w-12 h-12 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center text-2xl cursor-pointer hover:border-primary transition-colors group/emoji">
                    {benefit.icon || '✨'}
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 hidden group-hover/emoji:grid grid-cols-4 gap-1 z-10 min-w-[160px]">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => updateBenefit(index, 'icon', emoji)}
                          className="w-8 h-8 text-xl hover:bg-gray-100 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={benefit.title}
                    onChange={(e) => updateBenefit(index, 'title', e.target.value)}
                    placeholder="Título do benefício"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium transition-all"
                  />
                  <textarea
                    value={benefit.description}
                    onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                    placeholder="Descrição do benefício..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none transition-all"
                    rows={2}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => removeBenefit(index)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  disabled={(localContent.benefits || []).length <= 1}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// HERO EDITOR
// =====================================================
interface HeroContent {
  title?: string
  subtitle?: string
  projectName?: string
}

function HeroEditor({ 
  content, 
  onChange 
}: { 
  content: HeroContent
  onChange: (content: HeroContent) => void 
}) {
  const [localContent, setLocalContent] = useState<HeroContent>({
    title: content?.title || '',
    subtitle: content?.subtitle || '',
    projectName: content?.projectName || ''
  })

  useEffect(() => {
    setLocalContent({
      title: content?.title || '',
      subtitle: content?.subtitle || '',
      projectName: content?.projectName || ''
    })
  }, [content])

  const updateField = <K extends keyof HeroContent>(field: K, value: HeroContent[K]) => {
    const updated = { ...localContent, [field]: value }
    setLocalContent(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🏷️ Nome do Projeto
        </label>
        <input
          type="text"
          value={localContent.projectName || ''}
          onChange={(e) => updateField('projectName', e.target.value)}
          placeholder="Ex: DocuMentor, Zeus, MoveMais..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🎯 Título Principal
        </label>
        <input
          type="text"
          value={localContent.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Título chamativo para o hero..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg font-semibold"
        />
        <p className="text-xs text-gray-400 mt-1">
          Um título impactante que resume o propósito do projeto.
        </p>
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Subtítulo / Descrição Curta
        </label>
        <textarea
          value={localContent.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          placeholder="Uma breve descrição do que o projeto faz..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          rows={3}
        />
        <p className="text-xs text-gray-400 mt-1">
          Complemento do título que explica o projeto em 1-2 frases.
        </p>
      </div>
    </div>
  )
}

// =====================================================
// ARCHITECTURE EDITOR
// =====================================================
interface ArchitectureContent {
  description?: string
  pattern?: string
  layers?: Array<{ name: string; description: string; components?: string[] }>
}

function ArchitectureEditor({ 
  content, 
  onChange 
}: { 
  content: ArchitectureContent
  onChange: (content: ArchitectureContent) => void 
}) {
  const [localContent, setLocalContent] = useState<ArchitectureContent>({
    description: content?.description || '',
    pattern: content?.pattern || '',
    layers: content?.layers || [{ name: '', description: '', components: [''] }]
  })

  useEffect(() => {
    setLocalContent({
      description: content?.description || '',
      pattern: content?.pattern || '',
      layers: content?.layers || [{ name: '', description: '', components: [''] }]
    })
  }, [content])

  const updateField = <K extends keyof ArchitectureContent>(field: K, value: ArchitectureContent[K]) => {
    const updated = { ...localContent, [field]: value }
    setLocalContent(updated)
    onChange(updated)
  }

  const addLayer = () => {
    const layers = [...(localContent.layers || []), { name: '', description: '', components: [''] }]
    updateField('layers', layers)
  }

  const updateLayer = (index: number, field: 'name' | 'description', value: string) => {
    const layers = [...(localContent.layers || [])]
    layers[index] = { ...layers[index], [field]: value }
    updateField('layers', layers)
  }

  const updateLayerComponent = (layerIndex: number, compIndex: number, value: string) => {
    const layers = [...(localContent.layers || [])]
    const components = [...(layers[layerIndex].components || [])]
    components[compIndex] = value
    layers[layerIndex] = { ...layers[layerIndex], components }
    updateField('layers', layers)
  }

  const addLayerComponent = (layerIndex: number) => {
    const layers = [...(localContent.layers || [])]
    layers[layerIndex] = { 
      ...layers[layerIndex], 
      components: [...(layers[layerIndex].components || []), ''] 
    }
    updateField('layers', layers)
  }

  const removeLayerComponent = (layerIndex: number, compIndex: number) => {
    const layers = [...(localContent.layers || [])]
    const components = (layers[layerIndex].components || []).filter((_, i) => i !== compIndex)
    layers[layerIndex] = { ...layers[layerIndex], components: components.length > 0 ? components : [''] }
    updateField('layers', layers)
  }

  const removeLayer = (index: number) => {
    const layers = (localContent.layers || []).filter((_, i) => i !== index)
    updateField('layers', layers.length > 0 ? layers : [{ name: '', description: '', components: [''] }])
  }

  const PATTERN_OPTIONS = ['MVC', 'MVVM', 'Clean Architecture', 'Hexagonal', 'Microservices', 'Monolith', 'Event-Driven', 'Layered']

  return (
    <div className="space-y-6">
      {/* Pattern */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🏛️ Padrão Arquitetural
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PATTERN_OPTIONS.map(pattern => (
            <button
              key={pattern}
              type="button"
              onClick={() => updateField('pattern', pattern)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                localContent.pattern === pattern
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pattern}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={localContent.pattern || ''}
          onChange={(e) => updateField('pattern', e.target.value)}
          placeholder="Ou digite um padrão personalizado..."
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Descrição da Arquitetura
        </label>
        <textarea
          value={localContent.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Descreva a arquitetura do sistema..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          rows={3}
        />
      </div>

      {/* Layers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            📦 Camadas / Módulos
          </label>
          <button
            type="button"
            onClick={addLayer}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Camada
          </button>
        </div>
        <div className="space-y-4">
          {(localContent.layers || []).map((layer, layerIndex) => (
            <div key={layerIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => updateLayer(layerIndex, 'name', e.target.value)}
                    placeholder="Nome da camada (ex: Presentation Layer)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium transition-all"
                  />
                  <textarea
                    value={layer.description}
                    onChange={(e) => updateLayer(layerIndex, 'description', e.target.value)}
                    placeholder="Descrição e responsabilidades..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none transition-all"
                    rows={2}
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">Componentes:</span>
                      <button
                        type="button"
                        onClick={() => addLayerComponent(layerIndex)}
                        className="text-xs text-primary hover:text-primary-dark"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(layer.components || []).map((comp, compIndex) => (
                        <div key={compIndex} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                          <input
                            type="text"
                            value={comp}
                            onChange={(e) => updateLayerComponent(layerIndex, compIndex, e.target.value)}
                            placeholder="Componente..."
                            className="w-24 text-xs border-none bg-transparent focus:ring-0 p-0"
                          />
                          <button
                            type="button"
                            onClick={() => removeLayerComponent(layerIndex, compIndex)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeLayer(layerIndex)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  disabled={(localContent.layers || []).length <= 1}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// TECHNOLOGIES EDITOR
// =====================================================
interface TechItem {
  name: string
  version?: string
  description?: string
  icon?: string
}

interface TechCategory {
  category: string
  items: TechItem[]
}

interface TechnologiesContent {
  description?: string
  categories?: TechCategory[]
}

function TechnologiesEditor({ 
  content, 
  onChange 
}: { 
  content: TechnologiesContent
  onChange: (content: TechnologiesContent) => void 
}) {
  const [localContent, setLocalContent] = useState<TechnologiesContent>({
    description: content?.description || '',
    categories: content?.categories || [{ category: '', items: [{ name: '', version: '', description: '' }] }]
  })

  useEffect(() => {
    setLocalContent({
      description: content?.description || '',
      categories: content?.categories || [{ category: '', items: [{ name: '', version: '', description: '' }] }]
    })
  }, [content])

  const updateField = <K extends keyof TechnologiesContent>(field: K, value: TechnologiesContent[K]) => {
    const updated = { ...localContent, [field]: value }
    setLocalContent(updated)
    onChange(updated)
  }

  const addCategory = () => {
    const categories = [...(localContent.categories || []), { category: '', items: [{ name: '', version: '', description: '' }] }]
    updateField('categories', categories)
  }

  const updateCategoryName = (index: number, name: string) => {
    const categories = [...(localContent.categories || [])]
    categories[index] = { ...categories[index], category: name }
    updateField('categories', categories)
  }

  const addTechItem = (catIndex: number) => {
    const categories = [...(localContent.categories || [])]
    categories[catIndex] = { 
      ...categories[catIndex], 
      items: [...categories[catIndex].items, { name: '', version: '', description: '' }]
    }
    updateField('categories', categories)
  }

  const updateTechItem = (catIndex: number, itemIndex: number, field: keyof TechItem, value: string) => {
    const categories = [...(localContent.categories || [])]
    const items = [...categories[catIndex].items]
    items[itemIndex] = { ...items[itemIndex], [field]: value }
    categories[catIndex] = { ...categories[catIndex], items }
    updateField('categories', categories)
  }

  const removeTechItem = (catIndex: number, itemIndex: number) => {
    const categories = [...(localContent.categories || [])]
    const items = categories[catIndex].items.filter((_, i) => i !== itemIndex)
    categories[catIndex] = { 
      ...categories[catIndex], 
      items: items.length > 0 ? items : [{ name: '', version: '', description: '' }]
    }
    updateField('categories', categories)
  }

  const removeCategory = (index: number) => {
    const categories = (localContent.categories || []).filter((_, i) => i !== index)
    updateField('categories', categories.length > 0 ? categories : [{ category: '', items: [{ name: '', version: '', description: '' }] }])
  }

  const CATEGORY_SUGGESTIONS = ['Frontend', 'Backend', 'Database', 'DevOps', 'Testing', 'Tools', 'Cloud', 'Mobile']

  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Descrição Geral
        </label>
        <textarea
          value={localContent.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Visão geral das tecnologias utilizadas..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          rows={2}
        />
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            ⚙️ Categorias de Tecnologias
          </label>
          <button
            type="button"
            onClick={addCategory}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Categoria
          </button>
        </div>
        
        {/* Category Suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORY_SUGGESTIONS.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                const exists = (localContent.categories || []).some(c => c.category === cat)
                if (!exists) {
                  const categories = [...(localContent.categories || []), { category: cat, items: [{ name: '', version: '', description: '' }] }]
                  updateField('categories', categories)
                }
              }}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-primary/10 hover:text-primary transition-all"
            >
              + {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {(localContent.categories || []).map((category, catIndex) => (
            <div key={catIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  value={category.category}
                  onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                  placeholder="Nome da categoria (ex: Frontend)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-semibold transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeCategory(catIndex)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  disabled={(localContent.categories || []).length <= 1}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {(category.items || []).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateTechItem(catIndex, itemIndex, 'name', e.target.value)}
                      placeholder="Tecnologia"
                      className="flex-1 px-2 py-1 border-none bg-transparent focus:ring-0 text-sm font-medium"
                    />
                    <input
                      type="text"
                      value={item.version || ''}
                      onChange={(e) => updateTechItem(catIndex, itemIndex, 'version', e.target.value)}
                      placeholder="v1.0.0"
                      className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-center"
                    />
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => updateTechItem(catIndex, itemIndex, 'description', e.target.value)}
                      placeholder="Descrição breve..."
                      className="flex-1 px-2 py-1 border-none bg-transparent focus:ring-0 text-sm text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeTechItem(catIndex, itemIndex)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTechItem(catIndex)}
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-all"
                >
                  + Adicionar Tecnologia
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// FLOW EDITOR
// =====================================================
interface FlowStep {
  id: string
  title: string
  description?: string
  type?: string
  icon?: string
}

interface FlowStep {
  id: string
  title: string
  description?: string
  icon?: string
  type?: string
  variant?: string
}

interface SingleFlow {
  id: string
  title: string
  description?: string
  icon?: string
  steps: FlowStep[]
}

interface FlowContent {
  title?: string
  description?: string
  steps?: FlowStep[]
  flows?: SingleFlow[]
}

function FlowEditor({ 
  content, 
  onChange 
}: { 
  content: FlowContent
  onChange: (content: FlowContent) => void 
}) {
  // Support both old format (single flow with steps) and new format (multiple flows)
  const hasMultipleFlows = Array.isArray(content?.flows) && content.flows.length > 0
  
  const [localContent, setLocalContent] = useState<FlowContent>(() => {
    if (hasMultipleFlows) {
      return { flows: content.flows }
    }
    // Convert old format to new format with single flow
    return {
      flows: [{
        id: 'flow-1',
        title: content?.title || 'Fluxo Principal',
        description: content?.description || '',
        icon: '🔄',
        steps: content?.steps || [{ id: 'step-1', title: '', description: '', type: 'process' }]
      }]
    }
  })
  
  const [activeFlowIndex, setActiveFlowIndex] = useState(0)

  useEffect(() => {
    if (Array.isArray(content?.flows) && content.flows.length > 0) {
      setLocalContent({ flows: content.flows })
    } else if (content?.steps) {
      // Convert old format
      setLocalContent({
        flows: [{
          id: 'flow-1',
          title: content?.title || 'Fluxo Principal',
          description: content?.description || '',
          icon: '🔄',
          steps: content.steps
        }]
      })
    }
  }, [content])

  const updateContent = (newContent: FlowContent) => {
    setLocalContent(newContent)
    onChange(newContent)
  }

  const addFlow = () => {
    const flows = [...(localContent.flows || []), {
      id: `flow-${Date.now()}`,
      title: 'Novo Fluxo',
      description: '',
      icon: '🔄',
      steps: [{ id: `step-${Date.now()}`, title: '', description: '', type: 'start' }]
    }]
    updateContent({ flows })
    setActiveFlowIndex(flows.length - 1)
  }

  const removeFlow = (index: number) => {
    if ((localContent.flows || []).length <= 1) return
    const flows = (localContent.flows || []).filter((_, i) => i !== index)
    updateContent({ flows })
    if (activeFlowIndex >= flows.length) {
      setActiveFlowIndex(flows.length - 1)
    }
  }

  const updateFlow = (index: number, field: keyof SingleFlow, value: any) => {
    const flows = [...(localContent.flows || [])]
    flows[index] = { ...flows[index], [field]: value }
    updateContent({ flows })
  }

  const addStep = (flowIndex: number) => {
    const flows = [...(localContent.flows || [])]
    const steps = [...flows[flowIndex].steps, { id: `step-${Date.now()}`, title: '', description: '', type: 'process' }]
    flows[flowIndex] = { ...flows[flowIndex], steps }
    updateContent({ flows })
  }

  const updateStep = (flowIndex: number, stepIndex: number, field: keyof FlowStep, value: string) => {
    const flows = [...(localContent.flows || [])]
    const steps = [...flows[flowIndex].steps]
    steps[stepIndex] = { ...steps[stepIndex], [field]: value }
    flows[flowIndex] = { ...flows[flowIndex], steps }
    updateContent({ flows })
  }

  const removeStep = (flowIndex: number, stepIndex: number) => {
    const flows = [...(localContent.flows || [])]
    const steps = flows[flowIndex].steps.filter((_, i) => i !== stepIndex)
    flows[flowIndex] = { ...flows[flowIndex], steps: steps.length > 0 ? steps : [{ id: 'step-1', title: '', description: '', type: 'process' }] }
    updateContent({ flows })
  }

  const moveStep = (flowIndex: number, stepIndex: number, direction: 'up' | 'down') => {
    const flows = [...(localContent.flows || [])]
    const steps = [...flows[flowIndex].steps]
    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
    if (newIndex < 0 || newIndex >= steps.length) return
    [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]]
    flows[flowIndex] = { ...flows[flowIndex], steps }
    updateContent({ flows })
  }

  const STEP_TYPES = [
    { value: 'start', label: 'Início', icon: '▶️' },
    { value: 'process', label: 'Processo', icon: '⚙️' },
    { value: 'decision', label: 'Decisão', icon: '🔀' },
    { value: 'database', label: 'Banco de Dados', icon: '🗄️' },
    { value: 'success', label: 'Sucesso', icon: '✅' },
    { value: 'error', label: 'Erro', icon: '❌' },
    { value: 'end', label: 'Fim', icon: '🏁' },
    { value: 'camera', label: 'Câmera/OCR', icon: '📷' },
    { value: 'vehicle', label: 'Veículo', icon: '🚗' },
    { value: 'system', label: 'Sistema', icon: '💻' },
  ]

  const FLOW_ICONS = ['🔄', '🚗', '🚙', '💳', '🔐', '📊', '📧', '⚡', '🔔', '🔁', '⬆️', '⬇️', '❌']

  const activeFlow = (localContent.flows || [])[activeFlowIndex]

  return (
    <div className="space-y-6">
      {/* Flow Tabs */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-gray-200">
        {(localContent.flows || []).map((flow, index) => (
          <button
            key={flow.id}
            onClick={() => setActiveFlowIndex(index)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              index === activeFlowIndex
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{flow.icon || '🔄'}</span>
            <span className="truncate max-w-[120px]">{flow.title || `Fluxo ${index + 1}`}</span>
            {(localContent.flows || []).length > 1 && index === activeFlowIndex && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFlow(index)
                }}
                className="ml-1 p-1 hover:bg-white/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
        <button
          onClick={addFlow}
          className="px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Novo Fluxo
        </button>
      </div>

      {activeFlow && (
        <>
          {/* Flow Header */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ícone</label>
              <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-xl border border-gray-200">
                {FLOW_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => updateFlow(activeFlowIndex, 'icon', icon)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      activeFlow.icon === icon ? 'bg-primary text-white' : 'hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Título do Fluxo
              </label>
              <input
                type="text"
                value={activeFlow.title || ''}
                onChange={(e) => updateFlow(activeFlowIndex, 'title', e.target.value)}
                placeholder="Ex: Fluxo de Entrada"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={activeFlow.description || ''}
                onChange={(e) => updateFlow(activeFlowIndex, 'description', e.target.value)}
                placeholder="Descreva este fluxo..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                📊 Etapas do Fluxo ({activeFlow.steps?.length || 0})
              </label>
              <button
                type="button"
                onClick={() => addStep(activeFlowIndex)}
                className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Etapa
              </button>
            </div>
            <div className="space-y-3">
              {(activeFlow.steps || []).map((step, index) => (
                <div key={step.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(activeFlowIndex, index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-gray-400 text-center">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => moveStep(activeFlowIndex, index, 'down')}
                        disabled={index === (activeFlow.steps || []).length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={step.type || 'process'}
                          onChange={(e) => updateStep(activeFlowIndex, index, 'type', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          {STEP_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(activeFlowIndex, index, 'title', e.target.value)}
                          placeholder="Título da etapa"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium transition-all"
                        />
                      </div>
                      <textarea
                        value={step.description || ''}
                        onChange={(e) => updateStep(activeFlowIndex, index, 'description', e.target.value)}
                        placeholder="Descrição da etapa..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none transition-all"
                        rows={2}
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeStep(activeFlowIndex, index)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      disabled={(activeFlow.steps || []).length <= 1}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =====================================================
// FAQ EDITOR
// =====================================================
interface FAQQuestion {
  question: string
  answer: string
  category?: string
}

interface FAQContent {
  questions?: FAQQuestion[]
}

function FAQEditor({ 
  content, 
  onChange 
}: { 
  content: FAQContent
  onChange: (content: FAQContent) => void 
}) {
  const [localContent, setLocalContent] = useState<FAQContent>({
    questions: content?.questions || [{ question: '', answer: '', category: '' }]
  })

  useEffect(() => {
    setLocalContent({
      questions: content?.questions || [{ question: '', answer: '', category: '' }]
    })
  }, [content])

  const updateQuestions = (questions: FAQQuestion[]) => {
    const updated = { ...localContent, questions }
    setLocalContent(updated)
    onChange(updated)
  }

  const addQuestion = () => {
    const questions = [...(localContent.questions || []), { question: '', answer: '', category: '' }]
    updateQuestions(questions)
  }

  const updateQuestion = (index: number, field: keyof FAQQuestion, value: string) => {
    const questions = [...(localContent.questions || [])]
    questions[index] = { ...questions[index], [field]: value }
    updateQuestions(questions)
  }

  const removeQuestion = (index: number) => {
    const questions = (localContent.questions || []).filter((_, i) => i !== index)
    updateQuestions(questions.length > 0 ? questions : [{ question: '', answer: '', category: '' }])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          ❓ Perguntas Frequentes
        </label>
        <button
          type="button"
          onClick={addQuestion}
          className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Pergunta
        </button>
      </div>
      
      <div className="space-y-4">
        {(localContent.questions || []).map((q, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
            <div className="flex items-start gap-3">
              <span className="text-lg font-bold text-gray-300 mt-2">{index + 1}</span>
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                  placeholder="Qual é a pergunta?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium transition-all"
                />
                <textarea
                  value={q.answer}
                  onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                  placeholder="Digite a resposta detalhada..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none transition-all"
                  rows={3}
                />
                <input
                  type="text"
                  value={q.category || ''}
                  onChange={(e) => updateQuestion(index, 'category', e.target.value)}
                  placeholder="Categoria (opcional): Instalação, Uso, Deploy..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-xs transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                disabled={(localContent.questions || []).length <= 1}
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// INSTALLATION EDITOR
// =====================================================
interface InstallStep {
  title: string
  description?: string
  commands?: string[]
  notes?: string
}

interface InstallRequirement {
  name: string
  version?: string
  required?: boolean
}

interface InstallationContent {
  description?: string
  requirements?: InstallRequirement[]
  steps?: InstallStep[]
}

function InstallationEditor({ 
  content, 
  onChange 
}: { 
  content: InstallationContent
  onChange: (content: InstallationContent) => void 
}) {
  const [localContent, setLocalContent] = useState<InstallationContent>({
    description: content?.description || '',
    requirements: content?.requirements || [{ name: '', version: '', required: true }],
    steps: content?.steps || [{ title: '', description: '', commands: [''], notes: '' }]
  })

  useEffect(() => {
    setLocalContent({
      description: content?.description || '',
      requirements: content?.requirements || [{ name: '', version: '', required: true }],
      steps: content?.steps || [{ title: '', description: '', commands: [''], notes: '' }]
    })
  }, [content])

  const updateField = <K extends keyof InstallationContent>(field: K, value: InstallationContent[K]) => {
    const updated = { ...localContent, [field]: value }
    setLocalContent(updated)
    onChange(updated)
  }

  // Requirements
  const addRequirement = () => {
    const requirements = [...(localContent.requirements || []), { name: '', version: '', required: true }]
    updateField('requirements', requirements)
  }

  const updateRequirement = (index: number, field: keyof InstallRequirement, value: string | boolean) => {
    const requirements = [...(localContent.requirements || [])]
    requirements[index] = { ...requirements[index], [field]: value }
    updateField('requirements', requirements)
  }

  const removeRequirement = (index: number) => {
    const requirements = (localContent.requirements || []).filter((_, i) => i !== index)
    updateField('requirements', requirements.length > 0 ? requirements : [{ name: '', version: '', required: true }])
  }

  // Steps
  const addStep = () => {
    const steps = [...(localContent.steps || []), { title: '', description: '', commands: [''], notes: '' }]
    updateField('steps', steps)
  }

  const updateStep = (index: number, field: keyof InstallStep, value: string | string[]) => {
    const steps = [...(localContent.steps || [])]
    steps[index] = { ...steps[index], [field]: value }
    updateField('steps', steps)
  }

  const removeStep = (index: number) => {
    const steps = (localContent.steps || []).filter((_, i) => i !== index)
    updateField('steps', steps.length > 0 ? steps : [{ title: '', description: '', commands: [''], notes: '' }])
  }

  const addCommand = (stepIndex: number) => {
    const steps = [...(localContent.steps || [])]
    steps[stepIndex] = { ...steps[stepIndex], commands: [...(steps[stepIndex].commands || []), ''] }
    updateField('steps', steps)
  }

  const updateCommand = (stepIndex: number, cmdIndex: number, value: string) => {
    const steps = [...(localContent.steps || [])]
    const commands = [...(steps[stepIndex].commands || [])]
    commands[cmdIndex] = value
    steps[stepIndex] = { ...steps[stepIndex], commands }
    updateField('steps', steps)
  }

  const removeCommand = (stepIndex: number, cmdIndex: number) => {
    const steps = [...(localContent.steps || [])]
    const commands = (steps[stepIndex].commands || []).filter((_, i) => i !== cmdIndex)
    steps[stepIndex] = { ...steps[stepIndex], commands: commands.length > 0 ? commands : [''] }
    updateField('steps', steps)
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Descrição Geral
        </label>
        <textarea
          value={localContent.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Instruções gerais de instalação..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          rows={2}
        />
      </div>

      {/* Requirements */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            📋 Requisitos
          </label>
          <button
            type="button"
            onClick={addRequirement}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {(localContent.requirements || []).map((req, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group">
              <input
                type="text"
                value={req.name}
                onChange={(e) => updateRequirement(index, 'name', e.target.value)}
                placeholder="Node.js, Docker..."
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="text"
                value={req.version || ''}
                onChange={(e) => updateRequirement(index, 'version', e.target.value)}
                placeholder="v18+"
                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={req.required !== false}
                  onChange={(e) => updateRequirement(index, 'required', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Obrigatório
              </label>
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            📦 Passos de Instalação
          </label>
          <button
            type="button"
            onClick={addStep}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Passo
          </button>
        </div>
        <div className="space-y-4">
          {(localContent.steps || []).map((step, stepIndex) => (
            <div key={stepIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {stepIndex + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                    placeholder="Título do passo"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium transition-all"
                  />
                  <textarea
                    value={step.description || ''}
                    onChange={(e) => updateStep(stepIndex, 'description', e.target.value)}
                    placeholder="Descrição detalhada..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none transition-all"
                    rows={2}
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">💻 Comandos:</span>
                      <button
                        type="button"
                        onClick={() => addCommand(stepIndex)}
                        className="text-xs text-primary hover:text-primary-dark"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="space-y-1">
                      {(step.commands || []).map((cmd, cmdIndex) => (
                        <div key={cmdIndex} className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs font-mono">$</span>
                          <input
                            type="text"
                            value={cmd}
                            onChange={(e) => updateCommand(stepIndex, cmdIndex, e.target.value)}
                            placeholder="npm install..."
                            className="flex-1 px-2 py-1 bg-gray-900 text-green-400 rounded text-sm font-mono focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => removeCommand(stepIndex, cmdIndex)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={step.notes || ''}
                    onChange={(e) => updateStep(stepIndex, 'notes', e.target.value)}
                    placeholder="Notas/observações (opcional)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-xs italic transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(stepIndex)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  disabled={(localContent.steps || []).length <= 1}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// API ENDPOINTS EDITOR
// =====================================================
interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  summary?: string
  description?: string
  requestBody?: string
  response?: string
}

interface APIContent {
  baseUrl?: string
  description?: string
  endpoints?: APIEndpoint[]
}

function APIEditor({ 
  content, 
  onChange 
}: { 
  content: APIContent
  onChange: (content: APIContent) => void 
}) {
  const [localContent, setLocalContent] = useState<APIContent>({
    baseUrl: content?.baseUrl || '',
    description: content?.description || '',
    endpoints: content?.endpoints || [{ method: 'GET', path: '', summary: '', description: '', requestBody: '', response: '' }]
  })

  useEffect(() => {
    setLocalContent({
      baseUrl: content?.baseUrl || '',
      description: content?.description || '',
      endpoints: content?.endpoints || [{ method: 'GET', path: '', summary: '', description: '', requestBody: '', response: '' }]
    })
  }, [content])

  const updateField = <K extends keyof APIContent>(field: K, value: APIContent[K]) => {
    const updated = { ...localContent, [field]: value }
    setLocalContent(updated)
    onChange(updated)
  }

  const addEndpoint = () => {
    const endpoints = [...(localContent.endpoints || []), { method: 'GET' as const, path: '', summary: '', description: '', requestBody: '', response: '' }]
    updateField('endpoints', endpoints)
  }

  const updateEndpoint = (index: number, field: keyof APIEndpoint, value: string) => {
    const endpoints = [...(localContent.endpoints || [])]
    endpoints[index] = { ...endpoints[index], [field]: value }
    updateField('endpoints', endpoints)
  }

  const removeEndpoint = (index: number) => {
    const endpoints = (localContent.endpoints || []).filter((_, i) => i !== index)
    updateField('endpoints', endpoints.length > 0 ? endpoints : [{ method: 'GET', path: '', summary: '', description: '', requestBody: '', response: '' }])
  }

  const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-orange-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500',
  }

  return (
    <div className="space-y-6">
      {/* Base URL */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🌐 URL Base
        </label>
        <input
          type="text"
          value={localContent.baseUrl || ''}
          onChange={(e) => updateField('baseUrl', e.target.value)}
          placeholder="https://api.exemplo.com/v1"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Descrição da API
        </label>
        <textarea
          value={localContent.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Descrição geral da API e autenticação..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          rows={2}
        />
      </div>

      {/* Endpoints */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            🔗 Endpoints
          </label>
          <button
            type="button"
            onClick={addEndpoint}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Endpoint
          </button>
        </div>
        <div className="space-y-4">
          {(localContent.endpoints || []).map((endpoint, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={endpoint.method}
                      onChange={(e) => updateEndpoint(index, 'method', e.target.value)}
                      className={`px-3 py-2 rounded-lg text-white text-sm font-bold focus:ring-2 focus:ring-primary ${METHOD_COLORS[endpoint.method]}`}
                    >
                      {Object.keys(METHOD_COLORS).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={endpoint.path}
                      onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                      placeholder="/users/:id"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    value={endpoint.summary || ''}
                    onChange={(e) => updateEndpoint(index, 'summary', e.target.value)}
                    placeholder="Resumo: Buscar usuário por ID"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all"
                  />
                  <textarea
                    value={endpoint.description || ''}
                    onChange={(e) => updateEndpoint(index, 'description', e.target.value)}
                    placeholder="Descrição detalhada do endpoint..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none transition-all"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Request Body (JSON)</label>
                      <textarea
                        value={endpoint.requestBody || ''}
                        onChange={(e) => updateEndpoint(index, 'requestBody', e.target.value)}
                        placeholder='{ "name": "string" }'
                        className="w-full px-3 py-2 bg-gray-900 text-green-400 rounded-lg font-mono text-xs resize-none transition-all"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Response (JSON)</label>
                      <textarea
                        value={endpoint.response || ''}
                        onChange={(e) => updateEndpoint(index, 'response', e.target.value)}
                        placeholder='{ "id": 1, "name": "John" }'
                        className="w-full px-3 py-2 bg-gray-900 text-green-400 rounded-lg font-mono text-xs resize-none transition-all"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeEndpoint(index)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  disabled={(localContent.endpoints || []).length <= 1}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// GENERIC SECTION EDITOR
// =====================================================
function GenericEditor({ 
  content, 
  onChange 
}: { 
  content: unknown
  onChange: (content: unknown) => void 
}) {
  const [jsonStr, setJsonStr] = useState(() => 
    JSON.stringify(content || {}, null, 2)
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setJsonStr(JSON.stringify(content || {}, null, 2))
    setError(null)
  }, [content])

  const handleChange = (value: string) => {
    setJsonStr(value)
    try {
      const parsed = JSON.parse(value)
      setError(null)
      onChange(parsed)
    } catch (e) {
      setError('JSON inválido')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          Conteúdo (JSON)
        </label>
        {error && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>
      <textarea
        value={jsonStr}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full px-4 py-3 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}
        rows={12}
        spellCheck={false}
      />
      <p className="text-xs text-gray-400">
        Edite o conteúdo diretamente em formato JSON. Use o botão "Gerar com IA" para preencher automaticamente.
      </p>
    </div>
  )
}

// =====================================================
// MAIN SECTION EDITOR
// =====================================================
function SectionEditor({ section, onUpdate, onGenerateWithAI, isGenerating }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title)
  
  useEffect(() => {
    setTitle(section.title)
  }, [section.id])
  
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    onUpdate({ ...section, title: newTitle })
  }

  const handleContentChange = (newContent: unknown) => {
    onUpdate({ ...section, content: newContent })
  }

  // Render section-specific editor
  const renderEditor = () => {
    switch (section.type) {
      case 'hero':
        return (
          <HeroEditor 
            content={section.content as HeroContent} 
            onChange={handleContentChange}
          />
        )
      case 'overview':
        return (
          <OverviewEditor 
            content={section.content as OverviewContent} 
            onChange={handleContentChange}
          />
        )
      case 'architecture':
        return (
          <ArchitectureEditor 
            content={section.content as ArchitectureContent} 
            onChange={handleContentChange}
          />
        )
      case 'technologies':
        return (
          <TechnologiesEditor 
            content={section.content as TechnologiesContent} 
            onChange={handleContentChange}
          />
        )
      case 'flow':
        return (
          <FlowEditor 
            content={section.content as FlowContent} 
            onChange={handleContentChange}
          />
        )
      case 'faq':
        return (
          <FAQEditor 
            content={section.content as FAQContent} 
            onChange={handleContentChange}
          />
        )
      case 'installation':
        return (
          <InstallationEditor 
            content={section.content as InstallationContent} 
            onChange={handleContentChange}
          />
        )
      case 'api':
        return (
          <APIEditor 
            content={section.content as APIContent} 
            onChange={handleContentChange}
          />
        )
      default:
        return (
          <GenericEditor 
            content={section.content} 
            onChange={handleContentChange}
          />
        )
    }
  }
  
  return (
    <div className="doc-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {SECTION_TYPES.find(s => s.type === section.type)?.icon || '📄'}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0"
            placeholder="Título da Seção"
          />
        </div>
        <button
          onClick={onGenerateWithAI}
          disabled={isGenerating}
          className="btn btn-success text-sm"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Preencher com IA
        </button>
      </div>
      
      {/* Section-specific editor */}
      <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
        {renderEditor()}
      </div>
    </div>
  )
}

// Re-export AIChat for use in EditorPage
export { default as AIChat } from '@/components/AIChat'
