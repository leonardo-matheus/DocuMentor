import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { projectService } from '../services/project.service';

const router = Router();

// GET /api/projects - List all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        metadata: true
      }
    });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        metadata: true
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, repositoryUrl } = req.body;
    
    if (!name || !repositoryUrl) {
      return res.status(400).json({ error: 'Name and repositoryUrl are required' });
    }
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositoryUrl,
        status: 'draft'
      }
    });
    
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, sections } = req.body;
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(sections !== undefined && { sections }),
        updatedAt: new Date()
      }
    });
    
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/generate - Generate documentation for project
router.post('/:id/generate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update status to generating
    await prisma.project.update({
      where: { id },
      data: { status: 'generating' }
    });
    
    // Start generation process
    const result = await projectService.generateDocumentation(id, project.repositoryUrl);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id/sections - Get all sections for a project
router.get('/:id/sections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const sections = await prisma.section.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' }
    });
    
    res.json(sections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id/sections/:sectionId - Update section
router.put('/:id/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { title, content, order } = req.body;
    
    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(order !== undefined && { order })
      }
    });
    
    res.json(section);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/sections - Add new section
router.post('/:id/sections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, title, content, order } = req.body;
    
    const section = await prisma.section.create({
      data: {
        projectId: id,
        type,
        title,
        content: JSON.stringify(content),
        order: order || 0
      }
    });
    
    res.status(201).json(section);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id/sections/:sectionId - Delete section
router.delete('/:id/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    
    await prisma.section.delete({
      where: { id: sectionId }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/export - Export project as HTML
router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const html = await projectService.exportToHtml(id);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="documentation-${id}.html"`);
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
