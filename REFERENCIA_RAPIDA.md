# 🎯 Referência Rápida - Agenda

## 📅 Seu Horário de Aulas (2026.1)

### Segunda (Seg)
| Hora | Disciplina |
|------|-----------|
| 08:00-10:00 | **CB0704** - Cálculo Fundamental I |
| 10:00-12:00 | **TI0139** - Introdução à Eng. Computação |
| 14:00-18:00 | **TL0015** - Expressão Gráfica de Projetos |

### Terça (Ter)
| Hora | Disciplina |
|------|-----------|
| 08:00-10:00 | **CD0381** - Fundamentos de Física I |
| 10:00-12:00 | **CK0211** - Fundamentos de Programação |

### Quarta (Qua)
| Hora | Disciplina |
|------|-----------|
| 08:00-10:00 | **CB0704** - Cálculo Fundamental I |
| 10:00-12:00 | **CE0900** - Química Aplicada à Engenharia |

### Quinta (Qui)
| Hora | Disciplina |
|------|-----------|
| 08:00-10:00 | **CD0381** - Fundamentos de Física I |

### Sexta (Sex)
| Hora | Disciplina |
|------|-----------|
| 08:00-10:00 | **CK0211** - Fundamentos de Programação |
| 10:00-12:00 | **CE0900** - Química Aplicada à Engenharia |

## 🎓 Suas Disciplinas

| Código | Nome | Prof. | Local |
|--------|------|-------|-------|
| **CB0704** | Cálculo Fundamental I | Julio Cesar Silva Araujo | Bloco 707 Sala 13 |
| **CD0381** | Fundamentos de Física I | Jose Ramos Goncalves | Sala 14 - Bloco 707 |
| **CK0211** | Fundamentos de Programação | Wladimir Araujo Tavares | LEC3 / 726-19 |
| **CE0900** | Química Aplicada à Engenharia | Tercio de Freitas Paulo | Bloco 950 Sala 08 |
| **TL0015** | Expressão Gráfica de Projetos | Antonio Paulo de Hollanda | CT |
| **TI0139** | Introdução à Eng. de Computação | Ricardo Jardel Nunes | Bloco 707 |

## 🚀 Comandos Úteis

### Iniciar o desenvolvimento
```bash
pnpm dev
```

### Construir para produção
```bash
pnpm build
```

### Iniciar servidor de produção
```bash
pnpm start
```

### Linter
```bash
pnpm lint
```

## 🌐 URLs Úteis

| Recurso | URL |
|---------|-----|
| Aplicação Local | http://localhost:3000 |
| Supabase | supabase.com |
| Vercel | vercel.com |
| Next.js Docs | nextjs.org |

## 📱 Atalhos na Aplicação

| Funcionalidade | Local |
|---|---|
| Ver Grade Horária | Tab "Horários" |
| Criar Tarefa | Tab "Tarefas" |
| Adicionar Anotação | Tab "Anotações" |
| Ver Calendário | Tab "Calendário" |
| Gerenciar Revisões | Tab "Revisão" |
| Selecionar Disciplina | Clique nos códigos no "Início" |

## 🔧 Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

Obtém em: Supabase → Settings → API

## 📊 Estrutura de Dados

```
disciplinas (6)
├── horarios (10)
├── tarefas (0 - adicione conforme precisar)
├── anotacoes (0)
└── revisoes (0)
```

## ⚡ Stack Tecnológico

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Banco**: Supabase (PostgreSQL)
- **Datas**: date-fns + pt-BR locale
- **Deploy**: Vercel

## 💾 Fazer Backup dos Dados

Seu banco Supabase é persistente! Mas você pode fazer export:

1. Supabase → Backups (no lado esquerdo)
2. Click em "Backup now"
3. Faça download dos backups

## 🐛 Checklist de Setup

- [ ] Projeto criado no Supabase
- [ ] `.env.local` configurado com URL e chave
- [ ] Scripts SQL executados (3 scripts)
- [ ] `pnpm install` executado
- [ ] `pnpm dev` rodando sem erros
- [ ] Disciplinas carregando na página
- [ ] Horários visíveis na grade

## 📞 Em Caso de Erro

1. Verifique o console (F12 no navegador)
2. Verifique os logs do Supabase (SQL Editor → Logs)
3. Confirme `.env.local` preenchido corretamente
4. Tente `pnpm install` novamente

---

**Bom estudo!** 📚✨
