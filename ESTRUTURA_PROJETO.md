# 🏗️ Estrutura do Projeto Agenda

```
agenda/
├── 📄 app/
│   ├── page.tsx                 # Página principal com todas as abas
│   ├── layout.tsx               # Layout raiz + metadados
│   └── globals.css              # Estilos globais (Tailwind)
│
├── 🎨 components/
│   ├── calendario-integrado.tsx # Componente calendário
│   ├── sistema-revisao.tsx      # Gerenciador de revisões
│   ├── lista-tarefas.tsx        # Interface de tarefas
│   ├── grade-horarios.tsx       # Grade visual de horários
│   ├── anotacoes-aula.tsx       # Anotações por disciplina
│   ├── theme-provider.tsx       # Provedor de tema
│   └── 🎭 ui/
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── toggle.tsx
│       ├── tooltip.tsx
│       └── ... (mais 30+ componentes)
│
├── 📚 lib/
│   ├── types.ts                 # Interfaces TypeScript
│   ├── utils.ts                 # Funções utilitárias (cn)
│   └── 🔐 supabase/
│       ├── client.ts            # Cliente Supabase (browser)
│       └── server.ts            # Cliente Supabase (server)
│
├── 📊 scripts/
│   ├── 001_create_tables.sql    # Criar tabelas + inserir disciplinas/horários
│   ├── 002_disable_rls.sql      # Desabilitar RLS (Row Level Security)
│   └── 003_add_prioridade.sql   # Adicionar coluna prioridade
│
├── 📖 Documentation/
│   ├── README.md                # Documentação principal
│   ├── GUIA_SETUP.md           # Guia passo a passo
│   ├── REFERENCIA_RAPIDA.md    # Atalhos e referência
│   └── ESTRUTURA_PROJETO.md    # Este arquivo
│
├── 📝 Configuration/
│   ├── package.json             # Dependências do projeto
│   ├── tsconfig.json            # Configuração TypeScript
│   ├── next.config.mjs          # Configuração Next.js
│   ├── tailwind.config.ts       # Configuração Tailwind
│   ├── postcss.config.mjs       # Configuração PostCSS
│   ├── components.json          # Configuração shadcn/ui
│   ├── .env.local               # Variáveis de ambiente (criar)
│   └── .gitignore               # Arquivos a ignorar no git
│
└── 📦 node_modules/             # Dependências instaladas
```

## 📄 Arquivos Principais Explicados

### `app/page.tsx` - Página Principal
A página raiz que renderiza:
- **Header** com título e badges
- **Tabs** para navegar entre seções
- **Dashboard** na aba "Início"
- **Componentes** para calendário, revisão, horários, tarefas, anotações

### `components/calendario-integrado.tsx`
Exibe um calendário interativo com:
- Navegação entre meses
- Eventos (tarefas e revisões) destacados
- Detalhes do dia ao clicar

### `components/sistema-revisao.tsx`
Interface para gerenciar revisões:
- Criar novas revisões de tarefas
- Filtrar por status
- Atualizar status e tempo estimado

### `components/lista-tarefas.tsx`
Gerenciador de tarefas com:
- Criar tarefas com prioridade
- Data de entrega
- Marcar como concluída
- Filtro por disciplina

### `components/grade-horarios.tsx`
Grade visual mostrando:
- Semana (segunda a sexta)
- Horários (linhas)
- Disciplinas (blocos coloridos)

### `lib/types.ts` - Tipos TypeScript
Define as interfaces:
```typescript
interface Disciplina {
  id: string
  codigo: string
  nome: string
  cor: string
  local: string
  professor: string
}

interface Horario {
  id: string
  disciplina_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

interface Tarefa {
  id: string
  disciplina_id: string
  titulo: string
  descricao: string | null
  data_entrega: string | null
  prioridade: 'baixa' | 'media' | 'alta'
  concluida: boolean
  created_at: string
}

interface Anotacao {
  id: string
  disciplina_id: string
  data: string
  conteudo: string
  created_at: string
}

interface Revisao {
  id: string
  tarefas_id: string
  data_revisao: string
  status: 'nao_iniciada' | 'em_progresso' | 'concluida'
  tempo_estimado: number | null
  created_at: string
}
```

