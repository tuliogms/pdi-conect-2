import type { Metadata } from 'next'
import DashboardApp from './dashboard-app'
import { normalizarPerfil, PERFIL_PADRAO } from '@/lib/perfis'

export const metadata: Metadata = {
  title: 'Minha área | PDI Interativo',
  description: 'Área colaborativa do Plano de Desenvolvimento Individual.',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const bruto = Array.isArray(params.perfil) ? params.perfil[0] : params.perfil

  // O perfil é resolvido no servidor, então a tela já abre no perfil correto
  // (antes o dashboard renderizava "Estudante" e só trocava no navegador).
  return <DashboardApp perfilInicial={normalizarPerfil(bruto) ?? PERFIL_PADRAO} />
}
