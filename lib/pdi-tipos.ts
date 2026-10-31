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
/** Como o campo é respondido. */
export type TipoCampo = 'texto' | 'lista' | 'prancha' | 'autorizacao'

export type CampoConfig = {
  id: string
  titulo: string
  instrucao: string
  /** texto livre, lista de itens (chips), prancha de comunicação ou autorização. */
  tipo: TipoCampo
  /**
   * Seção fixa da área a que o campo pertence (ex.: "observacoes").
   * As seções não são criadas nem removidas pela escola; o que é configurável
   * são as perguntas dentro delas.
   */
  secao?: string
  /** O que quem não é dono da área pode fazer com este campo. */
  acessoOutros: 'Visualizar' | 'Comentar' | 'Sem acesso'
  /** Campo que vem de fábrica: pode ser editado e reordenado, mas não removido. */
  fixo?: boolean
  /** O campo aceita anexo de áudio (além do texto). Padrão: sim, nos campos de texto. */
  permiteAudio?: boolean
}

/** Uma seção fixa de uma área (as perguntas dentro dela são configuráveis). */
export type SecaoArea = {
  chave: string
  titulo: string
  descricao?: string
}

/** Modo de resposta dos tópicos do estudante. */
export type ModoResposta = 'descritivo' | 'perguntas'

/** Autorização de compartilhamento dada pela família (vale por educando). */
export type AutorizacaoCompartilhamento = {
  estudanteId: string
  /** A família autoriza o compartilhamento com os Profissionais de Apoio? */
  autorizado: boolean
  /** Áreas liberadas (chaves de área). Sem itens = nenhuma área liberada. */
  areas: string[]
  /** Quem autorizou (nome do responsável). */
  responsavel: string
  quando: string
  /** Revogada continua no histórico, mas não libera nada. */
  revogada?: boolean
  motivoRevogacao?: string
}

/** Símbolo de uma prancha de comunicação. */
export type SimboloPrancha = {
  id: string
  /** Texto que aparece embaixo do símbolo e é lido pelo leitor de tela. */
  rotulo: string
  /** Símbolo visual (emoji) — sempre acompanhado do rótulo escrito. */
  simbolo: string
  /** Imagem própria (data URL) quando a escola preferir usar uma figura. */
  imagem?: string
}

export type CategoriaPrancha = {
  id: string
  nome: string
  simbolos: SimboloPrancha[]
}

/** Identidade visual do aplicativo (configurável pelo Usuário Mestre). */
export type IdentidadeInstitucional = {
  nomeApp: string
  escola: string
  /** Logo em data URL (ou caminho em /public). */
  logoUrl: string
}

/** Versão registrada do PDI (histórico de alterações do plano). */
export type VersaoPdi = {
  id: string
  estudanteId: string
  quando: string
  autor: string
  resumo: string
  /** Áreas que mudaram nesta versão. */
  areas: string[]
}

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
  /** estudanteId -> autorização dada pela família */
  autorizacoes: Record<string, AutorizacaoCompartilhamento>
  /** catálogo de símbolos das pranchas de comunicação */
  pranchas: CategoriaPrancha[]
  institucional: IdentidadeInstitucional
  /** histórico de versões do PDI, de todos os educandos */
  versoes: VersaoPdi[]
  /**
   * Tema do educando -> perguntas norteadoras. As seções são fixas; as
   * perguntas de cada seção são configuráveis pelo Usuário Mestre.
   */
  perguntas: Record<string, string[]>
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
  | 'Educandos'
  | 'Planos de PDI'
  | 'PDI consolidado'
  | 'Versões do PDI'
  | 'Permissões de acesso'
  | 'Campos e formulários'
  | 'Pranchas de comunicação'
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
  /** Seções fixas da área: a escola configura as perguntas, não as seções. */
  secoes: SecaoArea[]
  /** Campos que a área já traz ao ser criada. */
  camposPadrao: CampoConfig[]
}

function campo(
  id: string,
  titulo: string,
  instrucao: string,
  tipo: TipoCampo = 'texto',
  acessoOutros: CampoConfig['acessoOutros'] = 'Visualizar',
  secao?: string,
  extra: Partial<CampoConfig> = {},
): CampoConfig {
  return { id, titulo, instrucao, tipo, acessoOutros, secao, fixo: true, ...extra }
}

