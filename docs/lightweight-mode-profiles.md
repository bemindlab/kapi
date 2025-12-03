# Lightweight Mode Profiles

This document describes the preset profile system for KAPI's Lightweight Mode feature.

## Overview

Lightweight Mode Profiles provide quick configuration switching for common use cases. Users can select from built-in presets or create and share custom profiles.

## Built-in Profiles

### Ultra Minimal
**Purpose**: Distraction-free writing and reading

**Configuration**:
- Hides: Activity bar, status bar, minimap, breadcrumbs, git decorations
- Editor focus mode: Enabled
- Status bar mode: Hidden
- Perfect for: Writing, reading code without distractions

### Focused Coding
**Purpose**: Balanced productivity with minimal distractions

**Configuration**:
- Hides: Activity bar (auto-hide), minimap
- Shows: Status bar (minimal mode), breadcrumbs, git decorations
- Editor focus mode: Disabled
- Perfect for: Daily coding with essential tools visible

### AI Pair Programming
**Purpose**: Optimized for AI agent workflows

**Configuration**:
- Hides: Activity bar, git decorations, extension recommendations, minimap, breadcrumbs
- Shows: Status bar, terminal
- Simplified menus enabled
- Perfect for: Working with AI coding assistants

### Presentation Mode
**Purpose**: Clean interface for demos and screen sharing

**Configuration**:
- Hides: Activity bar, status bar, breadcrumbs, minimap
- Clean, professional appearance
- Perfect for: Live demos, tutorials, screencasts

## Commands

All profile commands are available via the Command Palette (Cmd/Ctrl+Shift+P):

- **Select Lightweight Mode Profile**: Browse and apply profiles
- **Save Current as Profile**: Save current configuration as custom profile
- **Delete Lightweight Mode Profile**: Remove custom profiles
- **Export Lightweight Mode Profile**: Export profile to JSON file
- **Import Lightweight Mode Profile**: Import profile from JSON file

## Status Bar Integration

When a profile is active, the status bar shows:
- Profile icon and name
- Click to open profile selector
- Visual indicator of current profile

## Profile Format

Profiles are stored as JSON with the following structure:

```json
{
  "name": "My Custom Profile",
  "description": "Description of what this profile does",
  "icon": "codicon-name",
  "configuration": {
    "enabled": true,
    "hideActivityBar": true,
    "hideStatusBar": false,
    "hideMinimap": true,
    "hideBreadcrumbs": true,
    "hideGitDecorations": false,
    "hideExtensionRecommendations": true,
    "simplifyMenus": true,
    "simplifyContextMenus": true,
    "customizations": {
      "hiddenParts": [],
      "hiddenMenuItems": [],
      "hiddenContextMenuItems": []
    },
    "activityBarBehavior": "auto",
    "statusBarMode": "minimal",
    "editorFocusMode": false,
    "menuFavorites": []
  }
}
```

## Creating Custom Profiles

1. Configure lightweight mode settings manually
2. Open Command Palette
3. Run "Save Current as Profile"
4. Enter profile name and description
5. Profile is saved and available for reuse

## Sharing Profiles

### Export
1. Open Command Palette
2. Run "Export Lightweight Mode Profile"
3. Select profile to export
4. Choose location to save JSON file

### Import
1. Open Command Palette
2. Run "Import Lightweight Mode Profile"
3. Select JSON file to import
4. Profile becomes available in custom profiles list

## Storage

- **Active Profile**: Stored in workspace storage (persists across sessions)
- **Custom Profiles**: Stored in user storage (syncs across workspaces)
- **Built-in Profiles**: Defined in code, cannot be modified or deleted

## API

### ILightweightModeProfileService

Main service for profile management:

```typescript
interface ILightweightModeProfileService {
	// Events
	onDidChangeActiveProfile: Event<string | undefined>;
	onDidChangeProfiles: Event<void>;

	// Profile management
	getProfiles(): ILightweightModeProfile[];
	getProfile(id: string): ILightweightModeProfile | undefined;
	getActiveProfileId(): string | undefined;

	// Actions
	applyProfile(profileId: string): Promise<void>;
	saveCurrentAsProfile(name: string, description: string): Promise<ILightweightModeProfile>;
	deleteProfile(profileId: string): Promise<boolean>;
	clearActiveProfile(): Promise<void>;

	// Import/Export
	exportProfile(profileId: string): string | undefined;
	importProfile(json: string): Promise<ILightweightModeProfile>;

	// Filtering
	getBuiltInProfiles(): ILightweightModeProfile[];
	getCustomProfiles(): ILightweightModeProfile[];
}
```

### Profile Interface

```typescript
interface ILightweightModeProfile {
	id: string;
	name: string;
	description: string;
	icon: string;
	configuration: ILightweightModeConfiguration;
	isBuiltIn: boolean;
	createdAt?: number;
}
```

## Implementation Details

### Service Registration
- Registered as singleton in `workbench.common.main.ts`
- Uses InstantiationType.Delayed for performance
- Dependencies: ILightweightModeService, IStorageService, IConfigurationService

### State Management
- Active profile ID stored in workspace storage
- Custom profiles stored as JSON array in user storage
- Configuration updates applied directly to VS Code settings

### Validation
- Profile names must be non-empty
- Configuration structure validated on import
- Type checking for all configuration fields
- Invalid profiles skipped during load

### Events
- `onDidChangeActiveProfile`: Fired when profile is applied or cleared
- `onDidChangeProfiles`: Fired when custom profiles list changes (add/delete/import)

## Use Cases

### Individual Developers
- Switch between focused coding and presentation modes
- Create custom profiles for different projects
- Quick configuration changes without manual settings

### Teams
- Share team-standard profiles via export/import
- Consistent configuration across team members
- Onboard new developers with preset configurations

### AI Workflows
- Use AI Pair Programming profile for agent-assisted coding
- Optimized UI for AI coding tools
- Clean interface reduces noise in AI context

## Future Enhancements

Potential future additions:
- Profile keyboard shortcuts
- Profile auto-switching based on workspace
- Profile templates gallery
- Cloud sync for custom profiles
- Profile versioning and updates
