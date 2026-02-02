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
import FlowDiagram from '@/components/documentation/FlowDiagram'
import FAQSection from '@/components/documentation/FAQSection'
import TroubleshootingSection from '@/components/documentation/TroubleshootingSection'
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
      {/* Navigation - Fixed at top */}
      {navItems.length > 0 && <NavBar items={navItems} />}
      
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
    
    case 'about':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.subtitle || 'Entenda de forma simples o que este sistema faz'}
        >
          {/* Introduction - Simple explanation */}
          {content.introduction && (
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  💡
                </div>
                <div>
                  <h4 className="text-lg font-bold text-indigo-900 mb-2">O que é o {content.systemName || 'Sistema'}?</h4>
                  <p className="text-indigo-800 leading-relaxed">{content.introduction}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Target Audience */}
          {content.targetAudience && content.targetAudience.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-lg">👥</span>
                Para quem é este sistema?
              </h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {content.targetAudience.map((audience: any, i: number) => (
                  <div key={i} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all">
                    <div className="text-2xl mb-2">{audience.icon || '👤'}</div>
                    <h5 className="font-semibold text-emerald-800">{audience.name}</h5>
                    <p className="text-sm text-emerald-700 mt-1">{audience.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Problems Solved */}
          {content.problemsSolved && content.problemsSolved.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-lg">🎯</span>
                Quais problemas este sistema resolve?
              </h4>
              <div className="space-y-3">
                {content.problemsSolved.map((problem: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{problem.before}</h5>
                      <div className="flex items-center gap-2 my-2">
                        <span className="text-red-500">❌ Antes</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-emerald-500">✅ Depois</span>
                      </div>
                      <p className="text-sm text-gray-600">{problem.after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Key Benefits - Visual Cards */}
          {content.keyBenefits && content.keyBenefits.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-lg">✨</span>
                Principais benefícios
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {content.keyBenefits.map((benefit: any, i: number) => (
                  <div key={i} className="p-5 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl border border-sky-100 text-center hover:shadow-lg transition-all">
                    <div className="text-3xl mb-3">{benefit.icon || '⭐'}</div>
                    <h5 className="font-bold text-gray-900 mb-1">{benefit.title}</h5>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* How it Works - Simple Steps */}
          {content.howItWorks && content.howItWorks.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-lg">🔄</span>
                Como funciona? (Passo a passo simples)
              </h4>
              <div className="relative">
                {/* Connection line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-300 via-indigo-300 to-sky-300 hidden md:block" />
                
                <div className="space-y-4">
                  {content.howItWorks.map((step: any, i: number) => (
                    <div key={i} className="relative flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all md:ml-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg relative z-10">
                        {step.icon || i + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{step.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        {step.example && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
                            💡 Exemplo: {step.example}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Metrics / KPIs */}
          {content.metrics && content.metrics.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-lg">📊</span>
                Indicadores e resultados
              </h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {content.metrics.map((metric: any, i: number) => (
                  <div key={i} className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100 text-center">
                    <div className="text-3xl font-bold text-rose-600 mb-1">{metric.value}</div>
                    <div className="text-sm font-medium text-gray-700">{metric.label}</div>
                    {metric.description && (
                      <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Glossary - Technical terms explained */}
          {content.glossary && content.glossary.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">📚</span>
                Glossário - Termos técnicos explicados
              </h4>
              <div className="bg-teal-50 rounded-xl border border-teal-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-teal-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800 w-1/4">Termo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">O que significa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {content.glossary.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-teal-100/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-teal-700">{item.term}</td>
                        <td className="px-4 py-3 text-gray-700">{item.definition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Integrations Overview */}
          {content.integrations && content.integrations.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-lg">🔗</span>
                Com quais sistemas ele se conecta?
              </h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {content.integrations.map((integration: any, i: number) => (
                  <div key={i} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center text-xl">
                        {integration.icon || '🔌'}
                      </div>
                      <h5 className="font-semibold text-gray-900">{integration.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick FAQ for Non-Technical Users */}
          {content.simpleFaq && content.simpleFaq.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">❓</span>
                Perguntas frequentes
              </h4>
              <div className="space-y-3">
                {content.simpleFaq.map((faq: any, i: number) => (
                  <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm group-open:bg-orange-500 group-open:text-white transition-colors">
                        ?
                      </div>
                      <span className="font-medium text-gray-900">{faq.question}</span>
                    </summary>
                    <div className="px-4 pb-4 pt-2 ml-11 text-gray-600 border-t border-gray-100">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </Section>
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
          subtitle={content.description || 'Tecnologias utilizadas no projeto'}
          variant="alt"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {(content.categories || []).map((cat: any, catIdx: number) => (
              <div key={catIdx} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">
                    {catIdx + 1}
                  </span>
                  {cat.name || cat.category}
                </h4>
                <div className="space-y-3">
                  {(cat.technologies || cat.items || []).map((tech: any, i: number) => {
                    // Check if icon is a URL or emoji
                    const isUrl = tech.icon && (tech.icon.startsWith('http') || tech.icon.startsWith('/'))
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
                          {isUrl ? (
                            <img
                              src={tech.icon}
                              alt={tech.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                                const parent = (e.target as HTMLImageElement).parentElement
                                if (parent) {
                                  parent.innerHTML = '<span class="text-2xl">💻</span>'
                                }
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{tech.icon || '💻'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{tech.name}</span>
                            {tech.version && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                v{tech.version}
                              </span>
                            )}
                          </div>
                          {tech.description && (
                            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 line-clamp-2">{tech.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
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
          ) : content.steps && content.steps.length > 0 ? (
            <FlowDiagram
              title={content.title}
              steps={content.steps.map(processStep)}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-4xl mb-3">🔄</div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Fluxo ainda não definido</h4>
              <p className="text-gray-500 text-sm">Regenere esta seção para gerar o diagrama de fluxo do sistema</p>
            </div>
          )}
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
    
    case 'troubleshooting':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
        >
          <TroubleshootingSection
            items={content.problems?.map((p: any) => ({
              id: `problem-${p.title?.slice(0, 20) || Math.random()}`,
              problem: p.title || 'Problema',
              icon: '⚠️',
              causes: (p.causes || []).map((c: any, i: number) => ({
                id: `cause-${i}`,
                title: c.description || '',
                description: c.warning ? `⚠️ ${c.warning}` : undefined,
                responsible: c.responsible,
                warning: c.warning,
                diagnosis: c.diagnosis,
                solution: c.solution
              }))
            })) || []}
          />
        </Section>
      )
    
    case 'api':
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.info?.description || content.description}
        >
          <EndpointsSection
            info={content.info}
            tags={content.tags}
            baseUrl={content.info?.baseUrl || content.baseUrl}
            endpoints={(content.endpoints || []).map((ep: any) => ({
              method: ep.method || 'GET',
              path: ep.path || ep.endpoint,
              summary: ep.summary || ep.description || '',
              description: ep.description,
              tag: ep.tag,
              security: ep.security,
              parameters: ep.parameters,
              requestBody: ep.requestBody,
              responses: ep.responses,
              tags: ep.tags
            }))}
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
      // Normalize content - support both old (releases[]) and new (version, categories) formats
      const normalizedRelease = content.version 
        ? {
            version: content.version,
            date: content.date,
            description: content.summary,
            categories: {
              features: content.categories?.novidades || [],
              fixes: content.categories?.correcoes || [],
              improvements: content.categories?.melhorias || [],
              breaking: content.categories?.breaking || []
            }
          }
        : null;
      const releases = content.releases || (normalizedRelease ? [normalizedRelease] : []);
      const currentVersion = content.currentVersion || content.version;
      
      return (
        <Section
          key={section.id}
          id={section.id}
          number={index}
          title={section.title}
          subtitle={content.description || content.summary || 'Histórico de versões e releases'}
        >
          {/* Current Version Badge */}
          {currentVersion && (
            <div className="flex justify-center mb-8">
              <span className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold text-lg shadow-lg">
                Versão Atual: {currentVersion}
              </span>
            </div>
          )}
          
          {/* Roadmap Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            {releases.length > 1 && (
              <div className="absolute left-[7px] top-4 bottom-[15rem] w-px bg-slate-600" />
            )}
            
            {/* Releases */}
            <div className="space-y-6">
              {releases.map((release: any, releaseIndex: number) => (
                <div key={releaseIndex} className="relative flex gap-4 pl-6">
                  {/* Timeline Node */}
                  <div className="absolute left-0 top-2">
                    <div className={`w-4 h-4 rounded-full ${
                      releaseIndex === 0 
                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                        : 'bg-slate-500'
                    }`} />
                  </div>
                  
                  {/* Release Card - Dark theme */}
                  <div className={`flex-1 rounded-xl p-5 ${
                    releaseIndex === 0 
                      ? 'bg-slate-800 border-2 border-emerald-500/50' 
                      : 'bg-slate-800/60 border border-slate-700'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded font-mono text-sm font-bold ${
                        releaseIndex === 0 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        v{release.version}
                      </span>
                      <span className="text-sm text-slate-400">
                        {release.date ? new Date(release.date).toLocaleDateString('pt-BR', { 
                          day: '2-digit',
                          month: 'short', 
                          year: 'numeric' 
                        }) : ''}
                      </span>
                      {release.title && (
                        <span className="text-slate-200 font-medium">{release.title}</span>
                      )}
                    </div>
                    
                    {release.description && (
                      <p className="text-slate-400 text-sm mb-4">{release.description}</p>
                    )}
                    
                    {/* Categories */}
                    <div className="space-y-3">
                      {/* Features / Novidades */}
                      {(release.categories?.features?.length > 0 || release.categories?.novidades?.length > 0) && (
                        <div>
                          <h5 className="text-sm font-semibold text-emerald-400 mb-1.5 flex items-center gap-2">
                            ✨ Novidades
                          </h5>
                          <ul className="space-y-1 pl-1">
                            {(release.categories?.features || release.categories?.novidades || []).map((feature: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">›</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Fixes / Correções */}
                      {(release.categories?.fixes?.length > 0 || release.categories?.correcoes?.length > 0) && (
                        <div>
                          <h5 className="text-sm font-semibold text-amber-400 mb-1.5 flex items-center gap-2">
                            🐛 Correções
                          </h5>
                          <ul className="space-y-1 pl-1">
                            {(release.categories?.fixes || release.categories?.correcoes || []).map((fix: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">›</span>
                                {fix}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Improvements / Melhorias */}
                      {(release.categories?.improvements?.length > 0 || release.categories?.melhorias?.length > 0) && (
                        <div>
                          <h5 className="text-sm font-semibold text-sky-400 mb-1.5 flex items-center gap-2">
                            🔧 Melhorias
                          </h5>
                          <ul className="space-y-1 pl-1">
                            {(release.categories?.improvements || release.categories?.melhorias || []).map((improvement: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-sky-500 mt-0.5">›</span>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Breaking Changes */}
                      {release.categories?.breaking?.length > 0 && (
                        <div className="bg-red-950/30 p-3 rounded-lg border border-red-500/30">
                          <h5 className="text-sm font-semibold text-red-400 mb-1.5 flex items-center gap-2">
                            ⚠️ Breaking Changes
                          </h5>
                          <ul className="space-y-1 pl-1">
                            {release.categories.breaking.map((breaking: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">›</span>
                                {breaking}
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
            
            {/* Upcoming/Roadmap */}
            {content.upcoming && (content.upcoming.planned?.length > 0 || content.upcoming.inProgress?.length > 0) && (
              <div className="mt-8 pt-6 border-t border-slate-300">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🚀 Próximas Atualizações
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {content.upcoming.inProgress?.length > 0 && (
                    <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-4">
                      <h5 className="font-semibold text-amber-700 mb-3 text-sm">🔨 Em Desenvolvimento</h5>
                      <ul className="space-y-2">
                        {content.upcoming.inProgress.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {content.upcoming.planned?.length > 0 && (
                    <div className="bg-indigo-100 border-2 border-indigo-400 rounded-lg p-4">
                      <h5 className="font-semibold text-indigo-700 mb-3 text-sm">📋 Planejado</h5>
                      <ul className="space-y-2">
                        {content.upcoming.planned.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                            <span className="text-indigo-500">○</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>
      )
    
    default:
      // Fallback detection based on content structure
      if (content?.problems && Array.isArray(content.problems)) {
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
          >
            <TroubleshootingSection
              items={content.problems.map((p: any) => ({
                id: `problem-${p.title?.slice(0, 20) || Math.random()}`,
                problem: p.title || 'Problema',
                icon: '⚠️',
                causes: (p.causes || []).map((c: any, i: number) => ({
                  id: `cause-${i}`,
                  title: c.description || '',
                  description: c.warning ? `⚠️ ${c.warning}` : undefined,
                  responsible: c.responsible,
                  warning: c.warning,
                  diagnosis: c.diagnosis,
                  solution: c.solution
                }))
              }))}
            />
          </Section>
        )
      }
      if (content?.questions && Array.isArray(content.questions)) {
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
          >
            <FAQSection
              items={content.questions.map((q: any) => ({
                question: q.question || q.title || '',
                answer: q.answer || q.description || '',
                icon: q.icon
              }))}
            />
          </Section>
        )
      }
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
