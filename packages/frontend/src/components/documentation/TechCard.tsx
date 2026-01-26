import clsx from 'clsx'

type TechVariant = 'ocr' | 'rfid' | 'default' | 'primary' | 'success' | 'warning'

interface TechFeature {
  icon: string
  title: string
  description: string
}

interface TechCardProps {
  variant?: TechVariant
  icon: string
  title: string
  fullName?: string
  features: TechFeature[]
  className?: string
}

const variantConfig: Record<TechVariant, {
  headerBg: string
  iconBg: string
  featureBg: string
  accentColor: string
  glowColor: string
}> = {
  ocr: {
    headerBg: 'from-pink-500 via-rose-500 to-pink-600',
    iconBg: 'from-pink-100 to-rose-100',
    featureBg: 'from-pink-50 to-rose-50',
    accentColor: 'text-pink-600',
    glowColor: 'rgba(236, 72, 153, 0.2)'
  },
  rfid: {
    headerBg: 'from-cyan-500 via-teal-500 to-cyan-600',
    iconBg: 'from-cyan-100 to-teal-100',
    featureBg: 'from-cyan-50 to-teal-50',
    accentColor: 'text-cyan-600',
    glowColor: 'rgba(6, 182, 212, 0.2)'
  },
  default: {
    headerBg: 'from-slate-600 via-gray-600 to-slate-700',
    iconBg: 'from-gray-100 to-slate-100',
    featureBg: 'from-gray-50 to-slate-50',
    accentColor: 'text-gray-600',
    glowColor: 'rgba(100, 116, 139, 0.2)'
  },
  primary: {
    headerBg: 'from-indigo-500 via-purple-500 to-indigo-600',
    iconBg: 'from-indigo-100 to-purple-100',
    featureBg: 'from-indigo-50 to-purple-50',
    accentColor: 'text-indigo-600',
    glowColor: 'rgba(99, 102, 241, 0.2)'
  },
  success: {
    headerBg: 'from-emerald-500 via-green-500 to-emerald-600',
    iconBg: 'from-emerald-100 to-green-100',
    featureBg: 'from-emerald-50 to-green-50',
    accentColor: 'text-emerald-600',
    glowColor: 'rgba(16, 185, 129, 0.2)'
  },
  warning: {
    headerBg: 'from-amber-500 via-orange-500 to-amber-600',
    iconBg: 'from-amber-100 to-orange-100',
    featureBg: 'from-amber-50 to-orange-50',
    accentColor: 'text-amber-600',
    glowColor: 'rgba(245, 158, 11, 0.2)'
  }
}

export default function TechCard({
  variant = 'default',
  icon,
  title,
  fullName,
  features,
  className,
}: TechCardProps) {
  const config = variantConfig[variant]
  
  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl bg-white transition-all duration-500',
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
    >
      {/* Header with Gradient */}
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
        
        {/* Glow Effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        
        {/* Icon */}
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm text-4xl mb-4 shadow-lg border border-white/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            {icon}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="relative text-2xl font-extrabold tracking-tight">{title}</h3>
        {fullName && (
          <p className="relative text-sm text-white/80 mt-2 font-medium">{fullName}</p>
        )}
      </div>
      
      {/* Features */}
      <div className={clsx('p-6 space-y-4', `bg-gradient-to-b ${config.featureBg}`)}>
        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="flex gap-4 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 transition-all duration-300 hover:bg-white hover:shadow-md"
          >
            <div
              className={clsx(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm',
                `bg-gradient-to-br ${config.iconBg}`
              )}
            >
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={clsx('font-bold text-gray-900 mb-0.5', config.accentColor)}>
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
