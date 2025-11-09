# AI Agents Test Suite

Comprehensive test scripts for the Fun Writing AI Agents Cloud Run service.

## 📋 Overview

This test suite validates all AI agent functionality including:

1. **AI Feedback and Re-analysis** - Writing analysis with Gemini
2. **Image Generation** - Gemini 2.5 Flash Image with GCS storage
3. **Video Generation** - Veo 3.1 with GCS storage
4. **Image Safety Checking** - Gemini vision-based validation
5. **Content Safety Checking** - Text content validation

## 🔧 Prerequisites

### Required Tools

```bash
# Check if tools are installed
jq --version          # JSON parsing (required)
gsutil --version      # GCS operations (required)
psql --version        # Database queries (optional)
curl --version        # HTTP requests (required)
gcloud --version      # Cloud SDK (required)
```

### Install Missing Tools

```bash
# Install jq (JSON parser)
sudo apt-get install jq

# Install Google Cloud SDK (includes gsutil and gcloud)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install PostgreSQL client (for database queries)
sudo apt-get install postgresql-client

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### Required Permissions

Your Google Cloud account needs:
- Cloud Run Viewer (to query service URL)
- Storage Object Viewer (to read from GCS bucket)
- Cloud SQL Client (optional, for database queries)

## 🚀 Quick Start

### 1. Make Scripts Executable

```bash
cd /home/user/fun-writing/04-cloud-run-ai-agents/test-scripts
chmod +x *.sh
```

### 2. Run Setup

```bash
# Setup test data (queries database and GCS)
./setup-test-data.sh
```

This will:
- Verify AI Agents service is running
- Check GCS bucket accessibility
- Query test submissions from database
- Fetch sample images from GCS
- Generate `test-data.env` configuration file

### 3. Run All Tests

```bash
# Run complete test suite (takes 20-30 minutes)
./run-all-tests.sh
```

**OR** run tests individually:

```bash
# Test 1: AI Feedback (2-3 minutes)
./test-1-feedback.sh

# Test 2: Image Generation (5-10 minutes)
./test-2-generate-image.sh

# Test 3: Video Generation (10-15 minutes)
./test-3-generate-video.sh

# Test 4: Image Safety (3-5 minutes)
./test-4-image-safety.sh

# Test 5: Content Safety (2-3 minutes)
./test-5-content-safety.sh
```

## 📁 Files Description

### Configuration Files

| File | Description |
|------|-------------|
| `test-config.sh` | Configuration variables and helper functions |
| `test-data.env` | Auto-generated test data (created by setup) |

### Test Scripts

| Script | What It Tests | Duration | Prerequisites |
|--------|---------------|----------|---------------|
| `setup-test-data.sh` | Prepares test environment | 1 min | GCS access |
| `test-1-feedback.sh` | AI feedback analysis | 2-3 min | Service running |
| `test-2-generate-image.sh` | Image generation + GCS upload | 5-10 min | GCS write access |
| `test-3-generate-video.sh` | Video generation + GCS upload | 10-15 min | GCS write access |
| `test-4-image-safety.sh` | Image safety validation | 3-5 min | Images in GCS |
| `test-5-content-safety.sh` | Content safety checks | 2-3 min | Database access |
| `run-all-tests.sh` | Executes all tests sequentially | 20-30 min | All of the above |

### Master Script

```bash
./run-all-tests.sh [OPTIONS]
```

**Options:**
- `--skip-setup` - Skip test data setup
- `--skip-feedback` - Skip feedback tests
- `--skip-image-gen` - Skip image generation tests
- `--skip-video-gen` - Skip video generation tests
- `--skip-image-safety` - Skip image safety tests
- `--skip-content-safety` - Skip content safety tests
- `--help` - Show help message

**Example:**

```bash
# Run all tests except video generation (to save time)
./run-all-tests.sh --skip-video-gen

