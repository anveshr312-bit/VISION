# GLOBAL PROJECT RULES — COMPLETE CODEBASE AWARENESS

## 1. Understand Before Making Changes
For EVERY new task or prompt:
1. Inspect the current project structure.
2. Read the root README, package files, configuration files and relevant documentation.
3. Identify the existing frontend, backend, database, APIs, services, models and components.
4. Search the codebase for existing implementations related to the requested task.
5. Trace imports, dependencies, API calls and affected modules.
6. Check existing functionality before creating anything new.

Do not assume how the project works. Verify it from the actual source code.

## 2. Maintain Project Context
Maintain and update these documentation files:
- `PROJECT_MAP.md` — project structure and important files.
- `ARCHITECTURE.md` — system architecture and data flow.
- `IMPLEMENTATION_STATUS.md` — completed, pending and incomplete features.
- `API_DOCUMENTATION.md` — available endpoints and their purpose.

Read the relevant documentation at the beginning of every new task and verify it against the actual code.

Update these documents whenever architecture, APIs or major features change.

## 3. Before Editing Code
Before modifying anything:
1. Identify all affected files.
2. Understand their existing responsibilities.
3. Check whether reusable code already exists.
4. Identify possible breaking changes.
5. Explain the implementation approach briefly.
6. Preserve existing functionality.

Never create duplicate components, APIs, database models or utilities without checking existing implementations.

## 4. Complete Implementation
- Implement features in the existing architecture.
- Follow the existing coding style.
- Reuse existing components and services.
- Maintain frontend-backend compatibility.
- Handle errors and edge cases.
- Do not leave incomplete placeholders.
- Do not replace working functionality with mock implementations.
- Do not hardcode fake results.

## 5. Testing Is Mandatory
After every significant change:
1. Run relevant tests.
2. Check backend errors.
3. Check frontend errors.
4. Verify affected API endpoints.
5. Check integration with existing modules.
6. Fix issues caused by your changes.

Never claim that something works without testing it.

## 6. Avoid Unnecessary Codebase Scanning
Do not repeatedly read unrelated files, dependencies, build outputs, generated files or binary assets.

Use targeted searches and dependency tracing to understand the complete impact of a change.

For major architectural changes, perform a broader project audit.

## 7. Final Response
After completing a task, report:
- What you inspected.
- What you changed.
- Files created or modified.
- Existing functionality preserved.
- Tests executed and their results.
- Remaining issues or limitations.

---

## MOST IMPORTANT RULE
Treat every new prompt as a task inside the existing project, not as a completely new project.

Understand the relevant existing code before making changes. Never modify code based only on assumptions or the latest prompt.
