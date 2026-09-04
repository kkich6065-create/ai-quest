# 🤖 AI Quest - AI & Computer Quiz Competition Platform

A gamified, modern web application for school-level Artificial Intelligence and Computer Science quiz competitions. Built with Node.js, Express, and vanilla JavaScript with a vibrant, space-themed UI.

## ✨ Features

### For Participants
- **Secure Registration & Login** - JWT-based authentication with bcrypt password hashing
- **Gamified Dashboard** - Colorful round cards with progress tracking
- **25 Questions Across 3 Rounds** - 10 Easy (1 mark), 10 Medium (2 marks), 5 Hard (4 marks)
- **No Negative Marking** - Wrong answers score 0, no penalties
- **Question Navigation** - Move freely between questions, change answers before submission
- **Accurate Timer** - Starts only when "Start Quiz" is clicked, server-side validated
- **Round Transitions** - Celebratory screens between rounds with animations
- **Personal Results** - View your own score breakdown after completion
- **Refresh Protection** - Progress restored if page is refreshed during quiz

### For Conductors/Admins
- **Secure Admin Dashboard** - Separate authentication for competition conductors
- **Real-time Statistics** - Total registered, started, completed, average score, highest score, fastest time
- **Admin-Only Leaderboard** - Score-first ranking with time-based tie-breaker
- **Winner Podium** - Visual 1st, 2nd, 3rd place display with confetti animations
- **Participant Management** - View all participants with status, scores, and completion times
- **CSV Export** - Download leaderboard data for external analysis
- **Search & Filter** - Quickly find specific participants

### Technical Features
- **Server-Side Validation** - All scoring and timing calculated on the backend
- **Anti-Cheating Measures** - Correct answers never exposed to frontend, locked submissions
- **Randomized Questions** - Each participant gets randomized question order and answer options
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI** - Vibrant gradients, glassmorphism, smooth animations, star field background
- **Secure APIs** - Admin routes protected with role-based middleware

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd Quiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   The `.env` file is already configured with default values:
   ```
   PORT=3000
   JWT_SECRET=aiquest_super_secret_key_2024_change_in_production
   ADMIN_EMAIL=admin@aiquest.com
   ADMIN_PASSWORD=Admin@123
   ```

   ⚠️ **Important:** Change `JWT_SECRET` and `ADMIN_PASSWORD` before deploying to production!

4. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser and navigate to: `http://localhost:3000`
   - **Admin Login:** Use the credentials from `.env` (default: `admin@aiquest.com` / `Admin@123`)

## 📁 Project Structure

```
Quiz/
├── server/
│   ├── index.js              # Express server setup
│   ├── database.js           # LowDB configuration and admin seeding
│   ├── questions.js          # Question pool (25 Easy, 25 Medium, 25 Hard; 25 active per quiz)
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Registration, login endpoints
│       ├── quiz.js           # Quiz start, progress, answer, submit endpoints
│       └── admin.js          # Admin stats, leaderboard, participants endpoints
├── public/
│   ├── index.html            # Landing page
│   ├── login.html            # Participant registration/login
│   ├── admin-login.html      # Admin login
│   ├── dashboard.html        # Participant dashboard
│   ├── quiz.html             # Quiz interface
│   ├── result.html           # Participant result page
│   ├── admin.html            # Admin dashboard
│   ├── css/
│   │   ├── main.css          # Global styles, design tokens
│   │   ├── landing.css       # Landing page styles
│   │   ├── auth.css          # Login/registration styles
│   │   ├── dashboard.css     # Dashboard styles
│   │   ├── quiz.css          # Quiz interface styles
│   │   ├── result.css        # Result page styles
│   │   └── admin.css         # Admin dashboard styles
│   └── js/
│       ├── api.js            # Shared API client, utilities
│       ├── auth.js           # Authentication logic
│       ├── dashboard.js      # Dashboard functionality
│       ├── quiz.js           # Quiz logic, timer, navigation
│       ├── result.js         # Result display, confetti
│       └── admin.js          # Admin dashboard, leaderboard
├── .env                      # Environment configuration
├── package.json              # Dependencies and scripts
└── quiz.db.json             # LowDB database (auto-created)
```

## 🎯 How to Use

### For Participants

1. **Register/Login**
   - Go to the landing page and click "Register / Login"
   - Create an account with your name, email, and password
   - Or log in if you already have an account

2. **View Dashboard**
   - See the three round cards with difficulty levels and scoring
   - Read the "How to Play" section
   - Click "Start Quiz" when ready (timer starts at this moment)

3. **Take the Quiz**
   - Answer 10 Easy questions (1 mark each)
   - Navigate between questions using the question navigator
   - Change answers before submitting the round
   - Submit Round 1 to proceed to Medium round

4. **Complete All Rounds**
   - Answer 10 Medium questions (2 marks each)
   - Answer 5 Hard questions (4 marks each)
   - Submit final quiz after completing all 25 questions

