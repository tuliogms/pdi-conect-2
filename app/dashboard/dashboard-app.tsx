'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Accessibility,
  BarChart3,
  BookOpen,
  Check,
  CircleUserRound,
  Database,
  Ear,
  FileText,
  HardDrive,
  HeartHandshake,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  X,
} from 'lucide-react'
import { isAdmin, iniciaisPerfil, PERFIL_ADMIN, type Perfil } from '@/lib/perfis'
import {
  carregarConfig,
  carregarEntradas,
  gravarIdentidade,
  lerIdentidade,
  salvarConfig,
} from '@/lib/dados'
import {
  acessoNaArea,
  chaveInternaDaArea,
  novoRegistro,
  type AreaNavegacao,
  type Configuracao,
  type EntradaPdi,
  type ModoPersistencia,
  type ModoResposta,
  type SecaoAdmin,
} from '@/lib/pdi-tipos'
import PainelAdmin from './painel-admin'
import AreaParticipante, {
  areaPadraoDoPerfil,
  rotuloDaArea,
  type ContextoUsuario,
} from './area-participante'
import Acompanhamento from './acompanhamento'
import PdiConsolidado from './consolidado'
import { Cabecalho } from './cabecalho'
import { PainelAcessibilidade, useAcessibilidade } from './acessibilidade'

export type Avisar = (texto: string) => void

export type AtualizarConfig = (
  mudanca: (atual: Configuracao) => Configuracao,
  historico?: string,
) => void

/** As oito áreas do PDI + dois utilitários (acessibilidade e configurações). */
const AREAS_PDI: AreaNavegacao[] = ['educando', 'professor', 'aee', 'familia', 'apoio']
const AREAS_DO_PDI: AreaNavegacao[] = [...AREAS_PDI, 'construcao', 'acompanhamento']

function iconeDaArea(area: AreaNavegacao) {
  if (area === 'educando') return <CircleUserRound aria-hidden="true" />
  if (area === 'professor') return <BookOpen aria-hidden="true" />
  if (area === 'aee') return <UsersRound aria-hidden="true" />
  if (area === 'familia') return <HeartHandshake aria-hidden="true" />
  if (area === 'apoio') return <Stethoscope aria-hidden="true" />
  if (area === 'construcao') return <FileText aria-hidden="true" />
  if (area === 'acompanhamento') return <BarChart3 aria-hidden="true" />
  if (area === 'mestre') return <ShieldCheck aria-hidden="true" />
  if (area === 'acessibilidade') return <Ear aria-hidden="true" />
  return <Settings2 aria-hidden="true" />
}

