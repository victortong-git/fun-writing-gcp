# Fun Writing AI Agents - Google ADK Cloud Run Service

Production-ready Cloud Run HTTP service built with **Google Agent Development Kit (ADK)** in Python, featuring comprehensive safety validation and multi-agent AI orchestration.

## 🎯 Overview

This service implements **5 AI agents** using the official **Google ADK (Agent Development Kit)** framework in Python:

### Core Agents
- **ContentSafetyAgent** 🛡️ - Validates text content for harmful material
- **ImageSafetyAgent** 🖼️ - Analyzes images for inappropriate content using Gemini 2.5 Flash vision
- **PromptAgent** ✍️ - Generates creative writing prompts
- **FeedbackAgent** 📊 - Evaluates student writing with detailed feedback
- **VisualMediaAgent** 🎨 - Generates images and videos with safety validation

### Key Features
✅ **Official Google ADK Framework** - Python-based multi-agent system
✅ **Dual Safety Validation** - Text and image content checking
✅ **Real-time Alert System** - Blocks harmful content with user-friendly messages
✅ **Gemini 2.5 Flash Integration** - Text and multimodal AI capabilities
✅ **Complete Media Pipeline** - Image generation (Gemini) + video generation (Veo 3.1)
✅ **Production-Ready** - FastAPI, Cloud Run, Cloud SQL, GCS

## 🏗️ Architecture

```
Python ADK Application (FastAPI - Port 8080)
├── HTTP API Endpoints (FastAPI)
├── Content Safety Agent (ADK) - Text validation
├── Image Safety Agent (ADK) - Image validation with Gemini vision
├── Prompt Agent (ADK) - Creative prompt generation
├── Feedback Agent (ADK) - Writing evaluation
├── Visual Media Agent (ADK) - Image/video generation
├── Database Service - Cloud SQL PostgreSQL
└── GCS Storage Service - Public media storage
```

## 📁 Project Structure

```
cloud-run-ai-agents/
├── python_agents/
│   ├── agents/
│   │   ├── content_safety_agent.py     # Text safety validation (ADK)
│   │   ├── image_safety_agent.py       # Image safety validation (ADK)
│   │   ├── prompt_agent.py             # Prompt generation (ADK)
│   │   ├── feedback_agent.py           # Writing evaluation (ADK)
│   │   └── visual_media_agent.py       # Media generation (ADK)
│   ├── services/
│   │   ├── database_service.py         # Cloud SQL operations
│   │   └── gcs_storage_service.py      # GCS storage
│   └── main.py                         # FastAPI application
├── requirements.txt                    # Python dependencies (includes google-adk)
├── Dockerfile                          # Python 3.11 container
├── .env.example                        # Environment variables template
├── start.sh                            # Local startup script
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Google Cloud Project with billing enabled
- gcloud CLI installed
- Google AI API key for Gemini

### Local Development

1. **Clone and navigate:**
   ```bash
   cd 04-cloud-run-ai-agents
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials:
   # - GOOGLE_API_KEY or GEMINI_API_KEY (required)
   # - GCP_PROJECT_ID (optional)
   # - GCS_BUCKET_NAME (optional for local dev)
   ```

3. **Run with startup script:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

   Or manually:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd python_agents
   python main.py
   ```

4. **Test endpoints:**
   ```bash
   # Health check
   curl http://localhost:8080/health

   # Analyze writing with safety check
   curl -X POST http://localhost:8080/analyze-writing \
     -H "Content-Type: application/json" \
     -d '{
       "submissionId": "test-123",
       "userId": "user-456",
       "studentWriting": "Once upon a time...",
       "originalPrompt": "Write a story about adventure",
       "ageGroup": "7-11"
     }'

   # Generate image
   curl -X POST http://localhost:8080/generate-image \
     -H "Content-Type: application/json" \
     -d '{
       "submissionId": "test-123",
       "userId": "user-456",
       "studentWriting": "A princess in a magical castle",
       "ageGroup": "7-11",
       "imageIndex": 0,
       "imageStyle": "princess"
     }'

   # Validate image safety
   curl -X POST http://localhost:8080/validate-image \
     -H "Content-Type: application/json" \
     -d '{
       "imageUrl": "https://example.com/image.png",
       "ageGroup": "7-11",
       "context": "A story about a princess"
     }'
   ```

## 🛡️ Safety Features

### Content Safety Agent

**Purpose:** Validates student writing for harmful content before processing

**Checks for:**
- Violence or graphic content
- Profanity or inappropriate language
- Sexual or adult content
- Hate speech, discrimination, or bullying
- Personal information (PII)
- Dangerous activities or self-harm references
- Age-appropriateness

**Response:** Returns safety analysis with alert messages if content is flagged

