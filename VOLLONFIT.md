# VollonFit — Guia único: instruções, correções e rebrand

App de treino usado só por duas pessoas (casal). Stack: React 19 + Vite + Tailwind 3 + Supabase + Vercel (PWA).
Repositório: https://github.com/cf95souza/VollonFit.git
Revisão feita em 01/11/2026.

> Para o agente: leia este arquivo inteiro antes de mexer em qualquer coisa e siga as etapas na ordem.

## 1. Resumo e estado atual

O app compila e funciona, mas foi construído como plataforma SaaS (professor, academia, master, marketplace, cobrança), muito além do que o casal precisa. A estratégia é mexer o mínimo: corrigir os bugs reais, trocar a identidade para **preto, vermelho e branco**, redesenhar as 6 telas principais e só depois acrescentar funções novas.

| Item | Situação |
|---|---|
| Correções de bugs | Prontas no patch `vollonfit-rebrand-e-correcoes.patch` |
| Cores preto/vermelho/branco nos arquivos de tema | Prontas no mesmo patch |
| Novos layouts das 6 telas | Desenhados (imagens em `docs/design/`); **falta implementar no código** |
| Funções novas | Planejadas (etapa 4) |
| Segurança do login e do banco | Documentada; **só com aprovação do dono** (etapa 5) |

## 2. Regras gerais

1. Faça o mínimo necessário. O objetivo é que tudo funcione e fique bonito, não reescrever o app.
2. Não apague telas de professor, academia, master ou marketplace; apenas não mexa nelas.
3. Nunca rode SQL em produção sem mostrar o script antes e receber aprovação. As etapas 1 a 4 não exigem mudança no banco.
4. Depois de cada etapa: `npm run build`. Se falhar, corrija antes de seguir.
5. Não faça commit do `package-lock.json` se ele mudou só por causa do `npm install`.
6. Um commit por etapa, com mensagem curta em português.
7. Não invente dados. Onde o desenho mostra um valor fictício, use o dado real do Supabase.

## 3. Referências visuais

Imagens salvas pelo dono do projeto em `docs/design/`:

| Arquivo | Tela | Componente atual |
|---|---|---|
| `01-login.png` | Login | `src/pages/Login.jsx` |
| `02-inicio.png` | Início (treinos) | `src/pages/StudentDashboard.jsx` (aba Treinos) |
| `03-evolucao.png` | Evolução | `src/components/dashboard/EvolutionView.jsx` |
| `04-squads.png` | Squads | `src/components/dashboard/SquadTab.jsx` e `SquadLeaderboard.jsx` |
| `05-treino-do-dia.png` | Lista de exercícios do dia | `src/pages/StudentDashboard.jsx` (visão do treino) |
| `06-exercicio.png` | Execução do exercício | `src/components/dashboard/ExecutionView.jsx` |

Se alguma imagem faltar, peça ao dono antes de adivinhar o layout.

## 4. Etapa 1 — Aplicar o patch (correções + cores)

1. Coloque `vollonfit-rebrand-e-correcoes.patch` na raiz.
2. Rode:
   ```bash
   git apply --check vollonfit-rebrand-e-correcoes.patch
   git apply vollonfit-rebrand-e-correcoes.patch
   npm install
   npm run build
   ```
3. Se o `--check` falhar, use o `VollonFit-atualizado.zip` e copie os arquivos alterados.
4. Commit: `fix: correções e paleta preto/vermelho/branco`.

### Falhas encontradas e já corrigidas pelo patch

| # | Falha | Efeito | Correção |
|---|---|---|---|
| 1 | Série perdida quando o salvamento falhava | O app avançava para a próxima série sem avisar e o registro sumia | `ExecutionView.jsx`: só avança se salvou; mostra erro |
| 2 | Toque duplo em "Concluir série" | Podia gravar a mesma série duas vezes | Bloqueio enquanto salva |
| 3 | Datas calculadas em UTC | Treinando depois das 21h o dia "virava": contador semanal, ranking e inatividade do squad erravam | `daysAgoLocally` e `startOfWeekLocally` em `dateUtils.js`, usadas no dashboard, ranking e squad |
| 4 | Bônus de constância nunca acertava | Contava séries, não dias, e comparava com 4 | Agora conta dias distintos de treino na semana |
| 5 | PWA desligado | Service Worker comentado: sem instalação confiável, sem offline, sem push | Registro ativo só em produção (`main.jsx`) |
| 6 | Anotação do exercício sem tratamento de erro | Mostrava "salva" mesmo falhando | Mostra erro |
| 7 | Chaves do Supabase com valor falso de reserva | Com variável faltando, o app abria quebrado sem explicação | `supabaseClient.js` falha com mensagem clara |
| 8 | `h-screen` no celular | A barra do navegador cortava o botão de baixo | Trocado por `h-dvh` |
| 9 | `.gitignore` corrompido | Final com caracteres inválidos | Limpo |
| 10 | `console.log` no ranking | Ruído em produção | Removido |

