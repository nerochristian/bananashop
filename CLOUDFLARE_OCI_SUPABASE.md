# Roblox Keys Deployment: Cloudflare + OCI + Supabase

## Architecture
- Frontend: Cloudflare Pages (`banana-store`)
- Bot + API bridge: Oracle OCI VM (`python main.py`)
- Database: Supabase Postgres (`DATABASE_URL`)

Both bot models and shop storage use the same Supabase project:
- Bot ORM tables: `guild_configs`, `tickets`, etc.
- Shop API data table: `shop_kv` (products/orders/pending payments JSON)

---

## 1) Oracle OCI: run bot + API

```bash
git clone <your-repo>
cd bananashop
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Required OCI `.env` values:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DATABASE_URL=postgres://...supabase.co.../postgres?sslmode=require`
- `BOT_API_KEY`
- `BOT_API_HOST=0.0.0.0`
- `BOT_API_PORT=8080`
- `FRONTEND_ORIGINS=https://robloxkeys.store,https://www.robloxkeys.store,https://<pages-project>.pages.dev`
- `SHOP_STORAGE_BACKEND=supabase`
- `OXAPAY_MERCHANT_API_KEY`

Optional:
- `SHOP_KV_TABLE=shop_kv`
- `WEBSITE_CHAT_CHANNEL_ID`
- `WEBSITE_ORDER_CHANNEL_ID`

---

## 2) Cloudflare API hostname to OCI

Recommended: Cloudflare Tunnel from OCI:
- Route `api.robloxkeys.store` -> `http://localhost:8080`

Then verify:
- `https://api.robloxkeys.store/api/bot/health`
- `https://api.robloxkeys.store/shop/health`

---

## 3) Cloudflare Pages frontend

Project settings:
- Root directory: `banana-store`
- Build command: `npm run build`
- Output directory: `dist`

Pages env vars:
- `VITE_BOT_API_URL=https://api.robloxkeys.store`
- `VITE_BOT_API_PREFIX=/api/bot`
- `VITE_BOT_API_KEY=<same BOT_API_KEY>`
- `VITE_STORE_API_URL=https://api.robloxkeys.store`
- `VITE_STORE_API_PREFIX=/shop`
- `VITE_STORE_API_KEY=<same BOT_API_KEY>`

Domain:
- `robloxkeys.store`
- `www.robloxkeys.store`

SPA routes are already configured via `banana-store/public/_redirects`.

---

## 4) Supabase notes

- Keep SSL enabled in URL (`sslmode=require` is fine).
- Bot code normalizes connection params.
- API bridge auto-creates `shop_kv` table on startup when `SHOP_STORAGE_BACKEND=supabase`.

---

## 5) Quick checks

- Open `https://robloxkeys.store/vault` directly (should load app, not 404).
- Buy test product with OxaPay.
- Confirm order appears in:
  - website vault
  - `shop/health` order count
  - bot order logs channel (if configured)
