# Golf Charity Subscription Platform (Express + React + Supabase)

This project implements the PRD requirements for the Digital Heroes full-stack trainee assignment using:
- **Backend**: Express.js REST API
- **Frontend**: React.js with React Router
- **Database**: Supabase PostgreSQL
- **Build Tool**: Vite for fast development

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Port 5173)             │
│              ├── Components (Header, Footer, etc)        │
│              ├── Pages (Home, Dashboard, Admin, etc)     │
│              └── Context (Auth management)               │
├─────────────────────────────────────────────────────────┤
│         Axios API Client (REST API Integration)          │
├─────────────────────────────────────────────────────────┤
│              Express Backend (Port 4000)                 │
│         ├── /api/* Endpoints (JSON responses)            │
│         ├── /webhooks/stripe (Webhook handler)           │
│         └── Static file serving (production)             │
├─────────────────────────────────────────────────────────┤
│           Supabase PostgreSQL Database                   │
│         (Users, Subscriptions, Scores, Draws, etc)       │
└─────────────────────────────────────────────────────────┘
```

## What Is Implemented

- User roles: public, subscriber, admin
- Auth: signup/login/logout with JWT cookie
- Subscriptions: monthly/yearly, renewal date, active/lapsed state
- Stripe billing flow:
  - Checkout Session for monthly/yearly plan
  - Success callback activation
  - Verified webhook activation (idempotent)
- Subscription gate: protected features require active plan
- Scores: Stableford `1-45`, rolling latest 5 scores only
- Draw engine:
  - Random or algorithmic generation
  - Simulation mode
  - Monthly publish mode
  - 5/4/3-match winner detection
  - Jackpot rollover for 5-match when no winner
- Prize logic:
  - 40% -> 5 match (rollover eligible)
  - 35% -> 4 match
  - 25% -> 3 match
  - Equal split within each tier
- Charity system:
  - Charity selection at signup
  - Min 10% subscription charity contribution
  - Independent donations
  - Charity directory + featured display
- Winner verification:
  - User uploads proof URL
  - Admin approve/reject
  - Payout status pending -> paid
- Email notifications:
  - Subscription activation
  - Draw winner alerts
  - Payout completed alerts
- Admin tools:
  - Draw controls
  - Charity CRUD (create implemented)
  - Winner payout controls
  - Summary metrics
- **React Frontend**:
  - Modern, responsive UI with CSS Grid and Flexbox
  - Client-side routing with React Router
  - Context-based authentication
  - Protected routes with automatic redirects
  - Clean, minimalist design (no golf clichés)
  - **Mobile-First Responsive Design**:
    - Fully responsive breakpoints for mobile, tablet, and desktop
    - Hamburger menu navigation on mobile devices
    - Touch-optimized buttons and form inputs (44px minimum height)
    - Responsive grid layouts (1-column mobile → 2-3 columns desktop)
    - Proper viewport scaling and safe area support
    - Font sizing prevents unwanted zoom on iOS

## Setup

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- Stripe account (optional for testing without payments)

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure Environment

```bash
copy .env.example .env
```

Fill `.env` values for:
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- JWT: `JWT_SECRET`
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Stripe (optional): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`

### 3. Create Database Schema

- Open Supabase SQL editor
- Run [supabase/schema.sql](supabase/schema.sql)

### 4. Seed Admin Account (in Supabase SQL editor)

```sql
insert into users (full_name, email, password_hash, role, charity_percentage)
values ('Admin User', 'admin@example.com', '$2b$10$jmQ/VHeSV7Rx33ym8BHeIeSFxA9J1zFmmm/zsgl25ubDSzjsIj9.2', 'admin', 10)
on conflict (email) do nothing;
```

Admin password: `admin123`

### 5. Run Development Servers

**Terminal 1 - Backend**:
```bash
npm run dev
# Backend running on http://localhost:4000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Build for Production

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Backend will serve the React build automatically
NODE_ENV=production npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Subscriptions
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions` - Create/renew subscription
- `POST /api/subscriptions/checkout` - Create Stripe checkout URL

### Scores
- `GET /api/scores` - Get user's scores
- `POST /api/scores` - Add score

### Charities
- `GET /api/charities` - Get all charities
- `GET /api/charities/featured` - Get featured charities
- `POST /api/charities/donate` - Make donation

### Draws
- `GET /api/draws` - Get draw history
- `POST /api/draws/simulate` - (Admin) Simulate draw
- `POST /api/draws/publish` - (Admin) Publish draw

### Winners
- `GET /api/winners` - Get winners
- `GET /api/winners/winnings` - Get user's winnings
- `POST /api/winners/proof` - Upload proof

### Dashboard
- `GET /api/dashboard` - Get user dashboard data
- `GET /api/dashboard/admin` - (Admin) Get admin stats

### Webhooks
- `POST /webhooks/stripe` - Stripe checkout completion webhook

## Mobile Responsiveness

The frontend is built with a **mobile-first approach** ensuring excellent user experience across all devices:

### Responsive Breakpoints
- **Mobile** (default): < 640px - single column layout, full-width buttons
- **Tablet**: 640px - 859px - two-column grid, optimized spacing
- **Desktop**: 860px+ - three-column grid, expanded layouts

### Mobile Features
- **Hamburger Menu**: Auto-collapsing navigation for screens under 640px
- **Touch-Optimized Controls**: 
  - Minimum 44px button/input height (accessibility standard)
  - 16px minimum font size (prevents unwanted iOS zoom)
  - Proper touch target spacing (8-16px gaps)
- **Responsive Forms**: Form fields and buttons adapt layout (stacked mobile, inline desktop)
- **CSS Grid Layouts**:
  - `.section-grid` defaults to 1 column (mobile)
  - `.section-grid.two` → 1 col mobile, 2 col tablet+
  - `.section-grid.three` → 1 col mobile, 2 col tablet, 3 col desktop
- **Viewport Meta Tags**: Safe area support for notches, proper scaling for all devices
- **Theme Color Support**: Native browser UI theming on mobile

### Testing on Mobile
```bash
# Development: Use Chrome DevTools responsive design mode
# Or test on actual device by accessing: http://YOUR_IP:5173 from phone

# Production: Ensure VITE_API_URL points to correct backend domain
```

### Mobile Design System
All components use CSS variables for consistent theming:
- `--primary`, `--accent`, `--warn`, `--muted` colors
- Responsive padding: `12px` mobile, `16px` desktop via media queries
- Hamburger animation CSS custom spinner on mobile menu
- Semantic HTML with proper `<main>` wrapper for sticky footer

## Frontend Features

### Pages
- **Home** - Landing page with featured charities
- **Register** - User registration with charity selection
- **Login** - User login
- **Dashboard** - Subscriber dashboard (scores, subscription, winnings)
- **Charities** - Browse all charities
- **Winner Proof** - Upload proof of winning
- **Admin** - Admin dashboard with draw controls

### Components
- **Header** - Navigation with auth state
- **Footer** - Site footer
- **ProtectedRoute** - Route guard for authenticated users

### Context
- **AuthContext** - Manages user authentication state and provides auth functions

## Project Structure

```
Backend_Assignment/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API integration layer
│   │   ├── context/       # React Context
│   │   ├── App.jsx        # Main app with routing
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── vite.config.js     # Vite configuration
│   └── package.json
├── src/
│   ├── config/            # Environment & database config
│   ├── db/                # Supabase client
│   ├── middleware/        # Auth, subscription middleware
│   ├── services/          # Business logic
│   ├── routes/
│   │   ├── api.js        # REST API endpoints
│   │   └── webhooks.js   # Stripe webhooks
│   └── app.js            # Express app
├── supabase/
│   └── schema.sql        # Database schema
├── .env.example
├── package.json
└── README.md
```

## Development Workflow

1. **Backend changes**: Edit files in `src/`, backend hot-reloads
2. **Frontend changes**: Edit files in `frontend/src/`, Vite hot-reloads
3. **API changes**: Add endpoints in `src/routes/api.js`, update `frontend/src/services/api.js`

## Deployment

### Backend (choose one)
- Heroku: `heroku create` and `git push heroku main`
- Railway: Connect GitHub repo
- DigitalOcean: Deploy via App Platform

### Frontend
Built automatically when backend is built:
```bash
cd frontend && npm run build && cd ..
```

The Express app serves the built React app in production.

### Environment Variables (Production)
Set same variables as `.env` in your hosting platform's environment config.

## Testing

### Manual Testing Checklist

- [ ] Register new user
- [ ] Login and go to dashboard
- [ ] Add golf scores
- [ ] Subscribe to plan
- [ ] (If Stripe configured) Test checkout flow
- [ ] Upload winner proof
- [ ] (Admin) Simulate draw
- [ ] (Admin) Publish draw
- [ ] (Admin) Mark winner as paid


## Known Practical Tradeoffs

- Stripe requires live keys and configured recurring prices in dashboard
- Email notifications require SMTP configuration
- Image/proof upload uses URL-based for simplicity (could be extended to file upload)
- Frontend assumes API responds with JSON; doesn't handle legacy HTML responses

## Support

For questions or issues, check:
1. Backend logs in Terminal 1
2. Frontend console (F12 → Console tab)
3. Network tab for API request/response details
4. Supabase dashboard for database state
