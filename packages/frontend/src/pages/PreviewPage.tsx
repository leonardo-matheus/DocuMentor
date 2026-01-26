import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Download, ArrowLeft, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { projectsApi } from '@/services/api'
import {
  Hero,
  NavBar,
  Section,
  HighlightBox,
  ComparisonTable,
  FlowDiagram,
  FAQSection,
  SummaryCard,
  Footer,
  EndpointsSection,
} from '@/components/documentation'
import AIChat from '@/components/AIChat'
import toast from 'react-hot-toast'

interface ProjectSection {
  id: string
  type: string
  title: string
  content: any
  order: number
}

// Technology icon mapping for common technologies
const TECH_ICONS: Record<string, string> = {
  // Languages
  typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  csharp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
  rust: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
  php: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  ruby: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
  swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
  kotlin: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
  
  // Frontend Frameworks
  react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  vue: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
  svelte: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
  nextjs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
  nuxt: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg',
  
  // Backend Frameworks
  nodejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  express: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
  nestjs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg',
  django: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
  flask: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
  spring: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
  dotnet: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg',
  
  // Databases
  postgresql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
  mysql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  mongodb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
  redis: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
  sqlite: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg',
  oracle: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/oracle/oracle-original.svg',
  sqlserver: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
  
  // DevOps & Cloud
  docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  kubernetes: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
  aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
  azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
  gcp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg',
  nginx: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg',
  jenkins: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg',
  
  // Tools
  git: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
  github: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
  gitlab: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg',
  vscode: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
  npm: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg',
  yarn: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/yarn/yarn-original.svg',
  webpack: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg',
  vite: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg',
  babel: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/babel/babel-original.svg',
  eslint: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg',
  jest: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg',
  
  // CSS & UI
  tailwindcss: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
  css: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
  sass: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg',
  html: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
  bootstrap: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg',
  materialui: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/materialui/materialui-original.svg',
  
  // Other
  graphql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
  prisma: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg',
  firebase: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
  linux: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
  windows: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg',
  
  // Config files & Package managers
  tsconfig: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  packagejson: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  package: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  pnpm: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pnpm/pnpm-original.svg',
  bun: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bun/bun-original.svg',
  
  // Scripts & Shells
  bash: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
  powershell: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/powershell/powershell-original.svg',
  batch: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg',
  shell: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
  
  // More tools
  figma: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
  postman: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg',
  insomnia: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/insomnia/insomnia-original.svg',
  swagger: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swagger/swagger-original.svg',
  
  // Testing
  mocha: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mocha/mocha-original.svg',
  cypress: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cypressio/cypressio-original.svg',
  playwright: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/playwright/playwright-original.svg',
  vitest: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitest/vitest-original.svg',
  
  // More frameworks
  fastapi: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
  electron: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg',
  tauri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tauri/tauri-original.svg',
  redux: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg',
  
  // Monitoring & Logging
  prometheus: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg',
  grafana: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg',
  
  // Message Queues
  rabbitmq: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg',
  kafka: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg',
  
  // Mobile
  android: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg',
  ios: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg',
  flutter: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
  reactnative: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
}

// Get tech icon from mapping or return emoji fallback
const getTechIcon = (techName: string, providedIcon?: string): string => {
  if (providedIcon && providedIcon.startsWith('http')) {
    return providedIcon
  }
  
  const normalizedName = techName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\.js$/i, '')
    .replace(/\.ts$/i, '')
    .replace(/\.json$/i, '')
    .replace('node.js', 'nodejs')
    .replace('node', 'nodejs')
    .replace('next.js', 'nextjs')
    .replace('nuxt.js', 'nuxt')
    .replace('vue.js', 'vue')
    .replace('react.js', 'react')
    .replace('tailwind', 'tailwindcss')
    .replace('postgres', 'postgresql')
    .replace('mongo', 'mongodb')
    .replace('c#', 'csharp')
    .replace('batchscripts', 'batch')
    .replace('batchscript', 'batch')
    .replace('shellscripts', 'shell')
    .replace('shellscript', 'shell')
    .replace('reactnative', 'reactnative')
  
  // Check direct match
  if (TECH_ICONS[normalizedName]) {
    return TECH_ICONS[normalizedName]
  }
  
  // Special cases for config files
  if (normalizedName.includes('tsconfig')) {
    return TECH_ICONS['tsconfig']
  }
  if (normalizedName.includes('package') || normalizedName.includes('npm')) {
    return TECH_ICONS['packagejson']
  }
  if (normalizedName.includes('batch') || normalizedName.includes('cmd') || normalizedName.includes('.bat')) {
    return TECH_ICONS['batch']
  }
  if (normalizedName.includes('powershell') || normalizedName.includes('.ps1')) {
    return TECH_ICONS['powershell']
  }
  if (normalizedName.includes('bash') || normalizedName.includes('shell') || normalizedName.includes('.sh')) {
    return TECH_ICONS['bash']
  }
  
  // Check partial match
  for (const [key, value] of Object.entries(TECH_ICONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value
    }
  }
  
  return '' // Will use emoji fallback
}

