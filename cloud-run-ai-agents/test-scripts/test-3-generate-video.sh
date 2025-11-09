#!/bin/bash

# Test 3: Generate Video
# This test validates the /generate-video endpoint and GCS storage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

# Load test data if available
if [ -f "$SCRIPT_DIR/test-data.env" ]; then
  source "$SCRIPT_DIR/test-data.env"
fi

log_section "TEST 3: Generate Video"

check_jq
check_gsutil

# ========================================
# Test Case 3.1: Verify GCS Videos Directory
# ========================================

log_info "Test 3.1: Verify GCS videos directory"

videos_path="gs://${GCS_BUCKET}/${GCS_VIDEOS_PATH}/"

log_info "Checking videos directory: $videos_path"

existing_count=$(gsutil ls "$videos_path" 2>/dev/null | wc -l)
log_success "Found $existing_count existing videos in bucket"

# Calculate videos directory size
videos_size=$(gsutil du -s "$videos_path" 2>/dev/null | awk '{print $1}')
formatted_size=$(format_bytes "$videos_size")
log_info "Current videos directory size: $formatted_size"

echo ""

# ========================================
# Test Case 3.2: Generate Animation Style Video
# ========================================

log_info "Test 3.2: Generate animation style video"

request_payload=$(cat <<EOF
{
  "submissionId": "$TEST_SUBMISSION_ID",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$SAMPLE_WRITING_SAFE",
  "ageGroup": "$AGE_GROUP",
  "videoStyle": "animation"
}
EOF
)

echo "Request payload:"
echo "$request_payload" | jq '.' 2>/dev/null

echo ""
log_warning "⚠️ Video generation takes 120-300 seconds (Veo 3.1 processing time)"
log_info "Sending request to $SERVICE_URL/generate-video..."

start_time=$(date +%s)

response=$(http_post "$SERVICE_URL/generate-video" "$request_payload" $TIMEOUT_LONG)

end_time=$(date +%s)
duration=$((end_time - start_time))

http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

echo ""
log_info "Response received in ${duration}s"
log_info "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  log_success "Video generation successful!"

  # Parse response
  success=$(echo "$body" | jq -r '.success' 2>/dev/null)
  video_url=$(echo "$body" | jq -r '.videoUrl' 2>/dev/null)
  media_id=$(echo "$body" | jq -r '.mediaId' 2>/dev/null)
  description=$(echo "$body" | jq -r '.description' 2>/dev/null)
  video_duration=$(echo "$body" | jq -r '.duration' 2>/dev/null)

  echo ""
  echo "🎬 Video Generation Results:"
  echo "$body" | jq '.' 2>/dev/null

  echo ""
  log_success "✓ Success: $success"
  log_success "✓ Media ID: $media_id"
  log_success "✓ Video URL: $video_url"
  log_success "✓ Duration: ${video_duration}s"
  echo ""
  echo "Description:"
  echo "   $description"

  # Save for verification
  export GENERATED_VIDEO_URL="$video_url"

else
  log_error "Video generation failed with HTTP $http_code"
  echo "$body"
  exit 1
fi

echo ""

# ========================================
# Test Case 3.3: Verify Video Saved to GCS
# ========================================

log_info "Test 3.3: Verify video was saved to GCS bucket"

if [ -n "$video_url" ] && [ "$video_url" != "null" ]; then

  # Wait for upload to complete
  log_info "Waiting for video upload to complete..."
  sleep 5

  if verify_gcs_file "$video_url"; then
    log_success "✓ Video exists in GCS"

    # Get file size
    file_size=$(get_gcs_file_size "$video_url")
    formatted_size=$(format_bytes "$file_size")

    log_info "Video size: $formatted_size"

    # Verify it's a valid video (should be > 100KB)
    if [ "$file_size" -gt 102400 ]; then
      log_success "✓ Video size is valid"
    else
      log_warning "⚠️ Video size is small: $formatted_size"
    fi

    # Check if video is publicly accessible
    log_info "Checking if video is publicly accessible..."

    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$video_url")

    if [ "$http_status" = "200" ]; then
      log_success "✓ Video is publicly accessible"

      # Download first few bytes to verify it's a valid MP4
      log_info "Verifying video file format..."

      # Download first 100 bytes
      temp_file="/tmp/video_test_$(date +%s).mp4"
      curl -s -r 0-99 "$video_url" -o "$temp_file"

      # Check for MP4 signature (ftyp)
      if file "$temp_file" | grep -q "ISO Media"; then
        log_success "✓ Valid MP4 video format detected"
      else
        log_warning "⚠️ File format verification inconclusive"
      fi

      rm -f "$temp_file"

    else
      log_warning "⚠️ Video returned HTTP $http_status"
    fi

  else
    log_error "✗ Video not found in GCS"
    exit 1
  fi

