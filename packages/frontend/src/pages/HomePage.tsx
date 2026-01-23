import { Link } from 'react-router-dom'
import { 
  FileText, 
  GitBranch, 
  Sparkles, 
  FolderOpen, 
  ArrowRight,
  Zap,
  Eye,
  Download
} from 'lucide-react'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden gradient-hero text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg mb-6 animate-fade-in-down">
            <FileText className="w-10 h-10" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-up leading-tight">
            DocuMentor
          </h1>
          
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Geração automática de documentação técnica com IA para os repositórios MoveMais
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/projects/new" className="btn btn-primary bg-white text-primary hover:bg-gray-100">
              <Sparkles className="w-5 h-5" />
              Começar Agora
            </Link>
            <Link to="/projects" className="btn btn-outline border-white/30 text-white hover:bg-white/10">
              <FolderOpen className="w-5 h-5" />
              Ver Projetos
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conecte seus repositórios, deixe a IA analisar e gere documentação visual profissional em minutos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="doc-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <GitBranch className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                1. Conecte o Repositório
              </h3>
              <p className="text-gray-600">
                Cole a URL do repositório Gitea e o sistema analisa automaticamente a estrutura do projeto
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="doc-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                2. Gere com IA
              </h3>
              <p className="text-gray-600">
                Claude Opus 4.5 analisa o código e gera documentação completa seguindo o padrão MoveMais
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="doc-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                3. Exporte e Compartilhe
              </h3>
              <p className="text-gray-600">
                Exporte como HTML standalone, PDF ou Markdown para wikis e repositórios
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recursos Poderosos
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 bg-white rounded-2xl p-6 shadow-card">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-movemais/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-movemais" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Análise Automática</h4>
                <p className="text-gray-600 text-sm">Detecta frameworks, dependências e padrões automaticamente</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white rounded-2xl p-6 shadow-card">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Preview em Tempo Real</h4>
                <p className="text-gray-600 text-sm">Visualize a documentação enquanto edita</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white rounded-2xl p-6 shadow-card">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Componentes Visuais</h4>
                <p className="text-gray-600 text-sm">Cards, diagramas, tabelas e fluxos prontos para usar</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white rounded-2xl p-6 shadow-card">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Integração Gitea</h4>
                <p className="text-gray-600 text-sm">Conecte diretamente com code.movemais.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para documentar seus projetos?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Comece a gerar documentação profissional em minutos
          </p>
          <Link 
            to="/projects/new" 
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            Criar Primeiro Projeto
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
