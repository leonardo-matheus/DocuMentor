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
    const branches = ref ? [ref] : ['main', 'master', 'develop'];
    
    for (const branch of branches) {
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
        // If specific ref was provided, don't try other branches
        if (ref) {
          throw new Error(`File not found: ${path}`);
        }
        // Try next branch silently
      }
    }
    
    throw new Error(`File not found: ${path}`);
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
   * Analyze repository structure
   */
  async analyzeRepository(repositoryUrl: string): Promise<{
    owner: string;
    repo: string;
    description: string;
    languages: Record<string, number>;
    structure: string[];
    readme: string;
    dependencies: any;
    configFiles: string[];
  }> {
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
      '.env.example'
    ];
    
    const configFiles = structure.filter(path => 
      configPatterns.some(pattern => path.includes(pattern))
    );
    
    // Try to get package.json for dependencies
    let dependencies = {};
    try {
      const pkgJson = await this.getFileContent(owner, repo, 'package.json');
      const pkg = JSON.parse(pkgJson);
      dependencies = {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {}
      };
    } catch {
      // No package.json or parse error
    }
    
    return {
      owner,
      repo,
      description: repoInfo.description || '',
      languages,
      structure,
      readme,
      dependencies,
      configFiles
    };
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
  },

  /**
   * Get repository commits
   */
  async getCommits(
    owner: string, 
    repo: string, 
    options?: { 
      page?: number; 
      limit?: number; 
      sha?: string;
      keyword?: string;
    }
  ): Promise<{
    sha: string;
    message: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    html_url: string;
  }[]> {
    try {
      const response = await giteaClient.get(
        `/api/v1/repos/${owner}/${repo}/commits`,
        { 
          params: { 
            page: options?.page || 1, 
            limit: options?.limit || 50,
            sha: options?.sha,
            keyword: options?.keyword
          } 
        }
      );
      
      return response.data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit?.message || '',
        author: {
          name: commit.commit?.author?.name || '',
          email: commit.commit?.author?.email || '',
          date: commit.commit?.author?.date || ''
        },
        committer: {
          name: commit.commit?.committer?.name || '',
          email: commit.commit?.committer?.email || '',
          date: commit.commit?.committer?.date || ''
        },
        html_url: commit.html_url || ''
      }));
    } catch (error: any) {
      console.error('Error getting commits:', error.message);
      throw new Error(`Failed to get commits: ${error.message}`);
    }
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
        const bodyLines = description.split('\n').filter(l => l.trim());
        
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
          author: commit.author.name,
          date: commit.author.date,
          url: commit.html_url,
          category
        };
      });
    } catch (error: any) {
      console.error('Error getting fix commits:', error.message);
      throw new Error(`Failed to get fix commits: ${error.message}`);
    }
  }
};
