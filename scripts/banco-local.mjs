/**
 * Banco de dados local para desenvolvimento e demonstração.
 *
 * Sobe um PostgreSQL em processo (PGlite) falando o protocolo de rede do
 * Postgres em 127.0.0.1:5432, para o app gravar de verdade sem instalar um
 * servidor. Os dados ficam em `PDI_DB_DIR` (padrão: `<repo>/.pdi-db`).
 *
 * Uso:
 *   pnpm add -D @electric-sql/pglite @electric-sql/pglite-socket
 *   PDI_DB_DIR=./.pdi-db node scripts/banco-local.mjs
 *
 * Depois, em outro terminal:
 *   psql "$DATABASE_URL" -f db/init.sql     # cria as tabelas
 *   pnpm dev
 *
 * Em produção/escola, use o PostgreSQL normal: basta apontar DATABASE_URL para
 * ele e rodar db/init.sql uma vez.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const diretorio = process.env.PDI_DB_DIR ?? resolve(raiz, '.pdi-db')
const porta = Number(process.env.PDI_DB_PORT ?? 5432)

const db = await PGlite.create(diretorio)
const server = new PGLiteSocketServer({ db, port: porta, host: '127.0.0.1', maxConnections: 10 })
await server.start()
console.log(`banco escutando em 127.0.0.1:${porta} (dados em ${diretorio})`)

for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, async () => {
    await server.stop()
    await db.close()
    process.exit(0)
  })
}
