/**
 * Massa de teste usada apenas pelos testes automatizados.
 *
 * O aplicativo não traz dados de exemplo: ele começa vazio. Para os testes de
 * interface e de fluxo, esta função monta um estudante e a equipe vinculada a
 * ele (as mesmas informações que a escola cadastraria na tela de administração).
 */
export function configuracaoComEquipe(pdi, config = pdi.configVazia()) {
  const estudante = {
    id: pdi.novoId(),
    nome: 'Estudante de teste',
    serie: '5º ano A',
    escola: 'Escola de teste',
  }

  const pessoas = [
    { nome: 'Estudante de teste', perfil: 'Educando', email: 'educando.teste@escola.br' },
    { nome: 'Professor de teste', perfil: 'Professor', email: 'professor.teste@escola.br' },
    { nome: 'AEE de teste', perfil: 'Professor de AEE', email: 'aee.teste@escola.br' },
    { nome: 'Família de teste', perfil: 'Família', email: 'familia.teste@escola.br' },
    { nome: 'Apoio de teste', perfil: 'Profissional de Apoio', email: 'apoio.teste@escola.br' },
  ]

  return {
    ...config,
    estudantes: [...config.estudantes, estudante],
    usuarios: [
      ...config.usuarios,
      ...pessoas.map(pessoa => ({
        id: pdi.novoId(),
        nome: pessoa.nome,
        email: pessoa.email,
        perfil: pessoa.perfil,
        estudanteId: estudante.id,
        status: 'Ativo',
      })),
    ],
  }
}
