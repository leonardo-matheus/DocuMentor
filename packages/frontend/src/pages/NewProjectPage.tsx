import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { GitBranch, ArrowRight, Loader2, CheckCircle, Search, X, Plus, Trash, ChevronDown } from 'lucide-react'
import { repositoriesApi, projectsApi } from '@/services/api'
import type { Repository } from '@/types'
import toast from 'react-hot-toast'

interface RepoAnalysis {
  owner: string
  repo: string
  name?: string
  description: string
  languages: Record<string, number>
  frameworks?: string[]
  structure: string[]
  readme?: string
  configFiles?: string[]
  dependencies?: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
}

interface AdditionalRepo {
  id: string
  repository: Repository
  description: string
}

// Dropdown component with search
function RepositoryDropdown({ 
  repositories, 
  selectedRepo, 
  onSelect, 
  isLoading,
  placeholder = "Selecione um repositório..."
}: {
  repositories: Repository[]
  selectedRepo: Repository | null
  onSelect: (repo: Repository) => void
  isLoading: boolean
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Filter repositories based on search
  const filteredRepos = useMemo(() => {
    if (!searchTerm.trim()) return repositories
    const term = searchTerm.toLowerCase()
    return repositories.filter(repo => 
      repo.name.toLowerCase().includes(term) ||
      repo.full_name.toLowerCase().includes(term) ||
      repo.description?.toLowerCase().includes(term)
    )
  }, [repositories, searchTerm])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all ${
          isOpen 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {selectedRepo ? (
          <div className="flex items-center gap-3 min-w-0">
            <GitBranch className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{selectedRepo.full_name}</div>
              {selectedRepo.description && (
                <div className="text-sm text-gray-500 truncate">{selectedRepo.description}</div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">{isLoading ? 'Carregando repositórios...' : placeholder}</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar repositórios..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          
          {/* Repository List */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carregando repositórios...</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="p-6 text-center">
                <GitBranch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'Nenhum repositório encontrado' : 'Nenhum repositório disponível'}
                </p>
              </div>
            ) : (
              filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => {
                    onSelect(repo)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    selectedRepo?.id === repo.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <GitBranch className={`w-5 h-5 shrink-0 ${selectedRepo?.id === repo.id ? 'text-primary' : 'text-gray-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium truncate ${selectedRepo?.id === repo.id ? 'text-primary' : 'text-gray-900'}`}>
                      {repo.full_name}
                    </div>
                    {repo.description && (
                      <div className="text-sm text-gray-500 truncate">{repo.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {repo.language && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {repo.language}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Atualizado: {new Date(repo.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  {selectedRepo?.id === repo.id && (
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewProjectPage() {
  const navigate = useNavigate()
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null)
  const [additionalRepos, setAdditionalRepos] = useState<AdditionalRepo[]>([])
  const [showAddRepoDropdown, setShowAddRepoDropdown] = useState(false)
  
  // Fetch available repositories
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      // Try to fetch from default org first, then user repos
      try {
        const response = await repositoriesApi.list('movemais')
        return response.data
      } catch {
        const response = await repositoriesApi.list()
        return response.data
      }
    },
  })
  
  // Filter out already selected repos
  const availableRepos = useMemo(() => {
    const selectedIds = new Set([
      selectedRepo?.id,
      ...additionalRepos.map(r => r.repository.id)
    ])
    return repositories.filter(r => !selectedIds.has(r.id))
  }, [repositories, selectedRepo, additionalRepos])
  
  const analyzeMutation = useMutation({
    mutationFn: (url: string) => repositoriesApi.analyze(url),
    onSuccess: (response) => {
      setAnalysis(response.data)
      toast.success('Repositório analisado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao analisar repositório')
    },
  })
  
  const createMutation = useMutation({
    mutationFn: async () => {
      // Create project
      const projectResponse = await projectsApi.create({ 
        name: analysis?.repo || selectedRepo?.name || 'Novo Projeto',
        repositoryUrl: selectedRepo?.html_url || ''
      })
      
      // Add additional repositories
      for (const additionalRepo of additionalRepos) {
        await projectsApi.addAdditionalRepo(projectResponse.data.id, {
          name: additionalRepo.repository.name,
          repositoryUrl: additionalRepo.repository.html_url,
          description: additionalRepo.description
        })
      }
      
      return projectResponse
    },
    onSuccess: (response) => {
      toast.success('Projeto criado!')
      navigate(`/projects/${response.data.id}/edit`)
    },
    onError: () => {
      toast.error('Erro ao criar projeto')
    },
  })
  
  // Analyze when repository is selected
  useEffect(() => {
    if (selectedRepo) {
      setAnalysis(null)
      analyzeMutation.mutate(selectedRepo.html_url)
    }
  }, [selectedRepo])
  
  const handleAddAdditionalRepo = (repo: Repository) => {
    setAdditionalRepos(prev => [
      ...prev,
      {
        id: `additional-${Date.now()}`,
        repository: repo,
        description: ''
      }
    ])
    setShowAddRepoDropdown(false)
  }
  
  const handleRemoveAdditionalRepo = (id: string) => {
    setAdditionalRepos(prev => prev.filter(r => r.id !== id))
  }
  
  const handleUpdateAdditionalRepoDescription = (id: string, description: string) => {
    setAdditionalRepos(prev => prev.map(r => 
      r.id === id ? { ...r, description } : r
    ))
  }
  
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-movemais/10 dark:bg-movemais/20 flex items-center justify-center mx-auto mb-4">
          <GitBranch className="w-8 h-8 text-movemais" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Novo Projeto de Documentação
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Selecione um repositório do Gitea para começar
        </p>
      </div>
      
      {/* Step 1: Repository Selection */}
      <div className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 p-8 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
          Repositório Principal
        </h2>
        
        <RepositoryDropdown
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelect={setSelectedRepo}
          isLoading={isLoadingRepos}
          placeholder="Selecione o repositório principal..."
        />
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Selecione o repositório principal que será documentado
        </p>
      </div>
      
      {/* Analysis Result */}
      {analyzeMutation.isPending && (
        <div className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 p-8 mb-6">
          <div className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Analisando repositório...</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          </div>
        </div>
      )}
      
      {analysis && (
        <div className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 p-8 mb-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
            Análise do Repositório
          </h2>
          
          <div className="space-y-4">
            {/* Project Name */}
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <span className="text-gray-500 text-sm">Nome do Projeto:</span>
                <span className="ml-2 font-medium text-gray-900">{analysis.owner}/{analysis.repo}</span>
              </div>
            </div>
            
            {/* Languages */}
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <span className="text-gray-500 text-sm">Linguagens:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(analysis.languages).map(([lang, bytes]) => (
                    <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                      {lang} ({Math.round(bytes / 1024)}KB)
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Config Files */}
            {analysis.configFiles && analysis.configFiles.length > 0 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <span className="text-gray-500 text-sm">Arquivos de Configuração:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analysis.configFiles.slice(0, 8).map((cf) => (
                      <span key={cf} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        {cf.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Structure Preview */}
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <span className="text-gray-500 text-sm">Estrutura ({analysis.structure.length} arquivos):</span>
                <div className="mt-2 bg-gray-50 rounded-xl p-4 font-mono text-sm text-gray-600 max-h-48 overflow-y-auto">
                  {analysis.structure.slice(0, 15).map((path, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span>{path.includes('.') ? '📄' : '📁'}</span>
                      <span>{path}</span>
                    </div>
                  ))}
                  {analysis.structure.length > 15 && (
                    <div className="text-gray-400 mt-2">
                      ... e mais {analysis.structure.length - 15} itens
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Additional Repositories */}
      {analysis && (
        <div className="doc-card p-8 mb-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">3</span>
            Repositórios Adicionais
            <span className="text-sm font-normal text-gray-500">(opcional)</span>
          </h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Adicione repositórios relacionados para gerar documentação integrada que explica a interação entre os sistemas.
          </p>
          
          {/* Added Additional Repos */}
          {additionalRepos.length > 0 && (
            <div className="space-y-3 mb-4">
              {additionalRepos.map((additionalRepo) => (
                <div key={additionalRepo.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <GitBranch className="w-5 h-5 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {additionalRepo.repository.full_name}
                        </div>
                        {additionalRepo.repository.language && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {additionalRepo.repository.language}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAdditionalRepo(additionalRepo.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      value={additionalRepo.description}
                      onChange={(e) => handleUpdateAdditionalRepoDescription(additionalRepo.id, e.target.value)}
                      placeholder="Descreva o papel deste repositório na integração..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Additional Repo Button / Dropdown */}
          {showAddRepoDropdown ? (
            <div className="space-y-3">
              <RepositoryDropdown
                repositories={availableRepos}
                selectedRepo={null}
                onSelect={handleAddAdditionalRepo}
                isLoading={isLoadingRepos}
                placeholder="Selecione um repositório adicional..."
              />
              <button
                onClick={() => setShowAddRepoDropdown(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddRepoDropdown(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Repositório
            </button>
          )}
        </div>
      )}
      
      {/* Create Button */}
      {analysis && (
        <div className="text-center animate-fade-in-up">
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="btn btn-success text-lg px-8 py-4"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Criar Projeto
                {additionalRepos.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-sm">
                    +{additionalRepos.length} repo{additionalRepos.length > 1 ? 's' : ''}
                  </span>
                )}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-gray-500 text-sm mt-3">
            {additionalRepos.length > 0 
              ? `Documentação integrada com ${additionalRepos.length + 1} sistemas`
              : 'Você poderá escolher as seções de documentação no próximo passo'
            }
          </p>
        </div>
      )}
    </div>
  )
}
