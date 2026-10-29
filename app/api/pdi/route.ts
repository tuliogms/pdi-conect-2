import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { BancoNaoConfiguradoError, getDb } from '@/lib/db'
import { pdiEntries, pdiWorkspaces } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const workspaceId = '00000000-0000-0000-0000-000000000001'
const LIMITE_CONTEUDO = 500

/**
 * Antes, qualquer falha do banco virava um 500 com stack trace e detalhes da
 * query na resposta. Agora a resposta é curta e o detalhe fica só no log.
 */
function erroDeBanco(erro: unknown, contexto: string) {
  if (erro instanceof BancoNaoConfiguradoError) {
    return NextResponse.json(
      { error: 'Banco de dados não configurado neste ambiente.' },
      { status: 503 },
    )
  }
  console.error(`[api/pdi] falha em ${contexto}:`, erro)
  return NextResponse.json(
    { error: 'Não foi possível acessar o banco de dados. Tente novamente mais tarde.' },
    { status: 503 },
  )
}

export async function GET() {
  try {
    const db = getDb()
    const [workspace] = await db
      .select()
      .from(pdiWorkspaces)
      .where(eq(pdiWorkspaces.id, workspaceId))
      .limit(1)
    const entries = await db.select().from(pdiEntries).where(eq(pdiEntries.workspaceId, workspaceId))
    return NextResponse.json({ workspace: workspace ?? null, entries })
  } catch (erro) {
    return erroDeBanco(erro, 'GET')
  }
}

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
  const area = typeof dados.area === 'string' ? dados.area.trim() : ''
  const sectionKey = typeof dados.sectionKey === 'string' ? dados.sectionKey.trim() : ''
  const content = typeof dados.content === 'string' ? dados.content.slice(0, LIMITE_CONTEUDO) : ''
  const format = dados.format === 'perguntas' ? 'perguntas' : 'descritivo'
  const authorName =
    typeof dados.authorName === 'string' && dados.authorName.trim()
      ? dados.authorName.trim().slice(0, 120)
      : 'João da Silva'

  if (!area || !sectionKey) {
    return NextResponse.json({ error: 'Área e seção são obrigatórias.' }, { status: 400 })
  }

  try {
    const db = getDb()
    await db.insert(pdiWorkspaces).values({ id: workspaceId }).onConflictDoNothing()

    // upsert atômico: o par (select + insert/update) anterior podia duplicar
    // registros quando duas pessoas salvavam a mesma seção ao mesmo tempo
    await db
      .insert(pdiEntries)
      .values({ workspaceId, area, sectionKey, content, format, authorName })
      .onConflictDoUpdate({
        target: [pdiEntries.workspaceId, pdiEntries.area, pdiEntries.sectionKey, pdiEntries.authorName],
        set: { content, format, updatedAt: new Date() },
      })

    return NextResponse.json({ ok: true })
  } catch (erro) {
    return erroDeBanco(erro, 'POST')
  }
}
