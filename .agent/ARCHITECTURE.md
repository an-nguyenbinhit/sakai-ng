# Project Architecture

## Overview
This project is an Angular 21 application built using standalone components, zoneless change detection (Signals), PrimeNG components, and Tailwind CSS v4.

## Directory Structure
- `src/app/`: Core application logic.
- `src/assets/`: Static assets and global styles.
- `.agent/`: Contains agent configurations, rules, workflows, and tools designed to streamline coding for AI assistants.
  - `rules`: Custom linter or behavioral rules for code generation.
  - `skills`: Agent skill definitions (e.g. sakai-ng-development).
  - `workflows`: Step-by-step instructions for specific complex tasks.
  - `ARCHITECTURE.md`: This file.
  - `mcp_config.json`: Configuration for Model Context Protocol servers (Playwright, GitHub, etc.).

## Theming
- The layout is managed by `LayoutService` using Angular Signals.
- Theme presets are handled by PrimeUI with custom Tailwind CSS v4 integrations.
- Always use standard Tailwind utility classes for component styling. Avoid over-customizing with SCSS unless strictly necessary.

## Working with AI in this Workspace
When working as an AI Assistant in this specific project:
1. **Understand Key Guidelines**: Please read the files inside `.agent/rules/` for strict Angular 21, PrimeNG v21, and Tailwind CSS code generation rules.
2. **Utilize Workflows**: For specific complex tasks, invoke or ask the user to invoke slash commands mapped to `.agent/workflows/` (e.g., `/create-page` for `create-page.md`).
3. **Use the Development Skill**: Thoroughly execute best practices defined in `.agent/skills/sakai-ng-development/SKILL.md` before making architectural decisions.
4. **Environment Context**: This environment is equipped with MCP servers configured in `mcp_config.json`.
