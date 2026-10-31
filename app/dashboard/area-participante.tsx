'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  Info,
  Lock,
  MessageSquarePlus,
  Mic,
  MicOff,
  Plus,
  Save,
  Users,
  Volume2,
  X,
} from 'lucide-react'
import {
  escreverLista,
  formatarData,
  lerLista,
  salvarEntrada,
  type EntradaParaSalvar,
} from '@/lib/dados'
import {
  acessoNaArea,
  AREAS_COLABORATIVAS,
  camposDaArea,
  chaveModo,
  LIMITE_RESPOSTA,
  TEMAS_ESTUDANTE,
  type CampoConfig,
  type Configuracao,
  type EntradaPdi,
  type Estudante,
  type ModoPersistencia,
  type ModoResposta,
  type NivelAcesso,
} from '@/lib/pdi-tipos'
import type { Perfil } from '@/lib/perfis'
import { criarDitado } from '@/lib/fala'
import type { ControleAcessibilidade } from './acessibilidade'
import { useEntradas } from './use-entradas'
import { Cabecalho } from './cabecalho'

type Avisar = (texto: string) => void

const MENSAGEM_SALVO: Record<ModoPersistencia, string> = {
  banco: 'Resposta salva no banco de dados.',
  local: 'Resposta salva neste navegador.',
}

export type ContextoUsuario = {
  perfil: Perfil
  usuarioId?: string
  nome: string
}

/**
 * Área de preenchimento do PDI.
 *
 * Cada perfil escreve na sua área (a do estudante é escrita pelo estudante).
 * O gestor vê e edita tudo. As permissões configuradas em "Permissões de
 * acesso" valem aqui: editar, comentar, visualizar ou sem acesso.
 */
