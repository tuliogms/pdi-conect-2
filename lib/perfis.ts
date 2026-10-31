export const PERFIS = [
  'Estudante',
  'Professor',
  'Professor de AEE',
  'Família',
  'Profissional da Saúde',
  'Usuário Mestre',
] as const

export type Perfil = (typeof PERFIS)[number]

export const PERFIL_PADRAO: Perfil = 'Estudante'

export const PERFIL_ADMIN: Perfil = 'Usuário Mestre'

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

const apelidos: Record<string, Perfil> = {
  aluno: 'Estudante',
  aluna: 'Estudante',
  estudante: 'Estudante',
  professor: 'Professor',
  professora: 'Professor',
  aee: 'Professor de AEE',
  'professor de aee': 'Professor de AEE',
  'professor aee': 'Professor de AEE',
  familia: 'Família',
  'familiar': 'Família',
  responsavel: 'Família',
  saude: 'Profissional da Saúde',
  'profissional da saude': 'Profissional da Saúde',
  'profissional de saude': 'Profissional da Saúde',
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

/** Iniciais usadas no avatar de perfil (ex.: "Professor de AEE" -> "PA"). */
export function iniciaisPerfil(perfil: Perfil) {
  const partes = perfil.split(/\s+/).filter(parte => chave(parte) !== 'de' && chave(parte) !== 'da')
  return partes.slice(0, 2).map(parte => parte[0]?.toUpperCase() ?? '').join('')
}
