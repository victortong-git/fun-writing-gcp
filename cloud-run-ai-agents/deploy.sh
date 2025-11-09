#!/bin/bash

# Fun Writing AI Agents Cloud Run Service Deployment Script
# Deploys Python ADK-based service with Google Gemini agents

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:?Error: PROJECT_ID environment variable must be set}"
REGION="${REGION:-us-central1}"
SERVICE_ACCOUNT_NAME="ai-agents-job"
SERVICE_NAME="fun-writing-ai-agents"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
GCS_BUCKET="fun-writing-media-prod"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Fun Writing AI Agents Cloud Run Service Deployment${NC}"
echo -e "${BLUE}Python ADK Framework with Google Gemini${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo "  Image: $IMAGE_NAME"
echo "  Build Timestamp: $TIMESTAMP"
echo ""

# Step 1: Create Service Account
echo -e "${YELLOW}Step 1: Creating Service Account...${NC}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} --project=${PROJECT_ID} &>/dev/null; then
  echo -e "${GREEN}✅ Service account already exists${NC}"
else
  echo "   Creating new service account..."
  gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="Fun Writing AI Agents Job Service Account" \
    --project=${PROJECT_ID}
  echo -e "${GREEN}✅ Service account created${NC}"
fi

echo ""

# Step 2: Grant IAM Roles
echo -e "${YELLOW}Step 2: Granting IAM Roles...${NC}"

echo "   • Vertex AI User (for Gemini API)..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT_EMAIL} \
  --role=roles/aiplatform.user \
  --quiet

echo "   • Cloud SQL Client (for database access)..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT_EMAIL} \
  --role=roles/cloudsql.client \
  --quiet

echo "   • Cloud Storage Admin (for media bucket)..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT_EMAIL} \
  --role=roles/storage.objectAdmin \
  --quiet

echo "   • Secret Manager Secret Accessor (for API keys)..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT_EMAIL} \
  --role=roles/secretmanager.secretAccessor \
  --quiet

echo -e "${GREEN}✅ All IAM roles granted${NC}"
echo ""

# Step 3: Create GCS Bucket
echo -e "${YELLOW}Step 3: Setting up GCS Bucket...${NC}"

if gsutil ls -b gs://${GCS_BUCKET} &>/dev/null; then
  echo -e "${GREEN}✅ GCS bucket already exists${NC}"
else
  echo "   Creating new bucket..."
  gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${GCS_BUCKET}
  echo -e "${GREEN}✅ GCS bucket created${NC}"
fi

echo "   Making bucket public for direct access..."
gsutil iam ch allUsers:objectViewer gs://${GCS_BUCKET}
echo -e "${GREEN}✅ Bucket is publicly accessible${NC}"

echo ""

# Step 4: Clean up old images from GCR
echo -e "${YELLOW}Step 4: Cleaning up old images from GCR...${NC}"

# List all images and keep only the 3 most recent
OLD_IMAGES=$(gcloud container images list-tags ${IMAGE_NAME} \
  --format='get(digest)' \
  --sort-by=~timestamp \
  --limit=999 2>/dev/null | tail -n +4)

if [ -n "$OLD_IMAGES" ]; then
  echo "   Removing old image versions (keeping 3 most recent)..."
  for digest in $OLD_IMAGES; do
    echo "   • Deleting ${IMAGE_NAME}@${digest}..."
    gcloud container images delete "${IMAGE_NAME}@${digest}" --quiet --force-delete-tags --project=${PROJECT_ID} || true
  done
  echo -e "${GREEN}✅ Old images cleaned up${NC}"
else
  echo -e "${GREEN}✅ No old images to clean up${NC}"
fi

echo ""

# Step 5: Build Docker Image
echo -e "${YELLOW}Step 5: Building Docker Image...${NC}"
echo "   Building ${IMAGE_NAME}:${TIMESTAMP} and ${IMAGE_NAME}:latest..."
docker build -t ${IMAGE_NAME}:${TIMESTAMP} -t ${IMAGE_NAME}:latest .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
fi

echo ""

# Step 6: Push to Container Registry
echo -e "${YELLOW}Step 6: Pushing to Google Container Registry...${NC}"
echo "   Pushing ${IMAGE_NAME}:${TIMESTAMP}..."
docker push ${IMAGE_NAME}:${TIMESTAMP}

echo "   Pushing ${IMAGE_NAME}:latest..."
docker push ${IMAGE_NAME}:latest

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Images pushed successfully${NC}"
else
  echo -e "${RED}❌ Docker push failed${NC}"
  exit 1
fi

echo ""

# Step 7: Deploy Cloud Run Service
echo -e "${YELLOW}Step 7: Deploying Cloud Run Service...${NC}"
echo "   Deploying ${SERVICE_NAME}..."

# Read API keys from files (fallback to environment variables)
if [ -f "../gemini_api_key.txt" ]; then
  GOOGLE_API_KEY=$(cat ../gemini_api_key.txt | tr -d '\n')
