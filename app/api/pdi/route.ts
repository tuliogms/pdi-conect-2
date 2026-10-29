import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pdiEntries, pdiWorkspaces } from '@/lib/db/schema'

const workspaceId = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const workspace = await db.select().from(pdiWorkspaces).where(eq(pdiWorkspaces.id, workspaceId)).limit(1)
  const entries = await db.select().from(pdiEntries).where(eq(pdiEntries.workspaceId, workspaceId))
  return NextResponse.json({ workspace: workspace[0] ?? null, entries })
}

export async function POST(request: Request) {
  const body = await request.json()
  const area = typeof body.area === 'string' ? body.area : ''
  const sectionKey = typeof body.sectionKey === 'string' ? body.sectionKey : ''
  const content = typeof body.content === 'string' ? body.content.slice(0, 500) : ''
  const format = body.format === 'perguntas' ? 'perguntas' : 'descritivo'
  const authorName = typeof body.authorName === 'string' ? body.authorName.slice(0, 120) : 'João da Silva'
  if (!area || !sectionKey) return NextResponse.json({ error: 'Área e seção são obrigatórias.' }, { status: 400 })

  await db.insert(pdiWorkspaces).values({ id: workspaceId }).onConflictDoNothing()
  const existing = await db.select({ id: pdiEntries.id }).from(pdiEntries).where(and(eq(pdiEntries.workspaceId, workspaceId), eq(pdiEntries.area, area), eq(pdiEntries.sectionKey, sectionKey), eq(pdiEntries.authorName, authorName))).limit(1)
  if (existing[0]) {
    await db.update(pdiEntries).set({ content, format, updatedAt: new Date() }).where(eq(pdiEntries.id, existing[0].id))
  } else {
    await db.insert(pdiEntries).values({ workspaceId, area, sectionKey, content, format, authorName })
  }
  return NextResponse.json({ ok: true })
}
