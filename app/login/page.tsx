'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CircleUserRound,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from 'lucide-react'
import { PERFIS, PERFIL_PADRAO, type Perfil } from '@/lib/perfis'

const descricoes: Record<Perfil, { descricao: string; icone: typeof BookOpen }> = {
  Estudante: { descricao: 'Preencher meu plano e contar como aprendo', icone: CircleUserRound },
  Professor: { descricao: 'Acompanhar e contribuir pedagogicamente', icone: BookOpen },
  'Professor de AEE': {
    descricao: 'Acompanhar o atendimento educacional especializado',
    icone: UsersRound,
  },
  Família: { descricao: 'Compartilhar rotina, interesses e estratégias', icone: HeartHandshake },
  'Profissional da Saúde': {
    descricao: 'Registrar recomendações e acompanhamento',
    icone: Stethoscope,
  },
  'Usuário Mestre': {
    descricao: 'Formatar e visualizar todo o conteúdo pedagógico',
    icone: ShieldCheck,
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aviso, setAviso] = useState('')

  function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    router.push(`/dashboard?perfil=${encodeURIComponent(perfil)}`)
  }

  return (
    <main className="login-page">
      <section className="login-illustration" aria-label="Educação inclusiva">
        <div className="login-brand">
          <img src="/logo-mestrado-inclusiva.png" alt="ProfEi — Mestrado em Educação Inclusiva" />
          <strong>PDI Interativo</strong>
        </div>
        <div className="login-message">
          <p className="eyebrow">ProfEi</p>
          <h1>PDI Interativo</h1>
          <p>
            Um espaço seguro para o aluno, a família, os professores e os profissionais da saúde
            construírem o desenvolvimento em conjunto.
          </p>
        </div>
        <div className="hands-art" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <b>+</b>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-heading">
            <div className="login-logos">
              <img src="/logo-uemg.png" alt="UEMG" />
              <span className="brand-divider" />
              <img src="/logo-mestrado-inclusiva.png" alt="Mestrado em Educação Inclusiva" />
            </div>
            <p className="eyebrow">Acesso seguro</p>
            <h2>Olá! Quem está acessando o sistema?</h2>
            <p className="muted">Entre para acessar sua área personalizada.</p>
          </div>

          <form onSubmit={entrar} className="login-form">
            <label htmlFor="email">E-mail ou usuário</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={evento => setEmail(evento.target.value)}
              placeholder="voce@escola.edu.br"
              required
            />

            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={evento => setSenha(evento.target.value)}
              placeholder="Digite sua senha"
              required
            />

            <fieldset className="profile-fieldset">
              <legend className="login-profile-heading">
                <span>Quem é você?</span>
                <small>Selecione seu perfil</small>
              </legend>
              <div className="profile-options">
                {PERFIS.map(nome => {
                  const { descricao, icone: Icone } = descricoes[nome]
                  return (
                    <button
                      type="button"
                      key={nome}
                      aria-pressed={perfil === nome}
                      className={`profile-option ${perfil === nome ? 'selected' : ''}`}
                      onClick={() => setPerfil(nome)}
                    >
                      <Icone aria-hidden="true" />
                      <span>
                        <b>{nome}</b>
                        <small>{descricao}</small>
                      </span>
                      <i aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <button className="primary-btn login-submit" type="submit">
              <LockKeyhole aria-hidden="true" /> Entrar na minha área
            </button>
          </form>

          <div className="login-footer">
            <ShieldCheck aria-hidden="true" /> Seus dados são protegidos e compartilhados somente
            com a rede autorizada.
          </div>
        </div>

        <p className="signup-note">
          Ainda não tem uma conta?{' '}
          <button
            type="button"
            onClick={() =>
              setAviso('Solicite seu acesso à secretaria da escola ou ao professor responsável pelo PDI.')
            }
          >
            Solicite acesso à escola
          </button>
        </p>
        {aviso && (
          <p className="signup-note" role="status">
            {aviso}
          </p>
        )}
      </section>
    </main>
  )
}
