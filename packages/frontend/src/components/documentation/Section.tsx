import { ReactNode } from 'react'
import clsx from 'clsx'

interface SectionProps {
  id: string
  number?: number
  title: string
  subtitle?: string
  icon?: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'alt' | 'gradient' | 'dark'
}

export default function Section({ 
  id, 
  number, 
  title, 
  subtitle, 
  icon,
  children, 
  className,
  variant = 'default' 
}: SectionProps) {
  const variantStyles = {
    default: 'bg-white',
    alt: 'bg-gradient-to-br from-slate-50 to-gray-100',
    gradient: 'bg-gradient-to-br from-indigo-50 via-white to-purple-50',
    dark: 'bg-gradient-to-br from-slate-900 to-slate-800 text-white'
  }
  
  const titleStyles = {
    default: 'text-gray-900',
    alt: 'text-gray-900',
    gradient: 'text-gray-900',
    dark: 'text-white'
  }
  
  const subtitleStyles = {
    default: 'text-gray-600',
    alt: 'text-gray-600',
    gradient: 'text-gray-600',
    dark: 'text-gray-300'
  }
  
  return (
    <section
      id={id}
      className={clsx(
        'relative py-20 px-6 overflow-hidden',
        variantStyles[variant],
        className
      )}
    >
      {/* Background Decorations */}
      {(variant === 'gradient' || variant === 'alt') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />
        </div>
      )}
      
      {variant === 'dark' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        </div>
      )}
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14">
          {/* Number Badge */}
          {number && (
            <div className="inline-flex items-center justify-center mb-6">
              <div className={clsx(
                "relative group",
                variant === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {/* Glow effect */}
                <div className={clsx(
                  "absolute inset-0 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity",
                  variant === 'dark' 
                    ? 'bg-gradient-to-br from-indigo-400 to-purple-400'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                )} />
                
                {/* Badge */}
                <div className={clsx(
                  "relative flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-sm",
                  variant === 'dark'
                    ? 'bg-white/10 border-white/20'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white'
                )}>
                  {icon && <span className="text-xl">{icon}</span>}
                  <span className="font-bold text-sm tracking-wide uppercase">
                    Seção {String(number).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Title */}
          <h2 className={clsx(
            "text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight",
            titleStyles[variant]
          )}>
            <span className={clsx(
              variant === 'dark' 
                ? 'bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent'
            )}>
              {title}
            </span>
          </h2>
          
          {/* Subtitle */}
          {subtitle && (
            <p className={clsx(
              "text-lg md:text-xl max-w-3xl mx-auto leading-relaxed",
              subtitleStyles[variant]
            )}>
              {subtitle}
            </p>
          )}
          
          {/* Decorative Line */}
          <div className="flex items-center justify-center mt-8">
            <div className={clsx(
              "h-1 w-24 rounded-full",
              variant === 'dark' 
                ? 'bg-gradient-to-r from-indigo-400 to-purple-400'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
            )} />
          </div>
        </div>
        
        {/* Section Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </section>
  )
}
