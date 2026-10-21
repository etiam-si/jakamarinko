# jakamarinko

npm workspaces monorepo:
- `apps/web`: Next.js (jakamarinko.com)
- `apps/api`: the shared backend, Hono under `/api` (jakamarinko.com/api), used by web and the mobile app
- `packages/shared`: types shared by all apps
- `apps/mobile`: Expo, not added yet

```
npm install
npm run dev:api     # :3001
npm run dev:web     # :3000, proxies /api to :3001
npm run typecheck && npm test && npm run build
```

Deploys to t4a on every push to `main`. See [infra/README.md](infra/README.md).

What the app should become: [docs/product.md](docs/product.md) (draft). Content and prices: [docs/content/jaka-marinko.md](docs/content/jaka-marinko.md).