**Example Alert:**
```json
{
  "success": false,
  "blocked": true,
  "alertMessage": "⚠️ Your submission contains language that may not be appropriate. Please review and try again.",
  "safetyCheck": {
    "isSafe": false,
    "riskLevel": "medium",
    "recommendation": "review",
    "issues": [
      {
        "category": "profanity",
        "severity": "medium",
        "description": "Inappropriate language detected",
        "snippet": "..."
      }
    ]
  }
}
```

### Image Safety Agent

**Purpose:** Analyzes generated images for inappropriate content using Gemini 2.5 Flash vision

**Checks for:**
- Violence, gore, or disturbing imagery
- Inappropriate text or speech bubbles
- Sexual or adult content
- Hate symbols or offensive imagery
- Frightening or scary elements
- Age-appropriateness

**Features:**
- Multimodal analysis with Gemini 2.5 Flash
- Detailed visual description
- Location-specific issue identification
- Automatic regeneration triggers

**Example Alert:**
```json
{
  "success": true,
  "blocked": true,
  "alertMessage": "⚠️ This image contains content that may not be appropriate. A new image will be generated.",
  "safetyCheck": {
    "isSafe": false,
    "riskLevel": "high",
    "recommendation": "regenerate",
    "visualDescription": "Image shows...",
    "issues": [
      {
        "category": "inappropriate_text",
        "severity": "high",
        "description": "Speech bubble contains profanity",
        "location": "top-right corner, speech bubble"
      }
    ]
  }
}
```

## 📡 API Endpoints

### POST /analyze-writing

Analyze student writing with safety check and feedback.

**Request:**
```json
{
  "submissionId": "string",
  "userId": "string",
  "studentWriting": "string",
  "originalPrompt": "string",
  "ageGroup": "string"
}
```

**Response (Safe Content):**
```json
{
  "success": true,
  "safetyCheck": { "isSafe": true, "riskLevel": "none" },
  "feedback": {
    "totalScore": 85,
    "breakdown": { "grammar": 22, "spelling": 23, "relevance": 20, "creativity": 20 },
    "strengths": ["Great imagination", "Good sentence structure"],
    "areasForImprovement": ["Check punctuation", "Add more details"],
    "generalComment": "Wonderful story with creative ideas!",
    "nextSteps": ["Try adding dialogue", "Describe the setting more"]
  },
  "score": 85
}
```

**Response (Unsafe Content):**
```json
{
  "success": false,
  "blocked": true,
  "alertMessage": "⚠️ This content has been flagged for review.",
  "safetyCheck": {
    "isSafe": false,
    "riskLevel": "medium",
    "recommendation": "review",
    "issues": [...]
  }
}
```

### POST /generate-image

Generate image from student writing with safety validation.

**Request:**
```json
{
  "submissionId": "string",
  "userId": "string",
  "studentWriting": "string",
  "ageGroup": "string",
  "imageIndex": 0,
  "imageStyle": "standard" | "comic" | "manga" | "princess"
}
```

**Response:**
```json
{
  "success": true,
  "mediaId": "uuid",
  "imageUrl": "https://storage.googleapis.com/bucket/images/...",
  "fileName": "submission_uuid_0.png",
  "prompt": "Child-friendly cartoon style: A princess in a magical castle...",
  "safetyCheck": {
    "isSafe": true,
    "riskLevel": "none",
    "visualDescription": "A colorful cartoon image of...",
    "recommendation": "approve"
  }
}
```

### POST /generate-video

Generate video from student writing using Veo 3.1.

**Request:**
```json
{
  "submissionId": "string",
  "userId": "string",
  "studentWriting": "string",
  "selectedImageUrl": "string",
  "selectedImageDescription": "string",
  "ageGroup": "string"
}
```

**Response:**
```json
{
  "success": true,
  "mediaId": "uuid",
  "videoUrl": "https://storage.googleapis.com/bucket/videos/...",
  "fileName": "submission_uuid.mp4",
  "prompt": "A magical castle scene with gentle camera movement..."
}
```

### POST /validate-image

Validate generated image for safety issues (used by backend after image generation).

**Request:**
```json
{
  "imageUrl": "string",
  "ageGroup": "string",
  "context": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "isSafe": true,
  "blocked": false,
  "safetyCheck": {
    "isSafe": true,
    "riskLevel": "none",
    "visualDescription": "A friendly cartoon image showing...",
    "issues": [],
    "recommendation": "approve"
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "service": "fun-writing-ai-agents-adk",
  "framework": "Google ADK",
  "timestamp": "2025-11-06T...",
  "database": "connected",
  "agents": [
    "ContentSafetyAgent",
    "ImageSafetyAgent",
    "PromptAgent",
    "FeedbackAgent",
    "VisualMediaAgent"
  ]
}
```

