# Task 1: Project Scaffolding

**Reference:** [requirements.md](../requirements.md)

## Objective
Create and configure a Tauri v2 desktop application with React, TypeScript, Tailwind CSS, and all required dependencies. The result is a buildable, runnable skeleton app with routing in place.

## Steps

### 1. Create Tauri v2 Project
Run the following command and select the options: TypeScript, React, pnpm.

```powershell
pnpm create tauri-app comic-shelf
```

Choose:
- Frontend language: **TypeScript / JavaScript (pnpm)**
- UI template: **React**
- UI flavor: **TypeScript**

Since we're already in the `comic-shelf` directory, move project files from the nested folder to the root if needed.

### 2. Install Frontend Dependencies

```bash
pnpm add @tanstack/react-router @tanstack/router-plugin @tanstack/react-form @tanstack/react-hotkeys tailwindcss @tailwindcss/vite @tauri-apps/plugin-sql @tauri-apps/plugin-store @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/api
```

### 3. Install Tauri Plugins (Rust side)

In `src-tauri/`, add the following to `Cargo.toml` dependencies:

```toml
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-store = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
```

Register all plugins in `src-tauri/src/lib.rs`:

```rust
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            SqlBuilder::default()
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4. Configure Tailwind CSS v4

Install Tailwind CSS v4 with the Vite plugin approach:

In `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
})
```

Create `src/index.css`:
```css
@import "tailwindcss";
```

### 5. Configure TanStack Router (File-Based Routing)

Create route directory structure:
```
src/
  routes/
    __root.tsx
    index.tsx
```

`src/routes/__root.tsx`:
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
})
```

`src/routes/index.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <div>Comic Viewer</div>,
})
```

Update `src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
```

### 6. Configure Tauri Permissions

In `src-tauri/capabilities/default.json`, add the required permissions:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    "store:default",
    "dialog:default",
    "dialog:allow-open",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-read-file",
    "fs:allow-read-dir",
    "fs:allow-write-file",
    "fs:allow-mkdir",
    "fs:allow-exists",
    "fs:allow-remove"
  ]
}
```

Note: The `fs` plugin requires scope configuration for reading arbitrary user directories. You'll need to add a broad scope or use `fs:scope-home-recursive` or a custom scope. Because this app reads user-chosen directories, add:

```json
"fs:read-all",
"fs:scope-home-recursive"
```

### 7. Verify Build

Run `pnpm tauri dev` to confirm the app boots without errors.

## Acceptance Criteria
- Tauri v2 project with React + TypeScript compiles and runs
- Tailwind CSS classes work in components
- TanStack Router file-based routing generates route tree
- All Tauri plugins are registered and their permissions configured
- The app opens a window showing the index route