# Run only safety tests
./run-all-tests.sh --skip-image-gen --skip-video-gen
```

## 🧪 Test Details

### Test 1: AI Feedback and Re-analysis

**What it tests:**
- Query submissions from database
- Analyze safe student writing
- Validate feedback structure (breakdown, strengths, improvements)
- Test content safety with unsafe content
- Verify safety system blocks inappropriate content

**Sample output:**
```
✅ Analysis Results:
   Score: 85/100
   Safety Check: Passed
   Breakdown:
     Grammar: 22/25
     Spelling: 24/25
     Relevance: 20/25
     Creativity: 19/25
```

### Test 2: Generate Image

**What it tests:**
- Query high-scoring submissions (score >= 51)
- Verify GCS bucket is accessible
- Generate standard style image with Gemini 2.5 Flash Image
- Verify image saved to GCS bucket
- Test multiple image styles (standard, comic, manga, princess)
- Verify images are publicly accessible

**Sample output:**
```
🖼️ Image generated in 78s
   URL: https://storage.googleapis.com/fun-writing-media-prod/images/abc123.png
   Size: 2.4 MB
   Status: ✓ Saved to GCS
   Status: ✓ Publicly accessible
```

**GCS Integration:**
- Images saved to: `gs://fun-writing-media-prod/images/`
- Naming pattern: `{submissionId}_{uuid}_{imageIndex}.png`
- Verifies file exists and is valid size

### Test 3: Generate Video

**What it tests:**
- Verify GCS videos directory
- Generate animation style video with Veo 3.1
- Verify video saved to GCS bucket
- Test cinematic style video
- Verify video format (MP4)
- Query video metadata from database

**Sample output:**
```
🎬 Video generated in 145s
   URL: https://storage.googleapis.com/fun-writing-media-prod/videos/abc123.mp4
   Size: 15.2 MB
   Duration: 8s
   Status: ✓ Saved to GCS
   Format: ✓ Valid MP4
```

**GCS Integration:**
- Videos saved to: `gs://fun-writing-media-prod/videos/`
- Naming pattern: `{submissionId}_{uuid}.mp4`
- Verifies MP4 format signature

### Test 4: Image Safety Checking

**What it tests:**
- Fetch sample images from GCS bucket
- Validate safe images using Gemini vision
- Test multiple images in batch
- Compare validation with/without context
- Query image safety records from database

**Sample output:**
```
🛡️ Image Safety Results:
   Is Safe: true
   Risk Level: low
   Visual Description: A colorful illustration of a friendly dragon...
   Issues: none
```

**GCS Integration:**
- Fetches existing images from `gs://fun-writing-media-prod/images/`
- Tests 5+ different images
- Verifies public accessibility

### Test 5: Content Safety Checking

**What it tests:**
- Query safe submissions from database (score >= 70)
- Query potentially unsafe submissions (score < 30)
- Test safe content analysis
- Test unsafe content detection
- Test different age groups (4-6, 7-11, 11-14, 15-18)
- Query safety statistics from database

**Sample output:**
```
🛡️ Content Safety Results:
   Safe Content Tested: 5
   Unsafe Content Tested: 3
   Safe Content Accuracy: 100%
   Unsafe Detection Rate: 100%
```

**Database Integration:**
- Queries real submissions from `WritingSubmissions` table
- Validates against actual student content
- Checks age-appropriate safety thresholds

## 📊 Understanding Test Results

### Success Indicators

✅ **Test Passed** - Feature working correctly
```
✅ Test 1 PASSED ✓
   All validations passed!
```

### Warning Indicators

⚠️ **Warning** - Non-critical issue, test continues
```
⚠️ Warning: Database not available, using sample data
```

### Error Indicators

❌ **Test Failed** - Critical issue, test stops
```
❌ Test 2 FAILED ✗
   Image generation failed with HTTP 500
```

### Final Summary

```
╔══════════════════════════════════════════════════════════════╗
║                  TEST EXECUTION SUMMARY                      ║
╚══════════════════════════════════════════════════════════════╝

📊 Test Results:
   Total Tests Run: 5
   Passed: 5 ✓
   Failed: 0 ✗
   Skipped: 0
   Pass Rate: 100%

⏱️  Execution Time:
   Total Duration: 23m 45s
```

## 🗄️ Database Integration

### Required Tables

Tests query the following tables:

