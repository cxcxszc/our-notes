# 💌 Our Notes

A private real-time shared notes app for couples — built with Next.js 15, Firebase, Framer Motion, and Tailwind CSS.

---

## Setup Guide

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create a new project
2. Enable **Authentication** → Sign-in method → Email/Password
3. Enable **Cloud Firestore** → Start in production mode
4. Enable **Realtime Database** → Start in locked mode
5. Copy your Firebase config keys

### 2. Environment Variables

Create a `.env.local` file in the root (copy from `.env.local.example`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Security Rules

In Firebase Console:

**Firestore Rules** → paste contents of `firestore.rules`

**Realtime Database Rules** → paste contents of `database.rules.json`

### 4. Firestore Indexes

In Firestore → Indexes → Composite, add:

- Collection: `notes`
- Fields: `pairId ASC`, `pinned DESC`, `createdAt DESC`

### 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option A: Vercel CLI (Fastest)

```bash
npm i -g vercel
vercel
```

Then add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Option B: GitHub + Vercel Dashboard

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables
4. Deploy

---

## PWA Icons

Replace the placeholder icons in `/public/icons/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

---

## Features

- 🔐 Firebase Auth (register, login, password reset)
- 💑 Pair code system to connect two users
- 📝 Real-time shared notes (create, edit, delete, pin)
- ❤️ Emoji reactions synced in real time
- 🟢 Live online/offline presence
- 💌 Floating widget showing latest partner note
- ⚡ Quick-send buttons (I Love You, Miss You, etc.)
- 📱 PWA — installable on iOS & Android
- 🌙 Dark mode, glassmorphism, Framer Motion animations