/**
 * Áreas colaborativas. As chaves `professor`, `familia` e `apoio` são usadas
 * para não perder respostas já gravadas (a antiga área `saude` é migrada para
 * `apoio` na leitura da configuração).
 */
export const AREAS_COLABORATIVAS: AreaColaborativa[] = [
  {
    chave: 'professor',
    titulo: 'Área do Professor',
    perfil: 'Professor',
    pergunta: 'O que a escola observa sobre a aprendizagem e a participação do educando?',
    secoes: [
      { chave: 'identificacao', titulo: 'Identificação do educando' },
      { chave: 'observacoes', titulo: 'Observações pedagógicas' },
      { chave: 'potencialidades', titulo: 'Potencialidades' },
      { chave: 'dificuldades', titulo: 'Dificuldades e barreiras' },
      { chave: 'estrategias', titulo: 'Estratégias pedagógicas' },
      { chave: 'adaptacoes', titulo: 'Adaptações e recursos' },
      { chave: 'objetivos', titulo: 'Objetivos de aprendizagem' },
      { chave: 'acompanhamento', titulo: 'Acompanhamento e evolução' },
    ],
    camposPadrao: [
      campo(
        'turma-ano',
        'Turma e ano escolar',
        'Turma, ano e turno em que o educando está matriculado.',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'info-acompanhamento',
        'Informações relevantes para o acompanhamento',
        'O que a equipe precisa saber sobre a rotina escolar deste educando.',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'observacoes-pedagogicas',
        'Como participa das aulas, realiza as atividades e interage',
        'Registre o que você observa no dia a dia da turma.',
        'texto',
        'Visualizar',
        'observacoes',
      ),
      campo(
        'potencialidades',
        'Potencialidades',
        'Um item por vez: criatividade, boa comunicação, interesse em tecnologia…',
        'lista',
        'Visualizar',
        'potencialidades',
      ),
      campo(
        'dificuldades',
        'Dificuldades observadas',
        'Um item por vez: leitura e escrita, atenção, organização…',
        'lista',
        'Visualizar',
        'dificuldades',
      ),
      campo(
        'barreiras',
        'Barreiras de comunicação, participação e acesso',
        'Um item por vez: o que impede a participação plena.',
        'lista',
        'Visualizar',
        'dificuldades',
      ),
      campo(
        'estrategias',
        'Estratégias que já foram utilizadas',
        'Um item por vez: recursos visuais, atividades práticas…',
        'lista',
        'Visualizar',
        'estrategias',
      ),
      campo(
        'estrategias-resultados',
        'O que funcionou e o que precisa mudar',
        'Quais estratégias deram bons resultados e quais precisam ser modificadas.',
        'texto',
        'Visualizar',
        'estrategias',
      ),
      campo(
        'adaptacoes',
        'Materiais adaptados, recursos e adequações',
        'Adequações nas atividades, nos materiais e nas avaliações.',
        'texto',
        'Visualizar',
        'adaptacoes',
      ),
      campo(
        'objetivos-aprendizagem',
        'Objetivos de aprendizagem e metas pedagógicas',
        'Habilidades a desenvolver e como alcançá-las neste período.',
        'texto',
        'Visualizar',
        'objetivos',
      ),
      campo(
        'evolucao',
        'Avanços observados e próximas ações',
        'O que mudou desde o último registro.',
        'texto',
        'Comentar',
        'acompanhamento',
      ),
    ],
  },
  {
    chave: 'aee',
    titulo: 'Área do AEE',
    perfil: 'Professor de AEE',
    pergunta: 'Que recursos, estratégias e recomendações o Atendimento Educacional Especializado registra?',
    secoes: [
      { chave: 'identificacao', titulo: 'Identificação do educando' },
      { chave: 'necessidades', titulo: 'Necessidades educacionais específicas' },
      { chave: 'recursos', titulo: 'Recursos de acessibilidade' },
      { chave: 'estrategias', titulo: 'Estratégias utilizadas no AEE' },
      { chave: 'potencialidades', titulo: 'Potencialidades e habilidades' },
      { chave: 'habilidades', titulo: 'Habilidades em desenvolvimento' },
      { chave: 'adaptacoes', titulo: 'Adaptações e recomendações' },
      { chave: 'acompanhamento', titulo: 'Acompanhamento' },
      { chave: 'observacoes', titulo: 'Observações adicionais' },
    ],
    camposPadrao: [
      campo(
        'aee-necessidades-apoio',
        'Necessidades de apoio identificadas',
        'O que o educando precisa para participar e aprender.',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'aee-info-atendimento',
        'Informações relevantes para o atendimento',
        'Horário, frequência e combinados do atendimento.',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'aee-necessidades-educacionais',
        'Necessidades observadas durante o atendimento',
        'O que foi observado no AEE sobre a aprendizagem.',
        'texto',
        'Visualizar',
        'necessidades',
      ),
      campo(
        'aee-barreiras',
        'Barreiras que interferem na aprendizagem e na participação',
        'Um item por vez.',
        'lista',
        'Visualizar',
        'necessidades',
      ),
      campo(
        'aee-tecnologias',
        'Tecnologias assistivas utilizadas',
        'Um item por vez: comunicador, ponteira, ampliador, leitor de tela…',
        'lista',
        'Visualizar',
        'recursos',
      ),
      campo(
        'aee-recursos-comunicacao',
        'Recursos de comunicação',
        'Pranchas, símbolos, CAA, Libras, entre outros.',
        'lista',
        'Visualizar',
        'recursos',
      ),
      campo(
        'aee-materiais',
        'Materiais adaptados',
        'Um item por vez: material ampliado, textura, pictogramas…',
        'lista',
        'Visualizar',
        'recursos',
      ),
      campo(
        'aee-atividades',
        'Atividades desenvolvidas no atendimento',
        'O que foi trabalhado e com quais recursos.',
        'texto',
        'Visualizar',
        'estrategias',
      ),
      campo(
        'aee-estrategias-resultados',
        'Estratégias com melhores resultados',
        'O que tem funcionado melhor no atendimento.',
        'texto',
        'Visualizar',
        'estrategias',
      ),
      campo(
        'aee-potencialidades',
        'Habilidades e capacidades identificadas',
        'Um item por vez.',
        'lista',
        'Visualizar',
        'potencialidades',
      ),
      campo(
        'aee-interesses',
        'Interesses observados',
        'O que motiva o educando durante o atendimento.',
        'lista',
        'Visualizar',
        'potencialidades',
      ),
      campo(
        'aee-habilidades',
        'O que está sendo trabalhado',
        'Habilidades em desenvolvimento neste período.',
        'texto',
        'Visualizar',
        'habilidades',
      ),
      campo(
        'aee-avancos',
        'Avanços observados',
        'O que o educando já consegue fazer.',
        'texto',
        'Visualizar',
        'habilidades',
      ),
      campo(
        'aee-necessidades-permanecem',
        'Necessidades que permanecem',
        'O que ainda precisa de apoio.',
        'texto',
        'Visualizar',
        'habilidades',
      ),
      campo(
        'aee-recursos-sala',
        'Recursos necessários na sala regular',
        'O que a sala comum precisa ter para incluir o educando.',
        'lista',
        'Visualizar',
        'adaptacoes',
      ),
      campo(
        'aee-recomendacoes-professores',
        'Orientações para os professores',
        'Sugestões práticas para a sala de aula.',
        'texto',
        'Comentar',
        'adaptacoes',
      ),
      campo(
        'aee-recomendacoes-familia',
        'Sugestões para a família',
        'O que a família pode fazer para dar continuidade.',
        'texto',
        'Comentar',
        'adaptacoes',
      ),
      campo(
        'aee-evolucao',
        'Evolução no AEE',
        'Como o educando evoluiu no período.',
        'texto',
        'Comentar',
        'acompanhamento',
      ),
      campo(
        'aee-estrategias-manter',
        'Estratégias que devem ser mantidas',
        'O que continua dando certo.',
        'texto',
        'Comentar',
        'acompanhamento',
      ),
      campo(
        'aee-novas-estrategias',
        'Novas estratégias propostas',
        'O que será experimentado a seguir.',
        'texto',
        'Comentar',
        'acompanhamento',
      ),
      campo(
        'aee-observacoes',
        'Observações adicionais',
        'Informações que não se encaixam nas outras perguntas.',
        'texto',
        'Comentar',
        'observacoes',
      ),
    ],
  },
  {
    chave: 'familia',
    titulo: 'Área da Família',
    perfil: 'Família',
    pergunta: 'Como é a rotina, a comunicação e o que a família observa em casa?',
    secoes: [
      { chave: 'identificacao', titulo: 'Identificação familiar' },
      { chave: 'rotina', titulo: 'Rotina do educando' },
      { chave: 'interesses', titulo: 'Interesses e preferências' },
      { chave: 'facilidades', titulo: 'Facilidades e dificuldades' },
      { chave: 'comunicacao', titulo: 'Comunicação' },
      { chave: 'autonomia', titulo: 'Autonomia' },
      { chave: 'estrategias', titulo: 'Estratégias utilizadas pela família' },
      { chave: 'expectativas', titulo: 'Expectativas e objetivos' },
      { chave: 'observacoes', titulo: 'Observações adicionais' },
      { chave: 'autorizacao', titulo: 'Autorização de compartilhamento' },
    ],
    camposPadrao: [
      campo(
        'responsavel-nome',
        'Responsável pelo preenchimento',
        'Nome de quem está respondendo.',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'responsavel-parentesco',
        'Grau de parentesco',
        'Mãe, pai, avó, tio, responsável legal…',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'responsavel-contato',
        'Contato',
        'Telefone ou e-mail para assuntos do PDI.',
        'texto',
        'Sem acesso',
        'identificacao',
      ),
      campo(
        'rotina',
        'Como é a rotina em casa',
        'Atividades do cotidiano e como as tarefas são organizadas.',
        'texto',
        'Comentar',
        'rotina',
      ),
      campo(
        'interesses',
        'Brincadeiras, atividades e assuntos favoritos',
        'O que ele(a) gosta de fazer fora da escola.',
        'texto',
        'Comentar',
        'interesses',
      ),
      campo(
        'facilidades-percebidas',
        'O que realiza com facilidade',
        'Um item por vez.',
        'lista',
        'Comentar',
        'facilidades',
      ),
      campo(
        'dificuldades-percebidas',
        'Dificuldades observadas em casa',
        'Um item por vez: o que a família percebe como difícil.',
        'lista',
        'Comentar',
        'facilidades',
      ),
      campo(
        'comunicacao',
        'Como costuma se comunicar',
        'Fala, gestos, símbolos, pranchas, escrita…',
        'texto',
        'Comentar',
        'comunicacao',
      ),
      campo(
        'recursos-comunicacao',
        'Recursos que facilitam a compreensão',
        'Um item por vez.',
        'lista',
        'Comentar',
        'comunicacao',
      ),
      campo(
        'autonomia',
        'O que realiza sozinho e onde precisa de apoio',
        'Atividades do dia a dia e habilidades em desenvolvimento.',
        'texto',
        'Comentar',
        'autonomia',
      ),
      campo(
        'estrategias-que-funcionam',
        'Estratégias e apoios que funcionam',
        'Conte o que tem dado certo em casa.',
        'texto',
        'Comentar',
        'estrategias',
      ),
      campo(
        'expectativas',
        'O que a família espera do desenvolvimento',
        'Habilidades que gostaria que fossem trabalhadas.',
        'texto',
        'Comentar',
        'expectativas',
      ),
      campo(
        'preocupacoes',
        'Principais preocupações',
        'Um item por vez.',
        'lista',
        'Comentar',
        'expectativas',
      ),
      campo(
        'observacoes',
        'Observações adicionais',
        'Outras informações importantes para o PDI.',
        'texto',
        'Comentar',
        'observacoes',
      ),
      campo(
        'autorizacao',
        'Autorização de compartilhamento com os Profissionais de Apoio',
        'A família decide se as informações podem ser compartilhadas e pode revogar quando quiser.',
        'autorizacao',
        'Visualizar',
        'autorizacao',
        {
          fixo: true,
          acessoOutros: 'Comentar',
        },
      ),
    ],
  },
  {
    chave: 'apoio',
    titulo: 'Profissionais de Apoio',
    perfil: 'Profissional de Apoio',
    pergunta: 'O que o profissional que acompanha o educando observa e recomenda?',
    secoes: [
      { chave: 'identificacao', titulo: 'Identificação profissional' },
      { chave: 'observacoes', titulo: 'Observações sobre o acompanhamento' },
      { chave: 'potencialidades', titulo: 'Potencialidades' },
      { chave: 'necessidades', titulo: 'Necessidades de apoio' },
      { chave: 'recomendacoes', titulo: 'Recomendações' },
      { chave: 'acompanhamento', titulo: 'Acompanhamento' },
    ],
    camposPadrao: [
      campo(
        'pro-nome',
        'Nome do profissional',
        'Quem está registrando esta contribuição.',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'pro-area',
        'Área de atuação',
        'Fonoaudiologia, psicologia, terapia ocupacional, fisioterapia…',
        'texto',
        'Visualizar',
        'identificacao',
      ),
      campo(
        'pro-registro',
        'Registro profissional',
        'Conselho e número, quando aplicável.',
        'texto',
        'Sem acesso',
        'identificacao',
      ),
      campo(
        'observacoes',
        'Observações sobre o acompanhamento',
        'Informações relevantes para o desenvolvimento do educando.',
        'texto',
        'Comentar',
        'observacoes',
      ),
      campo(
        'necessidades-apoio',
        'Habilidades observadas e necessidades de apoio',
        'Um item por vez.',
        'lista',
        'Comentar',
        'observacoes',
      ),
      campo(
        'potencialidades',
        'Potencialidades e capacidades desenvolvidas',
        'O que favorece a participação do educando.',
        'lista',
        'Comentar',
        'potencialidades',
      ),
      campo(
        'barreiras',
        'Barreiras identificadas',
        'Um item por vez.',
        'lista',
        'Comentar',
        'necessidades',
      ),
      campo(
        'acessibilidade',
        'Necessidades de acessibilidade e apoios',
        'O que pode favorecer a aprendizagem.',
        'lista',
        'Comentar',
        'necessidades',
      ),
      campo(
        'recomendacoes',
        'Orientações para a escola e a família',
        'Recursos e estratégias que podem ser compartilhados.',
        'texto',
        'Comentar',
        'recomendacoes',
      ),
      campo(
        'recursos',
        'Recursos que podem ser utilizados',
        'Um item por vez.',
        'lista',
        'Comentar',
        'recomendacoes',
      ),
      campo(
        'acompanhamento',
        'Evolução observada e recomendações futuras',
        'Como o acompanhamento evoluiu e o que vem a seguir.',
        'texto',
        'Comentar',
        'acompanhamento',
      ),
    ],
  },
]

