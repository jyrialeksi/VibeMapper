# Deployment Guide

## Prerequisites

- [Fly.io CLI](https://fly.io/docs/flyctl/install/) installed and authenticated
- A Google/Firebase account

## Steps

### 1. Fly.io App Setup (DONE)

```bash
fly auth login
fly launch --no-deploy
fly volumes create data --size 1 --region ams
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → Add project
2. Enable **Authentication** → Sign-in method → **Google** → Enable
3. Go to Project Settings → **Service accounts** → Generate new private key
4. Note down from the downloaded JSON:
   - `project_id`
   - `client_email`
   - `private_key`
5. Go to Project Settings → **General** → Your apps → Add **Web app**
6. Note down from the Firebase config object:
   - `apiKey`
   - `authDomain`

### 3. Set Fly.io Secrets

```bash
fly secrets set \
  OPENROUTER_API_KEY=sk-or-v1-your-key \
  FIREBASE_PROJECT_ID=your-project-id \
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
  VITE_FIREBASE_API_KEY=AIza... \
  VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
```

> Note: `VITE_FIREBASE_*` vars are public (safe to expose) — they're baked into the frontend build.

### 4. Deploy

```bash
fly deploy
```

The app will be available at `https://user-story-mapper.fly.dev`.

### 5. Add Fly.io Domain to Firebase

1. Go to Firebase Console → Authentication → Settings → **Authorized domains**
2. Add `user-story-mapper.fly.dev`

### 6. (Optional) Custom Domain

```bash
fly certs add your-domain.com
```

Then add the CNAME record shown by Fly.io to your DNS provider. Also add the custom domain to Firebase authorized domains.

## Local Development

No Firebase setup needed — auth is disabled by default:

```bash
npm run dev
```

To test with auth locally, add to `backend/.env`:

```
AUTH_ENABLED=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

## Useful Fly.io Commands

```bash
fly status              # App status
fly logs                # Live logs
fly ssh console         # SSH into the machine
fly volumes list        # Check persistent volume
fly secrets list        # List set secrets (values hidden)
```
