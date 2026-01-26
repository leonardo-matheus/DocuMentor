import clsx from 'clsx'

interface SummaryCardProps {
  icon: string
  value: string
  label: string
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info'
}

const variantConfig = {
  default: {
    bg: 'from-white to-gray-50',
    iconBg: 'from-gray-100 to-gray-200',
    iconText: 'text-gray-700',
    accent: 'from-indigo-500 to-purple-500',
    glow: 'rgba(99, 102, 241, 0.15)'
  },
  primary: {
    bg: 'from-indigo-50 to-purple-50',
    iconBg: 'from-indigo-500 to-purple-600',
    iconText: 'text-white',
    accent: 'from-indigo-500 to-purple-500',
    glow: 'rgba(99, 102, 241, 0.25)'
  },
  success: {
    bg: 'from-emerald-50 to-green-50',
    iconBg: 'from-emerald-500 to-green-600',
    iconText: 'text-white',
    accent: 'from-emerald-500 to-green-500',
    glow: 'rgba(16, 185, 129, 0.25)'
  },
  warning: {
    bg: 'from-amber-50 to-orange-50',
    iconBg: 'from-amber-500 to-orange-500',
    iconText: 'text-white',
    accent: 'from-amber-500 to-orange-500',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  info: {
    bg: 'from-blue-50 to-cyan-50',
    iconBg: 'from-blue-500 to-cyan-600',
    iconText: 'text-white',
    accent: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59, 130, 246, 0.25)'
  }
}

export default function SummaryCard({ icon, value, label, className, variant = 'default' }: SummaryCardProps) {
  const config = variantConfig[variant]
  
  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-500 cursor-default',
        `bg-gradient-to-br ${config.bg}`,
        'border border-gray-100/80',
        'hover:-translate-y-2',
        className
      )}
      style={{
        boxShadow: `0 4px 20px ${config.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 40px ${config.glow}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 20px ${config.glow}`
      }}
    >
      {/* Background Decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon Container */}
      <div className="relative mb-4">
        <div className={clsx(
          'inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl transition-all duration-300',
          `bg-gradient-to-br ${config.iconBg}`,
          config.iconText,
          'shadow-lg group-hover:scale-110 group-hover:rotate-3'
        )}>
          {icon}
        </div>
      </div>
      
      {/* Value */}
      <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
        {value}
      </div>
      
      {/* Label */}
      <div className="text-gray-500 text-sm font-medium uppercase tracking-wide">
        {label}
      </div>
      
      {/* Bottom Accent Line */}
      <div className={clsx(
        'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-t-full transition-all duration-300',
        `bg-gradient-to-r ${config.accent}`,
        'w-0 group-hover:w-2/3'
      )} />
    </div>
  )
}
