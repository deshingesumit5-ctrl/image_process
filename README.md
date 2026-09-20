# Image Process (monorepo)

Two apps share **one MySQL database** (`image_admin_web`) and a Laravel REST API. The GitHub repo `deshingesumit5-ctrl/image_process` was empty, so this is a **single-repo** layout:

```
image_process/
├── admin_panel_web/     Laravel 12 + Blade (Tailwind) admin
├── image_app/           Expo / React Native (Android first)
└── processing_service/  Python FastAPI image engine
```

## Decisions

- **One database**, not two. The mobile app calls Laravel APIs instead of syncing a second schema.
- **Image engine (Option B):** local Python service on port `8001`. Pillow is required. `rembg` is optional — without it, near-white studio backgrounds are knocked out as a fallback. Swap in a paid API later by changing `REMBG_URL`.
- **Output sizes** (change in `.env` after client confirmation): Horizontal **1600×1200**, Vertical **1200×1600**.
- **Auth:** session cookies on the web panel; Sanctum tokens on the app.

Local DB credentials live only in `admin_panel_web/.env` (`root` / `111`). Do not commit that file.

## Admin panel

```bash
cd admin_panel_web
composer install
copy .env.example .env   # Windows
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Login: `admin@image.test` / `password`  
Sales: `sales@image.test` / `password`

## Processing service

```bash
cd processing_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

Optional ML: `pip install rembg`

## Android app

Point `image_app/app.json` `extra.apiUrl` at your machine:

- Android emulator: `http://10.0.2.2:8000/api`
- Physical device: `http://YOUR_LAN_IP:8000/api`

```bash
cd image_app
npm install
npx expo start --android
```

## Git

Remote: `https://github.com/deshingesumit5-ctrl/image_process.git`

Use VS Code Source Control to review, commit per module, and push. Do not commit `.env`.
