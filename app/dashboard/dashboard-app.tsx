'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Accessibility,
  BarChart3,
  Check,
  ChevronRight,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { PERFIL_ADMIN, isAdmin, iniciaisPerfil, type Perfil } from '@/lib/perfis'

type SecaoAdmin =
  | 'Visão geral'
  | 'Usuários'
  | 'Estudantes'
  | 'Planos de PDI'
  | 'Permissões de acesso'
  | 'Campos e formulários'
  | 'Acompanhamento'
  | 'Configurações'

type Status = 'Ativo' | 'Aguardando'
type NivelPermissao = 'Sem acesso' | 'Visualizar' | 'Editar' | 'Comentar'

type Usuario = {
  nome: string
  email: string
  perfil: Perfil
  estudante: string
  status: Status
}

type Avisar = (texto: string) => void

const perfis: Perfil[] = [
  'Estudante',
  'Professor',
  'Professor de AEE',
  'Família',
  'Profissional da Saúde',
  PERFIL_ADMIN,
]

const usuariosIniciais: Usuario[] = [
  { nome: 'João da Silva', email: 'joao@pdi.com', perfil: 'Estudante', estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Ana Souza', email: 'ana@escola.com', perfil: 'Professor', estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'João Pereira', email: 'joao.professor@escola.com', perfil: 'Professor', estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Carla Mendes', email: 'carla@escola.com', perfil: 'Professor', estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Marcos Souza', email: 'marcos@escola.com', perfil: 'Professor de AEE', estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Ana da Silva', email: 'ana@familia.com', perfil: 'Família', estudante: 'João da Silva', status: 'Aguardando' },
]

const abasPermissao = [
  'Área do Estudante',
  'Área do Professor',
  'Área do AEE',
  'Área da Família',
  'Área da Saúde',
  'PDI',
  'Acompanhamento',
]

const niveisPermissao: NivelPermissao[] = ['Visualizar', 'Editar', 'Comentar', 'Sem acesso']

const menuAdmin: SecaoAdmin[] = [
  'Visão geral',
  'Usuários',
  'Estudantes',
  'Planos de PDI',
  'Permissões de acesso',
  'Campos e formulários',
  'Acompanhamento',
  'Configurações',
]

function iconeDaSecao(item: SecaoAdmin) {
  if (item === 'Visão geral') return <Home aria-hidden="true" />
  if (item === 'Usuários') return <Users aria-hidden="true" />
  if (item === 'Permissões de acesso') return <ShieldCheck aria-hidden="true" />
  if (item === 'Acompanhamento') return <BarChart3 aria-hidden="true" />
  if (item === 'Campos e formulários') return <LayoutGrid aria-hidden="true" />
  if (item === 'Configurações') return <Settings2 aria-hidden="true" />
  return <FileText aria-hidden="true" />
}

