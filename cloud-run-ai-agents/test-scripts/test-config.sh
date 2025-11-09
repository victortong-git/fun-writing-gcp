#!/bin/bash

# Test Configuration
# This file contains all configuration for testing the AI Agents service

# ========================================
# SERVICE CONFIGURATION
# ========================================

# Get Cloud Run service URL (automatically detected)
export SERVICE_URL=$(gcloud run services describe fun-writing-ai-agents \
  --region us-central1 \
  --format='value(status.url)' 2>/dev/null)

# Fallback if gcloud command fails
if [ -z "$SERVICE_URL" ]; then
  export SERVICE_URL="https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app"
  echo "⚠️  Warning: Could not auto-detect service URL, using default: $SERVICE_URL"
else
  echo "✅ Detected service URL: $SERVICE_URL"
fi

# ========================================
# DATABASE CONFIGURATION
# ========================================

export PROJECT_ID="${PROJECT_ID:?Error: PROJECT_ID environment variable must be set}"
export REGION="${REGION:-us-central1}"
export DB_INSTANCE="fun-writing"
export DB_NAME="fun_writing_prod"
export DB_USER="funwriting"
export DB_PASSWORD="${DB_PASSWORD:?Error: DB_PASSWORD environment variable must be set}"

# Cloud SQL connection string
export DB_CONNECTION_STRING="/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}"

# ========================================
# GCS CONFIGURATION
# ========================================

export GCS_BUCKET="fun-writing-media-prod"
export GCS_IMAGES_PATH="images"
export GCS_VIDEOS_PATH="videos"

# ========================================
# TEST DATA
# ========================================

# Sample submission IDs (will be queried from DB)
export TEST_SUBMISSION_ID=""
export TEST_USER_ID=""

# Sample test content
export SAMPLE_WRITING_SAFE='Once upon a time, there was a brave little dragon named Spark who loved to read books. Every day, Spark would fly to the village library and spend hours reading adventure stories. One day, Spark discovered a magical book that could bring stories to life!'

export SAMPLE_WRITING_UNSAFE='I hate everyone and want to hurt people. Violence is good.'

export SAMPLE_PROMPT='Write a creative story about a dragon who loves to read'

export AGE_GROUP='7-11'

# ========================================
# TEST IMAGE URLS (from GCS)
# ========================================

export SAMPLE_SAFE_IMAGE_URL=""  # Will be populated from GCS
export SAMPLE_UNSAFE_IMAGE_URL=""  # Will be populated from GCS (if available)

# ========================================
# TIMEOUT SETTINGS
# ========================================

export TIMEOUT_SHORT=30        # 30 seconds for quick operations
export TIMEOUT_MEDIUM=90       # 90 seconds for AI analysis
export TIMEOUT_LONG=180        # 180 seconds for image/video generation

# ========================================
# HELPER FUNCTIONS
# ========================================

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Print colored output
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if jq is installed
check_jq() {
  if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install jq: sudo apt-get install jq"
    exit 1
  fi
}

# Check if psql is installed
check_psql() {
  if ! command -v psql &> /dev/null; then
    log_warning "psql is not installed. Database queries will be skipped."
    return 1
  fi
  return 0
}

# Check if gsutil is installed
check_gsutil() {
  if ! command -v gsutil &> /dev/null; then
    log_error "gsutil is not installed. Please install Google Cloud SDK."
    exit 1
  fi
}

# Execute database query via Cloud SQL Proxy
db_query() {
  local query="$1"

  if ! check_psql; then
    log_warning "Skipping database query (psql not available)"
    return 1
  fi

  # Use Cloud SQL Proxy connection
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -c "$query" 2>/dev/null
}

# Get a test submission ID from database
get_test_submission_id() {
  log_info "Querying database for a test submission..."

  local submission_id=$(db_query "SELECT id FROM \"WritingSubmissions\" WHERE status = 'reviewed' LIMIT 1;")

  if [ -z "$submission_id" ]; then
    log_warning "No reviewed submissions found in database"
    return 1
  fi

  log_success "Found test submission ID: $submission_id"
  echo "$submission_id"
}

