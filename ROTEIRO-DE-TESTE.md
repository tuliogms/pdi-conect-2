# Roteiro de teste — PDI Interativo

Passo a passo para validar o aplicativo do começo ao fim, seguindo o portfólio
(`Portfolio_PDI_Participativo_ABNT_.pdf`). Leva cerca de 12 minutos.

> **Antes de começar:** a barra lateral mostra onde os dados estão sendo gravados.
> Neste ambiente o app já está ligado a um **banco Postgres** (“Os dados estão sendo
> gravados no banco de dados”), então o que você cadastrar vale para todos os perfis.
> Sem `DATABASE_URL`, o mesmo teste funciona, mas os dados ficam no navegador.

Legenda: ✅ = o que deve acontecer.

---

## 0. Preparar a base

O sistema começa **vazio** — nenhum estudante, usuário ou resposta de exemplo.

1. Abra `/` → a abertura “Pingo Saltitante” roda e cai no login.
2. Entre como **Usuário Mestre** → aba **Estudantes** → botão **Cadastrar estudante**
   (ex.: “Ana Beatriz”, “4º ano B”, “Escola Municipal Paulo Freire”).
   - ✅ O estudante aparece na lista com equipe vazia e progresso em 0%.
3. Aba **Usuários** → **Cadastrar usuário**, um por vez, vinculando ao estudante:
   estudante, professor, família, profissional da saúde.
   - ✅ Cada pessoa aparece na tabela com o perfil e o vínculo corretos.
4. Aba **Configurações** → confira o bloco **Dados da escola** (estudantes,
   usuários, permissões e indicadores) e o **Guia rápido** com os cinco passos do
   uso real.

---

## 1. Visão geral e cadastros (portfólio, seções 2 e 9)

1. Aba **Visão geral**.
   - ✅ Quatro cartões: Estudantes, Usuários ativos, Aguardando acesso, PDIs completos.
   - ✅ Tabela “Situação dos PDIs” com barra de progresso e o status escrito
     (Pendente / Em andamento / Concluída).
   - ✅ Bloco “Precisa de atenção” quando existe convite pendente ou estudante sem equipe.
2. Aba **Usuários**.
   - ✅ Busca e filtros por perfil e status funcionam.
   - ✅ **Cadastrar usuário**: cadastre “Ana Souza / ana@escola.br / Família / vinculada ao estudante”.
   - ✅ Repita com o mesmo e-mail: aparece “Já existe um usuário com este e-mail”.
   - ✅ **Editar** abre o formulário preenchido; **Desativar** troca o status.
3. Aba **Estudantes**.
   - ✅ Cartões com turma, escola, equipe vinculada e progresso.
   - ✅ **Cadastrar estudante** cria o registro e o cartão aparece na hora.
   - ✅ **Remover** pede confirmação antes de apagar.

---

## 2. Campo e permissões (portfólio, seções 7 e 9)

1. Aba **Campos e formulários** → aba **Professor**.
   - ✅ Lista numerada dos campos; setas ↑ ↓ mudam a ordem.
   - ✅ **Editar** altera título, instrução, tipo (texto/lista) e o que os outros perfis podem fazer.
   - ✅ **Remover** funciona nos campos criados pela escola; os “padrão” só podem ser editados e reordenados.
   - ✅ **Restaurar padrão** volta a lista original.
2. Aba **Permissões de acesso** → escolha o estudante.
   - ✅ Matriz pessoa × área (Estudante, Professor, Família, Saúde).
   - ✅ Cada célula mostra `Padrão (Editar)` e permite fixar `Editar`, `Comentar`,
     `Visualizar` ou `Sem acesso`; a célula marca **definido**.
   - ✅ **Padrão** na última coluna limpa as escolhas daquela pessoa.

---

## 3. Área do estudante (portfólio, seção 3)

1. Saia e entre como **Estudante**.
2. **Meu PDI**.
   - ✅ Os **6 tópicos fixos** aparecem como lista, com o estado de cada um.
   - ✅ Alternância **Descritivo | Perguntas** por tópico.
   - ✅ Botão **Ouvir** (quando a leitura em voz alta está ligada).
3. Escreva em **Meu perfil** → **Salvar**.
   - ✅ O botão passa para “Salvo” e aparece “quem · data/hora”.
   - ✅ O progresso sobe para **1 de 6** no cartão do tópico e no topo da lista.
4. Em **Meus interesses**, troque para **Perguntas** e responda uma.
   - ✅ As perguntas têm campos separados.
   - ✅ Ao voltar para **Descritivo**, o texto anterior continua salvo.
5. Responda um tópico como **Professor** (área do estudante é leitura): confirme que
   não há botão Salvar ali.

---

## 4. Área do professor, família e saúde (portfólio, seções 5, 6 e 7)

