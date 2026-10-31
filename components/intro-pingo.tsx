'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import './intro-pingo.css'

/**
 * Animação de abertura do PDI Interativo — "Pingo Saltitante".
 *
 * A bolinha amarela (Pingo) atravessa a tela saltando até pousar no lugar do
 * ponto do "I" de PDI, enquanto as letras P e D balançam e as órbitas e
 * faíscas aparecem. No fim, uma onda verde sobe e entrega a tela de login.
 *
 * A composição é a mesma do protótipo `pdi-pingo-saltitante.html`; o que muda
 * aqui é a saída: em vez de recarregar uma URL externa, a onda cobre a cena e
 * a navegação acontece via router.
 */

/** Tempo da cena completa (a barra de progresso dura 4,8 s). */
const DURACAO_CENA = 4900
/** Tempo da onda verde cobrir a tela antes de trocar de rota. */
const DURACAO_ONDA = 900
/** Tempo encurtado para quem prefere menos movimento. */
const DURACAO_CENA_REDUZIDA = 900
const DURACAO_ONDA_REDUZIDA = 120

const prefereMenosMovimento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function IntroPingo() {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)
  const jaSaiu = useRef(false)
  const timers = useRef<number[]>([])

  const agendar = (callback: () => void, atraso: number) => {
    timers.current.push(window.setTimeout(callback, atraso))
  }

  const irParaLogin = useCallback(() => {
    if (jaSaiu.current) return
    jaSaiu.current = true
    setSaindo(true)

    const reduzido = prefereMenosMovimento()
    agendar(
      () => router.replace('/login'),
      reduzido ? DURACAO_ONDA_REDUZIDA : DURACAO_ONDA,
    )
  }, [router])

  useEffect(() => {
    agendar(irParaLogin, prefereMenosMovimento() ? DURACAO_CENA_REDUZIDA : DURACAO_CENA)
    const pendentes = timers.current
    return () => pendentes.forEach(window.clearTimeout)
  }, [irParaLogin])

  function aoClicarEmPular(evento: React.MouseEvent<HTMLAnchorElement>) {
    evento.preventDefault()
    irParaLogin()
  }

  return (
    <main className="intro-scene" data-saindo={saindo} aria-label="Abertura do PDI Interativo">
      <header className="intro-header">
        <div className="intro-logos">
          <img
            className="intro-uemg"
            src="/logo-uemg.png"
            alt="Universidade do Estado de Minas Gerais, Unidade Ibirité"
          />
          <span className="intro-divider" aria-hidden="true" />
          <img
            className="intro-profei"
            src="/logo-mestrado-inclusiva.png"
            alt="PROFEI, Mestrado em Educação Inclusiva"
          />
        </div>
        <a className="intro-skip" href="/login" onClick={aoClicarEmPular}>
          Ir para o login →
        </a>
      </header>

      <section className="intro-center">
        <div className="intro-composition">
          <div className="intro-orbit" aria-hidden="true" />
          <div className="intro-orbit intro-second" aria-hidden="true" />

          <span className="intro-spark intro-s1" aria-hidden="true" />
          <span className="intro-spark intro-s2" aria-hidden="true" />
          <span className="intro-spark intro-s3" aria-hidden="true" />
          <span className="intro-spark intro-s4" aria-hidden="true" />
          <span className="intro-small-star" aria-hidden="true">
            ✦
          </span>

          <div className="intro-icon" aria-hidden="true">
            <svg viewBox="0 0 76 76" fill="none">
              <circle cx="38" cy="38" r="36" fill="#fff" />
              <circle cx="28" cy="28" r="7" fill="#31AE78" />
              <circle cx="49" cy="28" r="7" fill="#F5C72C" />
              <path d="M16 49c0-7 5-12 12-12s12 5 12 12v6H16v-6Z" fill="#31589B" />
              <path d="M37 49c0-7 5-12 12-12s12 5 12 12v6H37v-6Z" fill="#EF5C3C" />
              <path
                d="M23 62c9 6 21 6 30 0"
                stroke="#b6ddbc"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="intro-title" aria-label="PDI">
            <span className="intro-letter intro-letter-p">P</span>
            <span className="intro-letter intro-letter-d">D</span>
            <span className="intro-big-i" aria-hidden="true">
              <span className="intro-big-i-stem" />
              <i className="intro-jump-dot" />
            </span>
          </h1>

          <p className="intro-interativo">Interativo</p>
        </div>
      </section>

      <footer className="intro-footer">
        <div className="intro-footer-label">
          Juntos em cada
          <br />
          descoberta
        </div>
        <div className="intro-loading" aria-live="polite">
          Abrindo o login…
          <div className="intro-progress" aria-hidden="true" />
        </div>
      </footer>

      <span className="intro-sr">
        A página de login será aberta automaticamente em alguns segundos. Você também pode usar o
        link “Ir para o login”.
      </span>

      <div className={`intro-wave${saindo ? ' intro-wave--on' : ''}`} aria-hidden="true">
        <span className="intro-wave-layer intro-wave-1" />
        <span className="intro-wave-layer intro-wave-2" />
        <span className="intro-wave-layer intro-wave-3" />
      </div>
    </main>
  )
}
