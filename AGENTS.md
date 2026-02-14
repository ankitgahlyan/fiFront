# Agent Guidelines for fiSvelte

> This file provides instructions for AI agents working in this repository.

## MCP Servers

### Svelte MCP Server

This project uses Svelte 5 and SvelteKit with comprehensive MCP tooling:

**Available Tools:**

1. **list-sections** - Use FIRST to discover documentation sections
2. **get-documentation** - Retrieves full docs for specific sections
3. **svelte-autofixer** - MUST use after writing Svelte code; call repeatedly until no issues
4. **playground-link** - Generates Svelte Playground links (ask user before using)

**Workflow:**

- For Svelte/SvelteKit questions: Call `list-sections` first
- Analyze use_cases from results, then fetch relevant docs with `get-documentation`
- Always run `svelte-autofixer` on Svelte files before completing

### Context7 MCP

Always use Context7 MCP when needing library/API documentation, code generation, or setup/configuration steps.

## Commands

### Build & Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Testing

```bash
npm run test         # Run all tests (unit + e2e)
npm run test:unit    # Run Vitest unit tests
npm run test:unit -- --run              # Run once (CI mode)
npm run test:unit -- --run src/demo.spec.js  # Run single test file
npm run test:e2e     # Run Playwright e2e tests
npx vitest --run src/path/to/specific.test.js  # Run single test
```

### Lint & Format

```bash
npm run lint         # Check Prettier + ESLint
npm run format       # Auto-format with Prettier
npm run check        # Svelte type-checking
npm run check:watch  # Type-checking in watch mode
```

## Code Style

### Formatting (Prettier)

- **Indentation:** Tabs (not spaces)
- **Quotes:** Single quotes
- **Trailing commas:** None
- **Print width:** 100
- **Parser plugins:** `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`

### TypeScript

- **Strict mode:** Enabled
- **Module resolution:** Bundler
- **Allow/check JS:** Yes
- Path aliases via SvelteKit config

### Naming Conventions

- **Components:** PascalCase (`Button.svelte`, `Transfer.svelte`)
- **Stores:** camelCase, exported as singletons (`lottery.ts`, `tonconnect.ts`)
- **Utils:** camelCase (`utils.ts`, `crypto.ts`)
- **Routes:** Lowercase with `+page.svelte` pattern
- **Types:** PascalCase with `.ts` extension
- **Constants:** UPPER_SNAKE_CASE (`ENDPOINT`, `LOTTERY_ADDRESS`)

### Imports (Order matters)

1. Svelte/SvelteKit modules
2. Third-party libraries
3. Local `$lib/` imports
4. Relative imports (avoid when possible)

```typescript
import { onMount } from 'svelte';
import { fromNano } from '@ton/core';
import { getFiJetton } from '$lib/stores/fi';
import type { FiJettonData } from '$lib/FossFiWallet';
```

### Error Handling

- Use typed errors with `e: any` for caught exceptions
- Provide descriptive error messages
- Use `console.error` for debugging in stores
- Throw errors in async functions for caller handling

```typescript
try {
	// operation
} catch (e: any) {
	error = e.message || 'Failed to fetch state';
	console.error('Operation failed:', error);
}
```

### Svelte 5 Patterns

- Use `$state()` for reactive variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props
- Use `{@render children()}` for slots

### Component Structure

```svelte
<script lang="ts">
	// 1. Imports
	// 2. Types/Interfaces
	// 3. Props with $props()
	// 4. Reactive state with $state()
	// 5. Derived state with $derived()
	// 6. Effects with $effect()
	// 7. Functions
</script>

<template>
	<!-- Component markup -->
</template>

<style>
	/* Component styles */
</style>
```

### ESLint Rules

- Follows `eslint-plugin-svelte` recommended config
- Prettier integration enabled
- Ignores files from `.gitignore`
- Globals: browser + node environments

### Testing Standards

- **Unit tests:** Vitest with browser testing support
- **Pattern:** `*.spec.{js,ts}` or `*.test.{js,ts}`
- **Component tests:** Use `vitest-browser-svelte` for Svelte components
- **Location:** Co-locate with source or in `e2e/` directory
- Use `describe` and `it` blocks with descriptive names
- Use `expect.element()` for DOM assertions in browser tests

## Project Structure

```
src/
  lib/
    components/       # Reusable UI components
      ui/            # shadcn/ui components
      fiJetton/      # Domain-specific components
    stores/          # Svelte stores
    utils/           # Utility functions
    *.ts             # Domain models (FossFi, lottery-contract, etc.)
  routes/            # SvelteKit routes
  app.d.ts          # Global type declarations
  app.css           # Global styles
```

## Key Dependencies

- **Framework:** Svelte 5, SvelteKit
- **Styling:** TailwindCSS 4, Skeleton UI, shadcn-svelte
- **Blockchain:** @ton/ton, @ton/core, @tonconnect/ui
- **Testing:** Vitest (browser mode), Playwright
- **Forms:** sveltekit-superforms, formsnap
