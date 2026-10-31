'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Contrast, Ear, Gauge, Mic, Pause, Play, Square, Type, Volume2 } from 'lucide-react'
import {
  ACESSIBILIDADE_PADRAO,
  gravarAcessibilidade,
  lerAcessibilidade,
  type PreferenciasAcessibilidade,
} from '@/lib/dados'
import {
  falandoAgora,
  falar,
  pararFala,
  pausarFala,
  retomarFala,
  suportaDitado,
  suportaLeituraEmVozAlta,
} from '@/lib/fala'

export type ControleAcessibilidade = PreferenciasAcessibilidade & {
  atualizar: (mudanca: Partial<PreferenciasAcessibilidade>) => void
  /** Lê um texto respeitando a preferência de leitura em voz alta. */
  ler: (texto: string) => void
  suportaVoz: boolean
  suportaMicrofone: boolean
}

export function useAcessibilidade(): ControleAcessibilidade {
  const [preferencias, setPreferencias] = useState<PreferenciasAcessibilidade>(ACESSIBILIDADE_PADRAO)
  const [suportaVoz, setSuportaVoz] = useState(false)
  const [suportaMicrofone, setSuportaMicrofone] = useState(false)

  useEffect(() => {
    setPreferencias(lerAcessibilidade())
    setSuportaVoz(suportaLeituraEmVozAlta())
    setSuportaMicrofone(suportaDitado())
  }, [])

  const atualizar = useCallback((mudanca: Partial<PreferenciasAcessibilidade>) => {
    setPreferencias(atual => {
      const proximo = { ...atual, ...mudanca }
      gravarAcessibilidade(proximo)
      if (mudanca.leituraEmVozAlta === false) pararFala()
      return proximo
    })
  }, [])

  const ler = useCallback(
    (texto: string) => {
      if (!preferencias.leituraEmVozAlta) return
      falar(texto, preferencias.velocidadeVoz)
    },
    [preferencias.leituraEmVozAlta, preferencias.velocidadeVoz],
  )

  return { ...preferencias, atualizar, ler, suportaVoz, suportaMicrofone }
}

/**
 * Tela de acessibilidade (portfólio, seção 5): leitura em voz alta,
 * preenchimento por voz, velocidade, contraste e botões grandes.
 */
