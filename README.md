
# ArchitectureDeck

An AI architecture and diagram builder for product teams

ArchDock turns either (1) a GitHub repository or (2) a plain English idea into a clear system design. It outputs a practical architecture plan, an opinionated tech stack, tradeoffs, and a high quality diagram that matches the target scale and constraints.

## Why this exists

Most teams waste time on vague “architecture brainstorming” that never becomes a concrete plan.ArchitectureDeck focuses on deliverables that help you build faster.

* A short architecture spec you can implement
* A stack recommendation aligned with constraints
* Diagrams that communicate clearly to engineers and stakeholders
* Scale-aware variants such as prototype, 1k DAU, 1M DAU

## What it does

### Inputs

You can start from either:

1. **GitHub repository URL**

   ArchitectureDeck ingests repo metadata and files to infer:

* current stack and structure
* services and modules
* data flows
* infra assumptions
* risks and missing pieces

2. **Prompt based idea**

   Example

   “Build an enterprise AI chat with SSO, RAG search over documents, and audit logs.”

### Constraints

Users can specify:

* Must use technologies such as AWS only
* Avoid technologies such as GCP or Kafka
* Preferred language such as TypeScript first or Python first
* Data constraints such as GDPR, encryption, retention
* Budget constraints such as minimal infra spend
* Team constraints such as 1 engineer vs 5 engineers

### Scale profiles

ArchitectureDeck generates architectures adapted to scale targets:

* **Prototype** : few users, fastest iteration, minimal ops
* **1,000 DAU** : reliability and observability baseline
* **1,000,000 DAU** : multi region, queues, caching, SLOs, cost control

### Outputs

ArchitectureDeck generates:

* Architecture overview and component list
* Data model suggestions
* API design suggestions
* Non functional requirements, SLOs, risks, mitigations
* Phased roadmap, MVP first then hardening
* Diagram export as Mermaid and SVG or PNG

## Core product flows

1. **Create a design**

* User uploads repo or writes a prompt
* User selects constraints and scale
* ArchitectureDeck produces a “Design” artifact plus diagram

2. **Compare options**

* Typescript first vs Python first
* Monolith vs modular services
* Build vs buy recommendations
* Tradeoff table

3. **Iterate**

* Follow up questions
* Update constraints
* Re generate diagram and plan with diffs
