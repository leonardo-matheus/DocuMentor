
import clsx from 'clsx'

interface FlowStep {
  id: string
  icon: string
  title: string
  description?: string
  variant?: 'vehicle' | 'camera' | 'system' | 'database' | 'success' | 'default'
}

interface FlowDiagramProps {
  steps: FlowStep[]
  title?: string
  subtitle?: string
  className?: string
}

const stepVariants: Record<string, { border: string; bg: string; iconBg: string }> = {
  vehicle: {
    border: 'border-gray-300',
    bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
    iconBg: 'bg-gray-200',
  },
  camera: {
    border: 'border-pink-400',
    bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
    iconBg: 'bg-pink-500 text-white',
  },
  system: {
    border: 'border-blue-400',
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconBg: 'bg-blue-500 text-white',
  },
  database: {
    border: 'border-amber-400',
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
    iconBg: 'bg-amber-500 text-white',
  },
  success: {
    border: 'border-green-400',
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    iconBg: 'bg-green-500 text-white',
  },
  default: {
    border: 'border-gray-300',
    bg: 'bg-white',
    iconBg: 'bg-gray-100',
  },
}

export default function FlowDiagram({ steps, title, subtitle, className }: FlowDiagramProps) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-card p-8', className)}>
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {steps.map((step, idx) => {
          const variant = stepVariants[step.variant || 'default']
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step Box */}
              <div
                className={clsx(
                  'flow-step-box border-2 min-w-[140px] max-w-[180px]',
                  variant.border,
                  variant.bg
                )}
              >
                <div
                  className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm',
                    variant.iconBg
                  )}
                >
                  {step.icon}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{step.title}</h4>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
              
              {/* Arrow (except for last item) */}
              {idx < steps.length - 1 && (
                <div className="flow-arrow mx-2">→</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
