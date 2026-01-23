import { Router, Request, Response } from 'express';
import { claudeService } from '../integrations/claude';
import { giteaService } from '../services/gitea.service';
import { prisma } from '../index';

const router = Router();

// Section type labels for generated titles
const SECTION_LABELS: Record<string, string> = {
  hero: 'Apresentação',
  overview: 'Visão Geral',
  architecture: 'Arquitetura',
  technologies: 'Tecnologias',
  flow: 'Fluxo do Sistema',
  integrations: 'Integrações',
  api: 'API / Endpoints',
  faq: 'FAQ',
  glossary: 'Glossário',
  comparison: 'Comparativo',
  installation: 'Instalação',
  custom: 'Seção Personalizada',
};

// POST /api/ai/generate-section - Generate a section using AI
router.post('/generate-section', async (req: Request, res: Response) => {
  try {
    const { projectId, sectionType, context } = req.body;
    
    if (!projectId || !sectionType) {
      return res.status(400).json({ error: 'projectId and sectionType are required' });
    }
    
    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get repository data if available
    let repositoryData: any = {};
    if (project.repositoryUrl) {
      try {
        repositoryData = await giteaService.analyzeRepository(project.repositoryUrl);
      } catch (error) {
        console.warn('Could not fetch repository data:', error);
      }
    }
    
    // Handle 'auto' type - generate overview section
    const actualSectionType = sectionType === 'auto' ? 'overview' : sectionType;
    
    // Validate section type
    if (!SECTION_LABELS[actualSectionType] && !SECTION_LABELS[sectionType]) {
      return res.status(400).json({ error: `Unknown section type: ${sectionType}` });
    }
    
    // Generate section content
    const content = await claudeService.generateSection(actualSectionType, repositoryData, context);
    
    res.json({ 
      title: SECTION_LABELS[actualSectionType] || sectionType,
      content 
    });
  } catch (error: any) {
    console.error('Error generating section:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate-all - Generate all sections for a project
router.post('/generate-all', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get repository data
    let repositoryData: any = { projectName: project.name };
    if (project.repositoryUrl) {
      try {
        repositoryData = await giteaService.analyzeRepository(project.repositoryUrl);
        repositoryData.projectName = project.name;
      } catch (error) {
        console.warn('Could not fetch repository data:', error);
      }
    }
    
    // Section types to generate (in order)
    const sectionTypes = ['hero', 'overview', 'architecture', 'technologies', 'installation', 'flow', 'faq'];
    const sections: any[] = [];
    
    // Generate each section
    for (let i = 0; i < sectionTypes.length; i++) {
      const sectionType = sectionTypes[i];
      try {
        console.log(`Generating section: ${sectionType}`);
        const content = await claudeService.generateSection(sectionType, repositoryData);
        sections.push({
          id: `section-${Date.now()}-${i}`,
          type: sectionType,
          title: SECTION_LABELS[sectionType] || sectionType,
          content,
          order: i
        });
      } catch (error: any) {
        console.error(`Error generating ${sectionType}:`, error.message);
        // Continue with next section
      }
    }
    
    // Save sections to database
    await prisma.project.update({
      where: { id: projectId },
      data: {
        sections: JSON.stringify(sections),
        updatedAt: new Date()
      }
    });
    
    res.json({ 
      success: true,
      sectionsGenerated: sections.length,
      sections 
    });
  } catch (error: any) {
    console.error('Error generating all sections:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/generate-stream - Stream generation with Server-Sent Events
router.get('/generate-stream/:projectId', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  
  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  try {
    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      sendEvent('error', { message: 'Project not found' });
      res.end();
      return;
    }
    
    // Section types to generate
    const sectionTypes = ['hero', 'overview', 'architecture', 'technologies', 'installation', 'flow', 'faq'];
    const totalSections = sectionTypes.length;
    
    sendEvent('start', { 
      totalSections,
      projectName: project.name,
      message: 'Iniciando geração de documentação...'
    });
    
    // Get repository data - ENHANCED ANALYSIS
    let repositoryData: any = { projectName: project.name };
    sendEvent('progress', { 
      phase: 'analyzing',
      message: 'Analisando repositório profundamente...',
      percent: 5
    });
    
    if (project.repositoryUrl) {
      try {
        sendEvent('progress', { 
          phase: 'analyzing',
          message: 'Lendo README e estrutura de arquivos...',
          percent: 7
        });
        
        repositoryData = await giteaService.analyzeRepository(project.repositoryUrl);
        repositoryData.projectName = project.name;
        
        // Log enhanced data for debugging
        console.log('Enhanced repository analysis:', {
          projectType: repositoryData.projectType,
          frameworks: repositoryData.frameworks,
          mainFiles: repositoryData.mainFiles?.length,
          sourceFiles: Object.keys(repositoryData.sourceCode || {}).length,
          envVars: repositoryData.envVars?.length,
          apiRoutes: repositoryData.apiRoutes?.length
        });
        
        sendEvent('progress', { 
          phase: 'analyzing',
          message: `Detectado: ${repositoryData.projectType} com ${repositoryData.frameworks?.join(', ') || 'tecnologias variadas'}`,
          percent: 10
        });
      } catch (error) {
        console.warn('Could not fetch repository data:', error);
        sendEvent('progress', { 
          phase: 'analyzing',
          message: 'Análise parcial - gerando com informações disponíveis...',
          percent: 10
        });
      }
    }
    
    const sections: any[] = [];
    const startTime = Date.now();
    
    // Generate each section
    for (let i = 0; i < sectionTypes.length; i++) {
      const sectionType = sectionTypes[i];
      const sectionStartTime = Date.now();
      
      sendEvent('section-start', { 
        index: i,
        type: sectionType,
        title: SECTION_LABELS[sectionType],
        message: `Gerando seção: ${SECTION_LABELS[sectionType]}...`,
        percent: Math.round(10 + (i / totalSections) * 80)
      });
      
      try {
        const content = await claudeService.generateSection(sectionType, repositoryData);
        const section = {
          id: `section-${Date.now()}-${i}`,
          type: sectionType,
          title: SECTION_LABELS[sectionType] || sectionType,
          content,
          order: i
        };
        sections.push(section);
        
        // Save intermediate progress
        await prisma.project.update({
          where: { id: projectId },
          data: {
            sections: JSON.stringify(sections),
            updatedAt: new Date()
          }
        });
        
        const sectionTime = Date.now() - sectionStartTime;
        const elapsed = Date.now() - startTime;
        const avgTimePerSection = elapsed / (i + 1);
        const remainingSections = totalSections - (i + 1);
        const estimatedRemaining = avgTimePerSection * remainingSections;
        
        sendEvent('section-complete', { 
          index: i,
          type: sectionType,
          title: SECTION_LABELS[sectionType],
          section,
          sectionTime,
          elapsed,
          estimatedRemaining,
          percent: Math.round(10 + ((i + 1) / totalSections) * 80)
        });
        
      } catch (error: any) {
        console.error(`Error generating ${sectionType}:`, error.message);
        sendEvent('section-error', { 
          index: i,
          type: sectionType,
          error: error.message
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    sendEvent('complete', { 
      success: true,
      sectionsGenerated: sections.length,
      totalTime,
      message: 'Documentação gerada com sucesso!'
    });
    
    res.end();
  } catch (error: any) {
    console.error('Stream error:', error);
    sendEvent('error', { message: error.message });
    res.end();
  }
});

// POST /api/ai/generate-full - Generate full documentation
router.post('/generate-full', async (req: Request, res: Response) => {
  try {
    const { repositoryUrl, projectName } = req.body;
    
    if (!repositoryUrl) {
      return res.status(400).json({ error: 'repositoryUrl is required' });
    }
    
    const documentation = await claudeService.generateFullDocumentation(repositoryUrl, projectName);
    res.json(documentation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/improve - Improve existing content
router.post('/improve', async (req: Request, res: Response) => {
  try {
    const { content, instructions } = req.body;
    
    if (!content || !instructions) {
      return res.status(400).json({ error: 'content and instructions are required' });
    }
    
    const improved = await claudeService.improveContent(content, instructions);
    res.json({ content: improved });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/summarize - Summarize code/content
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { code, language, type } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }
    
    const summary = await claudeService.summarizeCode(code, language, type);
    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/analyze-architecture - Analyze project architecture
router.post('/analyze-architecture', async (req: Request, res: Response) => {
  try {
    const { structure, files } = req.body;
    
    if (!structure) {
      return res.status(400).json({ error: 'structure is required' });
    }
    
    const analysis = await claudeService.analyzeArchitecture(structure, files);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/status - Check AI service status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await claudeService.checkStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

// POST /api/ai/chat - Chat with AI about the project documentation
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { projectId, message, history } = req.body;
    
    if (!projectId || !message) {
      return res.status(400).json({ error: 'projectId and message are required' });
    }
    
    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Build context from project sections
    let sectionsContext = '';
    if (project.sections) {
      const sections = JSON.parse(project.sections);
      sectionsContext = sections.map((s: any) => `${s.title}: ${JSON.stringify(s.content)}`).join('\n\n');
    }
    
    const response = await claudeService.chat(
      project.name, 
      sectionsContext, 
      message, 
      history || []
    );
    
    res.json({ response });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat-edit - Chat with AI with editing capabilities
router.post('/chat-edit', async (req: Request, res: Response) => {
  try {
    const { projectId, message, history } = req.body;
    
    if (!projectId || !message) {
      return res.status(400).json({ error: 'projectId and message are required' });
    }
    
    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Parse current sections
    let sections: any[] = [];
    if (project.sections) {
      sections = JSON.parse(project.sections);
    }
    
    // Chat with edit capabilities
    const result = await claudeService.chatWithEdit(
      project.name, 
      sections, 
      message, 
      history || []
    );
    
    // If there's an action, apply it
    if (result.action) {
      const { action } = result;
      
      if (action.type === 'edit' && action.sectionId) {
        // Find and update the section
        const sectionIndex = sections.findIndex((s: any) => s.id === action.sectionId);
        
        if (sectionIndex !== -1) {
          // Update section
          if (action.title) {
            sections[sectionIndex].title = action.title;
          }
          if (action.content) {
            sections[sectionIndex].content = action.content;
          }
          
          // Save to database
          await prisma.project.update({
            where: { id: projectId },
            data: { 
              sections: JSON.stringify(sections),
              updatedAt: new Date()
            }
          });
          
          res.json({ 
            response: result.response, 
            action: action,
            sections: sections,
            updated: true
          });
          return;
        }
      } else if (action.type === 'edit' && action.sectionType) {
        // Find by type
        const sectionIndex = sections.findIndex((s: any) => s.type === action.sectionType);
        
        if (sectionIndex !== -1) {
          if (action.title) {
            sections[sectionIndex].title = action.title;
          }
          if (action.content) {
            sections[sectionIndex].content = action.content;
          }
          
          await prisma.project.update({
            where: { id: projectId },
            data: { 
              sections: JSON.stringify(sections),
              updatedAt: new Date()
            }
          });
          
          res.json({ 
            response: result.response, 
            action: action,
            sections: sections,
            updated: true
          });
          return;
        }
      }
    }
    
    // No action or action failed
    res.json({ 
      response: result.response, 
      action: result.action,
      updated: false
    });
  } catch (error: any) {
    console.error('Chat-edit error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
