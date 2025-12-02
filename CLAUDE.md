# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KAPI AI Agents is a next-generation code editor built on Visual Studio Code, enhanced with intelligent AI agents for automated and collaborative software development. The project combines VS Code's proven foundation with a sophisticated multi-agent AI system designed to automate complex development tasks while keeping developers in control.

**Key Differentiators:**
- Multi-agent collaboration system with specialized agents (Coordinator, Code, UI, Data, Testing, Documentation, DevOps)
- Lightweight editor mode optimized for AI-assisted coding workflows (`src/vs/workbench/contrib/lightweightMode`)
- AI task orchestration via `.kiro/` configuration directory
- KAPI-specific customizations while maintaining upstream VS Code compatibility

## Development Commands

### Environment Setup
```bash
# First time setup
nvm install 22 && nvm use 22
corepack enable && corepack prepare pnpm@latest-1 --activate
make install  # or: pnpm install
```

### Building & Watching
```bash
# Full incremental build with hot reload (most common during development)
make watch               # Runs both watch-client and watch-extensions

# Individual watch modes
make watch-client        # Watch only core workbench/editor
make watch-extensions    # Watch only built-in extensions

# Clean compilation
make compile             # Full rebuild via Gulp

# Web-specific builds
pnpm run compile-web     # Compile web version
pnpm run watch-web       # Watch mode for web

# CLI compilation
pnpm run compile-cli     # Build CLI tools
```

### Running the Editor
```bash
# Full development loop (rebuilds, starts watcher, launches Electron)
make dev

# Launch Electron workbench after watch has built assets
pnpm run gulp electron

# Alternative launch scripts
./scripts/code.sh        # Launch with custom flags
./scripts/code-server    # Server mode
./scripts/code-web       # Web version
```

### Testing
```bash
# Unit tests
make test-node           # Node.js unit tests (Mocha)
make test-browser        # Browser unit tests (Playwright)

# Focused test execution
pnpm run test-node       # Add --grep <pattern> to filter
./scripts/test.sh --grep "lightweightMode"

# Integration tests
./scripts/test-integration.sh
./scripts/test-web-integration.sh

# End-to-end smoke tests
make smoketest           # Full smoke test suite
pnpm run smoketest-no-compile  # Skip compilation step
```

### Code Quality & Validation
```bash
# MANDATORY before any git commit or PR
make hygiene             # Runs all quality checks

# Individual checks
pnpm run eslint          # JavaScript/TypeScript linting
pnpm run stylelint       # CSS/LESS linting
pnpm run valid-layers-check     # Verify layering architecture
pnpm run compile-check-ts-native # TypeScript type checking
pnpm run monaco-compile-check   # Monaco editor type checking
pnpm run vscode-dts-compile-check # Extension API type checking
```

## Architecture

### Directory Structure

```
src/
├── vs/
│   ├── base/          # Foundation utilities, cross-platform abstractions
│   ├── platform/      # Platform services, dependency injection infrastructure
│   ├── editor/        # Monaco editor (text editing, language services, syntax)
│   ├── workbench/     # Main application workbench
│   │   ├── browser/   # Core workbench UI components (parts, layout, actions)
│   │   ├── services/  # Service implementations (DI-based)
│   │   ├── contrib/   # Feature contributions (git, debug, search, terminal, etc.)
│   │   │   └── lightweightMode/  # KAPI: Lightweight editor for AI workflows
│   │   └── api/       # Extension host and VS Code API implementation
│   ├── code/          # Electron main process
│   └── server/        # Server-specific implementation
│
extensions/            # Built-in extensions (each with own src/, test/, pnpm-lock.yaml)
├── typescript-language-features/
├── git/
├── markdown-language-features/
└── ...
│
.kiro/                 # KAPI: AI agent orchestration and task plans
├── specs/             # Feature specifications (lightweight-editor, ai-agent-panel)
├── steering/          # AI agent behavior rules and patterns
└── hooks/             # Agent integration hooks
│
build/                 # Gulp build scripts, packaging, CI/CD tools
scripts/               # Development and launch scripts
test/                  # Integration test infrastructure
cli/                   # Command-line interface
```

