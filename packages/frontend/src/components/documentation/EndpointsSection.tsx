import { useState, useCallback } from 'react'
import clsx from 'clsx'
import { Play, Copy, Check, Loader2, ChevronDown, ChevronUp, Send, X } from 'lucide-react'

interface Parameter {
  name: string
  type: string
  in: 'path' | 'query' | 'body' | 'header'
  required: boolean
  description: string
  example?: any
}

interface Response {
  status: number
  description: string
  example?: any
}

interface RequestBodySchema {
  type: string
  properties?: Record<string, { type: string; description?: string; format?: string; example?: any }>
  required?: string[]
}

interface RequestBody {
  contentType?: string
  required?: boolean
  schema?: RequestBodySchema
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  summary?: string
  tag?: string
  security?: string[]
  requestBody?: string | RequestBody
  response?: string
  parameters?: Parameter[]
  responses?: Response[]
  tags?: string[]
}

interface APIInfo {
  title?: string
  description?: string
  version?: string
  baseUrl?: string
}

interface Tag {
  name: string
  description?: string
}

interface EndpointsSectionProps {
  baseUrl?: string
  endpoints: Endpoint[]
  info?: APIInfo
  tags?: Tag[]
  className?: string
  enableTesting?: boolean
}

interface TestResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  time: number
}

const methodColors: Record<string, { bg: string; text: string; border: string; gradient: string; darkBg: string }> = {
  GET: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-600',
    darkBg: 'bg-emerald-500/20'
  },
  POST: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500 to-indigo-600',
    darkBg: 'bg-blue-500/20'
  },
  PUT: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500 to-orange-600',
    darkBg: 'bg-amber-500/20'
  },
  PATCH: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500 to-violet-600',
    darkBg: 'bg-purple-500/20'
  },
  DELETE: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/30',
    gradient: 'from-rose-500 to-red-600',
    darkBg: 'bg-rose-500/20'
  },
}

const statusColors: Record<string, string> = {
  '2': 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700',
  '3': 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700',
  '4': 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700',
  '5': 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-700',
}

