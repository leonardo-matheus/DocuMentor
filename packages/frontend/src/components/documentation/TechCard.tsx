
import clsx from 'clsx'

type TechVariant = 'ocr' | 'rfid' | 'default'

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

const variantStyles: Record<TechVariant, { header: string; border: string; iconBg: string }> = {
  ocr: {
    header: 'bg-gradient-to-r from-pink-50 to-pink-100',
    border: 'border-pink-400 hover:shadow-[0_20px_40px_rgba(236,72,153,0.15)]',
    iconBg: 'bg-pink-500',
  },
  rfid: {
    header: 'bg-gradient-to-r from-cyan-50 to-cyan-100',
    border: 'border-cyan-400 hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)]',
    iconBg: 'bg-cyan-500',
  },
  default: {
    header: 'bg-gradient-to-r from-gray-50 to-gray-100',
    border: 'border-gray-300',
    iconBg: 'bg-gray-500',
  },
}

export default function TechCard({
  variant = 'default',
  icon,
  title,
  fullName,
  features,
  className,
}: TechCardProps) {
  const styles = variantStyles[variant]
  
  return (
    <div
      className={clsx(
        'tech-card border-t-4 transition-all duration-300',
        styles.border,
        className
      )}
    >
      {/* Header */}
      <div className={clsx('p-6 text-center', styles.header)}>
        <div
          className={clsx(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-3xl mb-4 shadow-lg',
            styles.iconBg
          )}
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {fullName && (
          <p className="text-sm text-gray-500 mt-1">{fullName}</p>
        )}
      </div>
      
      {/* Features */}
      <div className="p-6 space-y-4">
        {features.map((feature, idx) => (
          <div key={idx} className="flex gap-4">
            <div
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg',
                variant === 'ocr' && 'bg-pink-100',
                variant === 'rfid' && 'bg-cyan-100',
                variant === 'default' && 'bg-gray-100'
              )}
            >
              {feature.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
