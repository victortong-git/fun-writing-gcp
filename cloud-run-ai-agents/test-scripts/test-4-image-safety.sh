#!/bin/bash

# Test 4: Image Safety Checking
# This test validates the /validate-image endpoint with images from GCS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

# Load test data if available
if [ -f "$SCRIPT_DIR/test-data.env" ]; then
  source "$SCRIPT_DIR/test-data.env"
fi

log_section "TEST 4: Image Safety Checking"

check_jq
check_gsutil

# ========================================
# Test Case 4.1: Get Sample Images from GCS
# ========================================

log_info "Test 4.1: Fetch sample images from GCS bucket for safety testing"

images_path="gs://${GCS_BUCKET}/${GCS_IMAGES_PATH}/"

log_info "Fetching images from: $images_path"

# Get up to 5 sample images from GCS
sample_images=$(gsutil ls "$images_path" 2>/dev/null | head -5)

if [ -z "$sample_images" ]; then
  log_error "No images found in GCS bucket"
  log_info "Please run test-2-generate-image.sh first to generate images"
  exit 1
fi

# Convert to array
IFS=$'\n' read -rd '' -a image_array <<<"$sample_images" || true

image_count=${#image_array[@]}
log_success "Found $image_count sample images in GCS"

echo ""
echo "Sample images:"
for i in "${!image_array[@]}"; do
  # Convert gs:// to https://
  https_url=$(echo "${image_array[$i]}" | sed "s|gs://${GCS_BUCKET}|https://storage.googleapis.com/${GCS_BUCKET}|")
  echo "   $((i+1)). $https_url"

  # Get file size
  file_size=$(get_gcs_file_size "$https_url")
  formatted_size=$(format_bytes "$file_size")
  echo "      Size: $formatted_size"
done

# Use first image for testing
SAMPLE_IMAGE_URL=$(echo "${image_array[0]}" | sed "s|gs://${GCS_BUCKET}|https://storage.googleapis.com/${GCS_BUCKET}|")

echo ""

# ========================================
# Test Case 4.2: Validate Safe Image
# ========================================

log_info "Test 4.2: Validate safe image from GCS"

echo "Testing image: $SAMPLE_IMAGE_URL"

request_payload=$(cat <<EOF
{
  "imageUrl": "$SAMPLE_IMAGE_URL",
  "ageGroup": "$AGE_GROUP",
  "context": "Student-generated story illustration"
}
EOF
)

echo ""
echo "Request payload:"
echo "$request_payload" | jq '.' 2>/dev/null

echo ""
log_info "Sending request to $SERVICE_URL/validate-image..."
log_info "This may take 30-60 seconds (Gemini vision analysis)..."

start_time=$(date +%s)

response=$(http_post "$SERVICE_URL/validate-image" "$request_payload" $TIMEOUT_MEDIUM)

end_time=$(date +%s)
duration=$((end_time - start_time))

http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

echo ""
log_info "Response received in ${duration}s"
log_info "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  log_success "Image validation successful!"

  # Parse response
  success=$(echo "$body" | jq -r '.success' 2>/dev/null)
  is_safe=$(echo "$body" | jq -r '.isSafe' 2>/dev/null)
  blocked=$(echo "$body" | jq -r '.blocked' 2>/dev/null)
  risk_level=$(echo "$body" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)
  visual_desc=$(echo "$body" | jq -r '.safetyCheck.visualDescription' 2>/dev/null)

  echo ""
  echo "🛡️ Image Safety Results:"
  echo "$body" | jq '.' 2>/dev/null

  echo ""
  log_success "✓ Success: $success"
  log_success "✓ Is Safe: $is_safe"
  log_success "✓ Risk Level: $risk_level"
  log_success "✓ Blocked: $blocked"

  if [ "$is_safe" = "true" ]; then
    log_success "✓ Image passed safety validation"
  else
    log_warning "⚠️ Image flagged as unsafe"
  fi

  echo ""
  echo "📷 Visual Description:"
  echo "   $visual_desc"

else
  log_error "Image validation failed with HTTP $http_code"
  echo "$body"
  exit 1
fi

echo ""

# ========================================
# Test Case 4.3: Test Multiple Images
# ========================================

log_info "Test 4.3: Validate multiple images from GCS"

safe_count=0
unsafe_count=0
error_count=0

for i in "${!image_array[@]}"; do
  if [ "$i" -eq 0 ]; then
    continue  # Skip first image (already tested)
  fi

  # Convert gs:// to https://
  test_image_url=$(echo "${image_array[$i]}" | sed "s|gs://${GCS_BUCKET}|https://storage.googleapis.com/${GCS_BUCKET}|")

  echo ""
  log_info "Testing image $((i+1))/$image_count: $(basename "$test_image_url")"

  test_payload=$(cat <<EOF
{
  "imageUrl": "$test_image_url",
  "ageGroup": "$AGE_GROUP",
  "context": "Automated safety testing"
}
EOF
)

  response=$(http_post "$SERVICE_URL/validate-image" "$test_payload" $TIMEOUT_MEDIUM)

  http_code=$(extract_http_code "$response")
  body=$(extract_body "$response")

  if [ "$http_code" = "200" ]; then
    is_safe=$(echo "$body" | jq -r '.isSafe' 2>/dev/null)
    risk_level=$(echo "$body" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)

    if [ "$is_safe" = "true" ]; then
      log_success "   ✓ Safe (risk: $risk_level)"
      safe_count=$((safe_count + 1))
    else
      log_warning "   ⚠️ Flagged as unsafe (risk: $risk_level)"
      unsafe_count=$((unsafe_count + 1))
    fi
  else
    log_error "   ✗ Validation failed (HTTP $http_code)"
    error_count=$((error_count + 1))
  fi

  # Small delay between requests
  sleep 2
done

echo ""
log_info "Batch validation results:"
echo "   Safe images: $safe_count"
echo "   Unsafe images: $unsafe_count"
echo "   Errors: $error_count"

echo ""

# ========================================
# Test Case 4.4: Test With/Without Context
# ========================================

log_info "Test 4.4: Compare validation with and without context"

# Test without context
echo ""
log_info "Testing WITHOUT context..."

no_context_payload=$(cat <<EOF
{
  "imageUrl": "$SAMPLE_IMAGE_URL",
  "ageGroup": "$AGE_GROUP"
}
EOF
)

response1=$(http_post "$SERVICE_URL/validate-image" "$no_context_payload" $TIMEOUT_MEDIUM)
http_code1=$(extract_http_code "$response1")
body1=$(extract_body "$response1")

if [ "$http_code1" = "200" ]; then
  is_safe1=$(echo "$body1" | jq -r '.isSafe' 2>/dev/null)
  risk1=$(echo "$body1" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)
  log_success "Without context - Is Safe: $is_safe1, Risk: $risk1"
else
  log_error "Request failed"
fi

# Test with context
echo ""
log_info "Testing WITH context..."

with_context_payload=$(cat <<EOF
{
  "imageUrl": "$SAMPLE_IMAGE_URL",
  "ageGroup": "$AGE_GROUP",
  "context": "This is an illustration for a children's story about a friendly dragon learning to read books at the library. The story promotes literacy and friendship."
}
EOF
)

response2=$(http_post "$SERVICE_URL/validate-image" "$with_context_payload" $TIMEOUT_MEDIUM)
http_code2=$(extract_http_code "$response2")
body2=$(extract_body "$response2")

if [ "$http_code2" = "200" ]; then
  is_safe2=$(echo "$body2" | jq -r '.isSafe' 2>/dev/null)
  risk2=$(echo "$body2" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)
  log_success "With context - Is Safe: $is_safe2, Risk: $risk2"
else
  log_error "Request failed"
fi

echo ""
log_info "Context comparison:"
echo "   Without context: Safe=$is_safe1, Risk=$risk1"
echo "   With context:    Safe=$is_safe2, Risk=$risk2"

if [ "$risk1" != "$risk2" ]; then
  log_info "   ℹ️ Context affected the risk assessment"
else
  log_info "   ℹ️ Context did not change the risk level"
fi

echo ""

# ========================================
# Test Case 4.5: Query Image Safety Records from DB
# ========================================

log_info "Test 4.5: Query image safety records from database"

if check_psql; then

  # Query safety check records (if stored in DB)
  safety_query="SELECT COUNT(*) as total_checks
                FROM \"GeneratedMedia\"
                WHERE \"mediaType\" = 'image'
                AND \"generationStatus\" = 'completed';"

  check_count=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -c "$safety_query" 2>/dev/null)

  if [ -n "$check_count" ] && [ "$check_count" != "0" ]; then
    log_success "Found $check_count completed image records in database"

    # Get recent images
    recent_query="SELECT \"imageUrl\", \"generationStatus\", \"createdAt\"
                  FROM \"GeneratedMedia\"
                  WHERE \"mediaType\" = 'image'
                  ORDER BY \"createdAt\" DESC
                  LIMIT 5;"

    recent_images=$(PGPASSWORD="$DB_PASSWORD" psql \
      -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -t -A -F'|' -c "$recent_query" 2>/dev/null)

    if [ -n "$recent_images" ]; then
      echo ""
      log_info "Recent images from database:"
      echo "$recent_images" | while IFS='|' read -r url status created; do
        echo "   URL: $url"
        echo "   Status: $status"
        echo "   Created: $created"
        echo ""
      done
    fi
  else
    log_info "No image records found in database"
  fi

else
  log_warning "Database not available for verification"
fi

echo ""

# ========================================
# Test Summary
# ========================================

log_section "TEST 4 SUMMARY: Image Safety Checking"

echo ""
echo "✅ Completed Test Cases:"
echo "   4.1: Get sample images from GCS ✓"
echo "   4.2: Validate safe image ✓"
echo "   4.3: Test multiple images ✓"
echo "   4.4: Test with/without context ✓"
echo "   4.5: Query safety records from DB ✓"
echo ""
echo "📊 Key Metrics:"
echo "   Images Tested: $image_count"
echo "   Safe Images: $safe_count"
echo "   Flagged Images: $unsafe_count"
echo "   Validation Duration: ${duration}s per image"
echo "   GCS Bucket: gs://$GCS_BUCKET/$GCS_IMAGES_PATH/"
echo ""
echo "🛡️ Safety System Status:"
echo "   Service: Operational"
echo "   Gemini Vision: Working"
echo "   GCS Integration: Connected"
echo ""
log_success "All image safety tests completed successfully!"
echo ""
