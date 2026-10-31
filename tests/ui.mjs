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

async function abaAdmin(container, rotulo) {
  // a configuração chega de forma assíncrona: espera as sub-abas aparecerem
  let botao = null
  for (let tentativa = 0; tentativa < 20 && !botao; tentativa++) {
    botao = [...container.querySelectorAll('.admin-subabas button')].find(
      item => item.textContent.trim() === rotulo,
    )
    if (!botao) await act(async () => { await espera(60) })
  }
  assert.ok(botao, `sub-aba "${rotulo}" não encontrada`)
  await clicar(botao)
}

const porTexto = (raiz, seletor, texto) =>
  [...raiz.querySelectorAll(seletor)].find(item => item.textContent.trim().includes(texto))

// ---------------------------------------------------------------------------
// 4. cenários
// ---------------------------------------------------------------------------
// navegação principal = as áreas do PDI
const menuDoMestre = [
  ['Educando', 'Área do Educando'],
  ['Professor', 'Área do Professor'],
  ['Professor de AEE', 'Área do AEE'],
  ['Família', 'Área da Família'],
  ['Profissionais de Apoio', 'Profissionais de Apoio'],
  ['Construção do PDI', 'PDI consolidado'],
  ['Acompanhamento', 'Acompanhamento'],
  ['Usuário Mestre', 'Visão geral'],
]

const subabasDoMestre = [
  'Visão geral',
  'Usuários',
  'Educandos',
  'Permissões de acesso',
  'Campos e formulários',
  'Pranchas de comunicação',
  'Versões do PDI',
  'Histórico administrativo',
  'Configurações',
]

