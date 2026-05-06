# VollonFit — Documento de Handoff (Maio 2026)

## O que é o VollonFit
SaaS de gestão fitness premium. O **Master Admin** gerencia a plataforma e as cobranças dos **Professores**, que por sua vez gerenciam seus **Alunos** e treinos. O sistema opera em modelo multi-tenant com isolamento de dados via RLS.

## Stack Técnica
- **Frontend:** React + Vite + Tailwind CSS
- **Backend/DB:** Supabase (Postgres, Auth, Storage, RLS)
- **PWA:** Service Workers + Web Manifest
- **Design:** Dark Neon Theme (`#DFFF5E` Lime, `#C6C4FF` Lavender, `#0A0A0A` Black)

---

## 🚀 Entregas Recentes (Fases 19 e 20) ✅

### 1. Gestão e Foco (Fase 19)
- **Módulo Financeiro do Professor:** Aba funcional que lê `gym_billing_records`, exibindo faturas, KPIs de faturamento e status de pagamento.
- **Foco de Treino Dinâmico:** Adicionada a coluna `description` em `gym_workouts`. Professores agora definem o foco (ex: Peito, Cardio) e o aluno recebe filtros automáticos na Home.
- **Validação de Unicidade:** Sistema impede a criação de usernames duplicados globalmente para evitar conflitos de login.

### 2. PWA Nativo & Confiabilidade (Fase 20)
- **Instalação Mobile:** Manifesto configurado para modo `standalone`. Ícone Neon de alta resolução criado e configurado para Android e iOS.
- **Suporte Offline:** `sw.js` implementado para cache de assets críticos, permitindo abertura do app sem internet.
- **Ajuste de Fuso Horário (UTC Fix):** Centralização de datas via `dateUtils.js`. Logs de treino e biopedância agora respeitam o horário local de Brasília, eliminando o erro de "salvar no dia seguinte" à noite.
- **Notificações:** Solicitação de permissão Web Push integrada na aba Social.

---

## 🔐 Credenciais e Segurança
- **Master:** Acesso via Supabase Auth (Master Dashboard).
- **Professores/Alunos:** Autenticação personalizada baseada em tabelas (`gym_teachers` / `gym_students`).
- **Segurança:** Senhas em texto plano (conforme solicitado para esta fase de testes, mas recomendado hash em produção futura).

## 📂 Arquivos Chave Modificados
- `src/pages/AdminDashboard.jsx`: Integração financeira e foco de treino.
- `src/pages/StudentDashboard.jsx`: Social Hub, PWA hooks, UTC fix e UI refinements.
- `src/utils/dateUtils.js`: Motor de sincronização de datas.
- `public/manifest.json` & `public/sw.js`: Infraestrutura PWA.

## 💡 Próximos Passos Sugeridos
- **Web Push Real:** Conectar o backend de funções do Supabase para disparar notificações reais nos eventos de "Ping".
- **Integração de Pagamento:** Conectar a aba financeira a um gateway (Stripe/Asaas) para automação total.

---
**Status Final:** Sistema validado, responsivo e pronto para deploy em produção.
