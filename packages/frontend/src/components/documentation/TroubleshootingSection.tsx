import { useState, ReactNode } from 'react'
import clsx from 'clsx'

// Troubleshooting item structure
export interface TroubleshootingItem {
  id?: string
  icon?: string
  problem: string
  causes?: TroubleshootingCause[]
}

export interface TroubleshootingCause {
  id?: string
  title: string
  description?: ReactNode
  responsible?: string
  warning?: string
  diagnosis?: string
  solution?: string
  commitRef?: {
    sha: string
    shortSha: string
    url: string
    date: string
    author: string
  }
}

interface TroubleshootingSectionProps {
  items: TroubleshootingItem[]
  className?: string
  title?: string
  subtitle?: string
}

// Individual cause component
function CauseItem({ cause }: { cause: TroubleshootingCause }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border-l-2 border-gray-200 dark:border-slate-600 pl-4 ml-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg px-2 -ml-2 transition-colors"
      >
        <span className={clsx(
          'w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all',
          isOpen 
            ? 'bg-indigo-500 text-white' 
            : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
        )}>
          {isOpen ? '▼' : '●'}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-200">
          {cause.title}
        </span>
      </button>
      
      {isOpen && (
        <div className="mt-2 mb-4 ml-7 space-y-3 animate-fade-in">
          {/* Description */}
          {cause.description && (
            <div className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              {typeof cause.description === 'string' ? (
                <p>{cause.description}</p>
              ) : (
                cause.description
              )}
            </div>
          )}
          
          {/* Responsible */}
          {cause.responsible && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">🏢</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                RESPONSÁVEL:
              </span>
              <span className="text-gray-700 dark:text-slate-200">
                {cause.responsible}
              </span>
            </div>
          )}
          
          {/* Warning */}
          {cause.warning && (
            <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <span className="text-lg">⚠️</span>
              <p className="text-amber-700 dark:text-amber-300">{cause.warning}</p>
            </div>
          )}
          
          {/* Diagnosis */}
          {cause.diagnosis && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-lg">🔍</span>
              <div>
                <span className="font-semibold text-gray-700 dark:text-slate-200">Diagnóstico: </span>
                <span className="text-gray-600 dark:text-slate-300">{cause.diagnosis}</span>
              </div>
            </div>
          )}
          
          {/* Solution */}
          {cause.solution && (
            <div className="flex items-start gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
              <span className="text-lg">✅</span>
              <div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Tratativa: </span>
                <span className="text-emerald-600 dark:text-emerald-300">{cause.solution}</span>
              </div>
            </div>
          )}
          
          {/* Commit Reference */}
          {cause.commitRef && (
            <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
              <span className="text-base">🔧</span>
              <span className="text-gray-500 dark:text-slate-400">Corrigido em:</span>
              <a 
                href={cause.commitRef.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {cause.commitRef.shortSha}
              </a>
              <span className="text-gray-400 dark:text-slate-500">•</span>
              <span className="text-gray-500 dark:text-slate-400">
                {new Date(cause.commitRef.date).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-gray-400 dark:text-slate-500">•</span>
              <span className="text-gray-500 dark:text-slate-400">
                por {cause.commitRef.author}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Individual problem component
function ProblemItem({ item }: { item: TroubleshootingItem }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Determine icon based on problem type
  const getIcon = () => {
    if (item.icon) return item.icon
    const problem = item.problem.toLowerCase()
    if (problem.includes('entrar') || problem.includes('entrada')) return '🚫'
    if (problem.includes('sair') || problem.includes('saída')) return '🚪'
    if (problem.includes('leitura') || problem.includes('ocr')) return '📷'
    if (problem.includes('sync') || problem.includes('sinc')) return '🔄'
    if (problem.includes('tag') || problem.includes('rfid')) return '📡'
    if (problem.includes('api') || problem.includes('erro')) return '⚠️'
    return '❓'
  }
  
  return (
    <div className={clsx(
      'group relative overflow-hidden rounded-xl transition-all duration-300',
      'bg-gradient-to-br from-white to-gray-50/80 dark:from-slate-800 dark:to-slate-800/80',
      'border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg',
      isOpen && 'shadow-lg border-red-300/50 dark:border-red-700/50'
    )}>
      {/* Problem Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left transition-all duration-200 focus:outline-none"
      >
        {/* Icon */}
        <span className={clsx(
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300',
          isOpen 
            ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-md' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-gray-700 dark:text-slate-300 group-hover:from-red-100 group-hover:to-orange-100 dark:group-hover:from-red-900/30 dark:group-hover:to-orange-900/30 group-hover:text-red-600 dark:group-hover:text-red-400'
        )}>
          {getIcon()}
        </span>
        
        {/* Problem Text */}
        <div className="flex-1">
          <span className={clsx(
            'font-semibold text-gray-800 dark:text-slate-100 transition-colors duration-200',
            'group-hover:text-red-700 dark:group-hover:text-red-400',
            isOpen && 'text-red-700 dark:text-red-400'
          )}>
            {item.problem}
          </span>
          {item.causes && item.causes.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Clique para ver as possíveis causas ({item.causes.length})
            </p>
          )}
        </div>
        
        {/* Toggle Icon */}
        <span className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300',
          isOpen 
            ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white rotate-180 shadow-md' 
            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-600 dark:group-hover:text-red-400'
        )}>
          ▼
        </span>
      </button>
      
      {/* Causes List */}
      {isOpen && item.causes && item.causes.length > 0 && (
        <div className="px-5 pb-5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-slate-700/50 dark:to-slate-700/30 border border-gray-200/50 dark:border-slate-600/50">
            <div className="space-y-1">
              {item.causes.map((cause, i) => (
                <CauseItem key={cause.id || i} cause={cause} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TroubleshootingSection({ 
  items, 
  className,
  title = 'Troubleshooting',
  subtitle = 'Problemas comuns e suas soluções'
}: TroubleshootingSectionProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 text-3xl mb-4">
          🔧
        </div>
        <p className="text-gray-500 dark:text-slate-400">
          Nenhum problema documentado ainda.
        </p>
      </div>
    )
  }
  
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <span className="text-3xl">🔧</span>
          {title}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mt-2">{subtitle}</p>
      </div>
      
      {/* Problems List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <ProblemItem key={item.id || index} item={item} />
        ))}
      </div>
    </div>
  )
}

// Helper function to convert fix commits to troubleshooting items
export function fixCommitsToTroubleshootingItems(commits: Array<{
  sha: string;
  shortSha: string;
  message: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  author: string;
  date: string;
  url: string;
  category: string;
}>): TroubleshootingItem[] {
  // Group commits by category
  const grouped = commits.reduce((acc, commit) => {
    const category = commit.category || 'Correção Geral'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(commit)
    return acc
  }, {} as Record<string, typeof commits>)
  
  // Convert to troubleshooting items
  return Object.entries(grouped).map(([category, categoryCommits]) => ({
    id: category,
    icon: getCategoryIcon(category),
    problem: category,
    causes: categoryCommits.map(commit => ({
      id: commit.sha,
      title: commit.title,
      description: commit.description || undefined,
      solution: commit.solution,
      commitRef: {
        sha: commit.sha,
        shortSha: commit.shortSha,
        url: commit.url,
        date: commit.date,
        author: commit.author
      }
    }))
  }))
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Entrada de Veículo': '🚗',
    'Saída de Veículo': '🚪',
    'Leitura OCR': '📷',
    'TAG RFID': '📡',
    'Sincronização': '🔄',
    'Integração API': '🔌',
    'Banco de Dados': '🗄️',
    'Autenticação': '🔐',
    'Interface': '🎨',
    'Correção Geral': '🔧'
  }
  return icons[category] || '🔧'
}
