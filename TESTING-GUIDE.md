# SCRIBEPOD - PHASE 1 TESTING GUIDE

**Created:** October 13, 2025
**Status:** Complete Testing Suite
**Phase:** Phase 1 - Critical Security & Stability

---

## OVERVIEW

This guide provides comprehensive instructions for testing all Phase 1 implementations. Testing is divided into two stages:

1. **Pre-Flight Verification** - Tests code changes and configuration (servers NOT running)
2. **Functional Testing** - Tests runtime behavior (servers MUST be running)

---

## TESTING STRUCTURE

```
Phase 1 Testing
├── Pre-Flight Verification (./test-phase1-preflight.sh)
│   ├── Environment Configuration
│   ├── Node.js Dependencies
│   ├── Python Dependencies
│   ├── Security Fixes - Reason Server
│   ├── Security Fixes - Whisper Server
│   ├── Documentation
│   └── Git Configuration
│
├── Functional Testing (./test-phase1-functional.sh)
│   ├── Health Check Endpoints
│   ├── Rate Limiting
│   ├── CORS Security
│   ├── Environment Variables
│   ├── Response Time Performance
│   └── Server Logging
│
└── Manual Testing
    ├── Audio Transcription
    ├── Temp File Cleanup
    ├── Browser CORS Testing
    └── Production Deployment Testing
```

---

## STAGE 1: PRE-FLIGHT VERIFICATION

### Purpose
Verify all code changes and configurations are in place BEFORE starting servers.

### Prerequisites
- None - servers should NOT be running

### How to Run

```bash
cd scribepod-master
./test-phase1-preflight.sh
```

### What It Tests

#### Section 1: Environment Configuration (5 tests)
- ✅ `.env` file exists
- ✅ All 15 required environment variables present
- ✅ API key strength (64+ characters recommended)
- ✅ Flask debug mode disabled
- ✅ CORS origins configured

#### Section 2: Node.js Dependencies (2 tests)
- ✅ Security packages in `package.json` (dotenv, express-rate-limit, winston, axios)
- ✅ `node_modules` directory exists

#### Section 3: Python Dependencies (3 tests)
- ✅ Virtual environment exists (`agent/whisper/venv`)
- ✅ Security packages in `requirements.txt` (python-dotenv, flask-limiter, flask-cors, psutil)
- ✅ All Python packages installed in venv

#### Section 4: Security Fixes - Reason Server (5 tests)
- ✅ Dotenv import present
- ✅ Rate limiting implemented
- ✅ CORS properly configured (no wildcards)
- ✅ Environment variables loaded
- ✅ Health check endpoints added

#### Section 5: Security Fixes - Whisper Server (7 tests)
- ✅ Dotenv import present
- ✅ Flask-Limiter implemented
- ✅ CORS properly configured (no wildcards)
- ✅ Temp file cleanup implemented (try/finally)
- ✅ CPU/GPU device flexibility
- ✅ Health check endpoints added
- ✅ Health checks exempt from rate limiting

#### Section 6: Documentation (1 test)
- ✅ Key documentation files exist

#### Section 7: Git Configuration (1 test)
- ✅ `.env` file protected in `.gitignore`

### Expected Output

**Success:**
```
======================================================================
PRE-FLIGHT VERIFICATION SUMMARY
======================================================================
Total Tests: 24
Passed: 24
Failed: 0
Warnings: 0

✓ ALL CRITICAL CHECKS PASSED!

Your Phase 1 implementation is complete and ready for testing.

Next steps:
  1. Start the servers
  2. Run functional tests
  3. Review test results
```

**Failure Example:**
```
✗ FAIL - .env file not found
✗ FAIL - node_modules not found
  Run: npm install

======================================================================
PRE-FLIGHT VERIFICATION SUMMARY
======================================================================
Passed: 18
Failed: 6
Warnings: 0

✗ SOME CRITICAL CHECKS FAILED

Please fix the failed checks before proceeding.
```

### Troubleshooting Pre-Flight Failures

**`.env` file not found:**
```bash
# Check if template exists
ls .env.example
# Copy and configure
cp .env.example .env
# Edit with your values
```

**`node_modules` not found:**
```bash
npm install
```

**Python packages not installed:**
```bash
cd agent/whisper
./venv/Scripts/python.exe -m pip install -r requirements.txt
```

