# Roteiro de teste — PDI Interativo

Passo a passo para validar o aplicativo do começo ao fim, seguindo a especificação das oito
áreas do PDI. Leva cerca de 15 minutos.

> **Antes de começar:** a barra lateral mostra onde os dados estão sendo gravados.
> Neste ambiente o app já está ligado a um **banco Postgres** (“Os dados estão sendo
> gravados no banco de dados”), então o que você cadastrar vale para todos os perfis.
> Sem `DATABASE_URL`, o mesmo teste funciona, mas os dados ficam no navegador.

Legenda: ✅ = o que deve acontecer.

---

## 0. Preparar a base

O sistema começa **vazio** — nenhum educando, usuário ou resposta de exemplo.

1. Abra `/` → a abertura “Pingo Saltitante” roda e cai no login.
2. Entre como **Usuário Mestre** → aba **Educandos** → botão **Cadastrar educando**
   (ex.: “Ana Beatriz”, “4º ano B”, “Escola Municipal Paulo Freire”).
   - ✅ O educando aparece na lista com equipe vazia.
3. Área **Usuário Mestre** → **Usuários** → **Cadastrar usuário**, um por vez, vinculando ao educando:
   educando, professor, professor de AEE, família e profissional de apoio.
   - ✅ Cada pessoa aparece na tabela com o perfil e o vínculo corretos.
4. Área **Usuário Mestre** → **Configurações** → **Identidade institucional**: troque o nome do
   sistema, a escola e envie uma logo.
   - ✅ O nome/logo aparecem no topo e no cabeçalho do PDI consolidado.

---

## 1. Visão geral e cadastros (Mestre)

1. Sub-aba **Visão geral**.
   - ✅ Cartões com Educandos, Usuários, Aguardando acesso, Permissões, Campos e Alterações.
   - ✅ Atalhos administrativos e **histórico de alterações** com data.
2. Sub-aba **Usuários**.
   - ✅ Busca e filtros por perfil e status funcionam.
   - ✅ E-mail repetido é barrado com mensagem.
3. Sub-aba **Educandos** — editar, remover (com confirmação) e **Abrir PDI**.
   - ✅ Remover um educando desfaz o vínculo dos usuários, sem apagar as pessoas.

---

## 2. Campos, perguntas e pranchas (Mestre)

1. Área **Usuário Mestre** → **Campos e formulários** → escolha a área **Área do Professor**.
   - ✅ Os campos aparecem agrupados por seção (Identificação, Observações pedagógicas,
     Potencialidades, Dificuldades e barreiras, Estratégias, Adaptações, Objetivos,
     Acompanhamento) — oito seções.
2. Adicione um campo novo e reordene com ↑ ↓.
   - ✅ O campo novo entra na seção escolhida e a ordem é a mesma do PDF.
3. Role até **Perguntas norteadoras do educando**: adicione e remova perguntas de uma seção.
   - ✅ As perguntas aparecem no formato “Perguntas” do educando.
4. Sub-aba **Pranchas de comunicação**: crie uma prancha, adicione símbolos e remova um símbolo.
   - ✅ Cada símbolo tem imagem (emoji) e **nome escrito**.

---

## 3. Área do educando (6 seções + áudio + prancha)

1. Saia e entre como **Educando**.
   - ✅ A área **Educando** já vem aberta, com as seis seções.
2. Escreva em **Meu perfil** e clique **Salvar**.
   - ✅ “Resposta salva no banco de dados” e a linha “Última versão de … · data”.
3. Troque o formato para **Perguntas** e responda uma pergunta.
   - ✅ A pergunta aparece separada e conta no progresso (ex.: 2/6 seções respondidas).
4. Em qualquer seção, toque em **Prancha de comunicação**.
   - ✅ Escolha “Vários símbolos”, toque em dois símbolos, veja a frase montada,
     **Ouvir** lê a frase e **Usar esta frase** coloca o texto na resposta.
   - ✅ “Um símbolo” envia só o símbolo escolhido.
5. Toque em **Responder em áudio** e grave alguns segundos.
   - ✅ O áudio aparece com player e o botão **Remover áudio** (o botão só existe se o
     navegador oferecer microfone).
6. Confira as abas das outras áreas.
   - ✅ Para o educando, as áreas dos adultos aparecem em **somente leitura** (sem “Salvar”).

---

## 4. Professor e AEE (8 e 9 seções)

1. Entre como **Professor**.
   - ✅ A área **Professor** abre por padrão, com as oito seções.
2. Salve uma observação pedagógica e adicione um item em **Potencialidades**.
   - ✅ Os itens viram chips e ficam salvos com autor e data.
