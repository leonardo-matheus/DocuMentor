import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { projectService } from '../services/project.service';
import { giteaService } from '../services/gitea.service';

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

// =====================================================
// ADDITIONAL REPOSITORIES ROUTES
// =====================================================

// GET /api/projects/:id/repositories - List additional repositories
router.get('/:id/repositories', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const repos = await prisma.additionalRepository.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(repos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/repositories - Add additional repository
router.post('/:id/repositories', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, repositoryUrl, description } = req.body;
    
    if (!name || !repositoryUrl) {
      return res.status(400).json({ error: 'Name and repositoryUrl are required' });
    }
    
    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Analyze the repository
    const { giteaService } = await import('../services/gitea.service');
    let languages: string[] = [];
    
    try {
      const analysis = await giteaService.analyzeRepository(repositoryUrl);
      languages = Object.keys(analysis.languages || {});
    } catch (e) {
      // Continue even if analysis fails
      console.warn('Failed to analyze additional repository:', e);
    }
    
    const repo = await prisma.additionalRepository.create({
      data: {
        projectId: id,
        name,
        repositoryUrl,
        description,
        languages: JSON.stringify(languages)
      }
    });
    
    res.status(201).json(repo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id/repositories/:repoId - Update additional repository
router.put('/:id/repositories/:repoId', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const { name, repositoryUrl, description } = req.body;
    
    const repo = await prisma.additionalRepository.update({
      where: { id: repoId },
      data: {
        name,
        repositoryUrl,
        description
      }
    });
    
    res.json(repo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id/repositories/:repoId - Remove additional repository
router.delete('/:id/repositories/:repoId', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    
    await prisma.additionalRepository.delete({
      where: { id: repoId }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GIT SYNC ROUTES ====================

// GET /api/projects/:id/sync/settings - Get sync settings
router.get('/:id/sync/settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        syncBranch: true,
        autoSync: true,
        lastAutoSync: true,
        repositoryUrl: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse repo URL to get branches
    const urlMatch = project.repositoryUrl.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    let branches: any[] = [];

    if (urlMatch) {
      const [, owner, repo] = urlMatch;
      try {
        branches = await giteaService.listBranches(owner, repo);
      } catch (e) {
        console.warn('Failed to list branches:', e);
      }
    }

    res.json({
      syncBranch: project.syncBranch || 'master',
      autoSync: project.autoSync || false,
      lastAutoSync: project.lastAutoSync,
      branches
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id/sync/settings - Update sync settings
router.put('/:id/sync/settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { syncBranch, autoSync } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(syncBranch !== undefined && { syncBranch }),
        ...(autoSync !== undefined && { autoSync })
      },
      select: {
        syncBranch: true,
        autoSync: true,
        lastAutoSync: true
      }
    });

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id/sync - Get sync status and history
router.get('/:id/sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse repo URL
    const urlMatch = project.repositoryUrl.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!urlMatch) {
      return res.status(400).json({ error: 'Invalid repository URL' });
    }

    const [, owner, repo] = urlMatch;
    const branch = project.syncBranch || 'master';

    // Get last sync
    const lastSync = await prisma.gitSync.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Get latest commit from Gitea using configured branch
    const latestCommit = await giteaService.getLatestCommit(owner, repo, branch);

    // Get pending commits (commits since last sync)
    let pendingCommits: any[] = [];
    if (lastSync && latestCommit) {
      if (lastSync.commitSha !== latestCommit.sha) {
        pendingCommits = await giteaService.getCommitsSince(
          owner, repo, lastSync.commitSha, branch
        );
      }
    } else if (latestCommit) {
      // No previous sync, get recent commits
      pendingCommits = await giteaService.getCommits(owner, repo, { branch, limit: 20 });
    }

    // Get sync history
    const syncHistory = await prisma.gitSync.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      lastSync: lastSync ? {
        commitSha: lastSync.commitSha,
        commitMessage: lastSync.commitMessage,
        commitAuthor: lastSync.commitAuthor,
        commitDate: lastSync.commitDate,
        version: lastSync.version,
        releaseNotes: lastSync.releaseNotes,
        syncedAt: lastSync.createdAt
      } : null,
      latestCommit,
      pendingCommits,
      hasPendingChanges: pendingCommits.length > 0,
      syncHistory,
      branch,
      autoSync: project.autoSync || false
    });
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/sync - Sync with Gitea and generate release notes
router.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { generateReleaseNotes = true, updateChangelog = true } = req.body;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse repo URL
    const urlMatch = project.repositoryUrl.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!urlMatch) {
      return res.status(400).json({ error: 'Invalid repository URL' });
    }

    const [, owner, repo] = urlMatch;
    const branch = project.syncBranch || 'master';

    // Get last sync
    const lastSync = await prisma.gitSync.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Get latest commit from Gitea using configured branch
    const latestCommit = await giteaService.getLatestCommit(owner, repo, branch);

    if (!latestCommit) {
      return res.status(400).json({ error: 'Could not fetch latest commit from repository' });
    }

    // Check if already synced with this commit
    if (lastSync && lastSync.commitSha === latestCommit.sha) {
      return res.json({
        message: 'Already up to date',
        sync: lastSync,
        upToDate: true
      });
    }

    // Get commits since last sync for release notes
    let commits: any[] = [];
    if (lastSync) {
      commits = await giteaService.getCommitsSince(owner, repo, lastSync.commitSha, branch);
    } else {
      commits = await giteaService.getCommits(owner, repo, { branch, limit: 20 });
    }
    
    // Generate release notes using AI
    let releaseNotes = '';
    let suggestedVersion = '';
    
    if (generateReleaseNotes && commits.length > 0) {
      const { claudeService } = await import('../integrations/claude');
      
      // Categorize commits
      const commitMessages = commits.map(c => c.message).join('\n');
      
      const releaseNotesPrompt = `
Analise os seguintes commits de um repositório e gere release notes profissionais em português.

COMMITS:
${commits.map(c => `- ${c.message} (${c.author}, ${new Date(c.date).toLocaleDateString('pt-BR')})`).join('\n')}

INSTRUÇÕES:
1. Categorize as mudanças em: ✨ Novidades, 🐛 Correções, 🔧 Melhorias, ⚠️ Breaking Changes
2. Escreva de forma clara e profissional
3. Sugira uma versão semântica baseada nas mudanças (MAJOR.MINOR.PATCH)
   - MAJOR: breaking changes
   - MINOR: novas funcionalidades
   - PATCH: correções e melhorias pequenas

Retorne APENAS um JSON válido:
{
  "version": "X.Y.Z",
  "summary": "Breve resumo das mudanças",
  "categories": {
    "novidades": ["descrição 1", "descrição 2"],
    "correcoes": ["descrição 1"],
    "melhorias": ["descrição 1"],
    "breaking": []
  },
  "releaseNotes": "Texto formatado das release notes em markdown"
}`;

      try {
        const aiResponse = await claudeService.generateRaw(releaseNotesPrompt);
        const parsed = JSON.parse(aiResponse);
        releaseNotes = parsed.releaseNotes || '';
        suggestedVersion = parsed.version || '';
      } catch (e) {
        console.warn('Failed to generate AI release notes:', e);
        // Fallback: simple release notes
        releaseNotes = `## Commits incluídos\n\n${commits.map(c => `- ${c.message}`).join('\n')}`;
        suggestedVersion = '0.0.1';
      }
    }
    
    // Create sync record
    const sync = await prisma.gitSync.create({
      data: {
        projectId: id,
        commitSha: latestCommit.sha,
        commitMessage: latestCommit.message,
        commitAuthor: latestCommit.author,
        commitDate: new Date(latestCommit.date),
        branch,
        releaseNotes,
        version: suggestedVersion
      }
    });

    // Also create a project version snapshot
    const lastVersion = await prisma.projectVersion.findFirst({
      where: { projectId: id },
      orderBy: { version: 'desc' }
    });

    if (project.sections) {
      await prisma.projectVersion.create({
        data: {
          projectId: id,
          version: (lastVersion?.version || 0) + 1,
          message: `Sync: ${latestCommit.message.slice(0, 100)}`,
          sections: project.sections,
          createdBy: 'git-sync'
        }
      });
    }

    // Update changelog section if enabled
    let changelogUpdated = false;
    if (updateChangelog && releaseNotes && project.sections) {
      try {
        let sections = JSON.parse(project.sections);
        const changelogSection = sections.find((s: any) => s.type === 'changelog');

        if (changelogSection) {
          // Parse existing content
          let content = typeof changelogSection.content === 'string'
            ? JSON.parse(changelogSection.content)
            : changelogSection.content;

          // Create new release entry
          const newRelease = {
            version: suggestedVersion || '0.0.1',
            date: new Date().toISOString().split('T')[0],
            summary: `Sincronização automática - ${commits.length} commits`,
            categories: {
              novidades: [] as string[],
              correcoes: [] as string[],
              melhorias: [] as string[],
              breaking: [] as string[]
            },
            commits: commits.map((c: any) => ({
              sha: c.sha.substring(0, 7),
              message: c.message.split('\n')[0],
              author: c.author,
              date: c.date
            }))
          };

          // Categorize commits
          for (const commit of commits) {
            const msg = commit.message.toLowerCase();
            const title = commit.message.split('\n')[0];
            if (msg.startsWith('feat') || msg.includes('add') || msg.includes('novo')) {
              newRelease.categories.novidades.push(title);
            } else if (msg.startsWith('fix') || msg.includes('corrig') || msg.includes('bug')) {
              newRelease.categories.correcoes.push(title);
            } else if (msg.startsWith('refactor') || msg.includes('melhori') || msg.includes('improv')) {
              newRelease.categories.melhorias.push(title);
            } else if (msg.includes('breaking') || msg.includes('remove')) {
              newRelease.categories.breaking.push(title);
            } else {
              newRelease.categories.melhorias.push(title);
            }
          }

          // Add to history (always prepend, never replace)
          if (!content.history) {
            content.history = [];
          }
          content.history.unshift(newRelease);

          // Update current version info
          content.version = suggestedVersion;
          content.date = newRelease.date;
          content.summary = newRelease.summary;
          content.categories = newRelease.categories;

          // Update section
          changelogSection.content = content;
          sections = sections.map((s: any) =>
            s.id === changelogSection.id ? changelogSection : s
          );

          // Save updated sections
          await prisma.project.update({
            where: { id },
            data: {
              sections: JSON.stringify(sections),
              updatedAt: new Date()
            }
          });

          changelogUpdated = true;
        }
      } catch (e) {
        console.warn('Failed to update changelog section:', e);
      }
    }

    // Update last auto sync time
    await prisma.project.update({
      where: { id },
      data: { lastAutoSync: new Date() }
    });

    res.json({
      message: 'Synchronized successfully',
      sync,
      commitsIncluded: commits.length,
      upToDate: false,
      changelogUpdated
    });
  } catch (error: any) {
    console.error('Error syncing with Gitea:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id/sync/commits - Get recent commits from repository
router.get('/:id/sync/commits', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const urlMatch = project.repositoryUrl.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!urlMatch) {
      return res.status(400).json({ error: 'Invalid repository URL' });
    }

    const [, owner, repo] = urlMatch;
    const branch = project.syncBranch || 'master';

    const commits = await giteaService.getCommits(owner, repo, {
      branch,
      limit: Number(limit)
    });

    res.json(commits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTO-SYNC SERVICE ====================

// This will be called by a cron job or scheduler
router.post('/auto-sync/check', async (req: Request, res: Response) => {
  try {
    // Get all projects with autoSync enabled
    const projects = await prisma.project.findMany({
      where: { autoSync: true }
    });

    const results = [];

    for (const project of projects) {
      // Check if last auto sync was more than 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (project.lastAutoSync && project.lastAutoSync > oneHourAgo) {
        results.push({ projectId: project.id, skipped: true, reason: 'Recently synced' });
        continue;
      }

      try {
        // Parse repo URL
        const urlMatch = project.repositoryUrl.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
        if (!urlMatch) continue;

        const [, owner, repo] = urlMatch;
        const branch = project.syncBranch || 'master';

        // Get last sync
        const lastSync = await prisma.gitSync.findFirst({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' }
        });

        // Get latest commit
        const latestCommit = await giteaService.getLatestCommit(owner, repo, branch);

        if (!latestCommit) {
          results.push({ projectId: project.id, skipped: true, reason: 'No commits found' });
          continue;
        }

        // Check if there are new commits
        if (lastSync && lastSync.commitSha === latestCommit.sha) {
          // Update lastAutoSync even if no new commits
          await prisma.project.update({
            where: { id: project.id },
            data: { lastAutoSync: new Date() }
          });
          results.push({ projectId: project.id, skipped: true, reason: 'Already up to date' });
          continue;
        }

        // There are new commits, trigger sync
        // Get commits since last sync
        let commits: any[] = [];
        if (lastSync) {
          commits = await giteaService.getCommitsSince(owner, repo, lastSync.commitSha, branch);
        } else {
          commits = await giteaService.getCommits(owner, repo, { branch, limit: 20 });
        }

        // Generate release notes
        let releaseNotes = '';
        let suggestedVersion = '';

        if (commits.length > 0) {
          const { claudeService } = await import('../integrations/claude');

          const releaseNotesPrompt = `
Analise os seguintes commits e gere release notes em português.

COMMITS:
${commits.map(c => `- ${c.message} (${c.author})`).join('\n')}

Retorne APENAS JSON válido:
{
  "version": "X.Y.Z",
  "summary": "Breve resumo",
  "releaseNotes": "Release notes em markdown"
}`;

          try {
            const aiResponse = await claudeService.generateRaw(releaseNotesPrompt);
            const parsed = JSON.parse(aiResponse);
            releaseNotes = parsed.releaseNotes || '';
            suggestedVersion = parsed.version || '';
          } catch {
            releaseNotes = `## Commits\n${commits.map(c => `- ${c.message}`).join('\n')}`;
            suggestedVersion = '0.0.1';
          }
        }

        // Create sync record
        const sync = await prisma.gitSync.create({
          data: {
            projectId: project.id,
            commitSha: latestCommit.sha,
            commitMessage: latestCommit.message,
            commitAuthor: latestCommit.author,
            commitDate: new Date(latestCommit.date),
            branch,
            releaseNotes,
            version: suggestedVersion
          }
        });

        // Update changelog section
        if (project.sections) {
          try {
            let sections = JSON.parse(project.sections);
            const changelogSection = sections.find((s: any) => s.type === 'changelog');

            if (changelogSection) {
              let content = typeof changelogSection.content === 'string'
                ? JSON.parse(changelogSection.content)
                : changelogSection.content;

              const newRelease = {
                version: suggestedVersion,
                date: new Date().toISOString().split('T')[0],
                summary: `Auto-sync: ${commits.length} commits`,
                categories: { novidades: [], correcoes: [], melhorias: [], breaking: [] },
                commits: commits.map((c: any) => ({
                  sha: c.sha.substring(0, 7),
                  message: c.message.split('\n')[0],
                  author: c.author,
                  date: c.date
                }))
              };

              // Categorize commits
              for (const commit of commits) {
                const msg = commit.message.toLowerCase();
                const title = commit.message.split('\n')[0];
                if (msg.startsWith('feat') || msg.includes('add')) {
                  newRelease.categories.novidades.push(title);
                } else if (msg.startsWith('fix') || msg.includes('bug')) {
                  newRelease.categories.correcoes.push(title);
                } else {
                  newRelease.categories.melhorias.push(title);
                }
              }

              if (!content.history) content.history = [];
              content.history.unshift(newRelease);
              content.version = suggestedVersion;
              content.date = newRelease.date;

              changelogSection.content = content;
              sections = sections.map((s: any) =>
                s.id === changelogSection.id ? changelogSection : s
              );

              await prisma.project.update({
                where: { id: project.id },
                data: {
                  sections: JSON.stringify(sections),
                  lastAutoSync: new Date()
                }
              });
            }
          } catch (e) {
            console.warn('Failed to update changelog:', e);
          }
        }

        // Update last auto sync
        await prisma.project.update({
          where: { id: project.id },
          data: { lastAutoSync: new Date() }
        });

        results.push({
          projectId: project.id,
          synced: true,
          commits: commits.length,
          version: suggestedVersion
        });

      } catch (e: any) {
        results.push({ projectId: project.id, error: e.message });
      }
    }

    res.json({ checked: projects.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
