import { useState, ReactNode } from 'react'
import clsx from 'clsx'

interface FAQItem {
  id?: string
  question: string
  answer: ReactNode
  icon?: string
  children?: FAQItem[]
}

interface FAQSectionProps {
  items: FAQItem[]
  className?: string
}

// Componente individual para cada item do FAQ
function FAQItemComponent({ item, level = 0, index }: { item: FAQItem; level?: number; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }
  
  // Check if answer has content
  const hasAnswer = item.answer && (
    typeof item.answer === 'string' ? item.answer.trim().length > 0 : true
  )
  
  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-xl transition-all duration-300',
        level === 0 
          ? 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-indigo-200/80' 
          : 'bg-gray-100/80 border border-gray-200/50',
        isOpen && level === 0 && 'shadow-lg border-indigo-300/50'
      )}
      data-faq-index={index}
    >
      {/* Question */}
      <button
        type="button"
        onClick={handleClick}
        className={clsx(
          'w-full flex items-center gap-4 p-5 text-left transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2'
        )}
      >
        {/* Icon */}
        {item.icon && (
          <span className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300',
            isOpen 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-600'
          )}>
            {item.icon}
          </span>
        )}
        
        {/* Question Text */}
        <span className={clsx(
          'flex-1 font-semibold text-gray-800 transition-colors duration-200',
          'group-hover:text-indigo-700',
          isOpen && 'text-indigo-700'
        )}>
          {item.question}
        </span>
        
        {/* Toggle Icon */}
        <span className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300',
          isOpen 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rotate-45 shadow-md' 
            : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
        )}>
          +
        </span>
      </button>
      
      {/* Answer */}
      <div className={clsx(
        'overflow-hidden transition-all duration-300 ease-out',
        isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-5 pb-5">
          <div className={clsx(
            'p-4 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 border border-gray-200/50',
            level === 0 && item.icon && 'ml-14'
          )}>
            {hasAnswer ? (
              <>
                {typeof item.answer === 'string' ? (
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                ) : (
                  <div className="text-gray-700 leading-relaxed">{item.answer}</div>
                )}
                
                {/* Nested Items */}
                {item.children && item.children.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {item.children.map((child, i) => (
                      <FAQItemComponent key={child.id || i} item={child} level={level + 1} index={i} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 italic">Resposta não disponível.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FAQSection({ items, className }: FAQSectionProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 text-3xl mb-4">
          ❓
        </div>
        <p className="text-gray-500">Nenhuma pergunta frequente disponível.</p>
      </div>
    )
  }
  
  return (
    <div className={clsx('space-y-4', className)}>
      {items.map((item, index) => (
        <FAQItemComponent key={item.id || index} item={item} level={0} index={index} />
      ))}
    </div>
  )
}
