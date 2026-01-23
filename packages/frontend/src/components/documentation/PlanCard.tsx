
import clsx from 'clsx'

type PlanVariant = 'avulso' | 'autorizado' | 'mensalista'

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

const variantStyles: Record<PlanVariant, { border: string; header: string; shadow: string }> = {
  avulso: {
    border: 'border-indigo-500',
    header: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    shadow: 'hover:shadow-[0_30px_60px_rgba(99,102,241,0.2)]',
  },
  autorizado: {
    border: 'border-amber-500',
    header: 'bg-gradient-to-br from-amber-50 to-amber-100',
    shadow: 'hover:shadow-[0_30px_60px_rgba(245,158,11,0.2)]',
  },
  mensalista: {
    border: 'border-emerald-500',
    header: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    shadow: 'hover:shadow-[0_30px_60px_rgba(16,185,129,0.2)]',
  },
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
  const styles = variantStyles[variant]
  
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border-t-4 shadow-card transition-all duration-300',
        styles.border,
        styles.shadow,
        'hover:-translate-y-2',
        className
      )}
    >
      {/* Header */}
      <div className={clsx('p-6 text-center', styles.header)}>
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <span
          className={clsx(
            'inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold',
            isPopular
              ? 'bg-emerald-500 text-white'
              : 'bg-white/80 text-gray-600'
          )}
        >
          {badge}
        </span>
      </div>
      
      {/* Features */}
      <div className="p-6 space-y-4">
        {features.map((feature, idx) => (
          <div key={idx} className="flex gap-4">
            <span className="text-xl flex-shrink-0">{feature.icon}</span>
            <div>
              <strong className="block text-gray-900">{feature.title}</strong>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
