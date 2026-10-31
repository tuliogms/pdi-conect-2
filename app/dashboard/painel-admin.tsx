'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Download,
  FileText,
  History,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { carregarEntradas, esquecerEntradasLocais, formatarData } from '@/lib/dados'
import {
  AREAS_COLABORATIVAS,
  camposPadraoDaArea,
  chavePermissao,
  configuracaoLimpa,
  NIVEIS_ACESSO,
  novoId,
  perguntasDoTema,
  progressoGeral,
  SECOES_ADMIN,
  secoesDaArea,
  TEMAS_ESTUDANTE,
  tituloDaArea,
  AREA_ESTUDANTE,
  type CampoConfig,
  type Configuracao,
  type Estudante,
  type ModoPersistencia,
  type NivelAcesso,
  type SecaoAdmin,
  type StatusUsuario,
  type Usuario,
} from '@/lib/pdi-tipos'
import { PERFIL_ADMIN, PERFIS, type Perfil } from '@/lib/perfis'
import type { Avisar, AtualizarConfig } from './dashboard-app'
import type { ControleAcessibilidade } from './acessibilidade'
import type { ContextoUsuario } from './area-participante'
import { Cabecalho } from './cabecalho'

export type PropsPainel = {
  secao: SecaoAdmin
  config: Configuracao
  atualizar: AtualizarConfig
  avisar: Avisar
  onNavegar: (secao: SecaoAdmin) => void
  /** Abre a área do educando na navegação principal. */
  onAbrirPdi?: (estudanteId: string) => void
  modo: ModoPersistencia
  contexto: ContextoUsuario
  acessibilidade: ControleAcessibilidade
  definirModo: (estudanteId: string, topico: string, modo: 'descritivo' | 'perguntas') => void
}

const STATUS: StatusUsuario[] = ['Ativo', 'Aguardando', 'Inativo']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Área do Usuário Mestre. As abas internas são as tarefas administrativas
 * (spec do PDI, área 8); as áreas de contribuição ficam na navegação principal.
 */
