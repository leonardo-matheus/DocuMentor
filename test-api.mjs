// Test script for DocuMentor API
const repoUrl = 'https://code.movemais.com/MoveMais/khalifa';

async function testApi() {
  console.log('🔍 Testando conexão com o backend...\n');
  
  try {
    // Test health
    const healthRes = await fetch('http://localhost:3001/health');
    const health = await healthRes.json();
    console.log('✅ Health Check:', health);
    
    // Test projects list
    const projectsRes = await fetch('http://localhost:3001/api/projects');
    const projects = await projectsRes.json();
    console.log('✅ Projects:', projects.length, 'projetos encontrados');
    
    // Test repository analysis
    console.log('\n📦 Analisando repositório:', repoUrl);
    const analyzeRes = await fetch('http://localhost:3001/api/repositories/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryUrl: repoUrl })
    });
    
    if (!analyzeRes.ok) {
      const error = await analyzeRes.json();
      console.error('❌ Erro na análise:', error);
      return;
    }
    
    const analysis = await analyzeRes.json();
    console.log('✅ Análise do repositório:');
    console.log('   - Nome:', analysis.repo);
    console.log('   - Owner:', analysis.owner);
    console.log('   - Descrição:', analysis.description || '(sem descrição)');
    console.log('   - Linguagens:', Object.keys(analysis.languages || {}).join(', '));
    console.log('   - Arquivos:', analysis.structure?.length || 0, 'arquivos');
    console.log('   - README:', analysis.readme ? 'Sim (' + analysis.readme.length + ' chars)' : 'Não');
    console.log('   - Config files:', analysis.configFiles?.join(', ') || 'Nenhum');
    
    // Create a project
    console.log('\n📝 Criando projeto para khalifa...');
    const createRes = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Khalifa',
        description: 'Documentação do projeto Khalifa',
        repositoryUrl: repoUrl
      })
    });
    
    if (!createRes.ok) {
      const error = await createRes.json();
      console.error('❌ Erro ao criar projeto:', error);
      return;
    }
    
    const project = await createRes.json();
    console.log('✅ Projeto criado:', project.id);
    
    // Test AI status
    console.log('\n🤖 Verificando status da IA...');
    const aiRes = await fetch('http://localhost:3001/api/ai/status');
    const aiStatus = await aiRes.json();
    console.log('   - Status:', aiStatus.status);
    console.log('   - Model:', aiStatus.model);
    console.log('   - Endpoint:', aiStatus.endpoint);
    
    console.log('\n✅ Todos os testes passaram! O sistema está funcionando.');
    console.log('🌐 Acesse: http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testApi();
