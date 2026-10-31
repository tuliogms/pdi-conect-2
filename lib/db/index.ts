import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * O pool era criado no momento do import. Como `DATABASE_URL` pode não existir
 * (build, dev sem banco, deploy sem env), isso quebrava a rota inteira.
 * Agora o pool é criado sob demanda e reaproveitado entre recarregamentos do dev.
 */
export class BancoNaoConfiguradoError extends Error {
  constructor() {
    super('DATABASE_URL não configurada: defina a variável de ambiente para usar o banco.')
    this.name = 'BancoNaoConfiguradoError'
  }
}

export function bancoConfigurado() {
  return Boolean(process.env.DATABASE_URL)
}

function criarPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    // evita requisições penduradas quando o banco está inacessível
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  })
}

function criarDb() {
  return drizzle(getPool(), { schema })
}

type Banco = ReturnType<typeof criarDb>

const cache = globalThis as typeof globalThis & {
  __pdiPool?: Pool
  __pdiDb?: Banco
}

export function getPool(): Pool {
  if (!bancoConfigurado()) throw new BancoNaoConfiguradoError()
  if (!cache.__pdiPool) cache.__pdiPool = criarPool()
  return cache.__pdiPool
}

export function getDb(): Banco {
  if (!cache.__pdiDb) cache.__pdiDb = criarDb()
  return cache.__pdiDb
}
