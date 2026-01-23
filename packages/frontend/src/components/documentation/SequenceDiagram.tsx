import clsx from 'clsx'

interface Actor {
  id: string
  name: string
  color: string
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

export default function SequenceDiagram({ title, actors, messages, className }: SequenceDiagramProps) {
  const actorWidth = 120
  const messageHeight = 50
  const headerHeight = 60
  const padding = 40
  const totalWidth = actors.length * actorWidth + padding * 2
  const totalHeight = messages.length * messageHeight + headerHeight + padding * 2
  
  const getActorX = (actorId: string) => {
    const index = actors.findIndex(a => a.id === actorId)
    return padding + index * actorWidth + actorWidth / 2
  }
  
  return (
    <div className={clsx('bg-white rounded-2xl shadow-card p-6', className)}>
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>📊</span>
          {title}
        </h3>
      )}
      
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="min-w-full"
          style={{ minWidth: totalWidth }}
        >
          {/* Actor Headers */}
          {actors.map((actor) => {
            const x = getActorX(actor.id)
            return (
              <g key={actor.id}>
                {/* Actor Box */}
                <rect
                  x={x - 50}
                  y={padding}
                  width={100}
                  height={40}
                  rx={8}
                  fill={actor.color}
                  className="drop-shadow-md"
                />
                {/* Actor Name */}
                <text
                  x={x}
                  y={padding + 25}
                  textAnchor="middle"
                  className="text-sm font-semibold fill-white"
                >
                  {actor.name}
                </text>
                {/* Lifeline */}
                <line
                  x1={x}
                  y1={padding + 40}
                  x2={x}
                  y2={totalHeight - padding}
                  stroke={actor.color}
                  strokeWidth={2}
                  strokeDasharray="6,4"
                  opacity={0.5}
                />
              </g>
            )
          })}
          
          {/* Messages */}
          {messages.map((msg, idx) => {
            const fromX = getActorX(msg.from)
            const toX = getActorX(msg.to)
            const y = headerHeight + padding + idx * messageHeight + messageHeight / 2
            const isReverse = toX < fromX
            const midX = (fromX + toX) / 2
            
            return (
              <g key={idx}>
                {/* Arrow Line */}
                <line
                  x1={fromX}
                  y1={y}
                  x2={toX}
                  y2={y}
                  stroke={msg.type === 'response' ? '#9ca3af' : '#374151'}
                  strokeWidth={2}
                  strokeDasharray={msg.type === 'async' ? '6,4' : 'none'}
                />
                {/* Arrowhead */}
                <polygon
                  points={
                    isReverse
                      ? `${toX},${y} ${toX + 8},${y - 4} ${toX + 8},${y + 4}`
                      : `${toX},${y} ${toX - 8},${y - 4} ${toX - 8},${y + 4}`
                  }
                  fill={msg.type === 'response' ? '#9ca3af' : '#374151'}
                />
                {/* Label */}
                <text
                  x={midX}
                  y={y - 8}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {msg.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
