# Documentação Técnica - VollonFit (CasalGym) 🏆

O VollonFit é uma plataforma SaaS (Software as a Service) de alta performance projetada para personal trainers e academias que buscam modernizar a gestão de treinos e aumentar o engajamento dos alunos através de uma experiência social e gamificada.

## 🎯 Escopo do Projeto
A plataforma resolve a lacuna de comunicação entre professor e aluno, fornecendo ferramentas de alta precisão para prescrição de exercícios e um aplicativo PWA intuitivo para o aluno registrar sua evolução em tempo real.

### Arquitetura de Acesso:
- **Master Admin:** Gestão financeira global e controle de professores (Tenants).
- **Professor (Tenant):** Gestão técnica e comercial de sua base de alunos.
- **Aluno (User):** Execução de treinos, biopedância e interação social.

### Principais Funcionalidades:
- **Painel Master:** Gestão global de faturamento SaaS e controle de parceiros.
- **Painel do Professor:** Gestão técnica e comercial de alunos.
- **PWA do Aluno:** Registro de evolução e execução de treinos.
- **Squads & CasalGym:** Hub social para treinar em dupla ou em grupos (Squads), com "Batalha de Carga" e notificações motivacionais coletivas.

### 🚀 Evolução GymRats (Social Hub 2.0)
Inspirado no conceito de "Painel de Responsabilidade", esta evolução foca em:
- **Feed de Squad:** Postagens de check-in com fotos, comentários e marcação de grupo muscular.
- **Desafios Customizados:** Criação de competições internas no squad (ex: "Quem treina mais no mês").
- **Leaderboard Semanal:** Ranking dinâmico baseado em frequência e volume de carga.
- **Responsabilidade Social:** Notificações automáticas para membros que estão há mais de 3 dias sem treinar ("Cobrança amigável").

### 📋 Guia de Participação (Workflow)
1. **Grupos e Desafios**: Criação de espaços coletivos onde os desafios ditam o ritmo.
2. **Sistema de Pontos**: Gamificação baseada em constância, intensidade e tempo.
3. **Check-in Fluido**: Registro manual no PWA ou automático (simulado/integrado).
4. **Rankings Dinâmicos**: Acompanhamento em tempo real da liderança do Squad.

## 🎨 Design System (`ui-design-system`)
O design segue uma estética **Dark Neon / Cyberpunk Premium**, otimizada para ambientes de academia com baixa luminosidade e alta necessidade de contraste.

- **Paleta de Cores**:
  - `Primary`: `#DFFF5E` (Lime Neon) - Usado para CTAs, estados ativos e progresso.
  - `Secondary`: `#000000` (Deep Black) - Base do layout, garantindo profundidade.
  - `Accent`: `#C6C4FF` (Lavender) - Usado para informações secundárias e badges.
- **Tipografia**: Inter (Sans-serif) para legibilidade técnica.
- **Componentes**: Glassmorphism, bordas arredondadas (`4xl`), e micro-animações suaves.

## 🛠️ Stack Tecnológica
- **Frontend**: React 19 + Vite (Rápido, Moderno e Modular).
- **Estilização**: Tailwind CSS + Custom Vanilla CSS.
- **Backend-as-a-Service**: Supabase (PostgreSQL, Realtime, Edge Functions).
- **Infraestrutura**: Vercel (Deploy contínuo e PWA support).

## 🗄️ Estrutura de Dados (`estrutura_db.md`)
O banco de dados é gerido via Supabase com foco em segurança via **Row Level Security (RLS)**.
- `gym_teachers`: Dados dos professores e limites de cota.
- `gym_students`: Perfis de alunos, metas e vínculo de parceiros (Casal).
- `gym_workouts` & `gym_workout_items`: Prescrição pedagógica de treinos.
- `gym_training_logs`: Histórico de cargas e repetições reais.
- `gym_billing_records`: Implementação do Gateway de Pagamento e regras de Checkout SaaS.
- Refatoração do App para PWA, cache-first e timers resilientes em background.

