import { useState } from 'react'
import clsx from 'clsx'

interface Parameter {
  name: string
  type: string
  in: 'path' | 'query' | 'body' | 'header'
  required: boolean
  description: string
}

interface Response {
  status: number
  description: string
  example?: any
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  parameters?: Parameter[]
  responses?: Response[]
  tags?: string[]
}

interface EndpointsSectionProps {
  baseUrl?: string
  endpoints: Endpoint[]
  className?: string
}

const methodColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  GET: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-700', 
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-600'
  },
  POST: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-700', 
    border: 'border-blue-500/30',
    gradient: 'from-blue-500 to-indigo-600'
  },
  PUT: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-700', 
    border: 'border-amber-500/30',
    gradient: 'from-amber-500 to-orange-600'
  },
  PATCH: { 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-700', 
    border: 'border-purple-500/30',
    gradient: 'from-purple-500 to-violet-600'
  },
  DELETE: { 
    bg: 'bg-rose-500/10', 
    text: 'text-rose-700', 
    border: 'border-rose-500/30',
    gradient: 'from-rose-500 to-red-600'
  },
}

const statusColors: Record<string, string> = {
  '2': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  '3': 'text-blue-600 bg-blue-50 border-blue-200',
  '4': 'text-amber-600 bg-amber-50 border-amber-200',
  '5': 'text-rose-600 bg-rose-50 border-rose-200',
}

function EndpointCard({ endpoint, index }: { endpoint: Endpoint; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const colors = methodColors[endpoint.method] || methodColors.GET
  
  return (
    <div 
      className={clsx(
        'group relative bg-white rounded-2xl overflow-hidden transition-all duration-500',
        'border border-slate-200/60 hover:border-slate-300',
        'shadow-sm hover:shadow-xl hover:shadow-slate-200/50',
        isExpanded && 'ring-2 ring-indigo-500/20'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left flex items-start gap-4 hover:bg-slate-50/50 transition-colors"
      >
        {/* Method Badge */}
        <div className={clsx(
          'flex-shrink-0 px-3 py-1.5 rounded-lg font-mono font-bold text-sm',
          'bg-gradient-to-r text-white shadow-lg',
          colors.gradient
        )}>
          {endpoint.method}
        </div>
        
        {/* Path and Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <code className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
              {endpoint.path}
            </code>
            {endpoint.tags?.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
            {endpoint.description}
          </p>
        </div>
        
        {/* Expand Icon */}
        <div className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-300',
          isExpanded && 'rotate-180'
        )}>
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
          {/* Parameters */}
          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div className="p-5 border-b border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs">
                  📥
                </span>
                Parâmetros
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100/50">
                      <th className="text-left p-3 font-semibold text-slate-700 rounded-l-lg">Nome</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Tipo</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Local</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Obrigatório</th>
                      <th className="text-left p-3 font-semibold text-slate-700 rounded-r-lg">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {endpoint.parameters.map((param, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <code className="text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">
                            {param.name}
                          </code>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-600 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {param.type}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            param.in === 'path' && 'bg-purple-100 text-purple-700',
                            param.in === 'query' && 'bg-blue-100 text-blue-700',
                            param.in === 'body' && 'bg-amber-100 text-amber-700',
                            param.in === 'header' && 'bg-slate-200 text-slate-700',
                          )}>
                            {param.in}
                          </span>
                        </td>
                        <td className="p-3">
                          {param.required ? (
                            <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-medium">
                              Sim
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Responses */}
          {endpoint.responses && endpoint.responses.length > 0 && (
            <div className="p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs">
                  📤
                </span>
                Respostas
              </h4>
              <div className="space-y-3">
                {endpoint.responses.map((response, i) => {
                  const statusCategory = String(response.status)[0]
                  const statusColor = statusColors[statusCategory] || statusColors['2']
                  
                  return (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-3 p-3 bg-slate-50/50">
                        <span className={clsx(
                          'px-3 py-1 rounded-lg font-mono font-bold text-sm border',
                          statusColor
                        )}>
                          {response.status}
                        </span>
                        <span className="text-slate-700 font-medium">{response.description}</span>
                      </div>
                      {response.example && (
                        <div className="p-3 bg-slate-900 overflow-x-auto">
                          <pre className="text-sm text-emerald-400 font-mono">
                            {typeof response.example === 'string' 
                              ? response.example 
                              : JSON.stringify(response.example, null, 2)
                            }
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EndpointsSection({ baseUrl, endpoints, className }: EndpointsSectionProps) {
  const [filter, setFilter] = useState<string>('all')
  const methods = ['all', ...new Set(endpoints.map(e => e.method))]
  
  const filteredEndpoints = filter === 'all' 
    ? endpoints 
    : endpoints.filter(e => e.method === filter)
  
  // Group by tags if available
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const tag = endpoint.tags?.[0] || 'Outros'
    if (!acc[tag]) acc[tag] = []
    acc[tag].push(endpoint)
    return acc
  }, {} as Record<string, Endpoint[]>)
  
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header with Base URL and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl">
        <div>
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              🔌
            </span>
            API Endpoints
          </h3>
          {baseUrl && (
            <code className="text-sm text-emerald-400 font-mono bg-slate-950/50 px-3 py-1 rounded-lg inline-block mt-2">
              {baseUrl}
            </code>
          )}
        </div>
        
        {/* Method Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {methods.map(method => {
            const isActive = filter === method
            const colors = method === 'all' 
              ? { gradient: 'from-slate-500 to-slate-600' } 
              : methodColors[method]
            
            return (
              <button
                key={method}
                onClick={() => setFilter(method)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200',
                  isActive
                    ? `bg-gradient-to-r ${colors?.gradient || 'from-slate-500 to-slate-600'} text-white shadow-lg`
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                )}
              >
                {method === 'all' ? 'Todos' : method}
                <span className="ml-1.5 text-xs opacity-70">
                  ({method === 'all' ? endpoints.length : endpoints.filter(e => e.method === method).length})
                </span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(methodColors).map(([method, colors]) => {
          const count = endpoints.filter(e => e.method === method).length
          if (count === 0) return null
          
          return (
            <div 
              key={method} 
              className={clsx(
                'p-4 rounded-xl border text-center transition-all hover:scale-105',
                colors.bg, colors.border
              )}
            >
              <div className={clsx('text-2xl font-bold', colors.text)}>{count}</div>
              <div className="text-xs font-medium text-slate-500">{method}</div>
            </div>
          )
        })}
      </div>
      
      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.map((endpoint, index) => (
          <EndpointCard key={`${endpoint.method}-${endpoint.path}-${index}`} endpoint={endpoint} index={index} />
        ))}
      </div>
      
      {filteredEndpoints.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <p>Nenhum endpoint encontrado para o filtro selecionado.</p>
        </div>
      )}
    </div>
  )
}
