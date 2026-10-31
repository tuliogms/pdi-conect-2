'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Check, Save, TrendingUp } from 'lucide-react'
import {
  formatarData,
  formatarDataCurta,
  lerPeriodosAcompanhamento,
  lerProximosPassos,
  lerRegistrosEvolucao,
  salvarPeriodoAcompanhamento,
  salvarProximosPassos,
  salvarRegistroEvolucao,
} from '@/lib/dados'
import {
  CAMPOS_PERIODO,
  ESCALA_EVOLUCAO,
  INDICADORES_PADRAO,
  TEMAS_ESTUDANTE,
  type Configuracao,
  type Estudante,
  type PeriodoAcompanhamento,
  type RegistroEvolucao,
} from '@/lib/pdi-tipos'
import type { Avisar } from './dashboard-app'
import { useEntradas } from './use-entradas'
import { Cabecalho } from './cabecalho'

/** Cores da paleta acessível do portfólio, sempre acompanhadas de texto. */
const CORES = ['#2E7D9A', '#F39237', '#5A4B8C', '#4F8A5B', '#F4C542', '#E94E1B']

export default function Acompanhamento({
  config,
  autor,
  avisar,
  estudanteIdInicial,
  estudantesPermitidos,
}: {
  config: Configuracao
  autor: string
  avisar: Avisar
  estudanteIdInicial?: string
  estudantesPermitidos?: Estudante[]
}) {
  const estudantes = estudantesPermitidos ?? config.estudantes
  const [estudanteId, setEstudanteId] = useState(estudanteIdInicial ?? estudantes[0]?.id ?? '')
  const estudante = estudantes.find(item => item.id === estudanteId) ?? estudantes[0]
  const { entradas, carregando, recarregar, modo } = useEntradas(estudante?.id ?? null)

  const indicadores = config.indicadores.length > 0 ? config.indicadores : INDICADORES_PADRAO
  const [indicador, setIndicador] = useState(indicadores[0] ?? 'Leitura')
  const [valor, setValor] = useState(3)
  const [proximos, setProximos] = useState<string | null>(null)
  const [salvandoProximos, setSalvandoProximos] = useState(false)

  const registros = useMemo(() => lerRegistrosEvolucao(entradas), [entradas])
  const periodos = useMemo(() => lerPeriodosAcompanhamento(entradas), [entradas])
  const entradaProximos = lerProximosPassos(entradas)
  const textoProximos = proximos ?? entradaProximos?.content ?? ''

  if (!estudante) {
    return (
      <section>
        <Cabecalho
          titulo="Acompanhamento"
          descricao="Registre a evolução do educando ao longo do tempo."
        />
        <div className="empty-state">
          <BarChart3 aria-hidden="true" />
          <strong>Sem dados para acompanhar</strong>
          <p>Cadastre um educando e registre a evolução para ver o gráfico aqui.</p>
        </div>
      </section>
    )
  }

  const respondidos = TEMAS_ESTUDANTE.filter(tema =>
    entradas.some(
      entrada =>
        entrada.area === 'estudante' &&
        (entrada.sectionKey === tema.chave || entrada.sectionKey.startsWith(`${tema.chave}#`)) &&
        entrada.content.trim().length > 0,
    ),
  ).length

  async function registrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!estudante) return
    await salvarRegistroEvolucao({
      estudante: { id: estudante.id, nome: estudante.nome },
      indicador,
      valor,
      autor,
    })
    await recarregar()
    avisar(`Registro de ${indicador} salvo (${modo === 'banco' ? 'banco de dados' : 'navegador'}).`)
  }

  async function gravarProximos() {
    if (!estudante) return
    setSalvandoProximos(true)
    try {
      await salvarProximosPassos({
        estudante: { id: estudante.id, nome: estudante.nome },
        conteudo: textoProximos.trim(),
        autor,
      })
      await recarregar()
      setProximos(null)
      avisar('Próximos passos salvos.')
    } finally {
      setSalvandoProximos(false)
    }
  }

  return (
    <section>
      <Cabecalho
        titulo="Acompanhamento"
        descricao="Evolução do educando com registros por período, gráfico e próximos passos."
      />

      <label className="student-picker">
        Educando
        <select value={estudante.id} onChange={evento => setEstudanteId(evento.target.value)}>
          {estudantes.map(item => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </label>

      <div className="acompanhamento-grid">
        <article className="grafico-card">
          <header>
            <h2>
              <TrendingUp aria-hidden="true" /> Evolução de {estudante.nome}
            </h2>
            <span className="muted small-note">
              Escala de 1 a {ESCALA_EVOLUCAO} · {respondidos} de {TEMAS_ESTUDANTE.length} seções do
              educando respondidas
            </span>
          </header>

          <GraficoEvolucao registros={registros} indicadores={indicadores} />

          <ul className="grafico-legenda">
            {indicadores.map((item, indice) => (
              <li key={item}>
                <span style={{ background: CORES[indice % CORES.length] }} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="registro-card">
          <h2>Novo registro de evolução</h2>
          <form onSubmit={registrar} className="registro-form">
            <label>
              Indicador
              <select value={indicador} onChange={evento => setIndicador(evento.target.value)}>
                {indicadores.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="escala">
              <legend>Valor observado</legend>
              <div className="escala-opcoes">
                {Array.from({ length: ESCALA_EVOLUCAO }, (_, indice) => indice + 1).map(opcao => (
                  <button
                    key={opcao}
                    type="button"
                    className={valor === opcao ? 'selected' : ''}
                    aria-pressed={valor === opcao}
                    onClick={() => setValor(opcao)}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="primary-btn" type="submit">
              <Check aria-hidden="true" /> Registrar
            </button>
          </form>

          <div className="registros-recentes">
            <h3>Últimos registros</h3>
            {registros.length === 0 ? (
              <p className="muted small-note">Nenhum registro ainda.</p>
            ) : (
              <ul className="registros-lista">
                {[...registros]
                  .reverse()
                  .slice(0, 6)
                  .map(registro => (
                    <li key={registro.id}>
                      <span className="chip">{registro.indicador}</span>
                      <strong>
                        {registro.valor}/{ESCALA_EVOLUCAO}
                      </strong>
                      <small>
                        {registro.autor} · {formatarData(registro.quando)}
                      </small>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </article>
      </div>

      <article className="proximos-card">
        <h2>Próximos passos</h2>
        <p className="muted small-note">
          Combine com a equipe o que será feito a partir dos registros acima.
        </p>
        <label className="sr-only" htmlFor="proximos-passos">
          Próximos passos
        </label>
        <textarea
          id="proximos-passos"
          value={textoProximos}
          onChange={evento => setProximos(evento.target.value.slice(0, 2000))}
          rows={3}
          placeholder="Ex.: reforçar atividades de leitura em pequenos grupos"
        />
        <div className="answer-actions">
          <span>
            {entradaProximos
              ? `Última versão de ${entradaProximos.authorName} · ${formatarData(entradaProximos.updatedAt)}`
              : 'Sem registro'}
          </span>
          <button
            className="soft-btn save-answer"
            onClick={gravarProximos}
            disabled={salvandoProximos || textoProximos.trim() === (entradaProximos?.content ?? '').trim()}
          >
            <Save aria-hidden="true" /> {salvandoProximos ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </article>

      <RegistrosPorPeriodo
        estudante={estudante}
        autor={autor}
        periodos={periodos}
        avisar={avisar}
        recarregar={recarregar}
        modo={modo}
      />

      {carregando && (
        <p className="muted" role="status">
          Carregando registros…
        </p>
      )}
    </section>
  )
}

/**
 * Registros descritivos por período: objetivos, estratégias em uso, progressos,
 * dificuldades que permanecem, o que funcionou, o que precisa mudar e novos
 * objetivos. O gráfico acima complementa, mas não substitui, estes registros.
 */
function RegistrosPorPeriodo({
  estudante,
  autor,
  periodos,
  avisar,
  recarregar,
  modo,
}: {
  estudante: Estudante
  autor: string
  periodos: PeriodoAcompanhamento[]
  avisar: Avisar
  recarregar: () => Promise<void>
  modo: string
}) {
  type CamposPeriodo = Record<(typeof CAMPOS_PERIODO)[number]['chave'], string>
  const vazio = Object.fromEntries(CAMPOS_PERIODO.map(campo => [campo.chave, ''])) as CamposPeriodo
  const [formulario, setFormulario] = useState<CamposPeriodo>(vazio)
  const [salvando, setSalvando] = useState(false)
  const [aberto, setAberto] = useState(false)

  const preenchido = CAMPOS_PERIODO.some(campo => formulario[campo.chave].trim().length > 0)

  async function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!preenchido) return
    setSalvando(true)
    try {
      await salvarPeriodoAcompanhamento({ estudante, periodo: formulario, autor })
      await recarregar()
      setFormulario(vazio)
      setAberto(false)
      avisar(`Registro do período salvo (${modo === 'banco' ? 'banco de dados' : 'navegador'}).`)
    } finally {
      setSalvando(false)
    }
  }

  function baixarRelatorio() {
    const cabecalho = ['Período', 'Quando', 'Autor', ...CAMPOS_PERIODO.map(campo => campo.titulo)]
    const linhas = periodos.map(periodo =>
      [
        periodo.periodo,
        formatarData(periodo.quando),
        periodo.autor,
        ...CAMPOS_PERIODO.slice(1).map(campo => String(periodo[campo.chave] ?? '')),
      ]
        .map(valor => `"${String(valor).split(String.fromCharCode(34)).join(String.fromCharCode(34, 34))}"`)
        .join(';'),
    )
    const conteudo = [cabecalho.join(';'), ...linhas].join(String.fromCharCode(10))
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `acompanhamento-${estudante.nome.toLowerCase().replace(/\s+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    avisar('Relatório do acompanhamento exportado em CSV.')
  }

  return (
    <article className="periodo-card">
      <div className="area-group-topo">
        <div>
          <h2>Registros por período</h2>
          <p className="muted small-note">
            Cada período guarda o que a equipe registrou, com autor e data. O gráfico acima
            complementa estes registros, sem substituí-los.
          </p>
        </div>
        <div className="row-actions">
          <button
            type="button"
            className="outline-btn"
            onClick={() => setAberto(atual => !atual)}
            aria-expanded={aberto}
          >
            {aberto ? 'Fechar formulário' : 'Novo registro'}
          </button>
          {periodos.length > 0 && (
            <button type="button" className="soft-btn" onClick={baixarRelatorio}>
              Baixar relatório
            </button>
          )}
        </div>
      </div>

      {aberto && (
        <form className="periodo-form" onSubmit={salvar}>
          <div className="form-grid">
            {CAMPOS_PERIODO.map(campo => (
              <label key={campo.chave} className={campo.chave === 'periodo' ? undefined : 'largo'}>
                {campo.titulo}
                <span className="muted small-note">{campo.instrucao}</span>
                <textarea
                  value={formulario[campo.chave]}
                  onChange={evento =>
                    setFormulario({ ...formulario, [campo.chave]: evento.target.value })
                  }
                  rows={campo.chave === 'periodo' ? 1 : 2}
                />
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => {
                setFormulario(vazio)
                setAberto(false)
              }}
            >
              Cancelar
            </button>
            <button className="primary-btn" type="submit" disabled={salvando || !preenchido}>
              <Save aria-hidden="true" /> {salvando ? 'Salvando…' : 'Salvar período'}
            </button>
          </div>
        </form>
      )}

      {periodos.length === 0 ? (
        <p className="muted small-note">
          Nenhum registro por período ainda. Use “Novo registro” ao final de cada período.
        </p>
      ) : (
        <ol className="timeline">
          {periodos.map(periodo => (
            <li key={periodo.id}>
              <span className="timeline-ponto" aria-hidden="true" />
              <div>
                <strong>{periodo.periodo}</strong>
                <small className="muted">
                  {periodo.autor} · {formatarData(periodo.quando)}
                </small>
                {CAMPOS_PERIODO.slice(1).map(campo =>
                  periodo[campo.chave] ? (
                    <p key={campo.chave}>
                      <b>{campo.titulo}:</b> {periodo[campo.chave]}
                    </p>
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}

/**
 * Gráfico de linhas simples em SVG. Cada indicador é uma linha; os pontos são
 * os registros ao longo do tempo. A leitura não depende só da cor: a legenda
 * tem o nome de cada indicador e a tabela de registros fica ao lado.
 */
function GraficoEvolucao({
  registros,
  indicadores,
}: {
  registros: RegistroEvolucao[]
  indicadores: string[]
}) {
  const largura = 620
  const altura = 240
  const margem = { topo: 16, direita: 16, baixo: 34, esquerda: 30 }
  const areaLargura = largura - margem.esquerda - margem.direita
  const areaAltura = altura - margem.topo - margem.baixo

  if (registros.length === 0) {
    return (
      <div className="grafico-vazio">
        <BarChart3 aria-hidden="true" />
        <p>
          Nenhum registro de evolução ainda. Use o formulário ao lado para registrar a primeira
          observação.
        </p>
      </div>
    )
  }

  const tempos = registros.map(registro => new Date(registro.quando).getTime())
  const inicio = Math.min(...tempos)
  const fim = Math.max(...tempos)
  const intervalo = fim - inicio

  const x = (quando: string) => {
    const tempo = new Date(quando).getTime()
    if (intervalo === 0) return margem.esquerda + areaLargura / 2
    return margem.esquerda + ((tempo - inicio) / intervalo) * areaLargura
  }
  const y = (valor: number) =>
    margem.topo + areaAltura - ((valor - 1) / (ESCALA_EVOLUCAO - 1)) * areaAltura

  return (
    <svg
      className="grafico"
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={`Gráfico de evolução com ${registros.length} registros nos indicadores ${indicadores.join(', ')}`}
    >
      {Array.from({ length: ESCALA_EVOLUCAO }, (_, indice) => indice + 1).map(valor => (
        <g key={valor}>
          <line
            x1={margem.esquerda}
            x2={largura - margem.direita}
            y1={y(valor)}
            y2={y(valor)}
            stroke="#e3eee0"
            strokeWidth="1"
          />
          <text x={8} y={y(valor) + 4} fontSize="10" fill="#6c8077">
            {valor}
          </text>
        </g>
      ))}

      {indicadores.map((item, indice) => {
        const pontos = registros
          .filter(registro => registro.indicador === item)
          .map(registro => ({ ...registro, px: x(registro.quando), py: y(registro.valor) }))
        if (pontos.length === 0) return null

        const caminho = pontos.map(ponto => `${ponto.px},${ponto.py}`).join(' ')
        return (
          <g key={item}>
            <polyline
              points={caminho}
              fill="none"
              stroke={CORES[indice % CORES.length]}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {pontos.map(ponto => (
              <circle
                key={ponto.id}
                cx={ponto.px}
                cy={ponto.py}
                r="4"
                fill="#fff"
                stroke={CORES[indice % CORES.length]}
                strokeWidth="2.5"
              >
                <title>{`${item}: ${ponto.valor} em ${formatarData(ponto.quando)}`}</title>
              </circle>
            ))}
          </g>
        )
      })}

      <text x={margem.esquerda} y={altura - 10} fontSize="10" fill="#6c8077">
        {formatarDataCurta(new Date(inicio).toISOString())}
      </text>
      <text x={largura - margem.direita} y={altura - 10} fontSize="10" fill="#6c8077" textAnchor="end">
        {formatarDataCurta(new Date(fim).toISOString())}
      </text>
    </svg>
  )
}

