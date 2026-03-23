# 📋 Guia de Configuração - Agenda UFC

Bem-vindo ao seu planejador acadêmico! Este guia vai ajudá-lo a configurar o projeto em 5 minutos.

## ✅ Pré-requisitos

- Node.js 18+ instalado
- Conta Supabase (gratuita em supabase.com)
- Git (opcional, para versionamento)

## 🚀 Passo 1: Clonar/Baixar o Projeto

Se você já tem o ZIP:
```bash
unzip agenda.zip
cd agenda
```

## 🔑 Passo 2: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env.local`
2. Copie as variáveis do seu projeto Supabase:
   - Acesse seu projeto em supabase.com
   - Vá em **Settings → API**
   - Copie: **Project URL** e **anon public key**

3. Cole no seu `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## 🗄️ Passo 3: Executar Scripts SQL

1. Acesse seu projeto Supabase
2. Vá em **SQL Editor** (ícone de código `<>`)
3. Crie uma **New query** e execute cada script na ordem:

### Script 1: `001_create_tables.sql`
Copia todo o conteúdo de `/scripts/001_create_tables.sql` e cola na query do Supabase. Clica **Run**.

Este script inclui:
- ✅ Criação de todas as 5 tabelas
- ✅ Suas 6 disciplinas já inseridas
- ✅ Seus 10 horários de aula
- ✅ Tabelas vazias prontas para tarefas, anotações e revisões

### Script 2: `002_disable_rls.sql`
Copia todo o conteúdo de `/scripts/002_disable_rls.sql` e cola em uma nova query. Clica **Run**.

### Script 3: `003_add_prioridade.sql`
Copia todo o conteúdo de `/scripts/003_add_prioridade.sql` e cola em uma nova query. Clica **Run**.

✅ Pronto! Seu banco de dados está totalmente configurado com:
- 6 disciplinas do seu semestre 2026.1
- 10 horários de aulas conforme sua matrícula
- Todas as tabelas prontas para tarefas, anotações e revisões

## 📦 Passo 4: Instalar Dependências

```bash
pnpm install
```

Se você não tem pnpm instalado:
```bash
npm install -g pnpm
pnpm install
```

## 🎮 Passo 5: Rodar o Projeto

```bash
pnpm dev
```

Abra seu navegador em `http://localhost:3000`

Você deve ver a página inicial com suas 6 disciplinas carregadas!

## 🎓 Suas Disciplinas (2026.1)

| Código | Disciplina | Horários | Professor |
|--------|-----------|----------|-----------|
| CB0704 | Cálculo Fundamental I | Seg/Qua 08:00-10:00 | Julio Cesar Silva Araujo |
| CD0381 | Fundamentos de Física I | Ter/Qui 08:00-10:00 | Jose Ramos Goncalves |
| CK0211 | Fundamentos de Programação | Ter 10:00-12:00 / Sex 08:00-10:00 | Wladimir Araujo Tavares |
| CE0900 | Química Aplicada à Engenharia | Qua/Sex 10:00-12:00 | Tercio de Freitas Paulo / Idalina Maria Moreira |
| TL0015 | Fundamentos e Expressão Gráfica | Seg 14:00-18:00 | Antonio Paulo de Hollanda Cavalcante |
| TI0139 | Introdução à Engenharia de Computação | Seg 10:00-12:00 | Ricardo Jardel Nunes da Silveira |

## 🛠️ Troubleshooting

### "Erro de conexão com Supabase"
- Verifique se `.env.local` está preenchido corretamente
- Confira se as chaves estão sem espaços em branco

### "Banco de dados vazio"
- Verifique se todos os 4 scripts SQL foram executados com sucesso
- Verifique erros na aba **Logs** do Supabase

### "Porta 3000 já está em uso"
```bash
pnpm dev -- -p 3001
```

## 📱 Recursos Principais

### 1. **Início**
Dashboard com próximos eventos e acesso rápido às disciplinas.

### 2. **Calendário**
Visualize sua agenda por data com todas as tarefas e revisões planejadas.

### 3. **Revisão**
Crie revisões para suas tarefas, marque progresso e organize seu estudo.

### 4. **Horários**
Grade visual interativa mostrando seus horários de aula durante a semana.

### 5. **Tarefas**
Crie, edite e marque tarefas como completas, com suporte a prioridades.

### 6. **Anotações**
Tome notas por disciplina e data para cada aula.

## 🚀 Deploy na Vercel

1. Faça push do seu projeto para GitHub
2. Conecte seu repositório em vercel.com
3. Adicione as variáveis de ambiente em **Settings → Environment Variables**
4. Deploy automático a cada push!

## 💡 Dicas

- Use cores diferentes para cada disciplina (clique na disciplina para selecionar)
- Crie tarefas com prioridades altas para se manter organizado
- Revise regularmente usando o sistema de revisão
- Adicione notas importantes em cada aula

## 📞 Suporte

Se tiver dúvidas:
- Verifique a documentação em README.md
- Confira os logs do navegador (F12 → Console)
- Verifique os logs do Supabase em SQL Editor

---

Bom estudo! 📚✨
