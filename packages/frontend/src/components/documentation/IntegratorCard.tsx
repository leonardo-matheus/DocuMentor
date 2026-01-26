import clsx from 'clsx'

type IntegratorVariant = 'link' | 'wps' | 'parco' | 'wisetools' | 'default' | 'primary' | 'success' | 'warning'

interface IntegratorCardProps {
  variant?: IntegratorVariant
  icon: string
  name: string
  subtitle: string
  features: string[]
  onClick?: () => void
  className?: string
}

const variantConfig: Record<IntegratorVariant, {
  headerBg: string
  iconBg: string
  checkBg: string
  glowColor: string
}> = {
  link: {
    headerBg: 'from-sky-500 to-cyan-600',
    iconBg: 'from-sky-100 to-cyan-100',
    checkBg: 'bg-sky-500',
    glowColor: 'rgba(14, 165, 233, 0.2)'
  },
  wps: {
    headerBg: 'from-violet-500 to-purple-600',
    iconBg: 'from-violet-100 to-purple-100',
    checkBg: 'bg-violet-500',
    glowColor: 'rgba(139, 92, 246, 0.2)'
  },
  parco: {
    headerBg: 'from-emerald-500 to-green-600',
    iconBg: 'from-emerald-100 to-green-100',
    checkBg: 'bg-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.2)'
  },
  wisetools: {
    headerBg: 'from-purple-500 to-pink-600',
    iconBg: 'from-purple-100 to-pink-100',
    checkBg: 'bg-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.2)'
  },
  default: {
    headerBg: 'from-slate-500 to-gray-600',
    iconBg: 'from-gray-100 to-slate-100',
    checkBg: 'bg-gray-500',
    glowColor: 'rgba(100, 116, 139, 0.2)'
  },
  primary: {
    headerBg: 'from-indigo-500 to-blue-600',
    iconBg: 'from-indigo-100 to-blue-100',
    checkBg: 'bg-indigo-500',
    glowColor: 'rgba(99, 102, 241, 0.2)'
  },
  success: {
    headerBg: 'from-green-500 to-emerald-600',
    iconBg: 'from-green-100 to-emerald-100',
    checkBg: 'bg-green-500',
    glowColor: 'rgba(34, 197, 94, 0.2)'
  },
  warning: {
    headerBg: 'from-amber-500 to-orange-600',
    iconBg: 'from-amber-100 to-orange-100',
    checkBg: 'bg-amber-500',
    glowColor: 'rgba(245, 158, 11, 0.2)'
  }
}

export default function IntegratorCard({
  variant = 'default',
  icon,
  name,
  subtitle,
  features,
  onClick,
  className,
}: IntegratorCardProps) {
  const config = variantConfig[variant]
  
  return (
    <div
      className={clsx(
        'group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer',
        'hover:-translate-y-2',
        className
      )}
      style={{
        boxShadow: `0 4px 25px ${config.glowColor}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 25px 50px ${config.glowColor}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 25px ${config.glowColor}`
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className={clsx(
        'relative p-6 text-white overflow-hidden',
        `bg-gradient-to-br ${config.headerBg}`
      )}>
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border border-white/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm text-white/80">{subtitle}</p>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white">
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
              <span className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white mt-0.5 shadow-sm',
                config.checkBg
              )}>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
