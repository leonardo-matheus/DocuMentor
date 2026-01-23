import clsx from 'clsx'

interface Actor {
  id: string
  name: string
  color: string
  icon?: string
}

interface Message {
  from: string
  to: string
  label: string
  type?: 'request' | 'response' | 'async'
}

interface SequenceDiagramProps {
  title?: string
  actors: Actor[]
  messages: Message[]
  className?: string
}

// Modern color palette for actors
const actorColors: Record<string, { bg: string; text: string; line: string }> = {
  '#6366f1': { bg: 'from-indigo-500 to-purple-600', text: 'text-white', line: '#6366f1' },
  '#10b981': { bg: 'from-emerald-500 to-teal-600', text: 'text-white', line: '#10b981' },
  '#f59e0b': { bg: 'from-amber-500 to-orange-600', text: 'text-white', line: '#f59e0b' },
  '#ef4444': { bg: 'from-rose-500 to-red-600', text: 'text-white', line: '#ef4444' },
  '#8b5cf6': { bg: 'from-violet-500 to-purple-600', text: 'text-white', line: '#8b5cf6' },
  '#06b6d4': { bg: 'from-cyan-500 to-blue-600', text: 'text-white', line: '#06b6d4' },
  '#ec4899': { bg: 'from-pink-500 to-rose-600', text: 'text-white', line: '#ec4899' },
  '#374151': { bg: 'from-gray-600 to-gray-800', text: 'text-white', line: '#374151' },
}

const defaultColors = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#374151'
]

