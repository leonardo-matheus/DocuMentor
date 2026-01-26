import { prisma } from '../index';
import { giteaService } from './gitea.service';
import { claudeService } from '../integrations/claude';

interface GenerateResult {
  success: boolean;
  projectId: string;
  sectionsGenerated: number;
  errors: string[];
}

export const projectService = {
  /**
   * Generate documentation for a project
   */
  async generateDocumentation(projectId: string, repositoryUrl: string): Promise<GenerateResult> {
    const errors: string[] = [];
    let sectionsGenerated = 0;

    try {
      // Analyze repository
      const repoAnalysis = await giteaService.analyzeRepository(repositoryUrl);
      
      // Store metadata
      await prisma.projectMetadata.upsert({
        where: { projectId },
        create: {
          projectId,
          languages: JSON.stringify(repoAnalysis.languages),
          frameworks: JSON.stringify(Object.keys(repoAnalysis.dependencies)),
          structure: JSON.stringify(repoAnalysis.structure.slice(0, 100)) // Limit for storage
        },
        update: {
          languages: JSON.stringify(repoAnalysis.languages),
          frameworks: JSON.stringify(Object.keys(repoAnalysis.dependencies)),
          structure: JSON.stringify(repoAnalysis.structure.slice(0, 100))
        }
      });

      // Delete existing sections
      await prisma.section.deleteMany({
        where: { projectId }
      });

      // Section types to generate
      const sectionTypes = [
        'hero',
        'overview',
        'architecture',
        'technologies',
        'flow',
        'integrations',
        'faq'
      ];

      // Generate each section
      for (let i = 0; i < sectionTypes.length; i++) {
        const sectionType = sectionTypes[i];
        
        try {
          console.log(`Generating ${sectionType} section...`);
          
          const content = await claudeService.generateSection(sectionType, {
            projectName: repoAnalysis.repo,
            description: repoAnalysis.description,
            languages: repoAnalysis.languages,
            readme: repoAnalysis.readme.slice(0, 5000), // Limit context
            structure: repoAnalysis.structure.slice(0, 50).join('\n'),
            dependencies: repoAnalysis.dependencies,
            configFiles: repoAnalysis.configFiles.join(', ')
          });

          // Save section
          await prisma.section.create({
            data: {
              projectId,
              type: sectionType,
              title: claudeService.getSectionTitle(sectionType),
              content: JSON.stringify(content),
              order: i
            }
          });

          sectionsGenerated++;
          console.log(`✅ ${sectionType} section generated`);
        } catch (error: any) {
          console.error(`❌ Error generating ${sectionType}:`, error.message);
          errors.push(`${sectionType}: ${error.message}`);
        }
      }

      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: { status: errors.length === 0 ? 'complete' : 'partial' }
      });

      return {
        success: errors.length === 0,
        projectId,
        sectionsGenerated,
        errors
      };
    } catch (error: any) {
      // Update status to error
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'error' }
      });

      throw error;
    }
  },

  /**
   * Export project documentation to HTML
   */
  async exportToHtml(projectId: string): Promise<string> {
    // Get project with metadata
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        metadata: true
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Generate HTML
    const html = generateHtmlDocument(project);
    return html;
  },

  /**
   * Regenerate a specific section
   */
  async regenerateSection(
    projectId: string, 
    sectionId: string
  ): Promise<any> {
    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      throw new Error('Section not found');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { metadata: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get fresh repo data
    const repoAnalysis = await giteaService.analyzeRepository(project.repositoryUrl);

    // Regenerate section
    const content = await claudeService.generateSection(section.type, {
      projectName: repoAnalysis.repo,
      description: repoAnalysis.description,
      languages: repoAnalysis.languages,
      readme: repoAnalysis.readme.slice(0, 5000),
      structure: repoAnalysis.structure.slice(0, 50).join('\n'),
      dependencies: repoAnalysis.dependencies
    });

    // Update section
    const updated = await prisma.section.update({
      where: { id: sectionId },
      data: {
        content: JSON.stringify(content)
      }
    });

    return updated;
  }
};

/**
 * Generate HTML document from project data
 */
function generateHtmlDocument(project: any): string {
  const metadata = project.metadata;
  const sections = project.sections;

  // Parse section contents
  const parsedSections = sections.map((s: any) => ({
    ...s,
    parsedContent: JSON.parse(s.content)
  }));

  // Get hero section
  const heroSection = parsedSections.find((s: any) => s.type === 'hero');
  const hero = heroSection?.parsedContent || { title: project.name, subtitle: '' };

  // Build sections HTML
  const sectionsHtml = parsedSections
    .filter((s: any) => s.type !== 'hero')
    .map((section: any) => generateSectionHtml(section))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hero.title} - Documentação</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); }
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); }
    .faq-question { user-select: none; }
    .faq-icon { display: inline-block; }
  </style>
