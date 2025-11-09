# Fun Writing - Gamified Creative Writing Education Platform

A comprehensive web application that helps young writers improve their skills through engaging prompts, AI-powered feedback, and a gamification system.

**Status**: Production deployment on Google Cloud Platform (GCP)
**URL**: https://writing.c6web.com

## 🏗️ Production Architecture

The application is deployed on Google Cloud Platform with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│              Fun Writing Production System                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend: GCS + Cloud CDN                           │   │
│  │  - URL: https://writing.c6web.com                    │   │
│  │  - Hosted on Google Cloud Storage                    │   │
│  │  - Delivered via Cloud CDN for fast global access    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend API: Cloud Run                              │   │
│  │  - URL: fun-writing-backend-yaildcgk6q-uc.a.run.app  │   │
│  │  - Service: fun-writing-backend                      │   │
│  │  - Express.js API with 26 endpoints                  │   │
│  │  - JWT Authentication ✅                              │   │
│  │  - Connected to Cloud SQL ✅                          │   │
│  │  - Valid SSL Certificate ✅                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ↓               ↓               ↓                  │
│  ┌──────────────┐ ┌──────────────────────────────────┐        │
│  │  Cloud SQL   │ │  Cloud Run AI Agents (HTTP)      │        │
│  │  PostgreSQL  │ │  - Python + Google ADK + FastAPI │        │
│  │  17          │ │  - 5 Agents (Safety, Prompt,     │        │
│  │              │ │    Feedback, Visual Media)       │        │
│  │ - 7 Models   │ │  - Real-time HTTP endpoints      │        │
│  │ - User Data  │ │  - Port 8080                     │        │
│  │ - Subs       │ │  - Gemini 2.5 Flash, Veo 3.1    │        │
│  │ - Media Info │ │  - Direct calls from Backend API │        │
│  └──────────────┘ └──────────────────────────────────┘        │
│                          │                                   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GCS Bucket: fun-writing-media-prod                  │   │
│  │  - Generated images and videos                       │   │
│  │  - Public access for downloads                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  External AI Services                                │   │
│  │  - Google Gemini 2.5 Flash (text + vision)          │   │
│  │  - Veo 3.1 Fast Preview (video generation)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Repository Structure

The repository contains three main components:

```
backend/                     # Backend API (Node.js Express)
frontend/                    # Frontend app (React + TypeScript)
cloud-run-ai-agents/         # AI agents HTTP service (Python + Google ADK)
```

**Note:** All GCP deployment is managed through the cloud-run-ai-agents service. The backend and frontend are standard Node.js applications deployed to Cloud Run and GCS respectively.

### Key Services

**Frontend** - GCS + Cloud CDN
- Static site hosting on Google Cloud Storage
- Global CDN for fast content delivery
- Domain: writing.c6web.com (via GoDaddy DNS)

**Backend API** - Cloud Run Service
- Service: `fun-writing-backend`
- URL: `https://fun-writing-backend-yaildcgk6q-uc.a.run.app/api`
- Express.js with 26 API endpoints
- JWT authentication
- Auto-scales based on load
- SSL certificate: ✅ Valid (Cloud Run managed)

**AI Agents** - Cloud Run HTTP Service (Python + Google ADK + FastAPI)
- Service: `fun-writing-ai-agents`
- Framework: Google Agent Development Kit (ADK) with FastAPI
- Port: 8080
- Deployment: 5 autonomous agents with real-time HTTP endpoints
- **1. ContentSafetyAgent** 🛡️ - Text content moderation & validation
  - Validates student writing for harmful material
  - Risk detection: violence, profanity, adult content, hate speech, PII
  - Returns safety analysis with user-friendly alert messages
- **2. ImageSafetyAgent** 🖼️ - Visual content safety validation
  - Analyzes generated images using Gemini 2.5 Flash vision
  - Detects inappropriate imagery, text, symbols
  - Triggers automatic image regeneration when needed
- **3. PromptAgent** ✍️ - Creative writing prompt generation
  - Creates engaging, age-appropriate writing prompts
  - Age-aware scaling (3-16+ years with adaptive word counts)
- **4. FeedbackAgent** 📊 - Comprehensive writing evaluation
  - Scores across 4 dimensions: Grammar, Spelling, Relevance, Creativity
  - Provides encouraging, actionable feedback with next steps
- **5. VisualMediaAgent** 🎨 - Multi-modal media generation with safety
  - Image generation: 4 styles (Standard, Comic, Princess, Manga) using Gemini
  - Video generation: 2 styles (Animation, Cinematic) using Veo 3.1
  - Built-in safety validation for all generated media
  - GCS storage integration
- Architecture: Direct HTTP calls from backend API (no Pub/Sub)
- Primary Models: Gemini 2.5 Flash (text + vision), Veo 3.1 Fast Preview
- Auto-scales: 0 to unlimited instances based on workload

