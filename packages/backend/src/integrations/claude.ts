import axios from 'axios';

// Azure AI Foundry configuration for Claude Opus 4.5
const ENDPOINT = process.env.AZURE_AI_ENDPOINT || 'https://conta-ma6t6uyn-eastus2.services.ai.azure.com/anthropic/v1/messages';
const API_KEY = process.env.AZURE_AI_API_KEY || '';
const MODEL = process.env.AZURE_AI_MODEL || 'claude-opus-4-5';
const MAX_TOKENS = parseInt(process.env.AZURE_AI_MAX_TOKENS || '16384'); // 16K tokens default - limit is 2M/min
const TEMPERATURE = parseFloat(process.env.AZURE_AI_TEMPERATURE || '0.2');

// Section-specific token limits (more complex sections need more tokens)
const SECTION_TOKEN_LIMITS: Record<string, number> = {
  hero: 8192,
  overview: 16384,
  about: 24576,             // 24K - comprehensive about section for non-technical audience
  technologies: 16384,
  architecture: 24576,      // 24K - complex diagrams and explanations
  integrations: 24576,      // 24K - multiple integrations to document
  endpoints: 32768,         // 32K - can have many endpoints
  dataModels: 24576,        // 24K - database schemas
  flows: 24576,             // 24K - sequence diagrams
  faq: 16384,               // 16K - many Q&A pairs
  glossary: 16384,          // 16K - many terms
};

