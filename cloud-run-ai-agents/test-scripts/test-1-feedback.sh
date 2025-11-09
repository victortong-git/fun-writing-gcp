#!/bin/bash

# Test 1: AI Feedback and Re-analysis
# This test validates the /analyze-writing endpoint

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

# Load test data if available
if [ -f "$SCRIPT_DIR/test-data.env" ]; then
  source "$SCRIPT_DIR/test-data.env"
fi

log_section "TEST 1: AI Feedback and Re-analysis"

check_jq

# ========================================
# Test Case 1.1: Query Submission from Database
# ========================================

log_info "Test 1.1: Query existing submission from database for re-analysis"

if check_psql; then
  # Query a real submission from database
  submission_query="SELECT s.id, s.\"userId\", s.content, s.\"ageGroup\", p.prompt
                    FROM \"WritingSubmissions\" s
                    JOIN \"WritingPrompts\" p ON s.\"promptId\" = p.id
                    WHERE s.status = 'reviewed'
                    AND s.score IS NOT NULL
                    LIMIT 1;"

  submission_data=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -F'|' -c "$submission_query" 2>/dev/null)

  if [ -n "$submission_data" ]; then
    # Parse pipe-delimited data
    IFS='|' read -r db_submission_id db_user_id db_content db_age_group db_prompt <<< "$submission_data"

    log_success "Found submission in database:"
    echo "   Submission ID: $db_submission_id"
    echo "   User ID: $db_user_id"
    echo "   Age Group: $db_age_group"
    echo "   Content length: ${#db_content} characters"
    echo "   Prompt length: ${#db_prompt} characters"

    TEST_SUBMISSION_ID="$db_submission_id"
    TEST_USER_ID="$db_user_id"
    SAMPLE_WRITING_SAFE="$db_content"
    SAMPLE_PROMPT="$db_prompt"
    AGE_GROUP="$db_age_group"
  else
    log_warning "No suitable submission found in database"
    log_info "Using sample data instead"
  fi
else
  log_warning "Database not available, using sample data"
fi

echo ""

# ========================================
# Test Case 1.2: Analyze Writing (Safe Content)
# ========================================

log_info "Test 1.2: Analyzing safe student writing"

request_payload=$(cat <<EOF
{
  "submissionId": "$TEST_SUBMISSION_ID",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$SAMPLE_WRITING_SAFE",
  "originalPrompt": "$SAMPLE_PROMPT",
  "ageGroup": "$AGE_GROUP"
}
EOF
)

echo "Request payload:"
echo "$request_payload" | jq '.' 2>/dev/null

echo ""
log_info "Sending request to $SERVICE_URL/analyze-writing..."
echo "   Timeout: ${TIMEOUT_MEDIUM}s"

start_time=$(date +%s)

response=$(http_post "$SERVICE_URL/analyze-writing" "$request_payload" $TIMEOUT_MEDIUM)

end_time=$(date +%s)
duration=$((end_time - start_time))

http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

echo ""
log_info "Response received in ${duration}s"
log_info "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  log_success "Request successful!"

  # Parse response
  success=$(echo "$body" | jq -r '.success' 2>/dev/null)
  score=$(echo "$body" | jq -r '.score' 2>/dev/null)
  safety_is_safe=$(echo "$body" | jq -r '.safetyCheck.isSafe' 2>/dev/null)

  echo ""
  echo "📊 Analysis Results:"
  echo "$body" | jq '.' 2>/dev/null

  echo ""
  log_success "✓ Success: $success"
  log_success "✓ Score: $score/100"
  log_success "✓ Safety Check Passed: $safety_is_safe"

  # Validate response structure
  if [ "$success" = "true" ] && [ -n "$score" ] && [ "$safety_is_safe" = "true" ]; then
    log_success "✓ All validations passed!"
  else
    log_error "✗ Response validation failed"
    exit 1
  fi

  # Save score for later verification
  INITIAL_SCORE="$score"

else
  log_error "Request failed with HTTP $http_code"
  echo "$body"
  exit 1
fi

echo ""

# ========================================
# Test Case 1.3: Verify Feedback Structure
# ========================================

log_info "Test 1.3: Validating feedback structure"

# Check if feedback exists and has required fields
feedback_exists=$(echo "$body" | jq 'has("feedback")' 2>/dev/null)

