import {
  AREA_EVOLUCAO,
  AREA_PROXIMOS_PASSOS,
  CHAVE_PROXIMOS_PASSOS,
  configVazia,
  camposPadraoDaArea,
  INDICADORES_PADRAO,
  novoId,
  type CampoConfig,
  type Configuracao,
  type EntradaPdi,
  type ModoPersistencia,
  type ModoResposta,
  type NivelAcesso,
  type RegistroEvolucao,
} from './pdi-tipos'

/**
 * Camada de dados do navegador.
 *
 * O que a pessoa digita precisa sobreviver a um recarregar da página. Com banco
 * configurado (`DATABASE_URL`), `/api/config` e `/api/pdi` gravam no PostgreSQL.
 * Sem banco, a mesma informação é gravada no armazenamento local do navegador e
 * a interface avisa em qual modo está trabalhando.
 */

const CHAVE_CONFIG = 'pdi.config.v2'
const CHAVE_CONFIG_ANTIGA = 'pdi.config.v1'
const CHAVE_ENTRADAS = 'pdi.entradas.v1'
const CHAVE_ACESSIBILIDADE = 'pdi.acessibilidade.v1'
const CHAVE_IDENTIDADE = 'pdi.identidade.v1'

type MapaEntradas = Record<string, EntradaPdi[]>

type ResultadoConfig = { config: Configuracao; modo: ModoPersistencia }
type ResultadoEntradas = { entradas: EntradaPdi[]; modo: ModoPersistencia }

function lerLocal<T>(chave: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : null
  } catch {
    return null
  }
}

function gravarLocal(chave: string, valor: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // armazenamento cheio ou bloqueado: a interface segue funcionando na sessão
  }
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {}
}

function normalizarCampos(bruto: unknown): Record<string, CampoConfig[]> {
  const mapa = objeto(bruto)
  const resultado: Record<string, CampoConfig[]> = {}
  for (const [area, lista] of Object.entries(mapa)) {
    if (!Array.isArray(lista)) continue
    resultado[area] = lista.flatMap(item => {
      const campo = objeto(item)
      if (typeof campo.titulo !== 'string' || !campo.titulo.trim()) return []
      return [
        {
          id: typeof campo.id === 'string' && campo.id ? campo.id : novoId(),
          titulo: campo.titulo,
          instrucao: typeof campo.instrucao === 'string' ? campo.instrucao : '',
          tipo: campo.tipo === 'lista' ? 'lista' : 'texto',
          acessoOutros:
            campo.acessoOutros === 'Comentar' || campo.acessoOutros === 'Sem acesso'
              ? campo.acessoOutros
              : 'Visualizar',
          fixo: campo.fixo === true,
        },
      ]
    })
  }
  return resultado
}

/**
 * Aceita o formato atual e também a configuração antiga (versão 1), que tinha
 * `camposColaborativos` com listas de títulos. Nada do que já foi cadastrado é
 * perdido ao atualizar o app.
 */
export function normalizarConfig(bruto: unknown): Configuracao {
  const base = configVazia()
  if (!bruto || typeof bruto !== 'object') return base
  const dados = bruto as Record<string, unknown>

  const campos = normalizarCampos(dados.campos)

  // migração da v1: camposColaborativos: { area: string[] }
  const antigos = objeto(dados.camposColaborativos)
  for (const [area, lista] of Object.entries(antigos)) {
    if (!Array.isArray(lista)) continue
    const existentes = campos[area] ?? camposPadraoDaArea(area)
    const extras = lista.flatMap(titulo =>
      typeof titulo === 'string' && titulo.trim()
        ? [
            {
              id: novoId(),
              titulo,
              instrucao: 'Campo personalizado criado pela administração.',
              tipo: 'texto' as const,
              acessoOutros: 'Visualizar' as const,
            },
          ]
        : [],
    )
    campos[area] = [...existentes, ...extras]
  }

  const indicadores = Array.isArray(dados.indicadores)
    ? dados.indicadores.filter((item): item is string => typeof item === 'string' && !!item.trim())
    : [...INDICADORES_PADRAO]

  return {
    ...base,
    estudantes: Array.isArray(dados.estudantes) ? dados.estudantes : [],
    usuarios: Array.isArray(dados.usuarios) ? dados.usuarios : [],
    permissoes: objeto(dados.permissoes) as Record<string, NivelAcesso>,
    campos: { ...base.campos, ...campos },
    modos: objeto(dados.modos) as Record<string, ModoResposta>,
    indicadores: indicadores.length > 0 ? indicadores : [...INDICADORES_PADRAO],
    historico: Array.isArray(dados.historico) ? dados.historico.slice(0, 50) : [],
  }
}

