import { ReactNode } from 'react'
import clsx from 'clsx'

type HighlightVariant = 'info' | 'success' | 'warning' | 'error'

interface HighlightBoxProps {
  variant?: HighlightVariant
  icon?: string
  title?: string
  children: ReactNode
  className?: string
}

const variantStyles: Record<HighlightVariant, string> = {
  info: 'bg-blue-50 border-l-4 border-blue-500',
  success: 'bg-green-50 border-l-4 border-green-500',
  warning: 'bg-amber-50 border-l-4 border-amber-500',
  error: 'bg-red-50 border-l-4 border-red-500',
}

const defaultIcons: Record<HighlightVariant, string> = {
  info: '💡',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

export default function HighlightBox({ 
  variant = 'info', 
  icon, 
  title, 
  children, 
  className 
}: HighlightBoxProps) {
  const displayIcon = icon ?? defaultIcons[variant]
  
  return (
    <div className={clsx('highlight-box', variantStyles[variant], className)}>
      <span className="text-2xl flex-shrink-0">{displayIcon}</span>
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        )}
        <div className="text-gray-700">{children}</div>
      </div>
    </div>
  )
}