**Real-time Processing**
- All agents accessible via HTTP REST endpoints
- Immediate safety checks and feedback generation
- Direct integration with backend API
- No scheduled jobs or message queues

**Database** - Cloud SQL PostgreSQL
- Instance: `fun-writing` (region: us-central1)
- PostgreSQL 17
- 7 database models
- Automatic backups and failover

## 🚀 Quick Start (GCP Development Workflow)

This project is designed for **cloud-based development**. All development happens on Google Cloud Platform.

### Development Workflow

1. **Clone the repository:**
   ```bash
   git clone <repository>
   cd fun-writing-gcp
   ```

2. **Update code locally:**
   - Make changes to backend, frontend, or AI agents
   - Test changes locally if needed (see component documentation)

3. **Deploy to GCP:**
   ```bash
   # Deploy AI agents HTTP service
   cd cloud-run-ai-agents
   ./deploy.sh
   ```

4. **Test on production URLs:**
   - Frontend: https://writing.c6web.com
   - Backend API: https://fun-writing-backend-yaildcgk6q-uc.a.run.app/api
   - AI Agents: Check Cloud Run service URL

5. **Iterate and redeploy as needed**

**Note:** Backend and frontend deployments are managed separately through GCP Console or gcloud CLI. Only the AI agents service has a deployment script in this repository.

## 📋 Documentation

- **[cloud-run-ai-agents/README.md](./cloud-run-ai-agents/README.md)** - AI Agents HTTP service documentation (Python + Google ADK)
- **[backend/](./backend/)** - Backend API (Node.js Express)
- **[frontend/](./frontend/)** - Frontend app (React + TypeScript)

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 + TypeScript
- Vite 7.1.2
- Redux Toolkit
- Tailwind CSS
- Hosted on Google Cloud Storage
- Delivered via Cloud CDN

**Backend API**
- Node.js 22 + Express.js
- PostgreSQL 17 + Sequelize ORM
- JWT Authentication
- Deployed on Google Cloud Run
- Auto-scaling based on load

**AI Processing**
- Python 3.11 + Google ADK (Agent Development Kit)
- FastAPI (HTTP REST endpoints, port 8080)
- Google Gemini 2.5 Flash (text generation, feedback, safety, vision)
- Veo 3.1 Fast Preview (video generation)
- Cloud Run HTTP Service (real-time processing)

**Database**
- Cloud SQL PostgreSQL 17
- 7 Sequelize ORM models
- Automatic backups and point-in-time recovery
- Cloud SQL Proxy for secure connections

**Storage & Delivery**
- Google Cloud Storage buckets
- Cloud CDN for global content delivery
- Public media bucket for generated images/videos

### System Architecture

The application uses a microservices architecture with real-time HTTP processing:

```
User Request (HTTPS)
       │
       ├─→ Cloud CDN → GCS Frontend (writing.c6web.com)
       │
       └─→ Cloud Run Backend API (fun-writing-backend)
              │
              ├─→ Cloud SQL (data persistence)
              │
              └─→ HTTP POST → Cloud Run AI Agents Service (Python + FastAPI)
                     │
                     ├─→ ContentSafetyAgent (text validation)
                     ├─→ ImageSafetyAgent (image validation)
                     ├─→ PromptAgent (prompt generation)
                     ├─→ FeedbackAgent (writing evaluation)
                     └─→ VisualMediaAgent (media generation)
                            │
                            ├─→ Gemini 2.5 Flash (text + vision)
                            ├─→ Veo 3.1 (video generation)
                            └─→ GCS (store generated media)
                                   │
                                   └─→ Update Cloud SQL immediately
```

## 📊 Features

### For Students
✨ **Writing System**
- 20 diverse writing themes
- AI-generated personalized prompts
- Age-appropriate content
- Rich text editor with validation

✨ **Feedback System**
- AI-powered analysis on 4 dimensions:
  - Grammar (0-25 points)
  - Spelling (0-25 points)
  - Relevance (0-25 points)
  - Creativity (0-25 points)
- Detailed suggestions for improvement
- Downloadable feedback

✨ **Gamification**
- 3,000 starting AI credits
- Earn credits for submissions
- Level progression system
- Achievement unlocking
- Streak tracking
- Leaderboard (future)

✨ **Media Generation**
- AI-generated images with 4 styles: Standard, Comic, Princess, Manga (100 credits per image, unlimited)
- AI-generated videos directly from text with 2 styles: Animation, Cinematic (500 credits per video, 8 seconds, 720p)
- Download and share capabilities

### For Administrators
👤 **Admin Panel**
- User management (CRUD operations)
- User statistics and activity tracking
- Prompt management
- Platform statistics dashboard
- Content moderation tools
- Role-based access control

## 📁 Project Structure