**Security fixes not found in code:**
- Review `SECURITY-FIXES-SUMMARY.md`
- Re-apply fixes from Step 6

---

## STAGE 2: FUNCTIONAL TESTING

### Purpose
Test runtime behavior with both servers running.

### Prerequisites
- ✅ Pre-flight verification passed
- ✅ Both servers must be running

### How to Start Servers

**Terminal 1 - Reason Server:**
```bash
cd scribepod-master
npm run start-reason
```

**Expected Output:**
```
[Reason Server] Listening on 0.0.0.0:4200
[Reason Server] Environment: development
[Reason Server] CORS allowed origins: http://localhost:3000, http://localhost:4200
```

**Terminal 2 - Whisper Server:**
```bash
cd scribepod-master/agent/whisper
python app.py
```

**Expected Output:**
```
======================================================================
[Whisper Server] Starting Scribepod Whisper AI Server
======================================================================
[Whisper Server] Environment: development
[Whisper Server] Host: localhost
[Whisper Server] Port: 5000
[Whisper Server] Debug: False
[Whisper Server] CORS allowed origins: ['http://localhost:3000', 'http://localhost:4200']
[Whisper Server] Rate limit: 60 requests per minute
======================================================================
[Whisper Server] Loading AI models (this may take a few minutes)...
[Whisper Server] Loading Whisper model: large (device: cpu)
[Whisper Server] Loading Flan-T5 model: google/flan-t5-xl
[Whisper Server] Models loaded successfully!
======================================================================
 * Running on http://localhost:5000
```

**Note:** Whisper server takes 2-5 minutes to load AI models on first start.

### How to Run Functional Tests

**Terminal 3:**
```bash
cd scribepod-master
./test-phase1-functional.sh
```

### What It Tests

#### Pre-Flight: Server Availability
- ✅ Reason server responding on configured port
- ✅ Whisper server responding on configured port

#### Section 1: Health Check Endpoints (4 tests)
- ✅ Reason `/health` returns 200 OK
- ✅ Reason `/health/ready` returns 200 OK or 503
- ✅ Whisper `/health` returns 200 OK
- ✅ Whisper `/health/ready` returns 200 OK or 503
- ✅ Model loading status verified
- ✅ Memory usage reported

#### Section 2: Rate Limiting (2 tests)
- ✅ Whisper health checks exempt (65 requests)
- ✅ Regular endpoints rate limited (manual verification)

#### Section 3: CORS Security (3 tests)
- ✅ Allowed origin accepted (localhost:3000)
- ✅ Blocked origin rejected (manual verification)
- ✅ Whisper CORS configured

#### Section 4: Environment Variables (2 tests)
- ✅ Servers using configured ports
- ✅ Environment variables loaded correctly

#### Section 5: Response Time Performance (1 test)
- ✅ Health checks respond quickly (<1 second)

#### Section 6: Server Logging (1 test)
- ✅ Proper startup messages (manual verification)

### Expected Output

**Success:**
```
======================================================================
SCRIBEPOD PHASE 1 - FUNCTIONAL TESTING
======================================================================

PRE-FLIGHT: SERVER AVAILABILITY
✓ Reason server is running on port 4200
✓ Whisper server is running on port 5000

SECTION 1: HEALTH CHECK ENDPOINTS
✓ PASS - Liveness check successful
✓ PASS - Readiness check successful
  ✓ Whisper model loaded
  ✓ Text model loaded
  ✓ Tokenizer loaded
  ℹ Memory usage: 45.2%

SECTION 2: RATE LIMITING
✓ PASS - Health checks exempt from rate limiting (65 requests OK)

SECTION 3: CORS SECURITY
✓ PASS - Allowed origin accepted

SECTION 4: ENVIRONMENT VARIABLES
✓ PASS - Servers using configured ports

SECTION 5: RESPONSE TIME PERFORMANCE
✓ PASS - All response times acceptable

======================================================================
FUNCTIONAL TESTING SUMMARY
======================================================================
Passed: 13
Failed: 0
Warnings: 3

✓ ALL CRITICAL FUNCTIONAL TESTS PASSED!
```

### Troubleshooting Functional Failures

**Servers not running:**
```
✗ Reason server not running on port 4200
  Start with: npm run start-reason
```
**Solution:** Start the appropriate server

