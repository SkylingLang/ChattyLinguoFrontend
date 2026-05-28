# ChattyLinguo Mini App React

Next.js Telegram Mini App version of the ChattyLinguo frontend.

## Local Run

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:3000?telegram_user_id=1
```

The user must exist in the backend first, normally created by `/start` in Telegram.

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

For Vercel, set:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
```

## Deploy

Use Vercel with:

```text
Root Directory: mini_app_react
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
```
