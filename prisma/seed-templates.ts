import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding template projects...");

  // Create system user for templates
  const systemUser = await prisma.user.upsert({
    where: { id: "system_template_user" },
    update: {},
    create: {
      id: "system_template_user",
      email: "templates@architecturedeck.com",
      name: "System Templates",
    },
  });

  console.log(`✓ Created system user: ${systemUser.email}`);

  // Template 1: E-Commerce Platform
  const ecommerceProject = await prisma.project.upsert({
    where: { id: "template_ecommerce" },
    update: {},
    create: {
      id: "template_ecommerce",
      name: "E-Commerce Platform",
      description: "A scalable e-commerce platform with real-time inventory, payment processing, and order management. Built for high traffic and peak shopping seasons.",
      userId: systemUser.id,
      isTemplate: true,
    },
  });

  const ecommerceDesign = await prisma.designRequest.upsert({
    where: { id: "template_ecommerce_design" },
    update: {},
    create: {
      id: "template_ecommerce_design",
      title: "E-Commerce Architecture",
      inputType: "PROMPT",
      promptText: "Build a scalable e-commerce platform handling product catalog, shopping cart, checkout, payment processing, and order tracking. Must support 10,000 concurrent users during peak hours.",
      scaleProfile: "DAU_1K",
      detailLevel: "STANDARD",
      constraints: {
        mustUse: ["PostgreSQL", "Redis", "TypeScript"],
        preferredLanguage: "TypeScript",
      },
      projectId: ecommerceProject.id,
      userId: systemUser.id,
    },
  });

  const ecommerceVersion = await prisma.designVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: ecommerceDesign.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: ecommerceDesign.id,
      version: 1,
      designData: {
        components: [
          {
            name: "Web Storefront",
            type: "Frontend",
            description: "Customer-facing e-commerce website with responsive design and PWA support",
            technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React Query"],
          },
          {
            name: "API Gateway",
            type: "Backend",
            description: "Central API layer handling authentication, rate limiting, and request routing",
            technologies: ["Node.js", "Fastify", "TypeScript", "JWT"],
          },
          {
            name: "Order Service",
            type: "Backend",
            description: "Handles order creation, payment processing, and fulfillment workflows",
            technologies: ["Node.js", "TypeScript", "Stripe SDK"],
          },
          {
            name: "Inventory Service",
            type: "Backend",
            description: "Real-time inventory management with reservation system and stock alerts",
            technologies: ["Node.js", "TypeScript", "Redis"],
          },
          {
            name: "Background Worker",
            type: "Service",
            description: "Async job processing for emails, notifications, reports, and analytics",
            technologies: ["BullMQ", "Redis", "Node.js"],
          },
        ],
        dataStores: [
          {
            name: "Primary Database",
            type: "Relational",
            description: "Main data store for products, orders, users, and transactions",
            technology: "PostgreSQL",
          },
          {
            name: "Cache Layer",
            type: "In-Memory",
            description: "Session storage, cart data, inventory locks, and API response caching",
            technology: "Redis",
          },
          {
            name: "Asset Storage",
            type: "Object Storage",
            description: "Product images, static assets, and user uploads",
            technology: "AWS S3",
          },
        ],
        apis: [
          {
            name: "REST API",
            type: "REST",
            description: "Primary API for web and mobile clients",
            endpoints: [
              "GET /api/products",
              "GET /api/products/:id",
              "POST /api/cart",
              "POST /api/orders",
              "GET /api/orders/:id",
            ],
            protocol: "HTTPS",
            authentication: "JWT",
          },
          {
            name: "WebSocket API",
            type: "WebSocket",
            description: "Real-time order status and inventory updates",
            endpoints: ["wss://api/orders/live", "wss://api/inventory/updates"],
            protocol: "WSS",
            authentication: "JWT",
          },
        ],
        security: [
          {
            category: "Authentication",
            measures: [
              "JWT-based authentication with refresh tokens",
              "OAuth 2.0 for social login",
              "Rate limiting per user and IP",
            ],
            tools: ["Auth0", "AWS Cognito"],
          },
          {
            category: "Payment Security",
            measures: [
              "PCI DSS compliant payment flow via Stripe",
              "No credit card data stored locally",
              "3D Secure support",
            ],
            tools: ["Stripe", "AWS KMS"],
          },
          {
            category: "Data Protection",
            measures: [
              "TLS 1.3 for all connections",
              "Encrypted PII at rest",
              "Regular security audits",
            ],
            tools: ["AWS KMS", "HashiCorp Vault"],
          },
        ],
        scaleChanges: [
          {
            category: "Load Balancing",
            description: "Application load balancer with health checks and auto-scaling groups",
            services: ["AWS ALB", "CloudFront CDN"],
          },
          {
            category: "Database",
            description: "Primary-replica setup with read replicas for product queries and analytics",
            services: ["Amazon RDS", "Aurora Read Replicas"],
          },
          {
            category: "Caching",
            description: "Multi-layer caching: CDN for assets, Redis for API responses and sessions",
            services: ["CloudFront", "ElastiCache"],
          },
        ],
        cloudProvider: "AWS",
        architectureStyle: "Microservices",
      },
    },
  });

  const ecommerceDiagram = await prisma.diagramVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: ecommerceDesign.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: ecommerceDesign.id,
      designVersionId: ecommerceVersion.id,
      version: 1,
      mermaidSource: `flowchart TB
    subgraph Client["Client Layer"]
        Browser["🌐 Web Browser<br/>Next.js"]
        Mobile["📱 Mobile App<br/>React Native"]
    end

    subgraph Edge["Edge Layer"]
        CDN["☁️ CDN<br/>CloudFront"]
    end

    subgraph Gateway["API Gateway"]
        LB["⚖️ Load Balancer<br/>AWS ALB"]
        API["🔌 API Server<br/>Fastify"]
    end

    subgraph Services["Application Services"]
        Auth["🔐 Auth Service<br/>Node.js"]
        Orders["📦 Order Service<br/>Node.js"]
        Inventory["📊 Inventory Service<br/>Node.js"]
        Worker["👷 Background Worker<br/>BullMQ"]
    end

    subgraph Data["Data Layer"]
        DB[("🗃️ PostgreSQL<br/>RDS")]
        Cache[("⚡ Redis<br/>ElastiCache")]
        S3["📦 S3 Storage"]
    end

    subgraph External["External Services"]
        Stripe["💳 Stripe"]
        Email["📧 SendGrid"]
    end

    Browser --> CDN
    Mobile --> CDN
    CDN --> LB
    LB --> API
    API --> Auth
    API --> Orders
    API --> Inventory
    
    Orders --> Worker
    Worker --> Email
    Orders --> Stripe
    
    Auth --> DB
    Auth --> Cache
    Orders --> DB
    Inventory --> DB
    Inventory --> Cache
    Worker --> DB
    Worker --> S3

    style Browser fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Mobile fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style CDN fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style LB fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style API fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Auth fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Orders fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Inventory fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Worker fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style DB fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Cache fill:#FFEBEE,stroke:#C62828,color:#B71C1C
    style S3 fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Stripe fill:#ECEFF1,stroke:#546E7A,color:#37474F
    style Email fill:#ECEFF1,stroke:#546E7A,color:#37474F`,
      svgContent: null,
    },
  });

  await prisma.job.upsert({
    where: { id: "template_ecommerce_job" },
    update: {},
    create: {
      id: "template_ecommerce_job",
      type: "GENERATE_DESIGN",
      status: "COMPLETED",
      progress: 100,
      designRequestId: ecommerceDesign.id,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(Date.now() - 30000),
    },
  });

  console.log(`✓ Created template: ${ecommerceProject.name}`);

  // Template 2: SaaS Application
  const saasProject = await prisma.project.upsert({
    where: { id: "template_saas" },
    update: {},
    create: {
      id: "template_saas",
      name: "SaaS Application",
      description: "A multi-tenant SaaS platform with subscription management, user isolation, and analytics. Designed for rapid scaling and global distribution.",
      userId: systemUser.id,
      isTemplate: true,
    },
  });

  const saasDesign = await prisma.designRequest.upsert({
    where: { id: "template_saas_design" },
    update: {},
    create: {
      id: "template_saas_design",
      title: "Multi-Tenant SaaS Architecture",
      inputType: "PROMPT",
      promptText: "Design a multi-tenant SaaS application with subscription management, tenant isolation, user authentication, analytics dashboard, and API access. Must support thousands of organizations with millions of users.",
      scaleProfile: "DAU_1M",
      detailLevel: "DETAILED",
      constraints: {
        mustUse: ["PostgreSQL", "Redis", "TypeScript", "AWS"],
        preferredLanguage: "TypeScript",
      },
      projectId: saasProject.id,
      userId: systemUser.id,
    },
  });

  const saasVersion = await prisma.designVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: saasDesign.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: saasDesign.id,
      version: 1,
      designData: {
        components: [
          {
            name: "Web Application",
            type: "Frontend",
            description: "Multi-tenant web application with tenant switching and role-based access",
            technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React Query", "Zustand"],
          },
          {
            name: "API Gateway",
            type: "Backend",
            description: "Tenant-aware API gateway with authentication, authorization, and rate limiting",
            technologies: ["AWS API Gateway", "Lambda", "TypeScript"],
          },
          {
            name: "Tenant Service",
            type: "Backend",
            description: "Manages tenant configuration, subscription plans, and billing",
            technologies: ["Node.js", "TypeScript", "Stripe Billing"],
          },
          {
            name: "Auth Service",
            type: "Backend",
            description: "Multi-tenant authentication with SSO, MFA, and session management",
            technologies: ["Node.js", "TypeScript", "Clerk", "JWT"],
          },
          {
            name: "Analytics Service",
            type: "Backend",
            description: "Real-time analytics and reporting with data aggregation",
            technologies: ["Node.js", "TypeScript", "ClickHouse", "Kafka"],
          },
        ],
        dataStores: [
          {
            name: "Primary Database",
            type: "Relational",
            description: "Multi-tenant database with row-level security and tenant isolation",
            technology: "PostgreSQL",
          },
          {
            name: "Analytics Database",
            type: "OLAP",
            description: "Time-series database for analytics and reporting",
            technology: "ClickHouse",
          },
          {
            name: "Cache Layer",
            type: "In-Memory",
            description: "Session storage, tenant config caching, and API rate limiting",
            technology: "Redis",
          },
        ],
        apis: [
          {
            name: "REST API",
            type: "REST",
            description: "Tenant-scoped REST API with OpenAPI documentation",
            endpoints: [
              "GET /api/v1/tenants/:tenantId/users",
              "POST /api/v1/tenants/:tenantId/users",
              "GET /api/v1/analytics",
            ],
            protocol: "HTTPS",
            authentication: "JWT",
          },
          {
            name: "GraphQL API",
            type: "GraphQL",
            description: "Flexible GraphQL API for complex queries and real-time subscriptions",
            endpoints: ["POST /graphql", "WS /graphql"],
            protocol: "HTTPS/WSS",
            authentication: "JWT",
          },
        ],
        security: [
          {
            category: "Tenant Isolation",
            measures: [
              "Row-level security in database",
              "Tenant-scoped API keys",
              "Network isolation with VPC",
            ],
            tools: ["PostgreSQL RLS", "AWS VPC"],
          },
          {
            category: "Authentication",
            measures: [
              "SSO support (SAML, OIDC)",
              "Multi-factor authentication",
              "Session management with refresh tokens",
            ],
            tools: ["Clerk", "AWS Cognito"],
          },
        ],
        scaleChanges: [
          {
            category: "Database Sharding",
            description: "Horizontal sharding by tenant ID with cross-shard queries",
            services: ["Aurora Global", "Vitess"],
          },
          {
            category: "CDN & Edge",
            description: "Global CDN with edge computing for low latency",
            services: ["CloudFront", "Cloudflare Workers"],
          },
        ],
        cloudProvider: "AWS",
        architectureStyle: "Microservices",
      },
    },
  });

  const saasDiagram = await prisma.diagramVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: saasDesign.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: saasDesign.id,
      designVersionId: saasVersion.id,
      version: 1,
      mermaidSource: `flowchart TB
    subgraph Clients["Clients"]
        Web["🌐 Web App<br/>Next.js"]
        Mobile["📱 Mobile App"]
        API_Client["🔌 API Client"]
    end

    subgraph Edge["Edge"]
        CDN["☁️ CDN<br/>CloudFront"]
        WAF["🛡️ WAF"]
    end

    subgraph Gateway["API Gateway"]
        API_GW["🚪 API Gateway<br/>AWS API Gateway"]
        Lambda["⚡ Lambda Functions"]
    end

    subgraph Services["Services"]
        Tenant["🏢 Tenant Service"]
        Auth["🔐 Auth Service"]
        Analytics["📊 Analytics Service"]
        Worker["👷 Worker"]
    end

    subgraph Data["Data"]
        DB[("🗃️ PostgreSQL<br/>Multi-tenant")]
        Analytics_DB[("📈 ClickHouse")]
        Cache[("⚡ Redis")]
    end

    Web --> CDN
    Mobile --> CDN
    API_Client --> WAF
    CDN --> WAF
    WAF --> API_GW
    API_GW --> Lambda
    Lambda --> Tenant
    Lambda --> Auth
    Lambda --> Analytics
    Tenant --> DB
    Auth --> DB
    Auth --> Cache
    Analytics --> Analytics_DB
    Worker --> DB
    Worker --> Analytics_DB

    style Web fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Mobile fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style API_Client fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style CDN fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style WAF fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style API_GW fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Lambda fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Tenant fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Auth fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Analytics fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Worker fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style DB fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Analytics_DB fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Cache fill:#FFEBEE,stroke:#C62828,color:#B71C1C`,
      svgContent: null,
    },
  });

  await prisma.job.upsert({
    where: { id: "template_saas_job" },
    update: {},
    create: {
      id: "template_saas_job",
      type: "GENERATE_DESIGN",
      status: "COMPLETED",
      progress: 100,
      designRequestId: saasDesign.id,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(Date.now() - 30000),
    },
  });

  console.log(`✓ Created template: ${saasProject.name}`);

  // Template 3: Real-time Chat Application
  const chatProject = await prisma.project.upsert({
    where: { id: "template_chat" },
    update: {},
    create: {
      id: "template_chat",
      name: "Real-time Chat Application",
      description: "A scalable real-time messaging platform with WebSocket support, message persistence, and presence indicators. Built for low latency and high concurrency.",
      userId: systemUser.id,
      isTemplate: true,
    },
  });

  const chatDesign = await prisma.designRequest.upsert({
    where: { id: "template_chat_design" },
    update: {},
    create: {
      id: "template_chat_design",
      title: "Real-time Chat Architecture",
      inputType: "PROMPT",
      promptText: "Design a real-time chat application with WebSocket connections, message persistence, typing indicators, online/offline status, file sharing, and group chats. Must handle millions of concurrent connections.",
      scaleProfile: "DAU_1M",
      detailLevel: "STANDARD",
      constraints: {
        mustUse: ["WebSocket", "Redis", "PostgreSQL"],
        preferredLanguage: "TypeScript",
      },
      projectId: chatProject.id,
      userId: systemUser.id,
    },
  });

  const chatVersion = await prisma.designVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: chatDesign.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: chatDesign.id,
      version: 1,
      designData: {
        components: [
          {
            name: "Web Client",
            type: "Frontend",
            description: "Real-time chat interface with WebSocket connections",
            technologies: ["React", "TypeScript", "Socket.io Client", "Tailwind CSS"],
          },
          {
            name: "WebSocket Server",
            type: "Backend",
            description: "Manages WebSocket connections, message routing, and presence",
            technologies: ["Node.js", "Socket.io", "TypeScript", "Redis"],
          },
          {
            name: "Message Service",
            type: "Backend",
            description: "Handles message storage, retrieval, and search",
            technologies: ["Node.js", "TypeScript", "PostgreSQL", "Elasticsearch"],
          },
          {
            name: "Presence Service",
            type: "Backend",
            description: "Tracks user online/offline status and typing indicators",
            technologies: ["Node.js", "TypeScript", "Redis"],
          },
          {
            name: "Media Service",
            type: "Backend",
            description: "Handles file uploads, image processing, and media storage",
            technologies: ["Node.js", "TypeScript", "AWS S3", "ImageMagick"],
          },
        ],
        dataStores: [
          {
            name: "Message Database",
            type: "Relational",
            description: "Stores messages, conversations, and metadata",
            technology: "PostgreSQL",
          },
          {
            name: "Search Index",
            type: "Search",
            description: "Full-text search for messages and conversations",
            technology: "Elasticsearch",
          },
          {
            name: "Presence Cache",
            type: "In-Memory",
            description: "Real-time presence data and active connections",
            technology: "Redis",
          },
          {
            name: "Media Storage",
            type: "Object Storage",
            description: "Stores images, files, and media attachments",
            technology: "AWS S3",
          },
        ],
        apis: [
          {
            name: "WebSocket API",
            type: "WebSocket",
            description: "Real-time bidirectional communication for messages and presence",
            endpoints: ["wss://chat.example.com"],
            protocol: "WSS",
            authentication: "JWT",
          },
          {
            name: "REST API",
            type: "REST",
            description: "Message history, user management, and file uploads",
            endpoints: [
              "GET /api/messages/:conversationId",
              "POST /api/messages",
              "POST /api/upload",
            ],
            protocol: "HTTPS",
            authentication: "JWT",
          },
        ],
        security: [
          {
            category: "Connection Security",
            measures: [
              "WSS encryption for all WebSocket connections",
              "JWT authentication on connection",
              "Rate limiting per connection",
            ],
            tools: ["TLS 1.3", "AWS WAF"],
          },
          {
            category: "Message Security",
            measures: [
              "End-to-end encryption for sensitive messages",
              "Message content moderation",
              "File scanning for malware",
            ],
            tools: ["AWS KMS", "ClamAV"],
          },
        ],
        scaleChanges: [
          {
            category: "WebSocket Scaling",
            description: "Horizontal scaling with Redis pub/sub for message distribution across servers",
            services: ["ElastiCache", "Application Load Balancer"],
          },
          {
            category: "Database",
            description: "Read replicas for message history queries, sharding by conversation ID",
            services: ["Aurora", "Read Replicas"],
          },
        ],
        cloudProvider: "AWS",
        architectureStyle: "Event-Driven",
      },
    },
  });

  const chatDiagram = await prisma.diagramVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: chatDesign.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: chatDesign.id,
      designVersionId: chatVersion.id,
      version: 1,
      mermaidSource: `flowchart TB
    subgraph Clients["Clients"]
        Web["🌐 Web Client<br/>React"]
        Mobile["📱 Mobile App"]
    end

    subgraph Gateway["Gateway"]
        LB["⚖️ Load Balancer<br/>ALB"]
        WS["🔌 WebSocket Server<br/>Socket.io"]
    end

    subgraph Services["Services"]
        Message["💬 Message Service"]
        Presence["👁️ Presence Service"]
        Media["📎 Media Service"]
    end

    subgraph Data["Data"]
        DB[("🗃️ PostgreSQL")]
        Search[("🔍 Elasticsearch")]
        Cache[("⚡ Redis")]
        S3["📦 S3"]
    end

    Web --> LB
    Mobile --> LB
    LB --> WS
    WS --> Message
    WS --> Presence
    Message --> DB
    Message --> Search
    Presence --> Cache
    Media --> S3
    Media --> DB

    style Web fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Mobile fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style LB fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style WS fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Message fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Presence fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Media fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style DB fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Search fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Cache fill:#FFEBEE,stroke:#C62828,color:#B71C1C
    style S3 fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C`,
      svgContent: null,
    },
  });

  await prisma.job.upsert({
    where: { id: "template_chat_job" },
    update: {},
    create: {
      id: "template_chat_job",
      type: "GENERATE_DESIGN",
      status: "COMPLETED",
      progress: 100,
      designRequestId: chatDesign.id,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(Date.now() - 30000),
    },
  });

  console.log(`✓ Created template: ${chatProject.name}`);

  console.log("\n✅ Template seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Template seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
