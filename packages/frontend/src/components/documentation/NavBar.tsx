import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'

interface NavItem {
  id: string
  label: string
  icon?: string
}

interface NavBarProps {
  items: NavItem[]
  sticky?: boolean
  className?: string
}

export default function NavBar({ items, sticky = true, className }: NavBarProps) {
  const [activeSection, setActiveSection] = useState<string>(items[0]?.id || '')
  const [isScrolled, setIsScrolled] = useState(false)
  
  const handleScroll = useCallback(() => {
    // Check if scrolled past hero
    setIsScrolled(window.scrollY > 300)
    
    // Find active section based on scroll position
    let currentSection = items[0]?.id || ''
    
    for (const item of items) {
      const element = document.getElementById(item.id)
      if (element) {
        const rect = element.getBoundingClientRect()
        // Section is considered active if its top is above the middle of viewport
        if (rect.top <= 200) {
          currentSection = item.id
        }
      }
    }
    
    setActiveSection(currentSection)
  }, [items])
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80 // Offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(id)
    }
  }
  
  return (
    <nav
      className={clsx(
        'z-40 transition-all duration-500 no-print',
        sticky && 'sticky top-0',
        isScrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50' 
          : 'bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-100/50',
        className
      )}
    >
      {/* Background Gradient when scrolled */}
      {isScrolled && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.02] via-purple-500/[0.02] to-pink-500/[0.02] pointer-events-none" />
      )}
      
      <div className="relative max-w-7xl mx-auto px-4">
        <ul className="flex items-center justify-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          {items.map((item, idx) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleClick(item.id)}
                  className={clsx(
                    'group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  )}
                >
                  {/* Active Background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30" />
                  )}
                  
                  {/* Hover Underline */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 group-hover:w-1/2" />
                  )}
                  
                  {/* Content */}
                  <span className="relative flex items-center gap-2">
                    {item.icon && (
                      <span className={clsx(
                        'text-base transition-transform duration-300',
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      )}>
                        {item.icon}
                      </span>
                    )}
                    <span className="relative">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm" />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      
      {/* Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ 
            width: `${((items.findIndex(i => i.id === activeSection) + 1) / items.length) * 100}%` 
          }}
        />
      </div>
    </nav>
  )
}
