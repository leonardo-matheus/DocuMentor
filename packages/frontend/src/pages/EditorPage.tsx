import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Save, Eye, Sparkles, Plus, Trash, ChevronDown, ChevronUp, 
  Loader2, FileText, Settings, CheckCircle2, Clock, Zap, AlertTriangle
} from 'lucide-react'
import { projectsApi, aiApi } from '@/services/api'
import toast from 'react-hot-toast'
import AIChat from '@/components/AIChat'

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

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
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
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!).then(res => res.data),
    enabled: !!id,
  })
  
  // Load sections from project when it loads
  useEffect(() => {
    if (project?.sections) {
      const loadedSections = typeof project.sections === 'string' 
        ? JSON.parse(project.sections) 
        : project.sections
      setSections(loadedSections)
    }
  }, [project])
  
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
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
  
  const saveMutation = useMutation({
    mutationFn: () => projectsApi.update(id!, { sections: JSON.stringify(sections) } as any),
    onSuccess: () => toast.success('Projeto salvo!'),
    onError: () => toast.error('Erro ao salvar'),
  })
  
  const generateMutation = useMutation({
    mutationFn: (sectionType: string) => aiApi.generateSection(id!, sectionType, { project }),
    onSuccess: (response, sectionType) => {
      const newSection: DocumentSection = {
        id: `section-${Date.now()}`,
        type: sectionType,
        title: response.data.title,
        content: response.data.content,
        order: sections.length,
      }
      setSections([...sections, newSection])
      toast.success('Seção gerada com IA!')
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
    setSections(sections.filter(s => s.id !== sectionId))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }
  }
  
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) return
    
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    setSections(newSections)
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
            <p className="text-sm text-gray-500">Editor de Documentação</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/projects/${id}/preview`)}
              className="btn btn-secondary"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn btn-primary"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Sections List */}
          <div className="col-span-4">
            <div className="doc-card p-4 sticky top-40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Seções</h3>
                <button
                  onClick={() => setShowAddSection(!showAddSection)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
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
              
              {/* Sections List */}
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedSection === section.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {SECTION_TYPES.find(s => s.type === section.type)?.icon || '📄'}
                        </span>
                        <span className="font-medium text-sm text-gray-900">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up') }}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down') }}
                          disabled={index === sections.length - 1}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSection(section.id) }}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma seção ainda</p>
                    <p className="text-xs">Clique em + para adicionar</p>
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
                    generateMutation.mutate(section.type)
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
      case 'overview':
        return (
          <OverviewEditor 
            content={section.content as OverviewContent} 
            onChange={handleContentChange}
          />
        )
      // Add more cases for other section types here
      // case 'hero':
      //   return <HeroEditor content={section.content} onChange={handleContentChange} />
      // case 'technologies':
      //   return <TechnologiesEditor content={section.content} onChange={handleContentChange} />
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
          Gerar com IA
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
