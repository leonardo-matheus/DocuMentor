import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ===== CATEGORIES =====

// List all categories with publications count
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        publications: {
          select: {
            id: true,
            slug: true,
            title: true,
            icon: true,
            version: true,
            order: true
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { publications: true }
        }
      }
    })
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Create category
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, description, icon, color } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    
    const slug = generateSlug(name)
    
    // Get max order
    const maxOrder = await prisma.category.aggregate({
      _max: { order: true }
    })
    
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        order: (maxOrder._max.order || 0) + 1
      }
    })
    
    res.status(201).json(category)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Category already exists' })
    }
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Update category
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, icon, color, order } = req.body
    
    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name
      updateData.slug = generateSlug(name)
    }
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (order !== undefined) updateData.order = order
    
    const category = await prisma.category.update({
      where: { id },
      data: updateData
    })
    
    res.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// Delete category (moves publications to uncategorized)
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Remove category from publications
    await prisma.publication.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    })
    
    await prisma.category.delete({ where: { id } })
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// Reorder categories
router.put('/categories/reorder', async (req: Request, res: Response) => {
  try {
    const { categories } = req.body // [{ id, order }]
    
    await Promise.all(
      categories.map((cat: { id: string; order: number }) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { order: cat.order }
        })
      )
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error reordering categories:', error)
    res.status(500).json({ error: 'Failed to reorder categories' })
  }
})

// ===== PUBLICATIONS =====

// List all publications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query
    
    const where: any = {}
    if (category) where.categoryId = category as string
    
    const publications = await prisma.publication.findMany({
      where,
      orderBy: [
        { category: { order: 'asc' } },
        { order: 'asc' }
      ],
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true }
        },
        project: {
          select: { id: true, name: true, repositoryUrl: true }
        }
      }
    })
    
    res.json(publications)
  } catch (error) {
    console.error('Error fetching publications:', error)
    res.status(500).json({ error: 'Failed to fetch publications' })
  }
})

// Get publication by slug (public access)
router.get('/view/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    
    const publication = await prisma.publication.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true }
        }
      }
    })
    
    if (!publication) {
      return res.status(404).json({ error: 'Publication not found' })
    }
    
    if (!publication.isPublic) {
      return res.status(403).json({ error: 'Publication is private' })
    }
    
    res.json(publication)
  } catch (error) {
    console.error('Error fetching publication:', error)
    res.status(500).json({ error: 'Failed to fetch publication' })
  }
})

// Publish project (create or update publication)
router.post('/publish/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { slug, title, description, icon, categoryId, version, publishedBy } = req.body
    
    // Get project with sections
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sectionsList: { orderBy: { order: 'asc' } } }
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // Convert sections to JSON for snapshot
    // Try sectionsList (relation) first, fallback to sections (JSON field)
    let sectionsSnapshot: string
    
    if (project.sectionsList && project.sectionsList.length > 0) {
      // Use sectionsList relation
      sectionsSnapshot = JSON.stringify(
        project.sectionsList.map(s => ({
          id: s.id,
          type: s.type,
          title: s.title,
          content: JSON.parse(s.content),
          order: s.order
        }))
      )
    } else if (project.sections) {
      // Fallback to sections JSON field
      const parsedSections = typeof project.sections === 'string' 
        ? JSON.parse(project.sections) 
        : project.sections
      sectionsSnapshot = JSON.stringify(parsedSections)
    } else {
      return res.status(400).json({ error: 'Project has no sections to publish' })
    }
    
    // Check if publication already exists for this project
    const existingPub = await prisma.publication.findFirst({
      where: { projectId }
    })
    
    const finalSlug = slug || generateSlug(title || project.name)
    
    // Validate slug uniqueness (except for same publication)
    const slugExists = await prisma.publication.findFirst({
      where: {
        slug: finalSlug,
        NOT: existingPub ? { id: existingPub.id } : undefined
      }
    })
    
    if (slugExists) {
      return res.status(409).json({ error: 'Slug already in use' })
    }
    
    let publication
    
    if (existingPub) {
      // Update existing publication
      publication = await prisma.publication.update({
        where: { id: existingPub.id },
        data: {
          slug: finalSlug,
          title: title || project.name,
          description,
          icon,
          categoryId,
          version,
          content: sectionsSnapshot,
          publishedBy,
          updatedAt: new Date()
        },
        include: {
          category: true
        }
      })
    } else {
      // Get max order for category
      const maxOrder = await prisma.publication.aggregate({
        where: categoryId ? { categoryId } : {},
        _max: { order: true }
      })
      
      // Create new publication
      publication = await prisma.publication.create({
        data: {
          projectId,
          slug: finalSlug,
          title: title || project.name,
          description,
          icon,
          categoryId,
          version,
          content: sectionsSnapshot,
          publishedBy,
          order: (maxOrder._max.order || 0) + 1
        },
        include: {
          category: true
        }
      })
    }
    
    // Update project status to complete when published
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'complete' }
    })
    
    res.status(existingPub ? 200 : 201).json({
      publication,
      publicUrl: `/docs/${finalSlug}`
    })
  } catch (error: any) {
    console.error('Error publishing:', error)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug already in use' })
    }
    res.status(500).json({ error: 'Failed to publish' })
  }
})

// Update publication metadata
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { slug, title, description, icon, categoryId, version, isPublic, order } = req.body
    
    const updateData: any = {}
    if (slug !== undefined) updateData.slug = slug
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (version !== undefined) updateData.version = version
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (order !== undefined) updateData.order = order
    
    const publication = await prisma.publication.update({
      where: { id },
      data: updateData,
      include: { category: true }
    })
    
    res.json(publication)
  } catch (error) {
    console.error('Error updating publication:', error)
    res.status(500).json({ error: 'Failed to update publication' })
  }
})

// Unpublish (delete publication)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.publication.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting publication:', error)
    res.status(500).json({ error: 'Failed to delete publication' })
  }
})

// Get publication status for a project
router.get('/status/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    
    const publication = await prisma.publication.findFirst({
      where: { projectId },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    })
    
    res.json({
      isPublished: !!publication,
      publication
    })
  } catch (error) {
    console.error('Error fetching publication status:', error)
    res.status(500).json({ error: 'Failed to fetch status' })
  }
})

// Reorder publications within category
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const { publications } = req.body // [{ id, order, categoryId? }]
    
    await Promise.all(
      publications.map((pub: { id: string; order: number; categoryId?: string }) =>
        prisma.publication.update({
          where: { id: pub.id },
          data: { 
            order: pub.order,
            ...(pub.categoryId !== undefined && { categoryId: pub.categoryId })
          }
        })
      )
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error reordering publications:', error)
    res.status(500).json({ error: 'Failed to reorder publications' })
  }
})

export default router
