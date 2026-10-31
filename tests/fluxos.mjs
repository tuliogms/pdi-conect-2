/**
 * Testes dos fluxos que a escola vai usar de verdade: escrever e salvar uma
 * resposta, trocar o formato de resposta, cadastrar estudante e usuário,
 * ajustar permissão, criar campo, registrar evolução e alternar acessibilidade.
 *
 * Tudo roda no mesmo ambiente dos testes de navegação (jsdom + React real),
 * gravando no armazenamento local do "navegador" de teste.
 *
 * Uso: pnpm test:fluxos
 */
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { compilar, raiz } from './build.mjs'
import { configuracaoComEquipe } from './massa.mjs'

const require = createRequire(import.meta.url)

const bundle = await compilar({ entrada: 'tests/entry.tsx', arquivo: 'ui-bundle.cjs', jsx: true })
const lib = await compilar({ entrada: 'tests/lib-entry.ts', arquivo: 'lib.cjs' })
const tipos = require(lib)
const config = configuracaoComEquipe(tipos.pdi)
const estudanteId = config.estudantes[0].id
// Como o gestor faria em "Campos e formulários": libera comentário na rotina da família
config.campos.familia[0].acessoOutros = 'Comentar'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000/dashboard',
  pretendToBeVisual: true,
})
const { window } = dom
global.window = window
global.document = window.document
global.HTMLElement = window.HTMLElement
global.HTMLInputElement = window.HTMLInputElement
global.HTMLTextAreaElement = window.HTMLTextAreaElement
global.HTMLSelectElement = window.HTMLSelectElement
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
global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) })

const React = require(resolve(raiz, 'node_modules/react'))
const { act } = React
const app = require(bundle)

let falhas = 0
const ok = (nome, condicao) => {
  console.log(`${condicao ? '  PASS ' : '  FALHA'}  ${nome}`)
  if (!condicao) falhas++
}
const espera = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms))

const erros = []
const consoleErrorOriginal = console.error
console.error = (...argumentos) => {
  erros.push(argumentos.map(a => (a && a.message) || String(a)).join(' '))
}

async function montar(perfil) {
  const container = window.document.createElement('div')
  window.document.body.appendChild(container)
  await act(async () => {
    await app.montar(perfil, container)
  })
  await act(async () => {
    await espera(160)
  })
  return container
}