### Atualizações Mais Recentes (Fase 33)
- **Redirecionamento PWA (Start URL)**: Correção da rota inicial `/` para usuários autenticados, evitando a exibição desnecessária da Landing Page e abrindo direto o painel correspondente (`/student`, `/admin` ou `/academy`).
- **Tela de Configurações Funcional e Resolução de Erros**: Correção do crash no import de `Users` em `ProfileTab.jsx` e reestruturação completa do modal de configurações (`isConfigModalOpen` no `StudentDashboard.jsx`) com formulário para atualizar dados cadastrais e botão direto de Logout. Correção definitiva do erro `400 Bad Request` no fetch de notificações sociais, decorrente do Join implícito de tabelas não relacionadas por chave estrangeira no banco; agora o sistema busca as notificações cruas com `.select('*')` e resolve os nomes de remetentes de forma dinâmica e assíncrona, eliminando erros de console e carregando os dados com total fluidez.
- **Responsividade Safe-Area / Notch**: Adaptação da barra de navegação no `LandingPage.jsx` com a variável CSS `env(safe-area-inset-top)` para empurrar o layout e os botões de ação para baixo de forma inteligente em celulares com notch/câmera dinâmica (iPhones), garantindo cliques perfeitos.
- **Integração Comercial com WhatsApp Direct (CTAs da Landing Page)**: Redirecionamento completo de todos os CTAs e cartões de planos da Landing Page diretamente para o WhatsApp de suporte comercial da empresa (`5511922928343`). As mensagens são geradas de forma totalmente contextualizada:
  - *Teste Grátis*: "Olá vim para resgatar meus 7 dias gratis do VollonFit"
  - *Assinar Agora*: "Olá vim realizar a minha assinatura do VollonFit"
  - *Planos Individuais*: A mensagem é dinamicamente estruturada incluindo o nome de cada plano clicado pelo cliente (ex: "Olá vim realizar a minha assinatura do plano Professor Basic do VollonFit", "plano Professor Premium..." ou "plano Academia Enterprise...").
- **Gestão de Planos & Cobrança SaaS (Painel Master e Painel Professor)**:
  - *Gerenciamento de Planos e Upgrade de Professor*: Implementação completa do controle e troca de planos dos professores (`Professor Basic` ou `Professor Premium`) pelo Master Admin no cadastro e edição. O card de cada professor agora exibe badges premium identificando seu plano de forma clara. Caso o professor tente usar o recurso exclusivo White Label estando no plano Basic, um modal interativo oferece a opção "Fazer Upgrade Agora", abrindo automaticamente o WhatsApp de suporte com texto de pedido de upgrade estruturado.
  - *Cálculo e Controle Dinâmico*: Substituição do valor fixo global por aluno para mensalidades. Agora, o sistema calcula a mensalidade dinamicamente baseada no plano ativo do professor (R$ 30,00/aluno no plano Basic ou R$ 45,00/aluno no plano Premium) e das Academias Enterprise (mensalidade fixa padrão R$ 899,00).
  - *Nova Tela de Configurações Master*: Reformulação total da aba de configurações do Master Admin para gerenciar as faixas de preço de todos os planos globais da plataforma de maneira centralizada via chaves do banco (`price_per_student`, `price_premium` e `price_enterprise` por upsert dinâmico).
- **Ajustes Finos de Design & Responsividade (Mobile Perfect)**:
  - *Status Dormindo Premium (Squad)*: O badge do status inativo/dormindo no `SquadTab.jsx` foi remodelado. Substituímos o emoji e a caixa cinza bruta por um badge elegante, com fundo translúcido vermelho `bg-rose-500/10`, borda suave e o ícone de lua (`Moon` da Lucide) pulsando dinamicamente, mantendo a harmonia visual.
  - *Marketplace Responsivo Verticalizado*: Modificação da vitrine de produtos no `MarketplaceTab.jsx` para empilhar itens em uma única coluna (`grid-cols-1`) em smartphones, e ajustar a proporção da imagem para `aspect-[16/10]` em formato paisagem fotográfico, resolvendo o problema de cards espremidos e texto encavalado no mobile.
  - *Descongestionamento do Header da Landing Page*: Ocultação do botão principal "Assinar Agora" do topo da tela em aparelhos celulares (`hidden sm:block`) para abrir espaço respirável para a logo da marca e o link de login, resolvendo o encavalamento dos botões no mobile. Adicionada a navegação faltante para `/login` ao clicar nos botões de checkout.
  - *Eliminação do Vão Preto no Mobile*: Otimização dos paddings da seção Hero (`pb-10 md:pb-20`) e da seção de preços (`py-10 md:py-20`) no mobile, reduzindo a distância excessiva e aproximando os cards de planos do título, o que elimina a sensação de tela vazia ou bugada.
