# Backend Run Steps (`be-edu`)

## Backend Project
- Path: `/home/hussein/Public/be-edu`
- Port: `18080`
- DB: `localhost:5433` (`be_edu` / `beedu` / `beedu`)

## 1) Start backend
```bash
cd /home/hussein/Public/be-edu

DB_URL='jdbc:postgresql://localhost:5433/be_edu' \
DB_USERNAME='beedu' \
DB_PASSWORD='beedu' \
SERVER_PORT='18080' \
CORS_ALLOWED_ORIGINS='http://localhost:3000,http://localhost:4200' \
OAUTH_GOOGLE_CLIENT_ID='1023917046083-m537ekp0k21r59cnntu4kcf9jkvqnjj9.apps.googleusercontent.com' \
OAUTH_GOOGLE_CLIENT_SECRET='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' \
OAUTH_MICROSOFT_CLIENT_ID='placeholder-ms-client-id' \
OAUTH_MICROSOFT_CLIENT_SECRET='placeholder-ms-client-secret' \
./mvnw spring-boot:run
```

Notes:
- Microsoft OAuth vars must be non-empty, otherwise Spring boot fails at startup.
- Replace Microsoft placeholders with real values when available.

## 2) Verify backend is running
```bash
ss -ltnp | rg ':18080'
```

Expected: a `java` process listening on `*:18080`.

## 3) Verify API response
Public plans endpoint:
```bash
curl -i http://localhost:18080/api/v1/public/plans
```

Expected: `HTTP/1.1 200` with JSON array.

## 4) Stop backend
If running in terminal, press `Ctrl + C`.

If running in background:
```bash
lsof -i :18080 -t | xargs -r kill -9
```

## 5) Quick health check note
`/actuator/health` is not exposed in current config (returns 404), so use `/api/v1/public/plans` for runtime verification.
