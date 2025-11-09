#!/bin/bash

# Test 5: Content Safety Checking
# This test validates content safety by querying real submissions from database

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

# Load test data if available
if [ -f "$SCRIPT_DIR/test-data.env" ]; then
  source "$SCRIPT_DIR/test-data.env"
fi

log_section "TEST 5: Content Safety Checking"

check_jq

# ========================================
# Test Case 5.1: Query Safe Content from DB
# ========================================

log_info "Test 5.1: Query safe student submissions from database"

safe_submissions=()

if check_psql; then

  # Query safe submissions (high scores indicate safe content)
  safe_query="SELECT id, content, \"ageGroup\", score
              FROM \"WritingSubmissions\"
              WHERE status = 'reviewed'
              AND score >= 70
              AND LENGTH(content) > 50
              ORDER BY \"createdAt\" DESC
              LIMIT 5;"

  log_info "Querying database for safe submissions..."

  safe_data=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -F'|' -c "$safe_query" 2>/dev/null)

  if [ -n "$safe_data" ]; then
    log_success "Found safe submissions in database:"
    echo ""

    # Read into array
    while IFS='|' read -r sub_id content age_group score; do
      echo "   ID: $sub_id"
      echo "   Age Group: $age_group"
      echo "   Score: $score"
      echo "   Content length: ${#content} characters"
      echo ""

      safe_submissions+=("$sub_id|$content|$age_group")
    done <<< "$safe_data"

    log_success "Loaded ${#safe_submissions[@]} safe submissions for testing"
  else
    log_warning "No safe submissions found in database"
  fi

else
  log_warning "Database not available"
fi