/** Áreas que o educando não vê como área colaborativa própria. */
export const AREA_ESTUDANTE = {
  chave: 'estudante',
  titulo: 'Área do Educando',
} as const

/** Área de autorização da família (a chave fica dentro da área da família). */
export const CAMPO_AUTORIZACAO = 'autorizacao'

/**
 * Pranchas de comunicação que vêm com o aplicativo. O Usuário Mestre pode
 * criar categorias, trocar símbolos e apagar o que não usar.
 */
export const PRANCHAS_PADRAO: CategoriaPrancha[] = [
  {
    id: 'necessidades',
    nome: 'Necessidades básicas',
    simbolos: [
      { id: 'agua', rotulo: 'Água', simbolo: '💧' },
      { id: 'comida', rotulo: 'Comida', simbolo: '🍎' },
      { id: 'banheiro', rotulo: 'Banheiro', simbolo: '🚻' },
      { id: 'descanso', rotulo: 'Descanso', simbolo: '🛌' },
      { id: 'dor', rotulo: 'Dor', simbolo: '🩹' },
      { id: 'ajuda', rotulo: 'Ajuda', simbolo: '🙋' },
    ],
  },
  {
    id: 'sentimentos',
    nome: 'Sentimentos',
    simbolos: [
      { id: 'feliz', rotulo: 'Feliz', simbolo: '😊' },
      { id: 'triste', rotulo: 'Triste', simbolo: '😢' },
      { id: 'cansado', rotulo: 'Cansado', simbolo: '😴' },
      { id: 'com-medo', rotulo: 'Com medo', simbolo: '😨' },
      { id: 'calmo', rotulo: 'Calmo', simbolo: '😌' },
      { id: 'irritado', rotulo: 'Irritado', simbolo: '😠' },
    ],
  },
  {
    id: 'escola',
    nome: 'Escola',
    simbolos: [
      { id: 'professor', rotulo: 'Professor', simbolo: '👩‍🏫' },
      { id: 'colegas', rotulo: 'Colegas', simbolo: '👥' },
      { id: 'tarefa', rotulo: 'Tarefa', simbolo: '📝' },
      { id: 'livro', rotulo: 'Livro', simbolo: '📚' },
      { id: 'recreio', rotulo: 'Recreio', simbolo: '⚽' },
      { id: 'computador', rotulo: 'Computador', simbolo: '💻' },
    ],
  },
  {
    id: 'acoes',
    nome: 'Ações e pedidos',
    simbolos: [
      { id: 'sim', rotulo: 'Sim', simbolo: '✅' },
      { id: 'nao', rotulo: 'Não', simbolo: '❌' },
      { id: 'mais', rotulo: 'Mais', simbolo: '➕' },
      { id: 'acabou', rotulo: 'Acabou', simbolo: '🏁' },
      { id: 'esperar', rotulo: 'Esperar', simbolo: '⏳' },
      { id: 'quero', rotulo: 'Eu quero', simbolo: '🙏' },
    ],
  },
]