export default function SequenceDiagram({ title, actors, messages, className }: SequenceDiagramProps) {
  const actorWidth = 140
  const messageHeight = 60
  const headerHeight = 80
  const padding = 50
  const totalWidth = actors.length * actorWidth + padding * 2
  const totalHeight = messages.length * messageHeight + headerHeight + padding * 2 + 20
  
  const getActorX = (actorId: string) => {
    const index = actors.findIndex(a => a.id === actorId)
    return padding + index * actorWidth + actorWidth / 2
  }
  
  return (
    <div className={clsx(
      'relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-3xl p-8 overflow-hidden',
      'border border-slate-200/60 shadow-xl shadow-slate-200/50',
      className
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-cyan-100/40 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #6366f1 1px, transparent 1px),
              linear-gradient(to bottom, #6366f1 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />
      </div>
      
      {title && (
        <h3 className="relative text-2xl font-bold mb-8 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            📊
          </span>
          <span className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
            {title}
          </span>
        </h3>
      )}
      
      <div className="relative overflow-x-auto rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/50 p-4">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="min-w-full"
          style={{ minWidth: totalWidth, minHeight: totalHeight }}
        >
          <defs>
            {/* Arrow markers */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#374151"
              />
            </marker>
            <marker
              id="arrowhead-gray"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#9ca3af"
              />
            </marker>
            <marker
              id="arrowhead-reverse"
              markerWidth="10"
              markerHeight="7"
              refX="1"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="10 0, 0 3.5, 10 7"
                fill="#374151"
              />
            </marker>
            {/* Gradients for actors */}
            {actors.map((actor, index) => {
              const color = actor.color || defaultColors[index % defaultColors.length]
              return (
                <linearGradient key={actor.id} id={`gradient-${actor.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                </linearGradient>
              )
            })}
            {/* Shadow filter */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
            </filter>
          </defs>
          
          {/* Actor Headers */}
          {actors.map((actor, index) => {
            const x = getActorX(actor.id)
            const color = actor.color || defaultColors[index % defaultColors.length]
            
            return (
              <g key={actor.id}>
                {/* Actor Box with gradient and shadow */}
                <rect
                  x={x - 55}
                  y={padding}
                  width={110}
                  height={50}
                  rx={12}
                  fill={`url(#gradient-${actor.id})`}
                  filter="url(#shadow)"
                />
                {/* Icon circle */}
                <circle
                  cx={x - 30}
                  cy={padding + 25}
                  r={14}
                  fill="rgba(255,255,255,0.2)"
                />
                <text
                  x={x - 30}
                  y={padding + 30}
                  textAnchor="middle"
                  className="text-base"
                  fill="white"
                >
                  {actor.icon || '👤'}
                </text>
                {/* Actor Name */}
                <text
                  x={x + 10}
                  y={padding + 30}
                  textAnchor="middle"
                  className="text-sm font-semibold"
                  fill="white"
                >
                  {actor.name}
                </text>
                
                {/* Lifeline with gradient fade */}
                <line
                  x1={x}
                  y1={padding + 50}
                  x2={x}
                  y2={totalHeight - padding}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="8,6"
                  opacity={0.4}
                />
                
                {/* Bottom actor box (footer) */}
                <rect
                  x={x - 40}
                  y={totalHeight - padding - 10}
                  width={80}
                  height={30}
                  rx={8}
                  fill={color}
                  opacity={0.3}
                />
                <text
                  x={x}
                  y={totalHeight - padding + 10}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="#374151"
                >
                  {actor.name}
                </text>
              </g>
            )
          })}
          
          {/* Messages with improved styling */}
          {messages.map((msg, idx) => {
            const fromX = getActorX(msg.from)
            const toX = getActorX(msg.to)
            const y = headerHeight + padding + idx * messageHeight + messageHeight / 2
            const isReverse = toX < fromX
            const isResponse = msg.type === 'response'
            const isAsync = msg.type === 'async'
            const midX = (fromX + toX) / 2
            
            const lineColor = isResponse ? '#9ca3af' : '#374151'
            const bgColor = isResponse ? 'rgba(156, 163, 175, 0.1)' : 'rgba(99, 102, 241, 0.1)'
            
            return (
              <g key={idx}>
                {/* Message background highlight */}
                <rect
                  x={Math.min(fromX, toX) - 10}
                  y={y - 18}
                  width={Math.abs(toX - fromX) + 20}
                  height={36}
                  rx={8}
                  fill={bgColor}
                  className="transition-all duration-300 hover:fill-indigo-100"
                />
                
                {/* Sequence number */}
                <circle
                  cx={Math.min(fromX, toX) + 5}
                  cy={y}
                  r={10}
                  fill={isResponse ? '#9ca3af' : '#6366f1'}
                />
                <text
                  x={Math.min(fromX, toX) + 5}
                  y={y + 4}
                  textAnchor="middle"
                  className="text-[10px] font-bold"
                  fill="white"
                >
                  {idx + 1}
                </text>
                
                {/* Arrow Line */}
                <line
                  x1={isReverse ? fromX - 15 : fromX + 25}
                  y1={y}
                  x2={isReverse ? toX + 15 : toX - 15}
                  y2={y}
                  stroke={lineColor}
                  strokeWidth={2}
                  strokeDasharray={isAsync ? '8,4' : isResponse ? '4,4' : 'none'}
                  markerEnd={isReverse ? 'url(#arrowhead-reverse)' : (isResponse ? 'url(#arrowhead-gray)' : 'url(#arrowhead)')}
                />
                
                {/* Label with background */}
                <rect
                  x={midX - 50}
                  y={y - 28}
                  width={100}
                  height={20}
                  rx={4}
                  fill="white"
                  stroke={isResponse ? '#d1d5db' : '#c7d2fe'}
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={y - 14}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill={isResponse ? '#6b7280' : '#4338ca'}
                >
                  {msg.label.length > 15 ? msg.label.slice(0, 15) + '...' : msg.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="relative mt-6 flex items-center justify-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-slate-700" />
          <span>Request</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-slate-400 border-b-2 border-dashed border-slate-400" style={{borderStyle: 'dashed'}} />
          <span>Response</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-b-2 border-dashed border-slate-700" />
          <span>Async</span>
        </div>
      </div>
    </div>
  )
}