5. **View Results**
   - See your total score out of 50
   - View round-wise breakdown
   - See your completion time
   - Note: Leaderboard is only visible to the conductor

### For Conductors/Admins

1. **Login**
   - Go to `/admin-login.html`
   - Enter admin credentials from `.env`

2. **View Statistics**
   - See total registered participants
   - Track started and completed quizzes
   - View average score, highest score, fastest time

3. **View Leaderboard**
   - Participants ranked by score (primary) and time (secondary for ties)
   - See round-wise scores and completion times
   - Winner podium with confetti animation

4. **Manage Participants**
   - View all participants with status
   - See who hasn't started, is in progress, or completed
   - Search for specific participants

5. **Export Data**
   - Click "Export CSV" to download leaderboard data

## 🔐 Security Features

- **Password Hashing** - All passwords hashed with bcrypt (10-12 rounds)
- **JWT Authentication** - Secure token-based authentication with expiration
- **Role-Based Access** - Admin routes protected with middleware
- **Server-Side Scoring** - Scores calculated on backend, not frontend
- **Answer Hiding** - Correct answers never sent to frontend during quiz
- **Submission Locking** - Once submitted, quiz cannot be modified
- **Single Attempt** - Each participant can only attempt the quiz once

## 🎨 Design System

### Colors
- **Primary Gradient:** Cyan (#00d4ff) to Purple (#7c3aed)
- **Easy Round:** Green (#10b981)
- **Medium Round:** Amber (#f59e0b)
- **Hard Round:** Red (#f43f5e)
- **Background:** Deep space blue (#07071a)

### Typography
- **Headings:** Outfit (modern, geometric)
- **Body:** Inter (clean, readable)

### UI Elements
- Glassmorphism cards with backdrop blur
- Gradient buttons with hover animations
- Star field background canvas animation
- Confetti effects for celebrations
- Smooth page transitions

## 📊 Scoring System

| Round   | Questions | Marks per Answer | Maximum |
| ------- | --------: | ---------------: | ------: |
| Easy    |        10 |                1 |      10 |
| Medium  |        10 |                2 |      20 |
| Hard    |         5 |                4 |      20 |
| **Total** |      **25** |              **—** |    **50** |

**No negative marking** - Incorrect or unanswered questions score 0.

## 🏆 Leaderboard Algorithm

Participants are ranked by:
1. **Total Score** (higher scores rank higher)
2. **Completion Time** (for ties, faster time ranks higher)

Example:
- Participant A: 120 points, 35 minutes → Rank 2
- Participant B: 120 points, 30 minutes → Rank 1 (same score, faster time)

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new participant
- `POST /api/auth/login` - Participant login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user info

### Quiz
- `POST /api/quiz/start` - Start a new quiz attempt
- `GET /api/quiz/progress` - Get current quiz progress
- `POST /api/quiz/answer` - Save an answer
- `POST /api/quiz/submit` - Submit final quiz

### Admin (Protected)
- `GET /api/admin/stats` - Get competition statistics
- `GET /api/admin/leaderboard` - Get ranked leaderboard
- `GET /api/admin/participants` - Get all participants

## 🧪 Testing

The application is ready for testing. To verify functionality:

1. **Test Participant Flow:**
   - Register a new participant
   - Login and view dashboard
   - Start quiz and answer questions
   - Submit and view results

2. **Test Admin Flow:**
   - Login as admin
   - View statistics
   - Check leaderboard after participant completion
   - Export CSV

3. **Test Edge Cases:**
   - Refresh page during quiz (should restore progress)
   - Try to submit quiz twice (should be blocked)
   - Try to access admin routes as participant (should be blocked)
   - Try to register with duplicate email (should be blocked)

## 📝 Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | Secret key for JWT tokens | (change in production) |
| `ADMIN_EMAIL` | Admin login email | admin@aiquest.com |
| `ADMIN_PASSWORD` | Admin login password | Admin@123 |

## 🚀 Deployment

For production deployment:

1. **Change environment variables** in `.env`:
   - Set a strong `JWT_SECRET`
   - Change `ADMIN_PASSWORD`
   - Consider using environment-specific config

2. **Use a process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name ai-quest
   ```

3. **Set up a reverse proxy** (nginx/Apache) for SSL and domain

4. **Consider using a production database** instead of LowDB for larger scale

## 🤝 Contributing

This is a complete, production-ready application. To extend or modify:

- Add new questions in `server/questions.js`
- Modify scoring logic in `server/routes/quiz.js`
- Update UI styles in `public/css/`
- Add new features following the existing architecture

## 📄 License

This project is provided as-is for educational and competition purposes.

## 🎓 Credits

Built for school-level AI and Computer Science quiz competitions.

---

**Admin Credentials (Default):**
- Email: `admin@aiquest.com`
- Password: `Admin@123`

⚠️ **Remember to change these credentials before deploying to production!**