export async function carregarConfig(): Promise<ResultadoConfig> {
  try {
    const resposta = await fetch('/api/config', { cache: 'no-store' })
    if (resposta.ok) {
      const dados = (await resposta.json()) as { config?: unknown }
      const config = normalizarConfig(dados.config)
      gravarLocal(CHAVE_CONFIG, config)
      return { config, modo: 'banco' }
    }
  } catch {
    // sem rede/rota disponível: segue para o armazenamento local
  }

  const atual = lerLocal<Configuracao>(CHAVE_CONFIG)
  if (atual) return { config: normalizarConfig(atual), modo: 'local' }

  // primeira execução depois da atualização: aproveita a configuração antiga
  const antiga = lerLocal<Configuracao>(CHAVE_CONFIG_ANTIGA)
  const config = normalizarConfig(antiga)
  if (antiga) gravarLocal(CHAVE_CONFIG, config)
  return { config, modo: 'local' }
}

export async function salvarConfig(config: Configuracao): Promise<ModoPersistencia> {
  gravarLocal(CHAVE_CONFIG, config)
  try {
    const resposta = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })
    if (resposta.ok) return 'banco'
  } catch {
    // mantém o modo local
  }
  return 'local'
}

export function mapearEntradas(bruto: unknown): EntradaPdi[] {
  if (!Array.isArray(bruto)) return []
  return bruto.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const entrada = item as Record<string, unknown>
    if (typeof entrada.area !== 'string' || typeof entrada.sectionKey !== 'string') return []
    return [
      {
        area: entrada.area,
        sectionKey: entrada.sectionKey,
        content: typeof entrada.content === 'string' ? entrada.content : '',
        authorName: typeof entrada.authorName === 'string' ? entrada.authorName : '',
        updatedAt:
          typeof entrada.updatedAt === 'string' ? entrada.updatedAt : new Date().toISOString(),
      },
    ]
  })
}

export async function carregarEntradas(estudanteId: string): Promise<ResultadoEntradas> {
  if (!estudanteId) return { entradas: [], modo: 'local' }

  try {
    const resposta = await fetch(`/api/pdi?estudante=${encodeURIComponent(estudanteId)}`, {
      cache: 'no-store',
    })
    if (resposta.ok) {
      const dados = (await resposta.json()) as { entries?: unknown }
      const entradas = mapearEntradas(dados.entries)
      const mapa = lerLocal<MapaEntradas>(CHAVE_ENTRADAS) ?? {}
      gravarLocal(CHAVE_ENTRADAS, { ...mapa, [estudanteId]: entradas })
      return { entradas, modo: 'banco' }
    }
  } catch {
    // segue para o armazenamento local
  }

  const mapa = lerLocal<MapaEntradas>(CHAVE_ENTRADAS) ?? {}
  return { entradas: mapearEntradas(mapa[estudanteId]), modo: 'local' }
}

export type EntradaParaSalvar = {
  estudante: { id: string; nome: string }
  area: string
  sectionKey: string
  content: string
  authorName: string
}

export async function salvarEntrada(entrada: EntradaParaSalvar): Promise<ModoPersistencia> {
  const agora = new Date().toISOString()

  const mapa = lerLocal<MapaEntradas>(CHAVE_ENTRADAS) ?? {}
  const atuais = mapearEntradas(mapa[entrada.estudante.id])
  const semEssa = atuais.filter(
    item => !(item.area === entrada.area && item.sectionKey === entrada.sectionKey),
  )
  const atualizadas: EntradaPdi[] = [
    ...semEssa,
    {
      area: entrada.area,
      sectionKey: entrada.sectionKey,
      content: entrada.content,
      authorName: entrada.authorName,
      updatedAt: agora,
    },
  ]
  gravarLocal(CHAVE_ENTRADAS, { ...mapa, [entrada.estudante.id]: atualizadas })

  try {
    const resposta = await fetch('/api/pdi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estudante: entrada.estudante.id,
        estudanteNome: entrada.estudante.nome,
        area: entrada.area,
        sectionKey: entrada.sectionKey,
        content: entrada.content,
        authorName: entrada.authorName,
      }),
    })
    if (resposta.ok) return 'banco'
  } catch {
    // mantém o modo local
  }
  return 'local'
}

