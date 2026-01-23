
import clsx from 'clsx'

interface FlowStep {
  id: string
  icon: string
  title: string
  description?: string
  variant?: 'vehicle' | 'camera' | 'system' | 'database' | 'success' | 'default' | 'start' | 'process' | 'decision' | 'end'
}

interface FlowDiagramProps {
  steps: FlowStep[]
  title?: string
  subtitle?: string
  className?: string
}

const stepVariants: Record<string, { 
  gradient: string
  border: string
  shadow: string
  iconBg: string
  ring: string
  textColor: string
}> = {
  start: {
    gradient: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-emerald-500/30',
    textColor: 'text-white',
  },
  vehicle: {
    gradient: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-emerald-500/30',
    textColor: 'text-white',
  },
  process: {
    gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
    border: 'border-blue-200',
    shadow: 'shadow-blue-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-blue-500/30',
    textColor: 'text-white',
  },
  system: {
    gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
    border: 'border-blue-200',
    shadow: 'shadow-blue-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-blue-500/30',
    textColor: 'text-white',
  },
  camera: {
    gradient: 'bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600',
    border: 'border-pink-200',
    shadow: 'shadow-pink-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-pink-500/30',
    textColor: 'text-white',
  },
  decision: {
    gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600',
    border: 'border-amber-200',
    shadow: 'shadow-amber-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-amber-500/30',
    textColor: 'text-white',
  },
  database: {
    gradient: 'bg-gradient-to-br from-purple-400 via-purple-500 to-violet-600',
    border: 'border-purple-200',
    shadow: 'shadow-purple-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-purple-500/30',
    textColor: 'text-white',
  },
  end: {
    gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600',
    border: 'border-rose-200',
    shadow: 'shadow-rose-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-rose-500/30',
    textColor: 'text-white',
  },
  success: {
    gradient: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600',
    border: 'border-green-200',
    shadow: 'shadow-green-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-green-500/30',
    textColor: 'text-white',
  },
  default: {
    gradient: 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600',
    border: 'border-slate-200',
    shadow: 'shadow-slate-500/25',
    iconBg: 'bg-white/20',
    ring: 'ring-slate-500/30',
    textColor: 'text-white',
  },
}

export default function FlowDiagram({ steps, title, subtitle, className }: FlowDiagramProps) {
  return (
    <div className={clsx(
      'relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-3xl p-8 overflow-hidden',
      'border border-slate-200/60 shadow-xl shadow-slate-200/50',
      className
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #6366f1 1px, transparent 1px),
              linear-gradient(to bottom, #6366f1 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      
      {(title || subtitle) && (
        <div className="relative text-center mb-10">
          {title && (
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>
      )}
      
      {/* Flow Steps */}
      <div className="relative flex items-stretch justify-center gap-3 flex-wrap">
        {steps.map((step, idx) => {
          const variant = stepVariants[step.variant || 'default'] || stepVariants.default
          
          return (
            <div key={step.id} className="flex items-center group">
              {/* Step Card */}
              <div
                className={clsx(
                  'relative min-w-[160px] max-w-[200px] rounded-2xl overflow-hidden',
                  'transition-all duration-500 ease-out',
                  'hover:scale-105 hover:-translate-y-1',
                  `shadow-lg ${variant.shadow} hover:shadow-2xl`,
                  `ring-1 ${variant.ring}`
                )}
              >
                {/* Gradient background */}
                <div className={clsx('absolute inset-0', variant.gradient)} />
                
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10" />
                
                {/* Content */}
                <div className="relative p-5 text-center">
                  {/* Step number badge */}
                  <div className="absolute -top-0 -right-0 w-8 h-8 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/70 bg-white/20 rounded-bl-lg rounded-tr-xl px-2 py-1">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4',
                      'backdrop-blur-sm shadow-inner',
                      variant.iconBg,
                      'ring-1 ring-white/30',
                      'transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3'
                    )}
                  >
                    {step.icon}
                  </div>
                  
                  {/* Title */}
                  <h4 className={clsx('font-bold text-sm leading-tight mb-1 drop-shadow-md', variant.textColor)}>
                    {step.title}
                  </h4>
                  
                  {/* Description */}
                  {step.description && (
                    <p className="text-[11px] text-white/80 leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  )}
                </div>
                
                {/* Bottom shine effect */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
              
              {/* Animated Arrow Connector (except for last item) */}
              {idx < steps.length - 1 && (
                <div className="flex items-center mx-3 min-w-[50px]">
                  {/* Arrow line with animation */}
                  <div className="relative flex-1 h-0.5 w-8">
                    {/* Base line */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 rounded-full" />
                    
                    {/* Animated glow */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 rounded-full opacity-60 animate-pulse"
                    />
                  </div>
                  
                  {/* Arrow head */}
                  <div className="relative ml-1">
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      className="text-slate-500"
                    >
                      <path
                        d="M2 6h8M7 3l3 3-3 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