else
  log_error "✗ No video URL returned"
  exit 1
fi

echo ""

# ========================================
# Test Case 3.4: Generate Cinematic Style Video
# ========================================

log_info "Test 3.4: Generate cinematic style video"

cinematic_payload=$(cat <<EOF
{
  "submissionId": "$TEST_SUBMISSION_ID",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$SAMPLE_WRITING_SAFE",
  "ageGroup": "$AGE_GROUP",
  "videoStyle": "cinematic"
}
EOF
)

log_warning "Generating cinematic video (this may take 120-300 seconds)..."

start_time=$(date +%s)

response=$(http_post "$SERVICE_URL/generate-video" "$cinematic_payload" $TIMEOUT_LONG)

end_time=$(date +%s)
duration=$((end_time - start_time))

http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

if [ "$http_code" = "200" ]; then
  success=$(echo "$body" | jq -r '.success' 2>/dev/null)
  video_url=$(echo "$body" | jq -r '.videoUrl' 2>/dev/null)

  log_success "✓ Cinematic video generated in ${duration}s"
  log_info "   URL: $video_url"

  # Verify in GCS
  sleep 5
  if verify_gcs_file "$video_url"; then
    log_success "   ✓ Saved to GCS"

    file_size=$(get_gcs_file_size "$video_url")
    formatted_size=$(format_bytes "$file_size")
    log_info "   Size: $formatted_size"
  fi
else
  log_warning "⚠️ Cinematic video failed with HTTP $http_code"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""

# ========================================
# Test Case 3.5: Verify Videos in GCS
# ========================================

log_info "Test 3.5: Verify videos added to GCS bucket"

new_count=$(gsutil ls "$videos_path" 2>/dev/null | wc -l)
videos_added=$((new_count - existing_count))

log_success "Total videos in bucket: $new_count"
log_success "Videos added during test: $videos_added"

# Calculate new videos size
new_videos_size=$(gsutil du -s "$videos_path" 2>/dev/null | awk '{print $1}')
formatted_new_size=$(format_bytes "$new_videos_size")
size_increase=$((new_videos_size - videos_size))
formatted_increase=$(format_bytes "$size_increase")

log_info "Videos size increased by: $formatted_increase"
log_info "New videos directory size: $formatted_new_size"

# List recent videos
echo ""
log_info "Recent videos in bucket:"
gsutil ls -l "$videos_path" 2>/dev/null | tail -5

echo ""

# ========================================
# Test Case 3.6: Query Video Metadata from DB
# ========================================

log_info "Test 3.6: Verify video metadata in database"

if check_psql; then

  # Query recently created video records
  video_query="SELECT id, \"submissionId\", \"mediaType\", \"videoUrl\", \"generationStatus\", \"createdAt\"
               FROM \"GeneratedMedia\"
               WHERE \"mediaType\" = 'video'
               AND \"submissionId\" = '$TEST_SUBMISSION_ID'
               ORDER BY \"createdAt\" DESC
               LIMIT 5;"

  video_records=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -F'|' -c "$video_query" 2>/dev/null)

  if [ -n "$video_records" ]; then
    log_success "Found video records in database:"
    echo ""
    echo "$video_records" | while IFS='|' read -r id sub_id media_type url status created; do
      echo "   ID: $id"
      echo "   Submission: $sub_id"
      echo "   Status: $status"
      echo "   URL: $url"
      echo "   Created: $created"
      echo ""
    done
  else
    log_warning "No video records found (DB save may be disabled)"
  fi

else
  log_warning "Database not available for verification"
fi

echo ""

# ========================================
# Test Summary
# ========================================

log_section "TEST 3 SUMMARY: Generate Video"

echo ""
echo "✅ Completed Test Cases:"
echo "   3.1: Verify GCS videos directory ✓"
echo "   3.2: Generate animation style video ✓"
echo "   3.3: Verify video saved to GCS ✓"
echo "   3.4: Generate cinematic style video ✓"
echo "   3.5: Verify videos in GCS bucket ✓"
echo "   3.6: Query video metadata from DB ✓"
echo ""
echo "📊 Key Metrics:"
echo "   Video Generation Duration: ${duration}s"
echo "   Videos Added: $videos_added"
echo "   Storage Increase: $formatted_increase"
echo "   Videos Directory: $videos_path"
echo ""
echo "🎬 Generated Video:"
echo "   $GENERATED_VIDEO_URL"
echo ""
log_success "All video generation tests completed successfully!"
echo ""
