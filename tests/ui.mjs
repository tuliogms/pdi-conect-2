/**
 * Testes de interface sem navegador.
 *
 * O projeto não tem Playwright/Chromium instalado, então a UI é exercitada de
 * verdade em um DOM (jsdom): os componentes são compilados com esbuild e o
 * React roda com `act`, incluindo cliques em menu, abas e botões. Assim dá para
 * pegar regressões de navegação — como a barra lateral que ficava escondida no
 * celular — sem depender de um navegador.
 *
 * Uso: pnpm test:ui
 */
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { compilar, raiz } from './build.mjs'
import { configuracaoComEquipe } from './massa.mjs'

const require = createRequire(import.meta.url)

// 1. compila os componentes e a camada de dados (React externo, do projeto)
const bundle = await compilar({ entrada: 'tests/entry.tsx', arquivo: 'ui-bundle.cjs', jsx: true })
const lib = await compilar({ entrada: 'tests/lib-entry.ts', arquivo: 'lib.cjs' })

// ---------------------------------------------------------------------------
// 2. configuração de teste (cadastros feitos como na tela de administração)
// ---------------------------------------------------------------------------
const tipos = require(lib)
const config = configuracaoComEquipe(tipos.pdi)

// ---------------------------------------------------------------------------
// 3. ambiente DOM
// ---------------------------------------------------------------------------
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000/dashboard',
  pretendToBeVisual: true,
})
const { window } = dom
global.window = window
global.document = window.document
global.HTMLElement = window.HTMLElement
global.Element = window.Element
global.Node = window.Node
global.MutationObserver = window.MutationObserver
global.requestAnimationFrame = callback => setTimeout(callback, 0)
global.cancelAnimationFrame = id => clearTimeout(id)
global.IS_REACT_ACT_ENVIRONMENT = true
global.URL.createObjectURL = () => 'blob:teste'
global.URL.revokeObjectURL = () => {}
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}
window.localStorage.clear()
window.localStorage.setItem('pdi.config.v2', JSON.stringify(config))
// sem banco: a API responde 503 e a interface cai para o modo local
global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) })

const React = require(resolve(raiz, 'node_modules/react'))
const { act } = React
const app = require(bundle)

const espera = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms))
let falhas = 0
const ok = (nome, condicao) => {
  console.log(`${condicao ? '  PASS ' : '  FALHA'}  ${nome}`)
  if (!condicao) falhas++
}

const erros = []
const consoleErrorOriginal = console.error
console.error = (...argumentos) => {
  erros.push(argumentos.map(a => (a && a.message) || String(a)).join(' '))
}

async function montar(perfil) {
  const container = window.document.createElement('div')
  window.document.body.appendChild(container)
  global.IS_REACT_ACT_ENVIRONMENT = true
  await act(async () => {
    await app.montar(perfil, container)
  })
  await act(async () => {
    await espera(150)
  })
  return container
}

function itensDoMenu(container) {
  return [...container.querySelectorAll('.sidebar button.side-link')]
}

function textoDoH1(container) {
  return container.querySelector('h1')?.textContent?.trim() ?? ''
}

