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
        'bg-white/95 backdrop-blur-xl border-b border-gray-200 z-40 transition-all duration-300 no-print',
        sticky && 'sticky top-0',
        isScrolled ? 'shadow-lg' : 'shadow-sm',
        className
      )}
    >
      <ul className="flex items-center justify-center gap-1 px-6 py-3 overflow-x-auto max-w-7xl mx-auto">
        {items.map((item) => {
          const isActive = activeSection === item.id
          return (
            <li key={item.id}>
              <button
                onClick={() => handleClick(item.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
                {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full ml-1 animate-pulse" />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
