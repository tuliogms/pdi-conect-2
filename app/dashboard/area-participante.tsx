'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Lock,
  MessageSquarePlus,
  Mic,
  MicOff,
  Plus,
  Save,
  Send,
  ShieldCheck,
  ShieldOff,
  Trash2,
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
  AREA_ESTUDANTE,
  autorizacaoDe,
  camposDaArea,
  camposPorSecao,
  chaveInternaDaArea,
  chaveModo,
  LIMITE_RESPOSTA,
  novaVersao,
  perguntasDoTema,
  progressoAreaColaborativa,
  progressoEstudante,
  TEMAS_ESTUDANTE,
  tituloDaArea,
  type AreaNavegacao,
  type CampoConfig,
  type CategoriaPrancha,
  type Configuracao,
  type EntradaPdi,
  type Estudante,
  type ModoPersistencia,
  type ModoResposta,
  type NivelAcesso,
  type SimboloPrancha,
  type StatusEtapa,
} from '@/lib/pdi-tipos'
import type { Perfil } from '@/lib/perfis'
import { criarDitado } from '@/lib/fala'
import type { ControleAcessibilidade } from './acessibilidade'
import { useEntradas } from './use-entradas'
import { Cabecalho } from './cabecalho'
import type { AtualizarConfig } from './dashboard-app'

type Avisar = (texto: string) => void

const MENSAGEM_SALVO: Record<ModoPersistencia, string> = {
  banco: 'Resposta salva no banco de dados.',
  local: 'Resposta salva neste navegador.',
}

/** Limite do áudio gravado (data URL) para caber em uma resposta. */
export const LIMITE_AUDIO = 1_400_000

export type ContextoUsuario = {
  perfil: Perfil
  usuarioId?: string
  nome: string
}

/** Rótulo curto de cada aba (uma aba = uma área do PDI). */
export function rotuloDaAba(chave: string) {
  if (chave === AREA_ESTUDANTE.chave) return 'Educando'
  if (chave === 'professor') return 'Professor'
  if (chave === 'aee') return 'AEE'
  if (chave === 'familia') return 'Família'
  if (chave === 'apoio') return 'Profissionais de Apoio'
  return tituloDaArea(chave)
}

/** Área que cada perfil abre por padrão ao entrar no PDI. */
export function areaPadraoDoPerfil(perfil: Perfil): AreaNavegacao {
  const area = AREAS_COLABORATIVAS.find(item => item.perfil === perfil)
  return (area?.chave ?? AREA_ESTUDANTE.chave) as AreaNavegacao
}

/** Rótulo de cada área na navegação principal. */
export function rotuloDaArea(area: AreaNavegacao) {
  const rotulos: Record<AreaNavegacao, string> = {
    educando: 'Educando',
    professor: 'Professor',
    aee: 'Professor de AEE',
    familia: 'Família',
    apoio: 'Profissionais de Apoio',
    construcao: 'Construção do PDI',
    acompanhamento: 'Acompanhamento',
    mestre: 'Usuário Mestre',
    acessibilidade: 'Acessibilidade',
    configuracoes: 'Configurações',
  }
  return rotulos[area] ?? area
}

/** Título completo da tela de uma área do PDI. */
export function tituloDaTelaDaArea(area: string) {
  if (area === AREA_ESTUDANTE.chave) return 'Área do Educando'
  return AREAS_COLABORATIVAS.find(item => item.chave === area)?.titulo ?? tituloDaArea(area)
}

