import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { pdiEntries, pdiWorkspaces } from '@/lib/db/schema'
import { erroDeBanco, uuidValido } from '@/lib/db/resposta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Limite por resposta. Antes era 500, curto demais para texto real. */
const LIMITE_CONTEUDO = 5000

/** GET /api/pdi?estudante=<uuid> — carrega o PDI de um estudante. */
export async function GET(request: Request) {
  const estudante = (new URL(request.url).searchParams.get('estudante') ?? '').trim()
  if (!uuidValido(estudante)) {
    return NextResponse.json(
      { error: 'Informe o estudante (uuid) para carregar o PDI.' },
      { status: 400 },
    )
  }

  try {
    const db = getDb()
    const [workspace] = await db
      .select()
      .from(pdiWorkspaces)
      .where(eq(pdiWorkspaces.id, estudante))
      .limit(1)
    const entries = await db.select().from(pdiEntries).where(eq(pdiEntries.workspaceId, estudante))
    return NextResponse.json({ workspace: workspace ?? null, entries })
  } catch (erro) {
    return erroDeBanco(erro, 'GET /api/pdi')
  }
}

/**
 * POST /api/pdi — grava a resposta de uma seção do PDI.
 * Cada estudante tem um workspace próprio (o id do workspace é o id do estudante).
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição precisa ser um JSON válido.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const dados = body as Record<string, unknown>
  const estudante = typeof dados.estudante === 'string' ? dados.estudante.trim() : ''
  const estudanteNome =
    typeof dados.estudanteNome === 'string' ? dados.estudanteNome.trim().slice(0, 160) : ''
  const area = typeof dados.area === 'string' ? dados.area.trim() : ''
  const sectionKey = typeof dados.sectionKey === 'string' ? dados.sectionKey.trim() : ''
  const content = typeof dados.content === 'string' ? dados.content.slice(0, LIMITE_CONTEUDO) : ''
  const format = dados.format === 'perguntas' ? 'perguntas' : 'descritivo'
  const authorName = typeof dados.authorName === 'string' ? dados.authorName.trim().slice(0, 120) : ''

  if (!uuidValido(estudante)) {
    return NextResponse.json({ error: 'Estudante inválido.' }, { status: 400 })
  }
  if (!area || !sectionKey) {
    return NextResponse.json({ error: 'Área e seção são obrigatórias.' }, { status: 400 })
  }
  if (!authorName) {
    return NextResponse.json({ error: 'Informe quem está respondendo.' }, { status: 400 })
  }

  try {
    const db = getDb()
    await db
      .insert(pdiWorkspaces)
      .values({ id: estudante, studentName: estudanteNome || 'Estudante' })
      .onConflictDoUpdate({
        target: pdiWorkspaces.id,
        set: { studentName: estudanteNome || 'Estudante', updatedAt: new Date() },
      })

    // upsert atômico: o par (select + insert/update) anterior podia duplicar
    // registros quando duas pessoas salvavam a mesma seção ao mesmo tempo
    await db
      .insert(pdiEntries)
      .values({ workspaceId: estudante, area, sectionKey, content, format, authorName })
      .onConflictDoUpdate({
        target: [pdiEntries.workspaceId, pdiEntries.area, pdiEntries.sectionKey, pdiEntries.authorName],
        set: { content, format, updatedAt: new Date() },
      })

    return NextResponse.json({ ok: true })
  } catch (erro) {
    return erroDeBanco(erro, 'POST /api/pdi')
  }
}