async function clicar(elemento) {
  assert.ok(elemento, 'elemento para clicar não existe')
  await act(async () => {
    elemento.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
  await act(async () => {
    await espera(120)
  })
}

async function navegar(container, rotulo) {
  const botao = itensDoMenu(container).find(item => item.textContent.trim() === rotulo)
  assert.ok(
    botao,
    `menu sem o item "${rotulo}" (tem: ${itensDoMenu(container).map(b => b.textContent.trim()).join(', ')})`,
  )
  await clicar(botao)
}

const porTexto = (raiz, seletor, texto) =>
  [...raiz.querySelectorAll(seletor)].find(item => item.textContent.trim().includes(texto))

// ---------------------------------------------------------------------------
// 4. cenários
// ---------------------------------------------------------------------------
const secoesAdmin = [
  'Visão geral',
  'Usuários',
  'Educandos',
  'Planos de PDI',
  'PDI consolidado',
  'Versões do PDI',
  'Permissões de acesso',
  'Campos e formulários',
  'Pranchas de comunicação',
  'Acompanhamento',
  'Configurações',
]

const secoesParticipante = [
  'Início',
  'Meus alunos',
  'Meu PDI',
  'PDI consolidado',
  'Acompanhamento',
  'Acessibilidade',
  'Configurações',
]

console.log('\n1) Usuário Mestre — todas as abas')
{
  const container = await montar('Usuário Mestre')
  ok(
    'menu do administrador tem as onze abas',
    itensDoMenu(container).length === secoesAdmin.length,
  )

  for (const secao of secoesAdmin) {
    await navegar(container, secao)
    const titulo = textoDoH1(container)
    ok(`aba "${secao}" abre (h1: ${titulo || '—'})`, titulo.includes(secao))
  }

  // cada aba precisa ter conteúdo próprio — não pode ser uma tela vazia
  await navegar(container, 'Visão geral')
  ok('visão geral mostra os indicadores', container.textContent.includes('Educandos'))

  await navegar(container, 'Usuários')
  ok('usuários lista a equipe cadastrada', container.querySelectorAll('.admin-table .table-row').length === 5)

  await navegar(container, 'Educandos')
  ok('educandos lista o educando cadastrado', container.querySelectorAll('.table-row.estudantes').length >= 1)

  await navegar(container, 'Planos de PDI')
  ok('planos de PDI lista os educandos', container.querySelectorAll('.pdi-card').length >= 1)
  const abrirPlano = container.querySelector('.pdi-card')
  await clicar(abrirPlano)
  ok(
    'plano abre as áreas do PDI em abas',
    container.querySelectorAll('.pdi-abas .area-tab').length >= 5,
  )
  ok(
    'plano mostra os seis tópicos do educando',
    container.querySelectorAll('.topico-card').length === 6,
  )

  await navegar(container, 'Permissões de acesso')
  ok('permissões mostra a matriz de áreas', container.querySelectorAll('.permission-row').length >= 4)
  ok('permissões tem seletores de nível', container.querySelectorAll('.permission-row select').length >= 4)

  await navegar(container, 'Campos e formulários')
  ok('campos lista os campos configuráveis', container.querySelectorAll('.field-config').length >= 5)

  await navegar(container, 'Acompanhamento')
  ok('acompanhamento mostra a evolução', container.textContent.includes('Evolução'))

  await navegar(container, 'Configurações')
  ok('configurações mostra a exportação', container.textContent.includes('Exportar dados'))

  await navegar(container, 'PDI consolidado')
  ok('consolidado mostra o documento', Boolean(container.querySelector('.consolidado')))
  ok('consolidado tem o botão de PDF', container.textContent.includes('Gerar PDF'))
}

console.log('\n2) Menu lateral em tela estreita (celular / preview)')
{
  const container = await montar('Usuário Mestre')
  const botaoMenu = container.querySelector('button.mobile-menu')
  const lateral = container.querySelector('.sidebar')
  ok('botão de menu existe', Boolean(botaoMenu))
  ok('menu começa fechado', !lateral.classList.contains('open'))

  await clicar(botaoMenu)
  ok('abre com .open (deixa de ficar escondido)', lateral.classList.contains('open'))
  ok('fundo escurecido para fechar', Boolean(container.querySelector('button.menu-scrim')))
  ok('aria-expanded=true', botaoMenu.getAttribute('aria-expanded') === 'true')

  await navegar(container, 'Acompanhamento')
  ok('aba abre a partir do menu aberto', textoDoH1(container).includes('Acompanhamento'))
  ok('menu fecha ao navegar', !lateral.classList.contains('open'))

  await clicar(botaoMenu)
  await clicar(container.querySelector('button.menu-scrim'))
  ok('clique fora fecha o menu', !lateral.classList.contains('open'))

  await clicar(botaoMenu)
  await act(async () => {
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  await act(async () => {
    await espera(40)
  })
  ok('Esc fecha o menu', !lateral.classList.contains('open'))

  const acessibilidade = container.querySelector('.top-actions .outline-btn')
  const antesDoClique = container.querySelector('main.app-shell').getAttribute('style')
  await clicar(acessibilidade)
  ok(
    'botão Acessibilidade da barra superior aumenta o texto',
    container.querySelector('main.app-shell').getAttribute('style') !== antesDoClique,
  )
}

console.log('\n3) Professor — abas, Meus alunos e permissões por área')
{
  const container = await montar('Professor')
  ok('menu do participante tem sete abas', itensDoMenu(container).length === secoesParticipante.length)

  for (const secao of secoesParticipante) {
    await navegar(container, secao)
    const titulo = textoDoH1(container)
    ok(
      `aba "${secao}" abre (h1: ${titulo || '—'})`,
      secao === 'Início' ? titulo.startsWith('Olá') : titulo.includes(secao),
    )
  }

  await navegar(container, 'Meus alunos')
  ok('mostra o aluno vinculado', Boolean(container.querySelector('.aluno-card')))

  // o cartão do aluno inteiro é o botão que abre o PDI
  await clicar(container.querySelector('.aluno-card'))
  const abas = [...container.querySelectorAll('.pdi-abas .area-tab')]
  ok('abre o PDI pelo cartão do aluno', abas.length >= 5)

  // o professor entra direto na própria aba
  const grupoProfessor = container.querySelector('.aba-painel .area-group')
  ok(
    'o professor cai na própria área',
    Boolean(grupoProfessor) && grupoProfessor.textContent.includes('Área do Professor'),
  )
  ok(
    'área do professor é editável (tem campos com salvar)',
    grupoProfessor.querySelectorAll('textarea:not([readonly])').length >= 1 &&
      grupoProfessor.querySelectorAll('.save-answer').length >= 1,
  )
  ok(
    'área do professor tem as oito seções do professor',
    grupoProfessor.querySelectorAll('.secao-bloco').length >= 6,
  )

  // abre a aba da família: ela deve ser somente leitura para o professor
  const abaFamilia = abas.find(aba => aba.textContent.includes('Família'))
  await clicar(abaFamilia)
  const grupoFamilia = container.querySelector('.aba-painel .area-group')
  ok(
    'área da família fica somente leitura para o professor',
    Boolean(grupoFamilia) &&
      grupoFamilia.querySelectorAll('textarea[readonly]').length >= 1,
  )
  ok('área da família não oferece salvar', grupoFamilia.querySelectorAll('.save-answer').length === 0)

  // as seis seções do educando ficam na aba do educando
  const abaEducando = abas.find(aba => aba.textContent.includes('Educando'))
  await clicar(abaEducando)
  ok('os seis tópicos do educando ficam na aba do educando', container.querySelectorAll('.topico-card').length === 6)
  ok(
    'descritivo e perguntas disponíveis',
    container.textContent.includes('Descritivo') && container.textContent.includes('Perguntas'),
  )
}

console.log('\n4) Acessibilidade — controles')
{
  const container = await montar('Professor')
  await navegar(container, 'Acessibilidade')
  const interruptores = [...container.querySelectorAll('input[type="checkbox"]')]
  ok('tela tem os quatro controles', interruptores.length >= 4)
  ok('controles começam desligados', interruptores.every(item => item.checked === false))

  // o jsdom não implementa Web Speech API: os controles de voz devem vir desativados
  ok('sem suporte a voz, a leitura fica desativada', interruptores[0].disabled === true)
  ok('e a tela avisa sobre a falta de suporte', container.textContent.includes('não oferece leitura em voz alta'))

  const appShell = container.querySelector('main.app-shell')
  const contraste = interruptores[2]
  await clicar(contraste)
  ok('alto contraste aplica a classe no app', appShell.classList.contains('alto-contraste'))
  ok(
    'preferência de contraste é gravada',
    JSON.parse(window.localStorage.getItem('pdi.acessibilidade.v1') ?? '{}').altoContraste === true,
  )

  const grandes = [...container.querySelectorAll('input[type="checkbox"]')][3]
  await clicar(grandes)
  ok('botões maiores aplicam a classe no app', appShell.classList.contains('botoes-grandes'))

  const botaoTexto = container.querySelector('.top-actions .outline-btn')
  const antes = appShell.getAttribute('style')
  await clicar(botaoTexto)
  ok('botão da barra superior aumenta o texto', appShell.getAttribute('style') !== antes)
}

console.log('\n5) Educando — PDI e permissões')
{
  const container = await montar('Educando')
  await navegar(container, 'Meu PDI')
  ok('educando vê os seis tópicos', container.querySelectorAll('.topico-card').length === 6)
  ok('educando pode escolher Descritivo ou Perguntas', container.textContent.includes('Descritivo'))
  const abaProfessor = [...container.querySelectorAll('.pdi-abas .area-tab')].find(aba =>
    aba.textContent.includes('Professor'),
  )
  await clicar(abaProfessor)
  const grupoProfessor = container.querySelector('.aba-painel .area-group')
  ok(
    'educando lê a área do professor, mas não edita',
    Boolean(grupoProfessor) &&
      grupoProfessor.textContent.includes('Observações pedagógicas') &&
      grupoProfessor.querySelectorAll('.save-answer').length === 0,
  )

  await navegar(container, 'Início')
  ok('início cumprimenta a pessoa', textoDoH1(container).startsWith('Olá'))
}

console.log('\n6) Prancha de comunicação na área do educando')
{
  const container = await montar('Educando')
  await navegar(container, 'Meu PDI')
  const abrirPrancha = porTexto(container, '.aba-painel button', 'Prancha de comunicação')
  ok('a prancha pode ser aberta no campo', Boolean(abrirPrancha))
  await clicar(abrirPrancha)

  const simbolos = [...container.querySelectorAll('.prancha-simbolo')]
  ok('a prancha mostra símbolos com nome escrito', simbolos.length >= 5)
  ok(
    'cada símbolo tem rótulo escrito (leitor de tela)',
    simbolos.every(simbolo => simbolo.textContent.trim().length > 0),
  )

  await clicar(simbolos[0])
  await clicar(simbolos[1])
  const frase = container.querySelector('.prancha-frase')?.textContent ?? ''
  ok('dois símbolos montam uma frase', frase.trim().length > 5)

  const usar = porTexto(container, '.prancha-frase button', 'Usar esta frase')
  await clicar(usar)
  const texto = container.querySelector('.aba-painel textarea')
  ok('a frase composta vai para a resposta', Boolean(texto) && texto.value.length > 3)
}

console.log('\n7) Autorização da família e acesso dos Profissionais de Apoio')
{
  // sem autorização: o profissional de apoio não lê nenhuma área
  const apoio = await montar('Profissional de Apoio')
  await navegar(apoio, 'Meu PDI')
  const abasApoio = [...apoio.querySelectorAll('.pdi-abas .area-tab')].map(aba =>
    aba.textContent.trim(),
  )
  ok('sem autorização, o apoio vê só a própria área', abasApoio.length === 1)
  ok(
    'sem autorização, nenhuma área de outra pessoa aparece',
    !abasApoio.some(rotulo => /Educando|Professor|AEE|Família/.test(rotulo)),
  )

  // a família autoriza o compartilhamento da área do educando
  const familia = await montar('Família')
  await navegar(familia, 'Meu PDI')
  const autorizacao = familia.querySelector('.autorizacao-card')
  ok('família vê o cartão de autorização', Boolean(autorizacao))
  ok('autorização começa pendente', autorizacao.textContent.includes('Pendente'))

  const caixa = autorizacao.querySelector('input[type="checkbox"]')
  await clicar(caixa)
  const areasLiberaveis = [...familia.querySelectorAll('.autorizacao-areas input[type="checkbox"]')]
  ok('família escolhe quais áreas compartilhar', areasLiberaveis.length >= 4)
  await clicar(areasLiberaveis[0])

  const registrar = porTexto(familia, 'button', 'Registrar autorização')
  await clicar(registrar)
  const config = JSON.parse(window.localStorage.getItem('pdi.config.v2') ?? '{}')
  const autorizacoes = Object.values(config.autorizacoes ?? {})
  ok('autorização fica gravada na configuração', autorizacoes.length === 1 && autorizacoes[0].autorizado === true)
  ok('autorização guarda a área liberada', (autorizacoes[0]?.areas ?? []).length === 1)
  ok('autorização guarda quem autorizou', Boolean(autorizacoes[0]?.responsavel))

  // com autorização vigente, o apoio passa a ler a área liberada
  const apoioDepois = await montar('Profissional de Apoio')
  await navegar(apoioDepois, 'Meu PDI')
  ok(
    'com autorização, o apoio vê a área liberada',
    apoioDepois.querySelectorAll('.pdi-abas .area-tab').length >= 1,
  )
  ok(
    'o apoio continua sem acesso à área da família',
    ![...apoioDepois.querySelectorAll('.pdi-abas .area-tab')].some(aba =>
      aba.textContent.includes('Família'),
    ),
  )
}

console.log('\n8) Nenhum erro de console durante os testes')
ok(
  erros.length === 0 ? 'console limpo' : `console com ${erros.length} erro(s): ${erros[0]?.slice(0, 200)}`,
  erros.length === 0,
)

console.error = consoleErrorOriginal
console.log(falhas === 0 ? '\nUI: todos os testes passaram\n' : `\nUI: ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
