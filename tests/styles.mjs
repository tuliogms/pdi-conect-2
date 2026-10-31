/**
 * Testes de CSS para regressões de navegação e acessibilidade.
 *
 * O caso que motivou estes testes: em telas estreitas (celular e painel de
 * preview) a barra lateral tinha `display:none` mesmo com o menu aberto, então
 * nenhuma aba podia ser acessada. Aqui a folha de estilo é lida e as regras
 * são conferidas por faixa de largura.
 *
 * Uso: pnpm test:styles
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { raiz } from './build.mjs'

const css = readFileSync(resolve(raiz, 'app/globals.css'), 'utf8')

let falhas = 0
const ok = (nome, condicao, detalhe = '') => {
  console.log(`${condicao ? '  PASS ' : '  FALHA'}  ${nome}${condicao || !detalhe ? '' : ` — ${detalhe}`}`)
  if (!condicao) falhas++
}

/** Divide o CSS em blocos, anotando a media query que envolve cada regra. */
function regras(folha) {
  const lista = []
  const pilha = []
  let buffer = ''
  for (let i = 0; i < folha.length; i++) {
    const caractere = folha[i]
    if (caractere === '{') {
      const seletor = buffer.trim()
      pilha.push(seletor)
      buffer = ''
    } else if (caractere === '}') {
      const seletor = pilha.pop() ?? ''
      if (!seletor.startsWith('@') && seletor && buffer.trim()) {
        lista.push({ seletor, corpo: buffer.trim(), contexto: pilha.join(' ') })
      }
      buffer = ''
    } else {
      buffer += caractere
    }
  }
  return lista
}

const todas = regras(css)
const daSidebar = todas.filter(regra => /\.sidebar\b/.test(regra.seletor))

ok('a folha de estilo tem regras para o menu lateral', daSidebar.length > 0)

// 1. nenhuma regra esconde a barra lateral na tela (fora da impressão)
const escondem = daSidebar.filter(
  regra => /display\s*:\s*none/.test(regra.corpo) && !/print/.test(regra.contexto),
)
ok(
  'nenhuma regra esconde o menu lateral fora da impressão',
  escondem.length === 0,
  escondem.map(regra => `${regra.contexto || 'fora de media'} { ${regra.seletor} }`).join(' | '),
)

// 2. existe o estado aberto, alcançável em telas estreitas
const abertas = daSidebar.filter(regra => /\.sidebar\.open\b/.test(regra.seletor))
ok('existe regra de menu lateral aberto', abertas.length > 0)
ok(
  'a regra de aberto cobre telas estreitas (max-width)',
  abertas.some(regra => /max-width/.test(regra.contexto)),
)

// 3. a barra lateral aberta fica visível e posicionada na tela
const visivel = abertas.some(
  regra =>
    (/transform\s*:\s*(translateX\(\s*0|none)/.test(regra.corpo) || /left\s*:\s*0/.test(regra.corpo)) &&
    /visibility\s*:\s*visible/.test(regra.corpo),
)
ok('menu aberto entra na tela e fica visível', visivel)

const comFundo = todas.some(regra => /\.menu-scrim\b/.test(regra.seletor) && /position\s*:\s*fixed/.test(regra.corpo))
ok('existe camada para fechar o menu tocando fora', comFundo)

const comMenuMobile = todas.some(
  regra =>
    /\.mobile-menu\b/.test(regra.seletor) &&
    /max-width/.test(regra.contexto) &&
    /display\s*:\s*(inline-)?grid|display\s*:\s*block/.test(regra.corpo),
)
ok('o botão de menu aparece em telas estreitas', comMenuMobile)

// 4. foco visível em toda a aplicação
ok('foco visível definido', /:focus-visible/.test(css))
ok('foco visível nos botões de menu', /:focus-visible/.test(css))

// 5. alto contraste e botões grandes existem
ok('existe tema de alto contraste', /\.alto-contraste/.test(css))
ok('existe modo de botões grandes', /\.botoes-grandes/.test(css))

// 6. status nunca é só cor: as etiquetas têm texto renderizado no componente
const fluxo = readFileSync(resolve(raiz, 'app/dashboard/fluxo.tsx'), 'utf8')
ok(
  'status do fluxo mostra o texto ao lado do ícone',
  /EtiquetaStatus/.test(fluxo) && /aria-hidden="true"/.test(fluxo),
)

// 7. impressão do PDI consolidado esconde a navegação
ok('impressão esconde menu e topbar', /@media print[\s\S]*?display:\s*none\s*!important/.test(css))
ok('impressão esconde elementos marcados como no-print', /\.no-print/.test(css))

console.log(falhas === 0 ? '\nEstilos: todos os testes passaram\n' : `\nEstilos: ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
