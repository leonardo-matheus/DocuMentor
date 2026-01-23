# DocuMentor 📚

> Sistema inteligente de geração de documentação técnica com IA.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Visão Geral

O **DocuMentor** é uma plataforma completa que automatiza a criação de documentação técnica de alta qualidade. Utilizando IA avançada (Claude via Azure AI Foundry ou API direta), o sistema analisa código fonte e gera documentação visual profissional.

### ✨ Principais Funcionalidades

- 🔗 **Integração com Git** - Suporta GitHub, GitLab, Gitea e outros
- 🤖 **IA Generativa** - Claude analisa código e gera documentação
- 🎨 **Templates Visuais** - Documentação profissional e customizável
- 💬 **Chat com IA** - Edição em tempo real via conversação
- 📄 **Export HTML** - Páginas standalone prontas para uso
- 💾 **Versionamento** - Armazenamento e histórico de todas as versões

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DocuMentor                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐    │
│  │    Frontend    │◄──►│    Backend     │◄──►│   MCP Server   │    │
│  │  React + Vite  │    │Express + Prisma│    │     Gitea      │    │
│  │  TailwindCSS   │    │    SQLite      │    │                │    │
│  └────────────────┘    └────────────────┘    └────────────────┘    │
│         │                     │                      │              │
│         │                     ▼                      ▼              │
│         │              ┌────────────────┐    ┌────────────────┐    │
│         │              │   Claude AI    │    │     Gitea      │    │
│         └─────────────►│ Azure Foundry  │    │  Repositories  │    │
│                        │  Opus 4.5      │    │                │    │
│                        └────────────────┘    └────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
DocuMentor/
├── packages/
│   ├── frontend/              # React 18 + Vite + TailwindCSS
│   │   ├── src/
│   │   │   ├── components/    # Componentes reutilizáveis
│   │   │   │   └── documentation/  # Componentes de documentação
│   │   │   ├── pages/         # Páginas da aplicação
│   │   │   ├── services/      # API clients (Axios)
│   │   │   ├── types/         # TypeScript types
│   │   │   └── styles/        # CSS global + Tailwind
│   │   └── ...
│   │
│   ├── backend/               # Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── routes/        # Rotas da API REST
│   │   │   ├── services/      # Lógica de negócio
│   │   │   ├── integrations/  # Claude AI, Gitea
│   │   │   └── index.ts       # Entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Schema do banco
│   │   └── ...
│   │
│   └── mcp-server/            # MCP Server para Gitea
│       └── src/
│           └── index.ts       # Tools e Resources MCP
│
├── modelo-exemplo/            # Exemplo de documentação gerada
│   ├── apresentacao-multipark-movemais.html
│   ├── css/styles.css
│   └── js/scripts.js
│
├── .env.example               # Template de variáveis de ambiente
├── package.json               # Monorepo config
└── README.md                  # Este arquivo
```

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- Acesso a um servidor Git (GitHub, GitLab, Gitea)
- Credenciais **Azure AI Foundry** ou **Anthropic API** (Claude)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/leonardo-matheus/DocuMentor.git
cd DocuMentor

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example packages/backend/.env
# Edite packages/backend/.env com suas credenciais

# 4. Inicializar banco de dados
cd packages/backend
npx prisma generate
npx prisma db push
cd ../..

# 5. Iniciar em modo desenvolvimento
npm run dev
```

### 🌐 Acessar a Aplicação

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Health Check | http://localhost:3001/health |

## ⚙️ Configuração

### Variáveis de Ambiente

Crie o arquivo `packages/backend/.env` baseado no `.env.example`:

```env
# Git (Repositório de código) - Configure conforme seu provedor
GITEA_URL=https://github.com
GITEA_TOKEN=seu_token_aqui

# Claude AI (Azure AI Foundry)
AZURE_AI_ENDPOINT=https://sua-conta.services.ai.azure.com/anthropic/v1/messages
AZURE_AI_API_KEY=sua_chave_api_aqui
AZURE_AI_MODEL=claude-opus-4-5
AZURE_AI_MAX_TOKENS=16384

# Database
DATABASE_URL=file:./prisma/documentor.db

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Como obter o Token

**GitHub:**
1. Acesse https://github.com/settings/tokens
2. Clique em **Generate new token (classic)**
3. Selecione permissões: `repo`, `read:org`
4. Copie o token para a variável `GITEA_TOKEN`

**Gitea/GitLab:**
1. Acesse Settings → Applications → Access Tokens
2. Crie um token com permissões de leitura
3. Copie o token para a variável `GITEA_TOKEN`

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento (frontend + backend em paralelo)
npm run dev

# Apenas Frontend (porta 5173)
npm run dev:frontend

# Apenas Backend (porta 3001)
npm run dev:backend

# Build para produção
npm run build

# Iniciar MCP Server
npm run mcp:start
```