/** Remove do armazenamento local as respostas de um estudante. */
export function esquecerEntradasLocais(estudanteId: string) {
  const mapa = lerLocal<MapaEntradas>(CHAVE_ENTRADAS) ?? {}
  delete mapa[estudanteId]
  gravarLocal(CHAVE_ENTRADAS, mapa)
}

export function chaveEntrada(area: string, sectionKey: string) {
  return `${area}::${sectionKey}`
}

export function formatarData(iso: string) {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatarDataCurta(iso: string) {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/* ------------------------------------------------------------------ */
/* Conteúdo de campos do tipo lista                                    */
/* ------------------------------------------------------------------ */

/** Lê um campo "lista" (chips) gravado como JSON; tolera texto puro antigo. */
export function lerLista(conteudo: string | undefined | null): string[] {
  if (!conteudo) return []
  const texto = conteudo.trim()
  if (!texto) return []
  if (texto.startsWith('[')) {
    try {
      const dados = JSON.parse(texto)
      if (Array.isArray(dados)) return dados.filter((item): item is string => typeof item === 'string')
    } catch {
      // cai no tratamento de texto puro
    }
  }
  return texto
    .split(/[;,]\s*|\n/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function escreverLista(itens: string[]) {
  return JSON.stringify(itens.filter(Boolean))
}

/* ------------------------------------------------------------------ */
/* Acompanhamento: registros de evolução                               */
/* ------------------------------------------------------------------ */

/** Cada registro de evolução é uma entrada da área `evolucao`. */
export function lerRegistrosEvolucao(entradas: EntradaPdi[]): RegistroEvolucao[] {
  return entradas
    .filter(entrada => entrada.area === AREA_EVOLUCAO)
    .flatMap(entrada => {
      try {
        const dados = JSON.parse(entrada.content)
        if (!dados || typeof dados !== 'object') return []
        if (typeof dados.indicador !== 'string') return []
        return [
          {
            id: entrada.sectionKey,
            indicador: dados.indicador,
            valor: Number(dados.valor) || 0,
            autor: entrada.authorName,
            quando: typeof dados.quando === 'string' ? dados.quando : entrada.updatedAt,
          },
        ]
      } catch {
        return []
      }
    })
    .sort((a, b) => a.quando.localeCompare(b.quando))
}

export async function salvarRegistroEvolucao(dados: {
  estudante: { id: string; nome: string }
  indicador: string
  valor: number
  autor: string
}) {
  const quando = new Date().toISOString()
  return salvarEntrada({
    estudante: dados.estudante,
    area: AREA_EVOLUCAO,
    sectionKey: `registro-${quando}-${novoId().slice(0, 8)}`,
    content: JSON.stringify({ indicador: dados.indicador, valor: dados.valor, quando }),
    authorName: dados.autor,
  })
}

export function lerProximosPassos(entradas: EntradaPdi[]) {
  return (
    entradas.find(
      entrada => entrada.area === AREA_PROXIMOS_PASSOS && entrada.sectionKey === CHAVE_PROXIMOS_PASSOS,
    ) ?? null
  )
}

export async function salvarProximosPassos(dados: {
  estudante: { id: string; nome: string }
  conteudo: string
  autor: string
}) {
  return salvarEntrada({
    estudante: dados.estudante,
    area: AREA_PROXIMOS_PASSOS,
    sectionKey: CHAVE_PROXIMOS_PASSOS,
    content: dados.conteudo,
    authorName: dados.autor,
  })
}

/* ------------------------------------------------------------------ */
/* Preferências de acessibilidade e identidade                         */
/* ------------------------------------------------------------------ */

export type PreferenciasAcessibilidade = {
  leituraEmVozAlta: boolean
  ditado: boolean
  velocidadeVoz: number
  altoContraste: boolean
  botoesGrandes: boolean
}

export const ACESSIBILIDADE_PADRAO: PreferenciasAcessibilidade = {
  leituraEmVozAlta: false,
  ditado: false,
  velocidadeVoz: 1,
  altoContraste: false,
  botoesGrandes: false,
}

export function lerAcessibilidade(): PreferenciasAcessibilidade {
  return { ...ACESSIBILIDADE_PADRAO, ...(lerLocal<Partial<PreferenciasAcessibilidade>>(CHAVE_ACESSIBILIDADE) ?? {}) }
}

export function gravarAcessibilidade(preferencias: PreferenciasAcessibilidade) {
  gravarLocal(CHAVE_ACESSIBILIDADE, preferencias)
}

/** Quem está usando o app em cada perfil (sem autenticação real ainda). */
export function lerIdentidade(): Record<string, string> {
  return lerLocal<Record<string, string>>(CHAVE_IDENTIDADE) ?? {}
}

export function gravarIdentidade(mapa: Record<string, string>) {
  gravarLocal(CHAVE_IDENTIDADE, mapa)
}

/* ------------------------------------------------------------------ */
/* Comentários por campo                                               */
/* ------------------------------------------------------------------ */

/**
 * Comentários ficam na mesma área do campo, com a chave
 * `${campoId}#comentario#<momento>`. Assim continuam viajando junto com o PDI
 * do estudante (banco ou navegador) sem precisar de outra tabela.
 */
export function chaveDeComentario(campoId: string) {
  return `${campoId}#comentario#`
}

export function lerComentarios(entradas: EntradaPdi[], area: string, campoId: string) {
  const prefixo = chaveDeComentario(campoId)
  return entradas
    .filter(entrada => entrada.area === area && entrada.sectionKey.startsWith(prefixo))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
}

export async function salvarComentario(dados: {
  estudante: { id: string; nome: string }
  area: string
  campoId: string
  texto: string
  autor: string
}) {
  const momento = new Date().toISOString()
  return salvarEntrada({
    estudante: dados.estudante,
    area: dados.area,
    sectionKey: `${chaveDeComentario(dados.campoId)}${momento}-${novoId().slice(0, 6)}`,
    content: dados.texto,
    authorName: dados.autor,
  })
}

/* ------------------------------------------------------------------ */
/* Cópia de segurança (exportar / importar)                            */
/* ------------------------------------------------------------------ */

export const NOME_DO_APP = 'PDI Interativo'
export const VERSAO_DO_PACOTE = 1

export type PacoteDados = {
  app: typeof NOME_DO_APP
  versao: number
  exportadoEm: string
  config: Configuracao
  entradas: Record<string, EntradaPdi[]>
}

/** Lê as respostas de vários estudantes (usado nos relatórios e no backup). */
export async function carregarEntradasDeTodos(ids: string[]) {
  const resultado: Record<string, EntradaPdi[]> = {}
  for (const id of ids) {
    const { entradas } = await carregarEntradas(id)
    resultado[id] = entradas
  }
  return resultado
}

/** Monta o arquivo de backup com cadastros e respostas. */
export async function montarBackup(config: Configuracao): Promise<PacoteDados> {
  const entradas = await carregarEntradasDeTodos(config.estudantes.map(item => item.id))
  return {
    app: NOME_DO_APP,
    versao: VERSAO_DO_PACOTE,
    exportadoEm: new Date().toISOString(),
    config,
    entradas,
  }
}

export function textoDoBackup(pacote: PacoteDados) {
  return JSON.stringify(pacote, null, 2)
}

/**
 * Lê e valida um arquivo de backup. Aceita também um arquivo com apenas a
 * configuração (formato antigo), sem as respostas.
 */
export function lerBackup(texto: string): { config: Configuracao; entradas: Record<string, EntradaPdi[]> } {
  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (!bruto || typeof bruto !== 'object') throw new Error('O arquivo está vazio ou em outro formato.')

  const pacote = bruto as Record<string, unknown>
  const config = normalizarConfig(pacote.config ?? pacote)
  const entradas: Record<string, EntradaPdi[]> = {}
  const mapa = objeto(pacote.entradas)
  for (const [estudanteId, lista] of Object.entries(mapa)) {
    entradas[estudanteId] = mapearEntradas(lista)
  }

  if (config.estudantes.length === 0 && Object.keys(entradas).length === 0) {
    throw new Error('O arquivo não tem estudantes nem respostas para importar.')
  }
  return { config, entradas }
}

/** Grava um backup no navegador e, quando há banco, também nele. */
export async function restaurarBackup(pacote: {
  config: Configuracao
  entradas: Record<string, EntradaPdi[]>
}) {
  const modo = await salvarConfig(pacote.config)

  const mapaAtual = lerLocal<MapaEntradas>(CHAVE_ENTRADAS) ?? {}
  gravarLocal(CHAVE_ENTRADAS, { ...mapaAtual, ...pacote.entradas })

  for (const [estudanteId, entradas] of Object.entries(pacote.entradas)) {
    const estudante = pacote.config.estudantes.find(item => item.id === estudanteId)
    if (!estudante) continue
    for (const entrada of entradas) {
      await salvarEntrada({
        estudante: { id: estudante.id, nome: estudante.nome },
        area: entrada.area,
        sectionKey: entrada.sectionKey,
        content: entrada.content,
        authorName: entrada.authorName,
      })
    }
  }

  return modo
}
