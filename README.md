# ArchitectureDeck 🏗️

AI-powered architecture and diagram builder. Describe your product or provide a GitHub repository URL to generate complete architecture plans with Mermaid diagrams.

![ArchitectureDeck](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)

## ✨ Features

- **AI-Powered Design Generation** - Submit a prompt or GitHub URL to generate architecture plans
- **Scale-Aware Architecture** - Choose from Prototype, 1K DAU, or 1M DAU profiles
- **Mermaid Diagrams** - Auto-generated flowcharts rendered as SVG
- **Version Control** - Track all iterations of your designs
- **Constraint System** - Specify technologies to include or avoid
- **Real-time Progress** - Watch generation progress with Redis-backed job queue

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, Tailwind CSS |
| API | tRPC, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Cache/Queue | Redis, BullMQ |
| Diagrams | Mermaid |

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- pnpm (recommended) or npm

## 🚀 Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourorg/architecture-deck.git
cd architecture-deck
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/architecture_deck?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=10

# OpenAI API Key (required for AI generation)
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

> ⚠️ **Important:** The `OPENAI_API_KEY` is required for architecture generation. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Start Services

**PostgreSQL:**
```bash
# Using Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16

# Or use local PostgreSQL
createdb architecture_deck
```

**Redis:**
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Or use local Redis
redis-server
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data (optional)
pnpm db:seed
```

### 5. Start Development Servers

**Terminal 1 - Next.js App:**
```bash
pnpm dev
```

**Terminal 2 - Background Worker:**
```bash
pnpm worker
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
architecture-deck/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo data seeder
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── designs/        # Design-related components
│   │   ├── layout/         # Layout components
│   │   ├── projects/       # Project-related components
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   ├── db.ts           # Prisma client
│   │   ├── queue.ts        # BullMQ queue setup
│   │   ├── redis.ts        # Redis client & utilities
│   │   ├── trpc.ts         # tRPC client
│   │   └── utils.ts        # Helper functions
│   ├── pages/
│   │   ├── api/trpc/       # tRPC API handler
│   │   ├── projects/       # Project pages
│   │   └── index.tsx       # Home page
│   ├── server/
│   │   ├── routers/        # tRPC routers
│   │   └── trpc.ts         # tRPC server setup
│   ├── styles/
│   │   └── globals.css     # Global styles
│   └── worker/
│       ├── generator.ts    # Mock AI generator
│       ├── index.ts        # Worker entry point
│       └── renderer.ts     # Mermaid renderer
├── Deployment.md           # AWS deployment guide
├── package.json
└── README.md
```

## 🔌 API Endpoints (tRPC)

### Projects
- `projects.list` - List all projects
- `projects.get` - Get project by ID
- `projects.create` - Create new project
- `projects.update` - Update project
- `projects.delete` - Delete project

### Designs
- `designs.createRequest` - Create design request (triggers generation)
- `designs.getRequest` - Get design request
- `designs.listRequests` - List requests for project
- `designs.getVersion` - Get specific design version
- `designs.listVersions` - List all versions
- `designs.getDiagram` - Get diagram for design

### Jobs
- `jobs.getStatus` - Get job status (real-time)
- `jobs.listByDesignRequest` - List jobs for design

## 📊 Data Model

```
User
 └── Project (1:N)
      └── DesignRequest (1:N)
           ├── DesignVersion (1:N)
           │    └── DiagramVersion (1:N)
           ├── DiagramVersion (1:N)
           └── Job (1:N)
```

## 🔄 Design Generation Pipeline

1. **Submit** - User submits prompt or repo URL with constraints
2. **Validate** - Input validation via Zod schemas
3. **Persist** - Create DesignRequest row in PostgreSQL
4. **Queue** - Enqueue job in Redis via BullMQ
5. **Process** - Worker generates design using mock AI
6. **Render** - Convert Mermaid to SVG (or store for client-side render)
7. **Store** - Save DesignVersion + DiagramVersion
8. **Complete** - Update job status, notify client

## 🎨 Customization

### AI Generation

The architecture generation uses **OpenAI GPT-4o** to create comprehensive designs. The generator:

1. Accepts your product description or GitHub repo URL
2. Considers scale profile (Prototype, 1K DAU, 1M DAU)
3. Respects technology constraints (must use / avoid)
4. Returns structured JSON with components, data stores, APIs, security, and roadmap
5. Generates a Mermaid diagram matching the architecture

If OpenAI is unavailable, it falls back to a deterministic mock generator.

### Custom Diagram Themes

Edit the Mermaid theme in `src/styles/globals.css`:

```css
.mermaid .node rect {
  fill: #your-color !important;
  stroke: #your-border !important;
}
```

## 🧪 Testing

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Open Prisma Studio
pnpm db:studio
```

## 📦 Production Build

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Start production worker
pnpm worker:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