async function clicar(elemento) {
  assert.ok(elemento, 'elemento para clicar não existe')
  await act(async () => {
    elemento.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
  await act(async () => {
    await espera(140)
  })
}

/** Escreve em um input/textarea controlado pelo React. */
async function digitar(elemento, valor) {
  const proto =
    elemento instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const definir = Object.getOwnPropertyDescriptor(proto, 'value').set
  await act(async () => {
    definir.call(elemento, valor)
    elemento.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  await act(async () => {
    await espera(40)
  })
}

async function escolher(elemento, valor) {
  const definir = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
  await act(async () => {
    definir.call(elemento, valor)
    elemento.dispatchEvent(new window.Event('change', { bubbles: true }))
  })
  await act(async () => {
    await espera(80)
  })
}

async function navegar(container, rotulo) {
  const botao = [...container.querySelectorAll('.sidebar button.side-link')].find(
    item => item.textContent.trim() === rotulo,
  )
  assert.ok(botao, `menu sem "${rotulo}"`)
  await clicar(botao)
}

const porTexto = (raiz, seletor, texto) =>
  [...raiz.querySelectorAll(seletor)].find(item => item.textContent.includes(texto))

const configAtual = () => JSON.parse(window.localStorage.getItem('pdi.config.v2') ?? '{}')
const entradasDe = id => JSON.parse(window.localStorage.getItem('pdi.entradas.v1') ?? '{}')[id] ?? []
const entrada = (id, area, sectionKey) =>
  entradasDe(id).find(item => item.area === area && item.sectionKey === sectionKey)

// ---------------------------------------------------------------------------
console.log('\n1) Educando escreve, salva e troca para perguntas')
{
  const container = await montar('Educando')
  await navegar(container, 'Meu PDI')

  const primeiroTopico = container.querySelector('.topico-card')
  const campo = primeiroTopico.querySelector('textarea')
  await digitar(campo, 'Gosto de música e de jogos de tabuleiro.')
  const salvar = primeiroTopico.querySelector('.save-answer')
  ok('botão Salvar habilita depois de digitar', salvar && !salvar.disabled)
  await clicar(salvar)

  const salva = entrada(estudanteId, 'estudante', 'meu-perfil')
  ok('resposta gravada na área do estudante', salva?.content.includes('jogos de tabuleiro'))
  ok('resposta guarda quem escreveu', Boolean(salva?.authorName))

  // troca o formato de resposta para perguntas, no primeiro tópico
  const botaoPerguntas = porTexto(primeiroTopico, '.modo-toggle button', 'Perguntas')
  await clicar(botaoPerguntas)
  ok(
    'formato Perguntas fica gravado na configuração',
    Object.keys(configAtual().modos ?? {}).some(chave => chave.includes('meu-perfil')),
  )
  ok(
    'perguntas aparecem no lugar do texto único',
    primeiroTopico.querySelectorAll('.perguntas-lista textarea').length >= 2,
  )

  // tema novo: "Meus objetivos" continua em Descritivo
  const topicoObjetivos = porTexto(container, '.topico-card', 'Meus objetivos')
  const campoObjetivos = topicoObjetivos.querySelector('textarea')
  await digitar(campoObjetivos, 'Melhorar a leitura em voz alta.')
  await clicar(topicoObjetivos.querySelector('.save-answer'))
  ok(
    'segunda resposta gravada no tema certo',
    entrada(estudanteId, 'estudante', 'meus-objetivos')?.content.includes('leitura em voz alta'),
  )
  ok("progresso do estudante conta os tópicos respondidos", container.textContent.includes('2/6 seções respondidas'))
}

// ---------------------------------------------------------------------------
console.log('\n2) Professor preenche a área dele e comenta a da família')
{
  const container = await montar('Professor')
  await navegar(container, 'Meu PDI')

  const grupoProfessor = container.querySelector('.aba-painel .area-group')
  ok(
    'área do professor abre primeiro para o professor',
    Boolean(grupoProfessor) && grupoProfessor.textContent.includes('Área do Professor'),
  )

  const campoObservacoes = [...grupoProfessor.querySelectorAll('.answer-block')].find(bloco =>
    bloco.textContent.includes('Como participa das aulas'),
  )
  await digitar(campoObservacoes.querySelector('textarea'), 'Participa bem das atividades em grupo.')
  await clicar(campoObservacoes.querySelector('.save-answer'))
  const salva = entrada(estudanteId, 'professor', 'observacoes-pedagogicas')
  ok('observação pedagógica gravada', salva?.content.includes('atividades em grupo'))
  ok('resposta da equipe é identificada pelo autor', Boolean(salva?.authorName))

  // abre a aba da família para comentar a rotina
  const abaFamilia = [...container.querySelectorAll('.pdi-abas .area-tab')].find(aba =>
    aba.textContent.includes('Família'),
  )
  await clicar(abaFamilia)
  const grupoFamilia = container.querySelector('.aba-painel .area-group')
  ok('as áreas da equipe abrem na mesma tela', Boolean(grupoFamilia))
  const campoRotina = [...grupoFamilia.querySelectorAll('.answer-block')].find(bloco =>
    /Como é a rotina/i.test(bloco.textContent),
  )
  const abrirComentario = porTexto(campoRotina, 'button', 'Adicionar observação')
  ok('professor pode comentar a área da família', Boolean(abrirComentario))
  await clicar(abrirComentario)
  const formComentario = campoRotina.querySelector('.comentario-form')
  ok('campo de comentário abre', Boolean(formComentario))
  await digitar(formComentario.querySelector('input'), 'A rotina em casa ajuda muito.')
  await clicar(formComentario.querySelector('button[type="submit"]'))
  ok(
    'comentário fica registrado na resposta da família',
    entradasDe(estudanteId).some(
      item => item.area === 'familia' && item.sectionKey.startsWith('rotina#comentario#'),
    ),
  )
}

// ---------------------------------------------------------------------------
console.log('\n3) Administração cadastra estudante e usuário')
{
  const container = await montar('Usuário Mestre')
  await navegar(container, 'Educandos')

  const abrirCadastro = [...container.querySelectorAll('button')].find(botao =>
    /Novo educando|Cadastrar educando/i.test(botao.textContent),
  )
  ok('botão de cadastrar educando existe', Boolean(abrirCadastro))
  await clicar(abrirCadastro)

  const formulario = container.querySelector('form')
  ok('formulário de educando abre', Boolean(formulario))
  const campos = [...formulario.querySelectorAll('input')]
  await digitar(campos[0], 'Ana Beatriz')
  await digitar(campos[1], '4º ano B')
  await digitar(campos[2], 'Escola Municipal Paulo Freire')
  await clicar(formulario.querySelector('button[type="submit"]'))

  const depois = configAtual()
  ok('educando novo entra na configuração', depois.estudantes.length === 2)
  ok(
    'educando novo aparece na lista',
    container.textContent.includes('Ana Beatriz'),
  )

  await navegar(container, 'Usuários')
  const abrirUsuario = [...container.querySelectorAll('button')].find(botao =>
    /Cadastrar usuário/i.test(botao.textContent),
  )
  ok('botão de cadastrar usuário existe', Boolean(abrirUsuario))
  await clicar(abrirUsuario)
  const formUsuario = container.querySelector('form')
  const inputs = [...formUsuario.querySelectorAll('input')]
  await digitar(inputs[0], 'Professora Carla')
  await digitar(inputs[1], 'carla@escola.br')
  const selects = [...formUsuario.querySelectorAll('select')]
  await escolher(selects[0], 'Professor')
  if (selects[1]) await escolher(selects[1], depois.estudantes[1].id)
  await clicar(formUsuario.querySelector('button[type="submit"]'))
  ok(
    'usuário novo entra na configuração',
    configAtual().usuarios.some(usuario => usuario.nome === 'Professora Carla'),
  )
}

// ---------------------------------------------------------------------------
console.log('\n4) Administração ajusta permissão e cria campo')
{
  const container = await montar('Usuário Mestre')
  await navegar(container, 'Permissões de acesso')

  const linhaApoio = [...container.querySelectorAll('.permission-row')].find(linha =>
    /Apoio/i.test(linha.textContent),
  )
  ok('matriz mostra a linha dos profissionais de apoio', Boolean(linhaApoio))
  await escolher(linhaApoio.querySelector('select'), 'Sem acesso')
  const salvar = porTexto(container, 'button', 'Salvar permissões')
  await clicar(salvar)
  ok(
    'permissão é gravada para a pessoa escolhida',
    Object.values(configAtual().permissoes ?? {}).includes('Sem acesso'),
  )

  await navegar(container, 'Campos e formulários')
  const campoNovo = porTexto(container, 'button', 'Novo campo') ?? porTexto(container, 'button', 'Adicionar campo')
  ok('botão de criar campo existe', Boolean(campoNovo))
  await clicar(campoNovo)
  const formCampo = container.querySelector('form')
  const entradaTitulo = formCampo.querySelector('input')
  await digitar(entradaTitulo, 'Participação na biblioteca')
  await clicar(formCampo.querySelector('button[type="submit"]'))
  const campos = configAtual().campos ?? {}
  ok(
    'campo novo entra na configuração',
    Object.values(campos).some(lista => lista.some(campo => campo.titulo === 'Participação na biblioteca')),
  )
  ok('campo novo aparece na lista', container.textContent.includes('Participação na biblioteca'))
}

// ---------------------------------------------------------------------------
console.log('\n5) Acompanhamento registra evolução e próximos passos')
{
  const container = await montar('Usuário Mestre')
  await navegar(container, 'Acompanhamento')

  const cinco = [...container.querySelectorAll('.escala-opcoes button')].find(botao =>
    botao.textContent.trim() === '5',
  )
  ok('escala de 1 a 5 aparece', Boolean(cinco))
  await clicar(cinco)
  await clicar(porTexto(container, 'button', 'Registrar'))
  ok(
    'registro de evolução é gravado',
    entradasDe(estudanteId).some(item => item.area === 'evolucao'),
  )

  ok('gráfico de evolução aparece depois do registro', Boolean(container.querySelector('svg.grafico')))

  const proximos = container.querySelector('.proximos-card textarea')
  ok('campo de próximos passos existe', Boolean(proximos))
  await digitar(proximos, 'Ampliar o tempo de leitura em sala.')
  await clicar(container.querySelector('.proximos-card .save-answer'))
  ok(
    'próximos passos são gravados',
    entradasDe(estudanteId).some(item => item.area === 'proximos-passos'),
  )
}

// ---------------------------------------------------------------------------
console.log('\n6) Acessibilidade grava as preferências')
{
  const container = await montar('Educando')
  await navegar(container, 'Acessibilidade')
  const caixas = [...container.querySelectorAll('input[type="checkbox"]')]
  await clicar(caixas[2])
  const preferencias = JSON.parse(window.localStorage.getItem('pdi.acessibilidade.v1') ?? '{}')
  ok('alto contraste fica salvo', preferencias.altoContraste === true)
  ok('app recebe a classe de contraste', container.querySelector('main.app-shell').classList.contains('alto-contraste'))
}

console.log('\n7) Nenhum erro de console durante os fluxos')
ok(
  erros.length === 0 ? 'console limpo' : `console com ${erros.length} erro(s): ${erros[0]?.slice(0, 200)}`,
  erros.length === 0,
)

console.error = consoleErrorOriginal
console.log(falhas === 0 ? '\nFluxos: todos os testes passaram\n' : `\nFluxos: ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
