# Website Stack Runbook

## What Runs Where
- Owner Dashboard app (`education-center-management`): `http://localhost:4200`
- Public Website app (`remix_-edumanage-pro`): `http://localhost:3000`
- Backend API (`be-edu`): `http://localhost:18080`
- PostgreSQL container used by backend: `localhost:5433` (`be_edu` / `beedu` / `beedu`)

Hero and Features are in the **Public Website app** on port `3000`, not in the owner dashboard on `4200`.

## Start Backend (`be-edu`)
```bash
cd /home/hussein/Public/be-edu
DB_URL=jdbc:postgresql://localhost:5433/be_edu \
DB_USERNAME=beedu \
DB_PASSWORD=beedu \
SERVER_PORT=18080 \
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200 \
./mvnw spring-boot:run
```

## Start Public Website (`remix_-edumanage-pro`)
```bash
cd /home/hussein/Public/remix_-edumanage-pro
npm install
npm run dev
```

## Start Owner Dashboard (`education-center-management`)
```bash
cd /home/hussein/Public/education-center-management
npm install
npm start
```

## Verify End-to-End
1. Open Owner Dashboard: `http://localhost:4200/owner/web-settings`
2. Save Draft or Publish changes.
3. Open Public Website: `http://localhost:3000/`
4. Refresh and verify Hero/Features changes.

## Quick API Check
```bash
curl -sS http://localhost:18080/api/v1/public/website-settings/platform-owner | jq '.hero, (.features | length), .marketing'
```

Expected:
- `.hero.visible` should be `true`
- `.features` length should be greater than `0`
