# Frontend modules

Feature code lives under `src/modules/<name>/`. The shell auto-loads each module; you do not edit shared route or menu catalogs.

## Start a new module

1. Copy `_skeleton` to a new folder, e.g. `src/modules/inventory`.
2. Find and replace placeholders:
    - `example` → your module slug (paths, keys)
    - `Example` → PascalCase names (stores, services, components)
    - `example.items` → permission entity (must match backend), e.g. `inventory.items`
3. Keep these files (same pattern as Reports / Core):
    - `index.js` — exports `{ name, routes }`
    - `routes/routes.js` — Vue routes with `meta.permission`
    - `menu.js` — sidebar items and `permissions`
    - `permissions.js` — role matrix section (optional `presetKey`)
    - `services/`, `stores/`, `views/`, `components/` as needed

## How it wires in

| File             | Loaded by                                                           |
| ---------------- | ------------------------------------------------------------------- |
| `index.js`       | `src/routes/routes.js` (`import.meta.glob('@/modules/*/index.js')`) |
| `menu.js`        | `src/layout/AppMenu.vue`                                            |
| `permissions.js` | `src/modules/administration/utils/permissionMatrix.js`              |

Routes and menu entries are hidden until the user has the permissions you declare.

## Work on a module branch

- Change only files under your `src/modules/<name>/` when possible.
- Align permission strings with backend `Config/permissions.php` for that module.
- Use shared UI from `@/components/`; avoid editing other modules unless you need a shared API change.

## Reference

Use `reports` or `core` as full examples. Use `_skeleton` as the minimal template.
