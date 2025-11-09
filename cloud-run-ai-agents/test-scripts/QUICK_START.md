# Quick Start Guide - Test Scripts

## 🚀 After Cloud Run Deployment

### Step 1: Navigate to test directory

```bash
cd /home/user/fun-writing/04-cloud-run-ai-agents/test-scripts
```

### Step 2: Install prerequisites (if needed)

```bash
# Install jq (JSON parser)
sudo apt-get install jq

# Install psql (optional, for database tests)
sudo apt-get install postgresql-client

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### Step 3: Setup test data

```bash
./setup-test-data.sh
```

**What this does:**
- ✅ Checks if AI Agents service is running
- ✅ Verifies GCS bucket access
- ✅ Queries real submissions from database
- ✅ Fetches sample images from GCS
- ✅ Creates `test-data.env` configuration

**Expected output:**
```
✅ Service is running!
✅ Found 15 images in bucket
✅ Found test submission ID: abc-123
✅ Test configuration saved to test-data.env

Ready to run tests!
```

### Step 4: Run tests

#### Option A: Run all tests (recommended first time)

```bash
./run-all-tests.sh
```

Duration: **20-30 minutes**

#### Option B: Run individual tests

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

#### Option C: Skip slow tests

```bash
# Skip video generation to save time
./run-all-tests.sh --skip-video-gen

# Skip both image and video generation
./run-all-tests.sh --skip-image-gen --skip-video-gen
```

## 📊 What Each Test Does

### Test 1: AI Feedback ⚡ 2-3 min

**Tests:**
- Query submission from database
- Analyze safe writing → Should get score ~70-85
- Analyze unsafe writing → Should block
- Validate feedback structure

**Database queries:**
- `WritingSubmissions` table (for content)
- `Users` table (for age group)

**Example output:**
```
✅ Score: 85/100
✅ Safety Check: Passed
   Grammar: 22/25
   Spelling: 24/25
   Relevance: 20/25
   Creativity: 19/25
```

### Test 2: Image Generation 🖼️ 5-10 min

**Tests:**
- Query high-scoring submission (>= 51)
- Generate standard/comic/manga/princess images
- Save to GCS bucket
- Verify public accessibility

**GCS operations:**
- Save to: `gs://fun-writing-media-prod/images/`
- Verify file exists and valid size
- Test public URL

**Example output:**
```
🖼️ Image generated in 78s
   URL: https://storage.googleapis.com/.../image.png
   Size: 2.4 MB
   ✓ Saved to GCS
   ✓ Publicly accessible
```

### Test 3: Video Generation 🎬 10-15 min

**Tests:**
- Generate animation/cinematic videos
- Save to GCS bucket
- Validate MP4 format
- Query video metadata from DB

**GCS operations:**
- Save to: `gs://fun-writing-media-prod/videos/`
- Verify MP4 signature
- Check file size > 100KB

**Example output:**
```
🎬 Video generated in 145s
   URL: https://storage.googleapis.com/.../video.mp4
   Size: 15.2 MB
   Duration: 8s
   ✓ Valid MP4 format
```

### Test 4: Image Safety 🛡️ 3-5 min

**Tests:**
- Fetch images from GCS bucket
- Validate with Gemini vision
- Test 5+ images in batch
- Compare with/without context

**GCS operations:**
- Fetch from: `gs://fun-writing-media-prod/images/`
- Test multiple images
- Verify risk levels

**Example output:**
```
🛡️ Image Safety Results:
   Is Safe: true
   Risk Level: low
   Images Tested: 5
   Safe: 5, Unsafe: 0
```

### Test 5: Content Safety 🔒 2-3 min

**Tests:**
- Query safe submissions (score >= 70)
- Query unsafe submissions (score < 30)
- Test detection across age groups
- Calculate accuracy

**Database queries:**
- Safe submissions from DB
- Low-scoring submissions
- Safety statistics

**Example output:**
```
🛡️ Content Safety:
   Safe Content Tested: 5
   Unsafe Content Tested: 3
   Safe Accuracy: 100%
   Detection Rate: 100%
```

## ✅ Expected Final Results

```
╔═══════════════════════════════════════════════════════╗
║          TEST EXECUTION SUMMARY                       ║
╚═══════════════════════════════════════════════════════╝

📊 Test Results:
   Total Tests Run: 5
   Passed: 5 ✓
   Failed: 0 ✗
   Pass Rate: 100%

⏱️  Execution Time: 23m 45s

✅ All Tests Passed!
✅ Service is production-ready! 🎉
```

## 🔧 Troubleshooting

### Service URL not found

```bash
# Manually set service URL
export SERVICE_URL="https://fun-writing-ai-agents-yaildcgk6q-uc.a.run.app"
```

### GCS bucket not accessible

```bash
# Check bucket exists
gsutil ls gs://fun-writing-media-prod

# Grant access if needed
gsutil iam ch user:your-email@example.com:objectViewer \
  gs://fun-writing-media-prod
```

### Database not accessible

```bash
# Check Cloud SQL proxy is running
ps aux | grep cloud_sql_proxy

# Tests will use sample data if DB unavailable
# Most tests still work without database access
```

### Tests timeout

```bash
# Increase timeout in test-config.sh
export TIMEOUT_LONG=300  # 5 minutes

# Or check service logs
gcloud run services logs read fun-writing-ai-agents \
  --region us-central1 --limit 50
```

## 📖 Full Documentation

For complete documentation, see: **README.md**

Includes:
- Detailed test descriptions
- Database schema information
- GCS integration details
- Performance benchmarks
- Security notes
- Troubleshooting guide

## 💡 Tips

1. **Run setup first** - Always run `setup-test-data.sh` before tests
2. **Check service health** - Verify `/health` endpoint returns 200
3. **Monitor logs** - Watch Cloud Run logs during tests
4. **Be patient** - Video generation takes 2-5 minutes
5. **Save output** - Redirect output to file for debugging: `./run-all-tests.sh > test-output.log 2>&1`

## 🎯 After Tests Pass

1. **Test from Frontend:**
   - Login to Fun Writing app
   - Submit writing and test re-analyze
   - Generate images and videos

2. **Monitor Production:**
   - Check Cloud Run metrics
   - Monitor GCS storage usage
   - Review error rates

3. **Celebrate! 🎉**
   - All systems operational
   - Ready for production use

---

**Questions?** See README.md or check Cloud Run logs:
```bash
gcloud run services logs read fun-writing-ai-agents --region us-central1 --tail
```
