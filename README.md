# Agenda - Seu Planejador Acadêmico

Um aplicativo web moderno para gerenciar sua agenda acadêmica, incluindo aulas, tarefas, anotações e sistema de revisão integrado.

**Configurado para:** Engenharia de Computação - UFC (Período 2026.1) | Leonardo Monteiro Souza - Matrícula 603973

## Recursos

✨ **Funcionalidades principais:**
- 📅 Calendário integrado com visualização de eventos
- 📚 Grade de horários interativa
- ✅ Sistema de tarefas com prioridades
- 📝 Anotações por disciplina
- 🔄 Sistema inteligente de revisão
- 🎨 Interface responsiva e intuitiva

## Stack Tecnológico

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI:** Tailwind CSS v4, shadcn/ui
- **Banco de Dados:** Supabase (PostgreSQL)
- **Estado:** React Hooks + Supabase Client
- **Datas:** date-fns com localização pt-BR

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

Obtém essas informações no seu projeto Supabase em Settings → API.

### 2. Banco de Dados

Os scripts SQL estão em `/scripts/`:

1. `001_create_tables.sql` - Cria todas as tabelas (disciplinas, horários, tarefas, anotações, revisões)
2. `002_disable_rls.sql` - Desabilita RLS para desenvolvimento
3. `003_add_prioridade.sql` - Adiciona coluna de prioridade

Execute estes scripts no seu banco Supabase via SQL Editor na sequência numérica.

### 3. Instalação de Dependências

```bash
pnpm install
```

### 4. Executar Localmente

```bash
pnpm dev
```

Acesse `http://localhost:3000`

## Estrutura do Projeto

```
/
├── app/
│   ├── page.tsx                 # Página principal
│   ├── layout.tsx               # Layout raiz
│   └── globals.css              # Estilos globais
├── components/
│   ├── calendario-integrado.tsx # Componente de calendário
│   ├── sistema-revisao.tsx      # Sistema de revisão
│   ├── lista-tarefas.tsx        # Gerenciador de tarefas
│   ├── grade-horarios.tsx       # Grade de horários
│   ├── anotacoes-aula.tsx       # Anotações
│   └── ui/                      # Componentes shadcn/ui
├── lib/
│   ├── types.ts                 # Tipos TypeScript
│   ├── utils.ts                 # Utilitários
│   └── supabase/
│       ├── client.ts            # Cliente Supabase (browser)
│       └── server.ts            # Cliente Supabase (server)
└── scripts/
    ├── 001_create_tables.sql    # Criar tabelas
    ├── 002_disable_rls.sql      # Configurar RLS
    └── 003_add_prioridade.sql   # Adicionar prioridade
```

## Modelo de Dados

### Tabelas

#### `disciplinas`
- id (UUID)
- codigo (TEXT)
- nome (TEXT)
- professor (TEXT)
- local (TEXT)
- cor (TEXT)

#### `horarios`
- id (UUID)
- disciplina_id (UUID FK)
- dia_semana (INTEGER 0-6)
- hora_inicio (TEXT)
- hora_fim (TEXT)

#### `tarefas`
- id (UUID)
- disciplina_id (UUID FK)
- titulo (TEXT)
- descricao (TEXT)
- data_entrega (DATE)
- prioridade (TEXT: 'baixa', 'media', 'alta')
- concluida (BOOLEAN)
- created_at (TIMESTAMP)

#### `anotacoes`
- id (UUID)
- disciplina_id (UUID FK)
- data (DATE)
- conteudo (TEXT)
- created_at (TIMESTAMP)

#### `revisoes`
- id (UUID)
- tarefas_id (UUID FK)
- data_revisao (DATE)
- status (TEXT: 'nao_iniciada', 'em_progresso', 'concluida')
- tempo_estimado (INTEGER)
- created_at (TIMESTAMP)

## Componentes

### CalendarioIntegrado
Exibe um calendário com eventos (tarefas e revisões) do dia selecionado. Permite navegar entre datas e visualizar próximos eventos.

### SistemaRevisao
Gerencia revisões com:
- Criação de novas revisões ligadas a tarefas
- Filtro por status
- Atualização de status
- Estimativa de tempo

### ListaTarefas
Interface para criar e gerenciar tarefas com:
- Seleção de disciplina
- Definição de prioridade
- Data de entrega
- Status de conclusão

### GradeHorarios
Exibe grade visual dos horários das aulas ao longo da semana.

### AnotacoesAula
Permite criar e visualizar anotações por disciplina e data.

## Deployment

### Vercel

```bash
git push
```

Vercel fará o deploy automaticamente se estiver conectado ao repositório.

As variáveis de ambiente devem ser adicionadas em Settings → Environment Variables no painel Vercel.

## Contribuindo

Sugestões de melhorias:
- [ ] Adicionar autenticação de usuários
- [ ] Integrar com Google Calendar
- [ ] Notificações push para tarefas
- [ ] Tema dark mode aprimorado
- [ ] Exportar calendário em PDF

## Licença

MIT

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

Desenvolvido com ❤️ usando Next.js e Supabase
