/**
 * Recursos de voz do PDI.
 *
 * - Leitura em voz alta: Web Speech API (`speechSynthesis`) — funciona em
 *   Chrome, Edge, Safari e Firefox mais recentes.
 * - Preenchimento por voz: `SpeechRecognition` — disponível em Chrome/Edge
 *   (Android e desktop) e no Safari recente. Quando não existe, a interface
 *   esconde/desabilita o botão em vez de falhar silenciosamente.
 */

type ResultadoFala = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type Reconhecedor = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((evento: ResultadoFala) => void) | null
  onerror: ((evento: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type JanelaComFala = Window & {
  SpeechRecognition?: new () => Reconhecedor
  webkitSpeechRecognition?: new () => Reconhecedor
}

export function suportaLeituraEmVozAlta() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function suportaDitado() {
  if (typeof window === 'undefined') return false
  const janela = window as JanelaComFala
  return Boolean(janela.SpeechRecognition ?? janela.webkitSpeechRecognition)
}

let vozEscolhida: SpeechSynthesisVoice | null = null

function escolherVoz() {
  if (vozEscolhida) return vozEscolhida
  if (!suportaLeituraEmVozAlta()) return null
  const vozes = window.speechSynthesis.getVoices()
  vozEscolhida =
    vozes.find(voz => voz.lang?.toLowerCase().startsWith('pt-br')) ??
    vozes.find(voz => voz.lang?.toLowerCase().startsWith('pt')) ??
    null
  return vozEscolhida
}

/** Fala um texto em português, interrompendo o que estiver tocando. */
export function falar(texto: string, velocidade = 1) {
  if (!suportaLeituraEmVozAlta() || !texto.trim()) return false
  const sintese = window.speechSynthesis
  sintese.cancel()
  const utterance = new SpeechSynthesisUtterance(texto)
  utterance.lang = 'pt-BR'
  utterance.rate = Math.min(2, Math.max(0.5, velocidade))
  const voz = escolherVoz()
  if (voz) utterance.voice = voz
  sintese.speak(utterance)
  return true
}

export function pararFala() {
  if (!suportaLeituraEmVozAlta()) return
  window.speechSynthesis.cancel()
}

export function pausarFala() {
  if (!suportaLeituraEmVozAlta()) return
  window.speechSynthesis.pause()
}

export function retomarFala() {
  if (!suportaLeituraEmVozAlta()) return
  window.speechSynthesis.resume()
}

export function falandoAgora() {
  if (!suportaLeituraEmVozAlta()) return false
  return window.speechSynthesis.speaking && !window.speechSynthesis.paused
}

export type DitadoControlado = {
  iniciar: () => void
  parar: () => void
}

/**
 * Cria um ditado (fala → texto). Cada trecho reconhecido é entregue em
 * `aoTexto`; `aoFinalizar` é chamado quando o reconhecimento termina.
 */
export function criarDitado(
  aoTexto: (texto: string) => void,
  aoFinalizar?: () => void,
  aoErro?: (mensagem: string) => void,
): DitadoControlado | null {
  if (!suportaDitado()) return null
  const janela = window as JanelaComFala
  const Construtor = janela.SpeechRecognition ?? janela.webkitSpeechRecognition
  if (!Construtor) return null

  const reconhecedor = new Construtor()
  reconhecedor.lang = 'pt-BR'
  reconhecedor.continuous = true
  reconhecedor.interimResults = false

  reconhecedor.onresult = evento => {
    const resultado = evento.results?.[evento.results.length - 1]
    const transcricao = resultado?.[0]?.transcript
    if (transcricao) aoTexto(transcricao)
  }
  reconhecedor.onerror = () => {
    aoErro?.('Não foi possível ouvir. Verifique o microfone e a permissão do navegador.')
    aoFinalizar?.()
  }
  reconhecedor.onend = () => {
    aoFinalizar?.()
  }

  return {
    iniciar: () => {
      try {
        reconhecedor.start()
      } catch {
        aoErro?.('O microfone já está em uso.')
      }
    },
    parar: () => {
      try {
        reconhecedor.stop()
      } catch {
        // já parado
      }
    },
  }
}
