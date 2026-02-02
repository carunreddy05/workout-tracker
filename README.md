# Trackfit Workout Tracker

A modern workout logging and coaching web app focused on performance tracking, exercise flows, and session reviews. The UI is optimized for mobile with a dark, neon-accented visual system and a streamlined workout entry pipeline.

## Highlights
- Guided workout flow: select split, pick exercise categories, log sets, and review before saving.
- Mobile-first layout with bottom navigation and quick workout CTA.
- Calendar and history views for training consistency and progress.
- Firebase-backed persistence for workout entries and user-specific data.

## Tech Stack
- Frontend: React 19, Vite 6, React Router 7
- Styling: Tailwind CSS v4, custom CSS modules
- Animations: Framer Motion
- Backend/DB: Firebase + Firestore
- Charts: Recharts
- UI icons: Lucide
- Utilities: date-fns, axios
- Carousel: react-slick + slick-carousel

## Key Routes
- / : Welcome
- /login : Sign in
- /register : Sign up
- /dashboard : Performance dashboard
- /entry : Log workout (final review & save)
- /history : Workout history
- /workouts/select : Workout split selection
- /workouts/push-day : Exercise categories
- /workouts/chest : Exercise list + set logging

## Scripts
- npm run dev : Start local dev server
- npm run build : Production build
- npm run preview : Preview production build
- npm run lint : Lint codebase
- npm run seed:testqa : Seed test data

## Notes
- Firebase configuration is expected in the project (see src/firebase.js).
- Exercise selections can be staged in localStorage and reviewed on the log page before saving.