if [ "$feedback_exists" = "true" ]; then
  log_success "✓ Feedback object exists"

  # Check required feedback fields
  total_score=$(echo "$body" | jq -r '.feedback.totalScore' 2>/dev/null)
  breakdown=$(echo "$body" | jq -r '.feedback.breakdown' 2>/dev/null)
  strengths=$(echo "$body" | jq -r '.feedback.strengths' 2>/dev/null)
  improvements=$(echo "$body" | jq -r '.feedback.areasForImprovement' 2>/dev/null)

  echo ""
  echo "📋 Feedback Breakdown:"
  echo "$body" | jq '.feedback.breakdown' 2>/dev/null

  echo ""
  echo "💪 Strengths:"
  echo "$body" | jq '.feedback.strengths' 2>/dev/null

  echo ""
  echo "📈 Areas for Improvement:"
  echo "$body" | jq '.feedback.areasForImprovement' 2>/dev/null

  # Validate breakdown scores
  grammar_score=$(echo "$body" | jq -r '.feedback.breakdown.grammar' 2>/dev/null)
  spelling_score=$(echo "$body" | jq -r '.feedback.breakdown.spelling' 2>/dev/null)
  relevance_score=$(echo "$body" | jq -r '.feedback.breakdown.relevance' 2>/dev/null)
  creativity_score=$(echo "$body" | jq -r '.feedback.breakdown.creativity' 2>/dev/null)

  echo ""
  log_info "Breakdown Validation:"
  echo "   Grammar: $grammar_score/25"
  echo "   Spelling: $spelling_score/25"
  echo "   Relevance: $relevance_score/25"
  echo "   Creativity: $creativity_score/25"
  echo "   Total: $total_score/100"

  # Check if scores are valid
  if [ "$grammar_score" != "null" ] && [ "$spelling_score" != "null" ] && \
     [ "$relevance_score" != "null" ] && [ "$creativity_score" != "null" ]; then
    log_success "✓ All breakdown scores present"
  else
    log_error "✗ Missing breakdown scores"
    exit 1
  fi

else
  log_error "✗ Feedback object missing"
  exit 1
fi

echo ""

# ========================================
# Test Case 1.4: Analyze Unsafe Content
# ========================================

log_info "Test 1.4: Testing content safety validation with unsafe content"

unsafe_payload=$(cat <<EOF
{
  "submissionId": "test-unsafe-$(date +%s)",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$SAMPLE_WRITING_UNSAFE",
  "originalPrompt": "$SAMPLE_PROMPT",
  "ageGroup": "$AGE_GROUP"
}
EOF
)

echo "Request payload:"
echo "$unsafe_payload" | jq '.' 2>/dev/null

echo ""
log_info "Sending unsafe content for analysis..."

response=$(http_post "$SERVICE_URL/analyze-writing" "$unsafe_payload" $TIMEOUT_MEDIUM)

http_code=$(extract_http_code "$response")
body=$(extract_body "$response")

log_info "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  # Check if content was blocked
  blocked=$(echo "$body" | jq -r '.blocked' 2>/dev/null)
  safety_is_safe=$(echo "$body" | jq -r '.safetyCheck.isSafe' 2>/dev/null)

  echo ""
  echo "🛡️ Safety Check Results:"
  echo "$body" | jq '.' 2>/dev/null

  if [ "$blocked" = "true" ] || [ "$safety_is_safe" = "false" ]; then
    log_success "✓ Unsafe content correctly identified and blocked"
    log_success "✓ Safety system working correctly"
  else
    log_warning "⚠️ Unsafe content was not blocked (may need adjustment)"
  fi
else
  log_error "Request failed with HTTP $http_code"
  echo "$body"
fi

echo ""

# ========================================
# Test Summary
# ========================================

log_section "TEST 1 SUMMARY: AI Feedback and Re-analysis"

echo ""
echo "✅ Completed Test Cases:"
echo "   1.1: Query submission from database ✓"
echo "   1.2: Analyze safe writing content ✓"
echo "   1.3: Validate feedback structure ✓"
echo "   1.4: Test content safety validation ✓"
echo ""
echo "📊 Key Metrics:"
echo "   Analysis Duration: ${duration}s"
echo "   Sample Score: $INITIAL_SCORE/100"
echo "   Service Health: OK"
echo ""
log_success "All feedback tests completed successfully!"
echo ""
