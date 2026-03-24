# orgabuddy — personal brain organizer

App de organização pessoal para captura e priorização automática de ideias e tarefas, com classificação por IA.

## O que é isto

Single-user web app (Hugo) que permite capturar pensamentos em linguagem natural. A IA classifica automaticamente cada entrada por projeto, define prioridade e apresenta o foco do dia sem trabalho manual.

## Projetos/áreas

- **arroz** — Associação Arroz (gestão, reuniões, burocracia, membros, financiamentos, candidaturas)
- **mystic** — Mystic Fyah sound system (ensaios, equipamento, bookings, logística do sound system)
- **estudio** — Projeto de estúdio/produção musical (composição, gravações, mixagem, colaborações musicais)
- **subciety** — Subciety (gestão, parcerias, eventos próprios, comunicação)
- **vida** — Vida pessoal (saúde, finanças pessoais, família, amigos, casa, lazer)

Uma tarefa pode pertencer a múltiplos projetos se genuinamente cruzar áreas (ex: equipamento que serve o Mystic e o Estúdio).

## Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Node.js + Express (API simples)
- **DB:** SQLite via better-sqlite3 (local, sem setup)
- **IA:** Anthropic SDK — `claude-sonnet-4-20250514` para classificação e priorização
- **State:** Zustand

## Estrutura de diretórios

```
orgabuddy/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── CaptureBar.tsx      # input de linguagem natural
│   │   ├── TaskList.tsx        # lista ordenada por prioridade
│   │   ├── TaskCard.tsx        # card individual com tags e raciocínio
│   │   ├── ProjectSidebar.tsx  # contadores por projeto + filtros
│   │   └── FocusView.tsx       # vista principal do dia
│   ├── store/
│   │   └── tasks.ts            # zustand store
│   ├── hooks/
│   │   └── useClassify.ts      # hook para chamar a API de classificação
│   └── types.ts
├── server/
│   ├── index.ts                # Express server
│   ├── routes/
│   │   ├── tasks.ts            # CRUD de tarefas
│   │   └── classify.ts         # endpoint de classificação via Anthropic
│   └── db.ts                   # setup SQLite
└── .env                        # ANTHROPIC_API_KEY (nunca commitar)
```

## Comandos

```bash
npm install          # instalar dependências
npm run dev          # Vite frontend (porta 5173) + servidor backend em paralelo
npm run server       # só o backend (porta 3001)
npm run build        # build de produção
npm run typecheck    # verificar tipos TypeScript
```

## Schema da base de dados (SQLite)

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  projects TEXT NOT NULL,      -- JSON array: ["arroz", "eventos"]
  priority TEXT NOT NULL,      -- "alta" | "média" | "baixa"
  reason TEXT,                 -- raciocínio da IA (1 frase)
  type TEXT DEFAULT 'tarefa',  -- "tarefa" | "ideia"
  done INTEGER DEFAULT 0,      -- 0 | 1
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## Classificação por IA

O endpoint `POST /api/classify` recebe `{ text: string }` e devolve:

```json
{
  "text": "versão limpa da tarefa (imperativo, máx 80 chars)",
  "projects": ["arroz", "eventos"],
  "priority": "alta",
  "reason": "tem deadline próxima e bloqueia o booking do venue",
  "type": "tarefa"
}
```

Regras de prioridade:
- **alta** — deadline próxima, bloqueia outras coisas, ou é urgente
- **média** — importante mas não urgente
- **baixa** — quando houver tempo

## Design e estética

Inspirado no Notion — mas mais simples e focado. Luz, espaço generoso, tipografia que respira.

