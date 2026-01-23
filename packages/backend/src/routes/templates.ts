import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/templates - List all templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, content, isDefault } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    
    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.template.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.template.create({
      data: {
        name,
        description,
        content: JSON.stringify(content),
        isDefault: isDefault || false
      }
    });
    
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, content, isDefault } = req.body;
    
    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.template.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content: JSON.stringify(content) }),
        ...(isDefault !== undefined && { isDefault })
      }
    });
    
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.template.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/templates/default - Get default template
router.get('/default', async (req: Request, res: Response) => {
  try {
    const template = await prisma.template.findFirst({
      where: { isDefault: true }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'No default template found' });
    }
    
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