export default function PainelAdmin(props: PropsPainel) {
  const { secao, onNavegar } = props

  function conteudo() {
    if (secao === 'Usuários') return <PainelUsuarios {...props} />
    if (secao === 'Educandos') return <PainelEstudantes {...props} />
    if (secao === 'Permissões de acesso') return <PainelPermissoes {...props} />
    if (secao === 'Campos e formulários') return <PainelCampos {...props} />
    if (secao === 'Pranchas de comunicação') return <PainelPranchas {...props} />
    if (secao === 'Versões do PDI') return <PainelVersoes {...props} />
    if (secao === 'Histórico administrativo') return <PainelHistorico {...props} />
    if (secao === 'Configurações') return <PainelConfiguracoes {...props} />
    return <VisaoGeral {...props} />
  }

  return (
    <div className="area-admin">
      <div className="area-tabs admin-subabas" role="tablist" aria-label="Áreas do Usuário Mestre">
        {SECOES_ADMIN.map(item => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={secao === item}
            className={`area-tab ${secao === item ? 'active' : ''}`}
            onClick={() => onNavegar(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {conteudo()}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visão geral                                                         */
/* ------------------------------------------------------------------ */

function VisaoGeral({ config, onNavegar }: PropsPainel) {
  const aguardando = config.usuarios.filter(usuario => usuario.status === 'Aguardando').length

  const cartoes: Array<[string, string]> = [
    ['Educandos', plural(config.estudantes.length, 'cadastrado', 'cadastrados')],
    ['Usuários', plural(config.usuarios.length, 'cadastrado', 'cadastrados')],
    ['Aguardando acesso', plural(aguardando, 'usuário', 'usuários')],
    ['Permissões definidas', plural(Object.keys(config.permissoes).length, 'área', 'áreas')],
    [
      'Campos configurados',
      plural(
        AREAS_COLABORATIVAS.reduce((total, area) => total + (config.campos[area.chave]?.length ?? 0), 0),
        'campo',
        'campos',
      ),
    ],
    ['Alterações registradas', plural(config.historico.length, 'registro', 'registros')],
  ]

  const atalhos: SecaoAdmin[] = [
    'Usuários',
    'Educandos',
    'Permissões de acesso',
    'Campos e formulários',
    'Pranchas de comunicação',
    'Versões do PDI',
    'Histórico administrativo',
  ]

  return (
    <section>
      <Cabecalho
        titulo="Visão geral"
        descricao="Situação atual do sistema, calculada a partir dos dados cadastrados."
      />

      <div className="summary-grid">
        {cartoes.map(([titulo, valor]) => (
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
          {atalhos.map(item => (
            <button className="shortcut-card" key={item} onClick={() => onNavegar(item)}>
              <strong>{item}</strong>
              <ChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="audit-card">
        <h2>Histórico de alterações</h2>
        {config.historico.length === 0 ? (
          <p className="muted">
            Nenhuma alteração registrada ainda. O histórico começa a ser preenchido a partir das
            ações feitas aqui.
          </p>
        ) : (
          config.historico.map(registro => (
            <p key={registro.id}>
              {registro.texto} · {formatarData(registro.quando)}
            </p>
          ))
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

type FormularioUsuario = {
  nome: string
  email: string
  perfil: Perfil
  estudanteId: string
  status: StatusUsuario
}

const formularioVazio: FormularioUsuario = {
  nome: '',
  email: '',
  perfil: 'Professor',
  estudanteId: '',
  status: 'Aguardando',
}

function PainelUsuarios({ config, atualizar, avisar }: PropsPainel) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Perfil | 'Todos'>('Todos')
  const [formulario, setFormulario] = useState<FormularioUsuario | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const estudantesPorId = useMemo(
    () => new Map(config.estudantes.map(estudante => [estudante.id, estudante.nome])),
    [config.estudantes],
  )

  const filtrados = config.usuarios.filter(usuario => {
    const combina = `${usuario.nome} ${usuario.email}`
      .toLowerCase()
      .includes(busca.trim().toLowerCase())
    const perfilOk = filtro === 'Todos' || usuario.perfil === filtro
    return combina && perfilOk
  })

  function abrirCadastro() {
    setFormulario({ ...formularioVazio })
    setEditandoId(null)
    setErro('')
  }

  function abrirEdicao(usuario: Usuario) {
    setFormulario({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      estudanteId: usuario.estudanteId ?? '',
      status: usuario.status,
    })
    setEditandoId(usuario.id)
    setErro('')
  }

  function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formulario) return

    const nome = formulario.nome.trim()
    const email = formulario.email.trim().toLowerCase()

    if (nome.length < 3) {
      setErro('Informe o nome completo (pelo menos 3 caracteres).')
      return
    }
    if (!EMAIL.test(email)) {
      setErro('Informe um e-mail válido.')
      return
    }
    const duplicado = config.usuarios.some(
      usuario => usuario.email.toLowerCase() === email && usuario.id !== editandoId,
    )
    if (duplicado) {
      setErro('Já existe um usuário cadastrado com este e-mail.')
      return
    }

    const dados = {
      nome,
      email,
      perfil: formulario.perfil,
      estudanteId: formulario.estudanteId || null,
      status: formulario.status,
    }

    if (editandoId) {
      atualizar(
        atual => ({
          ...atual,
          usuarios: atual.usuarios.map(usuario =>
            usuario.id === editandoId ? { ...usuario, ...dados } : usuario,
          ),
        }),
        `Cadastro de ${nome} atualizado`,
      )
      avisar('Usuário atualizado.')
    } else {
      atualizar(
        atual => ({ ...atual, usuarios: [...atual.usuarios, { id: novoId(), ...dados }] }),
        `${nome} cadastrado como ${formulario.perfil}`,
      )
      avisar('Usuário cadastrado.')
    }

    setFormulario(null)
    setEditandoId(null)
    setErro('')
  }

  function remover(usuario: Usuario) {
    atualizar(
      atual => ({
        ...atual,
        usuarios: atual.usuarios.filter(item => item.id !== usuario.id),
        permissoes: Object.fromEntries(
          Object.entries(atual.permissoes).filter(([chave]) => !chave.startsWith(`${usuario.id}::`)),
        ),
      }),
      `Cadastro de ${usuario.nome} removido`,
    )
    setConfirmando(null)
    avisar('Usuário removido.')
  }

  function alternarStatus(usuario: Usuario) {
    const proximo: StatusUsuario = usuario.status === 'Ativo' ? 'Inativo' : 'Ativo'
    atualizar(
      atual => ({
        ...atual,
        usuarios: atual.usuarios.map(item =>
          item.id === usuario.id ? { ...item, status: proximo } : item,
        ),
      }),
      `Acesso de ${usuario.nome} definido como ${proximo.toLowerCase()}`,
    )
    avisar(`Acesso de ${usuario.nome}: ${proximo}.`)
  }

  return (
    <section>
      <Cabecalho
        titulo="Usuários"
        descricao="Cadastre quem participa do PDI, o perfil de cada pessoa e o educando vinculado."
        acao={formulario ? undefined : 'Cadastrar usuário'}
        onAction={abrirCadastro}
      />

      {formulario && (
        <form className="convite-form" onSubmit={salvar}>
          <div className="form-grid">
            <label>
              Nome completo
              <input
                value={formulario.nome}
                onChange={evento => setFormulario({ ...formulario, nome: evento.target.value })}
                placeholder="Nome da pessoa"
                required
                autoFocus
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={formulario.email}
                onChange={evento => setFormulario({ ...formulario, email: evento.target.value })}
                placeholder="pessoa@escola.edu.br"
                required
              />
            </label>
            <label>
              Perfil
              <select
                value={formulario.perfil}
                onChange={evento =>
                  setFormulario({ ...formulario, perfil: evento.target.value as Perfil })
                }
              >
                {PERFIS.map(perfil => (
                  <option key={perfil} value={perfil}>
                    {perfil}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Educando vinculado
              <select
                value={formulario.estudanteId}
                onChange={evento =>
                  setFormulario({ ...formulario, estudanteId: evento.target.value })
                }
              >
                <option value="">Sem vínculo</option>
                {config.estudantes.map(estudante => (
                  <option key={estudante.id} value={estudante.id}>
                    {estudante.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={formulario.status}
                onChange={evento =>
                  setFormulario({ ...formulario, status: evento.target.value as StatusUsuario })
                }
              >
                {STATUS.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {erro && (
            <p className="form-error" role="alert">
              {erro}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => {
                setFormulario(null)
                setEditandoId(null)
                setErro('')
              }}
            >
              Cancelar
            </button>
            <button className="primary-btn" type="submit">
              <Check aria-hidden="true" /> {editandoId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <label className="search-field" htmlFor="busca-usuarios">
          <Search aria-hidden="true" />
          <span className="sr-only">Pesquisar usuários</span>
          <input
            id="busca-usuarios"
            value={busca}
            onChange={evento => setBusca(evento.target.value)}
            placeholder="Pesquisar por nome ou e-mail"
          />
        </label>
        <label className="sr-only" htmlFor="filtro-perfil">
          Filtrar por perfil
        </label>
        <select
          id="filtro-perfil"
          className="select-control"
          value={filtro}
          onChange={evento => setFiltro(evento.target.value as Perfil | 'Todos')}
        >
          <option value="Todos">Todos os perfis</option>
          {PERFIS.map(perfil => (
            <option key={perfil} value={perfil}>
              {perfil}
            </option>
          ))}
        </select>
      </div>

      {config.usuarios.length === 0 ? (
        <div className="empty-state">
          <UserPlus aria-hidden="true" />
          <strong>Nenhum usuário cadastrado ainda</strong>
          <p>Use “Cadastrar usuário” para registrar a primeira pessoa com acesso ao PDI.</p>
        </div>
      ) : (
        <div className="admin-table" aria-label="Lista de usuários">
          <div className="table-head">
            <span>Usuário</span>
            <span>Perfil</span>
            <span>Educando vinculado</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {filtrados.map(usuario => (
            <div className="table-row" key={usuario.id}>
              <div>
                <strong>{usuario.nome}</strong>
                <small>{usuario.email}</small>
              </div>
              <span>{usuario.perfil}</span>
              <span>
                {usuario.estudanteId
                  ? estudantesPorId.get(usuario.estudanteId) ?? 'Educando removido'
                  : 'Sem vínculo'}
              </span>
              <span className={`status-pill ${usuario.status === 'Ativo' ? 'success' : ''}`}>
                {usuario.status}
              </span>
              <div className="row-actions">
                <button className="soft-btn" onClick={() => abrirEdicao(usuario)}>
                  <Pencil aria-hidden="true" /> Editar
                </button>
                <button className="soft-btn" onClick={() => alternarStatus(usuario)}>
                  {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                </button>
                {confirmando === usuario.id ? (
                  <>
                    <button className="soft-btn danger" onClick={() => remover(usuario)}>
                      Confirmar
                    </button>
                    <button className="soft-btn" onClick={() => setConfirmando(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    className="soft-btn danger"
                    onClick={() => setConfirmando(usuario.id)}
                    aria-label={`Remover ${usuario.nome}`}
                  >
                    <Trash2 aria-hidden="true" /> Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="muted table-empty">Nenhum usuário encontrado para esta busca.</p>
          )}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Educandos                                                           */
/* ------------------------------------------------------------------ */

type FormularioEstudante = { nome: string; serie: string; escola: string }

function PainelEstudantes({ config, atualizar, avisar, onAbrirPdi }: PropsPainel) {
  const [formulario, setFormulario] = useState<FormularioEstudante | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const vinculos = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const usuario of config.usuarios) {
      if (!usuario.estudanteId) continue
      mapa.set(usuario.estudanteId, (mapa.get(usuario.estudanteId) ?? 0) + 1)
    }
    return mapa
  }, [config.usuarios])

  function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formulario) return

    const nome = formulario.nome.trim()
    if (nome.length < 3) {
      setErro('Informe o nome do educando (pelo menos 3 caracteres).')
      return
    }

    const dados = { nome, serie: formulario.serie.trim(), escola: formulario.escola.trim() }

    if (editandoId) {
      atualizar(
        atual => ({
          ...atual,
          estudantes: atual.estudantes.map(estudante =>
            estudante.id === editandoId ? { ...estudante, ...dados } : estudante,
          ),
        }),
        `Cadastro de ${nome} atualizado`,
      )
      avisar('Educando atualizado.')
    } else {
      atualizar(
        atual => ({ ...atual, estudantes: [...atual.estudantes, { id: novoId(), ...dados }] }),
        `${nome} cadastrado como educando`,
      )
      avisar('Educando cadastrado. O PDI já pode ser preenchido.')
    }

    setFormulario(null)
    setEditandoId(null)
    setErro('')
  }

  function remover(estudante: Estudante) {
    esquecerEntradasLocais(estudante.id)
    atualizar(
      atual => ({
        ...atual,
        estudantes: atual.estudantes.filter(item => item.id !== estudante.id),
        usuarios: atual.usuarios.map(usuario =>
          usuario.estudanteId === estudante.id ? { ...usuario, estudanteId: null } : usuario,
        ),
        permissoes: Object.fromEntries(
          Object.entries(atual.permissoes).filter(
            ([chave]) => !chave.includes(`::${estudante.id}::`),
          ),
        ),
      }),
      `Cadastro de ${estudante.nome} removido`,
    )
    setConfirmando(null)
    avisar('Educando removido. Os usuários ficaram sem vínculo.')
  }

  return (
    <section>
      <Cabecalho
        titulo="Educandos"
        descricao="Cadastre os educandos cujos PDIs serão preenchidos pela equipe."
        acao={formulario ? undefined : 'Cadastrar educando'}
        onAction={() => {
          setFormulario({ nome: '', serie: '', escola: '' })
          setEditandoId(null)
          setErro('')
        }}
      />

      {formulario && (
        <form className="convite-form" onSubmit={salvar}>
          <div className="form-grid">
            <label>
              Nome do educando
              <input
                value={formulario.nome}
                onChange={evento => setFormulario({ ...formulario, nome: evento.target.value })}
                placeholder="Nome completo"
                required
                autoFocus
              />
            </label>
            <label>
              Turma / ano
              <input
                value={formulario.serie}
                onChange={evento => setFormulario({ ...formulario, serie: evento.target.value })}
                placeholder="Ex.: 5º ano A"
              />
            </label>
            <label>
              Escola
              <input
                value={formulario.escola}
                onChange={evento => setFormulario({ ...formulario, escola: evento.target.value })}
                placeholder="Nome da escola"
              />
            </label>
          </div>

          {erro && (
            <p className="form-error" role="alert">
              {erro}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => {
                setFormulario(null)
                setEditandoId(null)
                setErro('')
              }}
            >
              Cancelar
            </button>
            <button className="primary-btn" type="submit">
              <Check aria-hidden="true" /> {editandoId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      {config.estudantes.length === 0 ? (
        <div className="empty-state">
          <Users aria-hidden="true" />
          <strong>Nenhum educando cadastrado ainda</strong>
          <p>Cadastre o primeiro educando para liberar o preenchimento do PDI.</p>
        </div>
      ) : (
        <div className="admin-table" aria-label="Lista de educandos">
          <div className="table-head estudantes">
            <span>Educando</span>
            <span>Turma</span>
            <span>Escola</span>
            <span>Vínculos</span>
            <span>Ações</span>
          </div>
          {config.estudantes.map(estudante => (
            <div className="table-row estudantes" key={estudante.id}>
              <strong>{estudante.nome}</strong>
              <span>{estudante.serie || '—'}</span>
              <span>{estudante.escola || '—'}</span>
              <span>{plural(vinculos.get(estudante.id) ?? 0, 'pessoa', 'pessoas')}</span>
              <div className="row-actions">
                <button
                  className="soft-btn"
                  onClick={() => {
                    setFormulario({
                      nome: estudante.nome,
                      serie: estudante.serie,
                      escola: estudante.escola,
                    })
                    setEditandoId(estudante.id)
                    setErro('')
                  }}
                >
                  <Pencil aria-hidden="true" /> Editar
                </button>
                <button className="soft-btn" onClick={() => onAbrirPdi?.(estudante.id)}>
                  <FileText aria-hidden="true" /> Abrir PDI
                </button>
                {confirmando === estudante.id ? (
                  <>
                    <button className="soft-btn danger" onClick={() => remover(estudante)}>
                      Confirmar
                    </button>
                    <button className="soft-btn" onClick={() => setConfirmando(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    className="soft-btn danger"
                    onClick={() => setConfirmando(estudante.id)}
                    aria-label={`Remover ${estudante.nome}`}
                  >
                    <Trash2 aria-hidden="true" /> Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Planos de PDI                                                       */
/* ------------------------------------------------------------------ */

function PainelPermissoes({ config, atualizar, avisar }: PropsPainel) {
  const pessoas = config.usuarios.filter(usuario => usuario.perfil !== PERFIL_ADMIN)
  const [usuarioId, setUsuarioId] = useState(pessoas[0]?.id ?? '')
  const [estudanteId, setEstudanteId] = useState(config.estudantes[0]?.id ?? '')
  const [alteracoes, setAlteracoes] = useState<Record<string, NivelAcesso>>({})

  const usuario = pessoas.find(item => item.id === usuarioId) ?? pessoas[0]
  const estudante = config.estudantes.find(item => item.id === estudanteId) ?? config.estudantes[0]

  if (pessoas.length === 0 || !usuario) {
    return (
      <section>
        <Cabecalho
          titulo="Permissões de acesso"
          descricao="Defina o que cada pessoa pode fazer no PDI de cada educando."
        />
        <div className="empty-state">
          <Users aria-hidden="true" />
          <strong>Ninguém para configurar ainda</strong>
          <p>
            Cadastre usuários (com perfil diferente de {PERFIL_ADMIN}) para definir permissões
            individuais.
          </p>
        </div>
      </section>
    )
  }

  if (!estudante) {
    return (
      <section>
        <Cabecalho
          titulo="Permissões de acesso"
          descricao="Defina o que cada pessoa pode fazer no PDI de cada educando."
        />
        <div className="empty-state">
          <FileText aria-hidden="true" />
          <strong>Nenhum educando cadastrado</strong>
          <p>As permissões são sempre ligadas a um educando. Cadastre um educando primeiro.</p>
        </div>
      </section>
    )
  }

  const padrao = (areaChave: string): NivelAcesso => {
    const area = AREAS_COLABORATIVAS.find(item => item.chave === areaChave)
    if (area && usuario.perfil === area.perfil) return 'Editar'
    if (areaChave === AREA_ESTUDANTE.chave && usuario.perfil === 'Educando') return 'Editar'
    return 'Visualizar'
  }

  const chave = (areaChave: string) => chavePermissao(usuario.id, estudante.id, areaChave)
  const nivelAtual = (areaChave: string): NivelAcesso =>
    alteracoes[chave(areaChave)] ?? config.permissoes[chave(areaChave)] ?? padrao(areaChave)

  function salvar() {
    atualizar(
      atual => ({ ...atual, permissoes: { ...atual.permissoes, ...alteracoes } }),
      `Permissões de ${usuario.nome} no PDI de ${estudante.nome} atualizadas`,
    )
    setAlteracoes({})
    avisar(`Permissões de ${usuario.nome} salvas para o PDI de ${estudante.nome}.`)
  }

  const areasPermissao = [AREA_ESTUDANTE.chave, ...AREAS_COLABORATIVAS.map(area => area.chave)]

  return (
    <section>
      <Cabecalho
        titulo="Permissões de acesso"
        descricao="Defina o acesso de cada pessoa em cada PDI, sem aplicar a regra para todos."
      />

      <div className="permission-context">
        <strong>Permissão individual</strong>
        <span>
          {usuario.nome} → {estudante.nome}
        </span>
      </div>

      <div className="permission-toolbar">
        <label>
          Usuário
          <select
            aria-label="Selecionar usuário"
            value={usuario.id}
            onChange={evento => {
              setUsuarioId(evento.target.value)
              setAlteracoes({})
            }}
          >
            {pessoas.map(item => (
              <option key={item.id} value={item.id}>
                {item.nome} — {item.perfil}
              </option>
            ))}
          </select>
        </label>
        <label>
          Educando
          <select
            aria-label="Selecionar educando"
            value={estudante.id}
            onChange={evento => {
              setEstudanteId(evento.target.value)
              setAlteracoes({})
            }}
          >
            {config.estudantes.map(item => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="permission-table">
        {areasPermissao.map(area => (
          <fieldset className="permission-row" key={area}>
            <legend>{tituloDaArea(area)}</legend>
            <label>
              Nível de acesso
              <select
                value={nivelAtual(area)}
                onChange={evento =>
                  setAlteracoes(atual => ({
                    ...atual,
                    [chave(area)]: evento.target.value as NivelAcesso,
                  }))
                }
              >
                {NIVEIS_ACESSO.map(nivel => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </label>
            <span className="permission-help">Vale somente para esta pessoa neste PDI</span>
          </fieldset>
        ))}
      </div>

      <button className="primary-btn" onClick={salvar}>
        <Check aria-hidden="true" /> Salvar permissões
      </button>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Campos e formulários                                                */
/* ------------------------------------------------------------------ */

function PainelCampos({ config, atualizar, avisar }: PropsPainel) {
  const [areaChave, setAreaChave] = useState(AREAS_COLABORATIVAS[0].chave)
  const [editando, setEditando] = useState<CampoConfig | null>(null)
  const [erro, setErro] = useState('')

  const area = AREAS_COLABORATIVAS.find(item => item.chave === areaChave) ?? AREAS_COLABORATIVAS[0]
  const campos = config.campos[areaChave] ?? camposPadraoDaArea(areaChave)

  function gravarCampos(novos: CampoConfig[], historico: string) {
    atualizar(
      atual => ({ ...atual, campos: { ...atual.campos, [areaChave]: novos } }),
      `${historico} (${area.titulo})`,
    )
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao
    if (destino < 0 || destino >= campos.length) return
    const novos = [...campos]
    const [item] = novos.splice(indice, 1)
    novos.splice(destino, 0, item)
    gravarCampos(novos, `Campo “${item.titulo}” reordenado`)
  }

  function remover(indice: number) {
    const campo = campos[indice]
    gravarCampos(
      campos.filter((_, posicao) => posicao !== indice),
      `Campo “${campo.titulo}” removido`,
    )
    avisar('Campo removido.')
  }

  function salvarCampo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!editando) return
    const titulo = editando.titulo.trim()
    if (titulo.length < 3) {
      setErro('Dê um nome ao campo (pelo menos 3 caracteres).')
      return
    }
    const duplicado = campos.some(
      campo => campo.id !== editando.id && campo.titulo.toLowerCase() === titulo.toLowerCase(),
    )
    if (duplicado) {
      setErro('Já existe um campo com esse nome nesta área.')
      return
    }

    const existente = campos.some(campo => campo.id === editando.id)
    const novo = { ...editando, titulo }
    gravarCampos(
      existente
        ? campos.map(campo => (campo.id === editando.id ? novo : campo))
        : [...campos, novo],
      existente ? `Campo “${titulo}” atualizado` : `Campo “${titulo}” criado`,
    )
    setEditando(null)
    setErro('')
    avisar(existente ? 'Campo atualizado.' : 'Campo criado.')
  }

  function novoCampo() {
    setEditando({
      id: novoId(),
      titulo: '',
      instrucao: '',
      tipo: 'texto',
      acessoOutros: 'Visualizar',
    })
    setErro('')
  }

  return (
    <section>
      <Cabecalho
        titulo="Campos e formulários"
        descricao="Adapte as áreas ao modelo de PDI da sua rede. As seis seções do educando são fixas; as perguntas são configuráveis."
        acao={editando ? undefined : 'Adicionar campo'}
        onAction={novoCampo}
      />

      <label className="student-picker">
        Área
        <select
          value={areaChave}
          onChange={evento => {
            setAreaChave(evento.target.value)
            setEditando(null)
            setErro('')
          }}
        >
          {AREAS_COLABORATIVAS.map(item => (
            <option key={item.chave} value={item.chave}>
              {item.titulo}
            </option>
          ))}
        </select>
      </label>

      {editando && (
        <form className="convite-form" onSubmit={salvarCampo}>
          <div className="form-grid">
            <label>
              Título do campo
              <input
                value={editando.titulo}
                onChange={evento => setEditando({ ...editando, titulo: evento.target.value })}
                placeholder="Ex.: Recursos de acessibilidade em uso"
                autoFocus
                required
              />
            </label>
            <label>
              Instrução para quem responde
              <input
                value={editando.instrucao}
                onChange={evento => setEditando({ ...editando, instrucao: evento.target.value })}
                placeholder="Ex.: Um item por vez"
              />
            </label>
            <label>
              Tipo de resposta
              <select
                value={editando.tipo}
                onChange={evento =>
                  setEditando({ ...editando, tipo: evento.target.value as CampoConfig['tipo'] })
                }
              >
                <option value="texto">Texto livre (com áudio e prancha)</option>
                <option value="lista">Lista de itens</option>
                <option value="prancha">Prancha de comunicação</option>
              </select>
            </label>
            <label>
              Seção da área
              <select
                value={editando.secao ?? ''}
                onChange={evento =>
                  setEditando({ ...editando, secao: evento.target.value || undefined })
                }
              >
                <option value="">Primeira seção</option>
                {secoesDaArea(areaChave).map(secao => (
                  <option key={secao.chave} value={secao.chave}>
                    {secao.titulo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quem não é dono da área pode
              <select
                value={editando.acessoOutros}
                onChange={evento =>
                  setEditando({
                    ...editando,
                    acessoOutros: evento.target.value as CampoConfig['acessoOutros'],
                  })
                }
              >
                <option value="Visualizar">Visualizar</option>
                <option value="Comentar">Comentar</option>
                <option value="Sem acesso">Sem acesso</option>
              </select>
            </label>
          </div>

          {erro && (
            <p className="form-error" role="alert">
              {erro}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => {
                setEditando(null)
                setErro('')
              }}
            >
              Cancelar
            </button>
            <button className="primary-btn" type="submit">
              <Check aria-hidden="true" /> Salvar campo
            </button>
          </div>
        </form>
      )}

      <div className="field-config-list">
        {campos.map((campo, indice) => (
          <div className="field-config" key={campo.id}>
            <LayoutGrid aria-hidden="true" />
            <div>
              <strong>
                {campo.titulo} {campo.fixo && <span className="tag">padrão</span>}
              </strong>
              <small>
                {campo.tipo === 'lista' ? 'Lista de itens' : 'Texto longo'} ·{' '}
                {campo.instrucao || 'sem instrução'} · outros perfis: {campo.acessoOutros.toLowerCase()}
              </small>
            </div>
            <div className="row-actions">
              <button
                className="icon-btn"
                aria-label={`Mover ${campo.titulo} para cima`}
                onClick={() => mover(indice, -1)}
                disabled={indice === 0}
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                className="icon-btn"
                aria-label={`Mover ${campo.titulo} para baixo`}
                onClick={() => mover(indice, 1)}
                disabled={indice === campos.length - 1}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <button
                className="icon-btn"
                aria-label={`Editar ${campo.titulo}`}
                onClick={() => {
                  setEditando({ ...campo })
                  setErro('')
                }}
              >
                <Pencil aria-hidden="true" />
              </button>
              <button
                className="icon-btn"
                aria-label={`Excluir ${campo.titulo}`}
                onClick={() => remover(indice)}
                disabled={campo.fixo}
                title={campo.fixo ? 'Campo padrão: pode ser editado, mas não removido' : undefined}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="muted">
        Seções fixas do educando: {TEMAS_ESTUDANTE.map(tema => tema.titulo).join(' · ')}.
      </p>

      <PerguntasDoEducando config={config} atualizar={atualizar} avisar={avisar} />
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Perguntas norteadoras do educando                                   */
/* ------------------------------------------------------------------ */

function PerguntasDoEducando({
  config,
  atualizar,
  avisar,
}: {
  config: Configuracao
  atualizar: AtualizarConfig
  avisar: Avisar
}) {
  const [temaAberto, setTemaAberto] = useState(TEMAS_ESTUDANTE[0]?.chave ?? '')
  const [nova, setNova] = useState('')
  const perguntas = perguntasDoTema(config, temaAberto)

  function gravar(lista: string[], texto: string) {
    const limpas = lista.map(item => item.trim()).filter(Boolean)
    if (limpas.length === 0) {
      avisar('Cada seção precisa de pelo menos uma pergunta.')
      return
    }
    atualizar(
      atual => ({ ...atual, perguntas: { ...atual.perguntas, [temaAberto]: limpas } }),
      texto,
    )
  }

  return (
    <div className="perguntas-config">
      <h2 className="pdi-heading">Perguntas norteadoras do educando</h2>
      <p className="muted small-note">
        As seis seções são fixas. O que a escola pode ajustar são as perguntas que aparecem em
        “Perguntas” dentro de cada seção.
      </p>

      <label className="student-picker">
        Seção
        <select value={temaAberto} onChange={evento => setTemaAberto(evento.target.value)}>
          {TEMAS_ESTUDANTE.map(tema => (
            <option key={tema.chave} value={tema.chave}>
              {tema.titulo}
            </option>
          ))}
        </select>
      </label>

      <ul className="perguntas-lista-config">
        {perguntas.map((pergunta, indice) => (
          <li key={`${temaAberto}-${indice}`}>
            <input
              value={pergunta}
              aria-label={`Pergunta ${indice + 1} de ${temaAberto}`}
              onChange={evento => {
                const lista = [...perguntas]
                lista[indice] = evento.target.value
                gravar(lista, 'Pergunta norteadora atualizada')
              }}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remover a pergunta ${indice + 1}`}
              onClick={() =>
                gravar(
                  perguntas.filter((_, posicao) => posicao !== indice),
                  'Pergunta norteadora removida',
                )
              }
            >
              <X aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="chip-form">
        <label className="sr-only" htmlFor="nova-pergunta">
          Nova pergunta
        </label>
        <input
          id="nova-pergunta"
          value={nova}
          onChange={evento => setNova(evento.target.value)}
          placeholder="Escreva uma nova pergunta"
        />
        <button
          type="button"
          className="soft-btn"
          onClick={() => {
            if (!nova.trim()) return
            gravar([...perguntas, nova], 'Pergunta norteadora criada')
            setNova('')
          }}
        >
          <Plus aria-hidden="true" /> Adicionar pergunta
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pranchas de comunicação                                             */
/* ------------------------------------------------------------------ */

function PainelPranchas({ config, atualizar, avisar }: PropsPainel) {
  const [categoriaId, setCategoriaId] = useState(config.pranchas[0]?.id ?? '')
  const [novaCategoria, setNovaCategoria] = useState('')
  const [rotulo, setRotulo] = useState('')
  const [simbolo, setSimbolo] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const categoria = config.pranchas.find(item => item.id === categoriaId) ?? config.pranchas[0]

  function gravar(pranchas: Configuracao['pranchas'], texto: string) {
    atualizar(atual => ({ ...atual, pranchas }), texto)
  }

  function criarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome) return
    const nova = { id: novoId(), nome, simbolos: [] }
    gravar([...config.pranchas, nova], `Prancha “${nome}” criada`)
    setCategoriaId(nova.id)
    setNovaCategoria('')
    avisar('Prancha criada. Agora adicione os símbolos.')
  }

  function renomearCategoria(nome: string) {
    if (!categoria || !nome.trim()) return
    gravar(
      config.pranchas.map(item =>
        item.id === categoria.id ? { ...item, nome: nome.trim() } : item,
      ),
      `Prancha “${nome.trim()}” renomeada`,
    )
  }

  function removerCategoria(id: string) {
    gravar(
      config.pranchas.filter(item => item.id !== id),
      'Prancha removida',
    )
    setCategoriaId(config.pranchas.find(item => item.id !== id)?.id ?? '')
    setConfirmando(null)
    avisar('Prancha removida.')
  }

  function adicionarSimbolo() {
    if (!categoria) return
    const texto = rotulo.trim()
    if (!texto) return
    gravar(
      config.pranchas.map(item =>
        item.id === categoria.id
          ? {
              ...item,
              simbolos: [
                ...item.simbolos,
                { id: novoId(), rotulo: texto, simbolo: simbolo.trim() || '🔹' },
              ],
            }
          : item,
      ),
      `Símbolo “${texto}” adicionado à prancha ${categoria.nome}`,
    )
    setRotulo('')
    setSimbolo('')
    avisar('Símbolo adicionado.')
  }

  return (
    <section>
      <Cabecalho
        titulo="Pranchas de comunicação"
        descricao="As pranchas usadas nas respostas do educando. Cada símbolo tem imagem e nome escrito, para funcionar também com leitor de tela."
      />

      <div className="form-grid">
        <label>
          Nova prancha (categoria)
          <input
            value={novaCategoria}
            onChange={evento => setNovaCategoria(evento.target.value)}
            placeholder="Ex.: Alimentos"
          />
        </label>
        <div className="form-actions inicio">
          <button type="button" className="primary-btn" onClick={criarCategoria}>
            <Plus aria-hidden="true" /> Criar prancha
          </button>
        </div>
      </div>

      {config.pranchas.length === 0 ? (
        <div className="empty-state">
          <LayoutGrid aria-hidden="true" />
          <strong>Nenhuma prancha configurada</strong>
          <p>Crie a primeira prancha para que os símbolos apareçam nas respostas.</p>
        </div>
      ) : (
        <>
          <div className="area-tabs" role="tablist" aria-label="Pranchas cadastradas">
            {config.pranchas.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={categoria?.id === item.id}
                className={`area-tab ${categoria?.id === item.id ? 'active' : ''}`}
                onClick={() => {
                  setCategoriaId(item.id)
                  setConfirmando(null)
                }}
              >
                {item.nome} · {item.simbolos.length}
              </button>
            ))}
          </div>

          {categoria && (
            <div className="area-group">
              <div className="area-group-topo">
                <label className="campo-simples">
                  Nome da prancha
                  <input
                    value={categoria.nome}
                    onChange={evento => renomearCategoria(evento.target.value)}
                    aria-label="Nome da prancha"
                  />
                </label>
                {confirmando === categoria.id ? (
                  <div className="row-actions">
                    <button
                      type="button"
                      className="soft-btn danger"
                      onClick={() => removerCategoria(categoria.id)}
                    >
                      <Trash2 aria-hidden="true" /> Confirmar
                    </button>
                    <button
                      type="button"
                      className="soft-btn"
                      onClick={() => setConfirmando(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() => setConfirmando(categoria.id)}
                  >
                    <Trash2 aria-hidden="true" /> Remover prancha
                  </button>
                )}
              </div>

              <div className="prancha-simbolos">
                {categoria.simbolos.map(item => (
                  <div className="prancha-simbolo" key={item.id}>
                    <span aria-hidden="true">{item.simbolo}</span>
                    <small>{item.rotulo}</small>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remover o símbolo ${item.rotulo}`}
                      onClick={() =>
                        gravar(
                          config.pranchas.map(prancha =>
                            prancha.id === categoria.id
                              ? {
                                  ...prancha,
                                  simbolos: prancha.simbolos.filter(s => s.id !== item.id),
                                }
                              : prancha,
                          ),
                          `Símbolo “${item.rotulo}” removido`,
                        )
                      }
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-grid">
                <label>
                  Nome do símbolo
                  <input
                    value={rotulo}
                    onChange={evento => setRotulo(evento.target.value)}
                    placeholder="Ex.: Água"
                  />
                </label>
                <label>
                  Símbolo (imagem ou emoji)
                  <input
                    value={simbolo}
                    onChange={evento => setSimbolo(evento.target.value)}
                    placeholder="Ex.: 💧"
                    maxLength={24}
                  />
                </label>
              </div>
              <div className="form-actions inicio">
                <button type="button" className="soft-btn" onClick={adicionarSimbolo}>
                  <Plus aria-hidden="true" /> Adicionar símbolo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Versões do PDI                                                      */
/* ------------------------------------------------------------------ */

function PainelVersoes({ config, avisar }: PropsPainel) {
  const [estudanteId, setEstudanteId] = useState('')
  const versoes = [...config.versoes]
    .filter(versao => !estudanteId || versao.estudanteId === estudanteId)
    .sort((a, b) => b.quando.localeCompare(a.quando))

  const nomeDe = (id: string) =>
    config.estudantes.find(estudante => estudante.id === id)?.nome ?? 'Educando removido'

  function baixarRelatorio() {
    const cabecalho = ['Educando', 'Quando', 'Autor', 'Áreas', 'O que mudou']
    const linhas = versoes.map(versao =>
      [
        nomeDe(versao.estudanteId),
        new Date(versao.quando).toLocaleString('pt-BR'),
        versao.autor,
        versao.areas.map(tituloDaArea).join(' + '),
        versao.resumo,
      ]
        .map(campo => `"${String(campo).split(String.fromCharCode(34)).join(String.fromCharCode(34, 34))}"`)
        .join(';'),
    )
    const conteudo = [cabecalho.join(';'), ...linhas].join(String.fromCharCode(10))
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `pdi-versoes-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    avisar('Histórico de versões exportado em CSV.')
  }

  return (
    <section>
      <Cabecalho
        titulo="Versões do PDI"
        descricao="Cada contribuição salva entra no histórico com autor, data e área. Nada é sobrescrito sem registro."
        {...(versoes.length > 0 ? { acao: 'Baixar relatório', onAction: baixarRelatorio } : {})}
      />

      <label className="student-picker">
        Educando
        <select value={estudanteId} onChange={evento => setEstudanteId(evento.target.value)}>
          <option value="">Todos os educandos</option>
          {config.estudantes.map(estudante => (
            <option key={estudante.id} value={estudante.id}>
              {estudante.nome}
            </option>
          ))}
        </select>
      </label>

      {versoes.length === 0 ? (
        <div className="empty-state">
          <History aria-hidden="true" />
          <strong>Nenhuma versão registrada ainda</strong>
          <p>O histórico começa quando a primeira resposta do PDI for salva.</p>
        </div>
      ) : (
        <ol className="versao-lista">
          {versoes.map(versao => (
            <li key={versao.id} className="versao-item">
              <span className="versao-ponto" aria-hidden="true" />
              <div>
                <strong>{versao.resumo}</strong>
                <small>
                  {nomeDe(versao.estudanteId)} · {versao.autor} ·{' '}
                  {formatarData(versao.quando)}
                </small>
                <span className="tag">{versao.areas.map(tituloDaArea).join(' + ')}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

function PainelConfiguracoes({ config, atualizar, modo, avisar }: PropsPainel) {
  const [exportando, setExportando] = useState(false)
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)

  async function exportar() {
    setExportando(true)
    try {
      const estudantes = await Promise.all(
        config.estudantes.map(async estudante => ({
          estudante,
          entradas: (await carregarEntradas(estudante.id)).entradas,
        })),
      )
      const conteudo = JSON.stringify(
        { exportadoEm: new Date().toISOString(), config, estudantes },
        null,
        2,
      )
      const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `pdi-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      avisar('Relatório exportado em JSON.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <section>
      <Cabecalho
        titulo="Configurações"
        descricao="Identidade institucional, armazenamento e histórico administrativo."
      />

      <article className="editor-card">
        <h2>Identidade institucional</h2>
        <p className="muted">
          O nome e a logo aparecem no topo do sistema e no cabeçalho dos relatórios.
        </p>
        <div className="form-grid">
          <label>
            Nome do sistema
            <input
              value={config.institucional.nomeApp}
              onChange={evento =>
                atualizar(atual => ({
                  ...atual,
                  institucional: { ...atual.institucional, nomeApp: evento.target.value },
                }))
              }
              placeholder="PDI Interativo"
            />
          </label>
          <label>
            Escola ou instituição
            <input
              value={config.institucional.escola}
              onChange={evento =>
                atualizar(atual => ({
                  ...atual,
                  institucional: { ...atual.institucional, escola: evento.target.value },
                }))
              }
              placeholder="Nome da escola"
            />
          </label>
          <label>
            Logo (arquivo de imagem)
            <input
              type="file"
              accept="image/*"
              onChange={evento => {
                const arquivo = evento.target.files?.[0]
                if (!arquivo) return
                const leitor = new FileReader()
                leitor.onload = () => {
                  const dados = String(leitor.result ?? '')
                  atualizar(
                    atual => ({
                      ...atual,
                      institucional: { ...atual.institucional, logoUrl: dados },
                    }),
                    'Identidade visual atualizada',
                  )
                  avisar('Logo atualizada.')
                }
                leitor.readAsDataURL(arquivo)
              }}
            />
          </label>
        </div>
        {config.institucional.logoUrl && (
          <div className="logo-preview">
            <img src={config.institucional.logoUrl} alt="Logo configurada" />
            <button
              className="soft-btn"
              type="button"
              onClick={() =>
                atualizar(
                  atual => ({
                    ...atual,
                    institucional: { ...atual.institucional, logoUrl: '' },
                  }),
                  'Logo removida',
                )
              }
            >
              <X aria-hidden="true" /> Remover logo
            </button>
          </div>
        )}
      </article>

      <article className="editor-card">
        <h2>Armazenamento</h2>
        <p className="muted">
          Modo atual:{' '}
          <strong>{modo === 'banco' ? 'banco de dados PostgreSQL' : 'este navegador'}</strong>.
        </p>
        <p className="muted">
          {modo === 'banco'
            ? 'As configurações e as respostas do PDI estão sendo gravadas no banco configurado em DATABASE_URL.'
            : 'Sem DATABASE_URL configurada, os dados ficam no armazenamento local deste navegador. Ao configurar o banco (e rodar db/init.sql), o sistema passa a gravar tudo no PostgreSQL automaticamente.'}
        </p>
        <p className="muted">
          Educandos: {config.estudantes.length} · Usuários: {config.usuarios.length} · Permissões:{' '}
          {Object.keys(config.permissoes).length} · Indicadores:{' '}
          {config.indicadores.join(', ') || 'nenhum'}
        </p>
        <div className="form-actions">
          <button className="outline-btn" onClick={exportar} disabled={exportando}>
            <Download aria-hidden="true" /> {exportando ? 'Exportando…' : 'Exportar dados (JSON)'}
          </button>
        </div>
      </article>

      <article className="editor-card">
        <h2>Limpar dados</h2>
        <p className="muted">
          Apaga educandos, usuários, permissões e todas as respostas de PDI gravadas neste
          ambiente. A estrutura dos campos volta ao padrão. Use com cuidado: a ação não pode ser
          desfeita.
        </p>
        <div className="form-actions inicio">
          {confirmandoLimpeza ? (
            <>
              <button
                className="soft-btn danger"
                onClick={() => {
                  const estudantes = config.estudantes.map(estudante => estudante.id)
                  estudantes.forEach(esquecerEntradasLocais)
                  atualizar(() => configuracaoLimpa(), 'Todos os dados apagados')
                  setConfirmandoLimpeza(false)
                  avisar('Todos os dados foram apagados.')
                }}
              >
                Confirmar e apagar tudo
              </button>
              <button className="soft-btn" onClick={() => setConfirmandoLimpeza(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="soft-btn danger" onClick={() => setConfirmandoLimpeza(true)}>
              <Trash2 aria-hidden="true" /> Apagar todos os dados
            </button>
          )}
        </div>
      </article>

      <article className="editor-card">
        <h2>
          <History aria-hidden="true" /> Últimas alterações
        </h2>
        {config.historico.length === 0 ? (
          <p className="muted">Nenhuma alteração registrada.</p>
        ) : (
          <ul className="historico-lista">
            {config.historico.slice(0, 12).map(registro => (
              <li key={registro.id}>
                <span>{registro.texto}</span>
                <small>{formatarData(registro.quando)}</small>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Histórico administrativo                                            */
/* ------------------------------------------------------------------ */

function PainelHistorico({ config }: PropsPainel) {
  const registros = config.historico
  return (
    <section>
      <Cabecalho
        titulo="Histórico administrativo"
        descricao="Tudo o que a administração mudou no sistema, com data. É o registro de auditoria da escola."
      />
      {registros.length === 0 ? (
        <div className="empty-state">
          <History aria-hidden="true" />
          <strong>Nenhuma alteração registrada ainda</strong>
          <p>Cadastros, permissões, campos e configurações passam a aparecer aqui quando mudarem.</p>
        </div>
      ) : (
        <ol className="timeline">
          {registros.map(registro => (
            <li key={registro.id}>
              <span className="timeline-ponto" aria-hidden="true" />
              <div>
                <strong>{registro.texto}</strong>
                <small className="muted">{formatarData(registro.quando)}</small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */

function plural(quantidade: number, singular: string, plural_: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural_}`
}
