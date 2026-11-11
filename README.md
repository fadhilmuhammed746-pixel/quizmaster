# Quizly

Quizly is a responsive, game-inspired Quiz Master frontend prototype built with React, TypeScript, and Vite. Its dashboard is designed to work on desktop, tablet, and mobile screens.

## Run locally

```sh
npm install
npm run dev
```

Create a production bundle with `npm run build`. Run `npm run lint` for the configured Oxlint checks.

## Demo walkthrough

- Use **Demo view** at the bottom of the sidebar to switch between the Admin and Student views.
- In the Admin view, open **All students** to search and filter the sample roster, add students, prepare a separate admin invite, or remove a student.
- New student usernames are checked for uniqueness in the current in-memory roster.
- Use the moon/sun button in the header to switch the interface theme.
- Overview cards, leaderboard, quiz entry points, reminders, and the original CSS mascot artwork demonstrate the intended product experience.

## Scope and next steps

This is a UI prototype, not a production authentication or student-record system. Demo role switching is not authorization. Roster changes are held in browser memory and reset on reload. Admin invitations only demonstrate the interface; passwords, profile uploads, email verification, QR IDs, persistence, quizzes, exports, analytics, rewards, and notifications are not connected to a backend.

Before using real student data, connect a secure API and database, enforce roles server-side, hash passwords with a suitable password-hashing algorithm, validate and rate-limit authentication flows, use private storage for profile photos, and add privacy/retention policies. The friendly 3D-style mascots are original CSS illustrations; no external model or image assets are required.