/**
 * Área de preenchimento do PDI.
 *
 * Cada aba é uma área do PDI (educando, professor, AEE, família e
 * profissionais de apoio) e quem entra vê a sua aba já aberta. O Usuário Mestre
 * vê todas. As permissões de "Permissões de acesso" e a autorização de
 * compartilhamento dada pela família valem aqui.
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
  atualizar,
  areaFixa,
}: {
  contexto: ContextoUsuario
  config: Configuracao
  ehAdmin: boolean
  avisar: Avisar
  /** Quando a área vem da navegação principal, a tela mostra só ela. */
  areaFixa?: string
  estudanteIdInicial?: string
  onVoltar?: () => void
  acessibilidade: ControleAcessibilidade
  definirModo: (estudanteId: string, topico: string, modo: ModoResposta) => void
  /** Educandos que esta pessoa pode ver (padrão: todos). */
  estudantesPermitidos?: Estudante[]
  /** Grava mudanças na configuração (usado nas versões do PDI e na autorização). */
  atualizar?: AtualizarConfig
}) {
  const estudantes = estudantesPermitidos ?? config.estudantes
  const [estudanteId, setEstudanteId] = useState(estudanteIdInicial ?? estudantes[0]?.id ?? '')
  // a navegação principal usa a chave "educando"; internamente a área é "estudante"
  const chaveFixa = areaFixa ? chaveInternaDaArea(areaFixa) : undefined
  const [areaAtiva, setAreaAtiva] = useState(
    () => chaveFixa ?? areaPadraoDoPerfil(contexto.perfil),
  )
  const [foco, setFoco] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const estudante: Estudante | undefined =
    estudantes.find(item => item.id === estudanteId) ?? estudantes[0]

  const { entradas, modo, carregando, recarregar } = useEntradas(estudante?.id ?? null)

  const acessoDe = (area: string): NivelAcesso =>
    ehAdmin
      ? 'Editar'
      : acessoNaArea(config, {
          usuarioId: contexto.usuarioId,
          perfil: contexto.perfil,
          estudanteId: estudante?.id ?? '',
          area,
        })

  const abas = useMemo(
    () =>
      [AREA_ESTUDANTE.chave, ...AREAS_COLABORATIVAS.map(area => area.chave)].filter(chave => {
        if (ehAdmin) return true
        return acessoDe(chave) !== 'Sem acesso'
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, contexto.perfil, contexto.usuarioId, ehAdmin, estudante?.id],
  )

  // mantém a aba escolhida válida quando as permissões mudam
  useEffect(() => {
    if (chaveFixa && chaveFixa !== areaAtiva) setAreaAtiva(chaveFixa)
    else if (abas.length > 0 && !abas.includes(areaAtiva)) setAreaAtiva(abas[0])
  }, [abas, areaAtiva, chaveFixa])

  if (!estudante || estudantes.length === 0) {
    return (
      <section>
        <Cabecalho
          titulo={ehAdmin ? 'Planos de PDI' : 'Meu PDI'}
          descricao="O PDI de cada educando é preenchido aqui pela equipe."
        />
        <div className="empty-state">
          <Users aria-hidden="true" />
          <strong>Nenhum educando cadastrado ainda</strong>
          <p>
            O PDI só pode ser preenchido depois que um educando existir no sistema.
            {ehAdmin
              ? ' Comece pela seção “Educandos”.'
              : ' Peça à administração da escola para cadastrar o educando.'}
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

  const audioDe = (area: string, campoId: string) => entradaDe(area, `${campoId}#audio`)

  const autor = contexto.nome

  async function gravar(
    dados: Omit<EntradaParaSalvar, 'estudante' | 'authorName'>,
    rotulo: string,
  ) {
    if (!estudante) return
    const resultado = await salvarEntrada({
      ...dados,
      estudante: { id: estudante.id, nome: estudante.nome },
      authorName: autor,
    })
    await recarregar()
    avisar(MENSAGEM_SALVO[resultado])

    // toda contribuição entra no histórico de versões do PDI
    if (atualizar) {
      const versao = novaVersao(
        estudante.id,
        autor,
        `Atualizou “${rotulo}” em ${tituloDaArea(dados.area)}`,
        [dados.area],
      )
      atualizar(atual => ({ ...atual, versoes: [versao, ...atual.versoes].slice(0, 200) }))
    }
  }

  const progressos = [
    progressoEstudante(entradas),
    ...AREAS_COLABORATIVAS.map(area => progressoAreaColaborativa(config, area.chave, entradas)),
  ]
  const progressoDa = (chave: string) => progressos.find(item => item.area === chave)

  function modoDoTopico(chave: string): ModoResposta {
    return config.modos[chaveModo(estudante!.id, chave)] ?? 'descritivo'
  }

  const totalTopicos = TEMAS_ESTUDANTE.length
  const topicosRespondidos = TEMAS_ESTUDANTE.filter(tema => {
    const entrada = entradaDe(AREA_ESTUDANTE.chave, tema.chave)
    if ((entrada?.content.trim().length ?? 0) > 0) return true
    if (modoDoTopico(tema.chave) !== 'perguntas') return false
    return perguntasDoTema(config, tema.chave).some(
      (_, indice) =>
        (entradaDe(AREA_ESTUDANTE.chave, `${tema.chave}#${indice}`)?.content.trim().length ?? 0) > 0,
    )
  }).length

  function proximoTopico() {
    const proximo =
      TEMAS_ESTUDANTE.find(tema => {
        const entrada = entradaDe(AREA_ESTUDANTE.chave, tema.chave)
        const perguntas = perguntasDoTema(config, tema.chave).map((_, indice) =>
          entradaDe(AREA_ESTUDANTE.chave, `${tema.chave}#${indice}`),
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

  const acessoAtual = acessoDe(areaAtiva)
  const areaColaborativa = AREAS_COLABORATIVAS.find(area => area.chave === areaAtiva)

  return (
    <section ref={listaRef}>
      <Cabecalho
        titulo={
          chaveFixa
            ? tituloDaTelaDaArea(chaveFixa)
            : ehAdmin
              ? 'Planos de PDI'
              : 'Meu PDI'
        }
        descricao={
          chaveFixa
            ? 'Toda contribuição é salva com autor e data e entra no histórico de versões do PDI.'
            : 'Cada aba é uma área do plano. Toda contribuição é salva, identificada e guardada no histórico.'
        }
        {...(onVoltar ? { acao: 'Voltar', onAction: onVoltar } : {})}
      />

      {estudantes.length > 1 && (
        <label className="student-picker">
          Educando
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
          <span className="pdi-context-autor">
            Você é: {autor} ({contexto.perfil})
          </span>
        </div>
      </div>

      {modo === 'local' && (
        <p className="inline-note" role="note">
          <Info aria-hidden="true" /> Sem banco de dados configurado, as respostas ficam salvas
          apenas neste navegador.
        </p>
      )}

      {abas.length === 0 || (chaveFixa && acessoAtual === 'Sem acesso') ? (
        <div className="empty-state" role="status">
          <Lock aria-hidden="true" />
          <strong>Nenhuma área liberada para o seu perfil</strong>
          <p>
            A família ainda não autorizou o compartilhamento das informações deste educando. Fale
            com a coordenação da escola.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`area-tabs pdi-abas ${chaveFixa ? 'oculto' : ''}`}
            role="tablist"
            aria-label="Áreas do PDI"
            hidden={Boolean(chaveFixa)}
          >
            {abas.map(chave => {
              const progresso = progressoDa(chave)
              return (
                <button
                  key={chave}
                  type="button"
                  role="tab"
                  id={`aba-${chave}`}
                  aria-selected={areaAtiva === chave}
                  aria-controls={`painel-${chave}`}
                  className={`area-tab ${areaAtiva === chave ? 'active' : ''}`}
                  onClick={() => setAreaAtiva(chave)}
                >
                  {rotuloDaAba(chave)}
                  {progresso && (
                    <span className="aba-progresso" data-status={progresso.status}>
                      {progresso.respondidos}/{progresso.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            id={`painel-${areaAtiva}`}
            aria-labelledby={`aba-${areaAtiva}`}
            tabIndex={0}
            className="aba-painel"
          >
            {areaAtiva === AREA_ESTUDANTE.chave ? (
              <>
                <div className="topico-topo">
                  <h2 className="pdi-heading">Seções do educando</h2>
                  <div className="topico-progresso" role="status">
                    <span>
                      {topicosRespondidos}/{totalTopicos} seções respondidas
                    </span>
                    <div className="fluxo-barra" aria-hidden="true">
                      <span
                        style={{ width: `${Math.round((topicosRespondidos / totalTopicos) * 100)}%` }}
                      />
                    </div>
                    <button type="button" className="outline-btn" onClick={proximoTopico}>
                      Próximo <ChevronRight aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="pdi-list">
                  {TEMAS_ESTUDANTE.map((tema, indice) => {
                    const modoTopico = modoDoTopico(tema.chave)
                    const entrada = entradaDe(AREA_ESTUDANTE.chave, tema.chave)
                    const destaque = foco === tema.chave
                    const perguntas = perguntasDoTema(config, tema.chave)
                    const acessoEstudante = acessoDe(AREA_ESTUDANTE.chave)

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

                        <div
                          className="modo-toggle"
                          role="group"
                          aria-label={`Formato de resposta de ${tema.titulo}`}
                        >
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
                            comentarios={comentariosDe(AREA_ESTUDANTE.chave, tema.chave)}
                            pranchas={config.pranchas}
                            audio={audioDe(AREA_ESTUDANTE.chave, tema.chave)}
                            acessibilidade={acessibilidade}
                            aoSalvar={conteudo =>
                              gravar(
                                {
                                  area: AREA_ESTUDANTE.chave,
                                  sectionKey: tema.chave,
                                  content: conteudo,
                                },
                                tema.titulo,
                              )
                            }
                            aoSalvarAudio={conteudo =>
                              gravar(
                                {
                                  area: AREA_ESTUDANTE.chave,
                                  sectionKey: `${tema.chave}#audio`,
                                  content: conteudo,
                                },
                                `Áudio de ${tema.titulo}`,
                              )
                            }
                            aoComentar={texto =>
                              gravar(
                                {
                                  area: AREA_ESTUDANTE.chave,
                                  sectionKey: `${tema.chave}#comentario#${Date.now()}`,
                                  content: texto,
                                },
                                `Observação em ${tema.titulo}`,
                              )
                            }
                          />
                        ) : (
                          <div className="perguntas-lista">
                            {perguntas.map((pergunta, indicePergunta) => {
                              const chave = `${tema.chave}#${indicePergunta}`
                              const entradaPergunta = entradaDe(AREA_ESTUDANTE.chave, chave)
                              return (
                                <CampoResposta
                                  key={`${estudante.id}-${chave}`}
                                  id={`${estudante.id}-${chave}`}
                                  titulo={pergunta}
                                  instrucao="Responda com suas palavras, por áudio ou com a prancha."
                                  tipo="texto"
                                  compacto
                                  valor={entradaPergunta?.content ?? ''}
                                  autor={entradaPergunta?.authorName ?? ''}
                                  atualizadoEm={entradaPergunta?.updatedAt ?? ''}
                                  acesso={acessoEstudante}
                                  comentarios={comentariosDe(AREA_ESTUDANTE.chave, chave)}
                                  pranchas={config.pranchas}
                                  audio={audioDe(AREA_ESTUDANTE.chave, chave)}
                                  acessibilidade={acessibilidade}
                                  aoSalvar={conteudo =>
                                    gravar(
                                      {
                                        area: AREA_ESTUDANTE.chave,
                                        sectionKey: chave,
                                        content: conteudo,
                                      },
                                      pergunta,
                                    )
                                  }
                                  aoSalvarAudio={conteudo =>
                                    gravar(
                                      {
                                        area: AREA_ESTUDANTE.chave,
                                        sectionKey: `${chave}#audio`,
                                        content: conteudo,
                                      },
                                      `Áudio de ${pergunta}`,
                                    )
                                  }
                                  aoComentar={texto =>
                                    gravar(
                                      {
                                        area: AREA_ESTUDANTE.chave,
                                        sectionKey: `${chave}#comentario#${Date.now()}`,
                                        content: texto,
                                      },
                                      `Observação em ${pergunta}`,
                                    )
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
              </>
            ) : areaColaborativa ? (
              <AbaColaborativa
                area={areaColaborativa.chave}
                titulo={areaColaborativa.titulo}
                pergunta={areaColaborativa.pergunta}
                acesso={acessoAtual}
                ehAdmin={ehAdmin}
                config={config}
                estudante={estudante}
                contexto={contexto}
                entradas={entradas}
                acessibilidade={acessibilidade}
                avisar={avisar}
                {...(atualizar ? { atualizar } : {})}
                gravar={gravar}
              />
            ) : null}
          </div>
        </>
      )}

      {carregando && (
        <p className="muted" role="status">
          Carregando respostas…
        </p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Aba de uma área colaborativa                                       */
/* ------------------------------------------------------------------ */

function AbaColaborativa({
  area,
  titulo,
  pergunta,
  acesso,
  ehAdmin,
  config,
  estudante,
  contexto,
  entradas,
  acessibilidade,
  avisar,
  atualizar,
  gravar,
}: {
  area: string
  titulo: string
  pergunta: string
  acesso: NivelAcesso
  ehAdmin: boolean
  config: Configuracao
  estudante: Estudante
  contexto: ContextoUsuario
  entradas: EntradaPdi[]
  acessibilidade: ControleAcessibilidade
  avisar: Avisar
  atualizar?: AtualizarConfig
  gravar: (
    dados: Omit<EntradaParaSalvar, 'estudante' | 'authorName'>,
    rotulo: string,
  ) => Promise<void>
}) {
  const entradaDe = (sectionKey: string) =>
    entradas.find(item => item.area === area && item.sectionKey === sectionKey)

  const comentariosDe = (campoId: string) =>
    entradas
      .filter(item => item.area === area && item.sectionKey.startsWith(`${campoId}#comentario#`))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))

  const grupos = camposPorSecao(config, area)
  const campos = camposDaArea(config, area)
  const respondidos = campos.filter(campo => {
    const conteudo = entradaDe(campo.id)?.content.trim() ?? ''
    return conteudo.length > 0 && conteudo !== '[]'
  }).length

  const somenteLeitura = acesso !== 'Editar'

  return (
    <div className="area-group">
      <div className="area-group-topo">
        <div>
          <h3 className="area-group-title">{titulo}</h3>
          <p className="muted small-note">
            {pergunta} · {respondidos} de {campos.length} campos respondidos
          </p>
        </div>
        {somenteLeitura && (
          <span className="readonly-badge">
            <Lock aria-hidden="true" /> Somente {acesso.toLowerCase()}
          </span>
        )}
      </div>

      {campos.length === 0 && (
        <p className="muted small-note">Nenhuma pergunta configurada nesta área ainda.</p>
      )}

      {grupos.map(grupo => {
        const autorizacao = grupo.campos.find(campo => campo.tipo === 'autorizacao')
        const demais = grupo.campos.filter(campo => campo.tipo !== 'autorizacao')

        return (
          <section className="secao-bloco" key={grupo.secao.chave}>
            <h4>{grupo.secao.titulo}</h4>

            {demais.map(campo => {
              const entrada = entradaDe(campo.id)
              const acessoCampo: NivelAcesso = acesso === 'Editar' ? 'Editar' : campo.acessoOutros

              return (
                <CampoResposta
                  key={`${estudante.id}-${area}-${campo.id}`}
                  id={`${estudante.id}-${area}-${campo.id}`}
                  titulo={campo.titulo}
                  instrucao={campo.instrucao}
                  tipo={campo.tipo}
                  valor={entrada?.content ?? ''}
                  autor={entrada?.authorName ?? ''}
                  atualizadoEm={entrada?.updatedAt ?? ''}
                  acesso={acessoCampo}
                  comentarios={comentariosDe(campo.id)}
                  pranchas={config.pranchas}
                  audio={entradaDe(`${campo.id}#audio`)}
                  acessibilidade={acessibilidade}
                  aoSalvar={conteudo =>
                    gravar({ area, sectionKey: campo.id, content: conteudo }, campo.titulo)
                  }
                  aoSalvarAudio={conteudo =>
                    gravar(
                      { area, sectionKey: `${campo.id}#audio`, content: conteudo },
                      `Áudio de ${campo.titulo}`,
                    )
                  }
                  aoComentar={texto =>
                    gravar(
                      { area, sectionKey: `${campo.id}#comentario#${Date.now()}`, content: texto },
                      `Observação em ${campo.titulo}`,
                    )
                  }
                />
              )
            })}

            {autorizacao && (
              <BlocoAutorizacao
                campo={autorizacao}
                config={config}
                estudante={estudante}
                contexto={contexto}
                ehAdmin={ehAdmin}
                {...(atualizar ? { atualizar } : {})}
                avisar={avisar}
              />
            )}
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Autorização de compartilhamento (família)                          */
/* ------------------------------------------------------------------ */

const AREAS_AUTORIZAVEIS = [AREA_ESTUDANTE.chave, ...AREAS_COLABORATIVAS.map(area => area.chave)]

function BlocoAutorizacao({
  campo,
  config,
  estudante,
  contexto,
  ehAdmin,
  atualizar,
  avisar,
}: {
  campo: CampoConfig
  config: Configuracao
  estudante: Estudante
  contexto: ContextoUsuario
  ehAdmin: boolean
  atualizar?: AtualizarConfig
  avisar: Avisar
}) {
  const atual = autorizacaoDe(config, estudante.id)
  const bruta = config.autorizacoes?.[estudante.id]
  const podeEditar = ehAdmin || contexto.perfil === 'Família'

  const [autorizar, setAutorizar] = useState(atual?.autorizado ?? false)
  const [areas, setAreas] = useState<string[]>(atual?.areas ?? [])
  const [responsavel, setResponsavel] = useState(atual?.responsavel ?? contexto.nome)
  const [motivo, setMotivo] = useState('')
  const [revogando, setRevogando] = useState(false)

  useEffect(() => {
    setAutorizar(atual?.autorizado ?? false)
    setAreas(atual?.areas ?? [])
    setResponsavel(atual?.responsavel ?? contexto.nome)
  }, [atual?.autorizado, atual?.quando, atual?.responsavel, contexto.nome])

  function alternarArea(chave: string) {
    setAreas(lista =>
      lista.includes(chave) ? lista.filter(item => item !== chave) : [...lista, chave],
    )
  }

  function gravarAutorizacao(nova: typeof bruta) {
    if (!atualizar) return
    atualizar(
      atualConfig => ({
        ...atualConfig,
        autorizacoes: { ...atualConfig.autorizacoes, [estudante.id]: nova! },
      }),
      nova?.revogada
        ? `Família revogou a autorização de compartilhamento de ${estudante.nome}`
        : `Família autorizou o compartilhamento de ${estudante.nome}`,
    )
  }

  function confirmar() {
    if (!podeEditar) return
    gravarAutorizacao({
      estudanteId: estudante.id,
      autorizado: autorizar,
      areas: autorizar ? areas : [],
      responsavel: responsavel.trim() || contexto.nome,
      quando: new Date().toISOString(),
    })
    avisar(
      autorizar
        ? 'Autorização registrada. Só as áreas marcadas ficam visíveis aos Profissionais de Apoio.'
        : 'A família não autorizou o compartilhamento. Nenhuma área fica visível aos Profissionais de Apoio.',
    )
  }

  function revogar() {
    if (!podeEditar) return
    gravarAutorizacao({
      estudanteId: estudante.id,
      autorizado: false,
      areas: [],
      responsavel: responsavel.trim() || contexto.nome,
      quando: new Date().toISOString(),
      revogada: true,
      motivoRevogacao: motivo.trim() || 'Revogada pela família',
    })
    setAutorizar(false)
    setAreas([])
    setRevogando(false)
    setMotivo('')
    avisar('Autorização revogada. Os Profissionais de Apoio deixam de ver as áreas liberadas.')
  }

  const rotulo = atual
    ? `Autorizado em ${formatarData(atual.quando)} por ${atual.responsavel}`
    : bruta?.revogada
      ? `Revogada em ${formatarData(bruta.quando)}${bruta.motivoRevogacao ? ` — ${bruta.motivoRevogacao}` : ''}`
      : 'Ainda não autorizado'

  return (
    <div className={`autorizacao-card ${atual ? 'autorizado' : 'pendente'}`}>
      <div className="autorizacao-topo">
        {atual ? <ShieldCheck aria-hidden="true" /> : <ShieldOff aria-hidden="true" />}
        <div>
          <strong>{campo.titulo}</strong>
          <p className="muted small-note">{campo.instrucao}</p>
        </div>
        <span className="selo-status" data-status={atual ? 'Concluída' : 'Pendente'}>
          {atual ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
          {atual ? 'Autorizado' : 'Pendente'}
        </span>
      </div>

      <p className="muted small-note">{rotulo}</p>

      {podeEditar ? (
        <div className="autorizacao-form">
          <label className="switch-row">
            <input
              type="checkbox"
              checked={autorizar}
              onChange={evento => setAutorizar(evento.target.checked)}
            />
            <span>
              Autorizo o compartilhamento das informações deste PDI com os Profissionais de Apoio
              que acompanham o educando.
            </span>
          </label>

          {autorizar && (
            <fieldset className="autorizacao-areas">
              <legend>Quais áreas podem ser compartilhadas?</legend>
              {AREAS_AUTORIZAVEIS.map(chave => (
                <label key={chave} className="switch-row">
                  <input
                    type="checkbox"
                    checked={areas.includes(chave)}
                    onChange={() => alternarArea(chave)}
                  />
                  <span>{rotuloDaAba(chave)}</span>
                </label>
              ))}
            </fieldset>
          )}

          <label className="campo-simples">
            Nome de quem autoriza
            <input
              value={responsavel}
              onChange={evento => setResponsavel(evento.target.value)}
              placeholder="Nome do responsável"
            />
          </label>

          <div className="form-actions inicio">
            <button type="button" className="primary-btn" onClick={confirmar}>
              <Check aria-hidden="true" /> {atual ? 'Atualizar autorização' : 'Registrar autorização'}
            </button>
            {atual && !revogando && (
              <button type="button" className="outline-btn" onClick={() => setRevogando(true)}>
                <X aria-hidden="true" /> Revogar autorização
              </button>
            )}
          </div>

          {revogando && (
            <div className="revogar-bloco">
              <label className="campo-simples">
                Motivo da revogação (opcional)
                <input
                  value={motivo}
                  onChange={evento => setMotivo(evento.target.value)}
                  placeholder="Ex.: a família prefere conversar antes de compartilhar"
                />
              </label>
              <div className="form-actions inicio">
                <button type="button" className="soft-btn danger" onClick={revogar}>
                  <Trash2 aria-hidden="true" /> Confirmar revogação
                </button>
                <button type="button" className="soft-btn" onClick={() => setRevogando(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="inline-note" role="note">
          <Lock aria-hidden="true" /> Somente a família (ou a administração) pode autorizar ou
          revogar este compartilhamento.
        </p>
      )}
    </div>
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
  audio,
  pranchas,
  compacto,
  acessibilidade,
  aoSalvar,
  aoSalvarAudio,
  aoComentar,
}: {
  id: string
  titulo: string
  instrucao: string
  tipo: CampoConfig['tipo']
  valor: string
  autor: string
  atualizadoEm: string
  acesso: NivelAcesso
  comentarios: EntradaPdi[]
  audio?: EntradaPdi
  pranchas: CategoriaPrancha[]
  compacto?: boolean
  acessibilidade: ControleAcessibilidade
  aoSalvar: (conteudo: string) => Promise<void> | void
  aoSalvarAudio: (conteudo: string) => Promise<void> | void
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
  const [pranchaAberta, setPranchaAberta] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [erroAudio, setErroAudio] = useState('')
  const [suportaGravacao, setSuportaGravacao] = useState(false)
  const ditado = useRef<ReturnType<typeof criarDitado>>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gravadorRef = useRef<MediaRecorder | null>(null)
  const trechosRef = useRef<Blob[]>([])
  const fluxoRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setTexto(valor)
    setItens(lerLista(valor))
  }, [valor])

  useEffect(() => {
    setSuportaGravacao(
      typeof window !== 'undefined' &&
        typeof window.MediaRecorder !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia),
    )
    return () => {
      gravadorRef.current?.state === 'recording' && gravadorRef.current?.stop()
      fluxoRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

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
      transcricao =>
        setTexto(atual => `${atual}${atual ? ' ' : ''}${transcricao}`.slice(0, LIMITE_RESPOSTA)),
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

  async function alternarGravacao() {
    if (gravando) {
      gravadorRef.current?.stop()
      return
    }
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true })
      fluxoRef.current = fluxo
      const gravador = new MediaRecorder(fluxo)
      trechosRef.current = []
      gravador.ondataavailable = evento => {
        if (evento.data.size > 0) trechosRef.current.push(evento.data)
      }
      gravador.onstop = () => {
        fluxo.getTracks().forEach(track => track.stop())
        fluxoRef.current = null
        setGravando(false)
        const blob = new Blob(trechosRef.current, { type: gravador.mimeType || 'audio/webm' })
        const leitor = new FileReader()
        leitor.onload = () => {
          const dados = String(leitor.result ?? '')
          if (dados.length > LIMITE_AUDIO) {
            setErroAudio('O áudio ficou muito longo. Grave um trecho mais curto.')
            return
          }
          void aoSalvarAudio(dados)
        }
        leitor.readAsDataURL(blob)
      }
      gravador.start()
      gravadorRef.current = gravador
      setGravando(true)
      setErroAudio('')
    } catch {
      setErroAudio('Não foi possível usar o microfone. Verifique a permissão do navegador.')
      setGravando(false)
    }
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

          {editavel && (
            <div className="campo-ajudas">
              {acessibilidade.ditado && acessibilidade.suportaMicrofone && (
                <button
                  type="button"
                  className={`mic-btn ${ouvindo ? 'gravando' : ''}`}
                  onClick={alternarDitado}
                  aria-pressed={ouvindo}
                  aria-label={ouvindo ? 'Parar ditado' : `Responder ${titulo} por voz`}
                >
                  {ouvindo ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
                  {ouvindo ? 'Parar ditado' : 'Ditado por voz'}
                </button>
              )}

              {suportaGravacao && (
                <button
                  type="button"
                  className={`mic-btn ${gravando ? 'gravando' : ''}`}
                  onClick={alternarGravacao}
                  aria-pressed={gravando}
                  aria-label={gravando ? 'Parar gravação' : `Gravar resposta em áudio para ${titulo}`}
                >
                  {gravando ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
                  {gravando ? 'Parar gravação' : 'Responder em áudio'}
                </button>
              )}

              {pranchas.length > 0 && (
                <button
                  type="button"
                  className="mic-btn"
                  onClick={() => setPranchaAberta(atual => !atual)}
                  aria-expanded={pranchaAberta}
                >
                  <MessageSquarePlus aria-hidden="true" />
                  {pranchaAberta ? 'Fechar prancha' : 'Prancha de comunicação'}
                </button>
              )}
            </div>
          )}

          {pranchaAberta && pranchas.length > 0 && (
            <PranchaComunicacao
              categorias={pranchas}
              titulo={titulo}
              acessibilidade={acessibilidade}
              aoUsar={frase => {
                setTexto(atual => `${atual}${atual ? ' ' : ''}${frase}`.slice(0, LIMITE_RESPOSTA))
                setPranchaAberta(false)
                acessibilidade.ler(frase)
              }}
            />
          )}

          {audio && (
            <div className="audio-resposta">
              <span className="muted small-note">
                Resposta em áudio · {audio.authorName || 'Equipe'} ·{' '}
                {formatarData(audio.updatedAt)}
              </span>
              <audio controls src={audio.content} preload="none" />
              {editavel && (
                <button
                  type="button"
                  className="soft-btn"
                  onClick={() => void aoSalvarAudio('')}
                  aria-label="Remover a resposta em áudio"
                >
                  <Trash2 aria-hidden="true" /> Remover áudio
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(erroVoz || erroAudio) && (
        <p className="form-error" role="alert">
          {erroVoz || erroAudio}
        </p>
      )}

      {tipo !== 'lista' && (
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
      )}

      {tipo === 'lista' && (
        <div className="answer-actions">
          <span>
            {autor
              ? `Última versão de ${autor} · ${formatarData(atualizadoEm)}`
              : 'Sem itens registrados'}
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
      )}

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

/* ------------------------------------------------------------------ */
/* Prancha de comunicação                                              */
/* ------------------------------------------------------------------ */

export function PranchaComunicacao({
  categorias,
  titulo,
  acessibilidade,
  aoUsar,
}: {
  categorias: CategoriaPrancha[]
  titulo: string
  acessibilidade: ControleAcessibilidade
  aoUsar: (frase: string) => void
}) {
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? '')
  const [selecao, setSelecao] = useState<SimboloPrancha[]>([])
  const [modoUnico, setModoUnico] = useState(false)

  const categoria = categorias.find(item => item.id === categoriaId) ?? categorias[0]
  const frase = selecao.map(simbolo => simbolo.rotulo).join(' ')

  function escolher(simbolo: SimboloPrancha) {
    if (modoUnico) {
      setSelecao([simbolo])
      acessibilidade.ler(simbolo.rotulo)
      return
    }
    setSelecao(atual => [...atual, simbolo])
    acessibilidade.ler(simbolo.rotulo)
  }

  return (
    <section className="prancha" aria-label={`Prancha de comunicação de ${titulo}`}>
      <div className="prancha-topo">
        <div>
          <strong>Prancha de comunicação</strong>
          <p className="muted small-note">
            Toque nos símbolos para montar a frase. Cada símbolo tem o nome escrito embaixo.
          </p>
        </div>
        <div className="modo-toggle" role="group" aria-label="Forma de seleção dos símbolos">
          <button
            type="button"
            aria-pressed={!modoUnico}
            className={!modoUnico ? 'active' : ''}
            onClick={() => setModoUnico(false)}
          >
            Vários símbolos
          </button>
          <button
            type="button"
            aria-pressed={modoUnico}
            className={modoUnico ? 'active' : ''}
            onClick={() => setModoUnico(true)}
          >
            Um símbolo
          </button>
        </div>
      </div>

      <div className="area-tabs" role="tablist" aria-label="Categorias da prancha">
        {categorias.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={categoria?.id === item.id}
            className={`area-tab ${categoria?.id === item.id ? 'active' : ''}`}
            onClick={() => setCategoriaId(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </div>

      <div className="prancha-simbolos">
        {categoria?.simbolos.map(simbolo => (
          <button
            key={simbolo.id}
            type="button"
            className="prancha-simbolo"
            onClick={() => escolher(simbolo)}
            aria-label={`Adicionar ${simbolo.rotulo} à frase`}
          >
            {simbolo.imagem ? (
              <img src={simbolo.imagem} alt="" />
            ) : (
              <span aria-hidden="true">{simbolo.simbolo}</span>
            )}
            <small>{simbolo.rotulo}</small>
          </button>
        ))}
      </div>

      <div className="prancha-frase" aria-live="polite">
        <span>{frase || 'A frase aparece aqui conforme você escolhe os símbolos.'}</span>
        <div className="form-actions inicio">
          <button
            type="button"
            className="soft-btn"
            onClick={() => setSelecao([])}
            disabled={selecao.length === 0}
          >
            <X aria-hidden="true" /> Limpar
          </button>
          <button
            type="button"
            className="soft-btn"
            onClick={() => acessibilidade.ler(frase)}
            disabled={!frase}
          >
            <Volume2 aria-hidden="true" /> Ouvir
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              if (!frase) return
              aoUsar(frase)
              setSelecao([])
            }}
            disabled={!frase}
          >
            <Send aria-hidden="true" /> Usar esta frase
          </button>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Selo de situação                                                    */
/* ------------------------------------------------------------------ */

export function SeloStatus({ status }: { status: StatusEtapa }) {
  const Icone =
    status === 'Concluída' ? CheckCircle2 : status === 'Em andamento' ? Clock : AlertCircle
  return (
    <span className="selo-status" data-status={status}>
      <Icone aria-hidden="true" />
      {status}
    </span>
  )
}
