\# General AI Decision \& Recommendation Engine



A generic AI-assisted decision and recommendation system that converts structured input into deterministic analysis, meaningful flags, targeted knowledge retrieval, and grounded LLM-generated recommendations.



The system is designed around a reusable architecture rather than a single hardcoded domain.



It can support different use cases such as:



\- Customer risk analysis

\- Project delivery monitoring

\- Education/assessment analysis

\- Health-support decision assistance

\- Recipe and ingredient matching

\- Supplier or operational analysis

\- Other structured decision workflows



\---



\## Overview



The system follows this pipeline:



```text

Structured Input

&#x20;      ↓

Validation

&#x20;      ↓

Analysis / Matching

&#x20;      ↓

Flags / Conditions

&#x20;      ↓

Query Builder

&#x20;      ↓

Knowledge Retrieval

&#x20;      ↓

Relevant Evidence

&#x20;      ↓

LLM

&#x20;      ↓

Grounded Recommendation / Explanation
The key design principle is that the LLM does not perform the deterministic analysis itself.

Instead:

Python evaluates rules and conditions.
Matching conditions generate flags.
Flags are converted into targeted retrieval queries.
PostgreSQL + pgvector retrieves relevant knowledge.
The retrieved evidence is passed to the LLM.
The LLM generates an explanation or recommendation grounded in that evidence.

This separation makes the system more predictable, reusable, and easier to extend.

Core Architecture
1. Structured Input

The system accepts flexible structured data through:

DecisionInput

The input is represented as a dictionary so different domains can provide different fields.

Example:

{
  "ingredients": ["pasta", "tomato", "cheese"]
}

Another domain could provide:

{
  "tasks_completed": 4,
  "tasks_total": 10,
  "days_remaining": 2
}

No changes to the core analysis engine are required simply because the input fields are different.

2. Specifications

A specification defines how a particular type of structured data should be analyzed.

A specification contains:

A specification ID
A name
One or more rules

Each rule contains:

Conditions
Logic (AND or OR)
A flag
A description
Retrieval information

Example:

{
  "conditions": [
    {
      "field": "tasks_completed",
      "operator": "<",
      "value": 5
    }
  ],
  "logic": "AND",
  "flag": "low_task_completion",
  "description": "Task completion is below the expected level.",
  "retrieval": {
    "query": "project delivery actions for low task completion",
    "domain": "business",
    "category": "project_delivery"
  }
}

Specifications are stored in PostgreSQL and can be created and retrieved through the API.

Rule Engine

The deterministic analysis engine supports the following operators:

>
<
>=
<=
==
!=
contains
in
between
length_gte
length_lte

Rules can use:

AND
OR
Example

A rule can detect an approaching deadline:

days_remaining <= 3

which produces:

deadline_approaching

Another rule can detect low completion:

tasks_completed < 5

which produces:

low_task_completion

Multiple rules can be evaluated against the same input.

Flags

Flags are the bridge between deterministic analysis and retrieval.

Input
  ↓
Rule Evaluation
  ↓
Flags
  ↓
Queries
  ↓
Retrieval

For example:

days_until_renewal = 15

may produce:

renewal_approaching

The system then uses that flag to determine which knowledge should be retrieved.

This prevents the retrieval system from searching the entire knowledge base without context.

Query Builder

When a rule matches, the system builds a retrieval query using:

The rule's retrieval query
The rule description
Relevant actual input values

For example:

review customer renewal
|
approaching contract renewal
|
days_until_renewal: 15

This provides additional context to the embedding-based retrieval system.

Knowledge Base

Knowledge is stored in PostgreSQL.

Each knowledge chunk contains:

id
content
source
page
domain
category
flag
embedding

The flag field connects retrieved knowledge to the analysis result.

For example:

flag: renewal_approaching

allows retrieval to focus specifically on knowledge associated with that detected condition.

Knowledge can be added directly through the API or ingested from PDFs.

PDF Knowledge Ingestion

The system supports PDF knowledge ingestion.

The ingestion pipeline is:

PDF
 ↓
Text Extraction
 ↓
Page Tracking
 ↓
Chunking
 ↓
Embedding Generation
 ↓
PostgreSQL + pgvector

Each chunk preserves:

Source filename
Page number
Domain
Category
Flag

This provides provenance for retrieved evidence.

Embeddings

The project uses OpenAI's:

text-embedding-3-small

Embeddings are 1536-dimensional vectors.

They are used to represent knowledge chunks and incoming retrieval queries in vector space.

Vector Retrieval

The project uses PostgreSQL with pgvector for vector similarity search.

The retrieval system supports two modes:

Similarity Search

Similarity search returns the most relevant knowledge chunks according to vector distance.

The system uses cosine distance.

Lower distance means greater similarity.

Maximum Distance

The retrieval configuration includes:

max_distance

This acts as a relevance boundary.

Only results satisfying the configured distance threshold are returned.

For example:

max_distance = 0.30

means that knowledge chunks with a cosine distance greater than 0.30 are excluded.

This helps prevent weakly related knowledge from reaching the LLM.

MMR Retrieval

The system also supports:

MMR

(Maximal Marginal Relevance)

MMR considers both:

Relevance to the query
Diversity among selected results

The configuration includes:

n_results
fetch_k
lambda_mult

fetch_k determines the initial candidate pool.

n_results determines the final number of results.

lambda_mult controls the relevance/diversity balance.

Conceptually:

lambda_mult = 1.0
    → favors relevance

lambda_mult = 0.0
    → favors diversity
Retrieval Configuration

The /analyze endpoint accepts:

{
  "n_results": 5,
  "max_distance": 0.75,
  "search_type": "similarity",
  "fetch_k": 20,
  "lambda_mult": 0.5
}
Parameters
Parameter	Purpose
n_results	Number of final knowledge results
max_distance	Maximum allowed cosine distance
search_type	similarity or mmr
fetch_k	Candidate pool used before MMR selection
lambda_mult	Relevance/diversity balance for MMR
Grounded LLM Generation

The LLM receives:

Original structured input
Detected flags
Rule evaluation results
Retrieved knowledge

The prompt explicitly constrains the model to use the retrieved evidence.

The system is designed to prevent the LLM from:

Inventing new flags
Creating unsupported facts
Using outside knowledge as evidence
Claiming an action is supported when the retrieved knowledge does not support it
Replacing deterministic rule evaluation

The goal is:

Deterministic Analysis
        +
Retrieved Evidence
        ↓
Grounded LLM Response
Example: Customer Risk

A customer can be represented with structured information such as:

{
  "customer_name": "Customer X",
  "days_until_renewal": 15,
  "unresolved_support_issues": [
    "Issue A",
    "Issue B",
    "Issue C"
  ],
  "invoice_overdue": true
}

The specification can detect:

renewal_approaching
unresolved_support_issues
overdue_invoice

These flags generate separate retrieval queries.

Relevant knowledge can then be retrieved for each flag.

The LLM uses those evidence chunks to explain the detected signals and provide only the actions supported by the retrieved knowledge.

Example: Project Delivery

Input:

{
  "project_name": "Project Alpha",
  "tasks_completed": 4,
  "tasks_total": 10,
  "days_remaining": 2
}

Possible detected flags:

low_task_completion
deadline_approaching

The system retrieves knowledge associated with each condition and provides a grounded project-delivery explanation.

Example: Education

Input:

{
  "score": 42,
  "attendance": 68
}

Possible flags:

low_assessment_score
low_attendance

The system retrieves relevant evidence for both conditions.

If no rules match, the system safely returns a no-match response rather than generating an unsupported recommendation.

Example: Recipe Matching

The same architecture can also be used for a recipe-style workflow.

Input:

{
  "ingredients": [
    "pasta"
  ]
}

A rule can detect:

pasta_available

The corresponding recipe knowledge can then be retrieved and provided to the LLM.

The analysis engine itself does not need to be rewritten specifically for recipes.

API

The backend is built with FastAPI.

Root
GET /

Returns a simple backend health message.

Create Specification
POST /specifications

Stores a reusable specification.

Get Specification
GET /specifications/{specification_id}

Retrieves a saved specification.

Add Knowledge
POST /knowledge

Adds a knowledge record and automatically generates its embedding.

Upload Knowledge PDF
POST /knowledge/upload

Uploads a PDF, extracts its text, creates chunks, generates embeddings, and stores the knowledge in PostgreSQL.

Analyze
POST /analyze

Runs the complete decision pipeline:

Input
 ↓
Specification Lookup
 ↓
Rule Evaluation
 ↓
Flags
 ↓
Query Building
 ↓
Vector Retrieval
 ↓
Grounded LLM Generation
 ↓
Analysis Response

The response contains:

Specification name
Received data
Flags
Rule results
Generated queries
Retrieved knowledge
Final AI answer
Technology Stack
Backend
Python
FastAPI
Pydantic
SQLAlchemy
PostgreSQL
pgvector
OpenAI API
AI
OpenAI embeddings
OpenAI LLM generation
Retrieval-augmented generation principles
Frontend
Next.js
React
TypeScript
Tailwind CSS
Infrastructure
Docker
PostgreSQL
pgvector
Project Structure
general-ai-engine/
│
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── create_tables.py
│   ├── test_database.py
│   │
│   └── app/
│       ├── analysis/
│       │   └── engine.py
│       │
│       ├── ingestion/
│       │   ├── chunker.py
│       │   └── pdf_ingester.py
│       │
│       ├── llm/
│       │   └── answer_generator.py
│       │
│       ├── models/
│       │   ├── input_models.py
│       │   ├── knowledge_models.py
│       │   ├── request_models.py
│       │   ├── response_models.py
│       │   ├── retrieval_models.py
│       │   ├── rule_models.py
│       │   └── specification_models.py
│       │
│       ├── retrieval/
│       │   ├── query_builder.py
│       │   └── retriever.py
│       │
│       ├── specifications/
│       │   └── registry.py
│       │
│       ├── database.py
│       ├── embeddings.py
│       ├── main.py
│       └── openai_client.py
│
└── frontend/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── package.json
    ├── package-lock.json
    ├── next.config.ts
    ├── tsconfig.json
    └── ...
Setup
Prerequisites

Install:

Python 3.14+
Node.js
npm
Docker
Git
1. Clone the Repository
git clone <repository-url>
cd general-ai-engine
2. Create Python Environment

From the backend directory:

cd backend
python -m venv .venv

Activate it on Windows PowerShell:

.\.venv\Scripts\Activate.ps1
3. Environment Variables

Create:

backend/.env

using the template:

backend/.env.example

The environment file should contain:

OPENAI_API_KEY=your_openai_api_key_here

Never commit the real .env file.

4. Start PostgreSQL + pgvector

Create the Docker container:

docker run --name general-ai-postgres `
  -e POSTGRES_USER=generaluser `
  -e POSTGRES_PASSWORD=generalpass `
  -e POSTGRES_DB=generalai `
  -p 5433:5432 `
  -d pgvector/pgvector:pg16

