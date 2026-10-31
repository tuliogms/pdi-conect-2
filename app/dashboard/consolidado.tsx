'use client'

import { useState } from 'react'
import { Check, FileText, History, Printer, Target, UserRound } from 'lucide-react'
import { formatarData, lerLista, lerProximosPassos, lerRegistrosEvolucao } from '@/lib/dados'
import {
  AREAS_COLABORATIVAS,
  camposDaArea,
  progressoGeral,
  tituloDaArea,
  type Configuracao,
  type Estudante,
} from '@/lib/pdi-tipos'
import { useEntradas } from './use-entradas'
import { Cabecalho } from './cabecalho'
import { FluxoPdi } from './fluxo'
import { SeloStatus } from './area-participante'

/**
 * PDI consolidado (Construção do PDI): reúne o que cada área registrou,
 * mantendo a autoria de cada contribuição, mostra quais áreas já foram
 * preenchidas, guarda o histórico de versões e gera o relatório em PDF.
 * O botão "Gerar PDF" usa a impressão do navegador, que já sabe salvar em PDF.
 */
export default function PdiConsolidado({
  config,
  estudanteIdInicial,
  estudantesPermitidos,
}: {
  config: Configuracao
  estudanteIdInicial?: string
  estudantesPermitidos?: Estudante[]
}) {
  const estudantes = estudantesPermitidos ?? config.estudantes
  const [estudanteId, setEstudanteId] = useState(estudanteIdInicial ?? estudantes[0]?.id ?? '')
  const estudante: Estudante | undefined =
    estudantes.find(item => item.id === estudanteId) ?? estudantes[0]
  const { entradas, modo, carregando } = useEntradas(estudante?.id ?? null)

  if (!estudante) {
    return (
      <section>
        <Cabecalho
          titulo="PDI consolidado"
          descricao="Visão única do plano, com autoria de cada contribuição, pronta para imprimir."
        />
        <div className="empty-state">
          <FileText aria-hidden="true" />
          <strong>Nenhum PDI para consolidar</strong>
          <p>Cadastre um educando e preencha as áreas para ver o plano consolidado.</p>
        </div>
      </section>
    )
  }

  const entradaDe = (area: string, sectionKey: string) =>
    entradas.find(item => item.area === area && item.sectionKey === sectionKey)

  const progressos = progressoGeral(config, entradas)
  const versoes = config.versoes
    .filter(versao => versao.estudanteId === estudante.id)
    .sort((a, b) => b.quando.localeCompare(a.quando))
    .slice(0, 20)
  const registros = lerRegistrosEvolucao(entradas)
  const proximos = lerProximosPassos(entradas)

  const principaisPontos = [
    { titulo: 'Interesses', chave: 'meus-interesses' },
    { titulo: 'Como aprende melhor', chave: 'como-aprendo-melhor' },
    { titulo: 'Facilidades e dificuldades', chave: 'facilidades-dificuldades' },
    { titulo: 'Objetivos', chave: 'meus-objetivos' },
  ].map(item => ({
    ...item,
    texto: entradaDe('estudante', item.chave)?.content ?? '',
  }))

  async function gerarPdf() {
    document.body.classList.add('imprimindo')
    window.print()
    setTimeout(() => document.body.classList.remove('imprimindo'), 800)
  }

  return (
    <section className="consolidado">
      <div className="welcome-row admin-heading no-print">
        <div>
          <p className="eyebrow">{config.institucional.nomeApp || 'PDI Interativo'}</p>
          <h1>PDI consolidado</h1>
          <p className="muted">
            Visão única do plano do educando, pronta para imprimir ou salvar em PDF.
          </p>
        </div>
        <button className="primary-btn" onClick={gerarPdf}>
          <Printer aria-hidden="true" /> Gerar PDF
        </button>
      </div>

      {estudantes.length > 1 && (
        <label className="student-picker no-print">
          Educando
          <select value={estudante.id} onChange={evento => setEstudanteId(evento.target.value)}>
            {estudantes.map(item => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      <header className="consolidado-cabecalho">
        <div className="consolidado-marca">
          <img src="/logo-mestrado-inclusiva.png" alt="ProfEi — Mestrado em Educação Inclusiva" />
          <img
            src={config.institucional.logoUrl || '/logo-uemg.png'}
            alt={config.institucional.escola || 'Logo da instituição'}
          />
        </div>
        <div>
          <p className="eyebrow">Plano de Desenvolvimento Individual</p>
          <h2>{estudante.nome}</h2>
          <p className="muted">
            {[estudante.serie, estudante.escola, config.institucional.escola]
              .filter(Boolean)
              .join(' · ') || 'Sem turma/escola'}
          </p>
        </div>
        <div className="consolidado-meta">
          <span>
            Situação: <strong>{progressos.every(item => item.status === 'Concluída') ? 'completo' : 'em construção'}</strong>
          </span>
          <span suppressHydrationWarning>Emitido em {formatarData(new Date().toISOString())}</span>
          <span>{modo === 'banco' ? 'Dados do banco de dados' : 'Dados deste navegador'}</span>
        </div>
      </header>

      <h2 className="consolidado-titulo">
        <UserRound aria-hidden="true" /> Situação de cada área
      </h2>
      <div className="consolidado-situacao">
        {progressos.map(item => (
          <div key={item.area} className="situacao-item">
            <strong>{tituloDaArea(item.area)}</strong>
            <SeloStatus status={item.status} />
            <small className="muted">
              {item.respondidos} de {item.total} campos respondidos
            </small>
          </div>
        ))}
      </div>
      <FluxoPdi progressos={progressos} />

      <h2 className="consolidado-titulo">
        <Target aria-hidden="true" /> Principais pontos
      </h2>
      <div className="consolidado-pontos">
        {principaisPontos.map(ponto => (
          <article key={ponto.chave}>
            <strong>{ponto.titulo}</strong>
            <p>{ponto.texto || 'Ainda não respondido pelo educando.'}</p>
          </article>
        ))}
      </div>

      <h2 className="consolidado-titulo">Contribuições da equipe</h2>
      <div className="consolidado-areas">
        {AREAS_COLABORATIVAS.map(area => {
          const campos = camposDaArea(config, area.chave)
          const preenchidos = campos
            .map(campo => ({ campo, entrada: entradaDe(area.chave, campo.id) }))
            .filter(item => (item.entrada?.content.trim().length ?? 0) > 0)

          return (
            <article key={area.chave} className="consolidado-area">
              <header>
                <h3>{area.titulo}</h3>
                <span>
                  {preenchidos.length} de {campos.length} campos
                </span>
              </header>
              {preenchidos.length === 0 ? (
                <p className="muted small-note">Sem contribuições registradas.</p>
              ) : (
                preenchidos.map(({ campo, entrada }) => (
                  <div className="consolidado-campo" key={campo.id}>
                    <strong>{campo.titulo}</strong>
                    {campo.tipo === 'lista' ? (
                      <ul className="chips estatico">
                        {lerLista(entrada?.content).map(item => (
                          <li className="chip" key={item}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{entrada?.content}</p>
                    )}
                    <small>
                      {entrada?.authorName} · {formatarData(entrada?.updatedAt ?? '')}
                    </small>
                  </div>
                ))
              )}
            </article>
          )
        })}
      </div>

      <h2 className="consolidado-titulo">Acompanhamento</h2>
      <div className="consolidado-acompanhamento">
        <div>
          <strong>Últimos registros de evolução</strong>
          {registros.length === 0 ? (
            <p className="muted small-note">Nenhum registro de evolução ainda.</p>
          ) : (
            <ul className="registros-lista">
              {registros
                .slice(-6)
                .reverse()
                .map(registro => (
                  <li key={registro.id}>
                    <span className="chip">{registro.indicador}</span>
                    <strong>{registro.valor}/{5}</strong>
                    <small>
                      {registro.autor} · {formatarData(registro.quando)}
                    </small>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div>
          <strong>Próximos passos</strong>
          <p>{proximos?.content || 'Nenhum próximo passo registrado.'}</p>
          {proximos && (
            <small className="muted">
              {proximos.authorName} · {formatarData(proximos.updatedAt)}
            </small>
          )}
        </div>
      </div>

      <footer className="consolidado-rodape">
        <Check aria-hidden="true" /> Documento gerado pelo{' '}
        {config.institucional.nomeApp || 'PDI Interativo'} a partir das respostas registradas pelo
        educando, pela família, pelos professores e pelos profissionais de apoio.
      </footer>

      <h2 className="consolidado-titulo no-print">
        <History aria-hidden="true" /> Histórico de versões do PDI
      </h2>
      <div className="consolidado-versoes no-print">
        {versoes.length === 0 ? (
          <p className="muted small-note">
            O histórico começa quando a primeira resposta deste PDI for salva.
          </p>
        ) : (
          <ol className="versao-lista">
            {versoes.map(versao => (
              <li key={versao.id} className="versao-item">
                <span className="versao-ponto" aria-hidden="true" />
                <div>
                  <strong>{versao.resumo}</strong>
                  <small>
                    {versao.autor} · {formatarData(versao.quando)} ·{' '}
                    {versao.areas.map(tituloDaArea).join(' + ')}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {carregando && (
        <p className="muted no-print" role="status">
          Carregando o plano…
        </p>
      )}
    </section>
  )
}
