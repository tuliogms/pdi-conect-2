import type { Perfil } from './perfis'

/** Como uma pessoa entra no sistema. */
export type StatusUsuario = 'Ativo' | 'Aguardando' | 'Inativo'

/** Nível de acesso de alguém a um conjunto de informações. */
export type NivelAcesso = 'Editar' | 'Comentar' | 'Visualizar' | 'Sem acesso'

export const NIVEIS_ACESSO: NivelAcesso[] = ['Editar', 'Comentar', 'Visualizar', 'Sem acesso']

/** Situação de cada etapa do PDI (sempre indicada por texto + ícone + cor). */
export type StatusEtapa = 'Concluída' | 'Em andamento' | 'Pendente'

export type Usuario = {
  id: string
  nome: string
  email: string
  perfil: Perfil
  /** Estudante ao qual a pessoa está vinculada (null = sem vínculo). */
  estudanteId: string | null
  status: StatusUsuario
}

export type Estudante = {
  id: string
  nome: string
  serie: string
  escola: string
}

export type RegistroHistorico = {
  id: string
  texto: string
  quando: string
}

/**
 * Um campo de uma área colaborativa (área do professor, da família, da saúde).
 * O gestor pode adicionar, editar, remover e reordenar.
 */
export type CampoConfig = {
  id: string
  titulo: string
  instrucao: string
  /** texto livre ou lista de itens (chips). */
  tipo: 'texto' | 'lista'
  /** O que quem não é dono da área pode fazer com este campo. */
  acessoOutros: 'Visualizar' | 'Comentar' | 'Sem acesso'
  /** Campo que vem de fábrica: pode ser editado e reordenado, mas não removido. */
  fixo?: boolean
}

/** Modo de resposta dos tópicos do estudante. */
export type ModoResposta = 'descritivo' | 'perguntas'

/** Estrutura administrativa do sistema (quem existe, quem acessa o quê). */
export type Configuracao = {
  versao: 2
  estudantes: Estudante[]
  usuarios: Usuario[]
  /** chave: `${usuarioId}::${estudanteId}::${area}` */
  permissoes: Record<string, NivelAcesso>
  /** área -> campos configurados (nesta ordem) */
  campos: Record<string, CampoConfig[]>
  /** `${estudanteId}::${topicoChave}` -> modo de resposta */
  modos: Record<string, ModoResposta>
  /** indicadores acompanhados na evolução (ex.: Leitura, Escrita) */
  indicadores: string[]
  historico: RegistroHistorico[]
}

/** Uma resposta gravada no PDI de um estudante. */
export type EntradaPdi = {
  area: string
  sectionKey: string
  content: string
  authorName: string
  updatedAt: string
}

export type ModoPersistencia = 'banco' | 'local'

export type SecaoAdmin =
  | 'Visão geral'
  | 'Usuários'
  | 'Estudantes'
  | 'Planos de PDI'
  | 'PDI consolidado'
  | 'Permissões de acesso'
  | 'Campos e formulários'
  | 'Acompanhamento'
  | 'Configurações'

export type SecaoParticipante =
  | 'Início'
  | 'Meus alunos'
  | 'Meu PDI'
  | 'PDI do estudante'
  | 'PDI consolidado'
  | 'Acompanhamento'
  | 'Acessibilidade'
  | 'Configurações'

/* ------------------------------------------------------------------ */
/* Tópicos fixos do estudante                                          */
/* ------------------------------------------------------------------ */

export type TopicoEstudante = {
  chave: string
  titulo: string
  /** Convite curto mostrado acima do campo. */
  instrucao: string
  /** Perguntas norteadoras usadas no modo "Perguntas". */
  perguntas: string[]
}

/**
 * Os seis tópicos são fixos quanto ao tema (portfólio, seção 5): o gestor não
 * cria nem remove tópicos, mas o estudante escolhe respondê-los como texto
 * corrido ("Descritivo") ou guiado por perguntas ("Perguntas").
 */
