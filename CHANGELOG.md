# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Monorepo root setup with Turborepo and pnpm workspaces.
- `.cursor/rules` and agent context files.
- 4 Cursor skills installed.

### Added

- Scaffolded `apps/react-v19` (Vite 8, React 19, TypeScript, port 5173, createRoot).
- Scaffolded `apps/react-v16` (Vite 8, React 16, TypeScript, port 5174, ReactDOM.render).
- Added `postcss.config.js` to both apps to resolve Vite 8 PostCSS config search issue.
- Both dev servers verified running in parallel via Turborepo.

### Added

- Added `apps/shell` - a plain Vite + TypeScript iframe shell at port 3000 that displays `apps/react-v16` (port 5174) and `apps/react-v19` (port 5173) side by side; confirmed both React versions rendering correctly (React 16.14.0 and React 19.2.5).

### Added

- Tailwind CSS 4 installed via `@tailwindcss/vite` plugin at root; applied to all three apps (`react-v16`, `react-v19`, `shell`); verified rendering with utility classes in all three iframes.