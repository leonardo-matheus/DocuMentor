import { Link } from 'react-router-dom'
import {
  HelpCircle,
  FolderPlus,
  Sparkles,
  Edit3,
  Eye,
  Globe,
  MessageSquare,
  ChevronRight,
  GitBranch,
  RefreshCw,
  Layers,
  FileText,
  Settings,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Lightbulb
} from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Como usar o DocuMentor</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Guia completo para criar documentação profissional dos seus projetos usando inteligência artificial
          </p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Navegação Rápida
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="#criar-projeto" className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
              <FolderPlus className="w-5 h-5" />
              <span className="text-sm font-medium">Criar Projeto</span>
            </a>
            <a href="#gerar-ia" className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Gerar com IA</span>
            </a>
            <a href="#editar" className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
              <Edit3 className="w-5 h-5" />
              <span className="text-sm font-medium">Editar Seções</span>
            </a>
            <a href="#publicar" className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">Publicar</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Step 1: Criar Projeto */}
        <section id="criar-projeto" className="scroll-mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <FolderPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Passo 1</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar um Novo Projeto</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                O primeiro passo é criar um projeto vinculado a um repositório Git. O DocuMentor vai analisar o código fonte para gerar a documentação.
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary" />
                  Como criar:
                </h3>

                <ol className="space-y-4 ml-7">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">1</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Clique em <strong>"Novo Projeto"</strong> no menu ou na página inicial</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">2</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Selecione a <strong>organização</strong> do Gitea (ex: movemais)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">3</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Escolha o <strong>repositório</strong> que deseja documentar</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">4</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Aguarde a <strong>análise automática</strong> do código (frameworks, dependências, estrutura)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">5</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Clique em <strong>"Criar Projeto"</strong></p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Dica:</strong> O sistema detecta automaticamente o tipo de projeto (Node.js, Java Spring, React, etc.)
                      e extrai informações como dependências, variáveis de ambiente e rotas de API.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Gerar com IA */}
        <section id="gerar-ia" className="scroll-mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Passo 2</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preencher Seções com IA</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Cada seção da documentação pode ser preenchida automaticamente pela IA, que analisa o código do repositório para gerar conteúdo relevante.
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary" />
                  Como funciona:
                </h3>

                <ol className="space-y-4 ml-7">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-medium">1</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Acesse seu projeto e clique em <strong>"Editar"</strong></p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-medium">2</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Na lista de seções, clique no botão <strong className="text-purple-600">"Preencher com IA"</strong></p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-medium">3</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Aguarde alguns segundos enquanto a IA analisa e gera o conteúdo</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-medium">4</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Revise e ajuste o conteúdo conforme necessário</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Tipos de Seções Disponíveis:
                </h3>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Sobre o Sistema</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Descrição geral, público-alvo, problemas resolvidos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Arquitetura</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Diagramas e estrutura técnica do projeto</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Tecnologias</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Stack utilizada com versões</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Instalação</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Passo a passo para rodar o projeto</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Fluxos do Sistema</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Diagramas de sequência baseados no código</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">API / Endpoints</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Documentação estilo Swagger das rotas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">FAQ</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Perguntas frequentes sobre o sistema</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Changelog</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Release notes sincronizadas com Git</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Editar */}
        <section id="editar" className="scroll-mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Edit3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Passo 3</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar e Personalizar</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Após gerar o conteúdo com IA, você pode personalizar cada seção manualmente ou usar o chat com IA para fazer ajustes.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Manual Edit */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-600" />
                    Edição Manual
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Clique em qualquer seção para expandir o editor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Edite textos, títulos e descrições diretamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Adicione ou remova itens de listas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Reordene seções arrastando e soltando</span>
                    </li>
                  </ul>
                </div>

                {/* AI Chat */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Chat com IA
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Acesse o Preview para usar o chat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Peça para melhorar, expandir ou corrigir seções</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Solicite adição de novas informações</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Faça perguntas sobre a documentação</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Exemplos de comandos no chat:</strong>
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                      <li>"Melhore a descrição da seção Sobre"</li>
                      <li>"Adicione mais 3 perguntas no FAQ sobre segurança"</li>
                      <li>"Simplifique a explicação de instalação"</li>
                      <li>"Traduza a seção de tecnologias para inglês"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Preview */}
        <section id="preview" className="scroll-mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Passo 4</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar o Preview</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                O Preview mostra exatamente como a documentação ficará quando publicada. Use-o para revisar antes de publicar.
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary" />
                  Recursos do Preview:
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-indigo-900 dark:text-indigo-200 text-sm">Visualização Real</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">Veja exatamente como ficará publicado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-indigo-900 dark:text-indigo-200 text-sm">Chat Integrado</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">Converse com IA para ajustar conteúdo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-indigo-900 dark:text-indigo-200 text-sm">Sync com Git</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">Veja commits e sincronize changelog</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-indigo-900 dark:text-indigo-200 text-sm">Exportar HTML</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">Baixe como página HTML standalone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 5: Publicar */}
        <section id="publicar" className="scroll-mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Passo 5</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Publicar a Documentação</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Publique sua documentação para que toda a equipe possa acessar através de uma URL pública.
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary" />
                  Como publicar:
                </h3>

                <ol className="space-y-4 ml-7">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-medium">1</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Vá para a página <strong>"Publicações"</strong> no menu</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-medium">2</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Clique em <strong>"Nova Publicação"</strong></p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-medium">3</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Selecione o <strong>projeto</strong> que deseja publicar</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-medium">4</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Escolha uma <strong>categoria</strong> (ou crie uma nova)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-medium">5</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Defina o <strong>slug</strong> da URL (ex: meu-projeto)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-medium">6</span>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Clique em <strong>"Publicar"</strong></p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex gap-3">
                  <Globe className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>URL de Acesso:</strong> Após publicar, a documentação estará disponível em:
                    </p>
                    <code className="block mt-2 text-sm bg-green-100 dark:bg-green-900/50 px-3 py-2 rounded-lg text-green-800 dark:text-green-200">
                      https://seu-servidor/docs/slug-do-projeto
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Git Sync */}
        <section id="git-sync" className="scroll-mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Recurso Extra</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sincronização com Git</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                O DocuMentor pode sincronizar automaticamente com seu repositório Git para manter o changelog atualizado.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    Configurações de Sync
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Selecione a branch para monitorar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Auto-sync a cada 1 hora (configurável)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Visualize histórico de commits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Gere release notes automaticamente</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-orange-600" />
                    Sincronização Manual
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Acesse o Preview do projeto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Clique no ícone de sync no header</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Veja os novos commits disponíveis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Clique em "Sincronizar" para atualizar</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-8 text-white text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Pronto para começar?</h2>
          <p className="opacity-90 mb-6 max-w-lg mx-auto">
            Crie seu primeiro projeto e veja como é fácil gerar documentação profissional com IA
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            Criar Primeiro Projeto
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

      </div>
    </div>
  )
}
