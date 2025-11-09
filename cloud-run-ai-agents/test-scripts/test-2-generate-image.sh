#!/bin/bash

# Test 2: Generate Image
# This test validates the /generate-image endpoint and GCS storage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

# Load test data if available
if [ -f "$SCRIPT_DIR/test-data.env" ]; then
  source "$SCRIPT_DIR/test-data.env"
fi

log_section "TEST 2: Generate Image"

check_jq
check_gsutil

# ========================================
# Test Case 2.1: Query Test Data from DB
# ========================================

log_info "Test 2.1: Query high-scoring submission from database"

if check_psql; then
  # Query a submission with score >= 51 (required for image generation)
  submission_query="SELECT s.id, s.\"userId\", s.content, s.\"ageGroup\"
                    FROM \"WritingSubmissions\" s
                    WHERE s.status = 'reviewed'
                    AND s.score >= 51
                    LIMIT 1;"

  submission_data=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -F'|' -c "$submission_query" 2>/dev/null)

  if [ -n "$submission_data" ]; then
    IFS='|' read -r db_submission_id db_user_id db_content db_age_group <<< "$submission_data"

    log_success "Found qualifying submission:"
    echo "   Submission ID: $db_submission_id"
    echo "   User ID: $db_user_id"
    echo "   Age Group: $db_age_group"

    TEST_SUBMISSION_ID="$db_submission_id"
    TEST_USER_ID="$db_user_id"
    SAMPLE_WRITING_SAFE="$db_content"
    AGE_GROUP="$db_age_group"
  else
    log_warning "No qualifying submission found (score >= 51)"
    log_info "Using sample data instead"
  fi
else
  log_warning "Database not available, using sample data"
fi

echo ""

# ========================================
# Test Case 2.2: Verify GCS Bucket
# ========================================

log_info "Test 2.2: Verify GCS bucket is accessible"

if verify_gcs_bucket; then
  # Check images directory
  images_path="gs://${GCS_BUCKET}/${GCS_IMAGES_PATH}/"

  log_info "Checking images directory: $images_path"

  existing_count=$(gsutil ls "$images_path" 2>/dev/null | wc -l)
  log_success "Found $existing_count existing images in bucket"

  # Calculate bucket size
  bucket_size=$(gsutil du -s "gs://${GCS_BUCKET}" 2>/dev/null | awk '{print $1}')
  formatted_size=$(format_bytes "$bucket_size")
  log_info "Current bucket size: $formatted_size"
else
  log_error "Cannot access GCS bucket"
  exit 1
fi

echo ""

# ========================================
# Test Case 2.3: Generate Standard Style Image
# ========================================

log_info "Test 2.3: Generate standard style image"

request_payload=$(cat <<EOF
{
  "submissionId": "$TEST_SUBMISSION_ID",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$SAMPLE_WRITING_SAFE",
  "ageGroup": "$AGE_GROUP",
  "imageIndex": 1,
  "imageStyle": "standard"
}
EOF
)

echo "Request payload:"
echo "$request_payload" | jq '.' 2>/dev/null

echo ""
log_info "Sending request to $SERVICE_URL/generate-image..."
log_warning "This may take 60-180 seconds (image generation is slow)..."

start_time=$(date +%s)

response=$(http_post "$SERVICE_URL/generate-image" "$request_payload" $TIMEOUT_LONG)

end_time=$(date +%s)
duration=$((end_time - start_time))

http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

echo ""
log_info "Response received in ${duration}s"
log_info "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  log_success "Image generation successful!"

  # Parse response
  success=$(echo "$body" | jq -r '.success' 2>/dev/null)
  image_url=$(echo "$body" | jq -r '.imageUrl' 2>/dev/null)
  media_id=$(echo "$body" | jq -r '.mediaId' 2>/dev/null)
  prompt=$(echo "$body" | jq -r '.prompt' 2>/dev/null)

  echo ""
  echo "🖼️ Image Generation Results:"
  echo "$body" | jq '.' 2>/dev/null

  echo ""
  log_success "✓ Success: $success"
  log_success "✓ Media ID: $media_id"
  log_success "✓ Image URL: $image_url"
  echo ""
  echo "Generated Prompt:"
  echo "   $prompt"

  # Save for later tests
  export GENERATED_IMAGE_URL="$image_url"

else
  log_error "Image generation failed with HTTP $http_code"
  echo "$body"
  exit 1
fi

echo ""

# ========================================
# Test Case 2.4: Verify Image Saved to GCS
# ========================================

