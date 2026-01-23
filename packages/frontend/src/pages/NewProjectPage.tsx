import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { GitBranch, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { repositoriesApi, projectsApi } from '@/services/api'
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

export default function NewProjectPage() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState('')
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null)
  
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
    mutationFn: () => projectsApi.create({ 
      name: analysis?.repo || 'Novo Projeto',
      repositoryUrl: repoUrl
    }),
    onSuccess: (response) => {
      toast.success('Projeto criado!')
      navigate(`/projects/${response.data.id}/edit`)
    },
    onError: () => {
      toast.error('Erro ao criar projeto')
    },
  })
  
  const handleAnalyze = () => {
    if (!repoUrl.trim()) {
      toast.error('Digite a URL do repositório')
      return
    }
    analyzeMutation.mutate(repoUrl)
  }
  
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-movemais/10 flex items-center justify-center mx-auto mb-4">
          <GitBranch className="w-8 h-8 text-movemais" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Novo Projeto de Documentação
        </h1>
        <p className="text-gray-600">
          Conecte um repositório do Gitea para começar
        </p>
      </div>
      
      {/* Step 1: Repository URL */}
      <div className="doc-card p-8 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
          URL do Repositório
        </h2>
        
        <div className="flex gap-3">
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://code.movemais.com/movemais/dionisio"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="btn btn-primary"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Analisar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          Cole a URL completa do repositório no Gitea (code.movemais.com)
        </p>
      </div>
      
      {/* Analysis Result */}
      {analysis && (
        <div className="doc-card p-8 mb-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-gray-500 text-sm mt-3">
            Você poderá escolher as seções de documentação no próximo passo
          </p>
        </div>
      )}
    </div>
  )
}