// API Testing Panel Component
function APITestingPanel({
  endpoint,
  baseUrl,
  onClose
}: {
  endpoint: Endpoint
  baseUrl: string
  onClose: () => void
}) {
  const [pathParams, setPathParams] = useState<Record<string, string>>({})
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json'
  })
  const [body, setBody] = useState(endpoint.requestBody || '{}')
  const [response, setResponse] = useState<TestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Extract path parameters from endpoint path
  const pathParamNames = endpoint.path.match(/:[a-zA-Z_]+/g)?.map(p => p.slice(1)) || []

  // Build final URL
  const buildUrl = useCallback(() => {
    let url = endpoint.path
    // Replace path parameters
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`:${key}`, encodeURIComponent(value))
    }
    // Add query parameters
    const queryString = Object.entries(queryParams)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    if (queryString) {
      url += `?${queryString}`
    }
    return `${baseUrl}${url}`
  }, [endpoint.path, pathParams, queryParams, baseUrl])

  const executeRequest = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    const startTime = Date.now()
    const url = buildUrl()

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: headers,
      }

      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const endTime = Date.now()

      // Get response headers
      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      // Try to parse response as JSON
      let data: any
      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        try {
          data = await res.json()
        } catch {
          data = await res.text()
        }
      } else {
        data = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        time: endTime - startTime
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao executar requisição')
    } finally {
      setIsLoading(false)
    }
  }

  const copyCurl = () => {
    let curl = `curl -X ${endpoint.method} "${buildUrl()}"`
    for (const [key, value] of Object.entries(headers)) {
      curl += ` -H "${key}: ${value}"`
    }
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && body) {
      curl += ` -d '${body}'`
    }
    navigator.clipboard.writeText(curl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addHeader = () => {
    setHeaders({ ...headers, '': '' })
  }

  const addQueryParam = () => {
    setQueryParams({ ...queryParams, '': '' })
  }

  const colors = methodColors[endpoint.method] || methodColors.GET

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className={clsx('flex items-center justify-between p-4 border-b dark:border-slate-700', colors.darkBg)}>
          <div className="flex items-center gap-3">
            <span className={clsx('px-3 py-1 rounded-lg font-mono font-bold text-sm bg-gradient-to-r text-white', colors.gradient)}>
              {endpoint.method}
            </span>
            <code className="font-mono text-sm text-slate-700 dark:text-slate-200">{endpoint.path}</code>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* URL Preview */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-200 overflow-x-auto">
                {buildUrl()}
              </code>
              <button
                onClick={copyCurl}
                className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="Copiar como cURL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Path Parameters */}
          {pathParamNames.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Path Parameters</label>
              <div className="space-y-2">
                {pathParamNames.map(param => (
                  <div key={param} className="flex items-center gap-2">
                    <span className="w-32 text-sm font-mono text-purple-600 dark:text-purple-400">:{param}</span>
                    <input
                      type="text"
                      value={pathParams[param] || ''}
                      onChange={e => setPathParams({ ...pathParams, [param]: e.target.value })}
                      placeholder={`Valor de ${param}`}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Query Parameters</label>
              <button onClick={addQueryParam} className="text-xs text-indigo-600 hover:text-indigo-700">+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {Object.entries(queryParams).map(([key, value], idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={e => {
                      const newParams = { ...queryParams }
                      delete newParams[key]
                      newParams[e.target.value] = value
                      setQueryParams(newParams)
                    }}
                    placeholder="Key"
                    className="w-1/3 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={e => setQueryParams({ ...queryParams, [key]: e.target.value })}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      const newParams = { ...queryParams }
                      delete newParams[key]
                      setQueryParams(newParams)
                    }}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Headers</label>
              <button onClick={addHeader} className="text-xs text-indigo-600 hover:text-indigo-700">+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {Object.entries(headers).map(([key, value], idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={e => {
                      const newHeaders = { ...headers }
                      delete newHeaders[key]
                      newHeaders[e.target.value] = value
                      setHeaders(newHeaders)
                    }}
                    placeholder="Header"
                    className="w-1/3 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={e => setHeaders({ ...headers, [key]: e.target.value })}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      const newHeaders = { ...headers }
                      delete newHeaders[key]
                      setHeaders(newHeaders)
                    }}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Request Body (JSON)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-32 px-3 py-2 font-mono text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'px-2 py-1 rounded font-mono font-bold text-sm border',
                    statusColors[String(response.status)[0]] || statusColors['2']
                  )}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-xs text-slate-500">{response.time}ms</span>
                </div>
              </div>

              {/* Response Headers */}
              <details className="border-b border-slate-200 dark:border-slate-700">
                <summary className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  Response Headers ({Object.keys(response.headers).length})
                </summary>
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-mono">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="py-0.5">
                      <span className="text-purple-600 dark:text-purple-400">{k}:</span> <span className="text-slate-600 dark:text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Response Body */}
              <div className="p-3 bg-slate-900 max-h-64 overflow-auto">
                <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">
                  {typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data, null, 2)
                  }
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={executeRequest}
            disabled={isLoading}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all',
              'bg-gradient-to-r', colors.gradient,
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Executar Requisição
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function EndpointCard({
  endpoint,
  index,
  baseUrl,
  enableTesting
}: {
  endpoint: Endpoint
  index: number
  baseUrl?: string
  enableTesting?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTester, setShowTester] = useState(false)
  const colors = methodColors[endpoint.method] || methodColors.GET

  return (
    <>
      <div
        className={clsx(
          'group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden transition-all duration-500',
          'border border-slate-200/60 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
          'shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
          isExpanded && 'ring-2 ring-indigo-500/20'
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-5 text-left flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
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
              <code className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                {endpoint.path}
              </code>
              {endpoint.security && endpoint.security.length > 0 && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                  🔐 Auth
                </span>
              )}
              {endpoint.tag && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full font-medium">
                  {endpoint.tag}
                </span>
              )}
              {endpoint.tags?.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {endpoint.summary || endpoint.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {enableTesting && baseUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTester(true)
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Testar
              </button>
            )}
            <div className={clsx(
              'flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-700 bg-gradient-to-b from-slate-50/50 dark:from-slate-800/50 to-white dark:to-slate-900">
            {/* Description */}
            {endpoint.description && (
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-300">{endpoint.description}</p>
              </div>
            )}

            {/* Security/Authentication */}
            {endpoint.security && endpoint.security.length > 0 && (
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-amber-50/30 dark:bg-amber-900/10">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs">
                    🔐
                  </span>
                  Autenticação Requerida
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {endpoint.security.map((sec, i) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-mono flex items-center gap-2">
                      {sec === 'bearerAuth' ? (
                        <>🔑 Bearer Token (JWT)</>
                      ) : sec === 'apiKey' ? (
                        <>🗝️ API Key</>
                      ) : sec === 'basicAuth' ? (
                        <>👤 Basic Auth</>
                      ) : sec === 'oauth2' ? (
                        <>🔗 OAuth 2.0</>
                      ) : (
                        <>{sec}</>
                      )}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Este endpoint requer autenticação. Inclua o token no header Authorization.
                </p>
              </div>
            )}

            {/* Parameters */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs">
                    📥
                  </span>
                  Parâmetros
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                        <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 rounded-l-lg">Nome</th>
                        <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                        <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Local</th>
                        <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Obrigatório</th>
                        <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 rounded-r-lg">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {endpoint.parameters.map((param, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3">
                            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                              {param.name}
                            </code>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                              {param.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={clsx(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              param.in === 'path' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                              param.in === 'query' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                              param.in === 'body' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                              param.in === 'header' && 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
                            )}>
                              {param.in}
                            </span>
                          </td>
                          <td className="p-3">
                            {param.required ? (
                              <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full font-medium">
                                Sim
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                                Não
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Request Body Example */}
            {endpoint.requestBody && (
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs">
                    📝
                  </span>
                  Request Body
                  {typeof endpoint.requestBody === 'object' && (endpoint.requestBody as RequestBody).required && (
                    <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full">
                      Obrigatório
                    </span>
                  )}
                </h4>

                {/* Schema-based request body */}
                {typeof endpoint.requestBody === 'object' && (endpoint.requestBody as RequestBody).schema ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 rounded-l-lg">Campo</th>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Obrigatório</th>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 rounded-r-lg">Exemplo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {Object.entries((endpoint.requestBody as RequestBody).schema?.properties || {}).map(([name, prop]) => (
                            <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="p-3">
                                <code className="text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                                  {name}
                                </code>
                              </td>
                              <td className="p-3">
                                <span className="text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                  {prop.type}{prop.format ? ` (${prop.format})` : ''}
                                </span>
                              </td>
                              <td className="p-3">
                                {(endpoint.requestBody as RequestBody).schema?.required?.includes(name) ? (
                                  <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full font-medium">
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                                    Não
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">{prop.description || '-'}</td>
                              <td className="p-3">
                                {prop.example !== undefined && (
                                  <code className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                                    {typeof prop.example === 'string' ? `"${prop.example}"` : String(prop.example)}
                                  </code>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Example JSON */}
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                        Ver exemplo JSON
                      </summary>
                      <div className="mt-2 p-3 bg-slate-900 rounded-lg overflow-x-auto">
                        <pre className="text-sm text-emerald-400 font-mono">
                          {JSON.stringify(
                            Object.fromEntries(
                              Object.entries((endpoint.requestBody as RequestBody).schema?.properties || {}).map(([k, v]) => [k, v.example ?? `<${v.type}>`])
                            ),
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-emerald-400 font-mono">
                      {typeof endpoint.requestBody === 'string'
                        ? endpoint.requestBody
                        : JSON.stringify(endpoint.requestBody, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Responses */}
            {endpoint.responses && endpoint.responses.length > 0 && (
              <div className="p-5">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
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
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50">
                          <span className={clsx(
                            'px-3 py-1 rounded-lg font-mono font-bold text-sm border',
                            statusColor
                          )}>
                            {response.status}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{response.description}</span>
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

            {/* Response Example (from simple format) */}
            {endpoint.response && !endpoint.responses?.length && (
              <div className="p-5">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs">
                    📤
                  </span>
                  Response
                </h4>
                <div className="p-3 bg-slate-900 rounded-lg overflow-x-auto">
                  <pre className="text-sm text-emerald-400 font-mono">
                    {typeof endpoint.response === 'string'
                      ? endpoint.response
                      : JSON.stringify(endpoint.response, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Testing Modal */}
      {showTester && baseUrl && (
        <APITestingPanel
          endpoint={endpoint}
          baseUrl={baseUrl}
          onClose={() => setShowTester(false)}
        />
      )}
    </>
  )
}

export default function EndpointsSection({ baseUrl, endpoints, info, tags, className, enableTesting = true }: EndpointsSectionProps) {
  const [filter, setFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped')

  const methods = ['all', ...new Set(endpoints.map(e => e.method))]

  // Get unique tags from endpoints
  const endpointTags = ['all', ...new Set(endpoints.map(e => e.tag || 'Outros').filter(Boolean))]

  // Use provided tags or generate from endpoints
  const tagDescriptions: Record<string, string> = {}
  if (tags) {
    tags.forEach(t => { tagDescriptions[t.name] = t.description || '' })
  }

  const filteredEndpoints = endpoints.filter(e => {
    const methodMatch = filter === 'all' || e.method === filter
    const tagMatch = tagFilter === 'all' || (e.tag || 'Outros') === tagFilter
    return methodMatch && tagMatch
  })

  // Group endpoints by tag
  const groupedEndpoints = filteredEndpoints.reduce((acc, endpoint) => {
    const tag = endpoint.tag || 'Outros'
    if (!acc[tag]) acc[tag] = []
    acc[tag].push(endpoint)
    return acc
  }, {} as Record<string, Endpoint[]>)

  // Effective base URL
  const effectiveBaseUrl = baseUrl || info?.baseUrl

  return (
    <div className={clsx('space-y-6', className)}>
      {/* API Info Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
                🔌
              </span>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  {info?.title || 'API Endpoints'}
                  {info?.version && (
                    <span className="px-2 py-0.5 text-xs bg-indigo-500/30 text-indigo-300 rounded-full font-mono">
                      v{info.version}
                    </span>
                  )}
                  {enableTesting && (
                    <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                      Try it out
                    </span>
                  )}
                </h3>
                {info?.description && (
                  <p className="text-sm text-slate-400 mt-1">{info.description}</p>
                )}
              </div>
            </div>
            {effectiveBaseUrl && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Base URL:</span>
                <code className="text-sm text-emerald-400 font-mono bg-slate-950/50 px-3 py-1 rounded-lg">
                  {effectiveBaseUrl}
                </code>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grouped')}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              Por Tag
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              Lista
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col md:flex-row gap-4">
          {/* Method Filter */}
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-2 block">Filtrar por método:</label>
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

          {/* Tag Filter */}
          {endpointTags.length > 2 && (
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Filtrar por recurso:</label>
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {endpointTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag === 'all' ? 'Todos os recursos' : tag}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{method}</div>
            </div>
          )
        })}
      </div>

      {/* Endpoints - Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-8">
          {Object.entries(groupedEndpoints).map(([tag, tagEndpoints]) => (
            <div key={tag} className="space-y-4">
              {/* Tag Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg">
                    {tag === 'Authentication' ? '🔐' :
                     tag === 'Users' ? '👥' :
                     tag === 'Products' ? '📦' :
                     tag === 'Orders' ? '🛒' :
                     tag === 'Projects' ? '📁' :
                     tag === 'Documents' ? '📄' :
                     tag === 'Settings' ? '⚙️' :
                     tag === 'Repositories' ? '📚' :
                     '🔗'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{tag}</h3>
                  {tagDescriptions[tag] && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{tagDescriptions[tag]}</p>
                  )}
                </div>
                <span className="ml-auto px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium">
                  {tagEndpoints.length} endpoint{tagEndpoints.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tag Endpoints */}
              <div className="space-y-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                {tagEndpoints.map((endpoint, index) => (
                  <EndpointCard
                    key={`${endpoint.method}-${endpoint.path}-${index}`}
                    endpoint={endpoint}
                    index={index}
                    baseUrl={effectiveBaseUrl}
                    enableTesting={enableTesting}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Endpoints - List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredEndpoints.map((endpoint, index) => (
            <EndpointCard
              key={`${endpoint.method}-${endpoint.path}-${index}`}
              endpoint={endpoint}
              index={index}
              baseUrl={effectiveBaseUrl}
              enableTesting={enableTesting}
            />
          ))}
        </div>
      )}

      {filteredEndpoints.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>Nenhum endpoint encontrado para os filtros selecionados.</p>
        </div>
      )}
    </div>
  )
}