### Layering Architecture

The codebase follows strict layering from bottom to top:
1. **`base`** - Platform-agnostic utilities (no dependencies)
2. **`platform`** - Platform services with dependency injection
3. **`editor`** - Monaco editor implementation
4. **`workbench`** - Application UI and features

Within each module, code is organized by runtime target:
- `common/` - Platform-agnostic (shared by all)
- `browser/` - Browser-specific (depends on common)
- `node/` - Node.js-specific (depends on common)
- `electron-browser/` - Electron renderer (depends on common, browser)
- `electron-main/` - Electron main process (depends on common, node)
- `electron-utility/` - Electron utility process (depends on common, node)

**CRITICAL**: Always run `pnpm run valid-layers-check` before committing. This validates that imports respect the layering hierarchy.

### Contribution Pattern

Features are added via the **contribution model**:
1. Create a feature in `src/vs/workbench/contrib/<featureName>/`
2. Implement `*.contribution.ts` files that register with extension points
3. Use dependency injection for services (constructor parameters)
4. Register actions, commands, views, and configuration via registries

Example: `src/vs/workbench/contrib/lightweightMode/browser/lightweightMode.contribution.ts`

### Dependency Injection

All services use constructor-based dependency injection:
```typescript
constructor(
	@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
	@IConfigurationService private readonly configurationService: IConfigurationService
) { }
```

- Services must declare a service brand: `declare readonly _serviceBrand: undefined;`
- Define service interface in `common/`, implementation in `browser/` or `node/`
- Register services in the instantiation service collection

### Disposable Pattern

All resources requiring cleanup must implement `IDisposable`:
```typescript
class MyFeature extends Disposable {
	constructor() {
		super();
		this._register(someEventListener);  // Auto-disposed
	}
}
```

Use `DisposableStore` to manage multiple disposables. Always call `super.dispose()` in derived classes.

## TypeScript & Coding Standards

### Critical Rules
- **Indentation**: TABS, not spaces (except YAML/JSON which use 2 spaces)
- **Naming**: camelCase for functions/variables, PascalCase for classes/types/enums
- **Strings**: Use "double quotes" for user-facing localized strings, 'single quotes' otherwise
- **Type safety**: Avoid `any`/`unknown`. Use proper types or define new interfaces
- **Async**: Prefer `async`/`await` over `.then()` chains
- **Arrow functions**: Only use parentheses when necessary: `x => x + 1`, not `(x) => x + 1`
- **No `var`**: Use `const` by default, `let` when mutation is needed
- **Curly braces**: Always use for loops and conditionals
- **No `#private` fields**: Use TypeScript `private` keyword instead

### File Headers
All source files must include the Microsoft copyright header:
```typescript
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
```

### Localization
All user-facing strings must be externalized using `nls.localize()`:
```typescript
import { localize } from 'vs/nls';
const message = localize('myKey', "Default message with {0} placeholder", arg);
```
- NO template literals for localized strings
- NO string concatenation (use placeholders instead)

### UI Labels
Use title-style capitalization for commands, buttons, menus:
- Capitalize each word
- Don't capitalize prepositions of ≤4 letters unless first/last word
- Examples: "Open in New Window", "Search with Regex"

## Common Development Tasks

### Adding a New Feature
1. Create contribution folder: `src/vs/workbench/contrib/<featureName>/`
2. Organize by layer: `browser/`, `common/`, `test/`
3. Implement `*.contribution.ts` to register feature
4. Add tests: `<featureName>.test.ts` alongside implementation
5. Run `pnpm run valid-layers-check` to verify architecture
6. Test with `make test-node` or `make test-browser`

### Adding a New Service
1. Define interface in `src/vs/workbench/services/<serviceName>/common/`
2. Implement in `browser/` or `node/` folder
3. Add service brand: `declare readonly _serviceBrand: undefined;`
4. Register in service collection (check existing patterns in `workbench.common.main.ts`)

### Running a Single Test
```bash
# Node tests with grep filter
pnpm run test-node -- --grep "lightweightMode"

# Or use the test script directly
./scripts/test.sh --grep "your-test-pattern"
```

