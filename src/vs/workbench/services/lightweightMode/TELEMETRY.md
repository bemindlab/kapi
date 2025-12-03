# Lightweight Mode Telemetry

This document describes the telemetry tracking implemented for the Lightweight Mode feature.

## Overview

Telemetry tracking has been added to understand how users interact with Lightweight Mode. All telemetry respects user privacy preferences and only sends data when telemetry is enabled.

## Tracked Metrics

### 1. Toggle Events (`lightweightMode/toggled`)

Tracks when users toggle Lightweight Mode on or off.

**Data Collected:**
- `enabled` (boolean): Whether mode was enabled or disabled
- `from` (string): How the toggle was initiated (e.g., 'command', 'keybinding', 'configuration')
- `sessionCount` (number): Number of times mode has been toggled in the current session

**Purpose:** Understand toggle frequency and usage patterns.

### 2. Session Duration (`lightweightMode/sessionDuration`)

Tracks how long users keep Lightweight Mode enabled.

**Data Collected:**
- `durationMs` (number): Duration of the session in milliseconds
- `toggleCount` (number): Number of toggles during this session
- `configChanges` (number): Number of configuration changes during this session

**Purpose:** Understand typical session lengths and user engagement.

**Triggered When:**
- Mode is toggled off
- Service is disposed (e.g., VS Code shutdown)

### 3. Configuration Changes (`lightweightMode/configChanged`)

Tracks which settings users customize.

**Data Collected:**
- `settingKey` (string): The configuration key that was changed (e.g., 'hideActivityBar')
- `newValue` (string): The type of the new value ('boolean', 'string', 'array', 'number', 'undefined')
- `isEnabled` (boolean): Whether Lightweight Mode is currently enabled

**Purpose:** Understand which settings are most commonly customized.

**Note:** Only the value type is tracked, not the actual value, to preserve privacy.

### 4. First Toggle (`lightweightMode/firstToggle`)

Tracks the time from installation to first use.

**Data Collected:**
- `timeToFirstToggleMs` (number): Time from first session to first toggle in milliseconds
- `enabledOnFirstToggle` (boolean): Whether the first toggle enabled or disabled the mode

**Purpose:** Understand feature discoverability and time-to-value.

**Triggered Once:** Only the very first time a user toggles Lightweight Mode.

## Privacy Compliance

All telemetry follows VS Code's privacy guidelines:

1. **User Consent**: Telemetry is only sent when users have opted in via `telemetry.telemetryLevel` setting
2. **No PII**: No personally identifiable information is collected
3. **Type-Only Values**: Configuration values are only tracked by type (e.g., 'boolean'), not actual values
4. **Aggregated Data**: All metrics are designed for aggregated analysis

## GDPR Classifications

All telemetry events use the following GDPR classifications:
- **Classification**: SystemMetaData
- **Purpose**: FeatureInsight
- **Owner**: vscode

## Implementation Details

### Service Integration

The `LightweightModeService` has been updated to include:
- `ITelemetryService` dependency injection
- Session tracking (start time, toggle count, config change count)
- Automatic session end tracking on disposal

### Storage Keys

- `workbench.lightweightMode.firstSession`: Timestamp of first session (APPLICATION scope)
- `workbench.lightweightMode.firstToggle`: Timestamp of first toggle (APPLICATION scope)

These keys are used to calculate time-to-first-toggle metrics.

## Testing

Comprehensive tests have been added in:
`/src/vs/workbench/services/lightweightMode/test/browser/lightweightModeTelemetry.test.ts`

Tests cover:
- Toggle event tracking
- Session duration tracking
- Configuration change tracking
- First toggle tracking
- Privacy compliance (no PII in events)
- Session counter resets

## Example Telemetry Events

### Toggle Event
```typescript
{
  eventName: 'lightweightMode/toggled',
  data: {
    enabled: true,
    from: 'command',
    sessionCount: 1
  }
}
```

### Session Duration Event
```typescript
{
  eventName: 'lightweightMode/sessionDuration',
  data: {
    durationMs: 3600000,  // 1 hour
    toggleCount: 2,
    configChanges: 3
  }
}
```

### Configuration Change Event
```typescript
{
  eventName: 'lightweightMode/configChanged',
  data: {
    settingKey: 'hideActivityBar',
    newValue: 'boolean',  // Type only, not actual value
    isEnabled: true
  }
}
```

### First Toggle Event
```typescript
{
  eventName: 'lightweightMode/firstToggle',
  data: {
    timeToFirstToggleMs: 86400000,  // 1 day
    enabledOnFirstToggle: true
  }
}
```

## Future Enhancements

Potential future telemetry additions:
- Menu filtering usage patterns
- Profile switching metrics
- Performance impact measurements
- Error/exception tracking
