# Lightweight Editor Mode

A feature that optimizes VS Code for AI Agent Coding workflows by hiding non-essential UI elements.

## Overview

Lightweight Editor Mode provides a cleaner, more focused interface by hiding UI elements that are not necessary for AI-assisted development. This reduces visual clutter and helps developers focus on code and AI interactions.

## Features

### UI Elements Hidden

When lightweight mode is enabled, the following UI elements can be hidden (configurable):

- **Activity Bar**: The sidebar with icons for Explorer, Search, Source Control, etc.
- **Status Bar**: The bottom bar showing file info, errors, etc.
- **Minimap**: The code overview in the editor
- **Breadcrumbs**: The file path navigation at the top of the editor
- **Git Decorations**: File status indicators in the file explorer
- **Extension Recommendations**: Notification prompts to install extensions

### Essential Elements Preserved

The following elements remain visible to ensure core functionality:

- **File Explorer**: Access to your project files
- **Editor Pane**: The main code editing area
- **Terminal**: Command line access
- **Command Palette**: Full access to all commands

## Usage

### Toggle Lightweight Mode

1. Open Command Palette (`F1` or `Cmd/Ctrl+Shift+P`)
2. Type "Toggle Lightweight Editor Mode"
3. Press Enter

### Status Bar Indicator

When lightweight mode is active, a "⚡ Lightweight" indicator appears in the status bar. Click it to toggle the mode.

### Configuration

All settings are under `workbench.lightweightMode.*`:

```json
{
  "workbench.lightweightMode.enabled": false,
  "workbench.lightweightMode.hideActivityBar": true,
  "workbench.lightweightMode.hideStatusBar": false,
  "workbench.lightweightMode.hideMinimap": true,
  "workbench.lightweightMode.hideBreadcrumbs": true,
  "workbench.lightweightMode.hideGitDecorations": true,
  "workbench.lightweightMode.hideExtensionRecommendations": true,
  "workbench.lightweightMode.simplifyMenus": true,
  "workbench.lightweightMode.simplifyContextMenus": true
}
```

## Architecture

### Service Layer

- **ILightweightModeService**: Core service managing mode state and configuration
- **LightweightModeService**: Implementation with event emitters and configuration management

### Contribution Layer

- **LightweightModeLayoutContribution**: Manages workbench part visibility (activity bar, status bar)
- **LightweightModeEditorContribution**: Controls editor-specific settings (minimap, breadcrumbs)
- **LightweightModeScmContribution**: Manages source control decorations
- **LightweightModeDebugContribution**: Handles debug UI elements
- **LightweightModeExtensionContribution**: Controls extension-related UI
- **LightweightModeStatusBarContribution**: Displays mode indicator
- **LightweightModeStateManager**: Persists and restores previous UI state

### State Management

When lightweight mode is activated:
1. Current UI state is captured
2. Configured elements are hidden
3. State is persisted to storage

When deactivated:
1. Previous state is retrieved
2. Hidden elements are restored
3. State is cleared

## Implementation Details

### Event-Driven Architecture

All contributions listen to `onDidChangeLightweightMode` events and react immediately, ensuring changes apply without restart.

### Configuration Persistence

Settings are stored in user configuration and persist across sessions. The mode state itself is also persisted.

### Graceful Degradation

If any UI element fails to hide/show, the error is logged but doesn't prevent other elements from being processed.

## Future Enhancements

- Menu and context menu filtering
- More granular control over individual UI elements
- Keyboard shortcuts for quick toggling
- Integration with Zen Mode
- Profile-specific lightweight mode configurations
