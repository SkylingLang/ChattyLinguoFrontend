# ChattyLinguo

Telegram AI English tutor plus Telegram Mini App.

## What is included

- FastAPI backend for Telegram webhook and Mini App API.
- aiogram Telegram bot with commands: `/start`, `/menu`, `/unlimited`, `/voice`, `/level`, `/topics`, `/saved`, `/stats`, `/help`, `/reset`, `/language`.
- PostgreSQL data model for users, settings, messages, saved words, subscriptions, payments, topics, grammar explanations, and pronunciation scores.
- OpenAI service layer for chat replies, correction, explanation, pronunciation scoring, translation, dictionary entries, transcription, and TTS.
- Flutter web Mini App frontend with Profile, Saved, Stars, Language, and Settings tabs.

## Backend setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
docker compose up -d postgres
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Update `.env` with:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `API_BASE_URL`
- `MINI_APP_URL`

## Mini App setup

```powershell
cd mini_app
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000
```

For local browser testing, open:

```text
http://localhost:xxxxx?telegram_user_id=1
```

The user must exist first, normally created by `/start` in Telegram. During development you can create one by calling the bot flow or inserting a test user.

## Webhook

Set Telegram webhook to:

```text
https://your-domain.com/telegram/webhook
```

Use `TELEGRAM_WEBHOOK_SECRET` as the Telegram secret token.

## PostgreSQL tables

The backend does not auto-create tables. Use the SQLAlchemy models in `app/models/` as the table reference and create the PostgreSQL tables in pgAdmin, or optionally generate migrations with Alembic later.

## Architecture

```text
app/
  api/routes/       FastAPI route modules for Mini App and webhook
  bot/              aiogram bot factory, keyboards, handlers
  core/             settings/configuration
  db/               SQLAlchemy engine/session
  models/           database models
  repositories/     database access helpers
  schemas/          Pydantic API contracts
  services/         OpenAI, tutor, stats, subscription logic
mini_app/
  lib/              Flutter source
  web/              Flutter web shell
  vercel.json       Vercel build config
```

## Next production steps

- Add Alembic migrations instead of `create_all` startup creation.
- Replace placeholder payment checkout URL with Telegram Payments, Stripe, or another provider.
- Store generated TTS files in object storage and send audio replies from Telegram handlers.
- Validate Telegram Mini App `initData` on every Mini App API request.
