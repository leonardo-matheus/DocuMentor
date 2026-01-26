import clsx from 'clsx'

type PlanVariant = 'avulso' | 'autorizado' | 'mensalista' | 'premium' | 'enterprise'

interface PlanFeature {
  icon: string
  title: string
  description: string
}

interface PlanCardProps {
  variant: PlanVariant
  icon: string
  title: string
  badge: string
  features: PlanFeature[]
  isPopular?: boolean
  className?: string
}

const variantConfig: Record<PlanVariant, {
  headerBg: string
  featureBg: string
  iconBg: string
  glowColor: string
  badgeColor: string
}> = {
  avulso: {
    headerBg: 'from-indigo-500 via-blue-500 to-indigo-600',
    featureBg: 'from-indigo-50 to-blue-50',
    iconBg: 'from-indigo-100 to-blue-100',
    glowColor: 'rgba(99, 102, 241, 0.2)',
    badgeColor: 'bg-indigo-100 text-indigo-700'
  },
  autorizado: {
    headerBg: 'from-amber-500 via-orange-500 to-amber-600',
    featureBg: 'from-amber-50 to-orange-50',
    iconBg: 'from-amber-100 to-orange-100',
    glowColor: 'rgba(245, 158, 11, 0.2)',
    badgeColor: 'bg-amber-100 text-amber-700'
  },
  mensalista: {
    headerBg: 'from-emerald-500 via-green-500 to-emerald-600',
    featureBg: 'from-emerald-50 to-green-50',
    iconBg: 'from-emerald-100 to-green-100',
    glowColor: 'rgba(16, 185, 129, 0.2)',
    badgeColor: 'bg-emerald-100 text-emerald-700'
  },
  premium: {
    headerBg: 'from-purple-500 via-violet-500 to-purple-600',
    featureBg: 'from-purple-50 to-violet-50',
    iconBg: 'from-purple-100 to-violet-100',
    glowColor: 'rgba(139, 92, 246, 0.2)',
    badgeColor: 'bg-purple-100 text-purple-700'
  },
  enterprise: {
    headerBg: 'from-slate-700 via-gray-700 to-slate-800',
    featureBg: 'from-slate-50 to-gray-50',
    iconBg: 'from-slate-100 to-gray-100',
    glowColor: 'rgba(71, 85, 105, 0.2)',
    badgeColor: 'bg-slate-100 text-slate-700'
  }
}

export default function PlanCard({
  variant,
  icon,
  title,
  badge,
  features,
  isPopular = false,
  className,
}: PlanCardProps) {
  const config = variantConfig[variant]
  
  return (
    <div
      className={clsx(
        'group relative bg-white rounded-2xl overflow-hidden transition-all duration-500',
        'hover:-translate-y-2',
        isPopular && 'ring-2 ring-emerald-400 ring-offset-2',
        className
      )}
      style={{
        boxShadow: `0 4px 25px ${config.glowColor}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 30px 60px ${config.glowColor}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 25px ${config.glowColor}`
      }}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -right-8 top-6 rotate-45 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold py-1 px-10 shadow-lg z-20">
          Popular
        </div>
      )}
      
      {/* Header */}
      <div className={clsx(
        'relative p-8 text-center text-white overflow-hidden',
        `bg-gradient-to-br ${config.headerBg}`
      )}>
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        
        {/* Icon */}
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm text-4xl mb-4 shadow-lg border border-white/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            {icon}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="relative text-2xl font-extrabold tracking-tight mb-3">{title}</h3>
        
        {/* Badge */}
        <span className={clsx(
          'relative inline-block px-4 py-1.5 rounded-full text-xs font-bold shadow-sm',
          isPopular ? 'bg-white text-gray-800' : config.badgeColor
        )}>
          {badge}
        </span>
      </div>
      
      {/* Features */}
      <div className={clsx('p-6 space-y-4', `bg-gradient-to-b ${config.featureBg}`)}>
        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="flex gap-4 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 transition-all duration-300 hover:bg-white hover:shadow-md"
          >
            <div className={clsx(
              'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm',
              `bg-gradient-to-br ${config.iconBg}`
            )}>
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-gray-900 font-bold">{feature.title}</strong>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