### Checking Compilation Errors
Start the `VS Code - Build` task (runs `Core - Build` and `Ext - Build` incrementally):
- Monitor real-time compilation errors as you make changes
- NEVER run tests if there are compilation errors
- Fix all errors before declaring work complete

### Before Committing
```bash
make hygiene              # MANDATORY: Runs all quality checks
pnpm run valid-layers-check    # Verify layering
git add <files>
git commit -m "<area>: <present-tense summary> (#issue)"
```

## KAPI-Specific Architecture

### `.kiro/` Directory
AI agent orchestration and task planning system:
- **`specs/`**: Feature specifications with requirements, design, and tasks
  - `lightweight-editor/`: Requirements for lightweight mode
  - `ai-agent-panel/`: AI agent UI panel specification
- **`steering/`**: AI agent behavior rules and coding patterns
  - `architecture-patterns.md`: Dependency injection, disposables, observables
  - `coding-standards.md`: TypeScript guidelines
  - `build-and-test.md`: Command reference
- **`hooks/`**: Agent integration hooks

### Lightweight Editor Mode
Located in `src/vs/workbench/contrib/lightweightMode/` and `src/vs/workbench/services/lightweightMode/`

**Purpose**: Simplified editor mode with reduced UI complexity, optimized for AI Agent Coding workflows. Hides non-essential UI elements while maintaining core functionality (file explorer, editor pane, terminal).

**Key Features**:
- UI element hiding (activity bar items, decorative elements)
- Mode toggle with persistence across sessions
- Configuration customization via settings
- Menu and extension UI filtering
- Git decoration and source control UI management
- Screen real estate optimization

**Implementation Status**: ~85% complete (menu filtering pending)

### Multi-Agent System
KAPI uses specialized AI agents that collaborate on different aspects of development:
1. **Coordinator Agent**: Task orchestration, conflict resolution
2. **Code Agent**: Core logic, algorithms
3. **UI Agent**: Components, styling, accessibility
4. **Data Agent**: Models, persistence, queries
5. **Testing Agent**: Unit, integration, E2E tests
6. **Documentation Agent**: Comments, API docs, guides
7. **DevOps Agent**: Build scripts, CI/CD, deployment

Agents work in parallel with automated coordination and quality gates.

## Extensions Development

Built-in extensions in `extensions/` directory follow standard VS Code extension structure:
- Each has `package.json`, `src/`, `test/`, and own `pnpm-lock.yaml`
- Run `make watch-extensions` to rebuild on changes
- Extension tests: `pnpm run test-extension`

Common extensions:
- `typescript-language-features/`: TypeScript/JavaScript language support
- `git/`: Git integration
- `markdown-language-features/`: Markdown support
- `debug-auto-launch/`: Debugging features

## Package Manager & Node Version

- **Node.js**: Version 22 (enforced via `.nvmrc`)
- **Package Manager**: pnpm 8+ (enforced via `corepack`)
- **Electron**: 39.2.3 (see `package.json`)

Use `make install` or the Makefile commands which automatically activate the correct Node version via nvm.

## Upstream Compatibility

This project maintains compatibility with VS Code upstream:
- `src/vs` mirrors the original VS Code workbench/platform/services layout
- Patches should stay aligned with upstream VS Code
- KAPI-specific code lives in:
  - `.kiro/` (agent orchestration)
  - `src/vs/workbench/contrib/lightweightMode/`
  - `src/vs/workbench/services/lightweightMode/`
  - Custom product branding in `product.json`

## Finding Code

1. **Semantic search first**: Use file search for general concepts
2. **Grep for exact strings**: Use grep for error messages or specific function names
3. **Follow imports**: Check what files import the problematic module
4. **Check test files**: Often reveal usage patterns and expected behavior
5. **Contribution points**: Look for `*.contribution.ts` files for feature registration

## Commit Message Format

Follow the existing log style:
```
<area>: <present-tense summary> (#issue)
```

Examples:
- `chat: fix editing widget toolbar actions (#280226)`
- `lightweightMode: add menu filtering support`

Keep commits scoped, include test updates, and link issues.
