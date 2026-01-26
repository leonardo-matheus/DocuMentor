import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ArrowLeft } from 'lucide-react'
import { publicationsApi } from '@/services/api'
import { Link } from 'react-router-dom'

// Import documentation components
import Hero from '@/components/documentation/Hero'
import NavBar from '@/components/documentation/NavBar'
import Section from '@/components/documentation/Section'
import SummaryCard from '@/components/documentation/SummaryCard'
import TechCard from '@/components/documentation/TechCard'
import FlowDiagram from '@/components/documentation/FlowDiagram'
import FAQSection from '@/components/documentation/FAQSection'
import EndpointsSection from '@/components/documentation/EndpointsSection'
import ComparisonTable from '@/components/documentation/ComparisonTable'
import Footer from '@/components/documentation/Footer'

interface ProjectSection {
  id: string
  type: string
  title: string
  content: unknown
  order: number
}

export default function PublicDocPage() {
  const { slug } = useParams<{ slug: string }>()
  
  const { data: publication, isLoading, error } = useQuery({
    queryKey: ['publication', slug],
    queryFn: () => publicationsApi.getBySlug(slug!).then(res => res.data),
    enabled: !!slug,
    retry: false
  })
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando documentação...</p>
        </div>
      </div>
    )
  }
  
  if (error || !publication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📄</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documentação não encontrada</h1>
          <p className="text-gray-600 mb-6">
            A documentação que você procura não existe ou não está disponível.
          </p>
          <Link 
            to="/publications" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todas as documentações
          </Link>
        </div>
      </div>
    )
  }
  
  // Parse sections from publication content
  const sections: ProjectSection[] = JSON.parse(publication.content || '[]')
  
  // Build navigation items
  const navItems = sections
    .filter(s => s.type !== 'hero')
    .map(s => ({
      id: s.id,
      label: s.title,
      icon: getIconForType(s.type)
    }))
  
  return (
    <div className="min-h-screen bg-white">
      {/* Back to publications link */}
      <div className="fixed top-4 left-4 z-50">
        <Link 
          to="/publications" 
          className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>
      
      {/* Version badge */}
      {publication.version && (
        <div className="fixed top-4 right-4 z-50">
          <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium shadow-lg">
            v{publication.version}
          </span>
        </div>
      )}
      
      {/* Render sections */}
      {sections.map((section, index) => renderSection(section, index, sections.length))}
      
      {/* Navigation */}
      {navItems.length > 0 && <NavBar items={navItems} />}
      
      {/* Footer */}
      <Footer 
        copyright={`© ${new Date().getFullYear()} ${publication.title}. Documentação gerada por DocuMentor.`}
      />
    </div>
  )
}

function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    hero: '🎯',
    overview: '📋',
    architecture: '🏗️',
    technologies: '⚙️',
    flow: '🔄',
    faq: '❓',
    api: '🔌',
    comparison: '📊',
    installation: '📦',
    changelog: '📝'
  }
  return icons[type] || '📄'
}