export const FALAS_PADRAO = [
  'Eu quero',
  'Eu não quero',
  'Preciso de ajuda',
  'Estou feliz',
  'Estou cansado',
  'Posso ir ao banheiro?',
]

export const IDENTIDADE_PADRAO: IdentidadeInstitucional = {
  nomeApp: 'PDI Interativo',
  escola: '',
  logoUrl: '',
}

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

/** Área dos registros descritivos por período (acompanhamento). */
export const AREA_PERIODO = 'acompanhamento-periodo'

/** Campos descritivos de um período de acompanhamento. */
export const CAMPOS_PERIODO: Array<{
  chave: keyof Omit<PeriodoAcompanhamento, 'id' | 'autor' | 'quando'>
  titulo: string
  instrucao: string
}> = [
  { chave: 'periodo', titulo: 'Período', instrucao: 'Ex.: 1º bimestre de 2026.' },
  { chave: 'objetivos', titulo: 'Objetivos do período', instrucao: 'O que se esperava alcançar.' },
  { chave: 'estrategias', titulo: 'Estratégias em uso', instrucao: 'O que a equipe colocou em prática.' },
  { chave: 'avancos', titulo: 'Progressos observados', instrucao: 'O que o educando conquistou.' },
  {
    chave: 'dificuldades',
    titulo: 'Dificuldades que permanecem',
    instrucao: 'O que ainda precisa de apoio.',
  },
  { chave: 'funcionou', titulo: 'O que funcionou', instrucao: 'Estratégias que devem continuar.' },
  { chave: 'mudar', titulo: 'O que precisa mudar', instrucao: 'O que será ajustado.' },
  { chave: 'novosObjetivos', titulo: 'Novos objetivos', instrucao: 'O que será trabalhado a seguir.' },
]

