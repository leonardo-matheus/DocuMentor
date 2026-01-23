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
}

export const giteaService = {
  /**
   * List repositories for an organization or user
   */
  async listRepositories(org?: string): Promise<Repository[]> {
    try {
      const endpoint = org 
        ? `/api/v1/orgs/${org}/repos`
        : '/api/v1/user/repos';
      
      const response = await giteaClient.get(endpoint, {
        params: { limit: 50 }
      });
      
      return response.data;
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
    try {
      const response = await giteaClient.get<FileContent>(
        `/api/v1/repos/${owner}/${repo}/contents/${path}`,
        { params: { ref: ref || 'main' } }
      );
      
      // Decode base64 content
      if (response.data.encoding === 'base64') {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      return response.data.content;
    } catch (error: any) {
      console.error('Error getting file content:', error.message);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
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
    
    // Get tree
    const tree = await this.getRepositoryTree(owner, repo);
    const structure = tree.map(entry => entry.path);
    
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
    
    // Read important source files (limit to avoid too much data)
    const filesToRead = [
      ...mainFiles.slice(0, 3),
      ...structure.filter(p => p.includes('/routes/') || p.includes('/controllers/')).slice(0, 5),
      ...structure.filter(p => p.includes('/services/') || p.includes('/api/')).slice(0, 3),
      ...structure.filter(p => p.endsWith('.env.example') || p.endsWith('.env.sample')),
    ];
    
    const sourceCode: Record<string, string> = {};
    for (const file of filesToRead.slice(0, 10)) {
      try {
        const content = await this.getFileContent(owner, repo, file);
        // Limit file content to first 2000 chars to save tokens
        sourceCode[file] = content.substring(0, 2000);
      } catch {
        // Skip files that can't be read
      }
    }
    
    // Detect project type and frameworks
    const projectType = this.detectProjectType(structure, languages);
    const frameworks = this.detectFrameworks(structure, sourceCode);
    
    // Extract API routes from source code
    const apiRoutes = this.extractApiRoutes(sourceCode);
    
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
      cicdInfo: cicdInfo.substring(0, 1000)
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
   */
  extractApiRoutes(sourceCode: Record<string, string>): string[] {
    const routes: string[] = [];
    const routePatterns = [
      // Express.js patterns
      /\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      // Decorators (NestJS, Spring, etc.)
      /@(Get|Post|Put|Patch|Delete|RequestMapping)\s*\(\s*['"`]?([^'"`)\s]+)['"`]?\s*\)/gi,
      // FastAPI/Flask patterns
      /@(app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ];
    
    for (const [file, code] of Object.entries(sourceCode)) {
      for (const pattern of routePatterns) {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          const method = match[1].toUpperCase();
          const path = match[2] || match[3];
          if (path && !path.includes('{') && path.length < 100) {
            routes.push(`${method} ${path}`);
          }
        }
      }
    }
    
    return [...new Set(routes)].slice(0, 20);
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
   * Parse repository URL to get owner and repo
   */
  parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2]
    };
  }
};
