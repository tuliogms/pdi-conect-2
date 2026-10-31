export const PERFIS = [
  'Educando',
  'Professor',
  'Professor de AEE',
  'Família',
  'Profissional de Apoio',
  'Usuário Mestre',
] as const

export type Perfil = (typeof PERFIS)[number]

export const PERFIL_PADRAO: Perfil = 'Educando'

export const PERFIL_ADMIN: Perfil = 'Usuário Mestre'

/** Perfil que só enxerga o que a família autorizou compartilhar. */
export const PERFIL_APOIO: Perfil = 'Profissional de Apoio'

/**
 * Remove acentos e normaliza caixa/espaços para comparar rótulos digitados
 * em links, URLs e formulários (ex.: "Usuário mestre", "usuario-mestre", "AEE").
 */
function chave(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Nomes que já foram usados pelo sistema ou que as pessoas digitam.
 * `estudante` e `profissional da saude` continuam válidos para não perder
 * cadastros e links antigos.
 */
const apelidos: Record<string, Perfil> = {
  aluno: 'Educando',
  aluna: 'Educando',
  estudante: 'Educando',
  educando: 'Educando',
  crianca: 'Educando',
  professor: 'Professor',
  professora: 'Professor',
  aee: 'Professor de AEE',
  'professor de aee': 'Professor de AEE',
  'professor aee': 'Professor de AEE',
  'professor do aee': 'Professor de AEE',
  familia: 'Família',
  familiar: 'Família',
  responsavel: 'Família',
  saude: 'Profissional de Apoio',
  'profissional da saude': 'Profissional de Apoio',
  'profissional de saude': 'Profissional de Apoio',
  'profissionais da saude': 'Profissional de Apoio',
  'profissionais de saude': 'Profissional de Apoio',
  apoio: 'Profissional de Apoio',
  'profissional de apoio': 'Profissional de Apoio',
  'profissionais de apoio': 'Profissional de Apoio',
  terapeuta: 'Profissional de Apoio',
  mestre: 'Usuário Mestre',
  admin: 'Usuário Mestre',
  administrador: 'Usuário Mestre',
  'usuario mestre': 'Usuário Mestre',
}

/** Converte um rótulo livre no perfil canônico usado pelo sistema. */
export function normalizarPerfil(valor?: string | null): Perfil | null {
  if (!valor) return null
  const texto = chave(valor)
  if (!texto) return null
  return apelidos[texto] ?? PERFIS.find(perfil => chave(perfil) === texto) ?? null
}

export function isAdmin(perfil: Perfil) {
  return perfil === PERFIL_ADMIN
}

/** Perfil dono de uma área? (usado nas telas para explicar o acesso) */
export function ehPerfilDeApoio(perfil: Perfil) {
  return perfil === PERFIL_APOIO
}

/** Iniciais usadas no avatar de perfil (ex.: "Professor de AEE" -> "PA"). */
export function iniciaisPerfil(perfil: Perfil) {
  const partes = perfil.split(/\s+/).filter(parte => chave(parte) !== 'de' && chave(parte) !== 'da')
  return partes.slice(0, 2).map(parte => parte[0]?.toUpperCase() ?? '').join('')
}

/** Nome curto da área de cada perfil (usado nos menus e títulos). */
export const ABAS_POR_PERFIL: Record<Perfil, string> = {
  Educando: 'Educando',
  Professor: 'Professor',
  'Professor de AEE': 'Professor de AEE',
  Família: 'Família',
  'Profissional de Apoio': 'Profissionais de Apoio',
  'Usuário Mestre': 'Usuário Mestre',
}