```
fun-writing-gcp/
├── backend/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/                  # Database configuration
│   │   ├── models/                  # 7 Sequelize models
│   │   ├── routes/                  # 26 API endpoints
│   │   ├── services/                # Business logic (6 services)
│   │   ├── middleware/              # Auth, validation, error handling
│   │   ├── migrations/              # Database schema
│   │   └── seeders/                 # Test data
│   ├── scripts/                     # Database scripts
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/                         # React + TypeScript frontend
│   ├── src/
│   │   ├── components/              # 18 reusable components
│   │   ├── pages/                   # 8 page components
│   │   ├── services/                # 3 API service modules
│   │   ├── store/                   # Redux store + 3 slices
│   │   ├── hooks/                   # 4 custom hooks
│   │   ├── App.tsx                  # Main app with routing
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
├── cloud-run-ai-agents/             # AI Agents HTTP Service (Python + Google ADK)
│   ├── python_agents/
│   │   ├── agents/                  # 5 AI agents
│   │   │   ├── content_safety_agent.py    # Text safety validation
│   │   │   ├── image_safety_agent.py      # Image safety validation
│   │   │   ├── prompt_agent.py            # Prompt generation
│   │   │   ├── feedback_agent.py          # Writing evaluation
│   │   │   └── visual_media_agent.py      # Media generation
│   │   ├── services/
│   │   │   ├── database_service.py        # Cloud SQL operations
│   │   │   └── gcs_storage_service.py     # GCS storage
│   │   └── main.py                        # FastAPI application
│   ├── test-scripts/                # Testing utilities
│   ├── Dockerfile
│   ├── deploy.sh                    # AI Agents deployment script
│   ├── start.sh                     # Local startup script
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example
│   └── README.md                    # Complete documentation
│
├── .gitignore
├── LICENSE.md
└── README.md                        # This file
```

## 🚀 Deployment

### Production Deployment (Google Cloud Platform)

The application is deployed on GCP using the following services:

#### AI Agents HTTP Service Deployment
```bash
cd cloud-run-ai-agents
./deploy.sh
```

This deploys the AI Agents Cloud Run HTTP Service:
- Service: `fun-writing-ai-agents`
- Framework: Python 3.11 + Google ADK + FastAPI
- 5 AI agents with real-time HTTP endpoints
- Port: 8080
- Uses Gemini 2.5 Flash (text + vision) and Veo 3.1
- Direct HTTP calls from backend API

#### Backend and Frontend Deployment

The backend and frontend are deployed using standard GCP tools:

**Backend (Cloud Run):**
```bash
cd backend
gcloud run deploy fun-writing-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Frontend (Cloud Storage + CDN):**
```bash
cd frontend
npm run build
gsutil -m rsync -r -d dist/ gs://fun-writing-frontend-prod/
```

### Production Infrastructure

The following GCP resources are deployed:
- ✅ Cloud SQL PostgreSQL 17 instance with automatic backups
- ✅ Cloud Storage buckets (frontend + media)
- ✅ Cloud CDN for global content delivery
- ✅ Cloud Run services:
  - `fun-writing-backend` (Node.js Express API)
  - `fun-writing-ai-agents` (Python + Google ADK + FastAPI HTTP service)
- ✅ Real-time HTTP integration between services

## 📖 Demo Credentials

After seeding, credentials are auto-generated for security. Check the seeding script output for login details.

⚠️ **Important**: Change all default passwords after first login.

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test                 # Run tests
npm test -- --coverage   # Coverage report
```

### Backend Testing
```bash
cd backend
npm test                 # Run tests
npm test -- --coverage   # Coverage report
```

### AI Agents Testing
```bash
cd cloud-run-ai-agents
# See cloud-run-ai-agents/README.md for testing instructions
```

## 🔧 Configuration

### Backend Environment Variables
```env
NODE_ENV=development
PORT=3088
DB_HOST=localhost
DB_USER=funwriting
DB_PASSWORD=funwriting
DB_NAME=fun_writing_dev
DB_PORT=5432
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:3088
VITE_API_TIMEOUT=30000
VITE_ENABLE_ADMIN_PANEL=true
VITE_ENABLE_ACHIEVEMENTS=true
```

## ♿ Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast compliance

## 🚦 Performance

- ✅ Code splitting with Vite
- ✅ Request/response caching (5-min TTL)
- ✅ Pagination for large datasets
- ✅ Database indexes
- ✅ Connection pooling
- ✅ Optimized React renders

## 🛠 Development Tools

### Frontend
- Vite for fast development
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Redux DevTools for state debugging

### Backend
- Nodemon for auto-reload
- Sequelize CLI for migrations
- Morgan for logging
- Joi for validation

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Google Gemini API](https://ai.google.dev)
- [Google Cloud Platform](https://cloud.google.com)

## 📝 License

Proprietary. All rights reserved.

