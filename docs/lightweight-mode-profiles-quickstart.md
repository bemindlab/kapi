# Lightweight Mode Profiles - Quick Start Guide

## What Are Profiles?

Profiles are pre-configured sets of lightweight mode settings that you can switch between instantly. Think of them as themes for your workspace layout.

## Built-in Profiles

### Ultra Minimal
**Best for**: Writing docs, reading code
- Everything hidden except the editor
- Maximum focus, zero distractions

### Focused Coding
**Best for**: Daily development work
- Essential tools visible (status bar, breadcrumbs)
- Activity bar auto-hides when not needed
- Balanced productivity

### AI Pair Programming
**Best for**: Working with AI coding assistants
- Clean interface optimized for AI tools
- No distracting decorations
- Terminal and status bar visible

### Presentation Mode
**Best for**: Demos, tutorials, screensharing
- Professional clean appearance
- Minimal UI elements
- Perfect for recordings

## Quick Actions

### Switch Profiles
1. Press `Cmd/Ctrl + Shift + P`
2. Type "Select Profile"
3. Pick from the list
4. Done!

**Faster**: Click the profile indicator in the status bar (bottom right)

### Create Your Own Profile
1. Set up lightweight mode how you like it
2. `Cmd/Ctrl + Shift + P` → "Save Current as Profile"
3. Give it a name and description
4. Use it anytime!

### Share with Team
**Export:**
1. `Cmd/Ctrl + Shift + P` → "Export Profile"
2. Select profile to export
3. Save JSON file
4. Share file with team

**Import:**
1. Get JSON file from teammate
2. `Cmd/Ctrl + Shift + P` → "Import Profile"
3. Select the file
4. Profile added to your list!

## Status Bar Indicator

When a profile is active, you'll see it in the status bar:
- **Icon + Name**: Shows current profile
- **Click**: Quick switch to another profile
- **No profile**: Shows "Lightweight" with lightning bolt icon

## Tips

- Start with a built-in profile closest to your needs
- Create custom profiles for different projects
- Export and back up your favorite profiles
- Share team profiles via Git (add to `.vscode/profiles/`)

## Common Questions

**Q: Can I edit built-in profiles?**
A: No, but you can apply one, tweak settings, and save as custom profile.

**Q: Where are custom profiles stored?**
A: In your VS Code user settings, synced across workspaces.

**Q: Can I delete built-in profiles?**
A: No, but you can ignore them. Only custom profiles can be deleted.

**Q: What happens if I manually change settings?**
A: The active profile indicator clears, showing you're in manual mode.

## All Commands

- **Select Lightweight Mode Profile**
- **Save Current as Profile**
- **Delete Lightweight Mode Profile**
- **Export Lightweight Mode Profile**
- **Import Lightweight Mode Profile**

Access via Command Palette (`Cmd/Ctrl + Shift + P`)

## Example Workflow

```
Morning Standup:
→ Switch to "Presentation Mode"
→ Screen share with clean UI

Feature Development:
→ Switch to "Focused Coding"
→ See what you need, hide the rest

AI Pair Programming:
→ Switch to "AI Pair Programming"
→ Optimized for Copilot/Claude

Documentation:
→ Switch to "Ultra Minimal"
→ Pure focus on writing
```

## Need Help?

See full documentation: `docs/lightweight-mode-profiles.md`