### `lib/supabase/client.ts`
Cliente Supabase para o navegador:
- Conecta ao banco PostgreSQL
- Realiza queries do lado cliente
- Gerencia cache

### `lib/supabase/server.ts`
Cliente Supabase para o servidor (Next.js):
- Operações server-side
- Mais seguro que client

## 🗄️ Banco de Dados (Supabase)

### Tabela: `disciplinas`
Armazena as disciplinas do semestre
```
id (UUID) - PK
codigo (TEXT) - Código da disciplina (CB0704, etc)
nome (TEXT) - Nome completo
professor (TEXT) - Nome do professor
local (TEXT) - Sala/prédio
cor (TEXT) - Cor hex para exibição (#FF6B6B)
```

### Tabela: `horarios`
Horários das aulas
```
id (UUID) - PK
disciplina_id (UUID) - FK para disciplinas
dia_semana (INTEGER) - 0=Dom, 1=Seg, 2=Ter, ... 6=Sab
hora_inicio (TEXT) - Ex: "08:00"
hora_fim (TEXT) - Ex: "10:00"
```

### Tabela: `tarefas`
Tarefas e trabalhos
```
id (UUID) - PK
disciplina_id (UUID) - FK para disciplinas
titulo (TEXT) - Título da tarefa
descricao (TEXT) - Descrição opcional
data_entrega (DATE) - Data limite
prioridade (TEXT) - 'baixa', 'media', 'alta'
concluida (BOOLEAN) - Feita ou não
created_at (TIMESTAMP) - Quando foi criada
```

### Tabela: `anotacoes`
Anotações de aulas
```
id (UUID) - PK
disciplina_id (UUID) - FK para disciplinas
data (DATE) - Data da aula
conteudo (TEXT) - Conteúdo das anotações
created_at (TIMESTAMP) - Quando foi criada
```

### Tabela: `revisoes`
Sessões de revisão
```
id (UUID) - PK
tarefas_id (UUID) - FK para tarefas
data_revisao (DATE) - Data da revisão
status (TEXT) - 'nao_iniciada', 'em_progresso', 'concluida'
tempo_estimado (INTEGER) - Minutos
created_at (TIMESTAMP) - Quando foi criada
```

## 🎨 Tecnologias Utilizadas

### Frontend
- **Next.js 16** - Framework React com SSR/SSG
- **React 19** - Biblioteca UI
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Componentes acessíveis

### Backend
- **Supabase** - PostgreSQL + Auth
- **date-fns** - Manipulação de datas

### Ferramentas
- **pnpm** - Package manager rápido
- **Vercel** - Deployment

## 🔄 Fluxo de Dados

```
Usuario interage com UI
        ↓
    React Component
        ↓
    Supabase Client
        ↓
    PostgreSQL (Supabase)
        ↓
    JSON Response
        ↓
    Estado React (useState)
        ↓
    Re-render do componente
```

## 🚀 Como Adicionar Novos Recursos

### 1. Adicionar Nova Tabela
1. Criar migration em `/scripts/00X_nova_tabela.sql`
2. Executar no Supabase

### 2. Criar Novo Componente
1. Criar arquivo em `/components/novo-componente.tsx`
2. Importar em `app/page.tsx`
3. Adicionar nova aba se necessário

### 3. Adicionar Nova Funcionalidade
1. Atualizar `lib/types.ts` com novas interfaces
2. Criar componente em `/components/`
3. Integrar na página principal
4. Testar localmente

## 📊 Dependências Principais

```json
{
  "next": "16.2.0",
  "react": "19.2.4",
  "typescript": "5.7.3",
  "tailwindcss": "^4.2.0",
  "date-fns": "^4.1.0",
  "@supabase/ssr": "^0.9.0"
}
```

## ✅ Checklist de Desenvolvimento

- [ ] `.env.local` configurado
- [ ] Supabase conectado
- [ ] Scripts SQL executados
- [ ] `pnpm dev` rodando
- [ ] Componentes renderizando
- [ ] Dados carregando do BD
- [ ] Todas as abas funcionando
- [ ] Responsivo em mobile

---

**Estrutura completa e organizada para crescer!** 🚀
