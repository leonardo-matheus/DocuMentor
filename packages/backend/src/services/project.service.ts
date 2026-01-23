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
    // Get project with sections
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        },
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
          ${content.questions.map((q: any) => `
            <details class="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <summary class="p-6 cursor-pointer font-medium hover:bg-slate-700/50 transition">
                ${q.question}
              </summary>
              <div class="px-6 pb-6 text-slate-400">
                ${q.answer}
              </div>
            </details>
          `).join('')}
        </div>
      ` : '';
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
