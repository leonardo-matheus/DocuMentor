#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';

// Configuration
const GITEA_URL = process.env.GITEA_URL || 'https://code.movemais.com';
const GITEA_TOKEN = process.env.GITEA_TOKEN || '';

// Axios client for Gitea API
const giteaClient = axios.create({
  baseURL: GITEA_URL,
  headers: {
    'Authorization': `token ${GITEA_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Create MCP server
const server = new Server(
  {
    name: 'documentor-gitea',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ===== TOOLS =====

// Tool schemas
const ListReposSchema = z.object({
  org: z.string().optional().describe('Organization name (optional)'),
  limit: z.number().optional().default(50).describe('Max number of repos to return')
});

const GetRepoSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name')
});

const GetFileSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  path: z.string().describe('File path'),
  ref: z.string().optional().describe('Git reference (branch/tag/commit)')
});

const GetTreeSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  ref: z.string().optional().describe('Git reference (branch/tag/commit)')
});

const SearchCodeSchema = z.object({
  keyword: z.string().describe('Search keyword'),
  repo: z.string().optional().describe('Repository name to search in')
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_repositories',
      description: 'List all repositories in the Gitea instance or a specific organization',
      inputSchema: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization name (optional)' },
          limit: { type: 'number', description: 'Max number of repos to return', default: 50 }
        }
      }
    },
    {
      name: 'get_repository',
      description: 'Get details about a specific repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' }
        },
        required: ['owner', 'repo']
      }
    },
    {
      name: 'get_file_content',
      description: 'Get the content of a file from a repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'File path' },
          ref: { type: 'string', description: 'Git reference (branch/tag/commit)' }
        },
        required: ['owner', 'repo', 'path']
      }
    },
    {
      name: 'get_repository_tree',
      description: 'Get the file tree of a repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          ref: { type: 'string', description: 'Git reference (branch/tag/commit)' }
        },
        required: ['owner', 'repo']
      }
    },
    {
      name: 'get_repository_languages',
      description: 'Get the programming languages used in a repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' }
        },
        required: ['owner', 'repo']
      }
    },
    {
      name: 'search_code',
      description: 'Search for code across repositories',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword' },
          repo: { type: 'string', description: 'Repository name to search in' }
        },
        required: ['keyword']
      }
    },
    {
      name: 'analyze_repository',
      description: 'Analyze repository structure and return comprehensive information for documentation',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' }
        },
        required: ['owner', 'repo']
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_repositories': {
        const { org, limit } = ListReposSchema.parse(args);
        const endpoint = org ? `/api/v1/orgs/${org}/repos` : '/api/v1/user/repos';
        const response = await giteaClient.get(endpoint, { params: { limit } });
        
        const repos = response.data.map((repo: any) => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          updated_at: repo.updated_at
        }));
        
        return {
          content: [{ type: 'text', text: JSON.stringify(repos, null, 2) }]
        };
      }

      case 'get_repository': {
        const { owner, repo } = GetRepoSchema.parse(args);
        const response = await giteaClient.get(`/api/v1/repos/${owner}/${repo}`);
        
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
      }

      case 'get_file_content': {
        const { owner, repo, path, ref } = GetFileSchema.parse(args);
        const response = await giteaClient.get(
          `/api/v1/repos/${owner}/${repo}/contents/${path}`,
          { params: { ref: ref || 'main' } }
        );
        
        let content = response.data.content;
        if (response.data.encoding === 'base64') {
          content = Buffer.from(content, 'base64').toString('utf-8');
        }
        
        return {
          content: [{ type: 'text', text: content }]
        };
      }

      case 'get_repository_tree': {
        const { owner, repo, ref } = GetTreeSchema.parse(args);
        let tree: any[] = [];
        
        try {
          const response = await giteaClient.get(
            `/api/v1/repos/${owner}/${repo}/git/trees/${ref || 'main'}`,
            { params: { recursive: true } }
          );
          tree = response.data.tree || [];
        } catch {
          // Try master if main fails
          const response = await giteaClient.get(
            `/api/v1/repos/${owner}/${repo}/git/trees/master`,
            { params: { recursive: true } }
          );
          tree = response.data.tree || [];
        }
        
        const paths = tree.map((entry: any) => ({
          path: entry.path,
          type: entry.type,
          size: entry.size
        }));
        
        return {
          content: [{ type: 'text', text: JSON.stringify(paths, null, 2) }]
        };
      }

      case 'get_repository_languages': {
        const { owner, repo } = GetRepoSchema.parse(args);
        const response = await giteaClient.get(`/api/v1/repos/${owner}/${repo}/languages`);
        
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
      }

      case 'search_code': {
        const { keyword, repo } = SearchCodeSchema.parse(args);
        const response = await giteaClient.get('/api/v1/repos/search', {
          params: { q: keyword, ...(repo && { repo }) }
        });
        
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
      }

      case 'analyze_repository': {
        const { owner, repo } = GetRepoSchema.parse(args);
        
        // Get repository info
        const repoResponse = await giteaClient.get(`/api/v1/repos/${owner}/${repo}`);
        const repoInfo = repoResponse.data;
        
        // Get languages
        const langResponse = await giteaClient.get(`/api/v1/repos/${owner}/${repo}/languages`);
        const languages = langResponse.data;
        
        // Get tree
        let tree: any[] = [];
        try {
          const treeResponse = await giteaClient.get(
            `/api/v1/repos/${owner}/${repo}/git/trees/main`,
            { params: { recursive: true } }
          );
          tree = treeResponse.data.tree || [];
        } catch {
          try {
            const treeResponse = await giteaClient.get(
              `/api/v1/repos/${owner}/${repo}/git/trees/master`,
              { params: { recursive: true } }
            );
            tree = treeResponse.data.tree || [];
          } catch {
            // No tree available
          }
        }
        
        // Get README
        let readme = '';
        try {
          const readmeResponse = await giteaClient.get(
            `/api/v1/repos/${owner}/${repo}/contents/README.md`
          );
          if (readmeResponse.data.encoding === 'base64') {
            readme = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
          }
        } catch {
          // No README
        }
        
        // Get package.json if exists
        let dependencies: any = null;
        try {
          const pkgResponse = await giteaClient.get(
            `/api/v1/repos/${owner}/${repo}/contents/package.json`
          );
          let pkgContent = pkgResponse.data.content;
          if (pkgResponse.data.encoding === 'base64') {
            pkgContent = Buffer.from(pkgContent, 'base64').toString('utf-8');
          }
          const pkg = JSON.parse(pkgContent);
          dependencies = {
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {}
          };
        } catch {
          // No package.json
        }
        
        const analysis = {
          name: repoInfo.name,
          full_name: repoInfo.full_name,
          description: repoInfo.description,
          html_url: repoInfo.html_url,
          default_branch: repoInfo.default_branch,
          languages,
          structure: tree.slice(0, 100).map((e: any) => e.path),
          readme: readme.slice(0, 5000),
          dependencies,
          stats: {
            stars: repoInfo.stars_count,
            forks: repoInfo.forks_count,
            size: repoInfo.size
          }
        };
        
        return {
          content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// ===== RESOURCES =====

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'gitea://organizations',
      name: 'Organizations',
      description: 'List of organizations in the Gitea instance',
      mimeType: 'application/json'
    },
    {
      uri: 'gitea://user/repos',
      name: 'User Repositories',
      description: 'List of repositories accessible by the authenticated user',
      mimeType: 'application/json'
    }
  ]
}));

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    if (uri === 'gitea://organizations') {
      const response = await giteaClient.get('/api/v1/user/orgs');
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    }

    if (uri === 'gitea://user/repos') {
      const response = await giteaClient.get('/api/v1/user/repos', {
        params: { limit: 100 }
      });
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    }

    // Handle dynamic repository resources
    const repoMatch = uri.match(/^gitea:\/\/repos\/([^\/]+)\/([^\/]+)$/);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      const response = await giteaClient.get(`/api/v1/repos/${owner}/${repo}`);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  } catch (error: any) {
    throw new Error(`Failed to read resource: ${error.message}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DocuMentor Gitea MCP Server running on stdio');
}

main().catch(console.error);