1. Entre como **Professor** → **Meus alunos**.
   - ✅ Cartão com nome, turma, situação do PDI, etapas e **chips de potencialidades**.
   - ✅ **Abrir PDI** leva ao plano do estudante.
2. Em **PDI do estudante**, aba **Professor**:
   - ✅ Campos de texto, listas em chips (adicione “Criatividade”) e botão **Salvar**.
   - ✅ **Comentar** grava um comentário identificado, sem mudar a resposta.
3. Troque para as abas **Família** e **Saúde**:
   - ✅ Aparecem em leitura (selo **Visualizar**) — o professor não edita a área dos outros.
4. Entre como **Família** (`/dashboard?perfil=familia`) → **PDI do estudante** → aba **Família**.
   - ✅ Agora a área da família é editável, com os campos configurados pela escola.
5. Entre como **Profissional da Saúde** e repita na aba **Saúde**.
6. Volte como **Usuário Mestre**, em **Permissões**, marque “Sem acesso” para a Família
   na área da Saúde e confirme como Família que a aba some ou fica bloqueada.

---

## 5. Acessibilidade (portfólio, seção 4)

1. Abra **Acessibilidade** (menu ou botão do topo).
2. Ligue **Ouvir os textos** → **Ouvir exemplo**.
   - ✅ Fala em português; **Pausar/Continuar/Parar** funcionam.
   - ✅ Se o navegador não suportar, aparece um aviso claro (nada quebra).
3. Ajuste **Velocidade da voz** e ouça de novo.
4. Ligue **Mostrar botão de microfone** → volte a **Meu PDI**.
   - ✅ Cada campo de texto ganha o microfone (Chrome/Edge/Android).
5. Ligue **Alto contraste** e **Botões maiores** e use **A+**.
   - ✅ A interface muda na hora, e as escolhas continuam depois de recarregar.
6. Use **Tab** por toda a tela: o foco é sempre visível. **Esc** fecha o menu no celular.

---

## 6. Acompanhamento (portfólio, seção 8)

1. Como **Professor**, abra **Acompanhamento**.
   - ✅ Cartões de Leitura, Escrita e Interação social com último valor e média.
2. Escolha o nível (1 a 5) e toque em **Registrar observação**.
   - ✅ O gráfico aparece/atualiza e o registro entra na tabela com autor e data.
3. Escreva em **Próximos passos** → **Salvar próximos passos**.
4. Como **Usuário Mestre**, role até **Indicadores acompanhados** e adicione “Comunicação oral”.
   - ✅ O novo indicador aparece nos cartões e no formulário de registro.

---

## 7. PDI consolidado e PDF (portfólio, seção 9)

1. Abra **PDI consolidado** (qualquer perfil).
   - ✅ Cabeçalho com logos, nome, turma/escola, situação e data de emissão.
   - ✅ Etapas do PDI com status, “O que o estudante conta”, contribuições de cada
     área com autor/data, evolução e próximos passos.
2. Toque em **Gerar PDF** → escolha **Salvar como PDF**.
   - ✅ O menu, os botões e os avisos **não** saem no documento.
   - ✅ O texto e as tabelas saem legíveis, sem cortar as seções.

---

## 8. Backup e planilha (gestor)

1. **Configurações** → **Exportar backup**.
   - ✅ Baixa um `.json` com cadastros, permissões, campos e respostas.
2. **Exportar planilha (CSV)**.
   - ✅ Baixa um `.csv` que abre no Excel com acentos e uma linha por resposta.
3. **Apagar todos os dados** → confirme.
   - ✅ Estudantes, usuários e respostas somem e os campos voltam ao padrão.
4. **Importar backup** → escolha o arquivo do passo 1.
   - ✅ Os cadastros e as respostas voltam e a página recarrega.

---

## 9. Celular e leitor de tela

1. Abra o app no celular (ou estreite a janela do navegador).
   - ✅ O botão ☰ aparece no topo; tocar abre o menu deslizando por cima.
   - ✅ Tocar fora, tocar em ☰ de novo ou apertar **Esc** fecha.
   - ✅ Ao escolher uma aba, o menu fecha e a tela muda.
2. Ative o **TalkBack** (Android) ou **VoiceOver** (iPhone).
   - ✅ Os botões são anunciados pelo nome; os status são lidos com o texto
     (“Concluída”, “Em andamento”, “Pendente”).

---

## Checklist rápido

- [ ] Aba abre em todos os perfis (não fica em branco)
- [ ] Resposta salva sobrevive ao recarregar a página
- [ ] Permissão “Sem acesso” realmente bloqueia
- [ ] Campo novo aparece no PDI e no PDF na ordem configurada
- [ ] Gráfico de acompanhamento desenha após o primeiro registro
- [ ] PDF sai sem menus e sem botões
- [ ] Backup exporta e reimporta sem perder dados
- [ ] Menu abre e fecha no celular
