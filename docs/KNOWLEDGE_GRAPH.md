# BrandMind Knowledge Graph

The BrandMind Knowledge Graph connects major BrandMind objects into a workspace-scoped semantic graph without adding a graph database. The implementation projects the current persistence layer into graph nodes and relationships behind repository interfaces so a dedicated graph store can be introduced later without changing API consumers.

## Scope

All graph reads are scoped through the existing workspace filter and permission preflight. Legacy unscoped deployments continue to see only legacy records. The graph currently includes:

- Workspace, Brand, Brand Identity, Mission, Campaign, Workflow, Workflow Step
- Agent, Skill, Tool, Provider
- Memory, Insight, Asset, Review, Approval, Task, Department, Document, Prompt-ready records
- Customer Persona, Goal, and Experience Brain nodes

## Relationships

The relationship registry includes the requested semantic links:

- Brand owns Campaign
- Campaign contains Workflow
- Workflow contains Tasks
- Task assigned to Agent
- Agent uses Skills
- Skill uses Tools
- Tool uses Provider
- Campaign produces Assets
- Assets belong to Brand
- Assets receive Reviews
- Reviews update Experience Brain
- Memory references Brand
- Insights reference Campaign
- Goals create Workflows

Additional operational relationships, such as Workspace contains Brand, Brand has Identity, Department owns Task, and Agent routes to Memory, are emitted where current product data makes those relationships explicit.

## Architecture

`backend/app/knowledge_graph.py` defines the graph registry, relationship registry, graph repository interface, Mongo-backed repository, search helper, and related-object helper. The repository reads existing collections only; it does not create a graph database or duplicate authoritative records.

Key integration points:

- **Current persistence layer:** reads brands, Mission Control plans/tasks, Output Factory assets, Knowledge Base records, workflow runs, and intelligence events.
- **Memory Router:** graph snapshots include routed CEO memory context and memory-brain nodes rather than bypassing the router.
- **Brand Identity Engine:** brand identity nodes are generated from `identity_service.merged_dna()` and include completeness data.
- **Mission Control:** plans become campaign, mission, and goal nodes; Mission Control tasks become task, workflow, workflow-step, department, and agent relationships.
- **Permission framework:** API routes preflight with the existing permission policy before returning graph data.

## API

All routes are mounted under `/api` and are workspace aware through `X-Workspace-Id` plus the existing auth context.

- `GET /knowledge-graph/registry` returns entity types, relationship types, interface names, workspace id, and permission decision.
- `GET /knowledge-graph` returns `{ nodes, edges, integrations, workspace_id }`.
- `GET /knowledge-graph/search?q=&entity_type=&limit=` returns matching graph nodes.
- `GET /knowledge-graph/related/{node_id}` returns directly connected nodes and edges.
- `GET /knowledge-graph/visualization` returns visualization-friendly `{ nodes, links, workspace_id }`.

## Frontend

The Knowledge Explorer UI is available at `/knowledge-graph` and provides:

- Entity Explorer
- Relationship Viewer
- Graph Search
- Semantic Navigation
- Related Assets Panel
- Related Campaigns Panel
- Related Memories Panel
- Visualization API summary

## Future Graph Database Migration

The UI and API consume graph operations through the graph repository facade. A future implementation can add Neo4j, ArangoDB, PostgreSQL graph extensions, or vector-augmented graph storage by implementing the same repository methods and keeping the route contracts stable.