**Whisper models not loaded:**
```
⚠ WARNING - Server not ready (503)
  AI models may still be loading (takes 2-5 minutes)
```
**Solution:** Wait for models to finish loading, then re-run tests

**Port mismatch:**
```
⚠ WARNING - Port mismatch detected
  .env: 4200
  Actual: 5000
```
**Solution:** Restart server or update `.env`

**Slow response times:**
```
⚠ Whisper server slow (>2.5s)
```
**Solution:** Normal for large AI models, consider smaller model size

---

## STAGE 3: MANUAL TESTING

Some functionality requires manual verification.

### Test 1: Audio Transcription

**Purpose:** Verify Whisper transcription works and temp files are cleaned up

**Steps:**
1. Create a test audio file (WAV format)
2. Monitor temp directory:
   ```bash
   # Windows
   dir %TEMP%

   # Linux/Mac
   ls -la /tmp
   ```
3. Send transcription request:
   ```bash
   curl -X POST http://localhost:5000/transcribe \
     -F "audio_data=@test.wav"
   ```
4. Verify response contains transcription
5. Check temp directory again - no new directories should remain

**Expected Result:**
- ✅ Transcription returned successfully
- ✅ No temp directories left behind
- ✅ Server logs show cleanup message

**Troubleshooting:**
- If temp directories remain, temp file cleanup is broken
- Check `agent/whisper/app.py` for try/finally block
- Review server logs for cleanup errors

---

### Test 2: Rate Limiting (Browser)

**Purpose:** Verify rate limiting works for regular endpoints

**Steps:**
1. Open browser console (F12)
2. Run this JavaScript:
   ```javascript
   for (let i = 0; i < 65; i++) {
     fetch('http://localhost:4200/silence_detect')
       .then(r => console.log(i, r.status));
   }
   ```
3. Check responses - should see 429 (Too Many Requests) after ~60 requests

**Expected Result:**
- ✅ First 60 requests: 200 OK
- ✅ Requests 61+: 429 Too Many Requests

---

### Test 3: CORS (Browser)

**Purpose:** Verify CORS blocks unauthorized origins

**Steps:**
1. Create test HTML file:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
   <script>
   fetch('http://localhost:4200/health', {
     headers: { 'Origin': 'http://malicious.com' }
   })
   .then(r => console.log('Success:', r))
   .catch(e => console.log('CORS blocked:', e));
   </script>
   </body>
   </html>
   ```
2. Open in browser
3. Check console

**Expected Result:**
- ✅ CORS error in console
- ✅ Request blocked by browser

**From Allowed Origin:**
- ✅ Request succeeds from http://localhost:3000

---

### Test 4: Memory Monitoring

**Purpose:** Verify memory usage is reported correctly

**Steps:**
1. Check Whisper server memory:
   ```bash
   curl http://localhost:5000/health/ready | jq '.checks.memory'
   ```
2. Monitor over time
3. Verify status changes based on thresholds:
   - 0-80%: "ok"
   - 80-90%: "warning"
   - >90%: "critical" (returns 503)

**Expected Result:**
- ✅ Memory percentage reported
- ✅ Status appropriate for usage level

---

### Test 5: Environment Variable Changes

**Purpose:** Verify servers load .env changes on restart

**Steps:**
1. Edit `.env`:
   ```bash
   REASON_SERVER_PORT=5200
   ```
2. Restart Reason server
3. Verify new port:
   ```bash
   curl http://localhost:5200/health
   ```

**Expected Result:**
- ✅ Server starts on new port
- ✅ Old port no longer responds

---

### Test 6: Production Configuration

**Purpose:** Verify production-ready configuration

**Checklist:**
```bash
# Set production values in .env
NODE_ENV=production
FLASK_DEBUG=0
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Generate new API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with new key
API_KEY=<new-key>

