#!/bin/bash

# Run All Tests
# Master script to execute all test cases sequentially

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-config.sh"

# ========================================
# Test Execution Configuration
# ========================================

# Which tests to run (set to 0 to skip)
RUN_SETUP=1
RUN_FEEDBACK=1
RUN_IMAGE_GEN=1
RUN_VIDEO_GEN=1
RUN_IMAGE_SAFETY=1
RUN_CONTENT_SAFETY=1

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --skip-setup)
      RUN_SETUP=0
      ;;
    --skip-feedback)
      RUN_FEEDBACK=0
      ;;
    --skip-image-gen)
      RUN_IMAGE_GEN=0
      ;;
    --skip-video-gen)
      RUN_VIDEO_GEN=0
      ;;
    --skip-image-safety)
      RUN_IMAGE_SAFETY=0
      ;;
    --skip-content-safety)
      RUN_CONTENT_SAFETY=0
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-setup            Skip test data setup"
      echo "  --skip-feedback         Skip feedback tests"
      echo "  --skip-image-gen        Skip image generation tests"
      echo "  --skip-video-gen        Skip video generation tests"
      echo "  --skip-image-safety     Skip image safety tests"
      echo "  --skip-content-safety   Skip content safety tests"
      echo "  --help                  Show this help message"
      echo ""
      echo "Example:"
      echo "  $0 --skip-video-gen --skip-image-gen"
      echo ""
      exit 0
      ;;
  esac
done

# ========================================
# Header
# ========================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                   FUN WRITING AI AGENTS - FULL TEST SUITE                    ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

log_info "Starting comprehensive test suite..."
echo ""
echo "Test Configuration:"
echo "  Service URL: $SERVICE_URL"
echo "  GCS Bucket: $GCS_BUCKET"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

start_time=$(date +%s)

# ========================================
# Setup Test Data
# ========================================

if [ "$RUN_SETUP" -eq 1 ]; then
  log_section "SETUP: Preparing Test Data"

  if bash "$SCRIPT_DIR/setup-test-data.sh"; then
    log_success "Setup completed successfully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Setup failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log_error "Cannot continue without test data"
    exit 1
  fi

  echo ""
  read -p "Press Enter to continue with tests..."
else
  log_info "Skipping test data setup"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))

  # Load existing test data
  if [ -f "$SCRIPT_DIR/test-data.env" ]; then
    source "$SCRIPT_DIR/test-data.env"
    log_success "Loaded existing test data"
  else
    log_warning "No test data found. Run with setup first."
  fi
fi

echo ""

# ========================================
# Test 1: AI Feedback and Re-analysis
# ========================================

if [ "$RUN_FEEDBACK" -eq 1 ]; then
  log_section "TEST 1: AI Feedback and Re-analysis"

  if bash "$SCRIPT_DIR/test-1-feedback.sh"; then
    log_success "Test 1 PASSED ✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Test 1 FAILED ✗"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
  read -p "Press Enter to continue to next test..."
else
  log_info "Skipping Test 1: AI Feedback"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

echo ""

# ========================================
# Test 2: Generate Image
# ========================================

if [ "$RUN_IMAGE_GEN" -eq 1 ]; then
  log_section "TEST 2: Generate Image"

  log_warning "⚠️ This test may take 5-10 minutes (image generation is slow)"
  echo ""

  if bash "$SCRIPT_DIR/test-2-generate-image.sh"; then
    log_success "Test 2 PASSED ✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Test 2 FAILED ✗"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
  read -p "Press Enter to continue to next test..."
else
  log_info "Skipping Test 2: Generate Image"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

echo ""

# ========================================
# Test 3: Generate Video
# ========================================

if [ "$RUN_VIDEO_GEN" -eq 1 ]; then
  log_section "TEST 3: Generate Video"

  log_warning "⚠️ This test may take 10-15 minutes (video generation is very slow)"
  echo ""

  if bash "$SCRIPT_DIR/test-3-generate-video.sh"; then
    log_success "Test 3 PASSED ✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Test 3 FAILED ✗"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
  read -p "Press Enter to continue to next test..."
else
  log_info "Skipping Test 3: Generate Video"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

echo ""

# ========================================
# Test 4: Image Safety Checking
# ========================================

if [ "$RUN_IMAGE_SAFETY" -eq 1 ]; then
  log_section "TEST 4: Image Safety Checking"

  if bash "$SCRIPT_DIR/test-4-image-safety.sh"; then
    log_success "Test 4 PASSED ✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Test 4 FAILED ✗"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
  read -p "Press Enter to continue to next test..."
else
  log_info "Skipping Test 4: Image Safety Checking"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

echo ""

# ========================================
# Test 5: Content Safety Checking
# ========================================

if [ "$RUN_CONTENT_SAFETY" -eq 1 ]; then
  log_section "TEST 5: Content Safety Checking"

  if bash "$SCRIPT_DIR/test-5-content-safety.sh"; then
    log_success "Test 5 PASSED ✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Test 5 FAILED ✗"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  log_info "Skipping Test 5: Content Safety Checking"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

echo ""

# ========================================
# Final Summary
# ========================================

end_time=$(date +%s)
total_duration=$((end_time - start_time))
minutes=$((total_duration / 60))
seconds=$((total_duration % 60))

log_section "FINAL TEST RESULTS"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        TEST EXECUTION SUMMARY                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

total_tests=$((TESTS_PASSED + TESTS_FAILED))

echo "📊 Test Results:"
echo "   Total Tests Run: $total_tests"
echo "   Passed: $TESTS_PASSED ✓"
echo "   Failed: $TESTS_FAILED ✗"
echo "   Skipped: $TESTS_SKIPPED"
echo ""

if [ "$total_tests" -gt 0 ]; then
  pass_rate=$((TESTS_PASSED * 100 / total_tests))
  echo "   Pass Rate: ${pass_rate}%"
  echo ""
fi

echo "⏱️  Execution Time:"
echo "   Total Duration: ${minutes}m ${seconds}s"
echo ""

echo "🔗 Service Information:"
echo "   Service URL: $SERVICE_URL"
echo "   GCS Bucket: gs://$GCS_BUCKET"
echo ""

# Determine overall result
if [ "$TESTS_FAILED" -eq 0 ] && [ "$total_tests" -gt 0 ]; then
  log_success "═══════════════════════════════════════════════════════════════════"
  log_success "               ALL TESTS PASSED SUCCESSFULLY! 🎉                 "
  log_success "═══════════════════════════════════════════════════════════════════"
  echo ""
  log_success "Your AI Agents service is fully operational!"
  echo ""
  exit 0
elif [ "$TESTS_FAILED" -gt 0 ]; then
  log_error "═══════════════════════════════════════════════════════════════════"
  log_error "                 SOME TESTS FAILED ⚠️                            "
  log_error "═══════════════════════════════════════════════════════════════════"
  echo ""
  log_error "$TESTS_FAILED test(s) failed. Please review the logs above."
  echo ""
  echo "Troubleshooting tips:"
  echo "  1. Check Cloud Run logs: gcloud run services logs read fun-writing-ai-agents --region us-central1"
  echo "  2. Verify environment variables are set correctly"
  echo "  3. Check GCS bucket permissions"
  echo "  4. Verify database connectivity"
  echo ""
  exit 1
else
  log_warning "═══════════════════════════════════════════════════════════════════"
  log_warning "              NO TESTS WERE EXECUTED                             "
  log_warning "═══════════════════════════════════════════════════════════════════"
  echo ""
  log_info "Run with --help to see available options"
  echo ""
  exit 0
fi
