# Lightweight Mode - User Onboarding

## Overview

The Lightweight Mode onboarding system provides an interactive first-run experience to help new users discover and understand the feature. It includes a welcome notification, an interactive walkthrough, and contextual help.

## Components

### 1. First-Install Notification

**Location**: `src/vs/workbench/contrib/lightweightMode/browser/lightweightModeOnboarding.ts`

The `LightweightModeOnboardingContribution` handles first-install detection and displays a welcome notification when the user first launches VS Code after the feature is installed.

**Features**:
- Shows once per installation (tracked via `IStorageService`)
- Offers three actions:
  - "Take a Tour" - Opens the interactive walkthrough
  - "Learn More" - Opens settings for lightweight mode
  - "Dismiss" - Closes the notification
- Can be disabled via configuration: `workbench.lightweightMode.onboarding.enabled`
- Storage key: `workbench.lightweightMode.onboarding.firstInstallShown`

**Testing**: The contribution includes a `resetFirstInstall()` method for testing and re-onboarding scenarios.

### 2. Interactive Walkthrough

**Location**: `src/vs/workbench/contrib/lightweightMode/browser/lightweightModeWalkthrough.ts`

A multi-step guided tour using VS Code's walkthrough system. The walkthrough includes 5 steps:

1. **What is Lightweight Mode?**
   - Introduction to the feature
   - Key benefits overview
   - Visual comparison (SVG)

2. **How to Toggle**
   - Multiple ways to activate/deactivate
   - Keyboard shortcuts
   - Command palette usage
   - Interactive toggle button
   - Completion tracked via `onCommand:workbench.action.toggleLightweightMode`

3. **Customize Your Experience**
   - Configuration options overview
   - Link to settings
   - Completion tracked via `onCommand:workbench.action.openSettings`

4. **Try It Yourself**
   - Hands-on practice
   - Interactive toggle
   - Completion tracked via toggle command

5. **Learn More & Get Help**
   - Links to settings and keyboard shortcuts
   - Additional resources
   - Documentation references

**Media**: Each step includes a custom SVG graphic located in `media/walkthrough/`:
- `lightweightMode.svg` - Introduction graphic
- `toggle.svg` - Toggle methods illustration
- `settings.svg` - Configuration panel
- `try.svg` - Interactive try prompt
- `help.svg` - Help resources

### 3. Help Actions

**Location**: `src/vs/workbench/contrib/lightweightMode/browser/lightweightModeActions.ts`

Two new actions provide quick access to help:

- **Open Lightweight Mode Walkthrough** (`workbench.action.openLightweightModeWalkthrough`)
  - Category: Help
  - Opens the walkthrough at any time
  - Available via Command Palette (F1)

- **Open Lightweight Mode Settings** (`workbench.action.openLightweightModeSettings`)
  - Category: Preferences
  - Opens settings filtered to lightweight mode
  - Available via Command Palette (F1)

### 4. Status Bar Integration

**Location**: `src/vs/workbench/contrib/lightweightMode/browser/lightweightModeStatusBarContribution.ts`

The status bar indicator now includes contextual help:
- Enhanced tooltip with "Right-click for help and settings"
- When clicked, opens toggle or profile selection
- Provides visual feedback that lightweight mode is active

## Configuration

### `workbench.lightweightMode.onboarding.enabled`

**Type**: `boolean`
**Default**: `true`
**Description**: Enable first-time onboarding notifications and walkthrough for lightweight mode.

When disabled, the first-install notification will not be shown, but users can still access the walkthrough manually via the Command Palette.

## Architecture

### Registration

The walkthrough is registered in `lightweightMode.contribution.ts` via the `LightweightModeWalkthroughRegistration` contribution. This runs during the `LifecyclePhase.Restored` phase to ensure all necessary services are available.

### Storage Keys

- `workbench.lightweightMode.onboarding.firstInstallShown` (Application scope, Machine target)
  - Tracks whether the first-install notification has been displayed

### Service Dependencies

The onboarding system requires:
- `IStorageService` - For tracking first-install state
- `INotificationService` - For showing welcome notifications
- `ICommandService` - For executing walkthrough and settings commands
- `IConfigurationService` - For reading onboarding.enabled setting
- `ILifecycleService` - For waiting until workbench is restored
- `IWalkthroughsService` - For registering the walkthrough

## Testing

### Unit Tests

**Location**: `src/vs/workbench/contrib/lightweightMode/test/browser/lightweightModeOnboarding.test.ts`

The test suite covers:
1. First-install notification display
2. Subsequent run behavior (no notification)
3. Configuration respect (onboarding.enabled)
4. Reset functionality

Run tests with:
```bash
make test-node -- --grep "lightweightMode.*Onboarding"
```

### Manual Testing

1. **First-Install Flow**:
   - Clear storage: Delete workspace storage or use incognito
   - Launch VS Code
   - Verify welcome notification appears
   - Click "Take a Tour" and verify walkthrough opens

2. **Walkthrough Navigation**:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Search for "Open Lightweight Mode Walkthrough"
   - Navigate through all 5 steps
   - Click interactive buttons
   - Verify completion tracking

3. **Configuration**:
   - Set `workbench.lightweightMode.onboarding.enabled` to `false`
   - Clear first-install flag
   - Reload VS Code
   - Verify no notification shown

4. **Help Actions**:
   - Open Command Palette
   - Verify "Open Lightweight Mode Walkthrough" appears under Help category
   - Verify "Open Lightweight Mode Settings" appears under Preferences category

## Future Enhancements

Potential improvements for the onboarding experience:

1. **Enhanced Media**: Replace placeholder SVGs with professional graphics showing before/after comparisons
2. **Video Tutorials**: Add video media type for more dynamic demonstrations
3. **Telemetry**: Track walkthrough completion rates and drop-off points
4. **Contextual Tips**: Show tips when users first toggle lightweight mode
5. **Onboarding Surveys**: Collect feedback after walkthrough completion
6. **Progressive Disclosure**: Show advanced features in a second-level walkthrough
7. **Personalization**: Offer different walkthrough paths based on user role (developer, writer, etc.)

## Localization

All user-facing strings use the `localize()` function from `vs/nls`. To add translations:

1. Extract strings from the source files
2. Add translations to language pack files
3. Test with different locale settings

Key localization keys:
- `lightweightMode.welcome.*` - Welcome notification strings
- `lightweightMode.walkthrough.*` - Walkthrough content
- `lightweightMode.tooltipHelp` - Status bar help text
- `openLightweightModeWalkthrough` - Command label
- `openLightweightModeSettings` - Command label

## Troubleshooting

### Notification Not Showing

- Check `workbench.lightweightMode.onboarding.enabled` is `true`
- Verify storage key is not set (first install only)
- Check lifecycle phase is reaching `Restored`

### Walkthrough Not Appearing

- Verify walkthrough registration in contribution file
- Check that `IWalkthroughsService` is available
- Look for errors in Developer Tools console

### Media Not Loading

- Verify SVG files exist in `media/walkthrough/` directory
- Check file paths in walkthrough definition
- Ensure URI conversion in registration is correct

## References

- [VS Code Walkthrough API](../../welcomeGettingStarted/README.md)
- [Notification Service](../../../../platform/notification/common/notification.ts)
- [Storage Service](../../../../platform/storage/common/storage.ts)
- [Lightweight Mode Documentation](../../README.md)