- **IA Coach 2.0 (Motor de Análise Preditiva)**: 
  - *Carga Preditiva*: Novo algoritmo baseado na fórmula científica de 1RM de Epley para projetar a carga de trabalho ideal baseada no histórico de treino e na faixa de repetições estipulada pelo professor.
  - *Nutricional Preditiva*: Nova aba de nutrição inteligente integrada com a equação Mifflin-St Jeor, que calcula automaticamente as necessidades energéticas de TDEE, o consumo de água por quilo de peso corporal (35ml/kg) e a divisão ideal de macronutrientes (Proteínas, Carboidratos e Gorduras) a partir do perfil biológico do aluno (idade, altura, peso e objetivos).
- **GymRats & Squads (Fase 32)**: Implementação do motor de gamificação por Squads, sistema de marketplace de afiliados e remoção da funcionalidade legada de parceiro individual em favor do bando coletivo.

### Ecossistema B2B e Modelagem SaaS (Fase 31)
A aplicação evoluiu para uma plataforma SaaS completa com Múltiplos Planos de Assinatura, permitindo uma escalabilidade de faturamento:
- **Plano Basic (Professores)**: Foco na gestão de alunos (R$ 30,00 por aluno/mês). Sem personalização de marca.
- **Plano Premium (Professores)**: Desbloqueia a customização White Label (Cores e Logo) e os recursos de Nutrição e IA Coach para os alunos (R$ 45,00 por aluno/mês).
- **Plano Enterprise (Academias)**: Gestão unificada (`gym_academies`) onde um Gestor (`gym_academy_admins`) administra múltiplos Personal Trainers sob uma licença fixa mensal (R$ 899,00/mês).
- **Landing Page de Vendas SaaS**: A aplicação contará com uma página institucional de vendas (`LandingPage.jsx`) focada em conversão, exibindo as tabelas de preços, features e a proposta de valor B2B para captar Professores e Redes de Academia.

## 📲 PWA & Notificações (`responsive-design`)
O VollonFit é um **Progressive Web App** nativo:
- **Offline Ready**: Cache básico para funcionamento sem rede.
- **Web Push**: Notificações automáticas de treino do parceiro e avisos do professor.
- **Standalone**: Ícone na home do celular e remoção das barras de navegação do browser.

## 💰 Modelo de Negócio (SaaS)
- **Custo**: R$ 30,00 por aluno ativo vinculado ao professor.
- **Faturamento**: Gerado mensalmente pelo Master Admin.
- **Regra de Bloqueio**: Professores inadimplentes têm o acesso (e de seus alunos) suspenso automaticamente.

## 🧭 Guia de Manutenção
1. **Logs**: Acompanhar via Supabase Edge Functions logs.
2. **Push**: Chaves VAPID configuradas no ambiente de produção.
3. **Atualizações**: Push para `main` no GitHub dispara o deploy automático na Vercel.
4. **Cache Busting**: O sistema possui um botão de "Atualizar App" para forçar a limpeza do Service Worker e recarregar a versão mais recente, corrigindo problemas de encoding e cache persistente.

## 🚀 Visão de Escalabilidade (Roadmap 2026)
Para transformar o VollonFit em uma solução líder de mercado, o roadmap estratégico foca em três pilares:

### 1. Monetização e Finanças
- **Checkout Recorrente**: Automação total da cobrança dos professores (SaaS B2C).
- **Modelo B2B**: Venda de licenças em lote para academias físicas e estúdios.
- **Marketplace**: Monetização via afiliados para suplementos e equipamentos.

### 2. Inteligência e Retenção
- **IA Coach**: Motor de análise de dados para sugerir progressão de carga e evitar o platô do aluno.
- **Recuperador de Churn**: Automação de marketing para reconquistar alunos inativos.
- **Gamificação Avançada**: Sistema de conquistas (Achievements) para aumentar a retenção diária.

### 3. Personalização e Branding
- **White Label**: Permitir que grandes treinadores tenham "seu próprio app" dentro da estrutura VollonFit.
- **LP Generator**: Páginas de captura profissionais geradas automaticamente para cada professor.

---
*Documentação atualizada em 18/05/2026*
*Status: Fase 33 em Andamento (Redirecionamento PWA e Configurações Concluídos)*
