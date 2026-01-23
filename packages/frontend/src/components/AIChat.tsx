import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Send, X, Loader2, Sparkles, Minimize2, Maximize2, GripVertical } from 'lucide-react'
import { aiApi } from '@/services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasAction?: boolean
  actionApplied?: boolean
}

interface AIChatProps {
  projectId: string
  projectName: string
  onApplySuggestion?: (suggestion: string) => void
  onSectionsUpdated?: () => void
  enableEditing?: boolean
}

type ChatSize = 'small' | 'medium' | 'large' | 'fullscreen'

const CHAT_SIZES: Record<ChatSize, { width: string; height: string }> = {
  small: { width: '380px', height: '450px' },
  medium: { width: '450px', height: '550px' },
  large: { width: '550px', height: '650px' },
  fullscreen: { width: '90vw', height: '80vh' }
}

export default function AIChat({ projectId, projectName, onApplySuggestion: _onApplySuggestion, onSectionsUpdated, enableEditing = true }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatSize, setChatSize] = useState<ChatSize>('medium')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: enableEditing 
        ? `Olá! 👋 Sou o assistente do DocuMentor com **poder de edição**!\n\n🖊️ **Posso editar a documentação em tempo real:**\n• "Mude o título para..."\n• "Adicione uma pergunta no FAQ sobre..."\n• "Remova a tecnologia X"\n• "Altere a descrição da visão geral"\n\n💬 **Também posso:**\n• Responder perguntas\n• Sugerir melhorias\n\nComo posso ajudar com **${projectName}**?`
        : `Olá! 👋 Sou o assistente do DocuMentor. Posso ajudar você a:\n\n• Alterar conteúdo de seções\n• Adicionar novas informações\n• Reformular textos\n• Sugerir melhorias\n\nComo posso ajudar com a documentação de **${projectName}**?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    const rect = chatRef.current?.getBoundingClientRect()
    if (rect) {
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      }
    }
  }, [])
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !startPosRef.current) return
      
      const deltaX = startPosRef.current.x - e.clientX
      const deltaY = startPosRef.current.y - e.clientY
      
      const newWidth = Math.max(350, Math.min(window.innerWidth * 0.9, startPosRef.current.width + deltaX))
      const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startPosRef.current.height + deltaY))
      
      setCustomSize({ width: newWidth, height: newHeight })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      startPosRef.current = null
    }
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Use chat-edit endpoint if editing is enabled
      if (enableEditing) {
        const response = await aiApi.chatEdit(projectId, input.trim(), messages.map(m => ({
          role: m.role,
          content: m.content
        })))
        
        const wasEdited = response.data.updated === true
        let responseContent = response.data.response || 'Desculpe, não consegui processar sua solicitação.'
        
        // Add visual indicator if something was edited
        if (wasEdited) {
          responseContent = `✅ **Alteração aplicada com sucesso!**\n\n${responseContent}`
        }
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          hasAction: !!response.data.action,
          actionApplied: wasEdited
        }
        
        setMessages(prev => [...prev, assistantMessage])
        
        // Notify parent to refresh if sections were updated
        if (wasEdited && onSectionsUpdated) {
          onSectionsUpdated()
        }
      } else {
        // Use regular chat endpoint
        const response = await aiApi.chat(projectId, input.trim(), messages.map(m => ({
          role: m.role,
          content: m.content
        })))
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.response || 'Desculpe, não consegui processar sua solicitação.',
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const cycleSize = () => {
    setCustomSize(null)
    const sizes: ChatSize[] = ['small', 'medium', 'large', 'fullscreen']
    const currentIndex = sizes.indexOf(chatSize)
    const nextIndex = (currentIndex + 1) % sizes.length
    setChatSize(sizes[nextIndex])
  }
  
  const currentSize = customSize 
    ? { width: `${customSize.width}px`, height: `${customSize.height}px` }
    : CHAT_SIZES[chatSize]
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-white z-50 animate-fade-in-up group"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    )
  }
  
  return (
    <div 
      ref={chatRef}
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 animate-scale-in flex flex-col overflow-hidden ${
        isResizing ? 'select-none' : ''
      } ${chatSize === 'fullscreen' ? 'bottom-[5vh] right-[5vw]' : ''}`}
      style={{
        width: isMinimized ? '320px' : currentSize.width,
        height: isMinimized ? '56px' : currentSize.height,
        maxWidth: '95vw',
        maxHeight: '90vh'
      }}
    >
      {/* Resize Handle */}
      {!isMinimized && chatSize !== 'fullscreen' && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10 bg-gradient-to-br from-gray-100 to-transparent rounded-br-lg"
        >
          <GripVertical className="w-3 h-3 rotate-45" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="font-semibold">Assistente IA</span>
          {!isMinimized && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {chatSize === 'fullscreen' ? 'Tela Cheia' : chatSize.charAt(0).toUpperCase() + chatSize.slice(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button
              onClick={cycleSize}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Alterar tamanho"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 transition-all duration-300 hover:shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1.5 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[42px] max-h-[120px]"
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </>
      )}
    </div>
  )
}