## 🐳 Docker Deployment

### Build Image

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/fun-writing-ai-agents-adk:latest .
```

### Push to Google Container Registry

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Push image
docker push gcr.io/$PROJECT_ID/fun-writing-ai-agents-adk:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy fun-writing-ai-agents \
  --image gcr.io/$PROJECT_ID/fun-writing-ai-agents-adk:latest \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 2 \
  --timeout 600 \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your-gemini-api-key \
  --set-env-vars GCS_BUCKET_NAME=your-bucket-name \
  --set-cloudsql-instances PROJECT_ID:REGION:INSTANCE \
  --set-env-vars DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE \
  --set-env-vars DB_USER=funwriting \
  --set-env-vars DB_NAME=fun_writing_prod \
  --set-env-vars DB_PASSWORD=your-db-password
```

## 📦 Dependencies

### Core ADK & AI
- `google-adk>=0.2.0` - Official Google Agent Development Kit
- `google-generativeai>=0.8.0` - Gemini API (image generation, vision)
- `google-ai-generativelanguage>=0.6.0` - Generation API (Veo video)

### Google Cloud
- `google-cloud-storage` - GCS storage for media files
- `google-cloud-secret-manager` - Secret management (optional)

### Web Framework
- `fastapi>=0.110.0` - Modern Python web framework
- `uvicorn[standard]>=0.27.0` - ASGI server
- `pydantic` - Data validation

### Database
- `psycopg2-binary>=2.9.9` - PostgreSQL driver
- `sqlalchemy` - ORM (optional)

## 🔧 Configuration

### Environment Variables

See `.env.example` for all required environment variables.

**Required:**
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - Gemini API key (for AI models)

**Optional (for full features):**
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCS_BUCKET_NAME` - Storage bucket name
- `DB_HOST` - Cloud SQL connection (e.g., `/cloudsql/project:region:instance`)
- `DB_USER` - Database user (default: `funwriting`)
- `DB_NAME` - Database name (default: `fun_writing_prod`)
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port (default: `5432`)
- `PORT` - Application port (default: `8080`)

### Database Schema

**WritingSubmissions table:**
```sql
CREATE TABLE "WritingSubmissions" (
  id UUID PRIMARY KEY,
  user_id UUID,
  student_writing TEXT,
  original_prompt TEXT,
  age_group VARCHAR,
  feedback JSONB,
  score INTEGER,
  created_at TIMESTAMP
);
```

**GeneratedMedia table:**
```sql
CREATE TABLE "GeneratedMedia" (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES "WritingSubmissions"(id),
  user_id UUID,
  media_type VARCHAR, -- 'image' or 'video'
  "imageUrl" VARCHAR, -- for images
  "videoUrl" VARCHAR, -- for videos
  gcs_url VARCHAR,
  file_name VARCHAR,
  prompt TEXT,
  status VARCHAR,
  created_at TIMESTAMP
);
```

## 🧪 Testing

### Test Content Safety

```bash
# Safe content
curl -X POST http://localhost:8080/analyze-writing \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test-1",
    "userId": "user-1",
    "studentWriting": "Once upon a time, there was a brave knight who helped a lost princess find her way home.",
    "originalPrompt": "Write a story about helping others",
    "ageGroup": "7-11"
  }'

# Unsafe content (will be blocked)
curl -X POST http://localhost:8080/analyze-writing \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test-2",
    "userId": "user-2",
    "studentWriting": "This story contains inappropriate content...",
    "originalPrompt": "Write a story",
    "ageGroup": "7-11"
  }'
```

### Test Image Generation

```bash
curl -X POST http://localhost:8080/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test-img-1",
    "userId": "user-1",
    "studentWriting": "A magical unicorn flying over a rainbow castle in the clouds.",
    "ageGroup": "7-11",
    "imageIndex": 0,
    "imageStyle": "princess"
  }'
```

### Test Image Safety

```bash
curl -X POST http://localhost:8080/validate-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/bucket/images/test.png",
    "ageGroup": "7-11",
    "context": "A princess story"
  }'
```

## 📊 Monitoring & Logging

### View Cloud Run Logs

```bash
# View recent logs
gcloud run services logs read fun-writing-ai-agents \
  --region us-central1 \
  --limit 50

# Stream logs (follow)
gcloud run services logs read fun-writing-ai-agents \
  --region us-central1 \
  --tail

# Filter for errors
gcloud run services logs read fun-writing-ai-agents \
  --region us-central1 \
  --limit 100 | grep -i error
```

### Service Status

```bash
# Describe service
gcloud run services describe fun-writing-ai-agents --region us-central1

# Get service URL
gcloud run services describe fun-writing-ai-agents \
  --region us-central1 \
  --format='value(status.url)'
