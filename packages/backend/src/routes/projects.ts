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

// ==========================================
// VERSIONING ENDPOINTS
// ==========================================

// GET /api/projects/:id/versions - List all versions
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        message: true,
        createdAt: true,
        createdBy: true
      }
    });
    
    res.json(versions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/versions - Create new version (commit)
router.post('/:id/versions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, createdBy } = req.body;
    
    // Get current project sections
    const project = await prisma.project.findUnique({
      where: { id },
      select: { sections: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get latest version number
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId: id },
      orderBy: { version: 'desc' },
      select: { version: true }
    });
    
    const newVersionNumber = (latestVersion?.version || 0) + 1;
    
    // Create new version
    const version = await prisma.projectVersion.create({
      data: {
        projectId: id,
        version: newVersionNumber,
        message: message || `Versão ${newVersionNumber}`,
        sections: project.sections || '[]',
        createdBy
      }
    });
    
    res.status(201).json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id/versions/:versionId - Get specific version
router.get('/:id/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    
    const version = await prisma.projectVersion.findUnique({
      where: { id: versionId }
    });
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/versions/:versionId/checkout - Checkout to a version
router.post('/:id/versions/:versionId/checkout', async (req: Request, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const { createBackup } = req.body;
    
    // Get version
    const version = await prisma.projectVersion.findUnique({
      where: { id: versionId }
    });
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    // Optionally create backup of current state before checkout
    if (createBackup) {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { sections: true }
      });
      
      const latestVersion = await prisma.projectVersion.findFirst({
        where: { projectId: id },
        orderBy: { version: 'desc' },
        select: { version: true }
      });
      
      await prisma.projectVersion.create({
        data: {
          projectId: id,
          version: (latestVersion?.version || 0) + 1,
          message: `Backup antes de checkout para v${version.version}`,
          sections: project?.sections || '[]'
        }
      });
    }
    
    // Apply version sections to project
    await prisma.project.update({
      where: { id },
      data: {
        sections: version.sections,
        updatedAt: new Date()
      }
    });
    
    res.json({ 
      success: true, 
      message: `Checkout para versão ${version.version} realizado com sucesso`,
      version: version.version
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/versions/:versionId/rollback - Rollback to a version (creates new version)
router.post('/:id/versions/:versionId/rollback', async (req: Request, res: Response) => {
  try {
    const { id, versionId } = req.params;
    
    // Get version to rollback to
    const version = await prisma.projectVersion.findUnique({
      where: { id: versionId }
    });
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    // Get current sections for backup
    const project = await prisma.project.findUnique({
      where: { id },
      select: { sections: true }
    });
    
    // Get latest version number
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId: id },
      orderBy: { version: 'desc' },
      select: { version: true }
    });
    
    // Create backup version of current state
    await prisma.projectVersion.create({
      data: {
        projectId: id,
        version: (latestVersion?.version || 0) + 1,
        message: `Backup antes de rollback para v${version.version}`,
        sections: project?.sections || '[]'
      }
    });
    
    // Create new version with rollback content
    const newVersion = await prisma.projectVersion.create({
      data: {
        projectId: id,
        version: (latestVersion?.version || 0) + 2,
        message: `Rollback para versão ${version.version}`,
        sections: version.sections
      }
    });
    
    // Apply to project
    await prisma.project.update({
      where: { id },
      data: {
        sections: version.sections,
        updatedAt: new Date()
      }
    });
    
    res.json({ 
      success: true, 
      message: `Rollback para versão ${version.version} realizado com sucesso`,
      newVersion: newVersion.version
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id/versions/:versionId - Delete a version
router.delete('/:id/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    
    await prisma.projectVersion.delete({
      where: { id: versionId }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id/sections/reorder - Reorder sections
router.put('/:id/sections/reorder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections } = req.body; // Array of { id, order }
    
    // Update project sections JSON
    const project = await prisma.project.findUnique({
      where: { id },
      select: { sections: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Parse current sections and reorder
    let currentSections = [];
    try {
      currentSections = JSON.parse(project.sections || '[]');
    } catch {
      currentSections = [];
    }
    
    // Create order map
    const orderMap = new Map(sections.map((s: { id: string; order: number }) => [s.id, s.order]));
    
    // Update order
    currentSections = currentSections.map((section: any) => ({
      ...section,
      order: orderMap.has(section.id) ? orderMap.get(section.id) : section.order
    }));
    
    // Sort by new order
    currentSections.sort((a: any, b: any) => a.order - b.order);
    
    // Save back
    await prisma.project.update({
      where: { id },
      data: {
        sections: JSON.stringify(currentSections),
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, sections: currentSections });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