export const TEMAS_ESTUDANTE: TopicoEstudante[] = [
  {
    chave: 'meu-perfil',
    titulo: 'Meu perfil',
    instrucao: 'Conte um pouco sobre você.',
    perguntas: ['Quem é você?', 'O que é importante que a equipe saiba sobre você?'],
  },
  {
    chave: 'meus-interesses',
    titulo: 'Meus interesses',
    instrucao: 'O que você gosta de fazer?',
    perguntas: [
      'O que você gosta de fazer?',
      'Quais atividades você mais gosta na escola?',
      'Quais assuntos despertam seu interesse?',
    ],
  },
  {
    chave: 'como-aprendo-melhor',
    titulo: 'Como aprendo melhor',
    instrucao: 'Como você aprende com mais facilidade?',
    perguntas: [
      'O que ajuda você a entender melhor um conteúdo?',
      'Você prefere aprender sozinho, em grupo ou com o professor?',
      'Que materiais ajudam você (imagens, vídeos, jogos, leitura)?',
    ],
  },
  {
    chave: 'facilidades-dificuldades',
    titulo: 'Facilidades e dificuldades',
    instrucao: 'O que é fácil e o que é difícil para você?',
    perguntas: [
      'O que é fácil para você na escola?',
      'O que você acha difícil?',
      'O que você faz quando não entende algo?',
    ],
  },
  {
    chave: 'meus-objetivos',
    titulo: 'Meus objetivos',
    instrucao: 'O que você quer conquistar?',
    perguntas: [
      'O que você quer aprender neste período?',
      'O que você gostaria de melhorar?',
      'Como você percebe que alcançou o objetivo?',
    ],
  },
  {
    chave: 'meu-desenvolvimento',
    titulo: 'Meu desenvolvimento',
    instrucao: 'O que já mudou e o que ainda quer alcançar?',
    perguntas: [
      'O que você já consegue fazer hoje que antes era difícil?',
      'O que ainda quer conquistar?',
      'De quem você gostaria de receber ajuda?',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Áreas colaborativas e seus campos de fábrica                        */
/* ------------------------------------------------------------------ */

export type AreaColaborativa = {
  chave: string
  titulo: string
  /** Perfil dono da área (quem escreve primeiro / edita por padrão). */
  perfil: Perfil
  /** Pergunta geral da área. */
  pergunta: string
  /** Campos que a área já traz ao ser criada. */
  camposPadrao: CampoConfig[]
}

function campo(
  id: string,
  titulo: string,
  instrucao: string,
  tipo: 'texto' | 'lista' = 'texto',
  acessoOutros: CampoConfig['acessoOutros'] = 'Visualizar',
): CampoConfig {
  return { id, titulo, instrucao, tipo, acessoOutros, fixo: true }
}

export const AREAS_COLABORATIVAS: AreaColaborativa[] = [
  {
    chave: 'professor',
    titulo: 'Área do Professor',
    perfil: 'Professor',
    pergunta: 'O que a escola observa sobre o aprendizado deste estudante?',
    camposPadrao: [
      campo(
        'observacoes-pedagogicas',
        'Observações pedagógicas',
        'Registre o que você observa no dia a dia da turma.',
      ),
      campo(
        'potencialidades',
        'Potencialidades',
        'Um item por vez: criatividade, boa comunicação, interesse em tecnologia…',
        'lista',
      ),
      campo(
        'dificuldades',
        'Dificuldades observadas',
        'Um item por vez: leitura e escrita, atenção, organização…',
        'lista',
      ),
      campo(
        'estrategias',
        'Estratégias utilizadas',
        'Um item por vez: recursos visuais, atividades práticas…',
        'lista',
      ),
      campo(
        'objetivos-aprendizagem',
        'Objetivos de aprendizagem',
        'O que se espera alcançar neste período.',
      ),
      campo('evolucao', 'Evolução', 'O que mudou desde o último registro.', 'texto', 'Comentar'),
    ],
  },
  {
    chave: 'familia',
    titulo: 'Área da Família',
    perfil: 'Família',
    pergunta: 'Como é a rotina e o que a família observa em casa?',
    camposPadrao: [
      campo('rotina', 'Rotina', 'Como é o dia a dia do estudante em casa.'),
      campo('interesses', 'Interesses', 'O que ele(a) gosta de fazer fora da escola.'),
      campo(
        'dificuldades-percebidas',
        'Dificuldades percebidas',
        'Um item por vez: o que a família percebe como difícil.',
        'lista',
      ),
      campo(
        'estrategias-que-funcionam',
        'Estratégias que funcionam',
        'Conte o que tem dado certo em casa.',
      ),
      campo('observacoes', 'Observações', 'Outras informações importantes.'),
    ],
  },
  {
    chave: 'saude',
    titulo: 'Área da Saúde',
    perfil: 'Profissional da Saúde',
    pergunta: 'Quais recomendações o acompanhamento de saúde indica?',
    camposPadrao: [
      campo(
        'observacoes',
        'Observações',
        'Contribuições pertinentes à sua atuação — sem dados de prontuário.',
      ),
      campo('recomendacoes', 'Recomendações', 'Orientações para a equipe escolar e a família.'),
      campo(
        'estrategias',
        'Estratégias e encaminhamentos',
        'Ações combinadas e encaminhamentos necessários.',
      ),
      campo('acompanhamento', 'Acompanhamento', 'Como o acompanhamento tem evoluído.', 'texto', 'Comentar'),
    ],
  },
]

/** Áreas que o estudante não vê como área colaborativa própria. */
export const AREA_ESTUDANTE = {
  chave: 'estudante',
  titulo: 'Área do Estudante',
} as const

/** Área usada para os registros de evolução (acompanhamento). */
export const AREA_EVOLUCAO = 'evolucao'
/** Área usada para os próximos passos do acompanhamento. */
export const AREA_PROXIMOS_PASSOS = 'proximos-passos'
export const CHAVE_PROXIMOS_PASSOS = 'texto'

export const INDICADORES_PADRAO = ['Leitura', 'Escrita', 'Interação social']

/** Escala usada nos registros de evolução (1 a 5). */
export const ESCALA_EVOLUCAO = 5

export type RegistroEvolucao = {
  id: string
  indicador: string
  valor: number
  autor: string
  quando: string
}

/* ------------------------------------------------------------------ */
/* Permissões                                                          */
/* ------------------------------------------------------------------ */

export function chavePermissao(usuarioId: string, estudanteId: string, area: string) {
  return `${usuarioId}::${estudanteId}::${area}`
}

export function chaveModo(estudanteId: string, topico: string) {
  return `${estudanteId}::${topico}`
}

/** Lista de áreas para as quais existe permissão (estudante + colaborativas). */
export const AREAS_PERMISSAO = [AREA_ESTUDANTE.chave, ...AREAS_COLABORATIVAS.map(a => a.chave)]

export function tituloDaArea(chave: string) {
  if (chave === AREA_ESTUDANTE.chave) return AREA_ESTUDANTE.titulo
  return AREAS_COLABORATIVAS.find(area => area.chave === chave)?.titulo ?? chave
}

/** Perfil dono de uma área (null para a área do estudante). */
export function perfilDonoDaArea(chave: string): Perfil | null {
  return AREAS_COLABORATIVAS.find(area => area.chave === chave)?.perfil ?? null
}

/**
 * Acesso efetivo de alguém a uma área do PDI de um estudante.
 * A ordem é: administrador > permissão explícita > dono da área > padrão.
 */
export function acessoNaArea(
  config: Configuracao,
  opcoes: { usuarioId?: string; perfil: Perfil; estudanteId: string; area: string },
): NivelAcesso {
  if (opcoes.perfil === 'Usuário Mestre') return 'Editar'

  if (opcoes.usuarioId) {
    const explicito =
      config.permissoes[chavePermissao(opcoes.usuarioId, opcoes.estudanteId, opcoes.area)]
    if (explicito === 'Sem acesso') return 'Sem acesso'
    if (explicito) return explicito
  }

  const dono = perfilDonoDaArea(opcoes.area)
  if (dono && dono === opcoes.perfil) return 'Editar'
  if (opcoes.area === AREA_ESTUDANTE.chave && opcoes.perfil === 'Estudante') return 'Editar'

  return 'Visualizar'
}

/* ------------------------------------------------------------------ */
/* Configuração                                                        */
/* ------------------------------------------------------------------ */

export function camposPadraoDaArea(area: string): CampoConfig[] {
  const encontrada = AREAS_COLABORATIVAS.find(item => item.chave === area)
  return encontrada ? encontrada.camposPadrao.map(campo => ({ ...campo })) : []
}

export function camposDaArea(config: Configuracao, area: string): CampoConfig[] {
  const configurados = config.campos[area]
  if (configurados && configurados.length > 0) return configurados
  return camposPadraoDaArea(area)
}

export function configVazia(): Configuracao {
  return {
    versao: 2,
    estudantes: [],
    usuarios: [],
    permissoes: {},
    campos: Object.fromEntries(
      AREAS_COLABORATIVAS.map(area => [area.chave, camposPadraoDaArea(area.chave)]),
    ),
    modos: {},
    indicadores: [...INDICADORES_PADRAO],
    historico: [],
  }
}

/**
 * Configuração totalmente vazia — usada pelo botão "Apagar todos os dados".
 * Começa sem estudantes, sem usuários e sem respostas; só registra no histórico
 * que a limpeza aconteceu.
 */
export function configuracaoLimpa(): Configuracao {
  return {
    ...configVazia(),
    historico: [novoRegistro('Todos os dados foram apagados')],
  }
}

export function novoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

export function novoRegistro(texto: string): RegistroHistorico {
  return { id: novoId(), texto, quando: new Date().toISOString() }
}

/** Limite de caracteres por resposta. */
export const LIMITE_RESPOSTA = 5000

/* ------------------------------------------------------------------ */
/* Progresso                                                           */
/* ------------------------------------------------------------------ */

export type ProgressoArea = {
  area: string
  titulo: string
  status: StatusEtapa
  respondidos: number
  total: number
}

function statusDe(respondidos: number, total: number): StatusEtapa {
  if (total > 0 && respondidos >= total) return 'Concluída'
  if (respondidos > 0) return 'Em andamento'
  return 'Pendente'
}

/** Quantos tópicos do estudante já têm resposta. */
export function progressoEstudante(entradas: EntradaPdi[]): ProgressoArea {
  const respondidos = TEMAS_ESTUDANTE.filter(tema => {
    const descritivo = entradas.find(
      entrada => entrada.area === AREA_ESTUDANTE.chave && entrada.sectionKey === tema.chave,
    )
    const perguntas = entradas.filter(
      entrada =>
        entrada.area === AREA_ESTUDANTE.chave &&
        entrada.sectionKey.startsWith(`${tema.chave}#`) &&
        entrada.content.trim().length > 0,
    )
    return (descritivo?.content.trim().length ?? 0) > 0 || perguntas.length > 0
  }).length

  return {
    area: AREA_ESTUDANTE.chave,
    titulo: AREA_ESTUDANTE.titulo,
    status: statusDe(respondidos, TEMAS_ESTUDANTE.length),
    respondidos,
    total: TEMAS_ESTUDANTE.length,
  }
}

/** Progresso de uma área colaborativa, considerando os campos configurados. */
export function progressoAreaColaborativa(
  config: Configuracao,
  area: string,
  entradas: EntradaPdi[],
): ProgressoArea {
  const campos = camposDaArea(config, area)
  const respondidos = campos.filter(item => {
    const entrada = entradas.find(
      entrada => entrada.area === area && entrada.sectionKey === item.id,
    )
    return (entrada?.content.trim().length ?? 0) > 0 && (entrada?.content.trim() ?? '') !== '[]'
  }).length

  return {
    area,
    titulo: tituloDaArea(area),
    status: statusDe(respondidos, campos.length),
    respondidos,
    total: campos.length,
  }
}

export function progressoGeral(config: Configuracao, entradas: EntradaPdi[]) {
  return [progressoEstudante(entradas), ...AREAS_COLABORATIVAS.map(area => progressoAreaColaborativa(config, area.chave, entradas))]
}
