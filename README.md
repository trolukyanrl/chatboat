# 🏭 NRL AI Internal Assistant

AI-powered multi-department internal chatbot with RAG-based knowledge retrieval for Numaligarh Refinery Limited.

---

## Architecture

```
Employee Browser
      │
      ▼
React Frontend (port 5173)
      │
      ▼
Node.js + Express API (port 3001)
      │
  ┌───┴──────────────┐
  ▼                  ▼
RAG Engine       Document Upload
  │
  ├── ChromaDB (vector search, port 8000)
  └── LLM (OpenAI / Anthropic / Ollama)
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Docker (for ChromaDB) OR Python 3.8+ to run ChromaDB natively
- An LLM API key (OpenAI recommended to start)

### 2. Start ChromaDB (Vector Database)

**Option A – Docker (recommended):**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Option B – Python:**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

### 3. Backend Setup

```bash
cd backend
npm install

# Copy and edit environment config
cp .env.example .env
# → Edit .env: add your API key and set LLM_PROVIDER

npm run dev
# Backend runs at http://localhost:3001
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Configuration (`.env`)

| Variable        | Description                            | Default        |
|-----------------|----------------------------------------|----------------|
| `LLM_PROVIDER`  | `openai` / `anthropic` / `ollama`      | `openai`       |
| `OPENAI_API_KEY`| Your OpenAI API key                    | —              |
| `OPENAI_MODEL`  | OpenAI model name                      | `gpt-4o-mini`  |
| `ANTHROPIC_API_KEY` | Your Anthropic API key             | —              |
| `ANTHROPIC_MODEL` | Claude model                         | `claude-haiku-4-5-20251001` |
| `OLLAMA_BASE_URL` | Ollama server URL (local LLM)        | `http://localhost:11434` |
| `OLLAMA_MODEL`  | Ollama model (e.g. `llama3`)           | `llama3`       |
| `CHROMA_URL`    | ChromaDB server URL                    | `http://localhost:8000` |
| `PORT`          | Backend API port                       | `3001`         |

### Switching LLM Providers

Just change `LLM_PROVIDER` in `.env` and restart the backend:

```bash
# Use OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Use Claude (Anthropic)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Use local Ollama (no API key needed)
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3
```

---

## Adding Knowledge to the Assistant

### Via the UI
1. Select a department from the sidebar
2. Click **Upload Document** at the bottom of the sidebar
3. Upload a `.pdf`, `.txt`, or `.md` file
4. The document is automatically chunked and indexed

### Via API
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@policy.pdf" \
  -F "department=hr"
```

### Supported Departments
- `general` – General NRL queries
- `it` – IT helpdesk, VPN, software
- `hr` – Leave, payroll, policies
- `fire & safety` – SOPs, emergency, PPE
- `marketing` – Brand, communications

You can add any custom department name.

---

## API Reference

### Chat
```
POST /api/chat
Body: { message: string, department: string, history: Message[] }
Response: { answer: string, sources: Source[], department: string }
```

### Upload Document
```
POST /api/documents/upload
Body: FormData { file: File, department: string }
Response: { success: true, file: string, chunks: number }
```

### List Departments (with indexed documents)
```
GET /api/documents/departments
Response: { departments: [{ name, collection }] }
```

### Status Check
```
GET /api/chat/status
Response: { status: "ok", llm: { provider, model } }
```

---

## Project Structure

```
nrl-assistant/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── .env.example           # Environment config template
│   ├── routes/
│   │   ├── chat.js            # Chat API endpoints
│   │   └── documents.js       # Upload + document management
│   ├── services/
│   │   ├── llm.js             # Pluggable LLM abstraction
│   │   ├── vectorStore.js     # ChromaDB integration
│   │   └── rag.js             # RAG pipeline + prompt building
│   └── data/uploads/          # Temp upload directory
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Main chat UI
        ├── index.css           # Global styles
        ├── hooks/
        │   └── useChat.js      # Chat state + API calls
        └── components/
            ├── Sidebar.jsx     # Department nav + suggestions
            └── Message.jsx     # Chat bubble + source badges
```

---

## Future Enhancements

- [ ] **Auth** – Add Active Directory / SSO login
- [ ] **Admin Dashboard** – React admin panel for KB management + analytics
- [ ] **Ticket system** – Auto-create IT tickets for unresolved queries
- [ ] **Voice input** – Web Speech API integration
- [ ] **WhatsApp bot** – Twilio/Meta webhook integration
- [ ] **Streaming responses** – Server-sent events for real-time token streaming
- [ ] **On-premises LLM** – Self-hosted Ollama for data privacy
