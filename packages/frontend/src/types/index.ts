// Shared TypeScript types for DocuMentor

// ===== Project Types =====

export interface Project {
  id: string;
  name: string;
  description?: string;
  repositoryUrl: string;
  status: 'draft' | 'generating' | 'complete' | 'error' | 'partial';
  createdAt: string;
  updatedAt: string;
  sections?: Section[];
  metadata?: ProjectMetadata;
}

export interface ProjectMetadata {
  id: string;
  projectId: string;
  languages: string; // JSON array
  frameworks: string; // JSON array
  structure: string; // JSON array
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  projectId: string;
  type: SectionType;
  title: string;
  content: string; // JSON content
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type SectionType = 
  | 'hero'
  | 'overview'
  | 'architecture'
  | 'technologies'
  | 'flow'
  | 'faq'
  | 'integrations'
  | 'comparison'
  | 'sequence'
  | 'summary'
  | 'plans';

// ===== Section Content Types =====

export interface HeroContent {
  title: string;
  subtitle?: string;
  highlights?: string[];
  badges?: Badge[];
  logo?: string;
}

export interface Badge {
  icon?: string;
  label: string;
  color?: string;
}

export interface OverviewContent {
  description: string;
  objectives?: string[];
  targetAudience?: string;
  benefits?: Benefit[];
}

export interface Benefit {
  title: string;
  description: string;
  icon?: string;
}

export interface ArchitectureContent {
  description: string;
  pattern?: string;
  layers?: Layer[];
  designPatterns?: string[];
  diagram?: DiagramData;
}

export interface Layer {
  name: string;
  description: string;
  components?: string[];
}

export interface TechnologiesContent {
  categories: TechnologyCategory[];
}

export interface TechnologyCategory {
  name: string;
  technologies: Technology[];
}

export interface Technology {
  name: string;
  version?: string;
  description?: string;
  icon?: string;
}

export interface FlowContent {
  title?: string;
  description?: string;
  steps: FlowStep[];
  connections?: FlowConnection[];
}

export interface FlowStep {
  id: string;
  title: string;
  description?: string;
  type: 'start' | 'process' | 'decision' | 'end';
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface FAQContent {
  questions: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface IntegrationsContent {
  integrations: Integration[];
}

export interface Integration {
  name: string;
  type: 'api' | 'service' | 'webhook' | 'database';
  description: string;
  icon?: string;
  config?: Record<string, any>;
}

export interface ComparisonContent {
  title?: string;
  headers: string[];
  rows: ComparisonRow[];
}

export interface ComparisonRow {
  feature: string;
  values: (string | boolean)[];
}

export interface DiagramData {
  type: string;
  nodes?: DiagramNode[];
  connections?: DiagramConnection[];
}

export interface DiagramNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type?: string;
}

// ===== Repository Types =====

export interface Repository {
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
  owner: RepositoryOwner;
}

export interface RepositoryOwner {
  login: string;
  avatar_url: string;
}

export interface RepositoryAnalysis {
  owner: string;
  repo: string;
  description: string;
  languages: Record<string, number>;
  structure: string[];
  readme: string;
  dependencies: Dependencies;
  configFiles: string[];
}

export interface Dependencies {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// ===== Template Types =====

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string; // JSON template content
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerateResult {
  success: boolean;
  projectId: string;
  sectionsGenerated: number;
  errors: string[];
}

export interface AIStatus {
  status: 'connected' | 'error';
  model: string;
  endpoint: string;
}