</head>
<body class="bg-slate-900 text-white">
  <!-- Hero Section -->
  <header class="gradient-bg min-h-[60vh] flex items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
    <div class="container mx-auto px-6 text-center relative z-10">
      <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
        ${hero.title}
      </h1>
      <p class="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8">
        ${hero.subtitle || ''}
      </p>
      ${hero.badges ? `
      <div class="flex flex-wrap gap-3 justify-center">
        ${hero.badges.map((badge: any) => `
          <span class="px-4 py-2 bg-slate-800/50 rounded-full text-sm font-medium border border-slate-700">
            ${badge.label}
          </span>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </header>

  <main class="container mx-auto px-6 py-16">
    ${sectionsHtml}
  </main>

  <footer class="bg-slate-950 py-8 text-center text-slate-400">
    <p>Documentação gerada por DocuMentor</p>
    <p class="text-sm mt-2">© ${new Date().getFullYear()} MoveMais</p>
  </footer>
</body>
</html>`;
}

/**
 * Generate HTML for a section
 */
function generateSectionHtml(section: any): string {
  const content = section.parsedContent;
  
  let innerHtml = '';
  
  switch (section.type) {
    case 'overview':
      innerHtml = `
        <p class="text-lg text-slate-300 mb-6">${content.description || ''}</p>
        ${content.benefits ? `
        <div class="grid md:grid-cols-3 gap-6 mt-8">
          ${content.benefits.map((b: any) => `
            <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 card-hover">
              <h4 class="font-semibold text-lg mb-2">${b.title}</h4>
              <p class="text-slate-400">${b.description}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
      `;
      break;

    case 'technologies':
      innerHtml = content.categories ? content.categories.map((cat: any) => `
        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4 text-emerald-400">${cat.name}</h3>
          <div class="grid md:grid-cols-4 gap-4">
            ${cat.technologies.map((tech: any) => `
              <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center card-hover">
                <p class="font-medium">${tech.name}</p>
                ${tech.version ? `<p class="text-sm text-slate-400">${tech.version}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('') : '<p class="text-slate-400">Tecnologias não disponíveis</p>';
      break;

    case 'architecture':
      innerHtml = `
        <p class="text-lg text-slate-300 mb-6">${content.description || ''}</p>
        ${content.pattern ? `<p class="text-emerald-400 mb-4">Padrão: ${content.pattern}</p>` : ''}
        ${content.layers ? `
        <div class="space-y-4 mt-6">
          ${content.layers.map((layer: any) => `
            <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h4 class="font-semibold text-lg mb-2">${layer.name}</h4>
              <p class="text-slate-400 mb-3">${layer.description}</p>
              ${layer.components ? `
              <div class="flex flex-wrap gap-2">
                ${layer.components.map((c: string) => `
                  <span class="px-3 py-1 bg-slate-700 rounded text-sm">${c}</span>
                `).join('')}
              </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
      `;
      break;

    case 'faq':
      innerHtml = content.questions ? `
        <div class="space-y-4">
          ${content.questions.map((q: any, index: number) => `
            <div class="faq-item bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden" id="faq-${index}">
              <div class="faq-question p-6 cursor-pointer font-medium hover:bg-slate-700/50 transition flex items-center justify-between" onclick="toggleFaq(${index})">
                <span>${q.question}</span>
                <span class="faq-icon text-2xl font-light select-none transition-transform duration-300" id="faq-icon-${index}">+</span>
              </div>
              <div class="faq-answer hidden px-6 pb-6 text-slate-400" id="faq-answer-${index}">
                ${q.answer}
              </div>
            </div>
          `).join('')}
        </div>
        <script>
          function toggleFaq(index) {
            var answer = document.getElementById('faq-answer-' + index);
            var icon = document.getElementById('faq-icon-' + index);
            var item = document.getElementById('faq-' + index);
            if (answer.classList.contains('hidden')) {
              answer.classList.remove('hidden');
              icon.style.transform = 'rotate(45deg)';
              item.style.borderColor = 'rgb(99 102 241 / 0.5)';
            } else {
              answer.classList.add('hidden');
              icon.style.transform = 'rotate(0deg)';
              item.style.borderColor = '';
            }
          }
        </script>
      ` : '';
      break;

    case 'flow':
      // Generate flow diagram HTML with support for multiple flows
      const generateFlowStepsHtml = (steps: any[]) => {
        if (!steps || steps.length === 0) return '<p class="text-slate-400">Nenhum passo definido</p>';
        
        return `
          <div class="flex flex-wrap justify-center items-center gap-2 py-8">
            ${steps.map((step: any, idx: number) => {
              const bgColor = step.variant === 'error' ? 'bg-red-900/30 border-red-500/50' :
                              step.variant === 'success' ? 'bg-green-900/30 border-green-500/50' :
                              step.variant === 'start' ? 'bg-blue-900/30 border-blue-500/50' :
                              step.variant === 'decision' ? 'bg-yellow-900/30 border-yellow-500/50' :
                              'bg-slate-800/50 border-slate-700';
              
              return `
                <div class="flex items-center">
                  <div class="${bgColor} border rounded-xl p-4 text-center min-w-[140px] max-w-[200px]">
                    <span class="text-2xl block mb-2">${step.icon || '⚙️'}</span>
                    <p class="font-medium text-sm">${step.title}</p>
                    ${step.description ? `<p class="text-xs text-slate-400 mt-1">${step.description}</p>` : ''}
                  </div>
                  ${idx < steps.length - 1 ? '<span class="text-2xl text-slate-500 mx-2">→</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      };
      
      // Check if we have multiple flows (new format) or single steps (old format)
      if (content.flows && Array.isArray(content.flows) && content.flows.length > 0) {
        innerHtml = `
          <p class="text-lg text-slate-300 mb-6">${content.description || ''}</p>
          <div class="space-y-8">
            ${content.flows.map((flow: any) => `
              <div class="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
                <div class="flex items-center gap-3 mb-4">
                  <span class="text-3xl">${flow.icon || '🔄'}</span>
                  <div>
                    <h3 class="text-xl font-semibold text-emerald-400">${flow.title}</h3>
                    ${flow.description ? `<p class="text-sm text-slate-400">${flow.description}</p>` : ''}
                  </div>
                </div>
                ${generateFlowStepsHtml(flow.steps)}
              </div>
            `).join('')}
          </div>
        `;
      } else if (content.steps && content.steps.length > 0) {
        innerHtml = `
          <p class="text-lg text-slate-300 mb-6">${content.description || ''}</p>
          ${generateFlowStepsHtml(content.steps)}
        `;
      } else {
        innerHtml = '<p class="text-slate-400">Nenhum fluxo definido</p>';
      }
      break;

    case 'integrations':
      innerHtml = content.integrations ? `
        <p class="text-lg text-slate-300 mb-6">${content.description || ''}</p>
        <div class="grid md:grid-cols-2 gap-6">
          ${content.integrations.map((integration: any) => `
            <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 card-hover">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">${integration.icon || '🔗'}</span>
                <h4 class="font-semibold text-lg">${integration.name}</h4>
              </div>
              <p class="text-slate-400 mb-3">${integration.description || ''}</p>
              ${integration.endpoints ? `
                <div class="mt-4 space-y-2">
                  ${integration.endpoints.slice(0, 3).map((ep: any) => `
                    <div class="flex items-center gap-2 text-sm">
                      <span class="px-2 py-1 rounded text-xs font-medium ${
                        ep.method === 'GET' ? 'bg-green-900/50 text-green-400' :
                        ep.method === 'POST' ? 'bg-blue-900/50 text-blue-400' :
                        ep.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-400' :
                        ep.method === 'DELETE' ? 'bg-red-900/50 text-red-400' :
                        'bg-slate-700 text-slate-300'
                      }">${ep.method}</span>
                      <code class="text-slate-300">${ep.path}</code>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-slate-400">Nenhuma integração definida</p>';
      break;

    case 'changelog':
      const releases = content.releases || [];
      const upcoming = content.upcoming || {};
      innerHtml = `
        <div class="max-w-4xl mx-auto">
          ${content.currentVersion ? `
            <div class="flex justify-center mb-8">
              <span class="px-6 py-2 bg-emerald-600 text-white font-bold rounded-full text-lg">
                Versão Atual: ${content.currentVersion}
              </span>
            </div>
          ` : ''}
          
          ${content.description ? `<p class="text-lg text-slate-300 text-center mb-8">${content.description}</p>` : ''}
          
          <!-- Timeline -->
          <div class="relative">
            <div class="absolute left-2 top-4 bottom-[15rem] w-px bg-slate-600"></div>
            
            <div class="space-y-6">
              ${releases.map((release: any, index: number) => `
                <div class="relative pl-8">
                  <div class="absolute left-0 top-2 w-4 h-4 rounded-full ${
                    index === 0 
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                      : 'bg-slate-500'
                  }"></div>
                  
                  <div class="rounded-xl p-5 ${
                    index === 0 
                      ? 'bg-slate-800 border-2 border-emerald-500/50' 
                      : 'bg-slate-800/60 border border-slate-700'
                  }">
                    <div class="flex flex-wrap items-center gap-3 mb-3">
                      <span class="px-3 py-1 rounded text-sm font-bold font-mono ${
                        index === 0 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-700 text-slate-200'
                      }">
                        v${release.version}
                      </span>
                      <span class="text-sm text-slate-400">${release.date || ''}</span>
                      ${release.title ? `<span class="text-slate-200 font-medium">${release.title}</span>` : ''}
                    </div>
                    
                    ${release.description ? `<p class="text-slate-400 text-sm mb-4">${release.description}</p>` : ''}
                    
                    <div class="space-y-3">
                      ${release.categories?.features && release.categories.features.length > 0 ? `
                        <div>
                          <h5 class="text-emerald-400 font-semibold text-sm mb-1.5">✨ Novidades</h5>
                          <ul class="space-y-1 pl-1">
                            ${release.categories.features.map((f: string) => `
                              <li class="text-slate-300 text-sm flex items-start gap-2">
                                <span class="text-emerald-500 mt-0.5">›</span>
                                <span>${f}</span>
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      
                      ${release.categories?.fixes && release.categories.fixes.length > 0 ? `
                        <div>
                          <h5 class="text-amber-400 font-semibold text-sm mb-1.5">🐛 Correções</h5>
                          <ul class="space-y-1 pl-1">
                            ${release.categories.fixes.map((f: string) => `
                              <li class="text-slate-300 text-sm flex items-start gap-2">
                                <span class="text-amber-500 mt-0.5">›</span>
                                <span>${f}</span>
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      
                      ${release.categories?.improvements && release.categories.improvements.length > 0 ? `
                        <div>
                          <h5 class="text-sky-400 font-semibold text-sm mb-1.5">🔧 Melhorias</h5>
                          <ul class="space-y-1 pl-1">
                            ${release.categories.improvements.map((f: string) => `
                              <li class="text-slate-300 text-sm flex items-start gap-2">
                                <span class="text-sky-500 mt-0.5">›</span>
                                <span>${f}</span>
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      
                      ${release.categories?.breaking && release.categories.breaking.length > 0 ? `
                        <div class="bg-red-950/30 p-3 rounded-lg border border-red-500/30">
                          <h5 class="text-red-400 font-semibold text-sm mb-1.5">⚠️ Breaking Changes</h5>
                          <ul class="space-y-1 pl-1">
                            ${release.categories.breaking.map((f: string) => `
                              <li class="text-slate-300 text-sm flex items-start gap-2">
                                <span class="text-red-500 mt-0.5">›</span>
                                <span>${f}</span>
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          ${(upcoming.planned?.length > 0 || upcoming.inProgress?.length > 0) ? `
            <div class="mt-8 pt-6 border-t border-slate-600">
              <h4 class="text-lg font-bold text-white mb-4">🚀 Próximas Atualizações</h4>
              <div class="grid md:grid-cols-2 gap-4">
                ${upcoming.inProgress?.length > 0 ? `
                  <div class="bg-amber-900/40 border border-amber-500/50 rounded-lg p-4">
                    <h5 class="font-semibold text-amber-300 mb-3 text-sm">🔨 Em Desenvolvimento</h5>
                    <ul class="space-y-2">
                      ${upcoming.inProgress.map((item: string) => `
                        <li class="text-sm text-white flex items-center gap-2">
                          <span class="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0"></span>
                          ${item}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${upcoming.planned?.length > 0 ? `
                  <div class="bg-indigo-900/40 border border-indigo-500/50 rounded-lg p-4">
                    <h5 class="font-semibold text-indigo-300 mb-3 text-sm">📋 Planejado</h5>
                    <ul class="space-y-2">
                      ${upcoming.planned.map((item: string) => `
                        <li class="text-sm text-white flex items-center gap-2">
                          <span class="text-indigo-400">○</span>
                          ${item}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `;
      break;

    default:
      innerHtml = `<pre class="bg-slate-800 p-4 rounded-lg overflow-auto text-sm">${JSON.stringify(content, null, 2)}</pre>`;
  }

  return `
    <section class="mb-16">
      <h2 class="text-3xl font-bold mb-8 pb-4 border-b border-slate-700">${section.title}</h2>
      ${innerHtml}
    </section>
  `;
}
