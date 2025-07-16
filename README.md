# ABConvert Agent

A Retrieval-Augmented-Generation (RAG) CLI & Web service for ABConvert’s GitBook documentation.

Free to use: https://knowledge-retrieval-agent.vercel.app/

Document of POC: https://hackmd.io/@Lj0D3vwhTzeO2bpuXn3dgQ/Wen

---

## Features

- **Fetch & Crawl** GitBook pages via REST API + Cheerio crawler  
- **Chunk** text into semantically coherent pieces  
- **Embed** chunks using OpenAI Embeddings (`text-embedding-3-small` or `text-embedding-ada-002`)  
- **Store & Search** embeddings in Supabase using `pgvector`  
- **Generate Answers** with GPT-4 based on retrieved context  
- **Automated Refresh** via Cron (Vercel/GitHub Actions) to keep docs up-to-date  
- **Web UI & CLI** interfaces:  
  - `/api/ask` endpoint and static `public/index.html`  
  - `askAgent.js` CLI tool  

## Prerequisites

- Node.js v16+ & npm  
- OpenAI API Key  
- Supabase project with:  
  - `vector` extension enabled  
  - `documents` table and `match_documents` function  
- GitBook API Token & Space UID  
- (Optional) `REFRESH_SECRET` for secure `/api/refresh`

## Project Structure

```text
abconvert-agent/
├── .env                      # Environment variables
├── package.json              # Dependencies & npm scripts
├── vercel.json               # Vercel build & routing config
├── fetchAndCrawl.js          # GitBook REST + Cheerio crawler → docs.json
├── chunkText.js              # Text splitting utility
├── embedAndUpload.js         # docs.json → Supabase upload
├── askAgent.js               # CLI: prompt → RAG → GPT-4
├── api/                      # Vercel Functions
│   ├── ask.js                # /api/ask handler
│   └── refresh.js            # /api/refresh: fetch→embed pipeline
├── lib/                      # Shared helpers
│   ├── embedding.js          # OpenAI embedding wrapper
│   └── supabaseClient.js     # Supabase client init
└── public/                   # Static Web UI
    ├── index.html            # Terminal-like UI
    ├── main.js               # Fetch /api/ask and render answer
    └── style.css             # (optional) styling
```

---

## Installation
### Clone the repository
```bash
git clone https://github.com/your-org/abconvert-agent.git
cd abconvert-agent
npm install
```

### Configuration
Create a `.env` with:
```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GITBOOK_API_TOKEN=gitbook_...
GITBOOK_SPACE_UID=<space-uuid>
REFRESH_SECRET=<random-secret>
```

Ensure .gitignore includes:
```bash
node_modules/
.env
docs.json
```

---
## Supabase Setup
In the Supabase SQL editor, run:

```sql
-- enable pgvector
create extension if not exists vector;

-- Drop the bad overload that expects text[]
DROP FUNCTION IF EXISTS public.match_documents(
  integer,
  double precision,
  text[]
);

-- your documents table
-- (Re)create the only overload you want
create or replace function public.match_documents(
  match_count     int,
  match_threshold float,
  query_embedding vector(1536)
)
returns table (
  id bigint,
  content text,
  source text,
  similarity float
)
language sql
as $$
  select
    id,
    content,
    source,
    1 - (embedding <#> query_embedding) as similarity
  from documents
  where embedding <#> query_embedding < match_threshold
  order by embedding <#> query_embedding
  limit match_count;
$$;
```

Ensure Row Level Security (RLS) is disabled or that your service_role key has INSERT/SELECT permissions.

--- 

## Usage
### CLI
```bash
# 1) Crawl & fetch docs
npm run fetch
# 2) Embed & upload to Supabase
npm run embed
# 3) Ask via CLI
node askAgent.js
```

### Web UI
```bash
# Start server locally
npm run dev    # (uses vercel dev)
# or
npm start      # runs askAgent.js Express server
```

---

## Deployment
### Vercel
- Ensure vercel.json is committed
- Push to GitHub; Vercel will:
  - `npm install`
  - `npm run build`(fetch + embed)
  - Deploy `/api` functions and `public/ UI`

## Automated Refresh
### Vercel Cron
1. Install Cron Jobs integration
2. Create a job hitting `https://<your-deployment>.vercel.app/api/refresh`
3. Method: POST
4. Header: x-refresh-secret: <REFRESH_SECRET>
5. Schedule: 0 0 * * 0 (weekly)

### GitHub Actions (optional)
See `.github/workflows/refresh.yml `for scheduled fetch/embed + push triggers.

---

Now your ABConvert RAG service is ready, fast, and always up-to-date!

