'use client'

import { useEffect, useMemo, useState } from 'react'
import { Accessibility, BarChart3, BookOpen, Check, ChevronRight, FileText, Home, LayoutGrid, Menu, Plus, Search, Settings2, ShieldCheck, Users, X } from 'lucide-react'

type Perfil = 'Estudante' | 'Professor' | 'Professor de AEE' | 'Família' | 'Profissional da Saúde' | 'Usuário Mestre'
type SecaoAdmin = 'Visão geral' | 'Usuários' | 'Estudantes' | 'Planos de PDI' | 'Permissões de acesso' | 'Campos e formulários' | 'Acompanhamento' | 'Configurações'

const perfis: Perfil[] = ['Estudante', 'Professor', 'Professor de AEE', 'Família', 'Profissional da Saúde', 'Usuário Mestre']
const usuariosIniciais = [
  { nome: 'João da Silva', email: 'joao@pdi.com', perfil: 'Estudante' as Perfil, estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Ana Souza', email: 'ana@escola.com', perfil: 'Professor' as Perfil, estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'João Pereira', email: 'joao.professor@escola.com', perfil: 'Professor' as Perfil, estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Carla Mendes', email: 'carla@escola.com', perfil: 'Professor' as Perfil, estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Marcos Souza', email: 'marcos@escola.com', perfil: 'Professor de AEE' as Perfil, estudante: 'João da Silva', status: 'Ativo' },
  { nome: 'Ana da Silva', email: 'ana@familia.com', perfil: 'Família' as Perfil, estudante: 'João da Silva', status: 'Aguardando' },
]
const abasPermissao = ['Área do Estudante', 'Área do Professor', 'Área do AEE', 'Área da Família', 'Área da Saúde', 'PDI', 'Acompanhamento']

export default function Dashboard() {
  const [perfil, setPerfil] = useState<Perfil>('Estudante')
  const [secao, setSecao] = useState<SecaoAdmin>('Visão geral')
  const [menuAberto, setMenuAberto] = useState(false)
  const [tamanho, setTamanho] = useState(1)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Perfil | 'Todos'>('Todos')
  const [usuarios, setUsuarios] = useState(usuariosIniciais)
  const [permissoes, setPermissoes] = useState<Record<string, 'Sem acesso' | 'Visualizar' | 'Editar' | 'Comentar'>>({})
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const valor = new URLSearchParams(window.location.search).get('perfil')
    if (valor === 'Professor de AEE' || valor === 'AEE') setPerfil('Professor de AEE')
    else if (valor === 'Profissional da saúde') setPerfil('Profissional da Saúde')
    else if (valor === 'Usuário mestre' || valor === 'Usuário Mestre') { setPerfil('Usuário Mestre'); setSecao('Visão geral') }
    else if (perfis.includes(valor as Perfil)) setPerfil(valor as Perfil)
  }, [])

  const admin = perfil === 'Usuário Mestre'
  const avisar = (texto: string) => { setMensagem(texto); window.setTimeout(() => setMensagem(''), 2600) }
  const filtrados = useMemo(() => usuarios.filter(usuario => (filtro === 'Todos' || usuario.perfil === filtro) && `${usuario.nome} ${usuario.email}`.toLowerCase().includes(busca.toLowerCase())), [usuarios, filtro, busca])
  const menu = admin ? ['Visão geral', 'Usuários', 'Estudantes', 'Planos de PDI', 'Permissões de acesso', 'Campos e formulários', 'Acompanhamento', 'Configurações'] as SecaoAdmin[] : ['Visão geral'] as SecaoAdmin[]

  function adicionarUsuario() {
    setUsuarios(lista => [...lista, { nome: 'Novo usuário', email: 'novo@pdi.com', perfil: 'Professor' as Perfil, estudante: 'Não vinculado', status: 'Aguardando' }])
    avisar('Novo usuário adicionado. Edite os dados na lista.')
  }

  return <main className="app-shell" style={{ fontSize: `${tamanho}em` }}>
    <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuAberto(!menuAberto)}><Menu /></button><div className="brand-lockup"><img className="app-logo" src="/logo-uemg.png" alt="UEMG" /><div><strong>PDI Interativo</strong></div></div><div className="top-actions"><button className="outline-btn" onClick={() => setTamanho(tamanho >= 1.25 ? 1 : tamanho + .125)}><Accessibility /> Acessibilidade</button><button className="icon-btn" aria-label="Abrir configurações" onClick={() => setSecao('Configurações')}><Settings2 /></button><div className="profile-chip"><b>{admin ? 'UM' : 'JS'}</b><span>{perfil}</span></div></div></header>
    <div className="layout"><aside className={`sidebar ${menuAberto ? 'open' : ''}`}><div className="school-card"><div className="school-logos"><img src="/logo-mestrado-inclusiva.png" alt="ProfEi — Mestrado em Educação Inclusiva" /><span className="logo-separator" aria-hidden="true" /><img src="/logo-uemg.png" alt="UEMG" /></div><strong className="sidebar-app-name">PDI Interativo</strong></div><p className="eyebrow">{admin ? 'Administração do sistema' : 'Navegação principal'}</p>{menu.map(item => <button key={item} className={`side-link ${secao === item ? 'active' : ''}`} onClick={() => { setSecao(item); setMenuAberto(false) }}>{item === 'Visão geral' ? <Home /> : item === 'Usuários' ? <Users /> : item === 'Permissões de acesso' ? <ShieldCheck /> : item === 'Acompanhamento' ? <BarChart3 /> : item === 'Campos e formulários' ? <LayoutGrid /> : <FileText />}{item}</button>)}<div className="sidebar-bottom"><div className="support-card"><Check /><div><strong>{admin ? 'Acesso total' : 'Ambiente seguro'}</strong><span>{admin ? 'Perfil administrador' : 'Seus dados estão protegidos'}</span></div></div></div></aside>
      <section className="content">{mensagem && <div className="status-message" role="status">{mensagem}</div>}{admin ? <AdminContent secao={secao} filtrados={filtrados} usuarios={usuarios} busca={busca} setBusca={setBusca} filtro={filtro} setFiltro={setFiltro} adicionarUsuario={adicionarUsuario} permissoes={permissoes} setPermissoes={setPermissoes} avisar={avisar} /> : <ParticipantContent perfil={perfil} avisar={avisar} />}</section></div></main>
}

