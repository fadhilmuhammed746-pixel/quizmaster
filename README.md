# QuizVerse

QuizVerse is a responsive, game-inspired Quiz Master frontend prototype built with React, TypeScript, and Vite. Its visual design follows the supplied QuizVerse reference: warm paper colors, bold outlined cards, playful characters, role-specific sign-in, and animated 3D-style cube artwork.

## Run locally

```sh
npm install
npm run dev
```

Create a production bundle with `npm run build`. Run `npm run lint` for the configured Oxlint checks.

Students can register a profile with a unique username. Profiles, rewards, quiz history, and preferences are stored in browser local storage.

## Included prototype features

- Student registration, sign-in, password reset, generated student IDs, and optional profile pictures
- Student dashboard, daily rewards, randomized timed quizzes, bookmarks, negative marking, results, and answer review
- Global, school, class, friends, and date-range leaderboards; badges, a coin shop, analytics, a printable report, and a QR-style student card
- Separate Admin and Quiz Master navigation, student search/filter/add/remove/disable, coin awards, password reset, CSV export, announcements, question management, and aggregate analytics
- Responsive layout, dark/light theme toggle, and animated character artwork

## Scope and security

This is a **frontend-only demonstration**, not production authentication or storage. The sign-in screen intentionally does not display account credentials. Passwords are SHA-256 hashed in local storage, but a client-side hash is not a production authentication system: there is no server-side authorization, password-hardening, email verification, or recovery. Roles and all student data can be changed by the browser user. The password reset flow is a local demo, not an email-based recovery flow. Never enter real student records or sensitive information.

Before using real users or data, connect a secure backend and database, enforce roles server-side, use a password-hashing algorithm designed for passwords, implement verified account recovery and access controls, secure image storage, and establish privacy/retention policies. The QR-style graphic is decorative and not a standards-compliant ID QR code.
