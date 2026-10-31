'use client'

import { ChevronRight } from 'lucide-react'

/** Cabeçalho padrão das seções do dashboard. */
export function Cabecalho({
  titulo,
  descricao,
  acao,
  onAction,
}: {
  titulo: string
  descricao: string
  acao?: string
  onAction?: () => void
}) {
  return (
    <div className="welcome-row admin-heading">
      <div>
        <p className="eyebrow">PDI Interativo</p>
        <h1>{titulo}</h1>
        <p className="muted">{descricao}</p>
      </div>
      {acao && (
        <button className="primary-btn" onClick={onAction}>
          <ChevronRight aria-hidden="true" /> {acao}
        </button>
      )}
    </div>
  )
}
