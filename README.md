# Iron Progress

Prompt for Lovable: Weightlifting Workout Management Web Application

Build a full-stack weightlifting workout management web application with user authentication, persistent storage, and a dark, intense design inspired by extreme lifting, combat sports, and high-performance training. The application must be mobile-first, touch-friendly, and fully responsive, while also providing a polished experience on desktop browsers.

Core Requirements
Authentication & Data Ownership

App starts with a login / sign-up page

All data (exercises, workouts, routines, logs, analytics) is:

Private to the logged-in user by default

Only visible to others if explicitly shared

Enforce per-user data isolation in the database

Pages & Features
1. Enter an Exercise Page

Used to create and manage individual exercise configurations.

Features:

Exercise selector pre-populated with 50+ common weightlifting exercises

Inputs for:

Starting weight

Number of sets

Weight per set (auto-filled, editable)

Weight increment/decrement amount

Workout type:

Timed workout

Manual completion

If timed:

Duration (minutes/seconds)

Rest time between sets

Save button persists the exercise to the database

Exercises are reusable across workouts

2. Create a Workout Page

Used to assemble weekly routines.

Features:

Select a day of the week

Add exercises from the user’s exercise library

Reorder exercises (drag-and-drop on mobile and desktop)

Remove exercises from a day

Save button stores the weekly routine

Share button:

Makes routine publicly visible

Other users can browse and select shared routines (read-only)

3. Workout Page (Primary Experience)

Main page shown after login.

Behavior:

If no routine is selected:

Show a modal listing personal and shared routines

Prompt user to select one

Automatically detect current day of the week

Queue the first exercise for the day

UI Elements:

Large, prominent exercise image or animation

Display:

Exercise name

Current set number

Target weight

Primary Start button

Workout Flow:

Timed workouts:

Show a countdown clock

Manual workouts:

Show a Done button

Completion triggers:

Boxing bell sound

Automatic progression to next set or exercise

Difficulty Feedback:

Too Hard button:

Records feedback

Reduces weight for next occurrence

Too Easy button:

Records feedback

Increases weight for next occurrence

4. Charts & Analytics Page

Provides insight into training progress and performance.

Features:

Visual charts and summaries based on logged workout data

Charts include:

Weight progression per exercise over time

Volume lifted per workout and per week

Workout consistency (days trained per week)

Frequency of “Too Easy” vs “Too Hard” feedback

Filters:

Exercise

Date range (week, month, custom)

Mobile-friendly charts with tap interactions

Desktop charts with hover tooltips

Summary stats:

Personal bests

Most trained exercises

Average weight increases over time

Data & Logging
Exercise Completion Logs

Each completed set or exercise records:

User ID

Date and time

Exercise

Set number

Weight used

Completion type (timed/manual)

Difficulty feedback (Too Hard / Too Easy / Neutral)

These logs drive automatic weight adjustments and analytics.

Mobile & Desktop Design Requirements
Mobile-First

Optimized for one-handed use

Large buttons for Start / Done / Too Easy / Too Hard

Swipe or tap interactions where appropriate

Minimal text during active workouts

Bottom navigation for key pages:

Workout

Enter Exercise

Create Workout

Analytics

Desktop Enhancements

Wider layouts with side navigation or top navigation

Drag-and-drop exercise ordering with mouse support

Expanded charts and detailed tables on analytics page

Design & UX

Dark mode by default

High-contrast typography

Strong visual hierarchy

Fast transitions and minimal latency

Focused, distraction-free workout mode

Technical Expectations

Persistent relational or document-based database

Real-time UI updates during workouts

Clean, scalable data models

Clear separation between private and shared routines

Audio playback support for workout completion sound

Goal:
Create a powerful, mobile-friendly weightlifting companion that automates progression, tracks performance trends, and delivers an intense, streamlined workout experience on both phones and desktop browsers.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://build-strength.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/93008d03-7033-4fed-8e0a-c54ab36cf006).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