else
  GOOGLE_API_KEY="${GOOGLE_API_KEY:-}"
fi

INTERNAL_API_KEY="${INTERNAL_API_KEY:?Error: INTERNAL_API_KEY environment variable must be set}"
BACKEND_API_URL="${BACKEND_API_URL:?Error: BACKEND_API_URL environment variable must be set}"
DB_PASSWORD="${DB_PASSWORD:?Error: DB_PASSWORD environment variable must be set}"

ENV_VARS="GCP_PROJECT_ID=${PROJECT_ID},GCS_BUCKET_NAME=${GCS_BUCKET},DB_HOST=/cloudsql/${PROJECT_ID}:${REGION}:fun-writing,DB_PORT=5432,DB_USER=funwriting,DB_NAME=fun_writing_prod,DB_PASSWORD=${DB_PASSWORD},NODE_ENV=production,GOOGLE_API_KEY=${GOOGLE_API_KEY},GEMINI_API_KEY=${GOOGLE_API_KEY}"

gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --region ${REGION} \
  --service-account ${SERVICE_ACCOUNT_EMAIL} \
  --memory 512Mi \
  --cpu 1 \
  --timeout 600 \
  --port 8080 \
  --set-env-vars ${ENV_VARS} \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:fun-writing \
  --allow-unauthenticated \
  --platform managed \
  --min-instances 0 \
  --max-instances 10 \
  --project ${PROJECT_ID}

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Cloud Run service deployed successfully${NC}"

  # Get the service URL
  SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --region ${REGION} \
    --project ${PROJECT_ID} \
    --format='value(status.url)')

  echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
else
  echo -e "${RED}❌ Cloud Run deployment failed${NC}"
  echo ""

  # Get the latest revision name
  echo -e "${YELLOW}📋 Fetching deployment details...${NC}"
  LATEST_REVISION=$(gcloud run revisions list \
    --service ${SERVICE_NAME} \
    --region ${REGION} \
    --project ${PROJECT_ID} \
    --format='value(name)' \
    --limit 1 2>/dev/null)

  if [ -n "$LATEST_REVISION" ]; then
    echo -e "${YELLOW}   Latest revision: ${LATEST_REVISION}${NC}"
    echo ""

    # Fetch and display recent logs
    echo -e "${YELLOW}📜 Recent logs from failed deployment:${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME} AND resource.labels.revision_name=${LATEST_REVISION}" \
      --project ${PROJECT_ID} \
      --limit 50 \
      --format="table(timestamp,severity,textPayload)" \
      --freshness=5m 2>/dev/null || \
    gcloud run services logs read ${SERVICE_NAME} \
      --region ${REGION} \
      --project ${PROJECT_ID} \
      --limit 50 2>/dev/null

    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Show revision details
    echo -e "${YELLOW}📊 Revision details:${NC}"
    gcloud run revisions describe ${LATEST_REVISION} \
      --region ${REGION} \
      --project ${PROJECT_ID} \
      --format="yaml(status.conditions)" 2>/dev/null
    echo ""

    # Provide helpful debugging commands
    echo -e "${YELLOW}💡 Debugging commands:${NC}"
    echo ""
    echo "  View all logs:"
    echo "    gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --limit 100"
    echo ""
    echo "  View specific revision logs:"
    echo "    gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.revision_name=${LATEST_REVISION}\" --limit 100"
    echo ""
    echo "  Stream live logs:"
    echo "    gcloud run services logs tail ${SERVICE_NAME} --region ${REGION}"
    echo ""
    echo "  View revision status:"
    echo "    gcloud run revisions describe ${LATEST_REVISION} --region ${REGION}"
    echo ""
  else
    echo -e "${RED}   Could not retrieve revision information${NC}"
    echo ""
    echo -e "${YELLOW}💡 Try viewing logs manually:${NC}"
    echo "    gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --limit 50"
    echo ""
  fi

  exit 1
fi

echo ""

# Step 8: Display Configuration Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Deployment Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}✅ AI Agents Service Configuration:${NC}\n"

echo "📋 Service Account:"
echo "   Email: ${SERVICE_ACCOUNT_EMAIL}"
echo ""

echo "📦 GCS Bucket:"
echo "   Bucket: ${GCS_BUCKET}"
echo "   Public Access: Yes"
echo "   URL Pattern: https://storage.googleapis.com/${GCS_BUCKET}/images/{file}"
echo ""

echo "☁️  Cloud Run Service:"
echo "   Service Name: ${SERVICE_NAME}"
echo "   Region: ${REGION}"
echo "   Image: ${IMAGE_NAME}:latest"
echo "   Tagged: ${IMAGE_NAME}:${TIMESTAMP}"
echo "   Memory: 512Mi"
echo "   CPU: 1"
echo "   Port: 8080"
echo "   Service URL: ${SERVICE_URL}"
echo ""

