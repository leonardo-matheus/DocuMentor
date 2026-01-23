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
        'faq-item',
        level > 0 && 'bg-gray-100',
        isOpen && 'active'
      )}
      data-faq-index={index}
    >
      {/* Question */}
      <button
        type="button"
        onClick={handleClick}
        className="faq-question"
      >
        {item.icon && <span className="text-xl">{item.icon}</span>}
        <span className="faq-question-text">
          {item.question}
        </span>
        <span className="faq-toggle">+</span>
      </button>
      
      {/* Answer */}
      <div className="faq-answer">
        {hasAnswer ? (
          <div className={clsx(level === 0 && item.icon && 'pl-10')}>
            {typeof item.answer === 'string' ? (
              <p>{item.answer}</p>
            ) : (
              item.answer
            )}
            
            {/* Nested Items */}
            {item.children && item.children.length > 0 && (
              <div className="mt-4 space-y-2">
                {item.children.map((child, i) => (
                  <FAQItemComponent key={child.id || i} item={child} level={level + 1} index={i} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic">Resposta não disponível.</p>
        )}
      </div>
    </div>
  )
}

export default function FAQSection({ items, className }: FAQSectionProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma pergunta frequente disponível.
      </div>
    )
  }
  
  return (
    <div className={clsx('faq-container', className)}>
      {items.map((item, index) => (
        <FAQItemComponent key={item.id || index} item={item} level={0} index={index} />
      ))}
    </div>
  )
}