export default function DashboardApp({ perfilInicial }: { perfilInicial: Perfil }) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial)
  const [area, setArea] = useState<AreaNavegacao>(
    isAdmin(perfilInicial) ? 'mestre' : areaPadraoDoPerfil(perfilInicial),
  )
  const [secaoAdmin, setSecaoAdmin] = useState<SecaoAdmin>('Visão geral')
  const [menuAberto, setMenuAberto] = useState(false)
  const [tamanho, setTamanho] = useState(1)
  const [config, setConfig] = useState<Configuracao | null>(null)
  const [modo, setModo] = useState<ModoPersistencia>('local')
  const [mensagem, setMensagem] = useState('')
  const [entradas, setEntradas] = useState<EntradaPdi[]>([])
  const [estudanteFoco, setEstudanteFoco] = useState<string | null>(null)
  const [identidade, setIdentidade] = useState<Record<string, string>>({})
  const configRef = useRef<Configuracao | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const acessibilidade = useAcessibilidade()

  // mantém o estado sincronizado caso a URL mude (ex.: voltar/avançar no navegador)
  useEffect(() => {
    setPerfil(perfilInicial)
    setArea(isAdmin(perfilInicial) ? 'mestre' : areaPadraoDoPerfil(perfilInicial))
  }, [perfilInicial])

  useEffect(() => {
    let ativo = true
    void carregarConfig().then(resultado => {
      if (!ativo) return
      configRef.current = resultado.config
      setConfig(resultado.config)
      setModo(resultado.modo)
    })
    setIdentidade(lerIdentidade())
    return () => {
      ativo = false
    }
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  // menu lateral em telas estreitas: fecha com Esc e trava a rolagem do fundo
  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [menuAberto])

  const avisar = useCallback<Avisar>(texto => {
    setMensagem(texto)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMensagem(''), 3600)
  }, [])

  const atualizar = useCallback<AtualizarConfig>((mudanca, historico) => {
    const atual = configRef.current
    if (!atual) return
    let proximo = mudanca(atual)
    if (historico) {
      proximo = {
        ...proximo,
        historico: [novoRegistro(historico), ...proximo.historico].slice(0, 50),
      }
    }
    configRef.current = proximo
    setConfig(proximo)
    void salvarConfig(proximo).then(setModo)
  }, [])

  const definirModo = useCallback(
    (estudanteId: string, topico: string, modoResposta: ModoResposta) => {
      atualizar(
        atual => ({
          ...atual,
          modos: { ...atual.modos, [`${estudanteId}::${topico}`]: modoResposta },
        }),
      )
    },
    [atualizar],
  )

  const admin = isAdmin(perfil)

  /**
   * Identidade de quem está usando o app. Sem autenticação real, a pessoa
   * escolhe qual cadastro é o seu (útil também para testar permissões).
   */
  const pessoasDoPerfil = useMemo(
    () => (config?.usuarios ?? []).filter(usuario => usuario.perfil === perfil),
    [config?.usuarios, perfil],
  )

  const usuarioAtual = useMemo(() => {
    if (!config) return undefined
    const escolhido = identidade[perfil]
    return (
      pessoasDoPerfil.find(usuario => usuario.id === escolhido) ??
      pessoasDoPerfil.find(usuario => usuario.status === 'Ativo') ??
      pessoasDoPerfil[0]
    )
  }, [config, identidade, perfil, pessoasDoPerfil])

  const contexto: ContextoUsuario = {
    perfil,
    usuarioId: usuarioAtual?.id,
    nome: usuarioAtual?.nome ?? perfil,
  }

  /** Educandos que a pessoa pode ver: só os vinculados a ela, quando houver. */
  const estudantesDoUsuario = useMemo(() => {
    if (!config) return []
    if (usuarioAtual?.estudanteId) {
      return config.estudantes.filter(item => item.id === usuarioAtual.estudanteId)
    }
    return config.estudantes
  }, [config, usuarioAtual?.estudanteId])

  const estudanteVisivel = useMemo(() => {
    if (estudanteFoco) {
      const escolhido = config?.estudantes.find(item => item.id === estudanteFoco)
      if (escolhido) return escolhido
    }
    if (!config) return undefined
    if (usuarioAtual?.estudanteId) {
      return config.estudantes.find(item => item.id === usuarioAtual.estudanteId) ?? config.estudantes[0]
    }
    return config.estudantes[0]
  }, [config, estudanteFoco, usuarioAtual?.estudanteId])

  // carrega as respostas do educando em foco (usado no Início do PDI)
  useEffect(() => {
    let ativo = true
    if (!estudanteVisivel?.id) {
      setEntradas([])
      return
    }
    void carregarEntradas(estudanteVisivel.id).then(resultado => {
      if (ativo) setEntradas(resultado.entradas)
    })
    return () => {
      ativo = false
    }
  }, [estudanteVisivel?.id, modo])

  /**
   * Navegação principal: as áreas do PDI. Só aparecem as áreas a que a pessoa
   * tem acesso (a autorização da família vale aqui); o Usuário Mestre tem a
   * área administrativa e vê todas.
   */
  const { areas, preferencias } = useMemo<{
    areas: AreaNavegacao[]
    preferencias: AreaNavegacao[]
  }>(() => {
    if (!config) return { areas: AREAS_DO_PDI, preferencias: [] }
    if (admin) return { areas: [...AREAS_DO_PDI, 'mestre'], preferencias: [] }
    const liberadas = AREAS_PDI.filter(
      chave =>
        acessoNaArea(config, {
          usuarioId: contexto.usuarioId,
          perfil,
          estudanteId: estudanteVisivel?.id ?? '',
          area: chaveInternaDaArea(chave),
        }) !== 'Sem acesso',
    )
    return {
      areas: [...liberadas, 'construcao', 'acompanhamento'],
      preferencias: ['acessibilidade', 'configuracoes'],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, config, contexto.usuarioId, estudanteVisivel?.id, perfil])

  const menu = useMemo(() => [...areas, ...preferencias], [areas, preferencias])

  // se a área aberta deixar de existir (permissão mudou), volta para uma válida
  useEffect(() => {
    if (!config) return
    if (menu.length > 0 && !menu.includes(area)) setArea(menu[0])
  }, [area, config, menu])

  function trocarIdentidade(usuarioId: string) {
    const proximo = { ...identidade, [perfil]: usuarioId }
    setIdentidade(proximo)
    gravarIdentidade(proximo)
    avisar('Você está usando este cadastro agora.')
  }

  function navegar(novaArea: AreaNavegacao) {
    setArea(novaArea)
    setMenuAberto(false)
  }

  function aumentarTexto() {
    setTamanho(atual => (atual >= 1.25 ? 1 : Number((atual + 0.125).toFixed(3))))
  }

  const classes = [
    'app-shell',
    acessibilidade.altoContraste ? 'alto-contraste' : '',
    acessibilidade.botoesGrandes ? 'botoes-grandes' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const nomeApp = config?.institucional.nomeApp || 'PDI Interativo'

  return (
    <main className={classes} style={{ fontSize: `${tamanho}em` }}>
      <header className="topbar">
        <button
          className="mobile-menu"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls="menu-lateral"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          {menuAberto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <div className="brand-lockup">
          <img
            className="app-logo"
            src={config?.institucional.logoUrl || '/logo-uemg.png'}
            alt={config?.institucional.escola || 'Logo da instituição'}
          />
          <div>
            <strong>{nomeApp}</strong>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="outline-btn"
            onClick={aumentarTexto}
            title="Ajusta o tamanho do texto (volta ao normal após 125%)"
          >
            <Accessibility aria-hidden="true" /> Acessibilidade
          </button>
          <button
            className="icon-btn"
            aria-label="Abrir configurações"
            onClick={() => navegar(admin ? 'mestre' : 'configuracoes')}
          >
            <Settings2 aria-hidden="true" />
          </button>
          <button className="icon-btn" aria-label="Sair da conta" onClick={() => router.push('/login')}>
            <LogOut aria-hidden="true" />
          </button>
          <div className="profile-chip">
            <b>{iniciaisPerfil(perfil)}</b>
            <span>{perfil}</span>
          </div>
        </div>
      </header>

      <div className="layout">
        {menuAberto && (
          <button
            type="button"
            className="menu-scrim"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
          />
        )}
        <aside
          id="menu-lateral"
          className={`sidebar ${menuAberto ? 'open' : ''}`}
          aria-hidden={undefined}
        >
          <div className="school-card">
            <div className="school-logos">
              <img src="/logo-mestrado-inclusiva.png" alt="ProfEi — Mestrado em Educação Inclusiva" />
              <span className="logo-separator" aria-hidden="true" />
              <img src="/logo-uemg.png" alt="UEMG" />
            </div>
            <strong className="sidebar-app-name">{nomeApp}</strong>
            {config?.institucional.escola && (
              <span className="muted small-note">{config.institucional.escola}</span>
            )}
          </div>
          <p className="eyebrow">Áreas do PDI</p>
          {areas.map(item => (
            <button
              key={item}
              className={`side-link ${area === item ? 'active' : ''}`}
              aria-current={area === item ? 'page' : undefined}
              onClick={() => navegar(item)}
            >
              {iconeDaArea(item)}
              {rotuloDaArea(item)}
            </button>
          ))}
          {preferencias.length > 0 && (
            <>
              <p className="eyebrow">Preferências</p>
              {preferencias.map(item => (
                <button
                  key={item}
                  className={`side-link ${area === item ? 'active' : ''}`}
                  aria-current={area === item ? 'page' : undefined}
                  onClick={() => navegar(item)}
                >
                  {iconeDaArea(item)}
                  {rotuloDaArea(item)}
                </button>
              ))}
            </>
          )}
          <div className="sidebar-bottom">
            <div className="support-card">
              <Check aria-hidden="true" />
              <div>
                <strong>{admin ? 'Acesso total' : 'Ambiente seguro'}</strong>
                <span>{admin ? 'Perfil administrador' : 'Seus dados estão protegidos'}</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="content">
          {mensagem && (
            <div className="status-message" role="status">
              {mensagem}
            </div>
          )}

          <div className={`mode-banner ${modo === 'banco' ? 'banco' : ''}`} role="note">
            {modo === 'banco' ? <Database aria-hidden="true" /> : <HardDrive aria-hidden="true" />}
            <p>
              {modo === 'banco' ? (
                <>
                  Os dados estão sendo gravados no <strong>banco de dados</strong>.
                </>
              ) : (
                <>
                  <strong>Modo local:</strong> o que for digitado fica gravado apenas neste
                  navegador. Configure <code>DATABASE_URL</code> para gravar no banco.
                </>
              )}
            </p>
          </div>

          {!admin && pessoasDoPerfil.length > 0 && (
            <div className="identidade-bar no-print">
              <label htmlFor="identidade">
                Você está usando o cadastro de
                <select
                  id="identidade"
                  value={usuarioAtual?.id ?? ''}
                  onChange={evento => trocarIdentidade(evento.target.value)}
                >
                  {pessoasDoPerfil.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome} ({usuario.status})
                    </option>
                  ))}
                </select>
              </label>
              <span className="muted small-note">
                As permissões definidas em “Permissões de acesso” valem para este cadastro.
              </span>
            </div>
          )}

          {config === null ? (
            <p className="muted" role="status">
              Carregando os dados…
            </p>
          ) : area === 'mestre' ? (
            <PainelAdmin
              secao={secaoAdmin}
              config={config}
              atualizar={atualizar}
              avisar={avisar}
              onNavegar={setSecaoAdmin}
              onAbrirPdi={estudanteId => {
                setEstudanteFoco(estudanteId)
                navegar('educando')
              }}
              modo={modo}
              contexto={contexto}
              acessibilidade={acessibilidade}
              definirModo={definirModo}
            />
          ) : area === 'construcao' ? (
            <PdiConsolidado
              config={config}
              estudantesPermitidos={estudantesDoUsuario}
              {...(estudanteVisivel ? { estudanteIdInicial: estudanteVisivel.id } : {})}
            />
          ) : area === 'acompanhamento' ? (
            <Acompanhamento
              config={config}
              autor={contexto.nome}
              avisar={avisar}
              estudantesPermitidos={estudantesDoUsuario}
              {...(estudanteVisivel ? { estudanteIdInicial: estudanteVisivel.id } : {})}
            />
          ) : area === 'acessibilidade' ? (
            <PainelAcessibilidade controle={acessibilidade} />
          ) : area === 'configuracoes' ? (
            <ConfiguracoesParticipante
              config={config}
              contexto={contexto}
              modo={modo}
              estudante={estudanteVisivel}
              onNavegar={() => navegar('acessibilidade')}
            />
          ) : (
            <AreaParticipante
              areaFixa={area}
              contexto={contexto}
              config={config}
              ehAdmin={admin}
              avisar={avisar}
              acessibilidade={acessibilidade}
              definirModo={definirModo}
              atualizar={atualizar}
              estudantesPermitidos={estudantesDoUsuario}
              {...(estudanteVisivel ? { estudanteIdInicial: estudanteVisivel.id } : {})}
            />
          )}
        </section>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Configurações do participante                                       */
/* ------------------------------------------------------------------ */

function ConfiguracoesParticipante({
  config,
  contexto,
  modo,
  estudante,
  onNavegar,
}: {
  config: Configuracao
  contexto: ContextoUsuario
  modo: ModoPersistencia
  estudante?: { nome: string }
  onNavegar: () => void
}) {
  return (
    <section>
      <Cabecalho
        titulo="Configurações"
        descricao="Preferências da sua conta e recursos de acessibilidade."
      />
      <article className="editor-card">
        <h2>Seu perfil</h2>
        <p className="muted">
          Você está acessando como <strong>{contexto.nome}</strong> ({contexto.perfil}). O perfil
          define quais áreas do PDI você pode visualizar, comentar ou editar.
        </p>
        <p className="muted">
          {estudante
            ? `Educando vinculado: ${estudante.nome}.`
            : 'Seu cadastro ainda não está vinculado a um educando.'}
        </p>
        <p className="muted">
          Onde os dados ficam:{' '}
          {modo === 'banco' ? 'banco de dados da instituição' : 'neste navegador'}.
        </p>
        <div className="form-actions inicio">
          <button className="outline-btn" onClick={onNavegar}>
            <Accessibility aria-hidden="true" /> Abrir acessibilidade
          </button>
        </div>
      </article>

      <article className="editor-card">
        <h2>Identidade da instituição</h2>
        <p className="muted">
          Nome do sistema: <strong>{config.institucional.nomeApp}</strong>.
        </p>
        <p className="muted">
          Escola: <strong>{config.institucional.escola || 'não informada'}</strong>. A identidade é
          configurada pelo Usuário Mestre.
        </p>
      </article>
    </section>
  )
}

export { PERFIL_ADMIN }