- `WritingSubmissions` - Student writing submissions
- `WritingPrompts` - Writing prompts
- `Users` - User information
- `GeneratedMedia` - Generated images/videos

### Sample Queries

```sql
-- Get safe submissions for testing
SELECT id, content, "ageGroup", score
FROM "WritingSubmissions"
WHERE status = 'reviewed'
  AND score >= 70
ORDER BY "createdAt" DESC
LIMIT 5;

-- Get generated media records
SELECT "imageUrl", "generationStatus"
FROM "GeneratedMedia"
WHERE "mediaType" = 'image'
ORDER BY "createdAt" DESC
LIMIT 5;
```

### Without Database Access

If database is not accessible:
- Tests use sample data automatically
- Some test cases are skipped
- Core functionality is still validated

## ☁️ GCS Integration

### Bucket Structure

```
fun-writing-media-prod/
├── images/
│   ├── submission1_uuid_1.png
│   ├── submission1_uuid_2.png
│   └── ...
└── videos/
    ├── submission1_uuid.mp4
    ├── submission2_uuid.mp4
    └── ...
```

### Verification Steps

Tests verify:
1. ✅ File exists in GCS
2. ✅ File size is valid (> 1KB for images, > 100KB for videos)
3. ✅ File is publicly accessible (HTTP 200)
4. ✅ File format is correct (PNG for images, MP4 for videos)

### Bucket Permissions

Required permissions:
- `storage.objects.list` - List files in bucket
- `storage.objects.get` - Read file metadata and contents
- `storage.objects.create` - Upload new files (for generation tests)

Check permissions:
```bash
gsutil iam get gs://fun-writing-media-prod
```

## 🔍 Troubleshooting

### Issue: Service URL not detected

**Error:**
```
⚠️ Warning: Could not auto-detect service URL
```

**Solution:**
```bash
# Manually set service URL
export SERVICE_URL="https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app"

# Or update test-config.sh line 15
```

### Issue: GCS bucket not accessible

**Error:**
```
❌ Cannot access GCS bucket: gs://fun-writing-media-prod
```

**Solution:**
```bash
# Check if bucket exists
gsutil ls gs://fun-writing-media-prod

# Verify permissions
gcloud projects get-iam-policy YOUR_GCP_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:your-email@example.com"

# Grant permissions if needed
gsutil iam ch user:your-email@example.com:objectViewer \
  gs://fun-writing-media-prod
```

### Issue: Database connection failed

**Error:**
```
⚠️ Warning: Database not available, using sample data
```

**Solution:**
```bash
# Check if Cloud SQL proxy is running
ps aux | grep cloud_sql_proxy

# Start Cloud SQL proxy if needed
cloud_sql_proxy -instances=YOUR_GCP_PROJECT_ID:us-central1:fun-writing=tcp:5432 &

# Or use Unix socket (production method)
# Tests automatically use: /cloudsql/YOUR_GCP_PROJECT_ID:us-central1:fun-writing
```

### Issue: Tests timing out

**Error:**
```
curl: (28) Operation timed out after 90000 milliseconds
```

**Solution:**
```bash
# Increase timeout in test-config.sh
export TIMEOUT_LONG=300  # 5 minutes

# Or check if service is running
curl $SERVICE_URL/health
```

### Issue: Image/video generation fails

**Error:**
```
❌ Image generation failed with HTTP 500
```

**Solution:**
```bash
# Check Cloud Run logs
gcloud run services logs read fun-writing-ai-agents \
  --region us-central1 --limit 50

# Look for errors like:
# - Missing GOOGLE_API_KEY
# - GCS bucket not configured
# - Gemini API quota exceeded

# Verify environment variables
gcloud run services describe fun-writing-ai-agents \
  --region us-central1 --format="value(spec.template.spec.containers[0].env)"
```

## 📈 Performance Benchmarks

### Expected Durations

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| Health check | < 1s | Simple status endpoint |
| Writing analysis | 5-15s | Gemini 2.5 Flash analysis |
| Image generation | 60-120s | Gemini 2.5 Flash Image |
| Video generation | 120-300s | Veo 3.1 processing |
| Image safety check | 10-30s | Gemini vision analysis |
| Content safety check | 3-10s | Gemini text analysis |