3. Abra a aba **AEE**.
   - ✅ Somente leitura para o professor; as nove seções aparecem.
4. Entre como **Professor de AEE** e preencha **Recursos de acessibilidade** e
   **Orientações para os professores**.
   - ✅ Ficam gravados na área do AEE e aparecem no consolidado.

---

## 5. Família: rotina e autorização de compartilhamento (10 seções)

1. Entre como **Família**.
   - ✅ A área **Família** abre por padrão, com as dez seções.
2. Preencha **Como é a rotina em casa** e salve.
3. Vá até **Autorização de compartilhamento**.
   - ✅ O cartão começa **Pendente**.
   - ✅ Marque “Autorizo o compartilhamento”, escolha as áreas e preencha quem autoriza.
   - ✅ **Registrar autorização** → o cartão fica **Autorizado** com data e responsável.
   - ✅ **Revogar autorização** pede o motivo e volta o cartão para pendente.

---

## 6. Profissionais de Apoio (acesso só ao autorizado)

1. **Antes de autorizar** (ou depois de revogar), entre como **Profissional de Apoio**.
   - ✅ No menu aparece só **Profissionais de Apoio** (e Construção do PDI/Acompanhamento);
     nenhuma área de outra pessoa fica acessível.
2. Com a autorização vigente, entre de novo.
   - ✅ No menu aparecem a própria área e **as áreas que a família liberou** (em leitura).
3. Preencha **Identificação profissional** (nome, área de atuação, registro) e salve.
   - ✅ A contribuição fica registrada com o nome de quem escreveu.

---

## 7. Construção do PDI: consolidado, versões e PDF

1. Entre como **Usuário Mestre** → **PDI consolidado**.
   - ✅ **Situação de cada área** com selo (Concluída / Em andamento / Pendente).
   - ✅ Cada contribuição mostra o autor e a data.
   - ✅ **Histórico de versões do PDI** aparece ao final.
2. Toque em **Gerar PDF** → “Salvar como PDF”.
   - ✅ O documento sai com a logo/nome da escola, as áreas e a autoria.
3. Aba **Versões do PDI**.
   - ✅ Lista de tudo o que foi salvo (educando, data, autor, área, o que mudou).
   - ✅ **Baixar relatório** gera o CSV do histórico.
4. Na área **Educandos**, toque em **Abrir PDI**.
   - ✅ O Mestre cai na área do educando e pode editar qualquer uma das áreas.

---

## 8. Acompanhamento por período

1. Aba **Acompanhamento** → **Novo registro**.
   - ✅ Registre período, objetivos, estratégias em uso, progressos, dificuldades que
     permanecem, o que funcionou, o que precisa mudar e novos objetivos.
   - ✅ O registro entra na **linha do tempo** com autor e data.
2. Registre um valor na escala de 1 a 5.
   - ✅ O gráfico de evolução aparece e a legenda tem o nome de cada indicador.
3. **Baixar relatório** do acompanhamento.
   - ✅ CSV com uma linha por período.

---

## 9. Permissões, backup e privacidade

1. Como Mestre, área **Usuário Mestre** → sub-aba **Permissões de acesso**.
   - ✅ A matriz mostra Educando, Professor, AEE, Família e Profissionais de Apoio.
   - ✅ Mudar para **Sem acesso** esconde a área daquela pessoa na hora seguinte.
2. **Configurações** → **Exportar dados (JSON)**.
   - ✅ O arquivo tem configuração, educandos e respostas.
3. Entre como **Educando** → **Acessibilidade** → ligue alto contraste e botões grandes.
   - ✅ As classes aparecem no app e a preferência fica gravada.

---

## 10. Celular e leitor de tela

1. Abra em uma janela estreita (ou no celular).
   - ✅ O botão de menu aparece; tocar abre a barra lateral; `Esc` e toque fora fecham.
   - ✅ Nenhuma aba fica inalcançável.
2. Com um leitor de tela (TalkBack/VoiceOver/NVDA), percorra a aba do educando.
   - ✅ Cada seção, pergunta e botão tem nome; os símbolos das pranchas têm o rótulo escrito.

---

## Checklist rápido

- [ ] Abre no login e a abertura roda
- [ ] Mestre cadastra educando, equipe e pranchas
- [ ] Educando responde por texto, áudio e prancha
- [ ] Professor e AEE preenchem as próprias áreas
- [ ] Família preenche e autoriza/revoga o compartilhamento
- [ ] Profissional de apoio só vê o que foi autorizado
- [ ] Consolidado com autoria + PDF
- [ ] Histórico de versões e relatórios CSV
- [ ] Acompanhamento por período com gráfico
- [ ] Menu utilizável no celular e com leitor de tela
