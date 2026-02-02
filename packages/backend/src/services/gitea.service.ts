import axios, { AxiosInstance } from 'axios';

// Gitea API client
const giteaClient: AxiosInstance = axios.create({
  baseURL: process.env.GITEA_URL || 'https://code.movemais.com',
  headers: {
    'Authorization': `token ${process.env.GITEA_TOKEN || ''}`,
    'Content-Type': 'application/json'
  }
});

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  language: string;
  size: number;
  stars_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

interface FileContent {
  content: string;
  encoding: string;
  name: string;
  path: string;
  sha: string;
}

// Enhanced repository analysis result
interface AnalysisResult {
  owner: string;
  repo: string;
  description: string;
  languages: Record<string, number>;
  structure: string[];
  readme: string;
  dependencies: any;
  configFiles: string[];
  // New enhanced fields
  mainFiles: string[];
  sourceCode: Record<string, string>;
  envVars: string[];
  apiRoutes: string[];
  projectType: string;
  frameworks: string[];
  buildCommands: string[];
  dockerInfo: string;
  cicdInfo: string;
  // NEW: Version detection
  languageVersions: Record<string, string>;
  frameworkVersions: Record<string, string>;
}

export const giteaService = {
  /**
   * List repositories for an organization or user (with pagination)
   */
  async listRepositories(org?: string): Promise<Repository[]> {
    try {
      const endpoint = org 
        ? `/api/v1/orgs/${org}/repos`
        : '/api/v1/user/repos';
      
      const allRepos: Repository[] = [];
      let page = 1;
      const limit = 50;
      let hasMore = true;
      
      // Fetch all pages
      while (hasMore) {
        const response = await giteaClient.get(endpoint, {
          params: { limit, page }
        });
        
        const repos = response.data;
        if (repos && repos.length > 0) {
          allRepos.push(...repos);
          page++;
          // If we got fewer than limit, we've reached the end
          hasMore = repos.length === limit;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`[Gitea] Fetched ${allRepos.length} repositories from ${org || 'user'}`);
      return allRepos;
    } catch (error: any) {
      console.error('Error listing repositories:', error.message);
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  },

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const response = await giteaClient.get(`/api/v1/repos/${owner}/${repo}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting repository:', error.message);
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  },

  /**
   * List branches for a repository
   */
  async listBranches(owner: string, repo: string): Promise<Array<{
    name: string;
    commit: { sha: string; url: string };
    protected: boolean;
  }>> {
    try {
      const response = await giteaClient.get(`/api/v1/repos/${owner}/${repo}/branches`);
      return response.data.map((branch: any) => ({
        name: branch.name,
        commit: {
          sha: branch.commit?.id || branch.commit?.sha || '',
          url: branch.commit?.url || ''
        },
        protected: branch.protected || false
      }));
    } catch (error: any) {
      console.error('Error listing branches:', error.message);
      throw new Error(`Failed to list branches: ${error.message}`);
    }
  },

  /**
   * Get repository file tree
   */
  async getRepositoryTree(
    owner: string, 
    repo: string, 
    ref?: string
  ): Promise<TreeEntry[]> {
    try {
      const branch = ref || 'main';
      const response = await giteaClient.get(
        `/api/v1/repos/${owner}/${repo}/git/trees/${branch}`,
        { params: { recursive: true } }
      );
      
      return response.data.tree || [];
    } catch (error: any) {
      // Try 'master' if 'main' fails
      if (!ref) {
        try {
          const response = await giteaClient.get(
            `/api/v1/repos/${owner}/${repo}/git/trees/master`,
            { params: { recursive: true } }
          );
          return response.data.tree || [];
        } catch {
          // Ignore secondary error
        }
      }
      console.error('Error getting repository tree:', error.message);
      throw new Error(`Failed to get repository tree: ${error.message}`);
    }
  },

  /**
   * Get file content
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    // Try multiple branch names if ref not specified
    const branchesToTry = ref ? [ref] : ['main', 'master', 'develop'];

    for (const branch of branchesToTry) {
      try {
        const response = await giteaClient.get<FileContent>(
          `/api/v1/repos/${owner}/${repo}/contents/${path}`,
          { params: { ref: branch } }
        );

        // Decode base64 content
        if (response.data.encoding === 'base64') {
          return Buffer.from(response.data.content, 'base64').toString('utf-8');
        }

        return response.data.content;
      } catch (error: any) {
        // Try next branch
        if (branch === branchesToTry[branchesToTry.length - 1]) {
          // Last branch, throw error
          console.error(`Error getting file content for ${path}:`, error.message);
          throw new Error(`Failed to get file content: ${error.message}`);
        }
      }
    }

    throw new Error(`Failed to get file content from any branch`);
  },

  /**
   * Get README file
   */
  async getReadme(owner: string, repo: string): Promise<string> {
    const readmeFiles = ['README.md', 'readme.md', 'README', 'readme.txt'];
    
    for (const filename of readmeFiles) {
      try {
        return await this.getFileContent(owner, repo, filename);
      } catch {
        // Try next filename
      }
    }
    
    return '';
  },

  /**
   * Get repository languages
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await giteaClient.get(`/api/v1/repos/${owner}/${repo}/languages`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting languages:', error.message);
      return {};
    }
  },

  /**
   * Get commits from repository
   */
  async getCommits(
    owner: string, 
    repo: string, 
    options?: { 
      branch?: string; 
      since?: string; // ISO date string
      limit?: number;
    }
  ): Promise<Array<{
    sha: string;
    message: string;
    author: string;
    authorEmail: string;
    date: string;
    url: string;
  }>> {
    try {
      const params: Record<string, any> = {
        sha: options?.branch || 'master',
        limit: options?.limit || 50
      };
      
      if (options?.since) {
        params.since = options.since;
      }
      
      const response = await giteaClient.get(
        `/api/v1/repos/${owner}/${repo}/commits`,
        { params }
      );
      
      return response.data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit?.message || '',
        author: commit.commit?.author?.name || commit.author?.login || 'Unknown',
        authorEmail: commit.commit?.author?.email || '',
        date: commit.commit?.author?.date || commit.created,
        url: commit.html_url
      }));
    } catch (error: any) {
      console.error('Error getting commits:', error.message);
      throw new Error(`Failed to get commits: ${error.message}`);
    }
  },

  /**
   * Get commits since a specific commit SHA
   */
  async getCommitsSince(
    owner: string, 
    repo: string, 
    sinceCommitSha: string,
    branch: string = 'master'
  ): Promise<Array<{
    sha: string;
    message: string;
    author: string;
    authorEmail: string;
    date: string;
    url: string;
  }>> {
    try {
      // Get all recent commits
      const allCommits = await this.getCommits(owner, repo, { branch, limit: 100 });
      
      // Find the index of the since commit
      const sinceIndex = allCommits.findIndex(c => c.sha === sinceCommitSha);
      
      if (sinceIndex === -1) {
        // Commit not found in recent history, return all commits
        return allCommits;
      }
      
      // Return commits that came after the since commit
      return allCommits.slice(0, sinceIndex);
    } catch (error: any) {
      console.error('Error getting commits since:', error.message);
      throw new Error(`Failed to get commits since ${sinceCommitSha}: ${error.message}`);
    }
  },

  /**
   * Get latest commit from branch
   */
  async getLatestCommit(
    owner: string, 
    repo: string, 
    branch: string = 'master'
  ): Promise<{
    sha: string;
    message: string;
    author: string;
    authorEmail: string;
    date: string;
    url: string;
  } | null> {
    try {
      const commits = await this.getCommits(owner, repo, { branch, limit: 1 });
      return commits[0] || null;
    } catch (error: any) {
      console.error('Error getting latest commit:', error.message);
      return null;
    }
  },

  /**
   * Analyze repository structure - ENHANCED VERSION
   */
  async analyzeRepository(repositoryUrl: string): Promise<AnalysisResult> {
    // Parse repository URL
    const urlMatch = repositoryUrl.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!urlMatch) {
      throw new Error('Invalid repository URL');
    }
    
    const [, owner, repo] = urlMatch;

    // Get repository info
    const repoInfo = await this.getRepository(owner, repo);
    const defaultBranch = repoInfo.default_branch || 'main';
    console.log(`[Gitea] Repository ${owner}/${repo} default branch: ${defaultBranch}`);

    // Get tree using default branch
    const tree = await this.getRepositoryTree(owner, repo, defaultBranch);
    const structure = tree.map(entry => entry.path);
    console.log(`[Gitea] Found ${structure.length} files/folders in tree`);

    // Get languages
    const languages = await this.getLanguages(owner, repo);

    // Get README
    const readme = await this.getReadme(owner, repo);
    
    // Identify config files
    const configPatterns = [
      'package.json',
      'composer.json',
      'requirements.txt',
      'pom.xml',
      'build.gradle',
      'Gemfile',
      'Cargo.toml',
      'go.mod',
      'tsconfig.json',
      'vite.config',
      'webpack.config',
      '.env.example',
      'docker-compose.yml',
      'Dockerfile',
      '.gitlab-ci.yml',
      '.github/workflows'
    ];
    
    const configFiles = structure.filter(path => 
      configPatterns.some(pattern => path.includes(pattern))
    );
    
    // ============ ENHANCED ANALYSIS ============
    
    // Identify main source files to read
    const mainFilePatterns = [
      /^src\/index\.(ts|js|tsx|jsx)$/,
      /^src\/main\.(ts|js|tsx|jsx)$/,
      /^src\/app\.(ts|js|tsx|jsx)$/,
      /^src\/App\.(ts|js|tsx|jsx)$/,
      /^index\.(ts|js|tsx|jsx)$/,
      /^main\.(ts|js|py)$/,
      /^app\.(ts|js|py)$/,
      /^server\.(ts|js)$/,
      /^manage\.py$/,
      /^Program\.cs$/,
      /^Main\.java$/,
    ];
    
    const mainFiles = structure.filter(path => 
      mainFilePatterns.some(pattern => pattern.test(path))
    );
    
    // Read important source files - be aggressive about finding API/controller files
    const filesToRead = [
      ...mainFiles.slice(0, 3),

      // ANY file that might contain API endpoints (case-insensitive matching)
      ...structure.filter(p => {
        const lowerPath = p.toLowerCase();
        return (
          // Controllers (any pattern)
          lowerPath.includes('controller') ||
          // Routes
          lowerPath.includes('/routes/') ||
          lowerPath.includes('/route/') ||
          // REST/API
          lowerPath.includes('/rest/') ||
          lowerPath.includes('/api/') ||
          lowerPath.includes('/endpoint') ||
          // Resources (JAX-RS style)
          lowerPath.includes('/resource/') ||
          lowerPath.includes('/resources/') ||
          // Web layer
          lowerPath.includes('/web/') ||
          lowerPath.includes('/presentation/') ||
          // Handlers
          lowerPath.includes('/handler/') ||
          lowerPath.includes('/handlers/') ||
          // Views (Python/Django)
          lowerPath.includes('/views/')
        );
      }).slice(0, 15),

      // Also get any file ending with common API file patterns
      ...structure.filter(p => {
        const fileName = p.split('/').pop()?.toLowerCase() || '';
        return (
          fileName.endsWith('controller.java') ||
          fileName.endsWith('controller.ts') ||
          fileName.endsWith('controller.js') ||
          fileName.endsWith('controller.cs') ||
          fileName.endsWith('resource.java') ||
          fileName.endsWith('routes.ts') ||
          fileName.endsWith('routes.js') ||
          fileName.endsWith('router.ts') ||
          fileName.endsWith('router.js') ||
          fileName.endsWith('api.ts') ||
          fileName.endsWith('api.js') ||
          fileName.endsWith('endpoints.ts') ||
          fileName.endsWith('endpoints.js')
        );
      }).slice(0, 10),

      // Env files
      ...structure.filter(p => p.endsWith('.env.example') || p.endsWith('.env.sample')),
    ];
    
    const sourceCode: Record<string, string> = {};
    // Filter out directories (paths without file extension) and get unique files
    const uniqueFiles = [...new Set(filesToRead)]
      .filter(f => {
        // Must have a file extension to be a file (not a directory)
        const fileName = f.split('/').pop() || '';
        return fileName.includes('.') && !fileName.startsWith('.');
      })
      .slice(0, 20);
    console.log(`[Gitea] Reading ${uniqueFiles.length} source files:`, uniqueFiles);

    for (const file of uniqueFiles) {
      try {
        const content = await this.getFileContent(owner, repo, file);
        // Limit file content to 6000 chars to give AI more context for understanding endpoints
        sourceCode[file] = content.substring(0, 6000);
        console.log(`[Gitea] ✅ Read file: ${file} (${content.length} chars)`);
      } catch (err: any) {
        console.log(`[Gitea] ❌ Failed to read: ${file} - ${err.message}`);
        // Skip files that can't be read
      }
    }

    console.log(`[Gitea] Successfully read ${Object.keys(sourceCode).length} of ${uniqueFiles.length} files`);

    // Detect project type and frameworks
    const projectType = this.detectProjectType(structure, languages);
    const frameworks = this.detectFrameworks(structure, sourceCode);

    // Extract API routes from source code
    const apiRoutes = this.extractApiRoutes(sourceCode);
    console.log(`[Gitea] Extracted ${apiRoutes.length} API routes:`, apiRoutes.slice(0, 10));
    
    // Extract environment variables from .env.example
    const envVars = await this.extractEnvVars(owner, repo, structure);
    
    // Get build commands from package.json or similar
    let buildCommands: string[] = [];
    let dependencies: any = {};
    
    // Try to get package.json for dependencies and scripts
    try {
      const pkgJson = await this.getFileContent(owner, repo, 'package.json');
      const pkg = JSON.parse(pkgJson);
      dependencies = {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {}
      };
      if (pkg.scripts) {
        buildCommands = Object.entries(pkg.scripts)
          .map(([name, cmd]) => `npm run ${name}: ${cmd}`)
          .slice(0, 10);
      }
    } catch {
      // Try other dependency files
      try {
        const requirements = await this.getFileContent(owner, repo, 'requirements.txt');
        dependencies = { python: requirements.split('\n').filter(l => l.trim()) };
      } catch {}
      
      try {
        const goMod = await this.getFileContent(owner, repo, 'go.mod');
        dependencies = { go: goMod };
      } catch {}
    }
    
    // Get Docker info
    let dockerInfo = '';
    try {
      dockerInfo = await this.getFileContent(owner, repo, 'docker-compose.yml');
    } catch {
      try {
        dockerInfo = await this.getFileContent(owner, repo, 'Dockerfile');
      } catch {}
    }
    
    // Get CI/CD info
    let cicdInfo = '';
    const cicdFiles = structure.filter(p => 
      p.includes('.github/workflows') || 
      p.includes('.gitlab-ci') ||
      p.includes('Jenkinsfile') ||
      p.includes('azure-pipelines')
    );
    if (cicdFiles.length > 0) {
      try {
        cicdInfo = await this.getFileContent(owner, repo, cicdFiles[0]);
      } catch {}
    }
    
    // NEW: Extract version information from config files
    const { languageVersions, frameworkVersions } = await this.extractVersionInfo(
      owner, 
      repo, 
      structure, 
      dependencies
    );
    
    return {
      owner,
      repo,
      description: repoInfo.description || '',
      languages,
      structure,
      readme,
      dependencies,
      configFiles,
      // Enhanced fields
      mainFiles,
      sourceCode,
      envVars,
      apiRoutes,
      projectType,
      frameworks,
      buildCommands,
      dockerInfo: dockerInfo.substring(0, 1500),
      cicdInfo: cicdInfo.substring(0, 1000),
      // Version info
      languageVersions,
      frameworkVersions
    };
  },

  /**
   * Detect project type based on structure and languages
   */
  detectProjectType(structure: string[], languages: Record<string, number>): string {
    const hasPackageJson = structure.some(p => p === 'package.json');
    const hasPython = languages['Python'] > 0;
    const hasGo = languages['Go'] > 0;
    const hasJava = languages['Java'] > 0;
    const hasCSharp = languages['C#'] > 0;
    
    if (structure.some(p => p.includes('next.config'))) return 'Next.js Application';
    if (structure.some(p => p.includes('nuxt.config'))) return 'Nuxt.js Application';
    if (structure.some(p => p.includes('angular.json'))) return 'Angular Application';
    if (structure.some(p => p.includes('vite.config'))) return 'Vite Application';
    if (structure.some(p => p === 'src/App.tsx' || p === 'src/App.jsx')) return 'React Application';
    if (structure.some(p => p.includes('vue.config') || p === 'src/App.vue')) return 'Vue.js Application';
    if (structure.some(p => p.includes('manage.py'))) return 'Django Application';
    if (structure.some(p => p.includes('app.py') || p.includes('wsgi.py'))) return 'Flask Application';
    if (structure.some(p => p.includes('pom.xml'))) return 'Java Maven Project';
    if (structure.some(p => p.includes('build.gradle'))) return 'Java Gradle Project';
    if (hasGo) return 'Go Application';
    if (hasCSharp) return '.NET Application';
    if (hasPackageJson && structure.some(p => p.includes('src/index.ts'))) return 'Node.js/TypeScript Application';
    if (hasPackageJson) return 'Node.js Application';
    if (hasPython) return 'Python Application';
    
    return 'Software Project';
  },

  /**
   * Detect frameworks from source code
   */
  detectFrameworks(structure: string[], sourceCode: Record<string, string>): string[] {
    const frameworks: Set<string> = new Set();
    
    const allCode = Object.values(sourceCode).join('\n');
    
    // Frontend frameworks
    if (allCode.includes('from react') || allCode.includes("from 'react'") || allCode.includes('import React')) {
      frameworks.add('React');
    }
    if (allCode.includes('from vue') || allCode.includes("from 'vue'")) {
      frameworks.add('Vue.js');
    }
    if (allCode.includes('@angular')) frameworks.add('Angular');
    if (allCode.includes('next/') || structure.some(p => p.includes('next.config'))) frameworks.add('Next.js');
    if (allCode.includes('tailwindcss') || structure.some(p => p.includes('tailwind.config'))) frameworks.add('Tailwind CSS');
    
    // Backend frameworks
    if (allCode.includes('from express') || allCode.includes("from 'express'") || allCode.includes('require("express")')) {
      frameworks.add('Express.js');
    }
    if (allCode.includes('@nestjs')) frameworks.add('NestJS');
    if (allCode.includes('from fastapi') || allCode.includes('import FastAPI')) frameworks.add('FastAPI');
    if (allCode.includes('from django') || structure.some(p => p.includes('manage.py'))) frameworks.add('Django');
    if (allCode.includes('from flask')) frameworks.add('Flask');
    if (allCode.includes('@Controller') || allCode.includes('@RestController')) frameworks.add('Spring Boot');
    
    // Database/ORM
    if (allCode.includes('@prisma') || allCode.includes('PrismaClient') || structure.some(p => p.includes('schema.prisma'))) {
      frameworks.add('Prisma ORM');
    }
    if (allCode.includes('TypeORM') || allCode.includes('typeorm')) frameworks.add('TypeORM');
    if (allCode.includes('mongoose') || allCode.includes('from mongoose')) frameworks.add('Mongoose');
    if (allCode.includes('sequelize')) frameworks.add('Sequelize');
    
    // Testing
    if (allCode.includes('jest') || structure.some(p => p.includes('jest.config'))) frameworks.add('Jest');
    if (allCode.includes('vitest')) frameworks.add('Vitest');
    if (allCode.includes('pytest') || allCode.includes('import pytest')) frameworks.add('pytest');
    
    return Array.from(frameworks);
  },

  /**
   * Extract API routes from source code
   * This extracts what it can, but the AI will analyze the full source code for complete understanding
   */
  extractApiRoutes(sourceCode: Record<string, string>): string[] {
    const routes: string[] = [];
    const basePaths: Record<string, string> = {}; // Track base paths per file

    for (const [file, code] of Object.entries(sourceCode)) {
      // First, find class-level base paths
      // Spring: @RequestMapping on class
      const classBaseMatch = code.match(/@RequestMapping\s*\(\s*(?:(?:value|path)\s*=\s*)?["']([^"']+)["']/i);
      if (classBaseMatch) {
        basePaths[file] = classBaseMatch[1];
      }

      // Express.js patterns: router.get('/path', ...) or app.post('/path', ...)
      const expressPattern = /\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
      let match;
      while ((match = expressPattern.exec(code)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        if (path && path.length < 100) {
          routes.push(`${method} ${path}`);
        }
      }

      // Spring Boot: @GetMapping, @PostMapping, etc.
      const springMethods = ['Get', 'Post', 'Put', 'Patch', 'Delete'];
      for (const springMethod of springMethods) {
        // Pattern: @GetMapping("/path") or @GetMapping(value = "/path") or @GetMapping(path = "/path")
        const pattern = new RegExp(`@${springMethod}Mapping\\s*\\(\\s*(?:(?:value|path)\\s*=\\s*)?["']([^"']+)["']`, 'gi');
        while ((match = pattern.exec(code)) !== null) {
          const method = springMethod.toUpperCase();
          const methodPath = match[1];
          const basePath = basePaths[file] || '';
          const fullPath = basePath + methodPath;
          if (fullPath.length < 150) {
            routes.push(`${method} ${fullPath}`);
          }
        }
        // Also handle @GetMapping without path (uses class-level path)
        const noPathPattern = new RegExp(`@${springMethod}Mapping\\s*(?:\\(\\s*\\))?\\s*(?:public|private|protected)`, 'gi');
        while ((match = noPathPattern.exec(code)) !== null) {
          const method = springMethod.toUpperCase();
          const basePath = basePaths[file] || '';
          if (basePath) {
            routes.push(`${method} ${basePath}`);
          }
        }
      }

      // NestJS patterns: @Get('/path'), @Post('/path')
      const nestPattern = /@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi;
      while ((match = nestPattern.exec(code)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        if (path && path.length < 100) {
          routes.push(`${method} ${path}`);
        }
      }

      // FastAPI/Flask patterns
      const fastapiPattern = /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
      while ((match = fastapiPattern.exec(code)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        if (path && path.length < 100) {
          routes.push(`${method} ${path}`);
        }
      }

      // JAX-RS patterns
      const jaxrsPathPattern = /@Path\s*\(\s*["']([^"']+)["']\s*\)/gi;
      while ((match = jaxrsPathPattern.exec(code)) !== null) {
        const path = match[1];
        if (path && path.length < 100) {
          // Look for HTTP method annotations
          if (code.includes('@GET')) routes.push(`GET ${path}`);
          if (code.includes('@POST')) routes.push(`POST ${path}`);
          if (code.includes('@PUT')) routes.push(`PUT ${path}`);
          if (code.includes('@DELETE')) routes.push(`DELETE ${path}`);
          if (code.includes('@PATCH')) routes.push(`PATCH ${path}`);
        }
      }

      // ASP.NET patterns
      const aspnetPattern = /\[Http(Get|Post|Put|Patch|Delete)\s*\(\s*["']([^"']+)["']\s*\)\]/gi;
      while ((match = aspnetPattern.exec(code)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        if (path && path.length < 100) {
          routes.push(`${method} ${path}`);
        }
      }

      // Detect if file has Swagger/OpenAPI annotations (useful context for AI)
      if (code.includes('@ApiResponse') || code.includes('@Operation') || code.includes('@Tag')) {
        console.log(`[Gitea] File ${file} has Swagger/OpenAPI annotations`);
      }
    }

    // Remove duplicates and limit
    const uniqueRoutes = [...new Set(routes)].slice(0, 50);
    console.log(`[Gitea] Extracted ${uniqueRoutes.length} routes:`, uniqueRoutes.slice(0, 10));
    return uniqueRoutes;
  },

  /**
   * Extract environment variables from .env.example
   */
  async extractEnvVars(owner: string, repo: string, structure: string[]): Promise<string[]> {
    const envFiles = structure.filter(p => 
      p.endsWith('.env.example') || 
      p.endsWith('.env.sample') || 
      p.endsWith('.env.template')
    );
    
    const vars: string[] = [];
    
    for (const file of envFiles.slice(0, 2)) {
      try {
        const content = await this.getFileContent(owner, repo, file);
        const lines = content.split('\n');
        for (const line of lines) {
          const match = line.match(/^([A-Z][A-Z0-9_]+)=/);
          if (match) {
            vars.push(match[1]);
          }
        }
      } catch {}
    }
    
    return [...new Set(vars)];
  },

  /**
   * Get multiple files content
   */
  async getMultipleFiles(
    owner: string, 
    repo: string, 
    paths: string[]
  ): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};
    
    await Promise.all(
      paths.map(async (path) => {
        try {
          contents[path] = await this.getFileContent(owner, repo, path);
        } catch {
          // Skip files that can't be read
        }
      })
    );
    
    return contents;
  },

  /**
   * Extract version information from config files (pom.xml, Cargo.toml, package.json, go.mod, etc.)
   */
  async extractVersionInfo(
    owner: string,
    repo: string,
    structure: string[],
    dependencies: any
  ): Promise<{ languageVersions: Record<string, string>; frameworkVersions: Record<string, string> }> {
    const languageVersions: Record<string, string> = {};
    const frameworkVersions: Record<string, string> = {};

    // === Node.js / package.json ===
    if (dependencies?.dependencies || dependencies?.devDependencies) {
      // Get Node version from engines field
      try {
        const pkgJson = await this.getFileContent(owner, repo, 'package.json');
        const pkg = JSON.parse(pkgJson);
        if (pkg.engines?.node) {
          languageVersions['Node.js'] = pkg.engines.node;
        }
        if (pkg.engines?.npm) {
          languageVersions['npm'] = pkg.engines.npm;
        }
        
        // Extract key framework versions
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const frameworksToCheck = [
          'react', 'vue', 'angular', 'next', 'nuxt', 'express', 'fastify', 'nestjs',
          'typescript', 'tailwindcss', 'prisma', 'mongoose', 'sequelize', 'typeorm',
          'jest', 'vitest', 'vite', 'webpack', 'esbuild', '@tanstack/react-query'
        ];
        
        for (const fw of frameworksToCheck) {
          if (deps[fw]) {
            const name = fw.startsWith('@') ? fw.split('/')[1] : fw;
            frameworkVersions[name.charAt(0).toUpperCase() + name.slice(1)] = deps[fw].replace(/[\^~]/g, '');
          }
        }
      } catch {}
    }

    // === Java / pom.xml ===
    if (structure.some(p => p === 'pom.xml' || p.includes('/pom.xml'))) {
      try {
        const pomXml = await this.getFileContent(owner, repo, 'pom.xml');
        
        // Extract Java version
        const javaVersionMatch = pomXml.match(/<java\.version>([^<]+)<\/java\.version>/);
        if (javaVersionMatch) {
          languageVersions['Java'] = javaVersionMatch[1];
        }
        const mavenCompilerSource = pomXml.match(/<maven\.compiler\.source>([^<]+)<\/maven\.compiler\.source>/);
        if (mavenCompilerSource) {
          languageVersions['Java'] = mavenCompilerSource[1];
        }
        
        // Extract Spring Boot version
        const springBootVersion = pomXml.match(/<spring-boot\.version>([^<]+)<\/spring-boot\.version>/) ||
                                  pomXml.match(/<version>([^<]+)<\/version>[\s\S]*?spring-boot-starter-parent/);
        if (springBootVersion) {
          frameworkVersions['Spring Boot'] = springBootVersion[1];
        }
        
        // Check parent for Spring Boot
        const parentArtifact = pomXml.match(/<parent>[\s\S]*?<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/);
        if (parentArtifact) {
          frameworkVersions['Spring Boot'] = parentArtifact[1];
        }
        
        // Extract Maven version (from wrapper if exists)
        const mavenWrapperMatch = pomXml.match(/<maven\.version>([^<]+)<\/maven\.version>/);
        if (mavenWrapperMatch) {
          languageVersions['Maven'] = mavenWrapperMatch[1];
        }
      } catch {}
    }

    // === Java / build.gradle ===
    if (structure.some(p => p === 'build.gradle' || p === 'build.gradle.kts')) {
      try {
        const gradleFile = structure.find(p => p === 'build.gradle.kts') || 'build.gradle';
        const gradle = await this.getFileContent(owner, repo, gradleFile);
        
        // Extract Java version
        const javaVersionMatch = gradle.match(/sourceCompatibility\s*=\s*['"]?(\d+)['"]?/) ||
                                  gradle.match(/JavaVersion\.VERSION_(\d+)/) ||
                                  gradle.match(/java\s*{\s*toolchain\s*{\s*languageVersion\.set\(JavaLanguageVersion\.of\((\d+)\)\)/);
        if (javaVersionMatch) {
          languageVersions['Java'] = javaVersionMatch[1];
        }
        
        // Extract Spring Boot version
        const springBootPlugin = gradle.match(/id\s*\(?['"]org\.springframework\.boot['"]\)?\s*version\s*['"]([^'"]+)['"]/);
        if (springBootPlugin) {
          frameworkVersions['Spring Boot'] = springBootPlugin[1];
        }
      } catch {}
    }

    // === Rust / Cargo.toml ===
    if (structure.some(p => p === 'Cargo.toml')) {
      try {
        const cargoToml = await this.getFileContent(owner, repo, 'Cargo.toml');
        
        // Rust edition (2018, 2021, etc.)
        const editionMatch = cargoToml.match(/edition\s*=\s*["'](\d+)["']/);
        if (editionMatch) {
          languageVersions['Rust Edition'] = editionMatch[1];
        }
        
        // Extract key dependencies versions
        const depsSection = cargoToml.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
        if (depsSection) {
          const deps = depsSection[1];
          const frameworks = ['tokio', 'actix-web', 'axum', 'rocket', 'serde', 'diesel', 'sqlx'];
          for (const fw of frameworks) {
            const versionMatch = deps.match(new RegExp(`${fw}\\s*=\\s*(?:\\{[^}]*version\\s*=\\s*)?["']([^"']+)["']`));
            if (versionMatch) {
              frameworkVersions[fw.charAt(0).toUpperCase() + fw.slice(1).replace(/-/g, ' ')] = versionMatch[1];
            }
          }
        }
      } catch {}
    }

    // === Go / go.mod ===
    if (structure.some(p => p === 'go.mod')) {
      try {
        const goMod = await this.getFileContent(owner, repo, 'go.mod');
        
        // Go version
        const goVersionMatch = goMod.match(/^go\s+(\d+\.\d+)/m);
        if (goVersionMatch) {
          languageVersions['Go'] = goVersionMatch[1];
        }
        
        // Key dependencies
        const frameworks = ['gin', 'echo', 'fiber', 'gorm', 'ent'];
        for (const fw of frameworks) {
          const versionMatch = goMod.match(new RegExp(`github\\.com/[^\\s]+${fw}[^\\s]*\\s+v([\\d.]+)`));
          if (versionMatch) {
            frameworkVersions[fw.charAt(0).toUpperCase() + fw.slice(1)] = versionMatch[1];
          }
        }
      } catch {}
    }

    // === Python / pyproject.toml or setup.py ===
    if (structure.some(p => p === 'pyproject.toml')) {
      try {
        const pyproject = await this.getFileContent(owner, repo, 'pyproject.toml');
        
        // Python version requirement
        const pythonVersionMatch = pyproject.match(/python\s*=\s*["']([^"']+)["']/) ||
                                   pyproject.match(/requires-python\s*=\s*["']([^"']+)["']/);
        if (pythonVersionMatch) {
          languageVersions['Python'] = pythonVersionMatch[1];
        }
        
        // Framework versions
        const frameworks = ['django', 'flask', 'fastapi', 'sqlalchemy', 'pydantic'];
        for (const fw of frameworks) {
          const versionMatch = pyproject.match(new RegExp(`${fw}\\s*=\\s*["']([^"']+)["']`));
          if (versionMatch) {
            frameworkVersions[fw.charAt(0).toUpperCase() + fw.slice(1)] = versionMatch[1];
          }
        }
      } catch {}
    }

    // === .NET / .csproj ===
    const csprojFile = structure.find(p => p.endsWith('.csproj'));
    if (csprojFile) {
      try {
        const csproj = await this.getFileContent(owner, repo, csprojFile);
        
        // Target framework
        const targetFramework = csproj.match(/<TargetFramework>([^<]+)<\/TargetFramework>/);
        if (targetFramework) {
          languageVersions['.NET'] = targetFramework[1];
        }
        
        // C# version
        const langVersion = csproj.match(/<LangVersion>([^<]+)<\/LangVersion>/);
        if (langVersion) {
          languageVersions['C#'] = langVersion[1];
        }
      } catch {}
    }

    // === PHP / composer.json ===
    if (structure.some(p => p === 'composer.json')) {
      try {
        const composer = await this.getFileContent(owner, repo, 'composer.json');
        const pkg = JSON.parse(composer);
        
        if (pkg.require?.php) {
          languageVersions['PHP'] = pkg.require.php;
        }
        
        // Framework versions
        if (pkg.require?.['laravel/framework']) {
          frameworkVersions['Laravel'] = pkg.require['laravel/framework'];
        }
        if (pkg.require?.['symfony/framework-bundle']) {
          frameworkVersions['Symfony'] = pkg.require['symfony/framework-bundle'];
        }
      } catch {}
    }

    // === Ruby / Gemfile ===
    if (structure.some(p => p === 'Gemfile')) {
      try {
        const gemfile = await this.getFileContent(owner, repo, 'Gemfile');
        
        // Ruby version
        const rubyVersionMatch = gemfile.match(/ruby\s+['"]([^'"]+)['"]/);
        if (rubyVersionMatch) {
          languageVersions['Ruby'] = rubyVersionMatch[1];
        }
        
        // Rails version
        const railsMatch = gemfile.match(/gem\s+['"]rails['"].*?['"]([^'"]+)['"]/);
        if (railsMatch) {
          frameworkVersions['Rails'] = railsMatch[1];
        }
      } catch {}
    }

    // === .nvmrc / .node-version / .python-version ===
    for (const versionFile of ['.nvmrc', '.node-version']) {
      if (structure.some(p => p === versionFile)) {
        try {
          const version = await this.getFileContent(owner, repo, versionFile);
          languageVersions['Node.js'] = version.trim().replace('v', '');
        } catch {}
      }
    }

    if (structure.some(p => p === '.python-version')) {
      try {
        const version = await this.getFileContent(owner, repo, '.python-version');
        languageVersions['Python'] = version.trim();
      } catch {}
    }

    return { languageVersions, frameworkVersions };
  },

  /**
   * Parse repository URL to get owner and repo
   */
  parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2]
    };
  },

  /**
   * Get fix commits (commits with fix/bugfix/hotfix in message)
   */
  async getFixCommits(
    owner: string, 
    repo: string,
    limit?: number
  ): Promise<{
    sha: string;
    shortSha: string;
    message: string;
    title: string;
    description: string;
    problem: string;
    solution: string;
    author: string;
    date: string;
    url: string;
    category: string;
  }[]> {
    try {
      // Get all commits
      const allCommits = await this.getCommits(owner, repo, { limit: limit || 100 });
      
      // Filter fix commits
      const fixPatterns = /^(fix|bugfix|hotfix|corrige|correção|resolve|resolved|fixed|🐛|🔧|🚑|🩹)/i;
      const fixCommits = allCommits.filter(commit => 
        fixPatterns.test(commit.message.trim())
      );
      
      // Parse commit messages to extract problem/solution
      return fixCommits.map(commit => {
        const lines = commit.message.split('\n');
        const title = lines[0].replace(/^(fix|bugfix|hotfix|corrige|correção|resolve|🐛|🔧|🚑|🩹)[\s:()-]*/i, '').trim();
        const description = lines.slice(1).join('\n').trim();
        
        // Try to extract problem and solution from commit message
        let problem = '';
        let solution = '';
        let category = 'Correção Geral';
        
        // Check for conventional commit format or structured message
        const bodyLines = description.split('\n').filter((l: string) => l.trim());
        
        // Try to detect category from keywords
        if (/entrada|entrar|ingresso/i.test(commit.message)) {
          category = 'Entrada de Veículo';
        } else if (/saída|sair|egresso/i.test(commit.message)) {
          category = 'Saída de Veículo';
        } else if (/ocr|placa|leitura/i.test(commit.message)) {
          category = 'Leitura OCR';
        } else if (/rfid|tag|wps/i.test(commit.message)) {
          category = 'TAG RFID';
        } else if (/sync|sincroni|dessincr/i.test(commit.message)) {
          category = 'Sincronização';
        } else if (/api|integra|endpoint/i.test(commit.message)) {
          category = 'Integração API';
        } else if (/banco|database|db|prisma/i.test(commit.message)) {
          category = 'Banco de Dados';
        } else if (/auth|login|token|permiss/i.test(commit.message)) {
          category = 'Autenticação';
        } else if (/ui|interface|tela|visual|css|estilo/i.test(commit.message)) {
          category = 'Interface';
        }
        
        // Try to extract problem/solution from description
        for (const line of bodyLines) {
          if (/^(problema|issue|bug|erro|falha)[\s:]/i.test(line)) {
            problem = line.replace(/^(problema|issue|bug|erro|falha)[\s:]*/i, '').trim();
          } else if (/^(solução|fix|correção|tratativa|resolved)[\s:]/i.test(line)) {
            solution = line.replace(/^(solução|fix|correção|tratativa|resolved)[\s:]*/i, '').trim();
          }
        }
        
        // If no structured format, use title as problem and description as solution
        if (!problem) problem = title;
        if (!solution && description) solution = description.split('\n')[0];
        if (!solution) solution = 'Correção aplicada no código';
        
        return {
          sha: commit.sha,
          shortSha: commit.sha.substring(0, 7),
          message: commit.message,
          title,
          description,
          problem,
          solution,
          author: commit.author,
          date: commit.date,
          url: commit.url,
          category
        };
      });
    } catch (error: any) {
      console.error('Error getting fix commits:', error.message);
      throw new Error(`Failed to get fix commits: ${error.message}`);
    }
  }
};