export default function AreaParticipante({
  contexto,
  config,
  ehAdmin,
  avisar,
  estudanteIdInicial,
  onVoltar,
  acessibilidade,
  definirModo,
  estudantesPermitidos,
}: {
  contexto: ContextoUsuario
  config: Configuracao
  ehAdmin: boolean
  avisar: Avisar
  estudanteIdInicial?: string
  onVoltar?: () => void
  acessibilidade: ControleAcessibilidade
  definirModo: (estudanteId: string, topico: string, modo: ModoResposta) => void
  /** Estudantes que esta pessoa pode ver (padrão: todos). */
  estudantesPermitidos?: Estudante[]
}) {
  const estudantes = estudantesPermitidos ?? config.estudantes
  const [estudanteId, setEstudanteId] = useState(estudanteIdInicial ?? estudantes[0]?.id ?? '')
  const [areaAtiva, setAreaAtiva] = useState(AREAS_COLABORATIVAS[0].chave)
  const [foco, setFoco] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const estudante: Estudante | undefined =
    estudantes.find(item => item.id === estudanteId) ?? estudantes[0]

  const { entradas, modo, carregando, recarregar } = useEntradas(estudante?.id ?? null)

  const areasVisiveis = useMemo(
    () =>
      AREAS_COLABORATIVAS.filter(area => {
        if (ehAdmin) return true
        return (
          acessoNaArea(config, {
            usuarioId: contexto.usuarioId,
            perfil: contexto.perfil,
            estudanteId: estudante?.id ?? '',
            area: area.chave,
          }) !== 'Sem acesso'
        )
      }),
    [config, contexto.perfil, contexto.usuarioId, ehAdmin, estudante?.id],
  )

  if (!estudante || estudantes.length === 0) {
    return (
      <section>
        <Cabecalho
          titulo={ehAdmin ? 'Planos de PDI' : 'Meu PDI'}
          descricao="O PDI de cada estudante é preenchido aqui pela equipe."
        />
        <div className="empty-state">
          <Users aria-hidden="true" />
          <strong>Nenhum estudante cadastrado ainda</strong>
          <p>
            O PDI só pode ser preenchido depois que um estudante existir no sistema.
            {ehAdmin
              ? ' Comece pela seção “Estudantes”.'
              : ' Peça à administração da escola para cadastrar o estudante.'}
          </p>
        </div>
      </section>
    )
  }

  const entradaDe = (area: string, sectionKey: string) =>
    entradas.find(item => item.area === area && item.sectionKey === sectionKey)

  const comentariosDe = (area: string, campoId: string) =>
    entradas
      .filter(item => item.area === area && item.sectionKey.startsWith(`${campoId}#comentario#`))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))

  const acessoEstudante: NivelAcesso = ehAdmin
    ? 'Editar'
    : acessoNaArea(config, {
        usuarioId: contexto.usuarioId,
        perfil: contexto.perfil,
        estudanteId: estudante.id,
        area: 'estudante',
      })

  const autor = contexto.nome

  async function gravar(dados: Omit<EntradaParaSalvar, 'estudante' | 'authorName'>) {
    if (!estudante) return
    const resultado = await salvarEntrada({
      ...dados,
      estudante: { id: estudante.id, nome: estudante.nome },
      authorName: autor,
    })
    await recarregar()
    avisar(MENSAGEM_SALVO[resultado])
  }

  function modoDoTopico(chave: string): ModoResposta {
    return config.modos[chaveModo(estudante!.id, chave)] ?? 'descritivo'
  }

  const totalTopicos = TEMAS_ESTUDANTE.length
  const topicosRespondidos = TEMAS_ESTUDANTE.filter(tema => {
    const entrada = entradaDe('estudante', tema.chave)
    if ((entrada?.content.trim().length ?? 0) > 0) return true
    if (modoDoTopico(tema.chave) !== 'perguntas') return false
    return tema.perguntas.some(
      (_, indice) =>
        (entradaDe('estudante', `${tema.chave}#${indice}`)?.content.trim().length ?? 0) > 0,
    )
  }).length

  function proximoTopico() {
    const proximo =
      TEMAS_ESTUDANTE.find(tema => {
        const entrada = entradaDe('estudante', tema.chave)
        const perguntas = tema.perguntas.map((_, indice) =>
          entradaDe('estudante', `${tema.chave}#${indice}`),
        )
        const respondido =
          (entrada?.content.trim().length ?? 0) > 0 ||
          perguntas.some(item => (item?.content.trim().length ?? 0) > 0)
        return !respondido
      }) ?? TEMAS_ESTUDANTE[0]

    setFoco(proximo.chave)
    document.getElementById(`topico-${proximo.chave}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    acessibilidade.ler(`${proximo.titulo}. ${proximo.instrucao}`)
  }

  return (
    <section ref={listaRef}>
      <Cabecalho
        titulo={ehAdmin ? 'Planos de PDI' : 'Meu PDI'}
        descricao="Registre as informações do plano. Cada resposta é salva separadamente."
        {...(onVoltar ? { acao: 'Voltar', onAction: onVoltar } : {})}
      />

      {estudantes.length > 1 && (
        <label className="student-picker">
          Estudante
          <select value={estudante.id} onChange={evento => setEstudanteId(evento.target.value)}>
            {estudantes.map(item => (
              <option key={item.id} value={item.id}>
                {item.nome}
                {item.serie ? ` — ${item.serie}` : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="pdi-context">
        <div>
          <strong>{estudante.nome}</strong>
          <span>
            {[estudante.serie, estudante.escola].filter(Boolean).join(' · ') ||
              'Sem turma/escola informada'}
          </span>
        </div>
        <div className="pdi-context-lado">
          <span className="pdi-context-modo">
            {modo === 'banco' ? 'Gravando no banco de dados' : 'Gravando neste navegador'}
          </span>
          <span className="pdi-context-autor">Você é: {autor}</span>
        </div>
      </div>

      {modo === 'local' && (
        <p className="inline-note" role="note">
          <Info aria-hidden="true" /> Sem banco de dados configurado, as respostas ficam salvas
          apenas neste navegador.
        </p>
      )}

      <div className="topico-topo">
        <h2 className="pdi-heading">Tópicos do estudante</h2>
        <div className="topico-progresso" role="status">
          <span>
            {topicosRespondidos}/{totalTopicos} tópicos respondidos
          </span>
          <div className="fluxo-barra" aria-hidden="true">
            <span style={{ width: `${Math.round((topicosRespondidos / totalTopicos) * 100)}%` }} />
          </div>
          <button type="button" className="outline-btn" onClick={proximoTopico}>
            Próximo <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="pdi-list">
        {TEMAS_ESTUDANTE.map((tema, indice) => {
          const modoTopico = modoDoTopico(tema.chave)
          const entrada = entradaDe('estudante', tema.chave)
          const destaque = foco === tema.chave

          return (
            <article
              key={`${estudante.id}-${tema.chave}`}
              id={`topico-${tema.chave}`}
              className={`topico-card ${destaque ? 'destaque' : ''}`}
            >
              <header className="topico-cabecalho">
                <span className="answer-number" aria-hidden="true">
                  {indice + 1}
                </span>
                <div>
                  <h3>{tema.titulo}</h3>
                  <p className="muted">{tema.instrucao}</p>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Ouvir a instrução de ${tema.titulo}`}
                  onClick={() => acessibilidade.ler(`${tema.titulo}. ${tema.instrucao}`)}
                  disabled={!acessibilidade.suportaVoz}
                >
                  <Volume2 aria-hidden="true" />
                </button>
              </header>

              <div className="modo-toggle" role="group" aria-label={`Formato de resposta de ${tema.titulo}`}>
                {(['descritivo', 'perguntas'] as ModoResposta[]).map(opcao => (
                  <button
                    key={opcao}
                    type="button"
                    aria-pressed={modoTopico === opcao}
                    className={modoTopico === opcao ? 'active' : ''}
                    onClick={() => {
                      if (modoTopico === opcao) return
                      definirModo(estudante.id, tema.chave, opcao)
                      avisar(
                        opcao === 'perguntas'
                          ? 'Formato “Perguntas” ativado: responda pergunta por pergunta.'
                          : 'Formato “Descritivo” ativado: responda em um texto só.',
                      )
                    }}
                  >
                    {opcao === 'descritivo' ? 'Descritivo' : 'Perguntas'}
                  </button>
                ))}
              </div>

              {modoTopico === 'descritivo' ? (
                <CampoResposta
                  id={`${estudante.id}-${tema.chave}`}
                  titulo={tema.titulo}
                  instrucao={tema.instrucao}
                  tipo="texto"
                  valor={entrada?.content ?? ''}
                  autor={entrada?.authorName ?? ''}
                  atualizadoEm={entrada?.updatedAt ?? ''}
                  acesso={acessoEstudante}
                  comentarios={comentariosDe('estudante', tema.chave)}
                  {...{ acessibilidade }}
                  aoSalvar={conteudo => gravar({ area: 'estudante', sectionKey: tema.chave, content: conteudo })}
                  aoComentar={texto =>
                    gravar({
                      area: 'estudante',
                      sectionKey: `${tema.chave}#comentario#${Date.now()}`,
                      content: texto,
                    })
                  }
                />
              ) : (
                <div className="perguntas-lista">
                  {tema.perguntas.map((pergunta, indicePergunta) => {
                    const chave = `${tema.chave}#${indicePergunta}`
                    const entradaPergunta = entradaDe('estudante', chave)
                    return (
                      <CampoResposta
                        key={`${estudante.id}-${chave}`}
                        id={`${estudante.id}-${chave}`}
                        titulo={pergunta}
                        instrucao="Responda com suas palavras."
                        tipo="texto"
                        compacto
                        valor={entradaPergunta?.content ?? ''}
                        autor={entradaPergunta?.authorName ?? ''}
                        atualizadoEm={entradaPergunta?.updatedAt ?? ''}
                        acesso={acessoEstudante}
                        comentarios={comentariosDe('estudante', chave)}
                        {...{ acessibilidade }}
                        aoSalvar={conteudo =>
                          gravar({ area: 'estudante', sectionKey: chave, content: conteudo })
                        }
                        aoComentar={texto =>
                          gravar({
                            area: 'estudante',
                            sectionKey: `${chave}#comentario#${Date.now()}`,
                            content: texto,
                          })
                        }
                      />
                    )
                  })}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <h2 className="pdi-heading">Contribuições da equipe</h2>

      {ehAdmin && areasVisiveis.length > 1 && (
        <div className="area-tabs" role="tablist" aria-label="Áreas colaborativas">
          {areasVisiveis.map(area => (
            <button
              key={area.chave}
              type="button"
              role="tab"
              aria-selected={areaAtiva === area.chave}
              className={`area-tab ${areaAtiva === area.chave ? 'active' : ''}`}
              onClick={() => setAreaAtiva(area.chave)}
            >
              {area.titulo}
            </button>
          ))}
        </div>
      )}

      <div className="pdi-list">
        {areasVisiveis
          .filter(area => (ehAdmin ? area.chave === areaAtiva : true))
          .map(area => {
            const acesso = ehAdmin
              ? 'Editar'
              : acessoNaArea(config, {
                  usuarioId: contexto.usuarioId,
                  perfil: contexto.perfil,
                  estudanteId: estudante.id,
                  area: area.chave,
                })

            const campos = camposDaArea(config, area.chave).filter(campo => {
              if (ehAdmin || acesso === 'Editar') return true
              return campo.acessoOutros !== 'Sem acesso'
            })

            const respondidos = campos.filter(campo => {
              const entrada = entradaDe(area.chave, campo.id)
              const conteudo = entrada?.content.trim() ?? ''
              return conteudo.length > 0 && conteudo !== '[]'
            }).length

            return (
              <div key={`${estudante.id}-${area.chave}`} className="area-group">
                <div className="area-group-topo">
                  <h3 className="area-group-title">{area.titulo}</h3>
                  {acesso !== 'Editar' && (
                    <span className="readonly-badge">
                      <Lock aria-hidden="true" /> Somente {acesso.toLowerCase()}
                    </span>
                  )}
                </div>
                <p className="muted small-note">
                  {area.pergunta} · {respondidos} de {campos.length} campos respondidos
                </p>

                {campos.map(campo => {
                  const entrada = entradaDe(area.chave, campo.id)
                  const acessoCampo: NivelAcesso =
                    acesso === 'Editar' ? 'Editar' : campo.acessoOutros

                  return (
                    <CampoResposta
                      key={`${estudante.id}-${area.chave}-${campo.id}`}
                      id={`${estudante.id}-${area.chave}-${campo.id}`}
                      titulo={campo.titulo}
                      instrucao={campo.instrucao}
                      tipo={campo.tipo}
                      valor={entrada?.content ?? ''}
                      autor={entrada?.authorName ?? ''}
                      atualizadoEm={entrada?.updatedAt ?? ''}
                      acesso={acessoCampo}
                      comentarios={comentariosDe(area.chave, campo.id)}
                      {...{ acessibilidade }}
                      aoSalvar={conteudo =>
                        gravar({ area: area.chave, sectionKey: campo.id, content: conteudo })
                      }
                      aoComentar={texto =>
                        gravar({
                          area: area.chave,
                          sectionKey: `${campo.id}#comentario#${Date.now()}`,
                          content: texto,
                        })
                      }
                    />
                  )
                })}
              </div>
            )
          })}
      </div>

      {carregando && (
        <p className="muted" role="status">
          Carregando respostas…
        </p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Campo de resposta                                                   */
/* ------------------------------------------------------------------ */

function CampoResposta({
  id,
  titulo,
  instrucao,
  tipo,
  valor,
  autor,
  atualizadoEm,
  acesso,
  comentarios,
  compacto,
  acessibilidade,
  aoSalvar,
  aoComentar,
}: {
  id: string
  titulo: string
  instrucao: string
  tipo: 'texto' | 'lista'
  valor: string
  autor: string
  atualizadoEm: string
  acesso: NivelAcesso
  comentarios: EntradaPdi[]
  compacto?: boolean
  acessibilidade: ControleAcessibilidade
  aoSalvar: (conteudo: string) => Promise<void> | void
  aoComentar: (texto: string) => Promise<void> | void
}) {
  const editavel = acesso === 'Editar'
  const podeComentar = acesso === 'Editar' || acesso === 'Comentar'

  const [texto, setTexto] = useState(valor)
  const [itens, setItens] = useState<string[]>(() => lerLista(valor))
  const [novoItem, setNovoItem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [erroVoz, setErroVoz] = useState('')
  const [comentario, setComentario] = useState('')
  const [comentarioAberto, setComentarioAberto] = useState(false)
  const ditado = useRef<ReturnType<typeof criarDitado>>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const valorSerializado = tipo === 'lista' ? escreverLista(itens) : texto
  const alterado = valorSerializado !== valor && !(tipo === 'texto' && texto.trim() === valor.trim())

  async function enviar() {
    setSalvando(true)
    try {
      await aoSalvar(tipo === 'lista' ? escreverLista(itens) : texto.trim())
      setConfirmado(true)
      setTimeout(() => setConfirmado(false), 2200)
    } finally {
      setSalvando(false)
    }
  }

  function alternarDitado() {
    if (!acessibilidade.ditado || !acessibilidade.suportaMicrofone) return
    if (ouvindo) {
      ditado.current?.parar()
      setOuvindo(false)
      return
    }
    const controle = criarDitado(
      transcricao => setTexto(atual => `${atual}${atual ? ' ' : ''}${transcricao}`.slice(0, LIMITE_RESPOSTA)),
      () => setOuvindo(false),
      mensagem => {
        setErroVoz(mensagem)
        setOuvindo(false)
      },
    )
    if (!controle) {
      setErroVoz('Este navegador não oferece ditado por voz.')
      return
    }
    ditado.current = controle
    controle.iniciar()
    setOuvindo(true)
    setErroVoz('')
  }

  function adicionarItem() {
    const item = novoItem.trim()
    if (!item) return
    if (itens.some(existente => existente.toLowerCase() === item.toLowerCase())) {
      setNovoItem('')
      return
    }
    setItens(atual => [...atual, item])
    setNovoItem('')
  }

  const descricaoLeitura = `${titulo}. ${instrucao}. ${
    tipo === 'lista' ? itens.join(', ') : texto
  }`.trim()

  return (
    <article className={`answer-block ${compacto ? 'compacto' : ''}`}>
      <div className="answer-heading">
        <label htmlFor={`campo-${id}`}>
          {titulo}
          <small className="answer-question">{instrucao}</small>
        </label>
        <button
          type="button"
          className="icon-btn ouvir-btn"
          aria-label={`Ouvir ${titulo}`}
          onClick={() => acessibilidade.ler(descricaoLeitura)}
          disabled={!acessibilidade.suportaVoz}
          title="Ler em voz alta"
        >
          <Volume2 aria-hidden="true" />
        </button>
      </div>

      {acesso === 'Sem acesso' ? (
        <p className="muted small-note">
          <Lock aria-hidden="true" /> Este campo não está liberado para o seu perfil.
        </p>
      ) : tipo === 'lista' ? (
        <div className="chips-area">
          {itens.length === 0 && <span className="muted small-note">Nenhum item registrado.</span>}
          <div className="chips">
            {itens.map(item => (
              <span className="chip" key={item}>
                {item}
                {editavel && (
                  <button
                    type="button"
                    aria-label={`Remover ${item}`}
                    onClick={() => setItens(atual => atual.filter(valor => valor !== item))}
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editavel && (
            <div className="chip-form">
              <label className="sr-only" htmlFor={`chip-${id}`}>
                Adicionar item em {titulo}
              </label>
              <input
                id={`chip-${id}`}
                value={novoItem}
                onChange={evento => setNovoItem(evento.target.value)}
                onKeyDown={evento => {
                  if (evento.key === 'Enter') {
                    evento.preventDefault()
                    adicionarItem()
                  }
                }}
                placeholder="Digite um item e pressione Enter"
              />
              <button type="button" className="soft-btn" onClick={adicionarItem}>
                <Plus aria-hidden="true" /> Adicionar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="campo-texto">
          <textarea
            id={`campo-${id}`}
            ref={textareaRef}
            value={texto}
            onChange={evento => setTexto(evento.target.value.slice(0, LIMITE_RESPOSTA))}
            onFocus={() => acessibilidade.ler(`${titulo}. ${instrucao}`)}
            maxLength={LIMITE_RESPOSTA}
            readOnly={!editavel}
            aria-readonly={!editavel}
            rows={compacto ? 3 : 4}
            placeholder={editavel ? 'Escreva aqui a resposta…' : 'Ainda não respondido.'}
          />
          {editavel && acessibilidade.ditado && acessibilidade.suportaMicrofone && (
            <button
              type="button"
              className={`mic-btn ${ouvindo ? 'gravando' : ''}`}
              onClick={alternarDitado}
              aria-pressed={ouvindo}
              aria-label={ouvindo ? 'Parar ditado' : `Responder ${titulo} por voz`}
            >
              {ouvindo ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
              {ouvindo ? 'Parar' : 'Responder por voz'}
            </button>
          )}
        </div>
      )}

      {erroVoz && (
        <p className="form-error" role="alert">
          {erroVoz}
        </p>
      )}

      <div className="answer-actions">
        <span>
          {autor
            ? `Última versão de ${autor} · ${formatarData(atualizadoEm)}`
            : 'Sem resposta registrada'}
          {tipo === 'texto' && ` · ${texto.length}/${LIMITE_RESPOSTA}`}
        </span>
        {editavel ? (
          <button
            type="button"
            className="soft-btn save-answer"
            onClick={enviar}
            disabled={salvando || !alterado}
          >
            {confirmado ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
            {salvando ? 'Salvando…' : confirmado ? 'Salvo' : 'Salvar'}
          </button>
        ) : (
          <span className="readonly-badge">
            <Lock aria-hidden="true" /> Somente {acesso.toLowerCase()}
          </span>
        )}
      </div>

      {podeComentar && (
        <div className="comentarios">
          {comentarios.length > 0 && (
            <ul>
              {comentarios.map(item => (
                <li key={item.sectionKey}>
                  <strong>{item.authorName || 'Equipe'}</strong>
                  <span>{item.content}</span>
                  <small>{formatarData(item.updatedAt)}</small>
                </li>
              ))}
            </ul>
          )}

          {comentarioAberto ? (
            <form
              className="comentario-form"
              onSubmit={async evento => {
                evento.preventDefault()
                const limpo = comentario.trim()
                if (!limpo) return
                await aoComentar(limpo)
                setComentario('')
                setComentarioAberto(false)
              }}
            >
              <label className="sr-only" htmlFor={`comentario-${id}`}>
                Observação sobre {titulo}
              </label>
              <input
                id={`comentario-${id}`}
                value={comentario}
                onChange={evento => setComentario(evento.target.value)}
                placeholder="Escreva uma observação sobre este campo"
                autoFocus
              />
              <button className="soft-btn" type="submit">
                <Check aria-hidden="true" /> Enviar
              </button>
              <button
                type="button"
                className="soft-btn"
                onClick={() => {
                  setComentarioAberto(false)
                  setComentario('')
                }}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button type="button" className="text-link" onClick={() => setComentarioAberto(true)}>
              <MessageSquarePlus aria-hidden="true" /> Adicionar observação
            </button>
          )}
        </div>
      )}
    </article>
  )
}