# Get test user ID from database
get_test_user_id() {
  local submission_id="$1"

  if [ -z "$submission_id" ]; then
    log_warning "No submission ID provided"
    return 1
  fi

  local user_id=$(db_query "SELECT \"userId\" FROM \"WritingSubmissions\" WHERE id = '$submission_id';")

  if [ -z "$user_id" ]; then
    log_warning "No user ID found for submission $submission_id"
    return 1
  fi

  log_success "Found user ID: $user_id"
  echo "$user_id"
}

# Get a sample image URL from GCS
get_sample_image_from_gcs() {
  log_info "Fetching sample image from GCS bucket..."

  local image_url=$(gsutil ls "gs://${GCS_BUCKET}/${GCS_IMAGES_PATH}/" | head -1)

  if [ -z "$image_url" ]; then
    log_warning "No images found in GCS bucket"
    return 1
  fi

  # Convert gs:// URL to https:// URL
  image_url=$(echo "$image_url" | sed "s|gs://${GCS_BUCKET}|https://storage.googleapis.com/${GCS_BUCKET}|")

  log_success "Found sample image: $image_url"
  echo "$image_url"
}

# Verify GCS bucket exists and is accessible
verify_gcs_bucket() {
  log_info "Verifying GCS bucket: gs://${GCS_BUCKET}"

  if gsutil ls "gs://${GCS_BUCKET}" &>/dev/null; then
    log_success "GCS bucket is accessible"
    return 0
  else
    log_error "Cannot access GCS bucket: gs://${GCS_BUCKET}"
    return 1
  fi
}

# Make HTTP request with timeout
http_post() {
  local url="$1"
  local data="$2"
  local timeout="${3:-$TIMEOUT_MEDIUM}"

  curl -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$data" \
    --max-time "$timeout" \
    -s -w "\nHTTP_CODE:%{http_code}\n"
}

http_get() {
  local url="$1"
  local timeout="${2:-$TIMEOUT_SHORT}"

  curl -X GET "$url" \
    -H "Content-Type: application/json" \
    --max-time "$timeout" \
    -s -w "\nHTTP_CODE:%{http_code}\n"
}

# Extract HTTP code from curl response
extract_http_code() {
  echo "$1" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://'
}

# Extract JSON body from curl response
extract_body() {
  echo "$1" | sed '/HTTP_CODE:/d'
}

# Verify GCS file exists
verify_gcs_file() {
  local file_url="$1"

  # Convert https:// URL to gs:// URL
  local gs_url=$(echo "$file_url" | sed "s|https://storage.googleapis.com/|gs://|")

  if gsutil ls "$gs_url" &>/dev/null; then
    log_success "File exists in GCS: $gs_url"
    return 0
  else
    log_error "File not found in GCS: $gs_url"
    return 1
  fi
}

# Get file size from GCS
get_gcs_file_size() {
  local file_url="$1"

  # Convert https:// URL to gs:// URL
  local gs_url=$(echo "$file_url" | sed "s|https://storage.googleapis.com/|gs://|")

  local size=$(gsutil du "$gs_url" 2>/dev/null | awk '{print $1}')

  if [ -z "$size" ]; then
    echo "0"
  else
    echo "$size"
  fi
}

# Format bytes to human readable
format_bytes() {
  local bytes=$1

  if [ "$bytes" -lt 1024 ]; then
    echo "${bytes} B"
  elif [ "$bytes" -lt 1048576 ]; then
    echo "$(($bytes / 1024)) KB"
  else
    echo "$(($bytes / 1048576)) MB"
  fi
}

# Export functions
export -f log_info
export -f log_success
export -f log_warning
export -f log_error
export -f log_section
export -f check_jq
export -f check_psql
export -f check_gsutil
export -f db_query
export -f get_test_submission_id
export -f get_test_user_id
export -f get_sample_image_from_gcs
export -f verify_gcs_bucket
export -f http_post
export -f http_get
export -f extract_http_code
export -f extract_body
export -f verify_gcs_file
export -f get_gcs_file_size
export -f format_bytes

echo ""
log_success "Test configuration loaded successfully!"
echo ""
