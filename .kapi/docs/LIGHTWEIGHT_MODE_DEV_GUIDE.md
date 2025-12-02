# Lightweight Mode - Development Guide

## 🚀 Getting Started

### Prerequisites

Before running the development environment, you need to install dependencies:

```bash
pnpm install
```

This will install all required packages including:
- TypeScript compiler
- Gulp build system
- Test frameworks
- Development dependencies

### Running Development Mode

Once dependencies are installed, you have several options:

#### Option 1: Watch Mode (Recommended for Development)
```bash
pnpm run watch
```
This will:
- Compile TypeScript files automatically on changes
- Watch both client and extension code
- Enable hot reload for faster development

#### Option 2: Watch Client Only
```bash
pnpm run watch-client
```
Watches only the workbench client code (faster if you're not modifying extensions).

#### Option 3: Compile Once
```bash
pnpm run compile
```
Compiles all code once without watching for changes.

### Running VS Code with Your Changes

After compilation, run VS Code from source:

```bash
./scripts/code.sh
# or on Windows:
.\scripts\code.bat
```

### Testing the Lightweight Mode Feature

1. **Start VS Code from source** (after compilation)

2. **Open Command Palette** (`F1` or `Cmd/Ctrl+Shift+P`)

3. **Type**: "Toggle Lightweight Editor Mode"

4. **Press Enter** to enable the mode

5. **Observe the changes**:
   - Activity bar should hide (if configured)
   - Status bar shows "⚡ Lightweight" indicator
   - Minimap disappears
   - Breadcrumbs hide
   - Git decorations are suppressed

6. **Toggle again** to restore normal mode

### Configuration

Open Settings (`Cmd/Ctrl+,`) and search for "lightweight mode" to configure:

```json
{
  "workbench.lightweightMode.enabled": true,
  "workbench.lightweightMode.hideActivityBar": true,
  "workbench.lightweightMode.hideStatusBar": false,
  "workbench.lightweightMode.hideMinimap": true,
  "workbench.lightweightMode.hideBreadcrumbs": true,
  "workbench.lightweightMode.hideGitDecorations": true,
  "workbench.lightweightMode.hideExtensionRecommendations": true
}
```

## 🧪 Running Tests

### Browser Tests
```bash
pnpm run test-browser -- --grep "LightweightMode"
```

### All Tests
```bash
pnpm run test-browser
```

## 📁 File Structure

```
src/vs/workbench/
├── services/lightweightMode/
│   ├── common/
│   │   └── lightweightMode.ts          # Service interface
│   └── browser/
│       └── lightweightModeService.ts   # Service implementation
│
└── contrib/lightweightMode/
    ├── browser/
    │   ├── lightweightMode.contribution.ts          # Main registration
    │   ├── lightweightModeActions.ts                # Commands
    │   ├── lightweightModeLayoutContribution.ts     # Part visibility
    │   ├── lightweightModeEditorContribution.ts     # Editor settings
    │   ├── lightweightModeScmContribution.ts        # Git decorations
    │   ├── lightweightModeDebugContribution.ts      # Debug UI
    │   ├── lightweightModeExtensionContribution.ts  # Extension UI
    │   ├── lightweightModeStatusBarContribution.ts  # Status indicator
    │   └── lightweightModeStateManager.ts           # State persistence
    │
    ├── test/browser/
    │   ├── lightweightModeService.test.ts           # Service tests
    │   ├── lightweightModeLayoutContribution.test.ts # Layout tests
    │   └── lightweightModeProperties.test.ts        # Property tests
    │
    └── README.md                                     # Feature docs
```

## 🔧 Development Workflow

### Making Changes

1. **Edit source files** in `src/vs/workbench/`
2. **Watch mode will auto-compile** (if running `pnpm run watch`)
3. **Reload VS Code** window (`Cmd/Ctrl+R` in development)
4. **Test your changes**

### Adding New Features

1. **Update the service interface** if needed:
   - `src/vs/workbench/services/lightweightMode/common/lightweightMode.ts`

2. **Implement in the service**:
   - `src/vs/workbench/services/lightweightMode/browser/lightweightModeService.ts`

3. **Create or update a contribution**:
   - Add new file in `src/vs/workbench/contrib/lightweightMode/browser/`

4. **Register the contribution**:
   - Update `lightweightMode.contribution.ts`

5. **Add tests**:
   - Create test file in `test/browser/`

6. **Update documentation**:
   - Update README.md

### Debugging

1. **Open VS Code from source**
2. **Press `F5`** to start debugging
3. **Set breakpoints** in your TypeScript files
4. **Use Developer Tools** (`Help > Toggle Developer Tools`)

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
pnpm install
```

### TypeScript compilation errors
```bash
pnpm run compile-check-ts-native
```

### Tests not running
```bash
# Install test dependencies
pnpm run test-browser  # This will install playwright
```

### Changes not reflecting
1. Make sure watch mode is running
2. Reload the VS Code window (`Cmd/Ctrl+R`)
3. Check the terminal for compilation errors

## 📊 Performance Tips

### Faster Compilation
- Use `watch-client` instead of `watch` if not modifying extensions
- Close unnecessary files in your editor
- Use incremental compilation (automatic in watch mode)

### Faster Testing
- Run specific tests with `--grep` flag
- Use `test-browser-no-install` after first run

## 🎯 Quick Commands Reference

```bash
# Development
pnpm run watch              # Watch all files
pnpm run watch-client       # Watch client only
pnpm run compile            # Compile once

# Testing
pnpm run test-browser       # Run browser tests
pnpm run test-node          # Run Node tests

# Running
./scripts/code.sh          # Run VS Code from source

# Validation
pnpm run compile-check-ts-native  # Type check
pnpm run valid-layers-check       # Architecture check
```

## 📚 Additional Resources

- **VSCode Contributing Guide**: `CONTRIBUTING.md`
- **Architecture Docs**: `src/vs/workbench/README.md`
- **Feature Spec**: `.kiro/specs/lightweight-editor/`
- **Feature README**: `src/vs/workbench/contrib/lightweightMode/README.md`

## ✅ Verification Checklist

Before submitting changes:

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Feature works in development build
- [ ] Documentation is updated
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Accessibility is maintained

## 🎉 You're Ready!

The Lightweight Mode feature is fully implemented and ready for development. Follow the steps above to start the dev environment and test the feature.

Happy coding! 🚀
