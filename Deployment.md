# AWS Deployment Guide for ArchitectureDeck

This document outlines the recommended AWS architecture and deployment process for ArchitectureDeck in a production environment.

## 🏗️ Architecture Overview

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                         AWS Cloud                           │
                                    │                                                             │
┌──────────┐     ┌──────────┐      │  ┌─────────────┐    ┌─────────────────────────────────┐    │
│  Users   │────▶│CloudFront│──────┼─▶│     ALB     │───▶│         ECS Fargate             │    │
└──────────┘     │   (CDN)  │      │  │             │    │  ┌─────────────────────────────┐│    │
                 └──────────┘      │  └─────────────┘    │  │  Next.js App (x2-4 tasks)   ││    │
                                   │         │           │  └─────────────────────────────┘│    │
                                   │         │           │  ┌─────────────────────────────┐│    │
                                   │         │           │  │  Worker (x1-3 tasks)        ││    │
                                   │         │           │  └─────────────────────────────┘│    │
                                   │         │           └─────────────────────────────────────┘│
                                   │         │                          │                       │
                                   │         ▼                          ▼                       │
                                   │  ┌─────────────┐           ┌─────────────┐                │
                                   │  │   RDS       │           │ElastiCache  │                │
                                   │  │ PostgreSQL  │           │   Redis     │                │
                                   │  │ (Multi-AZ)  │           │  (Cluster)  │                │
                                   │  └─────────────┘           └─────────────┘                │
                                   │                                                            │
                                   │  ┌─────────────┐           ┌─────────────┐                │
                                   │  │     S3      │           │  Secrets    │                │
                                   │  │   (Assets)  │           │   Manager   │                │
                                   │  └─────────────┘           └─────────────┘                │
                                   └────────────────────────────────────────────────────────────┘