console.log('\n1) Usuário Mestre — as áreas do PDI e a área administrativa')
{
  const container = await montar('Usuário Mestre')
  ok(
    'a navegação principal tem as oito áreas do PDI',
    itensDoMenu(container).length === menuDoMestre.length,
  )
  ok(
    'os itens da navegação são as áreas (não as telas antigas)',
    itensDoMenu(container)
      .map(item => item.textContent.trim())
      .join('|') === menuDoMestre.map(([rotulo]) => rotulo).join('|'),
  )

  for (const [rotulo, tituloEsperado] of menuDoMestre) {
    await navegar(container, rotulo)
    const titulo = textoDoH1(container)
    ok(`área "${rotulo}" abre (h1: ${titulo || '—'})`, titulo === tituloEsperado)
  }

  await navegar(container, 'Educando')
  ok('a área do educando mostra as seis seções', container.querySelectorAll('.topico-card').length === 6)
  ok('a área do educando não repete as abas antigas', !container.querySelector('.pdi-abas:not([hidden])'))

  await navegar(container, 'Professor')
  ok(
    'a área do professor mostra as oito seções',
    container.querySelectorAll('.secao-bloco').length === 8,
  )

  await navegar(container, 'Usuário Mestre')
  const abasMestre = [...container.querySelectorAll('.admin-subabas .area-tab')].map(aba =>
    aba.textContent.trim(),
  )
  ok('a área do Mestre tem as nove tarefas administrativas', abasMestre.length === subabasDoMestre.length)
  ok('as tarefas do Mestre são as da especificação', abasMestre.join('|') === subabasDoMestre.join('|'))

  for (const secao of subabasDoMestre) {
    await abaAdmin(container, secao)
    const titulo = textoDoH1(container)
    ok(`tarefa "${secao}" abre (h1: ${titulo || '—'})`, titulo === secao)
  }

  await abaAdmin(container, 'Visão geral')
  ok('visão geral mostra os indicadores', container.textContent.includes('Educandos'))

  await abaAdmin(container, 'Usuários')
  ok('usuários lista a equipe cadastrada', container.querySelectorAll('.admin-table .table-row').length === 5)

  await abaAdmin(container, 'Educandos')
  ok('educandos lista o educando cadastrado', container.querySelectorAll('.table-row.estudantes').length >= 1)

  await abaAdmin(container, 'Permissões de acesso')
  ok('permissões mostra a matriz de áreas', container.querySelectorAll('.permission-row').length >= 4)
  ok('permissões tem seletores de nível', container.querySelectorAll('.permission-row select').length >= 4)

  await abaAdmin(container, 'Campos e formulários')
  ok('campos lista os campos configuráveis', container.querySelectorAll('.field-config').length >= 5)

  await abaAdmin(container, 'Pranchas de comunicação')
  ok('pranchas mostra os símbolos', container.querySelectorAll('.prancha-simbolo').length >= 3)

  await abaAdmin(container, 'Versões do PDI')
  ok('versões explica o histórico', container.textContent.includes('versão'))

  await abaAdmin(container, 'Histórico administrativo')
  ok('histórico administrativo abre', container.textContent.includes('Histórico administrativo'))

  await abaAdmin(container, 'Configurações')
  ok('configurações mostra a exportação', container.textContent.includes('Exportar dados'))

  await navegar(container, 'Acompanhamento')
  ok('acompanhamento mostra a evolução', container.textContent.includes('Evolução'))

  await navegar(container, 'Construção do PDI')
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

console.log('\n3) Professor — a navegação é a das áreas do PDI')
{
  const container = await montar('Professor')
  const itens = itensDoMenu(container).map(item => item.textContent.trim())
  ok(
    'o menu lista as áreas do PDI (não as telas antigas)',
    itens.slice(0, 5).join('|') ===
      'Educando|Professor|Professor de AEE|Família|Profissionais de Apoio',
  )
  ok(
    'o professor entra direto na própria área',
    textoDoH1(container) === 'Área do Professor',
  )

  ok(
    'a área do professor tem as oito seções',
    container.querySelectorAll('.secao-bloco').length === 8,
  )
  ok(
    'área do professor é editável (tem campos com salvar)',
    container.querySelectorAll('textarea:not([readonly])').length >= 1 &&
      container.querySelectorAll('.save-answer').length >= 1,
  )

  await navegar(container, 'Família')
  ok('a área da família abre pela navegação', textoDoH1(container) === 'Área da Família')
  ok(
    'a área da família fica somente leitura para o professor',
    container.querySelectorAll('textarea[readonly]').length >= 1,
  )
  ok('a área da família não oferece salvar', container.querySelectorAll('.save-answer').length === 0)

  await navegar(container, 'Educando')
  ok('a área do educando tem as seis seções', container.querySelectorAll('.topico-card').length === 6)
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
  ok('o educando entra direto na própria área', textoDoH1(container) === 'Área do Educando')
  ok('educando vê os seis tópicos', container.querySelectorAll('.topico-card').length === 6)
  ok('educando pode escolher Descritivo ou Perguntas', container.textContent.includes('Descritivo'))

  await navegar(container, 'Professor')
  const grupoProfessor = container.querySelector('.area-group')
  ok(
    'educando lê a área do professor, mas não edita',
    Boolean(grupoProfessor) &&
      grupoProfessor.textContent.includes('Área do Professor') &&
      grupoProfessor.querySelectorAll('.save-answer').length === 0,
  )

  await navegar(container, 'Acessibilidade')
  ok('a tela de acessibilidade fica nas preferências', textoDoH1(container) === 'Acessibilidade')
}

console.log('\n6) Prancha de comunicação na área do educando')
{
  const container = await montar('Educando')
  const abrirPrancha = porTexto(container, '.area-group button, .topico-card button', 'Prancha de comunicação')
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
  const texto = container.querySelector('.topico-card textarea')
  ok('a frase composta vai para a resposta', Boolean(texto) && texto.value.length > 3)
}

console.log('\n7) Autorização da família e acesso dos Profissionais de Apoio')
{
  // sem autorização: o profissional de apoio não lê nenhuma área de outra pessoa
  const apoio = await montar('Profissional de Apoio')
  const itensApoio = itensDoMenu(apoio).map(item => item.textContent.trim())
  ok('o apoio entra na própria área', textoDoH1(apoio) === 'Profissionais de Apoio')
  ok(
    'sem autorização, nenhuma área de outra pessoa aparece no menu',
    !itensApoio.some(rotulo => /^(Educando|Professor|Professor de AEE|Família)$/.test(rotulo)),
  )

  // a família autoriza o compartilhamento da área do educando
  const familia = await montar('Família')
  ok('a família entra na própria área', textoDoH1(familia) === 'Área da Família')
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

  // com autorização vigente, o apoio passa a ver a área liberada no menu
  const apoioDepois = await montar('Profissional de Apoio')
  const itensDepois = itensDoMenu(apoioDepois).map(item => item.textContent.trim())
  ok('com autorização, a área liberada aparece no menu do apoio', itensDepois.includes('Educando'))
  ok(
    'o apoio continua sem a área da família',
    !itensDepois.includes('Família'),
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