Arquivos alterados pelo patch: `tailwind.config.js`, `src/index.css`, `themeLoader.js`, `colorUtils.js`, `public/manifest.json`, `index.html`, `dateUtils.js`, `StudentDashboard.jsx`, `SquadTab.jsx`, `SquadLeaderboard.jsx`, `ExecutionView.jsx`, `main.jsx`, `supabaseClient.js`, `.gitignore`.

Conferir na Vercel (Settings → Environment Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_VAPID_PUBLIC_KEY`.

## 5. Etapa 2 — Identidade visual (rebrand)

**Conceito:** esportivo, agressivo e limpo. Fundo preto, vermelho como única cor de destaque, branco no texto. Sem azul, ciano, verde ou roxo.

### Cores

| Uso | Valor |
|---|---|
| Fundo | `#0A0A0A` |
| Card | `#141414` (gradiente leve até `#101010`) |
| Card elevado | `#1A1A1A` |
| Borda | `#2A2A2A` |
| Vermelho principal (botões, anel de progresso, dia de hoje) | `#E11D2E` |
| Fim do gradiente vermelho | `#9F0012` |
| Vermelho de destaque em texto e ícones pequenos | `#FF3B4A` |
| Texto principal | `#FFFFFF` |
| Texto secundário | `#E5E5E5` |
| Texto apagado | `#A3A3A3` |
| Texto sobre botão vermelho | `#FFFFFF` |

Regras:
- Botão principal: gradiente `135deg` de `#E11D2E` para `#9F0012`, texto branco em negrito, brilho `0 8px 28px rgba(255,59,74,.35)`.
- O vermelho claro `#FF3B4A` só aparece em texto e ícones sobre fundo escuro; nunca como fundo de botão com texto branco.
- Segunda pessoa no squad (Thais): cinza e branco (`#52525B` → `#27272A`), nunca outra cor vibrante.
- Contraste mínimo de 4,5:1 nos textos.
- A cor primária vem de `themeLoader.js` e pode ser sobrescrita por uma cor salva em Configurações. Se o app abrir em outra cor, salve `#E11D2E` de novo ou limpe a cor salva.

### Tipografia
- Títulos: **Barlow Condensed**, peso 800, maiúsculas.
- Texto: **Inter**, pesos 500, 600 e 700.
- Carregue pelo Google Fonts no `index.html` (preconnect + `display=swap`) e registre no `tailwind.config.js` como `font-display` e `font-body`.
- Números grandes (carga, repetições, pontos, contadores) usam a fonte de título.

### Componentes base (crie uma vez, reutilize)
- **Card:** raio 18px, borda `#2A2A2A`, fundo em gradiente leve.
- **Botão principal:** altura 52px (60px no modo treino), raio 14px (pílula no modo treino).
- **Chip:** 11px, maiúsculas, espaçamento 0,08em, raio total.
- **Anel de progresso:** SVG com `stroke-dasharray`, gradiente vermelho, ponta arredondada.
- **Barra inferior flutuante:** posição absoluta a 14px das bordas, raio 28px, fundo `rgba(20,20,20,.92)`, borda `#2A2A2A`, sombra forte. Aba ativa com fundo `rgba(255,59,74,.14)` e texto `#FF3B4A`.
- **Alvos de toque:** mínimo 44px.
- Reserve `padding-bottom` de pelo menos 96px no conteúdo para a barra flutuante não cobrir nada.

## 6. Etapa 3 — Novos layouts das telas

Uma tela por vez, comparando com a imagem. Mantenha toda a lógica e as consultas ao Supabase; mude só a apresentação. Ordem sugerida: Login, Início, Treino do dia, Exercício, Evolução, Squads.

### 6.1 Login (`01-login.png`)
- Fundo preto com dois brilhos radiais vermelhos suaves no topo.
- Logo pequeno (ícone + "Vollon**Fit**", "Fit" em vermelho).
- Título gigante "Treine junto." em Barlow Condensed, gradiente de branco para vermelho, e uma frase de apoio curta.
- Campos e botão "Entrar" num painel que sobe da base (raio 32px em cima).
- Não muda a lógica de autenticação nesta etapa.

### 6.2 Início (`02-inicio.png`)
- Cabeçalho: avatar com inicial, "Olá, {nome}!", contador de treinos da semana, sino de notificações.
- Faixa com os 7 dias da semana; hoje em gradiente vermelho; dias treinados marcados.
- Card do treino sugerido: chip "Hoje · ~45 min", título grande, "Dia N · X exercícios" e **anel de progresso** com treinos da semana (ex.: 0/5). Botão "Iniciar treino" logo abaixo.
- Card de volume semanal com mini gráfico de linha vermelho.
- Três números de resumo: peso atual, recordes, total de treinos.
- Linha horizontal rolável com os outros treinos (Dia 1, Dia 2...).
- Barra inferior flutuante com as 5 abas.

### 6.3 Treino do dia (`05-treino-do-dia.png`)
- Botão voltar redondo.
- Título enorme em duas linhas ("Ombro" / "+ Abdômen", a segunda em gradiente).
- Chips: nº de exercícios, nº de séries, tempo estimado.
- Exercícios em **linha do tempo**: círculo numerado ligado por uma linha; o primeiro em gradiente vermelho.
- Botão "Iniciar treino" flutuante (pílula de 58px) fixo na base, no lugar da barra inferior.

### 6.4 Execução do exercício (`06-exercicio.png`)
- Topo: botão fechar, nome do treino, "Treino ativo" e anel pequeno com o progresso (1/5).
- Nome do exercício enorme, com a miniatura da imagem do exercício ao lado (use a imagem real; o "IMG" do desenho é só espaço reservado).
- Barras de progresso das séries e linha "Série 1 de 4 · Meta · Recorde".
- **Carga e repetições com botões − e +** grandes e número central em fonte de título. Mantenha o campo editável por digitação.
- Campo de anotação opcional.
- Botão "Concluir série" em pílula de 60px.
- Card de descanso com anel de contagem regressiva e botão "Pular".
- Rodapé: Voltar e Próximo.

### 6.5 Evolução (`03-evolucao.png`)
- Alternador no topo: Calendário | Recordes.
- Nome do mês grande e, à direita, o total de treinos em gradiente.
- Calendário compacto: hoje em gradiente vermelho, dias treinados destacados.
- Recordes pessoais em lista: ícone de troféu, nome do exercício, data e carga grande à direita.

### 6.6 Squads (`04-squads.png`)
- Card principal "Squad {nome}" com chip "Ao vivo".
- Duelo: dois avatares grandes frente a frente, "VS" no meio, pontos de cada um e barra comparativa.
- Código do squad em destaque.
- Dois botões: "Acordar {parceiro(a)}" (principal) e "Chamar o bando" (secundário, só borda).
- Feed em linha do tempo vertical (ponto vermelho + linha cinza).

## 7. Etapa 4 — Funções novas (uma por vez, sem mudar o banco)

Em ordem de prioridade:

1. **Descanso automático** entre séries: contagem regressiva (padrão 60 s), vibração ao terminar (`navigator.vibrate`) e botão "Pular".
2. **Faixa da semana** na tela inicial, alimentada pelos treinos reais dos últimos 7 dias.
3. **Cronômetro do treino** e resumo final com volume total e recordes batidos (aproveite `WorkoutSummaryView.jsx`).
4. **Atualização em tempo real** do feed e do ranking do squad (Supabase Realtime).
5. **Gráfico de carga por exercício** na aba Evolução.
6. **Cache offline do treino do dia** (Service Worker).
7. **Aviso de "nova versão disponível"** quando o Service Worker atualizar.
8. **Lembrete push** no dia de treino (o Service Worker já tem suporte; falta agendar).

Se alguma exigir tabela ou coluna nova, pare e descreva o SQL antes de executar.

## 8. Etapa 5 — Segurança (somente com aprovação explícita)

Problema atual:
- O login consulta a tabela direto do navegador comparando `password` em texto puro.
- As políticas RLS usam `USING (true)` para `anon`: quem tiver a chave pública (visível no navegador) lê e altera todas as tabelas, inclusive as senhas.
- Para um app só do casal o risco é baixo enquanto o endereço não circular, mas não está resolvido.

Plano. Pare e peça aprovação entre cada passo:
1. Fazer backup (exportar as tabelas) e testar num projeto Supabase separado.
2. Criar os dois usuários no Supabase Auth (e-mail e senha) e ligar cada um ao registro em `gym_students`.
3. Trocar o login em `Login.jsx` para `supabase.auth.signInWithPassword`.
4. Substituir as políticas `USING (true)` por regras do tipo "só vejo e altero meus dados e os do meu squad".
5. Só depois de tudo funcionando, remover a coluna `password`.

## 9. Etapa 6 — Performance e limpeza

- Carregar as páginas sob demanda com `React.lazy` e `Suspense` (o pacote tem cerca de 1,1 MB; só o aluno precisa do painel do aluno). Conferir o tamanho com `npm run build`.
- Limpeza opcional, só se o dono pedir: telas de professor, academia, master, marketplace e cobrança não são usadas pelo casal e podem ser escondidas das rotas ou removidas. A pasta `skills/` e os `.md` de auditoria não fazem parte do app.

## 10. Testes manuais depois de cada etapa

1. No celular, fechar e abrir o app duas vezes (para o Service Worker atualizar).
2. Fazer um treino completo: iniciar, registrar série (carga e repetições), descanso, finalizar.
3. Conferir: série no histórico, pontos no ranking do squad, contador da semana correto (inclusive treinando depois das 21h).
4. Cortar a internet no meio de uma série: o app deve mostrar erro e não avançar.
5. Em tela pequena (360 px), nada fica atrás da barra inferior.
6. Conferir o contraste do texto apagado e dos chips.

## 11. Critério de pronto

- `npm run build` passa sem erro.
- Todas as telas seguem as imagens de `docs/design/`, nas cores preto, vermelho e branco.
- O fluxo completo da seção 10 funciona no celular.
- Nenhuma mudança no banco foi feita sem aprovação.

**Limitações da revisão:** o código foi validado só com `vite build`; não foi testado com o Supabase real nem no celular. As telas novas existem como desenho e ainda não foram implementadas.