function renderSection(section: ProjectSection, index: number, _total: number) {
  const content = section.content as any
  
  switch (section.type) {
    case 'hero':
      return (
        <Hero
          key={section.id}
          title={content.title || section.title}
          subtitle={content.subtitle || content.description || ''}
          projectName={content.projectName}
          logos={content.logos}
          meta={content.meta}
          highlights={content.highlights}
        />
      )
    
    case 'overview':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content.benefits || []).map((benefit: any, i: number) => (
              <SummaryCard
                key={i}
                icon={benefit.icon || '✨'}
                value={benefit.title || benefit.name || ''}
                label={benefit.description || ''}
              />
            ))}
          </div>
          
          {content.objectives?.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Objetivos</h4>
              <ul className="space-y-2">
                {content.objectives.map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span className="text-gray-700">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )
    
    case 'architecture':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          {content.pattern && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
              <span className="text-sm font-medium text-indigo-700">
                Padrão: {content.pattern}
              </span>
            </div>
          )}
          
          {content.layers?.length > 0 && (
            <div className="space-y-4">
              {content.layers.map((layer: any, i: number) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border-l-4 border-primary">
                  <h4 className="font-semibold text-gray-900">{layer.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">{layer.description}</p>
                  {layer.components?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {layer.components.filter(Boolean).map((comp: string, j: number) => (
                        <span key={j} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )
    
    case 'technologies':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          {(content.categories || []).map((cat: any, catIdx: number) => (
            <div key={catIdx} className="mb-8 last:mb-0">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">{cat.category}</h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(cat.items || []).map((tech: any, i: number) => (
                  <TechCard
                    key={i}
                    icon={tech.icon || '🔧'}
                    title={tech.name}
                    fullName={tech.version ? `${tech.name} ${tech.version}` : tech.name}
                    features={tech.description ? [{ icon: '📝', title: tech.description, description: '' }] : []}
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>
      )
    
    case 'flow':
      const hasMultipleFlows = Array.isArray(content.flows) && content.flows.length > 0
      
      const processStep = (step: any) => {
        const stepType = step.type || step.variant || ''
        return {
          id: step.id,
          icon: step.icon || getFlowIcon(step.title, stepType),
          title: step.title,
          description: step.description,
          variant: step.variant || getFlowVariant(step.title, stepType)
        }
      }
      
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          {hasMultipleFlows ? (
            <FlowDiagram
              flows={content.flows.map((flow: any) => ({
                id: flow.id,
                title: flow.title,
                description: flow.description,
                icon: flow.icon || '🔄',
                steps: (flow.steps || []).map(processStep)
              }))}
            />
          ) : content.steps ? (
            <FlowDiagram
              title={content.title}
              steps={content.steps.map(processStep)}
            />
          ) : null}
        </Section>
      )
    
    case 'faq':
      const faqItems = (content.questions || content.items || []).map((q: any) => ({
        question: q.question || q.title || '',
        answer: q.answer || q.description || '',
        icon: q.icon
      }))
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
        >
          <FAQSection items={faqItems} />
        </Section>
      )
    
    case 'api':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          <EndpointsSection
            baseUrl={content.baseUrl}
            endpoints={content.endpoints || []}
          />
        </Section>
      )
    
    case 'comparison':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
        >
          <ComparisonTable
            columns={content.columns || content.headers}
            rows={content.rows || []}
          />
        </Section>
      )
    
    case 'installation':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          {content.requirements?.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Requisitos</h4>
              <div className="flex flex-wrap gap-2">
                {content.requirements.map((req: any, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                    {req.name} {req.version && <span className="text-gray-500">{req.version}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {content.steps?.length > 0 && (
            <div className="space-y-4">
              {content.steps.map((step: any, i: number) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{step.title}</h5>
                      {step.description && (
                        <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                      )}
                      {step.commands?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {step.commands.filter(Boolean).map((cmd: string, j: number) => (
                            <pre key={j} className="px-3 py-2 bg-gray-900 text-green-400 rounded text-sm font-mono overflow-x-auto">
                              $ {cmd}
                            </pre>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )
    
    case 'changelog':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description}
        >
          {/* Render changelog timeline */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-[7px] top-4 bottom-24 w-px bg-slate-300" />
            
            <div className="space-y-6">
              {(content.releases || []).map((release: any, releaseIndex: number) => (
                <div key={releaseIndex} className="relative flex gap-4 pl-6">
                  <div className="absolute left-0 top-2">
                    <div className={`w-4 h-4 rounded-full ${
                      releaseIndex === 0 
                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                        : 'bg-slate-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded font-mono text-sm font-bold ${
                        releaseIndex === 0 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        v{release.version}
                      </span>
                      {release.date && (
                        <span className="text-sm text-gray-500">
                          {new Date(release.date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {release.categories?.features?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-emerald-600 mb-1.5">✨ Novidades</h5>
                          <ul className="space-y-1 pl-1">
                            {release.categories.features.map((f: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">›</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {release.categories?.fixes?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-amber-600 mb-1.5">🐛 Correções</h5>
                          <ul className="space-y-1 pl-1">
                            {release.categories.fixes.map((f: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">›</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )
    
    default:
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
        >
          <pre className="p-4 bg-gray-50 rounded-xl text-sm overflow-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        </Section>
      )
  }
}

function getFlowIcon(title: string, type: string): string {
  if (title?.toLowerCase().includes('erro') || type === 'error') return '❌'
  if (title?.toLowerCase().includes('sucesso') || type === 'success') return '✅'
  const icons: Record<string, string> = {
    start: '▶️', decision: '🔀', database: '🗄️', process: '⚙️',
    camera: '📷', vehicle: '🚗', system: '💻', end: '🏁'
  }
  return icons[type] || '⚙️'
}

function getFlowVariant(title: string, type: string): string {
  if (title?.toLowerCase().includes('erro') || type === 'error') return 'error'
  if (title?.toLowerCase().includes('sucesso') || type === 'success') return 'success'
  return type || 'default'
}