## 🎨 Seções de Documentação

O sistema gera documentação modular com os seguintes tipos de seção:

| Tipo | Descrição | Tokens |
|------|-----------|--------|
| `hero` | Banner de abertura com logos | 8K |
| `overview` | Visão geral do projeto | 16K |
| `technologies` | Stack tecnológica | 16K |
| `architecture` | Arquitetura e diagramas | 24K |
| `integrations` | Integrações externas | 24K |
| `endpoints` | Documentação de APIs | 32K |
| `dataModels` | Modelos de dados | 24K |
| `flows` | Diagramas de sequência | 24K |
| `faq` | Perguntas frequentes | 16K |
| `glossary` | Glossário de termos | 16K |

## 💬 Chat com IA

O DocuMentor possui um chat integrado com Claude que permite:

- ✏️ **Editar seções** - Peça para a IA modificar conteúdo
- ❓ **Tirar dúvidas** - Pergunte sobre a documentação
- 🔄 **Regenerar** - Peça para refazer uma seção
- 📝 **Adicionar** - Solicite novos conteúdos

**Exemplo de comandos:**
```
"Melhore a descrição da seção Overview"
"Adicione mais 3 perguntas no FAQ sobre segurança"
"Corrija o diagrama de arquitetura"
```

## 🔧 API Endpoints

### Projetos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/projects` | Listar projetos |
| GET | `/api/projects/:id` | Obter projeto |
| POST | `/api/projects` | Criar projeto |
| PUT | `/api/projects/:id` | Atualizar projeto |
| DELETE | `/api/projects/:id` | Remover projeto |
| POST | `/api/projects/:id/generate` | Gerar documentação |
| GET | `/api/projects/:id/sections` | Listar seções |
| PUT | `/api/projects/:id/sections/:sectionId` | Atualizar seção |
| GET | `/api/projects/:id/export/html` | Exportar HTML |

### IA

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/ai/status` | Status da conexão IA |
| POST | `/api/ai/chat` | Chat simples |
| POST | `/api/ai/chat-edit` | Chat com edição |
| POST | `/api/ai/generate-section` | Gerar seção específica |

### Repositórios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/repositories/analyze` | Analisar repositório |
| GET | `/api/repositories/files` | Listar arquivos |

## 🧪 Desenvolvimento

### Estrutura do Frontend

```
src/
├── components/
│   ├── AIChat.tsx          # Chat com IA
│   ├── Layout.tsx          # Layout principal
│   ├── Navbar.tsx          # Navegação
│   └── documentation/      # Componentes de doc
│       ├── Hero.tsx
│       ├── Section.tsx
│       ├── FAQSection.tsx
│       ├── FlowDiagram.tsx
│       └── ...
├── pages/
│   ├── HomePage.tsx        # Página inicial
│   ├── ProjectsPage.tsx    # Lista de projetos
│   ├── NewProjectPage.tsx  # Criar projeto
│   ├── EditorPage.tsx      # Editor de seções
│   └── PreviewPage.tsx     # Preview + Chat
└── services/
    └── api.ts              # Cliente API
```

### Estrutura do Backend

```
src/
├── routes/
│   ├── projects.ts         # CRUD de projetos
│   ├── ai.ts              # Endpoints de IA
│   ├── repositories.ts    # Análise de repos
│   └── templates.ts       # Templates
├── services/
│   ├── project.service.ts # Lógica de projetos
│   └── gitea.service.ts   # Cliente Gitea
├── integrations/
│   ├── claude.ts          # Claude AI
│   └── gitea.ts          # Gitea API
└── index.ts               # Entry point
```

## 📝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Faça suas alterações
3. Commit: `git commit -m 'feat: descrição da feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

### Convenção de Commits

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

## 🔐 Segurança

⚠️ **IMPORTANTE**: Nunca commite arquivos `.env` com credenciais reais!

- Use `.env.example` como template
- Adicione credenciais apenas no `.env` local
- O `.gitignore` já protege arquivos `.env`

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/leonardo-matheus">Leonardo Matheus</a>
</p>