function AdminContent({ secao, filtrados, usuarios, busca, setBusca, filtro, setFiltro, adicionarUsuario, permissoes, setPermissoes, avisar }: any) {
  if (secao === 'Usuários') return <section aria-labelledby="titulo-admin"><HeaderAdmin titulo="Usuários" descricao="Gerencie perfis, vínculos e status de acesso." acao="Cadastrar usuário" onAction={adicionarUsuario} /><div className="toolbar"><label className="search-field"><Search /><span className="sr-only">Pesquisar usuários</span><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar por nome ou e-mail" /></label><select value={filtro} onChange={e => setFiltro(e.target.value)} aria-label="Filtrar por perfil"><option>Todos</option>{perfis.map((item: string) => <option key={item}>{item}</option>)}</select></div><div className="admin-table" role="table" aria-label="Lista de usuários"><div className="table-head" role="row"><span>Usuário</span><span>Perfil</span><span>Estudante vinculado</span><span>Status</span><span>Ação</span></div>{filtrados.map((usuario: any) => <div className="table-row" role="row" key={usuario.email}><div><strong>{usuario.nome}</strong><small>{usuario.email}</small></div><span>{usuario.perfil}</span><span>{usuario.estudante}</span><span className={`status-pill ${usuario.status === 'Ativo' ? 'success' : ''}`}>{usuario.status}</span><button className="soft-btn" onClick={() => avisar(`Acesso de ${usuario.nome} selecionado.`)}>Gerenciar acesso</button></div>)}</div></section>
  if (secao === 'Permissões de acesso') return <PermissionPanel usuarios={usuarios} permissoes={permissoes} setPermissoes={setPermissoes} avisar={avisar} />
  if (secao === 'Campos e formulários') return <FieldsPanel avisar={avisar} />
  return <Overview secao={secao} onAction={(item: string) => avisar(`${item} selecionado.`)} />
}