// HTTP client for Azure AI Foundry
async function callClaude(
  systemPrompt: string, 
  userMessage: string, 
  maxTokens: number = MAX_TOKENS
): Promise<string> {
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        model: MODEL,
        max_tokens: maxTokens,
        temperature: TEMPERATURE,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extract text from response
    const content = response.data.content;
    if (Array.isArray(content) && content.length > 0) {
      return content[0].text || '';
    }
    return '';
  } catch (error: any) {
    console.error('Claude API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

// Section type prompts - ENHANCED with more context
const SECTION_PROMPTS: Record<string, { system: string; userTemplate: string }> = {
  hero: {
    system: `Você é um especialista em documentação técnica com vasta experiência em projetos de software.
Crie conteúdo IMPACTANTE e ESPECÍFICO para a seção hero de uma documentação.

IMPORTANTE:
- Use informações REAIS do projeto (não genéricas)
- Baseie o título e subtítulo no que o projeto REALMENTE faz
- Use o README como fonte principal de contexto
- Os badges devem refletir as tecnologias REAIS identificadas

O hero deve conter:
- Um título impactante e ESPECÍFICO para este projeto (máximo 6 palavras)
- Um subtítulo explicativo que capture a essência do projeto (1-2 frases)
- 2-3 bullets principais com funcionalidades REAIS do sistema
- Uma lista de badges com as tecnologias REAIS usadas

Responda APENAS em formato JSON válido:
{
  "title": "string",
  "subtitle": "string",
  "highlights": ["string"],
  "badges": [{ "icon": "string", "label": "string" }]
}`,
    userTemplate: `Crie o conteúdo hero baseado nestas informações REAIS do repositório:

📦 Nome do Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo de Projeto: {{projectType}}
🚀 Frameworks Detectados: {{frameworks}}
💻 Linguagens: {{languages}}

📖 README (LEIA COM ATENÇÃO):
{{readme}}

IMPORTANTE: Use as informações REAIS acima. Não invente funcionalidades.`
  },

  overview: {
    system: `Você é um especialista em documentação técnica. Crie uma visão geral DETALHADA e PRECISA do sistema.

IMPORTANTE:
- Analise o README e código fonte para entender o que o projeto FAZ
- Identifique os objetivos REAIS do sistema
- Descreva funcionalidades que EXISTEM no código
- Não invente recursos que não estão documentados

A visão geral deve conter:
- Uma descrição clara e ESPECÍFICA do que o sistema faz
- Os principais objetivos baseados no README
- O público-alvo provável
- Os benefícios principais com ícones apropriados

Responda APENAS em formato JSON válido:
{
  "description": "string (descrição detalhada de 2-3 parágrafos)",
  "objectives": ["string (objetivos específicos do projeto)"],
  "targetAudience": "string",
  "benefits": [{ "title": "string", "description": "string", "icon": "string (emoji ou nome de ícone)" }]
}`,
    userTemplate: `Crie a visão geral baseada nestas informações REAIS:

📦 Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo: {{projectType}}
🚀 Frameworks: {{frameworks}}

📖 README:
{{readme}}

📁 Estrutura do Projeto:
{{structure}}

💻 Código Principal Analisado:
{{sourceCode}}`
  },

  architecture: {
    system: `Você é um arquiteto de software sênior. Analise PROFUNDAMENTE a estrutura do projeto e documente a arquitetura.

IMPORTANTE:
- Baseie sua análise na estrutura REAL de pastas e arquivos
- Identifique padrões de design a partir do código fonte
- Analise as rotas de API identificadas
- Use os frameworks detectados para inferir padrões

A documentação deve conter:
- Uma descrição da arquitetura geral baseada na estrutura real
- Os componentes principais identificados no código
- As camadas do sistema (ex: controllers, services, repositories)
- Os padrões de design identificados
- Um diagrama conceitual

Responda APENAS em formato JSON válido:
{
  "description": "string (descrição detalhada da arquitetura)",
  "pattern": "string (MVC, Clean Architecture, Hexagonal, Monolito, Microservices, etc.)",
  "layers": [{ "name": "string", "description": "string", "components": ["string"] }],
  "designPatterns": ["string"],
  "diagram": { 
    "type": "layered",
    "nodes": [{ "id": "string", "label": "string", "layer": "string" }],
    "connections": [{ "from": "string", "to": "string", "label": "string" }]
  }
}`,
    userTemplate: `Analise a arquitetura baseado nestas informações REAIS:

🏗️ Tipo de Projeto: {{projectType}}
🚀 Frameworks Detectados: {{frameworks}}

📁 Estrutura de Pastas:
{{structure}}

📂 Arquivos Principais:
{{mainFiles}}

🔌 Rotas de API Identificadas:
{{apiRoutes}}

📦 Dependências:
{{dependencies}}

💻 Código Fonte Principal:
{{sourceCode}}`
  },

  technologies: {
    system: `Você é um especialista em tecnologias de desenvolvimento. Crie uma seção de tecnologias REALMENTE utilizadas.

IMPORTANTE:
- Liste APENAS tecnologias que aparecem nas dependências ou código
- Use as versões REAIS quando disponíveis
- Organize por categoria (Frontend, Backend, Database, DevOps, etc.)
- Use URLs de ícones do DevIcons CDN

URLs de ícones conhecidas (use a versão correta):
- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/{tech}/{tech}-original.svg
- Exemplos: react/react-original.svg, typescript/typescript-original.svg, nodejs/nodejs-original.svg

Responda APENAS em formato JSON válido:
{
  "categories": [{
    "name": "string (Frontend/Backend/Database/DevOps/Testes/Outros)",
    "technologies": [{
      "name": "string",
      "version": "string (se disponível)",
      "description": "string (breve descrição do uso no projeto)",
      "icon": "URL completa do ícone"
    }]
  }]
}`,
    userTemplate: `Liste as tecnologias baseado nestas informações REAIS:

🚀 Frameworks Detectados: {{frameworks}}
💻 Linguagens: {{languages}}

� VERSÕES DETECTADAS AUTOMATICAMENTE (use estas versões!):
Linguagens: {{languageVersions}}
Frameworks: {{frameworkVersions}}

�📦 Dependências REAIS:
{{dependencies}}

📂 Arquivos de Configuração:
{{configFiles}}

🐳 Docker (se houver):
{{dockerInfo}}`
  },

  flow: {
    system: `Você é um analista de sistemas especialista em documentação de fluxos. Sua tarefa é identificar e documentar MÚLTIPLOS FLUXOS SEPARADOS do sistema.

IMPORTANTE - MÚLTIPLOS FLUXOS:
- Analise o sistema e identifique os DIFERENTES FLUXOS/PROCESSOS principais
- Cada fluxo deve ser um diagrama INDEPENDENTE e FOCADO
- Exemplos de fluxos separados:
  * Fluxo de Entrada (veículos, usuários, dados)
  * Fluxo de Saída
  * Fluxo de Cancelamento
  * Fluxo de Pagamento
  * Fluxo de Autenticação
  * Fluxo de Erro/Recuperação
  * Fluxo de Sincronização
  * Fluxo de Notificação

REGRA PRINCIPAL: 
- NÃO coloque tudo em um único fluxo gigante
- Crie entre 2 e 5 fluxos separados, cada um focado em um processo específico
- Cada fluxo deve ter no MÁXIMO 8-10 passos para ser legível

VARIANTES DE PASSOS DISPONÍVEIS:
- "start": Início do fluxo (verde esmeralda)
- "process": Processamento normal (azul)
- "decision": Decisão/Verificação (amarelo/laranja)
- "database": Operação de banco de dados (roxo)
- "success": Sucesso/Conclusão positiva (verde)
- "error": Erro/Falha (VERMELHO - use para erros 4xx, 5xx, exceptions)
- "end": Fim do fluxo (rosa)
- "camera": Captura de imagem/OCR (rosa)
- "vehicle": Relacionado a veículos (verde)
- "system": Sistema externo (azul)

Responda APENAS em formato JSON válido:
{
  "flows": [
    {
      "id": "flow-entrada",
      "title": "Fluxo de Entrada",
      "description": "Descrição do que este fluxo representa",
      "icon": "🚗",
      "steps": [{
        "id": "step-1",
        "title": "string",
        "description": "string (descrição detalhada)",
        "icon": "emoji representativo",
        "variant": "start|process|decision|database|success|error|end"
      }],
      "connections": [{ "from": "step-1", "to": "step-2", "label": "string (opcional)" }]
    },
    {
      "id": "flow-saida",
      "title": "Fluxo de Saída",
      "description": "...",
      "icon": "🚙",
      "steps": [...],
      "connections": [...]
    }
  ]
}`,
    userTemplate: `Analise o sistema e crie MÚLTIPLOS FLUXOS SEPARADOS, cada um focado em um processo específico.

NÃO crie um único fluxo gigante! Separe em fluxos menores e focados.

📖 README:
{{readme}}

🔌 Rotas de API Identificadas:
{{apiRoutes}}

🏗️ Tipo de Projeto: {{projectType}}
🚀 Frameworks: {{frameworks}}

📁 Estrutura:
{{structure}}

💻 Código Fonte:
{{sourceCode}}

LEMBRE-SE: Crie entre 2 e 5 fluxos separados, cada um com no máximo 8-10 passos.`
  },

  faq: {
    system: `Você é um especialista em suporte técnico e documentação. Sua tarefa é criar uma seção de FAQ COMPLETA, ÚTIL e ESPECÍFICA para desenvolvedores.

REGRAS OBRIGATÓRIAS:
1. TODAS as perguntas DEVEM ter respostas DETALHADAS (mínimo 2-3 frases cada)
2. Use o NOME REAL do projeto em todas as perguntas e respostas
3. Baseie as respostas nas informações REAIS fornecidas (README, comandos, etc.)
4. NUNCA deixe uma resposta vazia ou genérica
5. Inclua comandos de terminal quando relevante
6. Crie pelo menos 8 perguntas cobrindo diferentes aspectos

CATEGORIAS OBRIGATÓRIAS (pelo menos 1 pergunta de cada):
- Instalação: Como instalar e configurar o projeto
- Uso: Como usar as funcionalidades principais
- Desenvolvimento: Como contribuir, rodar testes, estrutura do código
- Deploy: Como fazer deploy, requisitos de produção
- Troubleshooting: Problemas comuns e soluções

FORMATO DE RESPOSTA - JSON válido:
{
  "questions": [
    {
      "question": "Como instalar o {{projectName}} no meu ambiente local?",
      "answer": "Para instalar o {{projectName}}, siga estes passos: 1) Clone o repositório... 2) Execute npm install... 3) Configure as variáveis de ambiente... [resposta detalhada com pelo menos 3 passos]",
      "category": "Instalação"
    }
  ]
}

IMPORTANTE: Cada "answer" deve ser uma resposta COMPLETA e ÚTIL, não apenas uma frase curta!`,
    userTemplate: `Crie um FAQ COMPLETO e DETALHADO para o projeto. TODAS as respostas devem ser úteis e específicas.

📦 Nome do Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo de Projeto: {{projectType}}
🚀 Tecnologias/Frameworks: {{frameworks}}
💻 Linguagens: {{languages}}

📖 README COMPLETO (use como fonte principal):
{{readme}}

🔧 Variáveis de Ambiente Necessárias:
{{envVars}}

📦 Comandos de Build/Run:
{{buildCommands}}

📁 Estrutura do Projeto:
{{structure}}

⚙️ Informações de CI/CD:
{{cicdInfo}}

🧪 Informações de Testes:
- Comando de teste: npm test (ou yarn test)
- Framework de teste: Jest (se aplicável)

---

GERE EXATAMENTE 8-10 PERGUNTAS com respostas DETALHADAS.
Use o nome "{{projectName}}" em TODAS as perguntas.
NUNCA deixe uma resposta vazia!

Exemplo de resposta CORRETA:
"question": "Como executar os testes do {{projectName}}?",
"answer": "Para executar os testes do {{projectName}}, abra o terminal na raiz do projeto e execute 'npm test' ou 'yarn test'. Os testes utilizam o Jest como framework e você pode ver a cobertura executando 'npm run test:coverage'. Para rodar testes específicos, use 'npm test -- --testPathPattern=nome-do-arquivo'."

Exemplo de resposta INCORRETA (NÃO FAÇA ISSO):
"question": "Como executar os testes?",
"answer": "" <- NUNCA deixe vazio!`
  },

  integrations: {
    system: `Você é um especialista em integrações. Documente as integrações REAIS do sistema.

IMPORTANTE:
- Identifique integrações a partir das dependências e código
- Procure por SDKs, APIs e serviços externos
- Analise variáveis de ambiente para identificar serviços

Responda APENAS em formato JSON válido:
{
  "integrations": [{
    "name": "string",
    "type": "api|service|webhook|database|auth|payment|messaging",
    "description": "string (como é usado no projeto)",
    "icon": "string (emoji ou URL)",
    "config": { "envVars": ["string (variáveis necessárias)"] }
  }]
}`,
    userTemplate: `Identifique integrações REAIS em:

📦 Dependências:
{{dependencies}}

🔧 Variáveis de Ambiente:
{{envVars}}

💻 Código Fonte:
{{sourceCode}}

🐳 Docker/Serviços:
{{dockerInfo}}`
  },

  comparison: {
    system: `Você é um analista de mercado. Crie uma tabela comparativa RELEVANTE.

IMPORTANTE:
- Se o projeto tem planos/versões, compare-os
- Se é uma lib/framework, compare com alternativas
- Se é um produto, compare funcionalidades

Responda APENAS em formato JSON válido:
{
  "title": "string",
  "headers": ["string"],
  "rows": [{
    "feature": "string",
    "values": ["string|boolean"]
  }]
}`,
    userTemplate: `Crie comparativo baseado em:

📦 Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo: {{projectType}}
🚀 Frameworks: {{frameworks}}

📖 README:
{{readme}}`
  },

  installation: {
    system: `Você é um especialista em DevOps. Crie um guia de instalação COMPLETO e PRECISO.

IMPORTANTE:
- Baseie os passos no README e arquivos de configuração
- Use os comandos REAIS do projeto (npm, pip, etc.)
- Liste requisitos baseados nas dependências
- Inclua variáveis de ambiente necessárias

Responda APENAS em formato JSON válido:
{
  "requirements": [{
    "name": "string",
    "version": "string (se conhecido)",
    "required": true|false
  }],
  "steps": [{
    "title": "string",
    "description": "string",
    "commands": ["string (comandos exatos)"],
    "notes": "string (opcional)"
  }],
  "envVars": [{
    "name": "string",
    "description": "string",
    "required": true|false,
    "example": "string"
  }]
}`,
    userTemplate: `Crie guia de instalação baseado nestas informações REAIS:

📖 README:
{{readme}}

📦 Dependências:
{{dependencies}}

🔧 Variáveis de Ambiente:
{{envVars}}

📦 Comandos de Build:
{{buildCommands}}

📂 Arquivos de Configuração:
{{configFiles}}

📁 Estrutura:
{{structure}}

🐳 Docker:
{{dockerInfo}}`
  },

  api: {
    system: `Você é um especialista em documentação de APIs. Documente os endpoints REAIS.

IMPORTANTE:
- Use as rotas identificadas no código
- Infira parâmetros e respostas do código fonte
- Organize por recurso/entidade

Responda APENAS em formato JSON válido:
{
  "baseUrl": "string",
  "endpoints": [{
    "method": "GET|POST|PUT|DELETE|PATCH",
    "path": "string",
    "description": "string",
    "parameters": [{
      "name": "string",
      "type": "string|number|boolean|object",
      "in": "path|query|body",
      "required": true|false,
      "description": "string"
    }],
    "responses": [{
      "status": 200,
      "description": "string",
      "example": {}
    }]
  }]
}`,
    userTemplate: `Documente a API baseado nestas informações REAIS:

🔌 Rotas Identificadas:
{{apiRoutes}}

📁 Estrutura:
{{structure}}

📖 README:
{{readme}}

💻 Código das Rotas:
{{sourceCode}}`
  },

  changelog: {
    system: `Você é um especialista em Release Notes. Crie um changelog CLARO, OBJETIVO e PROFISSIONAL.

REGRAS IMPORTANTES:
1. Seja CONCISO - cada item deve ter no máximo 10-15 palavras
2. Use verbos no passado: "Adicionado", "Corrigido", "Melhorado", "Removido"
3. Foque no VALOR para o usuário, não em detalhes técnicos
4. Crie 3-5 releases mostrando evolução lógica do projeto
5. Datas devem ser realistas (últimos 6-12 meses)
6. Use versionamento semântico (major.minor.patch)

CATEGORIAS:
- features: Novas funcionalidades (começar com "Adicionado")
- fixes: Bugs corrigidos (começar com "Corrigido")
- improvements: Melhorias (começar com "Melhorado", "Otimizado")
- breaking: Mudanças incompatíveis (começar com "Removido", "Alterado")

EXEMPLOS DE BONS ITENS:
✅ "Adicionado suporte a autenticação OAuth 2.0"
✅ "Corrigido erro de validação em formulários"
✅ "Melhorado tempo de resposta da API em 40%"

EXEMPLOS RUINS (EVITAR):
❌ "Implementação do módulo de autenticação que permite aos usuários..." (muito longo)
❌ "Bug fix" (muito vago)
❌ "Refatoração" (não comunica valor)

Responda APENAS em formato JSON válido:
{
  "title": "Histórico de Versões",
  "description": "string (1 frase sobre o ciclo de releases)",
  "currentVersion": "string (ex: 1.2.0)",
  "releases": [{
    "version": "string (ex: 1.2.0)",
    "date": "string (formato: 2025-01-15)",
    "title": "string (nome curto da release, max 5 palavras)",
    "description": "string (1 frase resumindo a release)",
    "categories": {
      "features": ["string (max 15 palavras cada)"],
      "fixes": ["string (max 15 palavras cada)"],
      "improvements": ["string (max 15 palavras cada)"],
      "breaking": ["string (max 15 palavras cada, apenas se houver)"]
    }
  }],
  "upcoming": {
    "planned": ["string (funcionalidades futuras, max 10 palavras)"],
    "inProgress": ["string (em desenvolvimento, max 10 palavras)"]
  }
}`,
    userTemplate: `Crie o changelog/release notes para:

📦 Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo: {{projectType}}
🚀 Frameworks: {{frameworks}}

📖 README:
{{readme}}

📁 Estrutura:
{{structure}}

📦 Dependências:
{{dependencies}}

Crie um changelog profissional com 3-5 releases mostrando a evolução do projeto. Seja CONCISO e OBJETIVO.`
  },

  custom: {
    system: `Você é um especialista em documentação técnica. Crie conteúdo relevante e bem estruturado.

Analise PROFUNDAMENTE as informações fornecidas e crie documentação útil.

Responda APENAS em formato JSON válido:
{
  "title": "string",
  "content": "string (markdown formatado)",
  "subsections": [{
    "title": "string",
    "content": "string"
  }]
}`,
    userTemplate: `Crie conteúdo baseado em:

📦 Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo: {{projectType}}
🚀 Frameworks: {{frameworks}}

📖 README:
{{readme}}

📁 Estrutura:
{{structure}}

💻 Código:
{{sourceCode}}

Contexto adicional: {{context}}`
  },

  about: {
    system: `Você é um especialista em comunicação corporativa e documentação acessível.
Sua tarefa é criar uma seção "SOBRE O SISTEMA" que QUALQUER pessoa da empresa possa entender.

⚠️ REGRA MAIS IMPORTANTE - NÃO INVENTE NADA:
- SOMENTE use informações que estão EXPLICITAMENTE no README ou código
- Se o README diz que é um sistema de estacionamento, NÃO mencione RH, ponto eletrônico, etc.
- Se não há evidência de uma integração, NÃO a mencione
- Prefira deixar uma seção com menos itens do que inventar dados
- Analise o README com MUITO cuidado para entender o propósito REAL do sistema

PÚBLICO-ALVO REAL:
- Identifique o público-alvo REAL do sistema baseado no README
- NÃO liste departamentos genéricos (RH, Financeiro) se o sistema não os atende
- Se é um sistema de estacionamento, o público são operadores, clientes, gestores de estacionamento

REGRAS CRÍTICAS:
1. Use linguagem SIMPLES e CLARA - evite jargões técnicos
2. Baseie-se APENAS no que está documentado no README
3. Foque no VALOR e BENEFÍCIO real do sistema
4. Seja HONESTO - se não sabe, não invente
5. Use exemplos práticos relacionados ao domínio REAL do sistema

Responda APENAS em formato JSON válido:
{
  "subtitle": "string (frase de impacto baseada no propósito REAL)",
  "systemName": "string (nome do sistema)",
  "introduction": "string (explicação em 2-3 frases simples BASEADA NO README)",
  "targetAudience": [{
    "icon": "emoji representativo",
    "name": "string (público REAL que usa o sistema)",
    "description": "string (como este público usa - baseado no README)"
  }],
  "problemsSolved": [{
    "before": "string (problema REAL que o sistema resolve)",
    "after": "string (como o sistema resolve - baseado no README)"
  }],
  "keyBenefits": [{
    "icon": "emoji",
    "title": "string (benefício REAL em 3-4 palavras)",
    "description": "string (explicação do benefício baseada no README)"
  }],
  "howItWorks": [{
    "icon": "emoji ou número",
    "title": "string (etapa REAL do fluxo)",
    "description": "string (explicação baseada no código/README)",
    "example": "string (exemplo do domínio REAL do sistema)"
  }],
  "metrics": [{
    "value": "string (use 'N/A' se não houver dados reais)",
    "label": "string (métrica relevante ao domínio)",
    "description": "string (contexto opcional)"
  }],
  "glossary": [{
    "term": "string (termo técnico DO DOMÍNIO do sistema)",
    "definition": "string (explicação simples)"
  }],
  "integrations": [{
    "icon": "emoji",
    "name": "string (SOMENTE integrações mencionadas no README/código)",
    "description": "string (o que essa integração faz)"
  }],
  "simpleFaq": [{
    "question": "string (pergunta relevante ao domínio REAL)",
    "answer": "string (resposta baseada no README)"
  }]
}`,
    userTemplate: `Crie uma seção "SOBRE O SISTEMA" baseada APENAS nas informações fornecidas.

⚠️ ATENÇÃO: NÃO INVENTE DADOS! Use SOMENTE o que está no README e código.

📦 Nome do Sistema: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo de Projeto: {{projectType}}
🚀 Frameworks/Tecnologias: {{frameworks}}

📖 README (LEIA COM ATENÇÃO - esta é a fonte principal):
{{readme}}

📁 Estrutura do Projeto:
{{structure}}

📦 Dependências:
{{dependencies}}

🔧 Variáveis de Ambiente:
{{envVars}}

REGRAS OBRIGATÓRIAS:
1. Se o sistema é de ESTACIONAMENTO, fale SOMENTE sobre estacionamento
2. NÃO mencione RH, ponto eletrônico, financeiro SE não estiver no README
3. O público-alvo deve ser quem REALMENTE usa o sistema (operadores, clientes, etc.)
4. Integrações SOMENTE as que estão mencionadas no README ou nas dependências
5. Prefira menos itens corretos do que muitos itens inventados`
  }
};

export const claudeService = {
  /**
   * Generate content for a specific section type
   */
  async generateSection(
    sectionType: string,
    repositoryData: any,
    context?: any
  ): Promise<any> {
    const prompt = SECTION_PROMPTS[sectionType];
    
    if (!prompt) {
      throw new Error(`Unknown section type: ${sectionType}`);
    }
    
    // Build user message from template
    let userMessage = prompt.userTemplate;
    const data = { ...repositoryData, ...context };
    
    // Add additional repositories context if available
    if (repositoryData.isIntegratedDocumentation && repositoryData.additionalRepositories) {
      const additionalReposContext = repositoryData.additionalRepositories.map((repo: any) => {
        return `
📦 Sistema: ${repo.name}
${repo.customDescription ? `📝 Descrição: ${repo.customDescription}` : ''}
🏗️ Tipo: ${repo.projectType || 'N/A'}
🚀 Frameworks: ${repo.frameworks?.join(', ') || 'N/A'}
💻 Linguagens: ${repo.languages ? JSON.stringify(repo.languages) : 'N/A'}
📖 README: ${repo.readme || 'N/A'}
📁 Estrutura: ${repo.structure?.slice(0, 30)?.join(', ') || 'N/A'}
`;
      }).join('\n---\n');
      
      userMessage += `

🔗 REPOSITÓRIOS ADICIONAIS (Esta é uma documentação INTEGRADA de múltiplos sistemas):
${additionalReposContext}

IMPORTANTE: Esta documentação deve explicar como os ${repositoryData.totalSystems} sistemas interagem entre si.
- Identifique pontos de integração
- Descreva o fluxo de dados entre os sistemas
- Mencione APIs compartilhadas
- Explique como os sistemas se complementam
`;
    }
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'Não disponível');
      userMessage = userMessage.replace(new RegExp(placeholder, 'g'), valueStr);
    }
    
    // Use section-specific token limits (fallback to MAX_TOKENS)
    const tokensForSection = SECTION_TOKEN_LIMITS[sectionType] || MAX_TOKENS;
    
    const responseText = await callClaude(prompt.system, userMessage, tokensForSection);
    
    // Parse JSON from response
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonStr);
      
      // Validate FAQ has complete answers
      if (sectionType === 'faq' && parsed.questions) {
        parsed.questions = parsed.questions.map((q: any) => ({
          ...q,
          answer: q.answer && q.answer.trim().length > 0 
            ? q.answer 
            : `Para mais informações sobre "${q.question}", consulte a documentação oficial do projeto ou entre em contato com a equipe de desenvolvimento.`
        }));
      }
      
      // Validate flow has proper structure
      if (sectionType === 'flow') {
        // Ensure flows array exists and has proper structure
        if (!parsed.flows || !Array.isArray(parsed.flows) || parsed.flows.length === 0) {
          // Try to convert old format (steps) to new format (flows)
          if (parsed.steps && Array.isArray(parsed.steps)) {
            parsed.flows = [{
              id: 'flow-1',
              title: parsed.title || 'Fluxo Principal',
              description: parsed.description || '',
              icon: '🔄',
              steps: parsed.steps
            }];
          } else {
            // Create a default flow structure
            parsed.flows = [{
              id: 'flow-1',
              title: 'Fluxo Principal',
              description: 'Configure os passos do fluxo',
              icon: '🔄',
              steps: [
                { id: 'step-1', title: 'Início', description: 'Início do processo', variant: 'start', icon: '▶️' },
                { id: 'step-2', title: 'Processamento', description: 'Etapa de processamento', variant: 'process', icon: '⚙️' },
                { id: 'step-3', title: 'Fim', description: 'Conclusão do processo', variant: 'end', icon: '🏁' }
              ]
            }];
          }
        }
        
        // Ensure each flow has valid steps
        parsed.flows = parsed.flows.map((flow: any) => ({
          ...flow,
          id: flow.id || `flow-${Date.now()}`,
          title: flow.title || 'Fluxo',
          steps: (flow.steps || []).map((step: any, idx: number) => ({
            id: step.id || `step-${idx + 1}`,
            title: step.title || `Passo ${idx + 1}`,
            description: step.description || '',
            icon: step.icon || '📌',
            variant: step.variant || step.type || 'process'
          }))
        }));
      }
      
      return parsed;
    } catch (e) {
      // Return as-is if not valid JSON
      console.error(`Failed to parse JSON for section ${sectionType}:`, e);
      
      // For flow sections, return a default structure instead of raw text
      if (sectionType === 'flow') {
        return {
          flows: [{
            id: 'flow-1',
            title: 'Fluxo Principal',
            description: 'Erro ao processar fluxo - configure manualmente',
            icon: '🔄',
            steps: [
              { id: 'step-1', title: 'Início', description: 'Início do processo', variant: 'start', icon: '▶️' },
              { id: 'step-2', title: 'Processamento', description: 'Etapa de processamento', variant: 'process', icon: '⚙️' },
              { id: 'step-3', title: 'Fim', description: 'Conclusão do processo', variant: 'end', icon: '🏁' }
            ]
          }]
        };
      }
      
      return { content: responseText };
    }
  },

  /**
   * Generate full documentation for a repository
   */
  async generateFullDocumentation(
    repositoryUrl: string,
    projectName?: string
  ): Promise<{ sections: any[] }> {
    const sections = [];
    const sectionTypes = ['hero', 'overview', 'architecture', 'technologies', 'flow', 'faq'];
    
    for (const sectionType of sectionTypes) {
      try {
        const content = await this.generateSection(sectionType, {
          projectName: projectName || repositoryUrl.split('/').pop(),
          repositoryUrl
        });
        
        sections.push({
          type: sectionType,
          title: this.getSectionTitle(sectionType),
          content
        });
      } catch (error) {
        console.error(`Error generating ${sectionType} section:`, error);
      }
    }
    
    return { sections };
  },

  /**
   * Improve existing content with AI
   */
  async improveContent(content: string, instructions: string): Promise<string> {
    const systemPrompt = 'Você é um editor técnico especializado em melhorar documentação de software. Mantenha o formato e estrutura, mas melhore a clareza e qualidade do texto.';
    const userMessage = `Melhore o seguinte conteúdo seguindo estas instruções: ${instructions}\n\nConteúdo:\n${content}`;
    
    try {
      return await callClaude(systemPrompt, userMessage);
    } catch {
      return content;
    }
  },

  /**
   * Summarize code
   */
  async summarizeCode(code: string, language?: string, type?: string): Promise<string> {
    const systemPrompt = `Você é um especialista em análise de código. Crie um resumo conciso do código fornecido, explicando seu propósito e funcionamento principal.${language ? ` O código está em ${language}.` : ''}`;
    const userMessage = `${type ? `Tipo de arquivo: ${type}\n\n` : ''}Código:\n\`\`\`${language || ''}\n${code}\n\`\`\``;
    
    try {
      return await callClaude(systemPrompt, userMessage);
    } catch {
      return '';
    }
  },

  /**
   * Analyze project architecture
   */
  async analyzeArchitecture(structure: string[], files?: any[]): Promise<any> {
    const systemPrompt = `Você é um arquiteto de software. Analise a estrutura do projeto e identifique:
1. O padrão arquitetural (MVC, Clean Architecture, Hexagonal, etc.)
2. As camadas do sistema
3. Os componentes principais
4. Sugestões de melhorias

Responda em formato JSON.`;
    const userMessage = `Estrutura de pastas:\n${structure.join('\n')}${files ? `\n\nArquivos principais:\n${JSON.stringify(files, null, 2)}` : ''}`;
    
    try {
      const responseText = await callClaude(systemPrompt, userMessage);
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      return JSON.parse(jsonStr);
    } catch (e) {
      return { error: 'Failed to analyze architecture' };
    }
  },

  /**
   * Check AI service status
   */
  async checkStatus(): Promise<{ status: string; model: string; endpoint: string }> {
    try {
      // Simple test message
      await callClaude('You are a test assistant.', 'Say hello', 10);
      
      return {
        status: 'connected',
        model: MODEL,
        endpoint: ENDPOINT
      };
    } catch (error: any) {
      return {
        status: 'error: ' + (error.message || 'unknown'),
        model: MODEL,
        endpoint: process.env.AZURE_AI_ENDPOINT || 'default'
      };
    }
  },

  /**
   * Generate raw response from a prompt (no JSON parsing)
   */
  async generateRaw(prompt: string, maxTokens?: number): Promise<string> {
    const systemPrompt = 'Você é um assistente de IA especializado em análise de software e geração de documentação. Responda em formato JSON quando solicitado.';
    try {
      const response = await callClaude(systemPrompt, prompt, maxTokens || MAX_TOKENS);
      // Try to extract JSON from markdown code block if present
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      return jsonMatch ? jsonMatch[1] : response;
    } catch (error: any) {
      console.error('Error in generateRaw:', error.message);
      throw error;
    }
  },

  /**
   * Get section title from type
   */
  getSectionTitle(sectionType: string): string {
    const titles: Record<string, string> = {
      hero: 'Apresentação',
      overview: 'Visão Geral',
      architecture: 'Arquitetura',
      technologies: 'Tecnologias',
      flow: 'Fluxo do Sistema',
      faq: 'Perguntas Frequentes',
      integrations: 'Integrações',
      comparison: 'Comparativo'
    };
    return titles[sectionType] || sectionType;
  },

  /**
   * Chat with AI about documentation - WITH EDIT CAPABILITIES
   */
  async chatWithEdit(
    projectName: string, 
    sections: any[],
    message: string, 
    history: { role: string; content: string }[]
  ): Promise<{ response: string; action?: { type: 'edit' | 'add' | 'delete'; sectionType?: string; sectionId?: string; content?: any; title?: string } }> {
    const sectionsContext = sections.map((s: any, i: number) => 
      `[Seção ${i + 1}] ID: ${s.id}, Tipo: ${s.type}, Título: "${s.title}"\nConteúdo: ${JSON.stringify(s.content, null, 2)}`
    ).join('\n\n---\n\n');

    const systemPrompt = `Você é o assistente do DocuMentor com PODER DE EDIÇÃO. Você pode editar a documentação do projeto "${projectName}" em tempo real.

SEÇÕES ATUAIS DA DOCUMENTAÇÃO:
${sectionsContext || 'Nenhuma seção gerada ainda.'}

SUAS CAPACIDADES:
1. EDITAR seções existentes (alterar título, texto, adicionar/remover itens)
2. RESPONDER perguntas sobre a documentação
3. SUGERIR melhorias

REGRAS IMPORTANTES:
- Quando o usuário pedir para ALTERAR, EDITAR, MUDAR, ADICIONAR ou REMOVER algo de uma seção, você DEVE retornar uma ação de edição
- Use o ID exato da seção que precisa ser editada
- O conteúdo deve manter a mesma estrutura JSON original, apenas com as alterações solicitadas

FORMATO DE RESPOSTA - SEMPRE responda em JSON válido:
{
  "response": "Sua mensagem para o usuário explicando o que foi feito",
  "action": {
    "type": "edit",
    "sectionId": "id-da-secao",
    "sectionType": "tipo-da-secao",
    "title": "Novo título (opcional)",
    "content": { ...conteúdo atualizado completo... }
  }
}

Se NÃO houver edição (apenas conversa):
{
  "response": "Sua resposta para o usuário"
}

EXEMPLOS:
- "Mude o título da visão geral para X" → Editar seção overview com novo título
- "Adicione uma nova pergunta no FAQ sobre Y" → Editar seção faq adicionando pergunta
- "Remova a tecnologia Docker da lista" → Editar seção technologies removendo item
- "O que faz esse projeto?" → Apenas responder sem action

Responda SEMPRE em JSON válido. Seja conciso e útil.`;

    // Build messages array with history
    let fullMessage = message;
    if (history && history.length > 0) {
      const recentHistory = history.slice(-4);
      const historyText = recentHistory.map(h => 
        `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.content}`
      ).join('\n\n');
      fullMessage = `Histórico:\n${historyText}\n\nMensagem atual: ${message}`;
    }

    try {
      const responseText = await callClaude(systemPrompt, fullMessage, 4096);
      
      // Parse JSON response
      try {
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
        const parsed = JSON.parse(jsonStr);
        
        return {
          response: parsed.response || parsed.message || responseText,
          action: parsed.action
        };
      } catch {
        // If not valid JSON, return as plain response
        return { response: responseText };
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      throw error;
    }
  },

  /**
   * Chat with AI about documentation (legacy - no edit)
   */
  async chat(
    projectName: string, 
    sectionsContext: string, 
    message: string, 
    history: { role: string; content: string }[]
  ): Promise<string> {
    const systemPrompt = `Você é o assistente do DocuMentor, uma ferramenta de geração de documentação técnica.
Você está ajudando com a documentação do projeto "${projectName}".

Contexto das seções atuais da documentação:
${sectionsContext || 'Nenhuma seção gerada ainda.'}

Você pode:
- Responder perguntas sobre a documentação
- Sugerir alterações de conteúdo
- Ajudar a reformular textos
- Explicar seções
- Sugerir novas seções ou melhorias

Seja conciso, útil e profissional. Responda em português brasileiro.`;

    // Build messages array with history
    let fullMessage = message;
    if (history && history.length > 0) {
      const recentHistory = history.slice(-6); // Last 6 messages for context
      const historyText = recentHistory.map(h => 
        `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.content}`
      ).join('\n\n');
      fullMessage = `Histórico recente:\n${historyText}\n\nMensagem atual do usuário: ${message}`;
    }

    try {
      const response = await callClaude(systemPrompt, fullMessage, 1024);
      return response;
    } catch (error: any) {
      console.error('Chat error:', error);
      throw error;
    }
  }
};
