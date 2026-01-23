import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type { Project, Repository, Section, Template, RepositoryAnalysis, GenerateResult, AIStatus } from '../types'

// Use relative URL for proxy or explicit IP for direct access
const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle common errors
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ===== Projects API =====
export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string; repositoryUrl: string }) => 
    api.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) => 
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  generate: (id: string) => 
    api.post<GenerateResult>(`/projects/${id}/generate`),
  getSections: (id: string) => 
    api.get<Section[]>(`/projects/${id}/sections`),
  updateSection: (projectId: string, sectionId: string, data: Partial<Section>) =>
    api.put<Section>(`/projects/${projectId}/sections/${sectionId}`, data),
  addSection: (projectId: string, data: { type: string; title: string; content: unknown; order: number }) =>
    api.post<Section>(`/projects/${projectId}/sections`, data),
  deleteSection: (projectId: string, sectionId: string) =>
    api.delete(`/projects/${projectId}/sections/${sectionId}`),
  exportHtml: (id: string) => 
    api.post(`/projects/${id}/export`, {}, { responseType: 'blob' }),
}

// ===== Repositories API =====
export const repositoriesApi = {
  list: (org?: string) => 
    api.get<Repository[]>('/repositories', { params: { org } }),
  get: (owner: string, repo: string) => 
    api.get<Repository>(`/repositories/${owner}/${repo}`),
  getTree: (owner: string, repo: string, ref?: string) => 
    api.get(`/repositories/${owner}/${repo}/tree`, { params: { ref } }),
  getFile: (owner: string, repo: string, path: string, ref?: string) => 
    api.get<{ content: string }>(`/repositories/${owner}/${repo}/file`, { params: { path, ref } }),
  getReadme: (owner: string, repo: string) => 
    api.get<{ content: string }>(`/repositories/${owner}/${repo}/readme`),
  getLanguages: (owner: string, repo: string) => 
    api.get<Record<string, number>>(`/repositories/${owner}/${repo}/languages`),
  analyze: (repositoryUrl: string) => 
    api.post<RepositoryAnalysis>('/repositories/analyze', { repositoryUrl }),
}

// ===== AI API =====
export const aiApi = {
  generateSection: (projectId: string, sectionType: string, context?: unknown) =>
    api.post<{ title: string; content: unknown }>('/ai/generate-section', { projectId, sectionType, context }),
  generateAll: (projectId: string) =>
    api.post<{ success: boolean; sectionsGenerated: number; sections: Section[] }>('/ai/generate-all', { projectId }),
  generateFull: (repositoryUrl: string, projectName?: string) =>
    api.post<{ sections: Section[] }>('/ai/generate-full', { repositoryUrl, projectName }),
  improve: (content: string, instructions: string) =>
    api.post<{ content: string }>('/ai/improve', { content, instructions }),
  summarize: (code: string, language?: string, type?: string) =>
    api.post<{ summary: string }>('/ai/summarize', { code, language, type }),
  analyzeArchitecture: (structure: string[], files?: unknown[]) =>
    api.post('/ai/analyze-architecture', { structure, files }),
  chat: (projectId: string, message: string, history?: { role: string; content: string }[]) =>
    api.post<{ response: string }>('/ai/chat', { projectId, message, history }),
  chatEdit: (projectId: string, message: string, history?: { role: string; content: string }[]) =>
    api.post<{ 
      response: string; 
      action?: { type: string; sectionId?: string; sectionType?: string; content?: unknown; title?: string };
      sections?: Section[];
      updated: boolean;
    }>('/ai/chat-edit', { projectId, message, history }),
  status: () => 
    api.get<AIStatus>('/ai/status'),
}

// ===== Templates API =====
export const templatesApi = {
  list: () => api.get<Template[]>('/templates'),
  get: (id: string) => api.get<Template>(`/templates/${id}`),
  create: (data: { name: string; description?: string; content: unknown; isDefault?: boolean }) =>
    api.post<Template>('/templates', data),
  update: (id: string, data: Partial<Template>) =>
    api.put<Template>(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  getDefault: () => api.get<Template>('/templates/default'),
}
