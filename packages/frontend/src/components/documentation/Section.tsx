import { ReactNode } from 'react'
import clsx from 'clsx'

interface SectionProps {
  id: string
  number?: number
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'alt'
}

export default function Section({ 
  id, 
  number, 
  title, 
  subtitle, 
  children, 
  className,
  variant = 'default' 
}: SectionProps) {
  return (
    <section
      id={id}
      className={clsx(
        'py-16 px-6',
        variant === 'alt' && 'bg-gray-50',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="section-title">
          {number && (
            <div className="section-number">
              {number}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Section Content */}
        <div className="mt-12">
          {children}
        </div>
      </div>
    </section>
  )
}
