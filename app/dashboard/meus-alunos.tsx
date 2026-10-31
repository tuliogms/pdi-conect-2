'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search, Users } from 'lucide-react'
import { carregarEntradas } from '@/lib/dados'
import {
  progressoGeral,
  type Configuracao,
  type Estudante,
  type StatusEtapa,
} from '@/lib/pdi-tipos'
import { Cabecalho } from './cabecalho'
import { EtiquetaStatus } from './fluxo'

type Resumo = { status: StatusEtapa; concluidas: number; total: number }

/**
 * "Meus alunos" (portfólio, seção 6): lista dos estudantes vinculados à pessoa,
 * com busca e a situação de cada PDI.
 */
export default function MeusAlunos({
  config,
  estudantes,
  onAbrir,
}: {
  config: Configuracao
  estudantes: Estudante[]
  onAbrir: (estudanteId: string) => void
}) {
  const [busca, setBusca] = useState('')
  const [resumos, setResumos] = useState<Record<string, Resumo>>({})

  useEffect(() => {
    let ativo = true
    void Promise.all(
      estudantes.map(async estudante => {
        const { entradas } = await carregarEntradas(estudante.id)
        const progressos = progressoGeral(config, entradas)
        const concluidas = progressos.filter(item => item.status === 'Concluída').length
        return [
          estudante.id,
          {
            concluidas,
            total: progressos.length,
            status:
              concluidas === progressos.length
                ? 'Concluída'
                : progressos.some(item => item.status !== 'Pendente')
                  ? 'Em andamento'
                  : 'Pendente',
          } as Resumo,
        ] as const
      }),
    ).then(pares => {
      if (ativo) setResumos(Object.fromEntries(pares))
    })
    return () => {
      ativo = false
    }
  }, [config, estudantes])

  const filtrados = useMemo(
    () =>
      estudantes.filter(estudante =>
        `${estudante.nome} ${estudante.serie} ${estudante.escola}`
          .toLowerCase()
          .includes(busca.trim().toLowerCase()),
      ),
    [estudantes, busca],
  )

  return (
    <section>
      <Cabecalho
        titulo="Meus alunos"
        descricao="Estudantes vinculados a você. Abra o PDI para acompanhar e contribuir."
      />

      {estudantes.length === 0 ? (
        <div className="empty-state">
          <Users aria-hidden="true" />
          <strong>Nenhum estudante vinculado</strong>
          <p>
            Peça à administração da escola para vincular você a um estudante em “Usuários”.
          </p>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <label className="search-field" htmlFor="busca-alunos">
              <Search aria-hidden="true" />
              <span className="sr-only">Buscar aluno</span>
              <input
                id="busca-alunos"
                value={busca}
                onChange={evento => setBusca(evento.target.value)}
                placeholder="Buscar aluno…"
              />
            </label>
          </div>

          <div className="alunos-lista">
            {filtrados.map(estudante => {
              const resumo = resumos[estudante.id]
              return (
                <button
                  className="aluno-card"
                  key={estudante.id}
                  onClick={() => onAbrir(estudante.id)}
                >
                  <span className="aluno-avatar" aria-hidden="true">
                    {estudante.nome.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="aluno-dados">
                    <strong>{estudante.nome}</strong>
                    <small>
                      {[estudante.serie, estudante.escola].filter(Boolean).join(' · ') || '—'}
                    </small>
                    {resumo && (
                      <small className="aluno-resumo">
                        {resumo.concluidas} de {resumo.total} etapas concluídas
                      </small>
                    )}
                  </span>
                  {resumo ? <EtiquetaStatus status={resumo.status} /> : <span className="muted small-note">…</span>}
                  <ChevronRight aria-hidden="true" className="aluno-seta" />
                </button>
              )
            })}
            {filtrados.length === 0 && (
              <p className="muted">Nenhum aluno encontrado para esta busca.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
