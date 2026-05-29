# ChattyLinguo Mini App

Flutter web Telegram Mini App.

## Local Run

```powershell
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000
```

For local browser testing, add a Telegram user id:

```text
http://localhost:xxxxx/?telegram_user_id=1
```

## Build

```powershell
flutter build web --release --dart-define=API_BASE_URL=https://your-backend.onrender.com
```

Output:

```text
build/web
```

## Netlify

Use these settings:

```text
Base directory: mini_app
Framework Preset: Other
Build command: bash netlify_build.sh
Publish directory: build/web
```

Environment variable:

```env
API_BASE_URL=https://your-render-backend.onrender.com
```

After deploy, put the Netlify URL into backend env:

```env
MINI_APP_URL=https://your-mini-app.netlify.app
```

Then set the same URL in BotFather as the bot Menu Button.