- **Fundo:** branco (#ffffff) com superfícies ligeiramente cinzentas (#f7f7f5)
- **Tipografia:** Inter. Títulos de página 22px/600, labels de secção 11px uppercase/500 com letter-spacing, texto de tarefa 13.5px/400
- **Sidebar esquerda** (220px): fundo ligeiramente diferente do main, sem bordas pesadas. Itens com hover subtil. Logo no topo com ícone pequeno
- **Sem cards com bordas pesadas** — tarefas são linhas simples com hover state de fundo. Só o input de captura tem borda visível
- **Tags de projeto** estilo Notion: fundo pastel suave + texto escuro da mesma família, border-radius 3px (não pills)
- **Agrupamento por prioridade:** "urgente" / "esta semana" / "quando houver tempo" — com pip colorido e label pequena
- **Cores de projeto:**
  - arroz → azul (#dbeafe bg / #1e40af text)
  - mystic → verde escuro (#d1fae5 bg / #065f46 text)
  - estudio → roxo (#ede9fe bg / #5b21b6 text)
  - subciety → laranja (#ffedd5 bg / #9a3412 text)
  - vida → rosa suave (#fce7f3 bg / #9d174d text)
- **Sem dark mode na v1** — focar em light mode perfeito
- Input de captura: fundo cinzento subtil, placeholder "o que tens na cabeça?", hint "↵ capturar" à direita
- Tarefas do Gmail: ícone de envelope pequeno + "via gmail" discreto abaixo do texto

## Comportamento da UI

- A vista principal mostra as tarefas ordenadas por prioridade (alta → média → baixa)
- Clicar num card expande o raciocínio da IA
- Filtros por projeto e por "só urgentes"
- Tarefas marcadas como feitas ficam visíveis mas riscadas, e somem após 24h
- Sem paginação — scroll simples

## Variáveis de ambiente

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

## Integração Gmail

O orgabuddy liga ao Gmail via OAuth 2.0 para detetar emails que impliquem tarefas e criá-las automaticamente.

### Setup OAuth

1. Criar projeto em [Google Cloud Console](https://console.cloud.google.com)
2. Ativar a **Gmail API**
3. Criar credenciais OAuth 2.0 (tipo: "Desktop app")
4. Guardar `client_id` e `client_secret` no `.env`
5. Na primeira execução, o servidor abre um browser para autenticação — o token fica guardado em `gmail_token.json` (nunca commitar)

Variáveis de ambiente adicionais:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

### Dependências a instalar

```bash
npm install googleapis
```

### Comportamento

- Polling automático a cada **15 minutos** (configurável)
- Lê apenas emails **não lidos** da caixa de entrada
- Após processar, marca o email com a label `orgabuddy/processed` (cria a label se não existir) — nunca apaga nem marca como lido
- Guarda o `historyId` do Gmail para não reprocessar emails já vistos

### Lógica de deteção por IA

O endpoint `POST /api/gmail/sync` faz o seguinte para cada email não processado:

1. Extrai: remetente, assunto, e primeiros 500 chars do corpo
2. Envia para o Claude com este contexto:

```
És um assistente pessoal. Analisa este email e decide se implica uma tarefa concreta.

Remetente: {from}
Assunto: {subject}
Corpo: {snippet}

Projetos do utilizador:
- arroz: Associação Arroz
- mystic: Mystic Fyah sound system
- estudio: Estúdio / produção musical
- subciety: Subciety
- vida: Vida pessoal (faturas, saúde, casa, etc.)

Se este email implicar uma ação concreta, devolve JSON:
{
  "is_task": true,
  "text": "descrição clara da tarefa (imperativo, máx 80 chars)",
  "projects": ["vida"],
  "priority": "alta"|"média"|"baixa",
  "reason": "frase curta explicando porquê",
  "source_email_id": "{email_id}"
}

Se não implicar nenhuma ação, devolve: { "is_task": false }
```

3. Se `is_task: true`, cria a tarefa na DB com `source: "gmail"` e `source_email_id`

### Schema adicional na DB

```sql
ALTER TABLE tasks ADD COLUMN source TEXT DEFAULT 'manual'; -- "manual" | "gmail"
ALTER TABLE tasks ADD COLUMN source_email_id TEXT;          -- Gmail message ID

CREATE TABLE gmail_state (
  id INTEGER PRIMARY KEY,
  history_id TEXT,               -- último historyId processado
  last_sync TEXT                 -- timestamp da última sincronização
);
```

### UI — indicador de origem

- Tarefas vindas do Gmail mostram um ícone de email discreto no card
- Clicar no ícone abre o email original no Gmail (`https://mail.google.com/mail/u/0/#inbox/{message_id}`)
- Na sidebar, mostrar "última sincronização: há X min" e um botão de sync manual

### Ficheiros a criar

```
server/
├── gmail/
│   ├── auth.ts        # fluxo OAuth, refresh de tokens
│   ├── sync.ts        # polling, leitura de emails, deteção de tarefas
│   └── labels.ts      # gestão da label orgabuddy/processed
```

### Notas de segurança

- Scope mínimo: `https://www.googleapis.com/auth/gmail.modify` (para aplicar labels)
- `gmail_token.json` no `.gitignore`
- Nunca logar o conteúdo dos emails em produção

## Notas importantes

- Nunca commitar `.env` nem a base de dados `orgabuddy.db`
- O modelo a usar é sempre `claude-sonnet-4-20250514`
- A classificação deve ser feita no backend (server-side) para não expor a API key
- Prioridade de UX: zero fricção na captura — o input deve estar sempre visível e em foco
- Não há autenticação (app local, single user)
