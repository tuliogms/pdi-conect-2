'use client'

import { Check, CircleDashed, FileText, Loader2, UserRound } from 'lucide-react'
import type { ProgressoArea, StatusEtapa } from '@/lib/pdi-tipos'

const ICONE: Record<StatusEtapa, typeof Check> = {
  'Concluída': Check,
  'Em andamento': Loader2,
  'Pendente': CircleDashed,
}

/** Rótulo do status sempre com texto (nunca só cor). */
export function EtiquetaStatus({ status }: { status: StatusEtapa }) {
  const Icone = ICONE[status]
  const chave = status === 'Concluída' ? 'concluida' : status === 'Em andamento' ? 'andamento' : 'pendente'
  return (
    <span className={`etapa-status ${chave}`}>
      <Icone aria-hidden="true" />
      {status}
    </span>
  )
}

/**
 * Fluxo do PDI (portfólio, seção 3): estudante → professor → família → saúde →
 * PDI consolidado. A ordem orienta, mas as etapas podem ser preenchidas ao
 * mesmo tempo — por isso cada etapa mostra o próprio andamento.
 */
export function FluxoPdi({
  progressos,
  onAbrir,
  ativo,
}: {
  progressos: ProgressoArea[]
  onAbrir?: (area: string) => void
  ativo?: string
}) {
  const [estudante, ...areas] = progressos
  const todasConcluidas = progressos.every(item => item.status === 'Concluída')

  return (
    <ol className="fluxo">
      {[estudante, ...areas].map((etapa, indice) => (
        <li key={etapa.area} className={`fluxo-etapa ${ativo === etapa.area ? 'ativo' : ''}`}>
          <span className="fluxo-numero" aria-hidden="true">
            {indice + 1}
          </span>
          <div className="fluxo-corpo">
            <div className="fluxo-topo">
              <strong>
                {indice === 0 && <UserRound aria-hidden="true" />}
                {etapa.titulo}
              </strong>
              <EtiquetaStatus status={etapa.status} />
            </div>
            <div className="fluxo-barra" aria-hidden="true">
              <span
                style={{
                  width: `${etapa.total ? Math.round((etapa.respondidos / etapa.total) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="fluxo-progresso">
              {etapa.respondidos} de {etapa.total} campos respondidos
            </span>
            {onAbrir && (
              <button className="text-link" onClick={() => onAbrir(etapa.area)}>
                Abrir esta etapa
              </button>
            )}
          </div>
        </li>
      ))}

      <li className={`fluxo-etapa consolidado ${todasConcluidas ? 'pronto' : ''}`}>
        <span className="fluxo-numero" aria-hidden="true">
          <FileText aria-hidden="true" />
        </span>
        <div className="fluxo-corpo">
          <div className="fluxo-topo">
            <strong>PDI consolidado</strong>
            <EtiquetaStatus status={todasConcluidas ? 'Concluída' : 'Em andamento'} />
          </div>
          <span className="fluxo-progresso">
            {todasConcluidas
              ? 'Todas as etapas foram preenchidas.'
              : 'Reúne as respostas à medida que a equipe preenche as etapas.'}
          </span>
        </div>
      </li>
    </ol>
  )
}