export default function DashboardApp({ perfilInicial }: { perfilInicial: Perfil }) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial)
  const [secao, setSecao] = useState<SecaoAdmin>('Visão geral')
  const [menuAberto, setMenuAberto] = useState(false)
  const [tamanho, setTamanho] = useState(1)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Perfil | 'Todos'>('Todos')
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais)
  const [permissoes, setPermissoes] = useState<Record<string, NivelPermissao>>({})
  const [mensagem, setMensagem] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // mantém o estado sincronizado caso a URL mude (ex.: voltar/avançar no navegador)
  useEffect(() => {
    setPerfil(perfilInicial)
  }, [perfilInicial])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const avisar = useCallback<Avisar>(texto => {
    setMensagem(texto)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMensagem(''), 2600)
  }, [])

  const admin = isAdmin(perfil)
  const menu: SecaoAdmin[] = admin ? menuAdmin : ['Visão geral', 'Configurações']

  const filtrados = useMemo(
    () =>
      usuarios.filter(
        usuario =>
          (filtro === 'Todos' || usuario.perfil === filtro) &&
          `${usuario.nome} ${usuario.email}`.toLowerCase().includes(busca.toLowerCase()),
      ),
    [usuarios, filtro, busca],
  )

  function adicionarUsuario() {
    setUsuarios(lista => [
      ...lista,
      { nome: 'Novo usuário', email: 'novo@pdi.com', perfil: 'Professor', estudante: 'Não vinculado', status: 'Aguardando' },
    ])
    avisar('Novo usuário adicionado. Edite os dados na lista.')
  }

  function navegar(item: SecaoAdmin) {
    setSecao(item)
    setMenuAberto(false)
  }

  function aumentarTexto() {
    setTamanho(atual => (atual >= 1.25 ? 1 : Number((atual + 0.125).toFixed(3))))
  }

  return (
    <main className="app-shell" style={{ fontSize: `${tamanho}em` }}>
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
          <img className="app-logo" src="/logo-uemg.png" alt="UEMG" />
          <div>
            <strong>PDI Interativo</strong>
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
            onClick={() => navegar('Configurações')}
          >
            <Settings2 aria-hidden="true" />
          </button>
          <button
            className="icon-btn"
            aria-label="Sair da conta"
            onClick={() => router.push('/login')}
          >
            <LogOut aria-hidden="true" />
          </button>
          <div className="profile-chip">
            <b>{iniciaisPerfil(perfil)}</b>
            <span>{perfil}</span>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside id="menu-lateral" className={`sidebar ${menuAberto ? 'open' : ''}`}>
          <div className="school-card">
            <div className="school-logos">
              <img src="/logo-mestrado-inclusiva.png" alt="ProfEi — Mestrado em Educação Inclusiva" />
              <span className="logo-separator" aria-hidden="true" />
              <img src="/logo-uemg.png" alt="UEMG" />
            </div>
            <strong className="sidebar-app-name">PDI Interativo</strong>
          </div>
          <p className="eyebrow">{admin ? 'Administração do sistema' : 'Navegação principal'}</p>
          {menu.map(item => (
            <button
              key={item}
              className={`side-link ${secao === item ? 'active' : ''}`}
              aria-current={secao === item ? 'page' : undefined}
              onClick={() => navegar(item)}
            >
              {iconeDaSecao(item)}
              {item}
            </button>
          ))}
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
          {admin ? (
            <AdminContent
              secao={secao}
              filtrados={filtrados}
              usuarios={usuarios}
              busca={busca}
              setBusca={setBusca}
              filtro={filtro}
              setFiltro={setFiltro}
              adicionarUsuario={adicionarUsuario}
              permissoes={permissoes}
              setPermissoes={setPermissoes}
              avisar={avisar}
            />
          ) : secao === 'Configurações' ? (
            <ParticipantSettings perfil={perfil} />
          ) : (
            <ParticipantContent perfil={perfil} avisar={avisar} />
          )}
        </section>
      </div>
    </main>
  )
}

type AdminContentProps = {
  secao: SecaoAdmin
  filtrados: Usuario[]
  usuarios: Usuario[]
  busca: string
  setBusca: (valor: string) => void
  filtro: Perfil | 'Todos'
  setFiltro: (valor: Perfil | 'Todos') => void
  adicionarUsuario: () => void
  permissoes: Record<string, NivelPermissao>
  setPermissoes: (valor: Record<string, NivelPermissao>) => void
  avisar: Avisar
}

function AdminContent({
  secao,
  filtrados,
  usuarios,
  busca,
  setBusca,
  filtro,
  setFiltro,
  adicionarUsuario,
  permissoes,
  setPermissoes,
  avisar,
}: AdminContentProps) {
  if (secao === 'Usuários') return <UsersPanel {...{ filtrados, busca, setBusca, filtro, setFiltro, adicionarUsuario, avisar }} />
  if (secao === 'Permissões de acesso')
    return <PermissionPanel usuarios={usuarios} permissoes={permissoes} setPermissoes={setPermissoes} avisar={avisar} />
  if (secao === 'Campos e formulários') return <FieldsPanel avisar={avisar} />
  return <Overview secao={secao} onAction={(item: string) => avisar(`${item} selecionado.`)} />
}

function HeaderAdmin({
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
        <p className="eyebrow">Administração geral do PDI Interativo</p>
        <h1>{titulo}</h1>
        <p className="muted">{descricao}</p>
      </div>
      {acao && (
        <button className="primary-btn" onClick={onAction}>
          <Plus aria-hidden="true" /> {acao}
        </button>
      )}
    </div>
  )
}

