'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CircleUserRound, HeartHandshake, LockKeyhole, ShieldCheck, Stethoscope } from 'lucide-react'

const perfis = [
  { nome: 'Aluno', descricao: 'Preencher meu plano e contar como aprendo', icone: CircleUserRound },
  { nome: 'Professor', descricao: 'Acompanhar e contribuir pedagogicamente', icone: BookOpen },
  { nome: 'Família', descricao: 'Compartilhar rotina, interesses e estratégias', icone: HeartHandshake },
  { nome: 'Profissional da saúde', descricao: 'Registrar recomendações e acompanhamento', icone: Stethoscope },
  { nome: 'AEE', descricao: 'Acompanhar o atendimento educacional especializado', icone: BookOpen },
  { nome: 'Usuário mestre', descricao: 'Formatar e visualizar todo o conteúdo pedagógico', icone: ShieldCheck },
]

export default function LoginPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState('Aluno')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    router.push(`/dashboard?perfil=${encodeURIComponent(perfil)}`)
  }

  return <main className="login-page">
    <section className="login-illustration" aria-label="Educação inclusiva">
      <div className="login-brand"><img src="/logo-mestrado-inclusiva.png" alt="ProfEi — Mestrado em Educação Inclusiva" /><strong>PDI Interativo</strong></div>
      <div className="login-message"><p className="eyebrow">ProfEi</p><h1>PDI Interativo</h1><p>Um espaço seguro para o aluno, a família, os professores e os profissionais da saúde construírem o desenvolvimento em conjunto.</p></div>
      <div className="hands-art" aria-hidden="true"><span /><span /><span /><span /><b>+</b></div>
    </section>
    <section className="login-panel"><div className="login-card">
      <div className="login-heading"><div className="login-logos"><img src="/logo-uemg.png" alt="UEMG" /><span className="brand-divider" /><img src="/logo-mestrado-inclusiva.png" alt="Mestrado em Educação Inclusiva" /></div><p className="eyebrow">Acesso seguro</p><h2>Olá! Quem está acessando o sistema?</h2><p className="muted">Entre para acessar sua área personalizada.</p></div>
      <form onSubmit={entrar} className="login-form"><label htmlFor="email">E-mail ou usuário</label><input id="email" type="email" value={email} onChange={evento => setEmail(evento.target.value)} placeholder="voce@escola.edu.br" required /><label htmlFor="senha">Senha</label><input id="senha" type="password" value={senha} onChange={evento => setSenha(evento.target.value)} placeholder="Digite sua senha" required /><div className="login-profile-heading"><label>Quem é você?</label><span>Selecione seu perfil</span></div><div className="profile-options">{perfis.map(({ nome, descricao, icone: Icone }) => <button type="button" key={nome} className={`profile-option ${perfil === nome ? 'selected' : ''}`} onClick={() => setPerfil(nome)}><Icone /><span><b>{nome}</b><small>{descricao}</small></span><i /></button>)}</div><button className="primary-btn login-submit" type="submit"><LockKeyhole /> Entrar na minha área</button></form>
      <div className="login-footer"><ShieldCheck /> Seus dados são protegidos e compartilhados somente com a rede autorizada.</div>
    </div><p className="signup-note">Ainda não tem uma conta? <button type="button" onClick={() => router.push('/dashboard?perfil=Aluno')}>Solicite acesso à escola</button></p></section>
  </main>
}
