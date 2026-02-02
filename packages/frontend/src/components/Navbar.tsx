import { Link, useLocation } from 'react-router-dom'
import { FolderOpen, Plus, Home, Globe, HelpCircle } from 'lucide-react'
import clsx from 'clsx'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const location = useLocation()

  const links = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/projects', label: 'Projetos', icon: FolderOpen },
    { to: '/publications', label: 'Publicações', icon: Globe },
    { to: '/projects/new', label: 'Novo Projeto', icon: Plus },
    { to: '/help', label: 'Ajuda', icon: HelpCircle },
  ]
  
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/assets/logo-movemais.svg"
              alt="Move Mais"
              className="h-10 group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-xl text-gray-900 dark:text-white">DocuMentor</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname === link.to
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            
            {/* Theme Toggle */}
            <div className="ml-4 pl-4 border-l border-gray-200 dark:border-slate-700">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