### Timeout Configuration

Configured in `test-config.sh`:

```bash
TIMEOUT_SHORT=30      # Health checks, simple operations
TIMEOUT_MEDIUM=90     # Analysis, safety checks
TIMEOUT_LONG=180      # Image/video generation
```

## 🔐 Security Notes

### Credentials

Tests require:
- Google Cloud authentication (`gcloud auth login`)
- Database password (from environment or config)
- Service account with proper IAM roles

**Never commit credentials to git!**

### Public Access

Generated media in GCS is publicly accessible:
- Images: `https://storage.googleapis.com/fun-writing-media-prod/images/{filename}`
- Videos: `https://storage.googleapis.com/fun-writing-media-prod/videos/{filename}`

This is intentional for frontend display. Sensitive data should not be in media files.

## 📞 Support

### View Logs

```bash
# Cloud Run service logs
gcloud run services logs read fun-writing-ai-agents \
  --region us-central1 --tail

# GCS operations
gsutil logging get gs://fun-writing-media-prod

# Database logs
gcloud sql operations list --instance=fun-writing
```

### Service Status

```bash
# Check service health
curl $SERVICE_URL/health | jq '.'

# Check service details
gcloud run services describe fun-writing-ai-agents \
  --region us-central1
```

### Common Commands

```bash
# Re-run setup only
./setup-test-data.sh

# Run specific test
./test-1-feedback.sh

# Run all tests (skip long operations)
./run-all-tests.sh --skip-video-gen

# View test configuration
cat test-data.env

# Clean up test files
rm -f test-data.env
```

## 📝 Adding New Tests

### Create New Test Script

1. Copy template:
```bash
cp test-1-feedback.sh test-6-my-new-test.sh
```

2. Update test cases in new file

3. Add to `run-all-tests.sh`:
```bash
# Add option
RUN_MY_NEW_TEST=1

# Add execution block
if [ "$RUN_MY_NEW_TEST" -eq 1 ]; then
  log_section "TEST 6: My New Test"

  if bash "$SCRIPT_DIR/test-6-my-new-test.sh"; then
    log_success "Test 6 PASSED ✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log_error "Test 6 FAILED ✗"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
fi
```

4. Make executable:
```bash
chmod +x test-6-my-new-test.sh
```

## 🎯 Best Practices

### Before Testing

1. ✅ Deploy latest code to Cloud Run
2. ✅ Verify service is healthy (`/health` endpoint)
3. ✅ Check GCS bucket exists and has some test media
4. ✅ Ensure database has some submissions (optional)

### During Testing

1. 📊 Monitor Cloud Run logs in real-time
2. 🎯 Run tests one at a time first (before full suite)
3. ⏱️ Be patient with slow operations (video gen takes 2-5 minutes)
4. 💾 Save test output for debugging

### After Testing

1. 🗑️ Clean up test media if needed (optional)
2. 📈 Review performance metrics
3. 🐛 Check for any errors in logs
4. ✅ Verify database state is correct

## 📊 Expected Results

After a successful full test run:

```
✅ All Tests Passed (5/5)
✅ AI Feedback working correctly
✅ Image generation saving to GCS
✅ Video generation saving to GCS
✅ Image safety validation working
✅ Content safety validation working
✅ Database integration working
✅ GCS integration working

Service is production-ready! 🎉
```

## 🚀 Next Steps

After all tests pass:

1. **Test from Frontend**
   - Login to Fun Writing app
   - Submit a writing piece
   - Click "Re-analyze" to test feedback
   - Generate images to test image generation
   - Generate videos to test video generation

2. **Monitor in Production**
   - Set up Cloud Monitoring alerts
   - Track API latency and error rates
   - Monitor GCS storage usage
   - Review user feedback

3. **Performance Optimization**
   - Analyze slow operations
   - Consider caching strategies
   - Optimize prompts for faster generation

---

**Documentation Version:** 1.0
**Last Updated:** 2025-11-06
**Maintained by:** AI Agents Development Team