# Restart servers
# Verify:
# - Health checks show environment: "production"
# - Flask debug disabled
# - CORS only allows production domain
```

---

## TEST RESULTS INTERPRETATION

### All Green (✓ PASS)
**Meaning:** Feature working correctly
**Action:** None required

### Yellow Warning (⚠ WARNING)
**Meaning:** Feature working but needs attention or manual verification
**Action:** Review warning, may be acceptable for development

**Common Warnings:**
- API key length acceptable but could be stronger
- Flask debug enabled (OK for development)
- Manual verification required
- Response time slower than ideal

### Red Failure (✗ FAIL)
**Meaning:** Critical issue that must be fixed
**Action:** Fix immediately before proceeding

**Common Failures:**
- Required files/directories missing
- Dependencies not installed
- Security fixes not applied
- Servers not running
- Critical functionality broken

---

## AUTOMATED vs MANUAL TESTING

### Automated Testing (Scripts)
**Advantages:**
- ✅ Fast and repeatable
- ✅ Comprehensive coverage
- ✅ Consistent results
- ✅ Easy to run

**Limitations:**
- ❌ Cannot test browser-specific features (CORS errors)
- ❌ Cannot verify UI behavior
- ❌ Cannot test file system operations easily
- ❌ Cannot simulate real user workflows

### Manual Testing
**When Required:**
- 🔍 Browser CORS verification
- 🔍 Audio file transcription
- 🔍 Temp file cleanup verification
- 🔍 UI/UX testing
- 🔍 Production deployment
- 🔍 Performance under load

---

## CONTINUOUS TESTING

### During Development
```bash
# Before committing changes
./test-phase1-preflight.sh

# After starting servers
./test-phase1-functional.sh
```

### Before Deployment
1. Run all automated tests
2. Perform all manual tests
3. Test with production configuration
4. Load testing (if applicable)
5. Security scan

### In Production
1. Monitor health check endpoints
2. Set up alerting for failures
3. Track response times
4. Monitor memory usage
5. Review logs regularly

---

## QUICK REFERENCE

### Test Commands

```bash
# Pre-flight verification (no servers needed)
./test-phase1-preflight.sh

# Start servers
Terminal 1: npm run start-reason
Terminal 2: cd agent/whisper && python app.py

# Functional tests (servers must be running)
./test-phase1-functional.sh

# Health checks only
./test-health-checks.sh

# Security verification
./verify-security.sh
```

### Quick Health Checks

```bash
# Check if servers are running
curl http://localhost:4200/health
curl http://localhost:5000/health

# Check if servers are ready
curl http://localhost:4200/health/ready
curl http://localhost:5000/health/ready

# Check Whisper models loaded
curl http://localhost:5000/health/ready | jq '.checks'

# Check memory usage
curl http://localhost:5000/health/ready | jq '.checks.memory'
```

---

## TROUBLESHOOTING COMMON ISSUES

### Issue: "curl: command not found"
**Solution:**
- Windows: Install Git Bash or use PowerShell `Invoke-WebRequest`
- Alternative: Test in browser or use Postman

### Issue: "bc: command not found" (in scripts)
**Solution:**
- Install bc: `apt-get install bc` (Linux) or use Git Bash (Windows)
- Or skip response time tests

### Issue: Scripts won't execute
**Solution:**
```bash
# Make executable
chmod +x *.sh

# Or run with bash
bash test-phase1-preflight.sh
```

### Issue: "jq: command not found"
**Solution:**
- Install jq: https://stedolan.github.io/jq/download/
- Or view raw JSON output without jq

### Issue: Tests pass but servers don't work
**Causes:**
- Firewall blocking connections
- Wrong ports configured
- Models not loaded
- Network issues

**Solution:**
- Check firewall settings
- Verify .env configuration
- Wait for model loading
- Check server logs

---

## NEXT STEPS AFTER TESTING

### If All Tests Pass:
1. ✅ Review any warnings
2. ✅ Perform manual testing
3. ✅ Commit changes to git
4. ✅ Proceed to Phase 2 (if applicable)
5. ✅ Deploy to staging/production

### If Tests Fail:
1. ❌ Review failed test output
2. ❌ Check troubleshooting section
3. ❌ Fix identified issues
4. ❌ Re-run tests
5. ❌ Do not proceed until all critical tests pass

---

## SUPPORT & DOCUMENTATION

### Related Documentation:
- `INSTALLATION-SUMMARY.md` - Dependency installation
- `SECURITY-FIXES-SUMMARY.md` - Security implementations
- `HEALTH-CHECKS.md` - Health check endpoints
- `.env-README.md` - Environment configuration

### Test Scripts:
- `test-phase1-preflight.sh` - Pre-flight verification
- `test-phase1-functional.sh` - Functional testing
- `test-health-checks.sh` - Health check testing
- `verify-security.sh` - Security verification

---

**Last Updated:** October 13, 2025
**Status:** Complete Testing Suite Ready
**Next:** Run tests and verify Phase 1 implementation