function UsersPanel({
  filtrados,
  busca,
  setBusca,
  filtro,
  setFiltro,
  adicionarUsuario,
  avisar,
}: {
  filtrados: Usuario[]
  busca: string
  setBusca: (valor: string) => void
  filtro: Perfil | 'Todos'
  setFiltro: (valor: Perfil | 'Todos') => void
  adicionarUsuario: () => void
  avisar: Avisar
}) {
  const idFiltro = 'filtro-perfil'
  return (
    <section aria-labelledby="titulo-usuarios">
      <div className="welcome-row admin-heading">
        <div>
          <p className="eyebrow">Administração geral do PDI Interativo</p>
          <h1 id="titulo-usuarios">Usuários</h1>
          <p className="muted">Gerencie perfis, vínculos e status de acesso.</p>
        </div>
        <button className="primary-btn" onClick={adicionarUsuario}>
          <Plus aria-hidden="true" /> Cadastrar usuário
        </button>
      </div>
      <div className="toolbar">
        <label className="search-field" htmlFor="busca-usuarios">
          <Search aria-hidden="true" />
          <span className="sr-only">Pesquisar usuários</span>
          <input
            id="busca-usuarios"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Pesquisar por nome ou e-mail"
          />
        </label>
        <label className="sr-only" htmlFor={idFiltro}>
          Filtrar por perfil
        </label>
        <select
          id={idFiltro}
          value={filtro}
          onChange={e => setFiltro(e.target.value as Perfil | 'Todos')}
        >
          <option value="Todos">Todos</option>
          {perfis.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-table" aria-label="Lista de usuários">
        <div className="table-head">
          <span>Usuário</span>
          <span>Perfil</span>
          <span>Estudante vinculado</span>
          <span>Status</span>
          <span>Ação</span>
        </div>
        {filtrados.map(usuario => (
          <div className="table-row" key={usuario.email}>
            <div>
              <strong>{usuario.nome}</strong>
              <small>{usuario.email}</small>
            </div>
            <span>{usuario.perfil}</span>
            <span>{usuario.estudante}</span>
            <span className={`status-pill ${usuario.status === 'Ativo' ? 'success' : ''}`}>
              {usuario.status}
            </span>
            <button className="soft-btn" onClick={() => avisar(`Acesso de ${usuario.nome} selecionado.`)}>
              Gerenciar acesso
            </button>
          </div>
        ))}
        {filtrados.length === 0 && <p className="muted">Nenhum usuário encontrado para esta busca.</p>}
      </div>
    </section>
  )
}

function Overview({ secao, onAction }: { secao: SecaoAdmin; onAction: (item: string) => void }) {
  return (
    <section>
      <HeaderAdmin
        titulo={secao === 'Visão geral' ? 'Olá, Usuário Mestre!' : secao}
        descricao={
          secao === 'Visão geral'
            ? 'Administração geral do PDI Interativo'
            : 'Organize e acompanhe as informações do sistema.'
        }
      />
      <div className="summary-grid">
        {[
          ['Usuários', '24 cadastrados'],
          ['Estudantes', '12 cadastrados'],
          ['PDIs ativos', '10 em andamento'],
          ['Acompanhamento', '8 em acompanhamento'],
          ['Aguardando configuração', '4 usuários'],
          ['Permissões configuradas', '18 áreas'],
        ].map(([titulo, valor]) => (
          <article className="summary-card" key={titulo}>
            <span>{titulo}</span>
            <strong>{valor}</strong>
            <ChevronRight aria-hidden="true" />
          </article>
        ))}
      </div>
      <div className="admin-shortcuts">
        <h2>Atalhos administrativos</h2>
        <div className="shortcut-grid">
          {[
            'Gerenciar usuários',
            'Gerenciar permissões',
            'Estudantes',
            'Planos de PDI',
            'Campos e formulários',
            'Configurações',
          ].map(item => (
            <button className="shortcut-card" key={item} onClick={() => onAction(item)}>
              <strong>{item}</strong>
              <ChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className="audit-card">
        <h2>Histórico de alterações</h2>
        <p>
          <strong>Carlos Souza</strong> editou estratégia de AEE no PDI de João da Silva · 28/09/2026 — 14:35
        </p>
        <p>
          <strong>Carla Mendes</strong> adicionou uma contribuição no PDI de João da Silva · 28/09/2026 — 13:20
        </p>
      </div>
    </section>
  )
}

function PermissionPanel({
  usuarios,
  permissoes,
  setPermissoes,
  avisar,
}: {
  usuarios: Usuario[]
  permissoes: Record<string, NivelPermissao>
  setPermissoes: (valor: Record<string, NivelPermissao>) => void
  avisar: Avisar
}) {
  // antes só professores apareciam aqui: AEE, família e saúde ficavam sem permissão
  const pessoas = usuarios.filter(usuario => usuario.perfil !== PERFIL_ADMIN)
  const [usuarioId, setUsuarioId] = useState(pessoas[0]?.email ?? '')
  const [estudante, setEstudante] = useState('João da Silva')

  const chave = (aba: string) => `${usuarioId}::${estudante}::${aba}`
  const nivelAtual = (aba: string): NivelPermissao =>
    permissoes[chave(aba)] ?? (usuarios.find(u => u.email === usuarioId)?.perfil === 'Estudante' ? 'Comentar' : 'Visualizar')
  const atualizarNivel = (aba: string, nivel: NivelPermissao) =>
    setPermissoes({ ...permissoes, [chave(aba)]: nivel })
  const selecionado = pessoas.find(usuario => usuario.email === usuarioId)

  return (
    <section>
      <HeaderAdmin
        titulo="Permissões de acesso"
        descricao="Defina o acesso de cada pessoa em cada PDI, sem aplicar a regra para todos os usuários."
      />
      <div className="permission-context">
        <strong>Permissão individual</strong>
        <span>
          {selecionado?.nome || 'Selecione uma pessoa'} → {estudante}
        </span>
      </div>
      <div className="permission-toolbar">
        <label>
          Usuário
          <select
            aria-label="Selecionar usuário"
            value={usuarioId}
            onChange={e => setUsuarioId(e.target.value)}
          >
            {pessoas.map(usuario => (
              <option key={usuario.email} value={usuario.email}>
                {usuario.nome} — {usuario.perfil}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estudante
          <select
            aria-label="Selecionar estudante"
            value={estudante}
            onChange={e => setEstudante(e.target.value)}
          >
            <option>João da Silva</option>
          </select>
        </label>
      </div>
      <div className="permission-table">
        {abasPermissao.map(aba => (
          <fieldset className="permission-row" key={aba}>
            <legend>{aba}</legend>
            <label>
              Nível de acesso
              <select
                value={nivelAtual(aba)}
                onChange={e => atualizarNivel(aba, e.target.value as NivelPermissao)}
              >
                {niveisPermissao.map(nivel => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </label>
            <span className="permission-help">
              Somente para {selecionado?.nome || 'usuário selecionado'} neste PDI
            </span>
          </fieldset>
        ))}
      </div>
      <button
        className="primary-btn"
        onClick={() => avisar(`Permissões de ${selecionado?.nome ?? 'usuário'} para o PDI de ${estudante} salvas.`)}
      >
        <Check aria-hidden="true" /> Salvar permissões
      </button>
    </section>
  )
}

function FieldsPanel({ avisar }: { avisar: Avisar }) {
  const [campos, setCampos] = useState([
    'Necessidades educacionais observadas',
    'Recursos de acessibilidade',
    'Estratégias de AEE',
    'Evolução do estudante',
  ])

  return (
    <section>
      <HeaderAdmin
        titulo="Campos e formulários"
        descricao="Configure os campos das áreas colaborativas sem alterar os seis tópicos fixos do estudante."
        acao="Adicionar campo"
        onAction={() => setCampos([...campos, 'Novo campo personalizado'])}
      />
      <div className="field-config-list">
        {campos.map((campo, index) => (
          <div className="field-config" key={`${campo}-${index}`}>
            <LayoutGrid aria-hidden="true" />
            <div>
              <strong>{campo}</strong>
              <small>Texto longo · Ativo · Opcional</small>
            </div>
            <button
              className="icon-btn"
              aria-label={`Excluir ${campo}`}
              onClick={() => {
                setCampos(campos.filter((_, i) => i !== index))
                avisar('Campo removido.')
              }}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <p className="muted">
        Os tópicos do estudante — Meu perfil, Meus interesses, Como aprendo melhor, Facilidades e
        dificuldades, Meus objetivos e Meu desenvolvimento — permanecem fixos.
      </p>
    </section>
  )
}

function ParticipantContent({ perfil, avisar }: { perfil: Perfil; avisar: Avisar }) {
  return (
    <section>
      <HeaderAdmin
        titulo={`Área do ${perfil}`}
        descricao="Contribua para o desenvolvimento individual com segurança e clareza."
      />
      <article className="editor-card">
        <h2>Contribuição do participante</h2>
        <p className="muted">Selecione uma área para registrar informações do PDI.</p>
        <button className="primary-btn" onClick={() => avisar('Área de contribuição aberta.')}>
          Abrir contribuição <ChevronRight aria-hidden="true" />
        </button>
      </article>
    </section>
  )
}

function ParticipantSettings({ perfil }: { perfil: Perfil }) {
  return (
    <section>
      <HeaderAdmin
        titulo="Configurações"
        descricao="Preferências da sua conta e recursos de acessibilidade."
      />
      <article className="editor-card">
        <h2>Seu perfil</h2>
        <p className="muted">
          Você está acessando como <strong>{perfil}</strong>. O perfil define quais áreas do PDI
          você pode visualizar e editar.
        </p>
        <p className="muted">
          Use o botão <strong>Acessibilidade</strong> na barra superior para aumentar o tamanho do
          texto. O tamanho volta ao normal após 125%.
        </p>
      </article>
    </section>
  )
}