Enable the pgvector extension:

docker exec -it general-ai-postgres psql `
  -U generaluser `
  -d generalai `
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
5. Start the Backend

From:

general-ai-engine/backend

run:

python -m uvicorn app.main:app --port 8010

The backend will be available at:

http://127.0.0.1:8010

FastAPI documentation:

http://127.0.0.1:8010/docs
6. Start the Frontend

Open another terminal:

cd "C:\Users\DELL\Desktop\general-ai-engine\frontend"

Install dependencies:

npm install

Start Next.js:

npm run dev

The frontend runs at:

http://localhost:3000
Security

The project intentionally excludes sensitive and generated files from Git.

The root .gitignore excludes:

.env
.venv/
node_modules/
.next/
__pycache__/
uploads/

A safe environment template is provided at:

backend/.env.example

Never commit an actual API key.

Design Principles
Domain Independence

The core engine should not be hardcoded around one domain.

New use cases should primarily require:

A new specification
Appropriate knowledge
Relevant retrieval metadata

rather than rewriting the analysis engine.

Deterministic First

Where a decision can be represented as an explicit rule, the application code performs that evaluation.

For example:

days_remaining <= 3

is evaluated by Python rather than asking the LLM to decide whether three days constitutes a deadline condition.

Evidence Before Generation

The LLM should receive retrieved evidence before producing recommendations.

Structured Data
      ↓
Deterministic Analysis
      ↓
Evidence Retrieval
      ↓
LLM Generation

This improves traceability and reduces unsupported responses.

Provenance

Retrieved knowledge retains:

Source
Page
Domain
Category
Flag
Retrieval distance

This makes it possible to understand where the generated response came from.

Safety and Limitations

This project is a decision-support and recommendation engine.

It is not intended to replace qualified professional judgment.

For sensitive domains such as healthcare:

Inputs should be treated as decision-support data.
Rules should come from appropriate authoritative specifications.
Synthetic/demo data should be used during development.
The system should not be treated as a medical diagnosis system.

More generally, the quality of recommendations depends on:

Correct specifications
Quality of knowledge
Retrieval relevance
Appropriate thresholds
LLM behavior

The system therefore exposes rule results and retrieved evidence instead of hiding the intermediate reasoning pipeline.

Current Development Status

The current implementation includes:

Generic structured input
Dynamic specifications
Rule-based analysis
AND/OR conditions
Multiple comparison operators
Dynamic flag generation
Dynamic query generation
PostgreSQL persistence
pgvector embeddings
Similarity search
MMR retrieval
Retrieval thresholds
Domain/category filtering
Flag-based retrieval
PDF ingestion
Page-level provenance
Grounded LLM generation
Multiple demonstration domains
Next.js frontend
Interactive retrieval controls
Analysis result visualization
Git repository and environment protection
License

This project is currently intended as a development/internship project.

Add an appropriate license before public distribution if required.


### Step 2 — Save it

After saving and closing Notepad, run:

```powershell id="f2w8cx"
Get-Item ".\README.md"

