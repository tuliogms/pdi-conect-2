/**
 * Testes da camada de dados (sem navegador).
 *
 * Usa o mesmo código que roda no app (`lib/`) compilado com esbuild e um
 * localStorage falso — cobre migração de dados, permissões, progresso,
 * listas/chips, evolução, próximos passos e preferências.
 *
 * Uso: pnpm test:logic
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { compilar } from './build.mjs'

const require = createRequire(import.meta.url)

// ---- ambiente mínimo de navegador ----
const loja = new Map()
global.window = {
  localStorage: {
    getItem: chave => (loja.has(chave) ? loja.get(chave) : null),
    setItem: (chave, valor) => loja.set(chave, String(valor)),
  },
}
global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) })

const lib = require(await compilar({ entrada: 'tests/lib-entry.ts', arquivo: 'logic-lib.cjs' }))
const { dados: d, pdi: t, teste, relatorio } = lib

let falhas = 0
const ok = (nome, condicao) => {
  console.log(`${condicao ? '  PASS ' : '  FALHA'}  ${nome}`)
  if (!condicao) falhas++
}

// 1. migração da configuração antiga (v1 -> v2)
{
  const estudanteAntigo = { id: t.novoId(), nome: 'Estudante (v1)', serie: '4º ano', escola: 'Escola Y' }
  loja.set(
    'pdi.config.v1',
    JSON.stringify({
      estudantes: [estudanteAntigo],
      usuarios: [
        {
          id: 'u1',
          nome: 'Professor',
          email: 'p@escola.br',
          perfil: 'Professor',
          estudanteId: estudanteAntigo.id,
          status: 'Ativo',
        },
      ],
      permissoes: { 'u1::x::professor': 'Editar' },
      camposColaborativos: { professor: ['Campo antigo'] },
      historico: [],
    }),
  )
  const { config } = await d.carregarConfig()
  ok('mantém o estudante da versão anterior', config.estudantes[0].nome === 'Estudante (v1)')
  ok('configuração passa para a versão 2', config.versao === 2)
  ok('campos padrão do professor existem', t.camposDaArea(config, 'professor').length >= 6)
  ok(
    'campo antigo migra como campo extra',
    t.camposDaArea(config, 'professor').some(campo => campo.titulo === 'Campo antigo'),
  )
  ok('indicadores padrão preenchidos', config.indicadores.length === 3)
}

// 2. sistema começa vazio
loja.delete('pdi.config.v1')
loja.delete('pdi.config.v2')
let { config } = await d.carregarConfig()
ok('sistema começa vazio', config.estudantes.length === 0 && config.usuarios.length === 0)
ok('modo local quando a API falha', (await d.carregarConfig()).modo === 'local')

// 3. cadastro feito pelo próprio usuário (nenhum dado de exemplo embutido)
ok(
  'configuração vazia não traz estudantes nem usuários',
  t.configVazia().estudantes.length === 0 && t.configVazia().usuarios.length === 0,
)
const estudanteCriado = t.novoId()
const equipe = ['Estudante', 'Professor', 'Professor de AEE', 'Família', 'Profissional da Saúde'].map(
  perfil => ({
    id: t.novoId(),
    nome: `Pessoa ${perfil}`,
    email: `${perfil.toLowerCase().replace(/ /g, '.')}@escola.br`,
    perfil,
    estudanteId: estudanteCriado,
    status: 'Ativo',
  }),
)
const cfg = {
  ...t.configVazia(),
  estudantes: [{ id: estudanteCriado, nome: 'Estudante cadastrado', serie: '5º ano A', escola: 'Escola' }],
  usuarios: equipe,
}
ok('cadastro cria um estudante', cfg.estudantes.length === 1)
ok(
  'cadastro cria a equipe vinculada ao estudante',
  cfg.usuarios.length === 5 && cfg.usuarios.every(usuario => usuario.estudanteId === cfg.estudantes[0].id),
)
ok('cadastro não inventa respostas de PDI', Object.keys(cfg.modos).length === 0)

// 4. permissões efetivas
const estudante = cfg.estudantes[0].id
const professor = cfg.usuarios.find(usuario => usuario.perfil === 'Professor')
const familia = cfg.usuarios.find(usuario => usuario.perfil === 'Família')
const acesso = (extra, perfil, area, usuarioId) =>
  t.acessoNaArea(extra, { usuarioId, perfil, estudanteId: estudante, area })

ok('dono da área edita', acesso(cfg, 'Professor', 'professor', professor.id) === 'Editar')
ok('outros perfis visualizam', acesso(cfg, 'Professor', 'familia', professor.id) === 'Visualizar')
ok('administrador edita tudo', t.acessoNaArea(cfg, { perfil: 'Usuário Mestre', estudanteId: estudante, area: 'saude' }) === 'Editar')
ok(
  'permissão "Sem acesso" vence o padrão',
  acesso({ ...cfg, permissoes: { [t.chavePermissao(familia.id, estudante, 'professor')]: 'Sem acesso' } }, 'Família', 'professor', familia.id) === 'Sem acesso',
)
ok(
  'permissão "Comentar" é aplicada',
  acesso({ ...cfg, permissoes: { [t.chavePermissao(professor.id, estudante, 'familia')]: 'Comentar' } }, 'Professor', 'familia', professor.id) === 'Comentar',
)

// 5. progresso das etapas
let progresso = t.progressoGeral(cfg, [])
ok('todas as etapas começam pendentes', progresso.every(item => item.status === 'Pendente'))
ok('área do estudante tem seis tópicos', progresso[0].total === 6)

const entradas = []
const adicionar = (area, sectionKey, content, authorName = 'Professor') =>
  entradas.push({ area, sectionKey, content, authorName, updatedAt: new Date().toISOString() })

adicionar('estudante', 'meu-perfil', 'Sou eu.')
adicionar('estudante', 'meus-interesses#0', 'Gosto de desenhar.')
progresso = t.progressoEstudante(entradas)
ok('dois tópicos respondidos (descritivo + pergunta)', progresso.respondidos === 2 && progresso.status === 'Em andamento')

const camposProfessor = t.camposDaArea(cfg, 'professor')
camposProfessor.forEach(campo =>
  adicionar('professor', campo.id, campo.tipo === 'lista' ? '["Criatividade"]' : 'Texto'),
)
ok('área concluída quando todos os campos respondem', t.progressoAreaColaborativa(cfg, 'professor', entradas).status === 'Concluída')

const parcial = entradas.filter(item => !(item.area === 'professor' && item.sectionKey === camposProfessor[0].id))
ok(
  'campo faltante mantém a área em andamento',
  t.progressoAreaColaborativa(cfg, 'professor', parcial).respondidos === camposProfessor.length - 1,
)
const emBranco = entradas.map(item =>
  item.area === 'professor' && item.sectionKey === camposProfessor[1].id ? { ...item, content: '   ' } : item,
)
ok('resposta em branco não conta', t.progressoAreaColaborativa(cfg, 'professor', emBranco).respondidos === camposProfessor.length - 1)

// 6. listas e chips
ok('lerLista lê JSON', JSON.stringify(d.lerLista('["A","B"]')) === '["A","B"]')
ok('lerLista aceita texto antigo', JSON.stringify(d.lerLista('A; B, C')) === '["A","B","C"]')
ok('escreverLista serializa', d.escreverLista(['X', 'Y']) === '["X","Y"]')

// 7. acompanhamento
await d.salvarEntrada({ estudante: { id: estudante, nome: 'E' }, area: 'evolucao', sectionKey: 'registro-1', content: JSON.stringify({ indicador: 'Leitura', valor: 3, quando: '2026-01-10T10:00:00.000Z' }), authorName: 'Professor' })
await d.salvarEntrada({ estudante: { id: estudante, nome: 'E' }, area: 'evolucao', sectionKey: 'registro-2', content: JSON.stringify({ indicador: 'Leitura', valor: 5, quando: '2026-02-10T10:00:00.000Z' }), authorName: 'Professor' })
await d.salvarEntrada({ estudante: { id: estudante, nome: 'E' }, area: 'evolucao', sectionKey: 'registro-3', content: JSON.stringify({ indicador: 'Escrita', valor: 2, quando: '2026-02-11T10:00:00.000Z' }), authorName: 'Professor' })
const lidas = await d.carregarEntradas(estudante)
const registros = d.lerRegistrosEvolucao(lidas.entradas)
ok('registros de evolução são lidos', registros.length === 3)
ok('registros vêm ordenados por data', registros[0].quando === '2026-01-10T10:00:00.000Z')
ok('indicador e valor preservados', registros[1].indicador === 'Leitura' && registros[1].valor === 5)

await d.salvarProximosPassos({ estudante: { id: estudante, nome: 'E' }, conteudo: 'Ler em duplas', autor: 'Professor' })
ok('próximos passos são salvos', d.lerProximosPassos((await d.carregarEntradas(estudante)).entradas)?.content === 'Ler em duplas')

// 8. acessibilidade
d.gravarAcessibilidade({ ...d.ACESSIBILIDADE_PADRAO, leituraEmVozAlta: true, velocidadeVoz: 1.3, altoContraste: true })
const preferencias = d.lerAcessibilidade()
ok('preferências de acessibilidade persistem', preferencias.leituraEmVozAlta && preferencias.velocidadeVoz === 1.3 && preferencias.altoContraste)
ok('preferências ausentes caem no padrão', preferencias.ditado === false && preferencias.botoesGrandes === false)

const cfg2 = cfg

// 9. comentários por campo
{
  await d.salvarEntrada({
    estudante: { id: estudante, nome: 'E' },
    area: 'professor',
    sectionKey: 'observacoes-pedagogicas',
    content: 'Resposta original',
    authorName: 'Professor',
  })
  await d.salvarComentario({
    estudante: { id: estudante, nome: 'E' },
    area: 'professor',
    campoId: 'observacoes-pedagogicas',
    texto: 'Concordo com a observação.',
    autor: 'Família',
  })
  const todas = (await d.carregarEntradas(estudante)).entradas
  const comentarios = d.lerComentarios(todas, 'professor', 'observacoes-pedagogicas')
  ok('comentário é gravado e lido', comentarios.length === 1 && comentarios[0].content.includes('Concordo'))
  ok(
    'comentário não sobrescreve a resposta do campo',
    todas.find(item => item.sectionKey === 'observacoes-pedagogicas')?.content === 'Resposta original',
  )
  ok(
    'comentário de outro campo não aparece',
    d.lerComentarios(todas, 'professor', 'potencialidades').length === 0,
  )
}

// 10. cópia de segurança (exportar / importar)
{
  const pacote = await d.montarBackup(cfg2)
  ok('backup carrega as respostas de cada estudante', Array.isArray(pacote.entradas[estudante]))
  ok('backup guarda a configuração', pacote.config.estudantes.length === cfg2.estudantes.length)

  const texto = d.textoDoBackup(pacote)
  const lido = d.lerBackup(texto)
  ok('backup exportado é lido de volta', lido.config.estudantes[0].nome === cfg2.estudantes[0].nome)
  ok('backup mantém as respostas', (lido.entradas[estudante] ?? []).length === pacote.entradas[estudante].length)

  let erroArquivoInvalido = ''
  try {
    d.lerBackup('{ isto não é json }')
  } catch (erro) {
    erroArquivoInvalido = erro.message
  }
  ok('arquivo inválido é recusado com mensagem', erroArquivoInvalido.includes('JSON'))

  let erroVazio = ''
  try {
    d.lerBackup(JSON.stringify({ app: 'PDI Interativo', versao: 1, config: { estudantes: [] }, entradas: {} }))
  } catch (erro) {
    erroVazio = erro.message
  }
  ok('backup sem dados é recusado', erroVazio.length > 0)

  // importar de verdade: um segundo estudante vindo do arquivo
  const outroId = t.novoId()
  const importado = {
    ...lido,
    config: {
      ...lido.config,
      estudantes: [...lido.config.estudantes, { id: outroId, nome: 'Importado', serie: '3º ano', escola: 'Escola Z' }],
    },
    entradas: {
      ...lido.entradas,
      [outroId]: [
        { area: 'estudante', sectionKey: 'meu-perfil', content: 'Vim do backup', authorName: 'Estudante', updatedAt: new Date().toISOString() },
      ],
    },
  }
  await d.restaurarBackup(importado)
  const importadas = (await d.carregarEntradas(outroId)).entradas
  ok('restaurar backup grava as respostas', importadas[0]?.content === 'Vim do backup')
}

// 11. planilha (CSV)
{
  const entradas = (await d.carregarEntradas(estudante)).entradas
  const csv = relatorio.csvDeRespostas(cfg2, { [estudante]: entradas })
  ok('planilha começa com o cabeçalho', csv.startsWith('\uFEFF"Estudante";"Turma";"Escola"'))
  ok('planilha tem uma linha por resposta', csv.split('\r\n').length === entradas.filter(e => e.content.trim()).length + 1)
  ok('planilha usa ponto e vírgula', csv.split('\r\n')[1].includes(';'))
  ok('planilha rotula o tópico do estudante', relatorio.rotuloDoCampo(cfg2, 'estudante', 'meu-perfil') === 'Meu perfil')
  ok(
    'planilha rotula a pergunta',
    relatorio.rotuloDoCampo(cfg2, 'estudante', 'meu-perfil#1') === 'Meu perfil — pergunta 2',
  )
  ok(
    'planilha rotula comentário',
    relatorio.rotuloDoCampo(cfg2, 'professor', 'potencialidades#comentario#123').startsWith('Comentário'),
  )
  ok('planilha rotula área colaborativa', relatorio.rotuloDoCampo(cfg2, 'professor', 'observacoes-pedagogicas') === 'Observações pedagógicas')
}

// 12. limpeza
const limpa = t.configuracaoLimpa()
ok('apagar remove estudantes e usuários', limpa.estudantes.length === 0 && limpa.usuarios.length === 0)
ok('apagar mantém os campos padrão', t.camposDaArea(limpa, 'familia').length >= 5)

console.log(falhas === 0 ? '\nLógica: todos os testes passaram\n' : `\nLógica: ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