export type PeriodoAcompanhamento = {
  id: string
  periodo: string
  objetivos: string
  estrategias: string
  avancos: string
  dificuldades: string
  funcionou: string
  mudar: string
  novosObjetivos: string
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
/** Autorização de compartilhamento em vigor para um educando. */
export function autorizacaoDe(
  config: Configuracao,
  estudanteId: string,
): AutorizacaoCompartilhamento | undefined {
  const autorizacao = config.autorizacoes?.[estudanteId]
  if (!autorizacao || !autorizacao.autorizado || autorizacao.revogada) return undefined
  return autorizacao
}

/** Áreas que a família liberou para os Profissionais de Apoio. */
export function areasAutorizadas(config: Configuracao, estudanteId: string): string[] {
  return autorizacaoDe(config, estudanteId)?.areas ?? []
}

/**
 * Acesso efetivo de alguém a uma área do PDI de um educando.
 * A ordem é: administrador > autorização da família (Profissionais de Apoio) >
 * permissão explícita > dono da área > padrão.
 *
 * A autorização da família é uma regra de acesso, não um aviso: sem ela, o
 * Profissional de Apoio não lê as áreas de ninguém (só escreve a própria).
 */
export function acessoNaArea(
  config: Configuracao,
  opcoes: { usuarioId?: string; perfil: Perfil; estudanteId: string; area: string },
): NivelAcesso {
  if (opcoes.perfil === 'Usuário Mestre') return 'Editar'

  if (opcoes.perfil === 'Profissional de Apoio' && opcoes.area !== 'apoio') {
    const liberadas = areasAutorizadas(config, opcoes.estudanteId)
    // a área do próprio profissional não depende de autorização
    if (!liberadas.includes(opcoes.area)) return 'Sem acesso'
  }

  if (opcoes.usuarioId) {
    const explicito =
      config.permissoes[chavePermissao(opcoes.usuarioId, opcoes.estudanteId, opcoes.area)]
    if (explicito === 'Sem acesso') return 'Sem acesso'
    if (explicito) return explicito
  }

  const dono = perfilDonoDaArea(opcoes.area)
  if (dono && dono === opcoes.perfil) return 'Editar'
  if (opcoes.area === AREA_ESTUDANTE.chave && opcoes.perfil === 'Educando') return 'Editar'

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

/** Perguntas norteadoras de um tema do educando (configuráveis). */
export function perguntasDoTema(config: Configuracao, chave: string): string[] {
  const configuradas = config.perguntas?.[chave]
  if (configuradas && configuradas.length > 0) return configuradas
  return TEMAS_ESTUDANTE.find(tema => tema.chave === chave)?.perguntas ?? []
}

/** Seções fixas de uma área (o que é configurável são as perguntas). */
export function secoesDaArea(area: string): SecaoArea[] {
  const encontrada = AREAS_COLABORATIVAS.find(item => item.chave === area)
  if (!encontrada) return []
  const usadas = new Set(encontrada.camposPadrao.map(campo => campo.secao))
  const secoes = encontrada.secoes.filter(secao => usadas.has(secao.chave))
  return secoes.length > 0 ? secoes : encontrada.secoes
}

/** Campos configurados agrupados pela seção fixa a que pertencem. */
export function camposPorSecao(config: Configuracao, area: string) {
  const secoes = secoesDaArea(area)
  const campos = camposDaArea(config, area)
  const grupos = secoes.map(secao => ({
    secao,
    campos: campos.filter(campo => (campo.secao ?? secoes[0]?.chave) === secao.chave),
  }))
  const soltos = campos.filter(campo => !secoes.some(secao => secao.chave === campo.secao))
  if (soltos.length > 0) {
    grupos.push({ secao: { chave: 'outros', titulo: 'Outras perguntas' }, campos: soltos })
  }
  return grupos.filter(grupo => grupo.campos.length > 0)
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
    autorizacoes: {},
    perguntas: Object.fromEntries(TEMAS_ESTUDANTE.map(tema => [tema.chave, [...tema.perguntas]])),
    pranchas: PRANCHAS_PADRAO.map(categoria => ({
      ...categoria,
      simbolos: categoria.simbolos.map(simbolo => ({ ...simbolo })),
    })),
    institucional: { ...IDENTIDADE_PADRAO },
    versoes: [],
  }
}

/** Nova versão registrada no histórico do PDI de um educando. */
export function novaVersao(
  estudanteId: string,
  autor: string,
  resumo: string,
  areas: string[],
): VersaoPdi {
  return { id: novoId(), estudanteId, autor, resumo, areas, quando: new Date().toISOString() }
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