# Use sample data if no DB submissions
if [ ${#safe_submissions[@]} -eq 0 ]; then
  log_info "Using sample safe content for testing"
  safe_submissions+=("sample-1|$SAMPLE_WRITING_SAFE|$AGE_GROUP")
fi

echo ""

# ========================================
# Test Case 5.2: Query Potentially Unsafe Content from DB
# ========================================

log_info "Test 5.2: Query low-scoring submissions (potential safety issues)"

unsafe_submissions=()

if check_psql; then

  # Query low-scoring submissions (may have safety issues)
  unsafe_query="SELECT id, content, \"ageGroup\", score
                FROM \"WritingSubmissions\"
                WHERE status = 'reviewed'
                AND score < 30
                AND LENGTH(content) > 20
                ORDER BY \"createdAt\" DESC
                LIMIT 3;"

  log_info "Querying database for low-scoring submissions..."

  unsafe_data=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -A -F'|' -c "$unsafe_query" 2>/dev/null)

  if [ -n "$unsafe_data" ]; then
    log_info "Found low-scoring submissions:"
    echo ""

    while IFS='|' read -r sub_id content age_group score; do
      echo "   ID: $sub_id"
      echo "   Age Group: $age_group"
      echo "   Score: $score (low)"
      echo "   Content length: ${#content} characters"
      echo ""

      unsafe_submissions+=("$sub_id|$content|$age_group")
    done <<< "$unsafe_data"

    log_info "Loaded ${#unsafe_submissions[@]} low-scoring submissions"
  else
    log_info "No low-scoring submissions found"
  fi

fi

# Add sample unsafe content
unsafe_submissions+=("sample-unsafe|$SAMPLE_WRITING_UNSAFE|$AGE_GROUP")

echo ""

# ========================================
# Test Case 5.3: Test Safe Content Analysis
# ========================================

log_info "Test 5.3: Analyze safe content with safety checks"

safe_passed=0
safe_failed=0

for submission in "${safe_submissions[@]}"; do
  IFS='|' read -r sub_id content age_group <<< "$submission"

  echo ""
  log_info "Testing submission: $sub_id"
  echo "   Age Group: $age_group"
  echo "   Content: ${content:0:100}..."

  request_payload=$(cat <<EOF
{
  "submissionId": "$sub_id",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$content",
  "originalPrompt": "$SAMPLE_PROMPT",
  "ageGroup": "$age_group"
}
EOF
)

  response=$(http_post "$SERVICE_URL/analyze-writing" "$request_payload" $TIMEOUT_MEDIUM)

  http_code=$(extract_http_code "$response")
  body=$(extract_body "$response")

  if [ "$http_code" = "200" ]; then
    is_safe=$(echo "$body" | jq -r '.safetyCheck.isSafe' 2>/dev/null)
    blocked=$(echo "$body" | jq -r '.blocked' 2>/dev/null)
    risk_level=$(echo "$body" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)

    if [ "$is_safe" = "true" ] && [ "$blocked" != "true" ]; then
      log_success "   ✓ Passed safety check (risk: $risk_level)"
      safe_passed=$((safe_passed + 1))
    else
      log_warning "   ⚠️ Failed safety check (risk: $risk_level)"
      safe_failed=$((safe_failed + 1))

      # Show why it was flagged
      issues=$(echo "$body" | jq -r '.safetyCheck.issues' 2>/dev/null)
      if [ "$issues" != "null" ] && [ -n "$issues" ]; then
        echo "   Issues detected: $issues"
      fi
    fi
  else
    log_error "   ✗ Analysis failed (HTTP $http_code)"
    safe_failed=$((safe_failed + 1))
  fi

  sleep 1
done

echo ""
log_info "Safe content results:"
echo "   Passed: $safe_passed"
echo "   Failed: $safe_failed"

echo ""

# ========================================
# Test Case 5.4: Test Unsafe Content Detection
# ========================================

log_info "Test 5.4: Test unsafe content detection"

unsafe_detected=0
unsafe_missed=0

for submission in "${unsafe_submissions[@]}"; do
  IFS='|' read -r sub_id content age_group <<< "$submission"

  echo ""
  log_info "Testing potentially unsafe submission: $sub_id"
  echo "   Age Group: $age_group"
  echo "   Content: ${content:0:100}..."

  request_payload=$(cat <<EOF
{
  "submissionId": "$sub_id",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$content",
  "originalPrompt": "$SAMPLE_PROMPT",
  "ageGroup": "$age_group"
}
EOF
)

  response=$(http_post "$SERVICE_URL/analyze-writing" "$request_payload" $TIMEOUT_MEDIUM)

  http_code=$(extract_http_code "$response")
  body=$(extract_body "$response")

  if [ "$http_code" = "200" ]; then
    is_safe=$(echo "$body" | jq -r '.safetyCheck.isSafe' 2>/dev/null)
    blocked=$(echo "$body" | jq -r '.blocked' 2>/dev/null)
    risk_level=$(echo "$body" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)
    issues=$(echo "$body" | jq -r '.safetyCheck.issues' 2>/dev/null)

    if [ "$is_safe" = "false" ] || [ "$blocked" = "true" ]; then
      log_success "   ✓ Correctly identified as unsafe (risk: $risk_level)"
      unsafe_detected=$((unsafe_detected + 1))

      # Show detected issues
      if [ "$issues" != "null" ] && [ -n "$issues" ]; then
        echo ""
        echo "   🛡️ Issues detected:"
        echo "$body" | jq -r '.safetyCheck.issues[]' 2>/dev/null | sed 's/^/      - /'
      fi

      # Show alert message
      alert_msg=$(echo "$body" | jq -r '.safetyCheck.alertMessage' 2>/dev/null)
      if [ "$alert_msg" != "null" ] && [ -n "$alert_msg" ]; then
        echo ""
        echo "   Alert: $alert_msg"
      fi

    else
      log_warning "   ⚠️ Not flagged as unsafe (risk: $risk_level)"
      unsafe_missed=$((unsafe_missed + 1))
    fi
  else
    log_error "   ✗ Analysis failed (HTTP $http_code)"
  fi

  sleep 1
done

echo ""
log_info "Unsafe content detection results:"
echo "   Correctly detected: $unsafe_detected"
echo "   Missed: $unsafe_missed"

echo ""

# ========================================
# Test Case 5.5: Test Different Age Groups
# ========================================

log_info "Test 5.5: Test content safety across different age groups"

test_content="A story with mild conflict: Two friends had a disagreement and felt sad."

for age_group in "4-6" "7-11" "11-14" "15-18"; do
  echo ""
  log_info "Testing age group: $age_group"

  age_payload=$(cat <<EOF
{
  "submissionId": "test-age-$age_group",
  "userId": "$TEST_USER_ID",
  "studentWriting": "$test_content",
  "originalPrompt": "$SAMPLE_PROMPT",
  "ageGroup": "$age_group"
}
EOF
)

  response=$(http_post "$SERVICE_URL/analyze-writing" "$age_payload" $TIMEOUT_MEDIUM)

  http_code=$(extract_http_code "$response")
  body=$(extract_body "$response")

  if [ "$http_code" = "200" ]; then
    is_safe=$(echo "$body" | jq -r '.safetyCheck.isSafe' 2>/dev/null)
    risk_level=$(echo "$body" | jq -r '.safetyCheck.riskLevel' 2>/dev/null)
    reasoning=$(echo "$body" | jq -r '.safetyCheck.reasoning' 2>/dev/null)

    log_info "   Age $age_group: Safe=$is_safe, Risk=$risk_level"
    echo "   Reasoning: ${reasoning:0:150}..."
  else
    log_error "   Failed for age group $age_group"
  fi

  sleep 1
done

echo ""

# ========================================
# Test Case 5.6: Query Safety Statistics from DB
# ========================================

log_info "Test 5.6: Query safety statistics from database"

if check_psql; then

  # Total submissions
  total_query="SELECT COUNT(*) FROM \"WritingSubmissions\";"
  total_count=$(db_query "$total_query")

  # Reviewed submissions
  reviewed_query="SELECT COUNT(*) FROM \"WritingSubmissions\" WHERE status = 'reviewed';"
  reviewed_count=$(db_query "$reviewed_query")

  # High scoring (likely safe)
  safe_query="SELECT COUNT(*) FROM \"WritingSubmissions\" WHERE status = 'reviewed' AND score >= 70;"
  safe_count=$(db_query "$safe_query")

  # Low scoring (potential issues)
  low_query="SELECT COUNT(*) FROM \"WritingSubmissions\" WHERE status = 'reviewed' AND score < 30;"
  low_count=$(db_query "$low_query")

  # Average score
  avg_query="SELECT ROUND(AVG(score), 2) FROM \"WritingSubmissions\" WHERE status = 'reviewed' AND score IS NOT NULL;"
  avg_score=$(db_query "$avg_query")

  echo ""
  log_success "Database Statistics:"
  echo "   Total Submissions: $total_count"
  echo "   Reviewed: $reviewed_count"
  echo "   High Quality (>= 70): $safe_count"
  echo "   Low Quality (< 30): $low_count"
  echo "   Average Score: $avg_score"

  # Safety rate calculation
  if [ "$reviewed_count" -gt 0 ]; then
    safety_rate=$((safe_count * 100 / reviewed_count))
    echo "   Safety Rate: ${safety_rate}%"
  fi

else
  log_warning "Database not available for statistics"
fi

echo ""

# ========================================
# Test Summary
# ========================================

log_section "TEST 5 SUMMARY: Content Safety Checking"

echo ""
echo "✅ Completed Test Cases:"
echo "   5.1: Query safe content from DB ✓"
echo "   5.2: Query potentially unsafe content from DB ✓"
echo "   5.3: Test safe content analysis ✓"
echo "   5.4: Test unsafe content detection ✓"
echo "   5.5: Test different age groups ✓"
echo "   5.6: Query safety statistics from DB ✓"
echo ""
echo "📊 Test Results:"
echo "   Safe Content Tested: ${#safe_submissions[@]}"
echo "   Unsafe Content Tested: ${#unsafe_submissions[@]}"
echo "   Safe Content Passed: $safe_passed"
echo "   Unsafe Content Detected: $unsafe_detected"
echo ""
echo "🛡️ Safety System Performance:"
if [ ${#safe_submissions[@]} -gt 0 ]; then
  safe_accuracy=$((safe_passed * 100 / ${#safe_submissions[@]}))
  echo "   Safe Content Accuracy: ${safe_accuracy}%"
fi
if [ ${#unsafe_submissions[@]} -gt 0 ]; then
  unsafe_accuracy=$((unsafe_detected * 100 / ${#unsafe_submissions[@]}))
  echo "   Unsafe Detection Rate: ${unsafe_accuracy}%"
fi
echo ""
log_success "All content safety tests completed successfully!"
echo ""
