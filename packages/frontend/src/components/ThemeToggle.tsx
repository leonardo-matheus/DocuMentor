import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-16 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1e293b, #334155)' 
          : 'linear-gradient(135deg, #fbbf24, #f59e0b)'
      }}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {/* Stars (visible in dark mode) */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1.5 left-2 w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-3 left-4 w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse delay-200" />
      </div>
      
      {/* Sun rays (visible in light mode) */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-1 right-3 w-1.5 h-1.5 bg-yellow-200/60 rounded-full" />
        <div className="absolute bottom-1.5 right-4 w-1 h-1 bg-orange-200/60 rounded-full" />
      </div>
      
      {/* Toggle circle */}
      <div
        className={`
          relative w-6 h-6 rounded-full shadow-lg 
          transform transition-all duration-300 ease-spring
          flex items-center justify-center
          ${isDark 
            ? 'translate-x-8 bg-slate-800 shadow-slate-900/50' 
            : 'translate-x-0 bg-white shadow-orange-400/30'
          }
        `}
      >
        {/* Icon with rotation animation */}
        <div className={`transition-transform duration-500 ${isDark ? 'rotate-0' : 'rotate-180'}`}>
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
      </div>
    </button>
  )
}
