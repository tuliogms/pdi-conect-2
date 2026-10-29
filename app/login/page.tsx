'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CircleUserRound, HeartHandshake, LockKeyhole, ShieldCheck, Stethoscope, UsersRound } from 'lucide-react'

const profiles = [
  { name: 'Aluno', description: 'Preencher meu plano e contar como aprendo', icon: CircleUserRound },
  { name: 'Professor', description: 'Acompanhar e contribuir pedagogicamente', icon: BookOpen },
  { name: 'Família', description: 'Compartilhar rotina, interesses e estratégias', icon: HeartHandshake },
  { name: 'Profissional da saúde', description: 'Registrar recomendações e acompanhamento', icon: Stethoscope },
]

export default function LoginPage() {
  const router = useRouter()
  const [profile, setProfile] = useState('Aluno')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(`/dashboard?perfil=${encodeURIComponent(profile)}`)
  }

  return <main className="login-page">
    <section className="login-illustration" aria-label="Educação inclusiva">
      <div className="login-brand"><img src="/logo-uemg.png" alt="UEMG" /><span className="brand-divider" /><strong>PDI Interativo</strong></div>
      <div className="login-message"><p className="eyebrow">Rede inclusiva</p><h1>Juntos por uma educação mais inclusiva.</h1><p>Um espaço seguro para o aluno, a família, os professores e os profissionais da saúde construírem o desenvolvimento em conjunto.</p></div>
      <div className="hands-art" aria-hidden="true"><span /><span /><span /><span /><b>+</b></div>
    </section>
    <section className="login-panel"><div className="login-card">
      <div className="login-heading"><div className="login-logos login-logos-emphasis"><img src="/logo-mestrado-inclusiva.png" alt="Mestrado em Educação Inclusiva" /></div><p className="eyebrow">Acesso seguro</p><h2>Olá! Quem está acessando o sistema?</h2><p className="muted">Entre para acessar sua área personalizada.</p></div>
      <form onSubmit={handleSubmit} className="login-form"><label htmlFor="email">E-mail ou usuário</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@escola.edu.br" required /><label htmlFor="password">Senha</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" required /><div className="login-profile-heading"><label>Quem é você?</label><span>Selecione seu perfil</span></div><div className="profile-options">{profiles.map(({ name, description, icon: Icon }) => <button type="button" key={name} className={`profile-option ${profile === name ? 'selected' : ''}`} onClick={() => setProfile(name)}><Icon /><span><b>{name}</b><small>{description}</small></span><i /></button>)}</div><button className="primary-btn login-submit" type="submit"><LockKeyhole /> Entrar na minha área</button></form>
      <div className="login-footer"><ShieldCheck /> Seus dados são protegidos e compartilhados somente com a rede autorizada.</div>
    </div><p className="signup-note">Ainda não tem uma conta? <button type="button" onClick={() => router.push('/?perfil=Aluno')}>Solicite acesso à escola</button></p></section>
  </main>
}
