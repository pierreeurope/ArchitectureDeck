import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: "user_demo_001" },
    update: {},
    create: {
      id: "user_demo_001",
      email: "demo@architecturedeck.com",
      name: "Demo User",
    },
  });

  console.log(`✓ Created user: ${user.email}`);

  // Create sample project
  const project = await prisma.project.upsert({
    where: { id: "proj_demo_001" },
    update: {},
    create: {
      id: "proj_demo_001",
      name: "E-Commerce Platform",
      description:
        "Modern e-commerce platform with real-time inventory, payment processing, and order management.",
      userId: user.id,
    },
  });

  console.log(`✓ Created project: ${project.name}`);

  // Create sample design request with completed design
  const designRequest = await prisma.designRequest.upsert({
    where: { id: "design_demo_001" },
    update: {},
    create: {
      id: "design_demo_001",
      title: "Initial Platform Architecture",
      inputType: "PROMPT",
      promptText:
        "Build an e-commerce platform that handles product catalog, shopping cart, checkout, and order tracking. Need to support 10,000 concurrent users during peak hours.",
      scaleProfile: "DAU_1K",
      constraints: {
        mustUse: ["PostgreSQL", "Redis", "TypeScript"],
        avoid: ["MongoDB"],
        preferredLanguage: "TypeScript",
      },
      projectId: project.id,
      userId: user.id,
    },
  });

  console.log(`✓ Created design request: ${designRequest.title}`);

  // Create sample design version
  const designVersion = await prisma.designVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: designRequest.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: designRequest.id,
      version: 1,
      designData: {
        components: [
          {
            name: "Web Storefront",
            type: "Frontend",
            description: "Customer-facing e-commerce website with responsive design",
            technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React Query"],
          },
          {
            name: "API Gateway",
            type: "Backend",
            description: "Central API layer handling authentication and request routing",
            technologies: ["Node.js", "Fastify", "TypeScript", "JWT"],
          },
          {
            name: "Order Service",
            type: "Backend",
            description: "Handles order creation, payment processing, and fulfillment",
            technologies: ["Node.js", "TypeScript", "Stripe SDK"],
          },
          {
            name: "Inventory Service",
            type: "Backend",
            description: "Real-time inventory management with reservation system",
            technologies: ["Node.js", "TypeScript", "Redis"],
          },
          {
            name: "Background Worker",
            type: "Service",
            description: "Async job processing for emails, notifications, and reports",
            technologies: ["BullMQ", "Redis", "Node.js"],
          },
        ],
        dataStores: [
          {
            name: "Primary Database",
            type: "Relational",
            description: "Main data store for products, orders, and users",
            technology: "PostgreSQL",
          },
          {
            name: "Cache Layer",
            type: "In-Memory",
            description: "Session storage, cart data, and inventory locks",
            technology: "Redis",
          },
          {
            name: "Asset Storage",
            type: "Object Storage",
            description: "Product images and static assets",
            technology: "AWS S3",
          },
        ],
        apis: [
          {
            name: "REST API",
            type: "HTTP",
            description: "Primary API for web and mobile clients",
            endpoints: [
              "GET /api/products",
              "GET /api/products/:id",
              "POST /api/cart",
              "POST /api/orders",
              "GET /api/orders/:id",
            ],
          },
          {
            name: "WebSocket API",
            type: "Real-time",
            description: "Real-time order status and inventory updates",
            endpoints: ["ws://api/orders/live", "ws://api/inventory/updates"],
          },
        ],
        security: [
          {
            category: "Authentication",
            measures: [
              "JWT-based authentication with refresh tokens",
              "OAuth 2.0 for social login",
              "Rate limiting per user",
            ],
          },
          {
            category: "Payment Security",
            measures: [
              "PCI DSS compliant payment flow via Stripe",
              "No credit card data stored locally",
              "3D Secure support",
            ],
          },
          {
            category: "Data Protection",
            measures: [
              "TLS 1.3 for all connections",
              "Encrypted PII at rest",
              "Regular security audits",
            ],
          },
        ],
        scaleChanges: [
          {
            category: "Load Balancing",
            description: "Application load balancer with health checks and auto-scaling",
          },
          {
            category: "Database",
            description: "Primary-replica setup with read replicas for product queries",
          },
          {
            category: "Caching",
            description: "Multi-layer caching: CDN for assets, Redis for API responses",
          },
        ],
        roadmap: [
          {
            phase: "Phase 1: MVP",
            items: [
              "Core product catalog",
              "Shopping cart",
              "Basic checkout flow",
              "User authentication",
            ],
            timeframe: "4 weeks",
          },
          {
            phase: "Phase 2: Growth",
            items: [
              "Payment integration",
              "Order tracking",
              "Email notifications",
              "Admin dashboard",
            ],
            timeframe: "4 weeks",
          },
          {
            phase: "Phase 3: Scale",
            items: [
              "Performance optimization",
              "Search improvements",
              "Analytics integration",
              "Mobile app",
            ],
            timeframe: "6 weeks",
          },
        ],
      },
    },
  });

  console.log(`✓ Created design version: v${designVersion.version}`);

  // Create sample diagram
  const diagram = await prisma.diagramVersion.upsert({
    where: {
      designRequestId_version: {
        designRequestId: designRequest.id,
        version: 1,
      },
    },
    update: {},
    create: {
      designRequestId: designRequest.id,
      designVersionId: designVersion.id,
      version: 1,
      mermaidSource: `flowchart TB
    subgraph Client["Client Layer"]
        Browser["🌐 Web Browser"]
        Mobile["📱 Mobile App"]
    end

    subgraph Edge["Edge Layer"]
        CDN["☁️ CDN"]
    end

    subgraph Gateway["API Gateway"]
        LB["⚖️ Load Balancer"]
        API["🔌 API Server"]
    end

    subgraph Services["Application Services"]
        Auth["🔐 Auth Service"]
        Orders["📦 Order Service"]
        Inventory["📊 Inventory Service"]
        Worker["👷 Background Worker"]
    end

    subgraph Data["Data Layer"]
        DB[("🗃️ PostgreSQL")]
        Cache[("⚡ Redis")]
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
    Worker --> S3`,
      svgContent: null,
    },
  });

  console.log(`✓ Created diagram version: v${diagram.version}`);

  // Create a completed job
  await prisma.job.upsert({
    where: { id: "job_demo_001" },
    update: {},
    create: {
      id: "job_demo_001",
      type: "GENERATE_DESIGN",
      status: "COMPLETED",
      progress: 100,
      designRequestId: designRequest.id,
      startedAt: new Date(Date.now() - 30000),
      completedAt: new Date(),
    },
  });

  console.log(`✓ Created completed job`);

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
