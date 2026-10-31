import {
  AREA_ESTUDANTE,
  AREAS_COLABORATIVAS,
  camposDaArea,
  TEMAS_ESTUDANTE,
  tituloDaArea,
  type Configuracao,
  type EntradaPdi,
} from './pdi-tipos'

/**
 * Exportação em planilha (CSV).
 *
 * Serve para a escola levar as respostas ao Excel/Google Sheets em reuniões de
 * conselho de classe: uma linha por resposta, com estudante, área, campo, texto,
 * quem escreveu e quando. O arquivo usa `;` como separador (padrão do Excel em
 * português) e começa com BOM para os acentos abrirem corretamente.
 */

function escapar(valor: string) {
  const limpo = valor.replace(/"/g, '""').replace(/\r?\n/g, ' ')
  return `"${limpo}"`
}

/** Nome legível de um campo, a partir da chave gravada. */
export function rotuloDoCampo(config: Configuracao, area: string, sectionKey: string): string {
  if (sectionKey.includes('#comentario#')) {
    const [campoId] = sectionKey.split('#comentario#')
    return `Comentário · ${rotuloDoCampo(config, area, campoId)}`
  }

  if (area === AREA_ESTUDANTE.chave) {
    const [chave, indice] = sectionKey.split('#')
    const tema = TEMAS_ESTUDANTE.find(item => item.chave === chave)
    if (!tema) return sectionKey
    if (indice === undefined) return tema.titulo
    return `${tema.titulo} — pergunta ${Number(indice) + 1}`
  }

  if (area === 'evolucao') return 'Acompanhamento · registro de evolução'
  if (area === 'proximos-passos') return 'Acompanhamento · próximos passos'

  const campo = camposDaArea(config, area).find(item => item.id === sectionKey)
  return campo?.titulo ?? sectionKey
}

function dataLegivel(iso: string) {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function csvDeRespostas(
  config: Configuracao,
  entradasPorEstudante: Record<string, EntradaPdi[]>,
) {
  const linhas: string[] = [
    ['Estudante', 'Turma', 'Escola', 'Área', 'Campo', 'Resposta', 'Quem escreveu', 'Atualizado em']
      .map(escapar)
      .join(';'),
  ]

  for (const estudante of config.estudantes) {
    const entradas = (entradasPorEstudante[estudante.id] ?? [])
      .filter(entrada => entrada.content.trim())
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))

    for (const entrada of entradas) {
      linhas.push(
        [
          estudante.nome,
          estudante.serie,
          estudante.escola,
          tituloDaArea(entrada.area),
          rotuloDoCampo(config, entrada.area, entrada.sectionKey),
          entrada.content,
          entrada.authorName,
          dataLegivel(entrada.updatedAt),
        ]
          .map(valor => escapar(valor ?? ''))
          .join(';'),
      )
    }
  }

  return `\uFEFF${linhas.join('\r\n')}`
}

/** Resumo por estudante (uma linha por PDI) — bom para a coordenação. */
export function csvResumoDaEscola(
  config: Configuracao,
  resumo: Record<string, { respondidos: number; total: number }>,
) {
  const linhas = [['Estudante', 'Turma', 'Escola', 'Campos respondidos', 'Campos previstos'].map(escapar).join(';')]
  for (const estudante of config.estudantes) {
    const dados = resumo[estudante.id]
    linhas.push(
      [estudante.nome, estudante.serie, estudante.escola, String(dados?.respondidos ?? 0), String(dados?.total ?? 0)]
        .map(escapar)
        .join(';'),
    )
  }
  return `\uFEFF${linhas.join('\r\n')}`
}

/** Áreas que entram no PDI (usado nos textos de ajuda). */
export const AREAS_DO_PDI = [AREA_ESTUDANTE.chave, ...AREAS_COLABORATIVAS.map(area => area.chave)]
