# ABConvert Knowledge Retrieval Agent

A **CLI-based** agent to answer questions about ABConvert by retrieving relevant documentation from a GitBook knowledge base and leveraging OpenAI GPT-4.

---

## Features

- **Crawl** GitBook pages to extract raw text  
- **Chunk** text into semantically coherent pieces  
- **Embed** chunks using OpenAI’s `text-embedding-ada-002` model  
- **Store & Search** embeddings in Supabase with pgvector  
- **Generate Answers** with GPT-4 based on retrieved context  
- **CLI Interface** via `askAgent.js` for terminal-only usage  

---

## Prerequisites

- **Node.js** v16 or higher  
- **npm** v8 or higher  
- **OpenAI API Key** (with embedding & chat completion permissions)  
- **Supabase** project (free tier OK) with:  
  - `vector` extension enabled  
  - A `documents` table and `match_documents` function (see below)  

---

## Project Structure

```text
abconvert-agent/
├── .env                   # Environment variables
├── .gitignore             # Files and folders to ignore
├── package.json           # Dependencies & npm scripts
├── README.md              # Project documentation
├── supabaseClient.js      # Supabase client initialization
├── embedding.js           # OpenAI embedding helper
├── chunkText.js           # Text splitting utility
├── crawlGitbook.js        # GitBook crawler
├── docs.json              # Raw text dump from GitBook
├── embedAndUpload.js      # Embed and upload process
└── askAgent.js            # CLI entry point for querying
```

---

## Installation
### 1. Clone the repository
```bash
git clone https://github.com/your-org/abconvert-agent.git
cd abconvert-agent
```

### 2. Install dependencies
```bash
npm install express dotenv openai @supabase/supabase-js prompt-sync
```

### 3. Create .gitignore (if missing)
```gitignore
node_modules/
.env
docs.json
```

### 4. Configure environment variables
Create a file named .env in the project root:

```ini
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
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
### Add npm Scripts (optional)
In `package.json`, under scripts:

```json
"scripts": {
  "crawl": "node crawlGitbook.js",
  "embed": "node embedAndUpload.js",
  "start": "node askAgent.js"
}
```

### 1. Crawl GitBook
```bash
npm run crawl
```
Generates `docs.json` by scraping GitBook pages.

### 2. Embed & Upload
```bash
npm run embed
```
Processes docs.json into chunks, generates embeddings, and inserts them into Supabase.

### 3. Query via CLI
```bash
npm start
```
Follow the prompt:
```less
❓ Enter your question: What types of A/B tests does ABConvert support?
🤖 AI’s Answer: ...
```