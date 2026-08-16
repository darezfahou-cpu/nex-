# Nexora dashboard + admin console addition

This patch adds the authenticated customer dashboard and separate admin console to the existing Nexora Express Flow project.

## Routes

Customer:
- `/dashboard`
- `/dashboard/shipments`
- `/dashboard/shipments/:id`

Admin (any authenticated account):
- `/admin`
- `/admin/shipments`
- `/admin/shipments/new`
- `/admin/shipments/:id`
- `/admin/customers`
- `/admin/tracking`

## Main files added

- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/dashboard.shipments.tsx`
- `src/routes/_authenticated/dashboard.shipments.$id.tsx`
- `src/routes/_authenticated/admin.tsx`
- `src/routes/_authenticated/admin.shipments.tsx`
- `src/routes/_authenticated/admin.shipments.new.tsx`
- `src/routes/_authenticated/admin.shipments.$id.tsx`
- `src/routes/_authenticated/admin.customers.tsx`
- `src/routes/_authenticated/admin.tracking.tsx`

`src/routeTree.gen.ts` was updated for the added TanStack routes.

The existing Supabase migration already contains the requested model where every authenticated account can use the admin data policies. The customer dashboard UI filters its list to the signed-in user's `user_id`; the admin console lists all shipments.

## Install/run

Use the package manager already used by the project (Bun is indicated by `bun.lock`).

```bash
bun install
bun run dev
```

Do not commit `.env` to GitHub. Keep the existing environment variables in your local/deployment environment.