function HeaderAdmin({ titulo, descricao, acao, onAction }: any) { return <div className="welcome-row admin-heading"><div><p className="eyebrow">Administração geral do PDI Interativo</p><h1 id="titulo-admin">{titulo}</h1><p className="muted">{descricao}</p></div>{acao && <button className="primary-btn" onClick={onAction}><Plus /> {acao}</button>}</div> }
function Overview({ secao, onAction }: any) { return <section><HeaderAdmin titulo={secao === 'Visão geral' ? 'Olá, Usuário Mestre!' : secao} descricao={secao === 'Visão geral' ? 'Administração geral do PDI Interativo' : 'Organize e acompanhe as informações do sistema.'} /><div className="summary-grid">{[['Usuários', '24 cadastrados'], ['Estudantes', '12 cadastrados'], ['PDIs ativos', '10 em andamento'], ['Acompanhamento', '8 em acompanhamento'], ['Aguardando configuração', '4 usuários'], ['Permissões configuradas', '18 áreas']].map(([titulo, valor]) => <article className="summary-card" key={titulo}><span>{titulo}</span><strong>{valor}</strong><ChevronRight /></article>)}</div><div className="admin-shortcuts"><h2>Atalhos administrativos</h2><div className="shortcut-grid">{['Gerenciar usuários', 'Gerenciar permissões', 'Estudantes', 'Planos de PDI', 'Campos e formulários', 'Configurações'].map(item => <button className="shortcut-card" key={item} onClick={() => onAction(item)}><strong>{item}</strong><ChevronRight /></button>)}</div></div><div className="audit-card"><h2>Histórico de alterações</h2><p><strong>Carlos Souza</strong> editou estratégia de AEE no PDI de João da Silva · 28/09/2026 — 14:35</p><p><strong>Carla Mendes</strong> adicionou uma contribuição no PDI de João da Silva · 28/09/2026 — 13:20</p></div></section> }
function PermissionPanel({ usuarios, permissoes, setPermissoes, avisar }: any) { const perfisPermitidos = ['Visualizar', 'Editar', 'Comentar', 'Sem acesso']; const professores = usuarios.filter((usuario: any) => usuario.perfil === 'Professor'); const [usuarioId, setUsuarioId] = useState(professores[0]?.email || ''); const [estudante, setEstudante] = useState('João da Silva'); const chave = (aba: string) => `${usuarioId}::${estudante}::${aba}`; const nivelAtual = (aba: string) => permissoes[chave(aba)] || (usuarioId.includes('ana@') ? 'Editar' : 'Visualizar'); const atualizarNivel = (aba: string, nivel: string) => setPermissoes({ ...permissoes, [chave(aba)]: nivel }); const selecionado = usuarios.find((usuario: any) => usuario.email === usuarioId); return <section><HeaderAdmin titulo="Permissões de acesso" descricao="Defina o acesso de cada pessoa em cada PDI, sem aplicar a regra para todos os usuários." /><div className="permission-context"><strong>Permissão individual</strong><span>{selecionado?.nome || 'Selecione uma pessoa'} → {estudante}</span></div><div className="permission-toolbar"><label>Usuário<select aria-label="Selecionar usuário" value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>{professores.map((usuario: any) => <option key={usuario.email} value={usuario.email}>{usuario.nome} — {usuario.perfil}</option>)}</select></label><label>Estudante<select aria-label="Selecionar estudante" value={estudante} onChange={e => setEstudante(e.target.value)}><option>João da Silva</option></select></label></div><div className="permission-table">{abasPermissao.map(aba => <fieldset className="permission-row" key={aba}><legend>{aba}</legend><label>Nível de acesso<select value={nivelAtual(aba)} onChange={e => atualizarNivel(aba, e.target.value)}>{perfisPermitidos.map(nivel => <option key={nivel}>{nivel}</option>)}</select></label><span className="permission-help">Somente para {selecionado?.nome || 'usuário selecionado'} neste PDI</span></fieldset>)}</div><button className="primary-btn" onClick={() => avisar(`Permissões de ${selecionado?.nome} para o PDI de ${estudante} salvas.`)}><Check /> Salvar permissões</button></section> }
function FieldsPanel({ avisar }: any) { const [campos, setCampos] = useState(['Necessidades educacionais observadas', 'Recursos de acessibilidade', 'Estratégias de AEE', 'Evolução do estudante']); return <section><HeaderAdmin titulo="Campos e formulários" descricao="Configure os campos das áreas colaborativas sem alterar os seis tópicos fixos do estudante." acao="Adicionar campo" onAction={() => setCampos([...campos, 'Novo campo personalizado'])} /><div className="field-config-list">{campos.map((campo, index) => <div className="field-config" key={`${campo}-${index}`}><LayoutGrid /><div><strong>{campo}</strong><small>Texto longo · Ativo · Opcional</small></div><button className="icon-btn" aria-label={`Excluir ${campo}`} onClick={() => { setCampos(campos.filter((_, i) => i !== index)); avisar('Campo removido.') }}><X /></button></div>)}</div><p className="muted">Os tópicos do estudante — Meu perfil, Meus interesses, Como aprendo melhor, Facilidades e dificuldades, Meus objetivos e Meu desenvolvimento — permanecem fixos.</p></section> }
function ParticipantContent({ perfil, avisar }: { perfil: Perfil, avisar: (texto: string) => void }) { return <section><HeaderAdmin titulo={`Área do ${perfil}`} descricao="Contribua para o desenvolvimento individual com segurança e clareza." /><article className="editor-card"><h2>Contribuição do participante</h2><p className="muted">Selecione uma área para registrar informações do PDI.</p><button className="primary-btn" onClick={() => avisar('Área de contribuição aberta.')}>Abrir contribuição <ChevronRight /></button></article></section> }
