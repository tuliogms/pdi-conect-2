/**
 * Verificação ponta a ponta contra o banco de verdade.
 * Monta a interface no jsdom, mas as chamadas de API vão para o servidor
 * de desenvolvimento (http://127.0.0.1:3000), que fala com o Postgres.
 */
import { JSDOM } from 'jsdom'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compilar, raiz } from './build.mjs'

const require = createRequire(import.meta.url)
const bundle = await compilar({
  entrada: 'tests/entry.tsx',
  arquivo: 'ui-bundle.cjs',
  jsx: true,

})

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://127.0.0.1:3000/dashboard',
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
global.requestAnimationFrame = (cb) => setTimeout(cb, 0)
global.cancelAnimationFrame = (id) => clearTimeout(id)
global.IS_REACT_ACT_ENVIRONMENT = true
global.URL.createObjectURL = () => 'blob:teste'
global.URL.revokeObjectURL = () => {}
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}
window.localStorage.clear()

// fetch real, resolvendo as URLs relativas do app
const fetchNativo = globalThis.fetch
global.fetch = (url, opcoes) =>
  fetchNativo(url.startsWith('http') ? url : `http://127.0.0.1:3000${url}`, opcoes)

const React = require(resolve(raiz, 'node_modules/react'))
const { act } = React
const app = require(bundle)
const espera = (ms = 120) => new Promise((r) => setTimeout(r, ms))

let falhas = 0
const ok = (nome, condicao) => {
  console.log(`${condicao ? '  PASS ' : '  FALHA'}  ${nome}`)
  if (!condicao) falhas++
}

const container = window.document.createElement('div')
window.document.body.appendChild(container)
await act(async () => {
  await app.montar('Usuário Mestre', container)
})
await act(async () => {
  await espera(600)
})

ok('a barra lateral avisa que está gravando no banco', container.textContent.includes('banco de dados'))
ok('o modo local não aparece', !container.textContent.includes('Modo local'))

// cadastro pela interface
const clicar = async (el) => {
  await act(async () => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
  await act(async () => {
    await espera(400)
  })
}
const digitar = async (el, valor) => {
  const proto =
    el instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
  await act(async () => {
    setter.call(el, valor)
    el.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  await act(async () => {
    await espera(80)
  })
}

const menu = (rotulo) =>
  [...container.querySelectorAll('.sidebar button.side-link')].find((b) => b.textContent.trim() === rotulo)

await clicar(menu('Educandos'))
const abrir = [...container.querySelectorAll('button')].find((b) => /Cadastrar educando/i.test(b.textContent))
await clicar(abrir)
const form = container.querySelector('form')
const inputs = [...form.querySelectorAll('input')]
await digitar(inputs[0], 'Ana do Banco')
await digitar(inputs[1], '3º ano C')
await digitar(inputs[2], 'Escola Municipal')
await clicar(form.querySelector('button[type="submit"]'))
await act(async () => {
  await espera(700)
})
ok('o educando aparece na lista', container.textContent.includes('Ana do Banco'))

const resposta = await fetchNativo('http://127.0.0.1:3000/api/config')
const dados = await resposta.json()
ok('o servidor devolve a configuração do banco', resposta.status === 200)
ok(
  'o educando cadastrado na tela foi gravado no Postgres',
  (dados.config?.estudantes ?? []).some((e) => e.nome === 'Ana do Banco'),
)

console.log(falhas === 0 ? '\nBanco: tudo certo\n' : `\nBanco: ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
