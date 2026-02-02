import axios from 'axios';

// Azure OpenAI configuration
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://conta-ma6t6uyn-eastus2.cognitiveservices.azure.com';
const API_KEY = process.env.AZURE_OPENAI_KEY || '';
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'o1';
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';
const MAX_TOKENS = parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '16384');
const TEMPERATURE = parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '1'); // o1 models work best with temperature 1

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
  troubleshooting: 24576,   // 24K - problems with multiple causes and solutions
  glossary: 16384,          // 16K - many terms
  changelog: 16384,         // 16K - release notes with multiple versions
};

// HTTP client for Azure OpenAI
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = MAX_TOKENS
): Promise<string> {
  const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  try {
    // Build messages array - o1 models don't support system messages in the same way
    // We'll include the system prompt as a developer message or prepend to user message
    const messages: { role: string; content: string }[] = [];

    // For o1 models, use developer role for system-like instructions (if supported)
    // Otherwise, prepend system prompt to user message
    if (DEPLOYMENT.startsWith('o1')) {
      // o1 models: combine system and user into a single user message
      messages.push({
        role: 'user',
        content: `${systemPrompt}\n\n---\n\n${userMessage}`
      });
    } else {
      // Standard models: use system message
      messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: userMessage });
    }

    const response = await axios.post(
      url,
      {
        messages,
        max_completion_tokens: maxTokens,
        temperature: TEMPERATURE
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY
        },
        timeout: 300000 // 5 minute timeout for reasoning models
      }
    );

    // Extract text from OpenAI response format
    const choices = response.data.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      return choices[0].message?.content || '';
    }
    return '';
  } catch (error: any) {
    console.error('Azure OpenAI API error:', error.response?.data || error.message);
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
    system: `Você é um analista de sistemas. ANALISE O CÓDIGO FONTE e crie fluxos baseados APENAS no que está no código.

🚫 PROIBIDO - NÃO GERE ESTES FLUXOS GENÉRICOS:
- "Fluxo de Entrada" / "Fluxo de Saída" (a menos que o código tenha métodos com esses nomes)
- "Fluxo de Autenticação" (a menos que exista código de auth)
- "Fluxo de Pagamento" (a menos que exista código de pagamento)
- "Captura de Placa", "Veículo", "Estacionamento" (a menos que o código seja sobre isso)
- Qualquer fluxo que NÃO esteja baseado em um método/função REAL do código

✅ OBRIGATÓRIO - BASEIE-SE NO CÓDIGO:
1. Leia o código fonte fornecido em {{sourceCode}}
2. Identifique os MÉTODOS/FUNÇÕES reais (ex: enviarTransPartner, intTransStatus)
3. Para cada método importante, crie UM fluxo
4. O TÍTULO do fluxo deve conter o NOME DO MÉTODO ou sua função real
5. Os PASSOS devem refletir a LÓGICA REAL do método

EXEMPLO - Se o código tem:
\`\`\`java
@PostMapping("/enviarTransPartner")
public ResponseEntity enviarTransPartner(@RequestParam Long partnerId) {
    List<IntegracaoParceiro> parceiros = scheduledJob.getParceiros(partnerId);
    if (parceiros == null || parceiros.size() > 1)
        return ResponseEntity.badRequest();
    intTransService.intTransStatusLock(...);
    return ResponseEntity.ok();
}
\`\`\`

ENTÃO o fluxo deve ser:
- Título: "Envio de Transação ao Parceiro (enviarTransPartner)"
- Passos baseados no código:
  1. Receber requisição com partnerId
  2. Buscar parceiros (getParceiros)
  3. Validar parceiros (if parceiros == null)
  4. Processar transação (intTransStatusLock)
  5. Retornar resposta

NÃO INVENTE! Se não encontrar código suficiente, retorne apenas 1-2 fluxos simples.

VARIANTES DE PASSOS DISPONÍVEIS:
- "start": Início do fluxo (verde esmeralda)
- "process": Processamento normal (azul)
- "decision": Decisão/Verificação (amarelo/laranja)
- "database": Operação de banco de dados (roxo)
- "success": Sucesso/Conclusão positiva (verde)
- "error": Erro/Falha (VERMELHO - use para erros 4xx, 5xx, exceptions)
- "end": Fim do fluxo (rosa)
- "api": Chamada de API externa (azul claro)
- "user": Ação do usuário (ciano)
- "system": Sistema/Serviço interno (azul)

Responda APENAS em formato JSON válido:
{
  "flows": [
    {
      "id": "flow-identificador-unico",
      "title": "Nome do Fluxo baseado no sistema real",
      "description": "Descrição do que este fluxo representa no contexto do sistema",
      "icon": "emoji relevante ao domínio",
      "steps": [{
        "id": "step-1",
        "title": "string (ação específica do sistema)",
        "description": "string (descrição detalhada da etapa)",
        "icon": "emoji representativo",
        "variant": "start|process|decision|database|success|error|end|api|user|system"
      }],
      "connections": [{ "from": "step-1", "to": "step-2", "label": "string (opcional)" }]
    }
  ]
}`,
    userTemplate: `🔍 ANALISE O CÓDIGO FONTE ABAIXO E CRIE FLUXOS BASEADOS NOS PROCESSOS REAIS.

📦 Projeto: {{projectName}}
🏗️ Tipo: {{projectType}}
🚀 Frameworks: {{frameworks}}

═══════════════════════════════════════════════════════════════
💻 CÓDIGO FONTE - ANALISE CADA MÉTODO E SUA LÓGICA:
═══════════════════════════════════════════════════════════════
{{sourceCode}}

═══════════════════════════════════════════════════════════════
🔌 ENDPOINTS/ROTAS IDENTIFICADOS:
═══════════════════════════════════════════════════════════════
{{apiRoutes}}

═══════════════════════════════════════════════════════════════
📖 README:
═══════════════════════════════════════════════════════════════
{{readme}}

═══════════════════════════════════════════════════════════════
📁 ESTRUTURA:
═══════════════════════════════════════════════════════════════
{{structure}}

---

🎯 TAREFA: Com base no CÓDIGO FONTE acima:

1. IDENTIFIQUE os principais métodos/endpoints (ex: enviarTransPartner, version)
2. Para CADA método importante, analise:
   - O que ele recebe (parâmetros)
   - O que ele faz (lógica, chamadas de serviço)
   - Decisões (if/else, validações)
   - Tratamento de erros (try/catch)
   - O que ele retorna

3. CRIE um fluxo para cada processo de negócio encontrado no código

EXEMPLO baseado no código acima:
- Se tem método "enviarTransPartner" que chama "intTransService.intTransStatus" →
  Crie "Fluxo de Envio de Transações" com passos: Receber Request → Validar Parceiro → Processar Transação → Retornar Status

⚠️ IMPORTANTE: Use os NOMES e TERMOS do código real, não genéricos!`
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

  troubleshooting: {
    system: `Você é um especialista em suporte técnico e resolução de problemas. Sua tarefa é criar uma seção de TROUBLESHOOTING COMPLETA para ajudar desenvolvedores e usuários a resolver problemas comuns.

REGRAS OBRIGATÓRIAS:
1. Identifique problemas REAIS que podem ocorrer no sistema
2. Para cada problema, liste as causas possíveis com diagnóstico e solução
3. Use o NOME REAL do projeto
4. Baseie-se nas informações fornecidas (README, código, dependências)
5. Inclua comandos de terminal quando relevante
6. Crie pelo menos 5-8 problemas diferentes

CATEGORIAS DE PROBLEMAS:
- Instalação/Setup: Problemas ao instalar ou configurar
- Build/Compilação: Erros durante build
- Runtime: Erros durante execução
- Conexão/Rede: Problemas de conectividade
- Banco de Dados: Problemas com persistência
- Integração: Problemas com serviços externos
- Performance: Lentidão ou travamentos

FORMATO DE RESPOSTA - JSON válido:
{
  "problems": [
    {
      "title": "Erro ao iniciar o servidor: EADDRINUSE",
      "category": "Runtime",
      "causes": [
        {
          "description": "Porta já está em uso por outro processo",
          "responsible": "TI Local",
          "warning": "Não mate processos sem verificar antes",
          "diagnosis": "Execute 'netstat -ano | findstr :3000' para ver qual processo usa a porta",
          "solution": "1) Mate o processo existente com 'taskkill /PID <pid> /F' ou 2) Mude a porta no .env"
        },
        {
          "description": "Instância anterior do servidor ainda rodando",
          "responsible": "Desenvolvedor",
          "diagnosis": "Verifique se há processos node.exe em execução",
          "solution": "Feche todas as instâncias do terminal e reinicie o servidor"
        }
      ]
    }
  ]
}

IMPORTANTE: Cada problema deve ter pelo menos 1-3 causas possíveis, cada uma com diagnóstico e solução!`,
    userTemplate: `Crie uma seção de TROUBLESHOOTING COMPLETA para o projeto.

📦 Nome do Projeto: {{projectName}}
📝 Descrição: {{description}}
🏗️ Tipo de Projeto: {{projectType}}
🚀 Tecnologias/Frameworks: {{frameworks}}
💻 Linguagens: {{languages}}

📖 README COMPLETO (use como fonte principal):
{{readme}}

🔧 Variáveis de Ambiente Necessárias:
{{envVars}}

📦 Dependências:
{{dependencies}}

📦 Comandos de Build/Run:
{{buildCommands}}

📁 Estrutura do Projeto:
{{structure}}

💻 Código Fonte (trechos relevantes):
{{sourceCode}}

---

GERE EXATAMENTE 5-8 PROBLEMAS COMUNS com múltiplas causas possíveis.
Cada causa deve ter: descrição, diagnóstico e solução detalhada.
Use o nome "{{projectName}}" onde relevante.`
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
    system: `Você é um especialista em documentação de APIs REST. Sua tarefa é ANALISAR O CÓDIGO FONTE REAL fornecido e extrair TODOS os endpoints da API.

⚠️ REGRAS CRÍTICAS:
1. ANALISE CADA ARQUIVO de código fonte fornecido em {{sourceCode}}
2. EXTRAIA os endpoints REAIS do código - NÃO invente endpoints
3. PRESERVE os paths EXATOS como estão no código
4. Se o código tiver anotações Swagger/OpenAPI (@ApiResponse, @Operation), USE essas informações
5. Combine @RequestMapping da classe com @GetMapping/@PostMapping dos métodos

PADRÕES DE CÓDIGO PARA IDENTIFICAR ENDPOINTS:

📌 SPRING BOOT / JAVA:
- @RestController + @RequestMapping(value = "/api/path") → base path da classe
- @GetMapping("/subpath") → GET no path base + /subpath
- @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping
- @RequestMapping(method = RequestMethod.GET, value = "/path")
- Anotações Swagger: @ApiResponse, @Operation, @Tag, @Schema

📌 EXPRESS.JS / NODE:
- router.get('/path', handler)
- app.post('/path', middleware, handler)

📌 NESTJS:
- @Controller('path') + @Get(), @Post(), etc.
- @Body(), @Param(), @Query() para parâmetros

📌 FASTAPI / FLASK:
- @app.get("/path"), @router.post("/path")

📌 ASP.NET:
- [HttpGet("path")], [HttpPost("path")]
- [Route("api/[controller]")]

IMPORTANTE: Se encontrar anotações Swagger/OpenAPI no código, extraia:
- @ApiResponse(responseCode = "200", description = "...") → responses
- @Operation(description = "...") → description
- @Tag(name = "...") → tag
- @Schema → tipos de dados

ESTRUTURA DE CADA ENDPOINT:
- tag: Categoria/recurso (ex: "Users", "Authentication", "Products")
- method: GET, POST, PUT, DELETE, PATCH
- path: Caminho EXATO como no código (incluindo /api se existir)
- summary: Descrição curta (max 10 palavras)
- description: Explicação detalhada do que o endpoint faz
- security: Se requer autenticação (bearer, apiKey, etc.)
- parameters: Path params (:id), query params (?search=), headers
- requestBody: Schema do body para POST/PUT/PATCH
- responses: Possíveis respostas com status codes e exemplos

Responda APENAS em formato JSON válido:
{
  "info": {
    "title": "Nome da API",
    "description": "Descrição geral da API",
    "version": "1.0.0",
    "baseUrl": "http://localhost:3000/api"
  },
  "tags": [
    { "name": "Authentication", "description": "Endpoints de autenticação" },
    { "name": "Users", "description": "Gerenciamento de usuários" }
  ],
  "securitySchemes": {
    "bearerAuth": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" }
  },
  "endpoints": [{
    "tag": "Users",
    "method": "GET",
    "path": "/api/users",
    "summary": "Lista todos os usuários",
    "description": "Retorna uma lista paginada de usuários com filtros opcionais",
    "security": ["bearerAuth"],
    "parameters": [
      { "name": "page", "in": "query", "type": "integer", "required": false, "description": "Página atual", "example": 1 },
      { "name": "limit", "in": "query", "type": "integer", "required": false, "description": "Itens por página", "example": 10 },
      { "name": "search", "in": "query", "type": "string", "required": false, "description": "Termo de busca" }
    ],
    "responses": [
      { "status": 200, "description": "Lista de usuários", "example": { "data": [], "total": 0, "page": 1 } },
      { "status": 401, "description": "Não autorizado" }
    ]
  },
  {
    "tag": "Users",
    "method": "POST",
    "path": "/api/users",
    "summary": "Cria um novo usuário",
    "description": "Cria um usuário com os dados fornecidos",
    "security": ["bearerAuth"],
    "requestBody": {
      "contentType": "application/json",
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Nome completo", "example": "João Silva" },
          "email": { "type": "string", "format": "email", "description": "Email único", "example": "joao@email.com" },
          "password": { "type": "string", "format": "password", "description": "Senha (min 6 chars)" }
        },
        "required": ["name", "email", "password"]
      }
    },
    "responses": [
      { "status": 201, "description": "Usuário criado", "example": { "id": 1, "name": "João", "email": "joao@email.com" } },
      { "status": 400, "description": "Dados inválidos", "example": { "error": "Email já existe" } },
      { "status": 401, "description": "Não autorizado" }
    ]
  },
  {
    "tag": "Users",
    "method": "GET",
    "path": "/api/users/:id",
    "summary": "Busca usuário por ID",
    "description": "Retorna os dados de um usuário específico",
    "security": ["bearerAuth"],
    "parameters": [
      { "name": "id", "in": "path", "type": "integer", "required": true, "description": "ID do usuário", "example": 1 }
    ],
    "responses": [
      { "status": 200, "description": "Dados do usuário", "example": { "id": 1, "name": "João", "email": "joao@email.com" } },
      { "status": 404, "description": "Usuário não encontrado" }
    ]
  }]
}`,
    userTemplate: `🔍 ANALISE O CÓDIGO FONTE ABAIXO E EXTRAIA TODOS OS ENDPOINTS DA API.

📦 Projeto: {{projectName}}
🏗️ Tipo: {{projectType}}
🚀 Frameworks: {{frameworks}}

═══════════════════════════════════════════════════════════════
💻 CÓDIGO FONTE DOS CONTROLLERS (ANALISE CADA ARQUIVO):
═══════════════════════════════════════════════════════════════
{{sourceCode}}

═══════════════════════════════════════════════════════════════
🔌 ROTAS PRÉ-IDENTIFICADAS (use como referência):
═══════════════════════════════════════════════════════════════
{{apiRoutes}}

═══════════════════════════════════════════════════════════════
📁 ESTRUTURA DO PROJETO:
═══════════════════════════════════════════════════════════════
{{structure}}

═══════════════════════════════════════════════════════════════
📖 README:
═══════════════════════════════════════════════════════════════
{{readme}}

═══════════════════════════════════════════════════════════════
📦 DEPENDÊNCIAS:
═══════════════════════════════════════════════════════════════
{{dependencies}}

---

🎯 TAREFA: Analise o CÓDIGO FONTE acima e:

1. ENCONTRE todos os Controllers/Routes
2. Para CADA controller, identifique:
   - O path base (@RequestMapping na classe)
   - Todos os métodos HTTP (@GetMapping, @PostMapping, etc.)
   - Combine base path + method path para o path completo
3. EXTRAIA informações de anotações Swagger se existirem (@ApiResponse, @Operation)
4. AGRUPE endpoints por controller/recurso
5. Gere a documentação JSON com TODOS os endpoints encontrados

⚠️ IMPORTANTE: Documente APENAS endpoints que você ENCONTROU no código fonte. Se não encontrou endpoints, retorne endpoints: [].`
  },

  changelog: {
    system: `Você é um especialista em Release Notes. Crie um changelog CLARO, OBJETIVO e PROFISSIONAL.

REGRAS IMPORTANTES:
1. Seja CONCISO - cada item deve ter no máximo 10-15 palavras
2. Use verbos no passado: "Adicionado", "Corrigido", "Melhorado", "Removido"
3. Foque no VALOR para o usuário, não em detalhes técnicos
4. Versão atual deve ser realista (ex: 1.0.0, 1.2.0, 2.0.0)
5. Data no formato YYYY-MM-DD
6. Use versionamento semântico (major.minor.patch)

CATEGORIAS (use EXATAMENTE estes nomes):
- novidades: Novas funcionalidades (começar com "Adicionado")
- correcoes: Bugs corrigidos (começar com "Corrigido")
- melhorias: Melhorias (começar com "Melhorado", "Otimizado")
- breaking: Mudanças incompatíveis (começar com "Removido", "Alterado")

EXEMPLOS DE BONS ITENS:
✅ "Adicionado suporte a autenticação OAuth 2.0"
✅ "Corrigido erro de validação em formulários"
✅ "Melhorado tempo de resposta da API em 40%"

EXEMPLOS RUINS (EVITAR):
❌ "Implementação do módulo de autenticação que permite aos usuários..." (muito longo)
❌ "Bug fix" (muito vago)
❌ "Refatoração" (não comunica valor)

Responda APENAS em formato JSON válido com esta estrutura EXATA:
{
  "version": "string (ex: 1.2.0)",
  "date": "string (formato: 2025-01-15)",
  "summary": "string (resumo da versão atual em 1-2 frases)",
  "categories": {
    "novidades": ["string (max 15 palavras cada)"],
    "correcoes": ["string (max 15 palavras cada)"],
    "melhorias": ["string (max 15 palavras cada)"],
    "breaking": ["string (max 15 palavras cada, pode ser array vazio)"]
  }
}`,
    userTemplate: `Crie o release notes da versão atual para:

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

Crie um release notes profissional para a versão atual do projeto. Seja CONCISO e OBJETIVO. Liste 3-5 itens por categoria.`
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
      await callClaude('You are a test assistant.', 'Say hello', 100);

      return {
        status: 'connected',
        model: DEPLOYMENT,
        endpoint: AZURE_ENDPOINT
      };
    } catch (error: any) {
      return {
        status: 'error: ' + (error.message || 'unknown'),
        model: DEPLOYMENT,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'default'
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
      troubleshooting: 'Troubleshooting',
      integrations: 'Integrações',
      comparison: 'Comparativo',
      changelog: 'Release Notes'
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
