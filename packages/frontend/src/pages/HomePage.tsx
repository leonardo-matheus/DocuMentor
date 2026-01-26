import { Link } from 'react-router-dom'
import { 
  FileText, 
  GitBranch, 
  Sparkles, 
  ArrowRight,
  Zap,
  Eye,
  Globe,
  Moon,
  Layers,
  BookOpen
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
            <Link to="/publications" className="btn btn-outline border-white/30 text-white hover:bg-white/10">
              <Globe className="w-5 h-5" />
              Ver Publicações
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Conecte seus repositórios, deixe a IA analisar e gere documentação visual profissional em minutos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-6">
                <GitBranch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                1. Conecte o Repositório
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Selecione entre os 66+ repositórios do Gitea MoveMais e adicione repositórios relacionados
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                2. Gere com IA
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Claude Opus 4.5 analisa código e README para gerar seções completas automaticamente
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                3. Publique e Compartilhe
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Publique com um clique e compartilhe a URL pública com toda a equipe
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Recursos Poderosos
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card dark:border dark:border-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-movemais/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-movemais" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Análise Automática</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Detecta frameworks, dependências e padrões automaticamente</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card dark:border dark:border-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Preview em Tempo Real</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Visualize a documentação enquanto edita</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card dark:border dark:border-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Drag & Drop</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Reordene seções e publicações arrastando</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card dark:border dark:border-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Publicações por Categoria</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Organize docs em categorias estilo apps</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card dark:border dark:border-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Modo Escuro</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Interface adaptável claro/escuro</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card dark:border dark:border-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Seção "Sobre"</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Docs acessíveis para toda empresa (RH, Comercial...)</p>
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
