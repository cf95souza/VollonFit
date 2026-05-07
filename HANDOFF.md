# VollonFit — Manual de Operações Final (Maio 2026) 🏆

## 📌 Status: PLATAFORMA ENTREGUE (Versão 2.5.0)
O VollonFit é agora uma plataforma SaaS robusta, 100% funcional no mobile e com engajamento ativo via Notificações Push.

## 🚀 Tecnologias e Funcionalidades entregues:
- **PWA Full Experience:** Instalação nativa, splash screen personalizada e modo standalone.
- **Sistema de Notificações "Carteiro":** Edge Function no Supabase configurada para enviar Push em background.
- **Web Push (Web-Push API):** Segurança via VAPID (Chaves configuradas no Vercel e .env).
- **Master & Admin Dashboard:** Gestão completa de faturamento, quotas, bloqueios e auditoria de alunos.
- **Inteligência Pedagógica:** Sistema de reordenação de treinos e visão de consistência de 7 dias móveis.

---

## 🧭 GUIA DE MANUTENÇÃO TÉCNICA

### 1. Banco de Dados e Segurança (Supabase) 🗄️
- **Estrutura:** O arquivo `estrutura_db.md` contém o SQL mestre. Sempre que criar um novo ambiente, rode ele primeiro.
- **RLS:** As políticas de segurança permitem acesso anônimo controlado, essencial para a experiência fluida sem login complexo do Supabase Auth.
- **Webhooks:** No Supabase, existe um Webhook configurado na tabela `gym_social_notifications` (INSERT) que chama a Edge Function `send-push`.

### 2. Notificações Push (VAPID) 🔔
- **Chaves:** Estão salvas nas Environment Variables do Vercel (`VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
- **Edge Function:** O código da função utiliza a biblioteca `web-push` para disparar as mensagens.
- **Permissão:** O aluno deve clicar em "Ativar Notificações" na aba Social (Perfil) para o sistema capturar o Token do celular.

### 3. Gestão Comercial (SaaS) 💰
- **Cálculo:** O faturamento é baseado em `R$ 30,00` por aluno ativo.
- **Master Login:** O e-mail `cf95.souza@gmail.com` tem acesso total e exclusivo ao faturamento global.
- **Bloqueio:** Se um professor for marcado como `blocked`, nem ele nem seus alunos conseguem entrar no sistema.

### 4. Dicas de Ouro para o Futuro 💡
- **Logs:** Se as notificações pararem, verifique os logs da Edge Function no dashboard do Supabase.
- **Build:** O projeto usa Vite. Para atualizar em produção, basta dar o `git push production main`.
- **Cache:** O Service Worker está configurado para atualizar os arquivos em segundo plano. Se algo não mudar, peça para o aluno fechar e abrir o app duas vezes.

---
**Data de Entrega Final:** 07 de Maio de 2026
**Responsável:** Antigravity AI — *É hora de dominar o mercado fitness!* 🚀🦾🦾
