#!/bin/bash

# Setup Test Data
# This script prepares test data by querying database and GCS

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

log_section "Setting Up Test Data"

# Check dependencies
check_jq
check_gsutil

# ========================================
# Step 1: Verify Service is Running
# ========================================

log_info "Step 1: Verifying AI Agents service is running..."

response=$(http_get "$SERVICE_URL/health" $TIMEOUT_SHORT)
http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

if [ "$http_code" = "200" ]; then
  log_success "Service is running!"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  log_error "Service is not responding. HTTP Code: $http_code"
  exit 1
fi

echo ""

# ========================================
# Step 2: Verify GCS Bucket
# ========================================

log_info "Step 2: Verifying GCS bucket..."

if verify_gcs_bucket; then
  # Count images
  image_count=$(gsutil ls "gs://${GCS_BUCKET}/${GCS_IMAGES_PATH}/" 2>/dev/null | wc -l)
  log_success "Found $image_count images in bucket"

  # Count videos
  video_count=$(gsutil ls "gs://${GCS_BUCKET}/${GCS_VIDEOS_PATH}/" 2>/dev/null | wc -l)
  log_success "Found $video_count videos in bucket"
else
  log_error "Cannot verify GCS bucket"
  exit 1
fi

echo ""

# ========================================
# Step 3: Get Test Data from Database
# ========================================

log_info "Step 3: Querying database for test data..."

if check_psql; then
  # Get a test submission ID
  TEST_SUBMISSION_ID=$(get_test_submission_id)

  if [ -n "$TEST_SUBMISSION_ID" ]; then
    export TEST_SUBMISSION_ID

    # Get user ID for this submission
    TEST_USER_ID=$(get_test_user_id "$TEST_SUBMISSION_ID")
    export TEST_USER_ID

    # Get submission details
    log_info "Fetching submission details..."

    submission_query="SELECT id, \"userId\", content, score, status, \"ageGroup\"
                      FROM \"WritingSubmissions\"
                      WHERE id = '$TEST_SUBMISSION_ID';"

    submission_details=$(db_query "$submission_query")

    if [ -n "$submission_details" ]; then
      log_success "Submission details retrieved"
      echo "   $submission_details"
    fi

    # Get user details
    if [ -n "$TEST_USER_ID" ]; then
      log_info "Fetching user details..."

      user_query="SELECT id, username, \"ageGroup\", \"totalScore\", level, \"aiCredits\"
                  FROM \"Users\"
                  WHERE id = '$TEST_USER_ID';"

      user_details=$(db_query "$user_query")

      if [ -n "$user_details" ]; then
        log_success "User details retrieved"
        echo "   $user_details"
      fi
    fi
  else
    log_warning "No test submission found. You may need to create submissions first."
    log_info "Using mock data for testing..."

    TEST_SUBMISSION_ID="test-$(date +%s)"
    TEST_USER_ID="test-user-$(date +%s)"

    export TEST_SUBMISSION_ID
    export TEST_USER_ID
  fi
else
  log_warning "Database queries skipped (psql not available)"
  log_info "Using mock data for testing..."

  TEST_SUBMISSION_ID="test-$(date +%s)"
  TEST_USER_ID="test-user-$(date +%s)"

  export TEST_SUBMISSION_ID
  export TEST_USER_ID
fi

echo ""

# ========================================
# Step 4: Get Sample Images from GCS
# ========================================

log_info "Step 4: Getting sample images from GCS..."

SAMPLE_SAFE_IMAGE_URL=$(get_sample_image_from_gcs)

if [ -n "$SAMPLE_SAFE_IMAGE_URL" ]; then
  export SAMPLE_SAFE_IMAGE_URL

  # Get file size
  file_size=$(get_gcs_file_size "$SAMPLE_SAFE_IMAGE_URL")
  formatted_size=$(format_bytes "$file_size")

  log_success "Sample image URL: $SAMPLE_SAFE_IMAGE_URL"
  log_info "Image size: $formatted_size"
else
  log_warning "No sample images found in GCS. Image safety tests will use generated images."
fi

echo ""

# ========================================
# Step 5: Save Test Configuration
# ========================================

log_info "Step 5: Saving test configuration..."

cat > "$SCRIPT_DIR/test-data.env" << EOF
# Auto-generated test data configuration
# Generated: $(date)

export TEST_SUBMISSION_ID="$TEST_SUBMISSION_ID"
export TEST_USER_ID="$TEST_USER_ID"
export SAMPLE_SAFE_IMAGE_URL="$SAMPLE_SAFE_IMAGE_URL"
export SERVICE_URL="$SERVICE_URL"
export GCS_BUCKET="$GCS_BUCKET"

# Test content
export SAMPLE_WRITING_SAFE='$SAMPLE_WRITING_SAFE'
export SAMPLE_WRITING_UNSAFE='$SAMPLE_WRITING_UNSAFE'
export SAMPLE_PROMPT='$SAMPLE_PROMPT'
export AGE_GROUP='$AGE_GROUP'
EOF

log_success "Test configuration saved to test-data.env"

echo ""

# ========================================
# Summary
# ========================================

log_section "Test Data Setup Complete!"

echo ""
echo "📊 Test Configuration Summary:"
echo ""
echo "  Service URL:       $SERVICE_URL"
echo "  GCS Bucket:        gs://$GCS_BUCKET"
echo "  Test Submission:   $TEST_SUBMISSION_ID"
echo "  Test User:         $TEST_USER_ID"
echo "  Sample Image:      ${SAMPLE_SAFE_IMAGE_URL:-Not available}"
echo ""
echo "✅ Ready to run tests!"
echo ""
echo "Next steps:"
echo "  1. Run all tests:           ./run-all-tests.sh"
echo "  2. Run individual test:     ./test-1-feedback.sh"
echo "  3. View test data:          cat test-data.env"
echo ""