export function PainelAcessibilidade({ controle }: { controle: ControleAcessibilidade }) {
  const [falando, setFalando] = useState(false)
  const [pausado, setPausado] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timer.current = setInterval(() => {
      setFalando(falandoAgora())
      setPausado(typeof window !== 'undefined' && window.speechSynthesis?.paused === true)
    }, 700)
    return () => {
      if (timer.current) clearInterval(timer.current)
      pararFala()
    }
  }, [])

  const exemplo =
    'Olá! Esta é a leitura em voz alta do PDI. Toque em ouvir para escutar cada pergunta, ' +
    'instrução e campo antes de responder.'

  function ouvir() {
    if (!controle.suportaVoz) return
    falar(exemplo, controle.velocidadeVoz)
    setFalando(true)
  }

  return (
    <section>
      <div className="welcome-row admin-heading">
        <div>
          <p className="eyebrow">PDI Interativo</p>
          <h1>Acessibilidade</h1>
          <p className="muted">
            Escolha como você prefere interagir com o aplicativo. Você pode ativar ou desativar
            estes recursos quando quiser.
          </p>
        </div>
      </div>

      <div className="acessibilidade-grid">
        <article className="acess-card">
          <h2>
            <Volume2 aria-hidden="true" /> Leitura em voz alta
          </h2>
          <p className="muted">
            O aplicativo lê em voz alta os textos, as perguntas e as instruções de cada campo.
          </p>

          <label className="switch-row">
            <span>
              <strong>Ler em voz alta</strong>
              <small>O app lê os textos da tela</small>
            </span>
            <input
              type="checkbox"
              checked={controle.leituraEmVozAlta}
              onChange={evento => controle.atualizar({ leituraEmVozAlta: evento.target.checked })}
              disabled={!controle.suportaVoz}
            />
          </label>

          <div className="speed-row">
            <label htmlFor="velocidade-voz">
              <Gauge aria-hidden="true" /> Velocidade da voz
            </label>
            <input
              id="velocidade-voz"
              type="range"
              min={0.7}
              max={1.5}
              step={0.1}
              value={controle.velocidadeVoz}
              onChange={evento =>
                controle.atualizar({ velocidadeVoz: Number(evento.target.value) })
              }
              disabled={!controle.suportaVoz}
            />
            <output>{controle.velocidadeVoz.toFixed(1)}x</output>
          </div>

          <div className="audio-controls">
            <button
              type="button"
              className="primary-btn"
              onClick={ouvir}
              disabled={!controle.suportaVoz}
            >
              <Play aria-hidden="true" /> Reproduzir
            </button>
            <button
              type="button"
              className="outline-btn"
              onClick={() => {
                if (pausado) {
                  retomarFala()
                  setPausado(false)
                } else {
                  pausarFala()
                  setPausado(true)
                }
              }}
              disabled={!controle.suportaVoz || !falando}
            >
              <Pause aria-hidden="true" /> {pausado ? 'Retomar' : 'Pausar'}
            </button>
            <button
              type="button"
              className="outline-btn"
              onClick={() => {
                pararFala()
                setFalando(false)
                setPausado(false)
              }}
              disabled={!controle.suportaVoz}
            >
              <Square aria-hidden="true" /> Parar
            </button>
          </div>

          {!controle.suportaVoz && (
            <p className="aviso-suporte" role="note">
              Este navegador não oferece leitura em voz alta. Os demais recursos continuam
              disponíveis.
            </p>
          )}
        </article>

        <article className="acess-card">
          <h2>
            <Mic aria-hidden="true" /> Preenchimento por voz
          </h2>
          <p className="muted">
            Com o recurso ativado, cada campo de resposta ganha o botão de microfone para você
            falar em vez de digitar.
          </p>

          <label className="switch-row">
            <span>
              <strong>Responder por voz (fala em texto)</strong>
              <small>O microfone aparece nos campos de resposta</small>
            </span>
            <input
              type="checkbox"
              checked={controle.ditado}
              onChange={evento => controle.atualizar({ ditado: evento.target.checked })}
              disabled={!controle.suportaMicrofone}
            />
          </label>

          {!controle.suportaMicrofone && (
            <p className="aviso-suporte" role="note">
              Este navegador não oferece ditado por voz. A digitação continua funcionando
              normalmente.
            </p>
          )}
        </article>

        <article className="acess-card">
          <h2>
            <Contrast aria-hidden="true" /> Contraste e tamanho
          </h2>
          <p className="muted">
            O contraste segue a WCAG 2.1 AA. As informações nunca dependem apenas da cor.
          </p>

          <label className="switch-row">
            <span>
              <strong>Alto contraste</strong>
              <small>Fundo claro com texto mais escuro e bordas visíveis</small>
            </span>
            <input
              type="checkbox"
              checked={controle.altoContraste}
              onChange={evento => controle.atualizar({ altoContraste: evento.target.checked })}
            />
          </label>

          <label className="switch-row">
            <span>
              <strong>Botões e textos maiores</strong>
              <small>Áreas de toque ampliadas, como recomenda a WCAG</small>
            </span>
            <input
              type="checkbox"
              checked={controle.botoesGrandes}
              onChange={evento => controle.atualizar({ botoesGrandes: evento.target.checked })}
            />
          </label>
        </article>

        <article className="acess-card">
          <h2>
            <Ear aria-hidden="true" /> Compatibilidade
          </h2>
          <ul className="compat-list">
            <li>
              <Check aria-hidden="true" /> Leitores de tela: <strong>TalkBack</strong> (Android) e{' '}
              <strong>VoiceOver</strong> (iOS) — a interface usa títulos, rótulos e botões com
              texto.
            </li>
            <li>
              <Check aria-hidden="true" /> Navegação por teclado: todos os controles são acessíveis
              com Tab e o foco é visível.
            </li>
            <li>
              <Check aria-hidden="true" /> Cada status do PDI aparece com texto, ícone e cor.
            </li>
            <li>
              <Check aria-hidden="true" />{' '}
              <Type aria-hidden="true" /> O botão “Acessibilidade” na barra superior também aumenta
              o tamanho do texto.
            </li>
          </ul>
        </article>
      </div>
    </section>
  )
}
