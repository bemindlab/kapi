# KAPI Agent Workspace Documentation Index

The `.kapi` workspace is the main development surface for KAPI’s agent-driven workbench. The `docs/` folder underneath contains the living references you should read before editing agents, builds, or lightweight behaviors:

| File | Purpose |
| --- | --- |
| `LIGHTWEIGHT_MODE_DEV_GUIDE.md` | Notes for implementing and testing the lightweight editor mode, including services, commands, and layout integration expectations. |
| `PNPM_MIGRATION.md` | Background on how the repository moved to `pnpm`, covering workspace layout and motivation. |
| `PNPM_MIGRATION_CHECKLIST.md` | Step-by-step checklist you can reuse when migrating other workspaces or verifying a migration. |
| `PNPM_QUICK_REFERENCE.md` | Handy pnpm commands, workspace hints, and common troubleshooting items for contributors. |
| `PNPM_REFACTOR_SUMMARY.md` | Summary of the refactors that accompanied the pnpm migration, callouts to architecture changes, and follow-up work. |
| `SETUP_INSTRUCTIONS.md` | Step-by-step instructions for getting the editor running locally (environment, prerequisites, scripts). |

Keep this index updated when new docs land in `.kapi/docs`; the agent orchestration team relies on these references during planning and reviews.