```

## 🔗 Backend Integration

The backend makes direct HTTP calls to the AI agents service. See `BACKEND_INTEGRATION.md` for complete details.

### Example: Analyze Writing (backend/src/routes/writing.js:380)

```javascript
const response = await fetch(`${AI_AGENTS_URL}/analyze-writing`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionId: submission.id,
    userId: req.user.id,
    studentWriting: submission.studentWriting,
    originalPrompt: submission.originalPrompt,
    ageGroup: req.user.ageGroup
  })
});

const result = await response.json();

if (result.blocked) {
  return res.status(400).json({
    error: result.alertMessage,
    safetyCheck: result.safetyCheck
  });
}

// Process feedback...
```

### Example: Generate Image (backend/src/routes/media.js:102)

```javascript
const response = await fetch(`${AI_AGENTS_URL}/generate-image`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionId: submission.id,
    userId: req.user.id,
    studentWriting: submission.studentWriting,
    ageGroup: req.user.ageGroup,
    imageIndex: i,
    imageStyle: submission.imageStyle || 'standard'
  })
});

const result = await response.json();

if (result.blocked) {
  console.warn('Image generation blocked:', result.alertMessage);
  // Retry logic...
}
```

### Example: Generate Video (backend/src/routes/media.js:611)

```javascript
const response = await fetch(`${AI_AGENTS_URL}/generate-video`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionId: submission.id,
    userId: req.user.id,
    studentWriting: submission.studentWriting,
    selectedImageUrl: image.imageUrl,
    selectedImageDescription: image.prompt,
    ageGroup: req.user.ageGroup
  })
});

const result = await response.json();
```

## 🚀 Performance Tuning

Current Cloud Run configuration:
- **Memory:** 1Gi
- **CPU:** 2 vCPU
- **Timeout:** 600 seconds (10 minutes for video generation)
- **Port:** 8080
- **Concurrency:** 80 (default)
- **Auto-scaling:** Yes

For higher throughput:
```bash
gcloud run services update fun-writing-ai-agents \
  --memory 2Gi \
  --cpu 4 \
  --timeout 900 \
  --concurrency 100 \
  --min-instances 1 \
  --max-instances 10
```

## 💰 Cost Estimation

**Monthly (MVP with moderate usage):**
- Cloud Run: ~$10-30 (depends on traffic)
- Gemini API: ~$0-100 (depends on usage, free tier available)
- GCS: ~$1-5 (storage + egress)
- Cloud SQL: ~$10-20
- **Total: ~$20-150/month**

**Cost optimization tips:**
- Use Gemini free tier during development
- Set min-instances to 0 if traffic is sporadic
- Enable GCS lifecycle policies for old media
- Monitor API usage with Cloud Monitoring

## 🆕 What's New in v2.0 (Google ADK)

✅ **Migrated to Python** - Official Google ADK support
✅ **Content Safety Agent** - Validates text for harmful content
✅ **Image Safety Agent** - Analyzes images with Gemini vision
✅ **Alert System** - Real-time user notifications for flagged content
✅ **HTTP Endpoints** - RESTful API instead of Pub/Sub jobs
✅ **FastAPI** - Modern async Python web framework
✅ **Complete Media Pipeline** - Prompt → Generate → Validate → Upload → Save
✅ **Better Error Handling** - Comprehensive safety checks at every step

## 📚 References

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Google ADK Python GitHub](https://github.com/google/adk-python)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)

## 🤝 Support

For issues or questions:
1. Check logs: `gcloud run services logs read fun-writing-ai-agents`
2. Review this README
3. Check environment variables in `.env`
4. Verify API keys and permissions
5. Test with `/health` endpoint

## 🛠️ Troubleshooting

### API Key Errors

```bash
# Verify API key is set
curl http://localhost:8080/health

# Update Cloud Run service
gcloud run services update fun-writing-ai-agents \
  --set-env-vars GOOGLE_API_KEY=your-new-key
```

### Database Connection Issues

```bash
# Verify Cloud SQL instance is running
gcloud sql instances list

# Check Cloud SQL connection name
gcloud sql instances describe INSTANCE_NAME | grep connectionName

# Test connection locally
psql -h /cloudsql/PROJECT:REGION:INSTANCE -U funwriting -d fun_writing_prod
```

### Image Generation Failures

- Check Gemini API quota and billing
- Verify GCS bucket permissions
- Review image safety validation logs
- Try different image styles

### Video Generation Timeouts

- Video generation takes 2-5 minutes (Veo 3.1)
- Increase timeout: `--timeout 900`
- Check Veo API availability
- Monitor polling logs

---

**Version:** 2.0.0 (Google ADK)
**Framework:** Google Agent Development Kit (Python)
**Status:** Production Ready ✅
**Last Updated:** November 2025
