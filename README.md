# KAPI AI Agents - AI-Powered Code Editor

A next-generation code editor built on Visual Studio Code, enhanced with intelligent AI agents for automated and collaborative software development.

<p align="center">
  <img alt="KAPI AI Agents in action" src="https://user-images.githubusercontent.com/35271042/118224532-3842c400-b438-11eb-923d-a5f66fa6785a.png">
</p>

## What is KAPI AI Agents?

KAPI AI Agents combines the proven VS Code foundation with a sophisticated multi-agent AI system designed to automate complex development tasks while keeping you in control. Whether you're building web applications, mobile apps, or system software, KAPI's specialized AI agents work alongside you to accelerate development.

### Core Capabilities

* **AI-Powered Automation** - Intelligent agents handle code generation, refactoring, and optimization
* **Multi-Agent Collaboration** - Specialized agents work in parallel on different aspects of your project
* **Context-Aware Intelligence** - Deep understanding of your codebase, architecture, and dependencies
* **Human-in-the-Loop** - Full control with AI assistance, not replacement
* **Universal Language Support** - Works with any programming language or framework

## Key Features

* **Intelligent Code Generation** - Write, refactor, and optimize code with AI assistance
* **Automated Testing** - Generate comprehensive test suites automatically
* **Smart Debugging** - AI-powered error detection and fix suggestions
* **Live Documentation** - Keep documentation synchronized with code changes
* **Code Quality Automation** - Continuous quality checks and improvements
* **Custom Agent Creation** - Build specialized agents for your workflow

## Contributing

Contributions are welcome! You can help by:

* Reporting bugs and requesting features
* Contributing to the AI agent framework
* Sharing custom agent configurations
* Improving documentation and examples

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on building, testing, and submitting pull requests.

## Getting Started

### Environment Setup

```bash
git clone https://github.com/your-org/kapi-ai-agents.git
cd kapi-ai-agents
nvm install 22 && nvm use 22
corepack enable && corepack prepare pnpm@latest-1 --activate
make install
```

### Local Development Loop

```bash
# Incremental web + desktop builds with hot reload
make watch

# Run only the client or extension pipelines
make watch-client
make watch-extensions

# Launch the Electron workbench once assets are built
pnpm run gulp electron
```

Use `make compile` for a clean build, `make test-node` / `make test-browser` for focused suites, and `make smoketest` before shipping. For AI agent customization, see the `.kiro` directory documentation.

## Multi-Agent Development System

KAPI AI Agents uses specialized AI agents that collaborate to handle different aspects of software development simultaneously.

### How It Works

* **Parallel Execution** - Multiple agents work on different tasks concurrently
* **Specialized Roles** - Each agent focuses on its domain expertise
* **Automated Coordination** - Intelligent orchestration and conflict resolution
* **Quality Gates** - Automated validation before integration
* **Continuous Sync** - Documentation and tests stay current with code

### Agent Types

1. **Coordinator Agent** - Task orchestration, conflict resolution, user interaction
2. **Code Agent** - Core application logic, business rules, algorithms
3. **UI Agent** - User interfaces, components, styling, accessibility
4. **Data Agent** - Data models, persistence, queries, migrations
5. **Testing Agent** - Unit tests, integration tests, E2E tests, coverage
6. **Documentation Agent** - Code comments, API docs, README files, guides
7. **DevOps Agent** - Build scripts, CI/CD, deployment configs, infrastructure

### Workflow Example

```
User Request → Coordinator Agent
    ↓
    ├─→ Code Agent (core functionality)
    ├─→ UI Agent (user interface)
    ├─→ Data Agent (data layer)
    └─→ Testing Agent (test coverage)
    ↓
Coordinator Agent (integration & review)
    ↓
Documentation Agent (update docs)
    ↓
DevOps Agent (deployment prep)
    ↓
Final Review → Deployment
```

### Why Multi-Agent?

* **Speed** - Parallel execution accelerates development
* **Quality** - Domain expertise applied to each component
* **Consistency** - Unified standards across the codebase
* **Automation** - Testing and documentation handled automatically
* **Focus** - Less context switching, more flow state

## Extensions & Language Support

Built on VS Code's extension ecosystem with AI enhancements:

* All standard VS Code extensions in the [extensions](extensions) folder
* AI-enhanced code completion and intelligent suggestions
* Automated refactoring and code optimization
* Smart error detection with fix recommendations
* Context-aware navigation and search

## Development Environment

### Dev Containers

Use the included dev container for a consistent development environment:

* **Dev Containers**: Use the "Clone Repository in Container Volume" command
* **GitHub Codespaces**: Create a new codespace from this repository

**Requirements**: 4+ CPU cores, 6-8GB RAM recommended

See [.devcontainer/README.md](.devcontainer/README.md) for details.

## Feature Roadmap

The KAPI AI Agents team is actively evolving the editor around three focus areas:

1. **Multi-agent orchestration** – extend the `.kiro` configuration to let new agents participate in task planning, dependencies, and conflict resolution without touching the core VS Code runtime.
2. **Native AI workflows** – add out-of-the-box automation for testing, documentation, and DevOps around the `extensions/` agent shell so agents can produce runnable smoke tests and CI-friendly artifacts.
3. **Experience polish** – keep enhancing the workbench with agent-backed UI improvements (see `src/vs/workbench/contrib/lightweightMode`) while ensuring feature updates pass through `make watch`/`pnpm run compile` and the existing hygiene checks.

Each feature line maps back to existing directories (`extensions`, `.kiro`, `src/vs`, `build/`) so follow that structure when adding new agents or automation code. Document completed plans in `README.md` (or `AGENTS.md` for contributor guidance) and update tests under `test/`, `extensions/*/test`, or `test/unit` before requesting reviews.

## Architecture

KAPI AI Agents reuses the VS Code architecture while layering in the agent orchestration, branding, and tooling work needed to run the lightweight editor.

* `src/` – Core editor runtime and AI agent framework (TypeScript/ESM). The `src/vs` tree mirrors the original workbench/platform/services layout so patches stay aligned with upstream VS Code.
  * `src/kapi/` contains the main KAPI-specific development files, agent integrations, and customization hooks used to build the lightweight, AI-enhanced workbench.
* `extensions/` – Built-in extensions (with their own `src`, `test`, and `pnpm-lock.yaml`) that each plug into the agent-powered workflow.
* `.kiro/` – AI task plans, policies, and behavior steering rules that tell the multi-agent system how to approach problems.
* `cli/` – Command-line tooling for launching agent workflows, CLI servers, and automation assistants.
* `build/` – Gulp-based build/watch scripts, packaging logic (electron bundle, distros), and helper utilities (like the new `ensureElectron` helper).

We now provide `make dev` to run the lightweight development loop: it rebuilds native addons (e.g., `@vscode/policy-watcher`), starts `pnpm run watch-client`, ensures the Electron runtime is ready via `pnpm run gulp electron`, and finally launches `./scripts/code.sh`, keeping the watcher alive until you close the app. This mirrors the upstream VS Code flow while adding the agent-oriented flavor of KAPI.

## License

Based on Visual Studio Code - Open Source ("Code - OSS")

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the [MIT](LICENSE.txt) license.

KAPI AI Agents enhancements and AI automation features are built upon this foundation.
