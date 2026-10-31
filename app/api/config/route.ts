import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { pdiConfig } from '@/lib/db/schema'
import { erroDeBanco } from '@/lib/db/resposta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Linha única: a configuração administrativa é um documento só. */
const LINHA = 'principal'
/** ~1 MB é folgado para a estrutura de usuários/estudantes e evita abuso. */
const LIMITE_PAYLOAD = 1_000_000

export async function GET() {
  try {
    const db = getDb()
    const [linha] = await db.select().from(pdiConfig).where(eq(pdiConfig.id, LINHA)).limit(1)
    return NextResponse.json({ config: linha?.payload ?? null })
  } catch (erro) {
    return erroDeBanco(erro, 'GET /api/config')
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corpo da requisição precisa ser um JSON válido.' },
      { status: 400 },
    )
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const config = (body as Record<string, unknown>).config
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return NextResponse.json({ error: 'Envie a configuração em "config".' }, { status: 400 })
  }

  const serializado = JSON.stringify(config)
  if (serializado.length > LIMITE_PAYLOAD) {
    return NextResponse.json(
      { error: 'A configuração enviada é grande demais.' },
      { status: 413 },
    )
  }

  try {
    const db = getDb()
    await db
      .insert(pdiConfig)
      .values({ id: LINHA, payload: config as Record<string, unknown> })
      .onConflictDoUpdate({
        target: pdiConfig.id,
        set: { payload: config as Record<string, unknown>, updatedAt: new Date() },
      })

    return NextResponse.json({ ok: true })
  } catch (erro) {
    return erroDeBanco(erro, 'POST /api/config')
  }
}