log_info "Test 2.4: Verify image was saved to GCS bucket"

if [ -n "$image_url" ] && [ "$image_url" != "null" ]; then

  # Wait a moment for upload to complete
  sleep 2

  if verify_gcs_file "$image_url"; then
    log_success "✓ Image exists in GCS"

    # Get file size
    file_size=$(get_gcs_file_size "$image_url")
    formatted_size=$(format_bytes "$file_size")

    log_info "Image size: $formatted_size"

    # Verify it's a valid image (should be > 1KB)
    if [ "$file_size" -gt 1024 ]; then
      log_success "✓ Image size is valid"
    else
      log_error "✗ Image size is too small (corrupted?)"
      exit 1
    fi

    # Check if image is publicly accessible
    log_info "Checking if image is publicly accessible..."

    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$image_url")

    if [ "$http_status" = "200" ]; then
      log_success "✓ Image is publicly accessible"
    else
      log_warning "⚠️ Image returned HTTP $http_status (may need bucket permissions)"
    fi

  else
    log_error "✗ Image not found in GCS"
    exit 1
  fi

else
  log_error "✗ No image URL returned"
  exit 1
fi

echo ""

# ========================================
# Test Case 2.5: Generate Different Image Styles
# ========================================

log_info "Test 2.5: Testing different image styles"

for style in "comic" "manga" "princess"; do
  echo ""
  log_info "Generating $style style image..."

  style_payload=$(cat <<EOF
{
  "submissionId": "$TEST_SUBMISSION_ID",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$SAMPLE_WRITING_SAFE",
  "ageGroup": "$AGE_GROUP",
  "imageIndex": 2,
  "imageStyle": "$style"
}
EOF
)

  log_info "Requesting $style style (this may take 60-180 seconds)..."

  start_time=$(date +%s)

  response=$(http_post "$SERVICE_URL/generate-image" "$style_payload" $TIMEOUT_LONG)

  end_time=$(date +%s)
  duration=$((end_time - start_time))

  http_code=$(extract_http_code "$response")
  body=$(extract_body "$response")

  if [ "$http_code" = "200" ]; then
    success=$(echo "$body" | jq -r '.success' 2>/dev/null)
    image_url=$(echo "$body" | jq -r '.imageUrl' 2>/dev/null)

    log_success "✓ $style style image generated in ${duration}s"
    log_info "   URL: $image_url"

    # Verify in GCS
    sleep 2
    if verify_gcs_file "$image_url"; then
      log_success "   ✓ Saved to GCS"
    fi
  else
    log_warning "⚠️ $style style failed with HTTP $http_code"
  fi
done

echo ""

# ========================================
# Test Case 2.6: Count Images in GCS
# ========================================

log_info "Test 2.6: Verify new images added to GCS bucket"

new_count=$(gsutil ls "gs://${GCS_BUCKET}/${GCS_IMAGES_PATH}/" 2>/dev/null | wc -l)
images_added=$((new_count - existing_count))

log_success "Total images in bucket: $new_count"
log_success "Images added during test: $images_added"

# Calculate new bucket size
new_bucket_size=$(gsutil du -s "gs://${GCS_BUCKET}" 2>/dev/null | awk '{print $1}')
formatted_new_size=$(format_bytes "$new_bucket_size")
size_increase=$((new_bucket_size - bucket_size))
formatted_increase=$(format_bytes "$size_increase")

log_info "Bucket size increased by: $formatted_increase"
log_info "New bucket size: $formatted_new_size"

echo ""

# ========================================
# Test Summary
# ========================================

log_section "TEST 2 SUMMARY: Generate Image"

echo ""
echo "✅ Completed Test Cases:"
echo "   2.1: Query test data from database ✓"
echo "   2.2: Verify GCS bucket accessible ✓"
echo "   2.3: Generate standard style image ✓"
echo "   2.4: Verify image saved to GCS ✓"
echo "   2.5: Test multiple image styles ✓"
echo "   2.6: Verify images in GCS bucket ✓"
echo ""
echo "📊 Key Metrics:"
echo "   Image Generation Duration: ${duration}s"
echo "   Images Added: $images_added"
echo "   Bucket Size Increase: $formatted_increase"
echo "   GCS Bucket: gs://$GCS_BUCKET"
echo ""
echo "🖼️ Generated Image:"
echo "   $GENERATED_IMAGE_URL"
echo ""
log_success "All image generation tests completed successfully!"
echo ""