// Section type icons
const SECTION_ICONS: Record<string, string> = {
  hero: '🎯',
  overview: '📋',
  architecture: '🏗️',
  technologies: '⚙️',
  flow: '🔄',
  faq: '❓',
  installation: '📦',
  api: '🔌',
  comparison: '📊',
  integrations: '🔗',
  custom: '✏️',
}

export default function PreviewPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!).then(res => res.data),
    enabled: !!id,
  })
  
  // Export functions
  const exportHTML = () => {
    const content = document.getElementById('doc-content')
    if (!content) return
    
    // Clone content and remove no-print elements
    const clone = content.cloneNode(true) as HTMLElement
    clone.querySelectorAll('.no-print').forEach(el => el.remove())
    
    // Build navbar HTML for export (using section.id for correct navigation)
    const navbarItems = sections
      .filter((s: ProjectSection) => s.type !== 'hero')
      .map((section: ProjectSection) => {
        const sectionConfig = SECTION_ICONS[section.type] ? { icon: SECTION_ICONS[section.type], label: section.title } : { icon: '📄', label: section.title }
        return `<li><a href="#${section.id}" class="nav-item">${sectionConfig.icon} ${sectionConfig.label}</a></li>`
      }).join('')
    
    const navbarHTML = `
    <nav class="navbar" id="mainNav">
      <ul class="nav-list">${navbarItems}</ul>
    </nav>`
    
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project?.name || 'Documentação'} - DocuMentor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { DEFAULT: '#6366f1', 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
            secondary: { DEFAULT: '#8b5cf6', 500: '#8b5cf6', 600: '#7c3aed' }
          }
        }
      }
    }
  <\/script>
  <style>
    :root {
      --primary: #6366f1;
      --primary-light: #818cf8;
      --primary-dark: #4f46e5;
      --primary-bg: #eef2ff;
      --secondary: #8b5cf6;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 20px;
      --radius-xl: 28px;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      line-height: 1.7; 
      color: var(--gray-800); 
      background: #f8fafc; 
    }
    
    /* ===================== TAILWIND FALLBACKS ===================== */
    .text-white { color: white !important; }
    .text-gray-900 { color: #111827; }
    .text-gray-800 { color: #1f2937; }
    .text-gray-700 { color: #374151; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-500 { color: #6b7280; }
    .bg-white { background-color: white; }
    .bg-white\\/20 { background-color: rgba(255,255,255,0.2); }
    .bg-white\\/15 { background-color: rgba(255,255,255,0.15); }
    .bg-white\\/10 { background-color: rgba(255,255,255,0.1); }
    
    /* ===================== ANIMATIONS ===================== */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes slideInFromLeft {
      from { opacity: 0; transform: translateX(-50px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInFromRight {
      from { opacity: 0; transform: translateX(50px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.3); }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes ripple {
      0% { transform: scale(0); opacity: 0.5; }
      100% { transform: scale(4); opacity: 0; }
    }
    
    .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .animate-fade-in-down { animation: fadeInDown 0.6s ease-out forwards; }
    .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-pulse { animation: pulse 2.5s ease-in-out infinite; }
    .animate-shimmer { animation: shimmer 2s infinite linear; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%; }
    
    .animate-on-scroll { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
    .animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
    .delay-1 { transition-delay: 0.1s; animation-delay: 0.1s; }
    .delay-2 { transition-delay: 0.2s; animation-delay: 0.2s; }
    .delay-3 { transition-delay: 0.3s; animation-delay: 0.3s; }
    .delay-4 { transition-delay: 0.4s; animation-delay: 0.4s; }
    .delay-5 { transition-delay: 0.5s; animation-delay: 0.5s; }
    
    /* ===================== MODERN CARD EFFECTS ===================== */
    .card, .tech-card, .doc-card, .summary-card {
      transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), 
                  box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                  border-color 0.3s ease;
      will-change: transform, box-shadow;
    }
    .card:hover, .tech-card:hover, .doc-card:hover, .summary-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1);
    }
    
    /* Glass Effect */
    .glass-effect {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    /* Shine Effect on Hover */
    .shine-effect { position: relative; overflow: hidden; }
    .shine-effect::after {
      content: '';
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
      transform: translateX(-100%) rotate(45deg);
      transition: transform 0.6s ease;
    }
    .shine-effect:hover::after { transform: translateX(100%) rotate(45deg); }
    
    /* Glow Effects */
    .card-glow:hover { box-shadow: 0 20px 40px rgba(99, 102, 241, 0.25), 0 0 60px rgba(99, 102, 241, 0.1); }
    .card-glow-success:hover { box-shadow: 0 20px 40px rgba(16, 185, 129, 0.25), 0 0 60px rgba(16, 185, 129, 0.1); }
    .card-glow-warning:hover { box-shadow: 0 20px 40px rgba(245, 158, 11, 0.25), 0 0 60px rgba(245, 158, 11, 0.1); }
    
    /* ===================== NAVBAR ===================== */
    .navbar {
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      padding: 14px 40px;
      z-index: 100;
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .navbar.scrolled {
      padding: 10px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      background: rgba(255, 255, 255, 0.98);
    }
    .nav-list {
      display: flex;
      justify-content: center;
      gap: 8px;
      list-style: none;
      max-width: 100%;
      margin: 0 auto;
      flex-wrap: wrap;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      color: var(--gray-600);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: var(--radius-md);
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
      overflow: hidden;
    }
    .nav-item::before {
      content: '';
      position: absolute;
      bottom: 0; left: 50%;
      width: 0; height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      transform: translateX(-50%);
      border-radius: 3px;
    }
    .nav-item:hover {
      background: var(--primary-bg);
      color: var(--primary);
      transform: translateY(-2px);
    }
    .nav-item:hover::before { width: 80%; }
    .nav-item.active {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
    }
    
    /* ===================== HERO ===================== */
    .hero-section, .gradient-hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, var(--primary-dark) 100%);
      background-size: 200% 200%;
      animation: gradientShift 20s ease infinite;
      color: white !important;
      padding: 100px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero-section *, .gradient-hero * {
      color: white !important;
    }
    .hero-section h1, .gradient-hero h1,
    .hero-section h2, .gradient-hero h2,
    .hero-section h3, .gradient-hero h3,
    .hero-section p, .gradient-hero p,
    .hero-section span, .gradient-hero span,
    .hero-section div, .gradient-hero div {
      color: white !important;
    }
    .hero-section .opacity-90, .gradient-hero .opacity-90 { opacity: 0.9; }
    .hero-section .opacity-80, .gradient-hero .opacity-80 { opacity: 0.8; }
    .hero-section::before, .gradient-hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      animation: float 25s ease-in-out infinite;
      pointer-events: none;
    }
    .hero-section::after, .gradient-hero::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 120px;
      background: linear-gradient(to top, rgba(248, 250, 252, 0.1), transparent);
      pointer-events: none;
    }
    
    /* ===================== SECTIONS ===================== */
    .section { max-width: 1200px; margin: 80px auto; padding: 0 40px; }
    .section-alt { background: linear-gradient(180deg, var(--gray-50) 0%, white 100%); position: relative; }
    .section-alt::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gray-200), transparent);
    }
    
    .section-title { text-align: center; margin-bottom: 60px; }
    .section-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px; height: 60px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      border-radius: 50%;
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: 20px;
      transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.35);
    }
    .section-title:hover .section-number {
      transform: scale(1.15) rotate(10deg);
      box-shadow: 0 15px 40px rgba(99, 102, 241, 0.5);
    }
    .section-title h2 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--gray-900);
      margin-bottom: 16px;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }
    .section-title p {
      font-size: 1.15rem;
      color: var(--gray-500);
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.8;
    }
    
    /* ===================== CARDS ===================== */
    .doc-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
      border: 1px solid var(--gray-100);
    }
    
    .tech-card {
      background: white;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      border: 2px solid transparent;
      border-top: 4px solid var(--primary);
    }
    .tech-card:hover {
      transform: translateY(-12px) scale(1.02);
      box-shadow: 0 35px 70px rgba(0,0,0,0.18);
    }
    
    .summary-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 32px;
      text-align: center;
      box-shadow: 0 8px 30px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
      border: 1px solid var(--gray-100);
    }
    .summary-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
    }
    .summary-card .icon { font-size: 2.5rem; margin-bottom: 16px; transition: transform 0.4s ease; }
    .summary-card:hover .icon { transform: scale(1.2); }
    .summary-card .value { font-size: 2rem; font-weight: 800; color: var(--gray-900); }
    .summary-card .label { font-size: 0.95rem; color: var(--gray-500); margin-top: 8px; }
    
    /* ===================== HIGHLIGHT BOXES ===================== */
    .highlight-box {
      display: flex;
      gap: 16px;
      padding: 24px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .highlight-box:hover { transform: translateX(8px); }
    .highlight-icon { font-size: 1.5rem; flex-shrink: 0; }
    .highlight-content h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .highlight-content p { font-size: 0.95rem; line-height: 1.7; }
    
    .highlight-info { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-left: 4px solid #3b82f6; }
    .highlight-success { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-left: 4px solid #22c55e; }
    .highlight-warning { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; }
    .highlight-error { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-left: 4px solid #ef4444; }
    
    /* ===================== FLOW DIAGRAM ===================== */
    .flow-section {
      background: white;
      border-radius: var(--radius-xl);
      padding: 50px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      margin-top: 40px;
    }
    .flow-steps { display: flex; align-items: stretch; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .flow-step { flex: 1; min-width: 160px; max-width: 220px; text-align: center; }
    .flow-step-box {
      background: var(--gray-50);
      border: 2px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 28px 20px;
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      height: 100%;
    }
    .flow-step-box:hover {
      transform: translateY(-10px) scale(1.05);
      box-shadow: 0 25px 50px rgba(0,0,0,0.12);
      border-color: var(--primary);
    }
    .flow-step-icon {
      width: 70px; height: 70px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      margin: 0 auto 16px;
      transition: all 0.4s ease;
    }
    .flow-step-box:hover .flow-step-icon { transform: scale(1.15); }
    .flow-step-box h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .flow-step-box p { font-size: 0.85rem; color: var(--gray-500); }
    .flow-arrow { font-size: 1.5rem; color: var(--gray-400); display: flex; align-items: center; }
    
    /* ===================== COMPARISON TABLE ===================== */
    .comparison-table-wrapper {
      background: white;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    }
    .comparison-table { width: 100%; border-collapse: collapse; }
    .comparison-table th {
      background: linear-gradient(135deg, var(--gray-800), var(--gray-900));
      color: white;
      padding: 18px 24px;
      text-align: left;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .comparison-table td {
      padding: 18px 24px;
      border-bottom: 1px solid var(--gray-100);
      transition: all 0.3s ease;
    }
    .comparison-table tr:hover td { background-color: var(--gray-50); }
    .comparison-table .feature-name { font-weight: 600; color: var(--gray-700); }
    
    .badge-yes {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #166534;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.3s ease;
    }
    .badge-yes:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(22, 101, 52, 0.3); }
    .badge-no {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #991b1b;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .badge-partial {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
    }
    
    /* ===================== FAQ ACCORDION ===================== */
    .faq-container { margin-top: 20px; }
    .faq-item { 
      background: white;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }
    .faq-item:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
    .faq-item:last-child { margin-bottom: 0; }
    .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 20px 24px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      color: var(--gray-800);
      background: transparent;
      border: none;
      text-align: left;
      transition: all 0.3s ease;
    }
    .faq-question:hover { background: var(--gray-50); color: var(--primary); }
    .faq-question-text { flex: 1; margin-right: 16px; }
    .faq-toggle { 
      font-size: 1.5rem; 
      transition: transform 0.3s ease; 
      color: var(--gray-400);
      flex-shrink: 0;
    }
    .faq-item.active .faq-toggle { transform: rotate(45deg); color: var(--primary); }
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
      padding: 0 24px;
      color: var(--gray-600);
      line-height: 1.8;
      background: var(--gray-50);
    }
    .faq-item.active .faq-answer { 
      max-height: 1000px; 
      padding: 20px 24px; 
    }
    
    /* ===================== FOOTER ===================== */
    footer {
      background: linear-gradient(135deg, var(--gray-900), var(--gray-800));
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
    }
    footer::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--secondary), var(--success));
    }
    footer p { color: rgba(255,255,255,0.7); margin-top: 12px; }
    
    /* ===================== RESPONSIVE ===================== */
    @media (max-width: 768px) {
      .section { padding: 0 20px; margin: 50px auto; }
      .section-title h2 { font-size: 1.8rem; }
      .hero-section { padding: 60px 20px; }
      .navbar { padding: 12px 20px; }
      .nav-list { gap: 4px; }
      .nav-item { padding: 8px 12px; font-size: 0.8rem; }
      .flow-steps { flex-direction: column; align-items: center; }
      .flow-step { max-width: 100%; }
      .flow-arrow { transform: rotate(90deg); }
      .comparison-table-wrapper { overflow-x: auto; }
    }
    
    /* ===================== PRINT ===================== */
    @media print {
      .no-print, .navbar { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      section { page-break-inside: avoid; break-inside: avoid; }
      .hero-section { background: linear-gradient(135deg, #667eea, #764ba2) !important; }
    }
  </style>
</head>
<body>
  ${navbarHTML}
  ${clone.innerHTML}
  
  <script>
    // ===================== NAVBAR SCROLL EFFECT =====================
    const navbar = document.getElementById('mainNav');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    });
    
    // ===================== SMOOTH SCROLL =====================
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
          const yOffset = -80;
          const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
    
    // ===================== ACTIVE NAV STATE =====================
    const sections = document.querySelectorAll('section[id], div[id]');
    const navItems = document.querySelectorAll('.nav-item');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.pageYOffset >= sectionTop) {
          current = section.getAttribute('id') || '';
        }
      });
      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + current) {
          item.classList.add('active');
        }
      });
    });
    
    // ===================== SCROLL ANIMATIONS =====================
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.querySelectorAll('.stagger-child').length) {
            entry.target.querySelectorAll('.stagger-child').forEach((child, i) => {
              child.style.transitionDelay = (i * 0.1) + 's';
              child.classList.add('visible');
            });
          }
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('.animate-on-scroll, section, .doc-card, .tech-card, .summary-card, .highlight-box').forEach(el => {
      el.classList.add('animate-on-scroll');
      observer.observe(el);
    });
    
    // ===================== FAQ ACCORDION =====================
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = question.closest('.faq-item');
        if (!item) return;
        const wasActive = item.classList.contains('active');
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        // Toggle current item
        if (!wasActive) {
          item.classList.add('active');
        }
      });
    });
    
    // ===================== RIPPLE EFFECT =====================
    document.querySelectorAll('.doc-card, .tech-card, .summary-card, .flow-step-box').forEach(card => {
      card.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(99,102,241,0.3);pointer-events:none;animation:ripple 0.6s ease-out;';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        ripple.style.width = ripple.style.height = '10px';
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
    
    // ===================== COUNTER ANIMATION =====================
    document.querySelectorAll('.summary-card .value').forEach(el => {
      const text = el.textContent;
      const match = text.match(/(\\d+)/);
      if (match) {
        const target = parseInt(match[1]);
        let count = 0;
        const duration = 2000;
        const step = target / (duration / 16);
        const animate = () => {
          count += step;
          if (count < target) {
            el.textContent = text.replace(match[1], Math.floor(count).toString());
            requestAnimationFrame(animate);
          } else {
            el.textContent = text;
          }
        };
        const obs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) { animate(); obs.disconnect(); }
        });
        obs.observe(el);
      }
    });
  <\/script>
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.name || 'documentacao'}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('HTML exportado com sucesso!')
  }
  
  const exportPDF = () => {
    // Add print-specific styles
    const style = document.createElement('style')
    style.id = 'print-styles'
    style.innerHTML = `
      @media print {
        .no-print { display: none !important; }
        body { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          margin: 0;
          padding: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #doc-content {
          padding: 0;
        }
        section { 
          page-break-inside: avoid !important; 
          break-inside: avoid !important;
          margin-bottom: 20px;
        }
        .section-title {
          text-align: center;
        }
        .section-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          color: white !important;
          font-weight: bold;
          border-radius: 50%;
          margin-bottom: 1rem;
        }
        .gradient-hero { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%) !important; 
          color: white !important;
        }
        .bg-white { background-color: white !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .bg-blue-100 { background-color: #dbeafe !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-green-100 { background-color: #dcfce7 !important; }
        .bg-purple-100 { background-color: #f3e8ff !important; }
        .bg-indigo-50 { background-color: #eef2ff !important; }
        .text-white { color: white !important; }
        .text-gray-900 { color: #111827 !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-blue-700 { color: #1d4ed8 !important; }
        .shadow-card, .shadow-sm, .shadow-md, .shadow-lg { 
          box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important; 
          border: 1px solid #e5e7eb !important;
        }
        img { max-width: 100% !important; height: auto !important; }
        .sticky { position: relative !important; }
        .max-w-7xl { max-width: 100% !important; padding: 0 1rem !important; }
        .grid { display: grid !important; }
        .gap-6 { gap: 1.5rem !important; }
        .rounded-xl, .rounded-2xl { border-radius: 0.75rem !important; }
        .p-6 { padding: 1.5rem !important; }
        .py-16 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
      }
    `
    document.head.appendChild(style)
    
    window.print()
    
    setTimeout(() => {
      const printStyle = document.getElementById('print-styles')
      if (printStyle) document.head.removeChild(printStyle)
    }, 1000)
    
    toast.success('Salve como PDF no diálogo de impressão')
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  // Parse sections from project and sort by order
  const sections: ProjectSection[] = (project?.sections 
    ? (typeof project.sections === 'string' ? JSON.parse(project.sections) : project.sections)
    : []
  ).sort((a: ProjectSection, b: ProjectSection) => (a.order ?? 0) - (b.order ?? 0))
  
  // Build nav items from actual sections (exclude hero), preserving order
  const navItems = sections
    .filter(s => s.type !== 'hero')
    .map(s => ({
      id: s.id, // Use unique section ID instead of type
      label: s.title,
      icon: SECTION_ICONS[s.type] || '📄'
    }))
  
  // Find hero section
  const heroSection = sections.find(s => s.type === 'hero')
  
  // Render section content based on type
  const renderSectionContent = (section: ProjectSection, index: number) => {
    const content = section.content || {}
    
    switch (section.type) {
      case 'hero':
        return null // Hero is rendered separately
      
      case 'about':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.subtitle || 'Entenda de forma simples o que este sistema faz'}
          >
            {/* Introduction - Simple explanation */}
            {content.introduction && (
              <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    💡
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-indigo-900 mb-2">O que é o {content.systemName || 'Sistema'}?</h4>
                    <p className="text-indigo-800 leading-relaxed">{content.introduction}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Target Audience */}
            {content.targetAudience && content.targetAudience.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-lg">👥</span>
                  Para quem é este sistema?
                </h4>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {content.targetAudience.map((audience: any, i: number) => (
                    <div key={i} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all">
                      <div className="text-2xl mb-2">{audience.icon || '👤'}</div>
                      <h5 className="font-semibold text-emerald-800">{audience.name}</h5>
                      <p className="text-sm text-emerald-700 mt-1">{audience.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Problems Solved */}
            {content.problemsSolved && content.problemsSolved.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-lg">🎯</span>
                  Quais problemas este sistema resolve?
                </h4>
                <div className="space-y-3">
                  {content.problemsSolved.map((problem: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{problem.before}</h5>
                        <div className="flex items-center gap-2 my-2">
                          <span className="text-red-500">❌ Antes</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-emerald-500">✅ Depois</span>
                        </div>
                        <p className="text-sm text-gray-600">{problem.after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Key Benefits - Visual Cards */}
            {content.keyBenefits && content.keyBenefits.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-lg">✨</span>
                  Principais benefícios
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {content.keyBenefits.map((benefit: any, i: number) => (
                    <div key={i} className="p-5 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl border border-sky-100 text-center hover:shadow-lg transition-all">
                      <div className="text-3xl mb-3">{benefit.icon || '⭐'}</div>
                      <h5 className="font-bold text-gray-900 mb-1">{benefit.title}</h5>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* How it Works - Simple Steps */}
            {content.howItWorks && content.howItWorks.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-lg">🔄</span>
                  Como funciona? (Passo a passo simples)
                </h4>
                <div className="relative">
                  {/* Connection line */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-300 via-indigo-300 to-sky-300 hidden md:block" />
                  
                  <div className="space-y-4">
                    {content.howItWorks.map((step: any, i: number) => (
                      <div key={i} className="relative flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all md:ml-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg relative z-10">
                          {step.icon || i + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{step.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          {step.example && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
                              💡 Exemplo: {step.example}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Metrics / KPIs */}
            {content.metrics && content.metrics.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-lg">📊</span>
                  Indicadores e resultados
                </h4>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {content.metrics.map((metric: any, i: number) => (
                    <div key={i} className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100 text-center">
                      <div className="text-3xl font-bold text-rose-600 mb-1">{metric.value}</div>
                      <div className="text-sm font-medium text-gray-700">{metric.label}</div>
                      {metric.description && (
                        <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Glossary - Technical terms explained */}
            {content.glossary && content.glossary.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">📚</span>
                  Glossário - Termos técnicos explicados
                </h4>
                <div className="bg-teal-50 rounded-xl border border-teal-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-teal-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800 w-1/4">Termo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">O que significa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-100">
                      {content.glossary.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-teal-100/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-teal-700">{item.term}</td>
                          <td className="px-4 py-3 text-gray-700">{item.definition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Integrations Overview */}
            {content.integrations && content.integrations.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-lg">🔗</span>
                  Com quais sistemas ele se conecta?
                </h4>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {content.integrations.map((integration: any, i: number) => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center text-xl">
                          {integration.icon || '🔌'}
                        </div>
                        <h5 className="font-semibold text-gray-900">{integration.name}</h5>
                      </div>
                      <p className="text-sm text-gray-600">{integration.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick FAQ for Non-Technical Users */}
            {content.simpleFaq && content.simpleFaq.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">❓</span>
                  Perguntas frequentes
                </h4>
                <div className="space-y-3">
                  {content.simpleFaq.map((faq: any, i: number) => (
                    <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm group-open:bg-orange-500 group-open:text-white transition-colors">
                          ?
                        </div>
                        <span className="font-medium text-gray-900">{faq.question}</span>
                      </summary>
                      <div className="px-4 pb-4 pt-2 ml-11 text-gray-600 border-t border-gray-100">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )
        
      case 'overview':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.description || 'Visão geral do sistema'}
          >
            {content.objectives && (
              <HighlightBox variant="info" title="Objetivos">
                <ul className="list-disc list-inside space-y-1">
                  {content.objectives.map((obj: string, i: number) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </HighlightBox>
            )}
            {content.benefits && (
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {content.benefits.map((benefit: any, i: number) => (
                  <SummaryCard 
                    key={i}
                    icon={benefit.icon || '✨'} 
                    value={benefit.title} 
                    label={benefit.description} 
                  />
                ))}
              </div>
            )}
          </Section>
        )
        
      case 'architecture':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.description || 'Arquitetura do sistema'}
            variant="alt"
          >
            {content.pattern && (
              <HighlightBox variant="info" title={`Padrão: ${content.pattern}`}>
                <p>{content.description}</p>
              </HighlightBox>
            )}
            {content.layers && (
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {content.layers.map((layer: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm">
                    <h4 className="font-bold text-lg mb-2">{layer.name}</h4>
                    <p className="text-gray-600 mb-4">{layer.description}</p>
                    {layer.components && (
                      <div className="flex flex-wrap gap-2">
                        {layer.components.map((comp: string, j: number) => (
                          <span key={j} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )
        
      case 'technologies':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle="Tecnologias utilizadas no projeto"
            variant="alt"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {content.categories?.map((cat: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">
                      {i + 1}
                    </span>
                    {cat.name}
                  </h4>
                  <div className="space-y-3">
                    {cat.technologies?.map((tech: any, j: number) => {
                      const iconUrl = getTechIcon(tech.name, tech.icon)
                      return (
                        <div key={j} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group cursor-default">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
                            {iconUrl ? (
                              <img 
                                src={iconUrl} 
                                alt={tech.name} 
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                  const parent = (e.target as HTMLImageElement).parentElement
                                  if (parent) {
                                    parent.innerHTML = '<span class="text-2xl">💻</span>'
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-2xl">{tech.icon || '💻'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{tech.name}</span>
                              {tech.version && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                  v{tech.version}
                                </span>
                              )}
                            </div>
                            {tech.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tech.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )
        
      case 'flow':
        // Helper functions for step processing
        const isError = (title: string, type?: string) => {
          const titleLower = (title || '').toLowerCase()
          if (titleLower.includes('erro') || 
              titleLower.includes('error') || 
              titleLower.includes('falha') ||
              titleLower.includes('fail') ||
              /\b4\d{2}\b/.test(title) ||
              /\b5\d{2}\b/.test(title)) {
            return true
          }
          return type === 'error'
        }
        
        const isSuccess = (title: string, type?: string) => {
          const titleLower = (title || '').toLowerCase()
          if (titleLower.includes('sucesso') ||
              titleLower.includes('success') ||
              titleLower.includes('200') ||
              titleLower.includes('201') ||
              titleLower.includes('resposta ok') ||
              titleLower.includes('aprovado') ||
              (titleLower.includes('autorizado') && !titleLower.includes('não'))) {
            return true
          }
          return type === 'success' || type === 'end'
        }
        
        const getIcon = (title: string, type: string, icon?: string) => {
          if (icon) return icon
          if (isError(title, type)) return '❌'
          if (isSuccess(title, type)) return '✅'
          const iconMap: Record<string, string> = {
            start: '▶️', decision: '🔀', database: '🗄️', process: '⚙️',
            camera: '📷', vehicle: '🚗', system: '💻', end: '🏁'
          }
          return iconMap[type] || '⚙️'
        }
        
        const getVariant = (title: string, type: string, variant?: string) => {
          if (isError(title, type)) return 'error'
          if (isSuccess(title, type)) return 'success'
          if (variant) return variant
          const variantMap: Record<string, string> = {
            start: 'start', decision: 'decision', database: 'database', 
            process: 'process', camera: 'camera', vehicle: 'vehicle', system: 'system', end: 'end'
          }
          return variantMap[type] || 'default'
        }
        
        const processStep = (step: any) => {
          const stepType = step.type || step.variant || ''
          return {
            id: step.id,
            icon: getIcon(step.title, stepType, step.icon),
            title: step.title,
            description: step.description,
            variant: getVariant(step.title, stepType, step.variant)
          }
        }
        
        // Check if we have multiple flows (new format) or single flow (old format)
        const hasMultipleFlows = Array.isArray(content.flows) && content.flows.length > 0
        
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.description || 'Fluxo do sistema'}
          >
            {hasMultipleFlows ? (
              <FlowDiagram
                flows={content.flows.map((flow: any) => ({
                  id: flow.id,
                  title: flow.title,
                  description: flow.description,
                  icon: flow.icon || '🔄',
                  steps: (flow.steps || []).map(processStep)
                }))}
              />
            ) : content.steps ? (
              <FlowDiagram
                title={content.title || 'Fluxo Principal'}
                steps={content.steps.map(processStep)}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum fluxo definido</p>
            )}
          </Section>
        )
        
      case 'installation':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle="Como instalar e configurar o projeto"
            variant="alt"
          >
            {content.requirements && (
              <div className="mb-8">
                <h4 className="font-bold text-lg mb-4">Requisitos</h4>
                <div className="flex flex-wrap gap-3">
                  {content.requirements.map((req: any, i: number) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-sm ${req.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {req.name} {req.version && `v${req.version}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {content.steps && (
              <div className="space-y-6">
                {content.steps.map((step: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm">
                    <h4 className="font-bold text-lg mb-2">{i + 1}. {step.title}</h4>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    {step.commands && (
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                        {step.commands.map((cmd: string, j: number) => (
                          <div key={j}>$ {cmd}</div>
                        ))}
                      </div>
                    )}
                    {step.notes && (
                      <p className="mt-3 text-sm text-gray-500 italic">{step.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )
        
      case 'faq':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle="Perguntas frequentes"
          >
            <FAQSection
              items={content.questions?.map((q: any) => ({
                question: q.question,
                answer: q.answer
              })) || []}
            />
          </Section>
        )
        
      case 'api':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.description || 'Documentação da API'}
            variant="alt"
          >
            <EndpointsSection
              endpoints={content.endpoints?.map((ep: any) => ({
                method: ep.method || 'GET',
                path: ep.path || ep.endpoint,
                summary: ep.summary || ep.description || '',
                description: ep.description,
                parameters: ep.parameters,
                requestBody: ep.requestBody,
                responses: ep.responses,
                tags: ep.tags
              })) || []}
            />
          </Section>
        )
        
      case 'comparison':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.title || 'Comparativo'}
            variant="alt"
          >
            {content.headers && content.rows && (
              <ComparisonTable
                headers={content.headers}
                rows={content.rows}
              />
            )}
          </Section>
        )
      
      case 'changelog':
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle={content.description || 'Histórico de versões e releases'}
          >
            {/* Current Version Badge */}
            {content.currentVersion && (
              <div className="flex justify-center mb-8">
                <span className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold text-lg shadow-lg">
                  Versão Atual: {content.currentVersion}
                </span>
              </div>
            )}
            
            {/* Roadmap Timeline */}
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline Line - mais fina e sutil */}
              <div className="absolute left-[7px] top-4 bottom-[15rem] w-px bg-slate-600" />
              
              {/* Releases */}
              <div className="space-y-6">
                {(content.releases || []).map((release: any, releaseIndex: number) => (
                  <div key={releaseIndex} className="relative flex gap-4 pl-6">
                    {/* Timeline Node */}
                    <div className="absolute left-0 top-2">
                      <div className={`w-4 h-4 rounded-full ${
                        releaseIndex === 0 
                          ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                          : 'bg-slate-500'
                      }`} />
                    </div>
                    
                    {/* Release Card */}
                    <div className={`flex-1 rounded-xl p-5 ${
                      releaseIndex === 0 
                        ? 'bg-slate-800 border-2 border-emerald-500/50' 
                        : 'bg-slate-800/60 border border-slate-700'
                    }`}>
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded font-mono text-sm font-bold ${
                          releaseIndex === 0 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-700 text-slate-200'
                        }`}>
                          v{release.version}
                        </span>
                        <span className="text-sm text-slate-400">
                          {release.date ? new Date(release.date).toLocaleDateString('pt-BR', { 
                            day: '2-digit',
                            month: 'short', 
                            year: 'numeric' 
                          }) : ''}
                        </span>
                        {release.title && (
                          <span className="text-slate-200 font-medium">{release.title}</span>
                        )}
                      </div>
                      
                      {release.description && (
                        <p className="text-slate-400 text-sm mb-4">{release.description}</p>
                      )}
                      
                      {/* Categories - layout mais compacto */}
                      <div className="space-y-3">
                        {/* Features */}
                        {release.categories?.features?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-emerald-400 mb-1.5 flex items-center gap-2">
                              ✨ Novidades
                            </h5>
                            <ul className="space-y-1 pl-1">
                              {release.categories.features.map((feature: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-emerald-500 mt-0.5">›</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Fixes */}
                        {release.categories?.fixes?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-amber-400 mb-1.5 flex items-center gap-2">
                              🐛 Correções
                            </h5>
                            <ul className="space-y-1 pl-1">
                              {release.categories.fixes.map((fix: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-amber-500 mt-0.5">›</span>
                                  {fix}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Improvements */}
                        {release.categories?.improvements?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-sky-400 mb-1.5 flex items-center gap-2">
                              🔧 Melhorias
                            </h5>
                            <ul className="space-y-1 pl-1">
                              {release.categories.improvements.map((improvement: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-sky-500 mt-0.5">›</span>
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Breaking Changes */}
                        {release.categories?.breaking?.length > 0 && (
                          <div className="bg-red-950/30 p-3 rounded-lg border border-red-500/30">
                            <h5 className="text-sm font-semibold text-red-400 mb-1.5 flex items-center gap-2">
                              ⚠️ Breaking Changes
                            </h5>
                            <ul className="space-y-1 pl-1">
                              {release.categories.breaking.map((breaking: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">›</span>
                                  {breaking}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Upcoming/Roadmap */}
              {content.upcoming && (content.upcoming.planned?.length > 0 || content.upcoming.inProgress?.length > 0) && (
                <div className="mt-8 pt-6 border-t border-slate-600">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    🚀 Próximas Atualizações
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {content.upcoming.inProgress?.length > 0 && (
                      <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-4">
                        <h5 className="font-semibold text-amber-700 mb-3 text-sm">🔨 Em Desenvolvimento</h5>
                        <ul className="space-y-2">
                          {content.upcoming.inProgress.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {content.upcoming.planned?.length > 0 && (
                      <div className="bg-indigo-100 border-2 border-indigo-400 rounded-lg p-4">
                        <h5 className="font-semibold text-indigo-700 mb-3 text-sm">📋 Planejado</h5>
                        <ul className="space-y-2">
                          {content.upcoming.planned.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                              <span className="text-indigo-500">○</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )
        
      default:
        return (
          <Section
            key={section.id}
            id={section.id}
            number={index}
            title={section.title}
            subtitle=""
          >
            <HighlightBox variant="info" title={section.title}>
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : content.content ? (
                <div dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br/>') }} />
              ) : (
                <pre className="text-sm overflow-auto">{JSON.stringify(content, null, 2)}</pre>
              )}
            </HighlightBox>
          </Section>
        )
    }
  }
  
  return (
    <div className="min-h-screen">
      {/* Preview Toolbar */}
      <div className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to={`/projects/${id}/edit`} className="flex items-center gap-2 hover:text-gray-300">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Editor
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {sections.length} seções
            </span>
            <button 
              onClick={exportHTML}
              className="btn btn-secondary text-sm py-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
              Exportar HTML
            </button>
            <button 
              onClick={exportPDF}
              className="btn btn-secondary text-sm py-2 bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
      
      {/* Document Preview */}
      <div id="doc-content" className="bg-white">
        {/* Hero */}
        <Hero
          title={heroSection?.content?.title || project?.name || 'Documentação do Projeto'}
          subtitle={heroSection?.content?.subtitle || project?.description || 'Documentação técnica gerada automaticamente'}
          projectName={project?.name}
          logos={{
            primary: { 
              src: 'https://static.wixstatic.com/media/e1e702_e37602ece92f43a7843291dc8f51b19e~mv2.png/v1/fill/w_313,h_147,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logo_Move_Mais_preto.png',
              alt: 'MoveMais'
            }
          }}
          meta={{
            date: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            type: 'Documentação Técnica',
          }}
          badges={heroSection?.content?.badges}
          highlights={heroSection?.content?.highlights}
        />
        
        {/* Navigation - only show if there are sections */}
        {navItems.length > 0 && <NavBar items={navItems} />}
        
        {/* Sections */}
        {sections.length === 0 ? (
          <div className="py-20 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">Nenhuma seção gerada</h2>
            <p className="text-gray-500">
              Volte ao editor e clique em "Gerar Automaticamente com IA" para criar a documentação.
            </p>
          </div>
        ) : (
          sections
            .filter(s => s.type !== 'hero')
            .map((section, index) => renderSectionContent(section, index + 1))
        )}
        
        {/* Footer */}
        <Footer
          date={`Gerado em ${new Date().toLocaleDateString('pt-BR')}`}
          copyright="© 2026 MoveMais. Documentação gerada pelo DocuMentor."
        />
      </div>
      
      {/* AI Chat for editing in Preview - with real-time editing capabilities */}
      <AIChat 
        projectId={id!} 
        projectName={project?.name || 'Projeto'} 
        enableEditing={true}
        onSectionsUpdated={() => {
          // Refetch project data when AI makes changes
          queryClient.invalidateQueries({ queryKey: ['project', id] })
        }}
      />
    </div>
  )
}
