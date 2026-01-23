import clsx from 'clsx'

type IntegratorVariant = 'link' | 'wps' | 'parco' | 'wisetools' | 'default'

interface IntegratorCardProps {
  variant?: IntegratorVariant
  icon: string
  name: string
  subtitle: string
  features: string[]
  onClick?: () => void
  className?: string
}

const variantStyles: Record<IntegratorVariant, { border: string; gradient: string }> = {
  link: {
    border: 'before:bg-gradient-to-r before:from-sky-500 before:to-sky-400',
    gradient: 'hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)]',
  },
  wps: {
    border: 'before:bg-gradient-to-r before:from-violet-500 before:to-violet-400',
    gradient: 'hover:shadow-[0_20px_40px_rgba(139,92,246,0.15)]',
  },
  parco: {
    border: 'before:bg-gradient-to-r before:from-emerald-500 before:to-emerald-400',
    gradient: 'hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)]',
  },
  wisetools: {
    border: 'before:bg-gradient-to-r before:from-purple-500 before:to-purple-400',
    gradient: 'hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)]',
  },
  default: {
    border: 'before:bg-gradient-to-r before:from-gray-400 before:to-gray-300',
    gradient: '',
  },
}

const iconBgStyles: Record<IntegratorVariant, string> = {
  link: 'bg-sky-100 text-sky-600',
  wps: 'bg-violet-100 text-violet-600',
  parco: 'bg-emerald-100 text-emerald-600',
  wisetools: 'bg-purple-100 text-purple-600',
  default: 'bg-gray-100 text-gray-600',
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
  const styles = variantStyles[variant]
  
  return (
    <div
      className={clsx(
        'relative bg-white rounded-2xl shadow-card transition-all duration-300 overflow-hidden cursor-pointer',
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-1',
        styles.border,
        styles.gradient,
        'hover:-translate-y-2',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <div
          className={clsx(
            'w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md',
            iconBgStyles[variant]
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      
      {/* Features */}
      <div className="px-6 pb-6">
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
              <span className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white mt-0.5',
                variant === 'link' && 'bg-sky-500',
                variant === 'wps' && 'bg-violet-500',
                variant === 'parco' && 'bg-emerald-500',
                variant === 'wisetools' && 'bg-purple-500',
                variant === 'default' && 'bg-gray-500'
              )}>
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