```

## 📦 AWS Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **ECS Fargate** | Container orchestration | Run Next.js app and worker |
| **RDS PostgreSQL** | Primary database | Multi-AZ, db.t3.medium+ |
| **ElastiCache Redis** | Cache & job queue | Cluster mode, cache.t3.medium+ |
| **ALB** | Load balancer | HTTP/HTTPS, health checks |
| **CloudFront** | CDN | Static assets, API caching |
| **S3** | Static storage | Build artifacts, uploads |
| **ECR** | Container registry | Docker images |
| **Secrets Manager** | Secrets storage | Database credentials, API keys |
| **CloudWatch** | Monitoring & logs | Metrics, alarms, log groups |
| **Route 53** | DNS | Domain management |
| **ACM** | SSL certificates | HTTPS certificates |

## 🔧 Infrastructure Setup

### 1. VPC Configuration

Create a VPC with public and private subnets across 2+ availability zones:

```hcl
# terraform/vpc.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "architecturedeck-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false  # One per AZ for HA
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}
```

### 2. RDS PostgreSQL

```hcl
# terraform/rds.tf
resource "aws_db_instance" "main" {
  identifier = "architecturedeck-db"
  
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.medium"  # Scale as needed
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "architecture_deck"
  username = "postgres"
  password = aws_secretsmanager_secret_version.db_password.secret_string
  
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  deletion_protection = true
  skip_final_snapshot = false
  
  performance_insights_enabled = true
}
```

### 3. ElastiCache Redis

```hcl
# terraform/elasticache.tf
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "architecturedeck-redis"
  description          = "Redis cluster for ArchitectureDeck"
  
  node_type            = "cache.t3.medium"
  num_cache_clusters   = 2
  
  engine               = "redis"
  engine_version       = "7.0"
  port                 = 6379
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = aws_secretsmanager_secret_version.redis_auth.secret_string
  
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  snapshot_retention_limit = 7
  snapshot_window          = "02:00-03:00"
}
```

### 4. ECS Cluster & Services

```hcl
# terraform/ecs.tf
resource "aws_ecs_cluster" "main" {
  name = "architecturedeck"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Next.js Application Service
resource "aws_ecs_service" "app" {
  name            = "app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  
  desired_count = 2
  launch_type   = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}

# Worker Service
resource "aws_ecs_service" "worker" {
  name            = "worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  
  desired_count = 1
  launch_type   = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
}
```

### 5. Task Definitions

```json
// app-task-definition.json
{
  "family": "architecturedeck-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${execution_role_arn}",
  "taskRoleArn": "${task_role_arn}",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "${ecr_repo_url}:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "${database_url_secret_arn}"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "${redis_url_secret_arn}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/architecturedeck-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "app"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

> **Note:** Store `OPENAI_API_KEY` in AWS Secrets Manager alongside `DATABASE_URL` and `REDIS_URL`.

```json
// worker-task-definition.json
{
  "family": "architecturedeck-worker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${execution_role_arn}",
  "taskRoleArn": "${task_role_arn}",
  "containerDefinitions": [
    {
      "name": "worker",
      "image": "${ecr_repo_url}:latest",
      "command": ["node", "dist/worker/index.js"],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "${database_url_secret_arn}"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "${redis_url_secret_arn}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/architecturedeck-worker",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "worker"
        }
      }
    }
  ]
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: architecturedeck
  ECS_CLUSTER: architecturedeck
  
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Run database migrations
        run: |
          # Run migrations via ECS task
          aws ecs run-task \
            --cluster $ECS_CLUSTER \
            --task-definition architecturedeck-migrate \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
      
      - name: Deploy App Service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service app \
            --force-new-deployment
      
      - name: Deploy Worker Service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service worker \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services app worker
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

## 📊 Monitoring & Alerts

### CloudWatch Alarms

```hcl
# terraform/monitoring.tf
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "architecturedeck-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization is too high"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "architecturedeck-db-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### Auto-Scaling

```hcl
# terraform/autoscaling.tf
resource "aws_appautoscaling_target" "app" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "app_cpu" {
  name               = "architecturedeck-app-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.app.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

## 💰 Cost Estimation

### Minimum Production Setup (~$200-400/month)

| Service | Configuration | Est. Cost |
|---------|---------------|-----------|
| ECS Fargate (App) | 2x 0.5 vCPU, 1GB | ~$30/month |
| ECS Fargate (Worker) | 1x 0.25 vCPU, 0.5GB | ~$10/month |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | ~$100/month |
| ElastiCache Redis | cache.t3.micro, 2 nodes | ~$25/month |
| ALB | 1 LCU average | ~$20/month |
| CloudFront | 100GB transfer | ~$10/month |
| S3 | 50GB storage | ~$2/month |
| CloudWatch | Logs & metrics | ~$10/month |
| **Total** | | **~$207/month** |

### Scaled Production (~$500-1000/month)

| Service | Configuration | Est. Cost |
|---------|---------------|-----------|
| ECS Fargate (App) | 4x 1 vCPU, 2GB | ~$120/month |
| ECS Fargate (Worker) | 2x 0.5 vCPU, 1GB | ~$30/month |
| RDS PostgreSQL | db.r6g.large, Multi-AZ | ~$350/month |
| ElastiCache Redis | cache.r6g.large, 2 nodes | ~$200/month |
| ALB | 5 LCUs average | ~$50/month |
| CloudFront | 500GB transfer | ~$50/month |
| Other services | | ~$50/month |
| **Total** | | **~$850/month** |

## 🔐 Security Best Practices

1. **Network Isolation**
   - Keep RDS and ElastiCache in private subnets
   - Use security groups to restrict access
   - Enable VPC flow logs

2. **Secrets Management**
   - Store all secrets in AWS Secrets Manager
   - Rotate database passwords regularly
   - Never commit secrets to git

3. **Encryption**
   - Enable encryption at rest for RDS and ElastiCache
   - Use TLS for all connections
   - Enable CloudFront HTTPS only

4. **IAM**
   - Use least privilege principle
   - Separate roles for app and worker
   - Enable MFA for all IAM users

5. **Monitoring**
   - Enable CloudTrail for audit logging
   - Set up GuardDuty for threat detection
   - Configure SNS alerts for security events

## 🔄 Database Migrations in Production

Run migrations as a one-off ECS task before deploying new code:

```bash
# Create migration task definition (one-time)
aws ecs register-task-definition \
  --cli-input-json file://migrate-task-definition.json

# Run migration
aws ecs run-task \
  --cluster architecturedeck \
  --task-definition architecturedeck-migrate \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

## 📋 Deployment Checklist

- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] RDS instance provisioned
- [ ] ElastiCache cluster created
- [ ] ECR repository created
- [ ] ECS cluster and services configured
- [ ] ALB and target groups set up
- [ ] CloudFront distribution created
- [ ] Route 53 DNS configured
- [ ] SSL certificates provisioned
- [ ] Secrets stored in Secrets Manager
- [ ] CloudWatch log groups created
- [ ] Alarms and notifications configured
- [ ] CI/CD pipeline tested
- [ ] Database migrations run
- [ ] Seed data loaded (if needed)
- [ ] Health checks verified
- [ ] Auto-scaling tested
