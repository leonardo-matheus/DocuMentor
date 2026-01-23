import { ReactNode } from 'react'
import clsx from 'clsx'

type HighlightVariant = 'info' | 'success' | 'warning' | 'error' | 'tip' | 'note'

interface HighlightBoxProps {
  variant?: HighlightVariant
  icon?: string
  title?: string
  children: ReactNode
  className?: string
}

const variantConfig: Record<HighlightVariant, {
  bg: string
  border: string
  iconBg: string
  titleColor: string
  glow: string
}> = {
  info: {
    bg: 'from-blue-50/80 to-indigo-50/80',
    border: 'border-blue-400',
    iconBg: 'from-blue-500 to-indigo-600',
    titleColor: 'text-blue-900',
    glow: 'rgba(59, 130, 246, 0.15)'
  },
  success: {
    bg: 'from-emerald-50/80 to-green-50/80',
    border: 'border-emerald-400',
    iconBg: 'from-emerald-500 to-green-600',
    titleColor: 'text-emerald-900',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  warning: {
    bg: 'from-amber-50/80 to-orange-50/80',
    border: 'border-amber-400',
    iconBg: 'from-amber-500 to-orange-500',
    titleColor: 'text-amber-900',
    glow: 'rgba(245, 158, 11, 0.15)'
  },
  error: {
    bg: 'from-red-50/80 to-rose-50/80',
    border: 'border-red-400',
    iconBg: 'from-red-500 to-rose-600',
    titleColor: 'text-red-900',
    glow: 'rgba(239, 68, 68, 0.15)'
  },
  tip: {
    bg: 'from-purple-50/80 to-violet-50/80',
    border: 'border-purple-400',
    iconBg: 'from-purple-500 to-violet-600',
    titleColor: 'text-purple-900',
    glow: 'rgba(139, 92, 246, 0.15)'
  },
  note: {
    bg: 'from-slate-50/80 to-gray-50/80',
    border: 'border-slate-400',
    iconBg: 'from-slate-500 to-gray-600',
    titleColor: 'text-slate-900',
    glow: 'rgba(100, 116, 139, 0.15)'
  }
}

const defaultIcons: Record<HighlightVariant, string> = {
  info: '💡',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  tip: '💎',
  note: '📝'
}

export default function HighlightBox({ 
  variant = 'info', 
  icon, 
  title, 
  children, 
  className 
}: HighlightBoxProps) {
  const displayIcon = icon ?? defaultIcons[variant]
  const config = variantConfig[variant]
  
  return (
    <div 
      className={clsx(
        'group relative overflow-hidden rounded-xl p-5 backdrop-blur-sm transition-all duration-300',
        `bg-gradient-to-br ${config.bg}`,
        `border-l-4 ${config.border}`,
        'hover:scale-[1.01]',
        className
      )}
      style={{ boxShadow: `0 4px 20px ${config.glow}` }}
    >
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex gap-4">
        {/* Icon */}
        <div className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-md',
          `bg-gradient-to-br ${config.iconBg}`,
          'transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6'
        )}>
          {displayIcon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={clsx('font-bold text-base mb-1.5', config.titleColor)}>
              {title}
            </h4>
          )}
          <div className="text-gray-700 text-[15px] leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}