echo "🤖 AI Agents (Google ADK):"
echo "   • ContentSafetyAgent - Text validation"
echo "   • ImageSafetyAgent - Image validation with Gemini vision"
echo "   • PromptAgent - Creative prompt generation"
echo "   • FeedbackAgent - Writing evaluation"
echo "   • VisualMediaAgent - Image/video generation"
echo ""

echo -e "${YELLOW}Next Steps:${NC}\n"

echo "1. Test the health endpoint:"
echo "   curl ${SERVICE_URL}/health"
echo ""

echo "2. Test writing analysis:"
echo "   curl -X POST ${SERVICE_URL}/analyze-writing \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"submissionId\":\"test\",\"userId\":\"user1\",\"studentWriting\":\"Once upon a time...\",\"originalPrompt\":\"Write a story\",\"ageGroup\":\"7-11\"}'"
echo ""

echo "3. View service logs:"
echo "   # Recent logs (last 50 entries)"
echo "   gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --limit 50"
echo ""
echo "   # Stream live logs"
echo "   gcloud run services logs tail ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "   # Detailed logs with timestamps"
echo "   gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}\" --limit 100 --format=\"table(timestamp,severity,textPayload)\""
echo ""

echo "4. Update backend AI_AGENTS_URL to:"
echo "   ${SERVICE_URL}"
echo ""

echo -e "${GREEN}Deployment Summary Saved To:${NC}"
echo "   📄 deployment-config.txt"
echo ""

# Save configuration for reference
cat > deployment-config.txt << EOF
Fun Writing AI Agents Cloud Run Service Deployment Configuration
==================================================================

Deployment Date: $(date)
Project ID: ${PROJECT_ID}
Region: ${REGION}
Framework: Google ADK (Python)

Service Account:
  Email: ${SERVICE_ACCOUNT_EMAIL}
  Roles:
    - Vertex AI User
    - Cloud SQL Client
    - Storage Object Admin
    - Secret Manager Secret Accessor

GCS Bucket:
  Name: ${GCS_BUCKET}
  Access: Public (allUsers:objectViewer)
  Image URL Pattern: https://storage.googleapis.com/${GCS_BUCKET}/images/{submissionId}_{uuid}_{index}.png
  Video URL Pattern: https://storage.googleapis.com/${GCS_BUCKET}/videos/{submissionId}_{uuid}.mp4

Cloud Run Service:
  Name: ${SERVICE_NAME}
  Region: ${REGION}
  Image: ${IMAGE_NAME}:latest
  Tagged: ${IMAGE_NAME}:${TIMESTAMP}
  Memory: 512Mi
  CPU: 1
  Timeout: 600s
  Port: 8080
  Service URL: ${SERVICE_URL}

AI Agents (Google ADK):
  1. ContentSafetyAgent - Validates text content for harmful material
  2. ImageSafetyAgent - Analyzes images with Gemini 2.5 Flash vision
  3. PromptAgent - Generates creative writing prompts
  4. FeedbackAgent - Evaluates student writing with detailed feedback
  5. VisualMediaAgent - Generates images and videos with safety validation

API Endpoints:
  POST ${SERVICE_URL}/analyze-writing
  POST ${SERVICE_URL}/generate-image
  POST ${SERVICE_URL}/generate-video
  POST ${SERVICE_URL}/validate-image
  GET  ${SERVICE_URL}/health

Database Connection:
  Host: /cloudsql/${PROJECT_ID}:${REGION}:fun-writing
  Database: fun_writing_prod
  User: funwriting
  (Password in environment)

Environment Variables:
  GCP_PROJECT_ID=${PROJECT_ID}
  GCS_BUCKET_NAME=${GCS_BUCKET}
  DB_HOST=/cloudsql/${PROJECT_ID}:${REGION}:fun-writing
  DB_NAME=fun_writing_prod
  NODE_ENV=production
  PORT=8080 (auto-set by Cloud Run)

Required API Keys:
  - GOOGLE_API_KEY (for Gemini 2.5 Flash, Gemini 2.5 Flash Image, Veo 3.1)
  - DB_PASSWORD (Cloud SQL password)

Useful Commands:
  View service status:
    gcloud run services describe ${SERVICE_NAME} --region ${REGION}

  View recent logs:
    gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --limit 50

  Stream logs:
    gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --tail

  Test health endpoint:
    curl ${SERVICE_URL}/health

  Test writing analysis:
    curl -X POST ${SERVICE_URL}/analyze-writing \\
      -H 'Content-Type: application/json' \\
      -d '{"submissionId":"test","userId":"user1","studentWriting":"Once upon a time...","originalPrompt":"Write a story","ageGroup":"7-11"}'

  Check GCS bucket:
    gsutil ls -r gs://${GCS_BUCKET}/

  Update service:
    gcloud run services update ${SERVICE_NAME} --region ${REGION} --set-env-vars KEY=VALUE

  Delete service:
    gcloud run services delete ${SERVICE_NAME} --region ${REGION}
EOF

echo -e "${GREEN}Configuration saved to: deployment-config.txt${NC}\n"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
