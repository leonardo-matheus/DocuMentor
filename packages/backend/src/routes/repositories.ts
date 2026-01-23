import { Router, Request, Response } from 'express';
import { giteaService } from '../services/gitea.service';

const router = Router();

// GET /api/repositories - List all repositories
router.get('/', async (req: Request, res: Response) => {
  try {
    const { org } = req.query;
    const repositories = await giteaService.listRepositories(org as string);
    res.json(repositories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repositories/:owner/:repo - Get repository details
router.get('/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const repository = await giteaService.getRepository(owner, repo);
    res.json(repository);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repositories/:owner/:repo/tree - Get repository file tree
router.get('/:owner/:repo/tree', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { ref } = req.query;
    const tree = await giteaService.getRepositoryTree(owner, repo, ref as string);
    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repositories/:owner/:repo/file - Get file content
router.get('/:owner/:repo/file', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { path, ref } = req.query;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const content = await giteaService.getFileContent(owner, repo, path as string, ref as string);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repositories/:owner/:repo/readme - Get repository README
router.get('/:owner/:repo/readme', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const readme = await giteaService.getReadme(owner, repo);
    res.json({ content: readme });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repositories/:owner/:repo/languages - Get repository languages
router.get('/:owner/:repo/languages', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const languages = await giteaService.getLanguages(owner, repo);
    res.json(languages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/repositories/analyze - Analyze repository structure
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { repositoryUrl } = req.body;
    
    if (!repositoryUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    const analysis = await giteaService.analyzeRepository(repositoryUrl);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
