# 🚀 Railway Deployment & Complete Testing Guide

This guide walks you through deploying to Railway and testing EVERY feature to ensure everything works perfectly.

---

## 📋 DEPLOYMENT STEPS

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This opens your browser. Sign in with GitHub.

### Step 3: Initialize Your Project

```bash
cd /path/to/scribepod
railway init
```

Choose:
- ✅ Create new project
- Name: `scribepod` (or your choice)

### Step 4: Add PostgreSQL Database

```bash
railway add
```

Select: **PostgreSQL**

Railway will:
- ✅ Create PostgreSQL instance
- ✅ Auto-configure DATABASE_URL environment variable

### Step 5: Deploy Your Application

```bash
railway up
```

This deploys your code. Wait for it to complete (1-2 minutes).

### Step 6: Run Database Migrations

```bash
# Run migrations on Railway
railway run npx prisma migrate deploy

# Or if that fails, use db push
railway run npx prisma db push
```

### Step 7: Seed Database with Default Personas

```bash
railway run npm run prisma:seed
```

You should see:
```
🌱 Starting database seed...
🎭 Seeding default personas...
  ✓ Created Sarah Chen (HOST)
  ✓ Created Marcus Thompson (GUEST)
  ... (6 more)
✅ Default personas seeded: 8/8
```

### Step 8: Add OpenAI API Key

```bash
railway variables set OPENAI_API_KEY=sk-your-key-here
```

Replace `sk-your-key-here` with your actual OpenAI API key.

### Step 9: Get Your App URL

```bash
railway domain
```

Or create a custom domain:
```bash
railway domain add
```

You'll get a URL like: `https://scribepod.railway.app`

---

## ✅ COMPLETE TESTING CHECKLIST

Now test EVERY feature to make sure everything works:

---

## 🧪 TEST 1: Health Check

**Purpose**: Verify the app is running and can connect to services

```bash
curl https://your-app.railway.app/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T...",
  "services": {
    "database": "healthy",
    "openai": "healthy"
  }
}
```

✅ **PASS**: All services show "healthy"
❌ **FAIL**: Check Railway logs: `railway logs`

---

## 🧪 TEST 2: API Health

**Purpose**: Verify API endpoints are responding

```bash
curl https://your-app.railway.app/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "Scribepod API"
}
```

✅ **PASS**: Status is "ok"

---

## 🧪 TEST 3: Default Personas (Phase 3)

**Purpose**: Verify database seeding worked and personas are accessible

### 3a. Check Seeding Status

```bash
curl https://your-app.railway.app/api/personas/defaults/status
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "seeded": true,
    "message": "Default personas are available"
  }
}
```

✅ **PASS**: `seeded: true`
❌ **FAIL**: Run seed again: `railway run npm run prisma:seed`

### 3b. Get Default Personas

```bash
curl https://your-app.railway.app/api/personas/defaults
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Sarah Chen",
      "role": "HOST",
      "bio": "Enthusiastic podcast host...",
      ...
    },
    {
      "id": "uuid-here",
      "name": "Marcus Thompson",
      "role": "GUEST",
      ...
    }
  ],
  "count": 2
}
```

✅ **PASS**: Returns 2 personas (Sarah Chen + Marcus Thompson)

**Save one persona ID** for later tests!

### 3c. Get All Personas

```bash
curl https://your-app.railway.app/api/personas
```

**Expected Response**:
```json
{
  "success": true,
  "data": [ /* array of 8 personas */ ],
  "count": 8
}
```

✅ **PASS**: Count is 8

### 3d. Get Preset Combinations

```bash
curl https://your-app.railway.app/api/personas/presets
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Default Deep Dive",
      "description": "...",
      "personaKeys": ["sarah-chen", "marcus-thompson"],
      "style": "conversational",
      ...
    },
    /* ... 7 more presets ... */
  ],
  "keys": ["default", "tech-deep-dive", "academic", ...],
  "count": 8
}
```

✅ **PASS**: Returns 8 presets

### 3e. Get Specific Preset

```bash
curl https://your-app.railway.app/api/personas/presets/tech-deep-dive
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "preset": {
      "name": "Technical Deep Dive",
      "personaKeys": ["dr-emily-rivera", "alex-park", "jordan-lee"],
      ...
    },
    "personas": [ /* 3 persona objects */ ],
    "personaIds": ["id1", "id2", "id3"]
  }
}
```

✅ **PASS**: Returns preset with 3 personas

### 3f. Get Persona Recommendation

```bash
curl -X POST https://your-app.railway.app/api/personas/recommend \
  -H "Content-Type: application/json" \
  -d '{"contentHint": "technical research paper"}'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "recommendedPreset": "tech-deep-dive",
    "preset": { /* preset object */ },
    "personas": [ /* 3 personas */ ],
    ...
  }
}
```

✅ **PASS**: Returns "tech-deep-dive" recommendation

---

## 🧪 TEST 4: Content Processing (Phase 0)

**Purpose**: Verify content ingestion and processing works

### 4a. Ingest Text Content

```bash
curl -X POST https://your-app.railway.app/api/content/ingest/string \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial Intelligence has evolved from a theoretical concept to one of the most transformative technologies of our time. The field began in 1956 at the Dartmouth Conference, where John McCarthy coined the term artificial intelligence. Modern AI leverages machine learning and deep learning neural networks to achieve remarkable results.",
    "title": "The Evolution of AI",
    "sourceType": "TEXT",
    "author": "Test Author"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "content-uuid",
    "title": "The Evolution of AI",
    "sourceType": "TEXT",
    "wordCount": /* number */,
    ...
  },
  "preprocessed": {
    "totalWords": /* number */,
    "totalChunks": /* number */
  }
}
```

✅ **PASS**: Content created with ID

**Save this content ID** for next tests!

### 4b. Get Content

```bash
curl https://your-app.railway.app/api/content/<content-id-from-4a>
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "The Evolution of AI",
    "rawText": "...",
    ...
  }
}
```

✅ **PASS**: Returns the content you just created

### 4c. Get Content Statistics

```bash
curl https://your-app.railway.app/api/content/stats
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalContent": 1,
    "totalFacts": 0,
    "averageWordCount": /* number */,
    ...
  }
}
```

✅ **PASS**: Shows at least 1 content item

---

## 🧪 TEST 5: Podcast Generation (Phase 1) - THE BIG TEST

**Purpose**: Verify multi-persona podcast generation works end-to-end

⚠️ **This is the test that FAILS on Vercel but WORKS on Railway!**

### 5a. Generate Podcast with Default Personas (One-Click)

```bash
curl -X POST https://your-app.railway.app/api/podcasts/generate/string \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial Intelligence has evolved from a theoretical concept to one of the most transformative technologies of our time. The field began in 1956 at the Dartmouth Conference. Modern AI leverages machine learning and deep learning neural networks. Large language models like GPT-4 demonstrate unprecedented capabilities.",
    "title": "AI Evolution",
    "sourceType": "TEXT",
    "useDefaults": true,
    "targetLength": 3,
    "podcastTitle": "The AI Revolution"
  }'
```

**Expected Response** (takes 20-40 seconds):
```json
{
  "success": true,
  "data": {
    "podcast": {
      "id": "podcast-uuid",
      "title": "The AI Revolution",
      "status": "COMPLETED",
      "totalWords": /* number */,
      "estimatedDuration": /* seconds */,
      ...
    },
    "content": { /* content object */ },
    "status": "COMPLETED",
    "personasUsed": ["id1", "id2"],
    "jobs": {
      "factExtraction": "job-id",
      "dialogueGeneration": "job-id"
    }
  }
}
```

✅ **PASS**: Status is "COMPLETED", podcast has dialogue
❌ **FAIL**: Check logs: `railway logs`

**Save this podcast ID** for next tests!

### 5b. Generate Podcast with Preset

```bash
curl -X POST https://your-app.railway.app/api/podcasts/generate/string \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Quantum computing represents a paradigm shift in computational capabilities. Unlike classical computers that use bits, quantum computers use qubits that can exist in superposition. This enables them to solve certain problems exponentially faster.",
    "title": "Quantum Computing",
    "sourceType": "TEXT",
    "preset": "tech-deep-dive",
    "targetLength": 3,
    "podcastTitle": "Quantum Deep Dive"
  }'
```

**Expected Response** (takes 20-40 seconds):
```json
{
  "success": true,
  "data": {
    "podcast": { /* podcast with 3 technical personas */ },
    "personasUsed": ["emily-id", "alex-id", "jordan-id"],
    ...
  }
}
```

✅ **PASS**: Uses 3 personas from tech-deep-dive preset

### 5c. Get Podcast Details

```bash
curl https://your-app.railway.app/api/podcasts/<podcast-id-from-5a>
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "The AI Revolution",
    "status": "COMPLETED",
    "totalWords": /* number */,
    ...
  }
}
```

✅ **PASS**: Returns complete podcast details

### 5d. Get Podcast Dialogues

```bash
curl https://your-app.railway.app/api/podcasts/<podcast-id>/dialogues
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "personaId": "...",
      "turnNumber": 1,
      "text": "Welcome to another episode! Today we're...",
      "timestamp": 0,
      ...
    },
    /* ... more dialogue turns ... */
  ],
  "count": /* number of turns */
}
```

✅ **PASS**: Returns multiple dialogue turns
✅ **VERIFY**: Dialogue has personality (check for enthusiasm, expertise, etc.)

### 5e. Get Podcast Status

```bash
curl https://your-app.railway.app/api/podcasts/<podcast-id>/status
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "podcast": { /* podcast object */ },
    "progress": 100,
    "status": "COMPLETED",
    ...
  }
}
```

✅ **PASS**: Progress is 100, status is COMPLETED

---

## 🧪 TEST 6: Real-Time Conversations (Phase 2)

**Purpose**: Verify persona-aware conversations and streaming work

### 6a. Create Conversation Session

```bash
curl -X POST https://your-app.railway.app/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "personaIds": ["<persona-id-from-test-3>"],
    "contentId": "<content-id-from-test-4>"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "personas": [ /* persona array */ ],
    "currentPersona": {
      "id": "...",
      "name": "Sarah Chen",
      ...
    },
    "greeting": "Hello! I'm excited to discuss...",
    "context": {
      "contentId": "...",
      ...
    }
  }
}
```

✅ **PASS**: Session created with greeting

**Save this session ID** for next tests!

### 6b. Send Message in Conversation

```bash
curl -X POST https://your-app.railway.app/api/conversations/<session-id>/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you explain the key points about AI evolution?"
  }'
```

**Expected Response** (takes 3-8 seconds):
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "...",
      "role": "user",
      "content": "Can you explain...",
      ...
    },
    "assistantMessage": {
      "id": "...",
      "role": "assistant",
      "content": "Great question! AI evolution has several key milestones...",
      "personaId": "...",
      "personaName": "Sarah Chen",
      "tokenCount": /* number */,
      ...
    }
  }
}
```

✅ **PASS**: Returns persona-aware response
✅ **VERIFY**: Response matches persona's personality (enthusiastic, casual, etc.)

### 6c. Get Conversation History

```bash
curl https://your-app.railway.app/api/conversations/<session-id>/history
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      { "role": "assistant", "content": "Hello! I'm excited..." },
      { "role": "user", "content": "Can you explain..." },
      { "role": "assistant", "content": "Great question!..." },
    ],
    "total": 3
  }
}
```

✅ **PASS**: Shows all messages in order

### 6d. Get Session Details

```bash
curl https://your-app.railway.app/api/conversations/<session-id>
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "...",
      "personas": [ /* personas */ ],
      "currentPersonaId": "...",
      ...
    },
    "stats": {
      "messageCount": 3,
      "totalTokens": /* number */,
      "sessionDuration": /* milliseconds */,
      ...
    }
  }
}
```

✅ **PASS**: Shows session stats

### 6e. Test Streaming (SSE)

**In browser**: Open this URL:
```
https://your-app.railway.app/api/conversations/<session-id>/stream?message=Tell%20me%20more%20about%20AI
```

**Expected**: You'll see streaming text appear token-by-token

**Or test with curl**:
```bash
curl -N https://your-app.railway.app/api/conversations/<session-id>/stream?message=Tell%20me%20more
```

**Expected Output** (streaming):
```
data: {"type":"start","personaName":"Sarah Chen"}

data: {"type":"token","content":"AI"}

data: {"type":"token","content":" has"}

data: {"type":"token","content":" many"}

...

data: {"type":"end","tokenCount":45}
```

✅ **PASS**: Tokens stream in real-time

---

## 🧪 TEST 7: Error Handling

**Purpose**: Verify the system handles errors gracefully

### 7a. Missing Required Fields

```bash
curl -X POST https://your-app.railway.app/api/podcasts/generate/string \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Some text"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Missing required fields..."
}
```

✅ **PASS**: Returns 400 error with clear message

### 7b. Invalid Persona ID

```bash
curl -X POST https://your-app.railway.app/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "personaIds": ["invalid-uuid"]
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "No valid personas found"
}
```

✅ **PASS**: Returns error for invalid personas

### 7c. Non-existent Session

```bash
curl https://your-app.railway.app/api/conversations/fake-session-id
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Session not found"
}
```

✅ **PASS**: Returns 404 error

---

## 📊 PERFORMANCE TESTS

### 8a. Response Times

Test endpoint response times:

```bash
# Health check (should be <100ms)
time curl https://your-app.railway.app/health

# Persona list (should be <500ms)
time curl https://your-app.railway.app/api/personas

# Podcast generation (should be 20-60s)
time curl -X POST https://your-app.railway.app/api/podcasts/generate/string \
  -H "Content-Type: application/json" \
  -d '{ /* podcast data */ }'
```

✅ **PASS**:
- Health: <100ms
- API calls: <500ms
- Podcast generation: 20-60s (completes successfully)

### 8b. Concurrent Requests

Test multiple requests at once:

```bash
# Open 3 terminals and run simultaneously:
curl https://your-app.railway.app/api/personas &
curl https://your-app.railway.app/api/presets &
curl https://your-app.railway.app/health &
```

✅ **PASS**: All requests complete successfully

---

## 🎯 FINAL VERIFICATION CHECKLIST

After all tests, verify:

- [ ] ✅ Health checks pass
- [ ] ✅ Database is accessible
- [ ] ✅ 8 default personas are seeded
- [ ] ✅ 8 preset combinations available
- [ ] ✅ Content ingestion works
- [ ] ✅ **Podcast generation completes** (20-60s)
- [ ] ✅ Dialogues have personality traits
- [ ] ✅ Conversations work
- [ ] ✅ Streaming works (SSE)
- [ ] ✅ Session management works
- [ ] ✅ Error handling is graceful
- [ ] ✅ Response times are acceptable

---

## 🐛 TROUBLESHOOTING

### Issue: "Can't reach database server"

**Solution**:
```bash
# Check DATABASE_URL is set
railway variables

# If missing, Railway should auto-set it
# Try redeploying
railway up

# Check database status
railway status
```

### Issue: "OpenAI API key not configured"

**Solution**:
```bash
# Set the API key
railway variables set OPENAI_API_KEY=sk-your-key

# Verify it's set
railway variables

# Redeploy
railway up
```

### Issue: "Default personas not found"

**Solution**:
```bash
# Run seed script
railway run npm run prisma:seed

# Or visit the seed endpoint (if you deployed with Vercel config)
curl https://your-app.railway.app/api/seed
```

### Issue: Podcast generation fails

**Solution**:
```bash
# Check logs for errors
railway logs

# Common issues:
# 1. OpenAI API key not set
# 2. Rate limit reached
# 3. Invalid personas

# Verify personas exist first
curl https://your-app.railway.app/api/personas/defaults/status
```

### Issue: 500 errors

**Solution**:
```bash
# Check detailed logs
railway logs --tail 100

# Look for error messages
# Common issues:
# - Database connection
# - Missing environment variables
# - Prisma client not generated
```

---

## 📈 MONITORING

### View Logs in Real-Time

```bash
railway logs --tail
```

### Check Resource Usage

```bash
railway status
```

### View Metrics

1. Go to https://railway.app/dashboard
2. Select your project
3. Click "Metrics" tab
4. Monitor:
   - CPU usage
   - Memory usage
   - Request volume
   - Response times

---

## ✅ SUCCESS CRITERIA

Your deployment is **fully successful** if:

1. ✅ All health checks pass
2. ✅ All 8 personas are seeded
3. ✅ **Podcast generation completes in 20-60 seconds**
4. ✅ Dialogues show distinct personalities
5. ✅ Conversations work with streaming
6. ✅ All API endpoints respond correctly
7. ✅ Error handling works gracefully

---

## 🎉 NEXT STEPS

Once all tests pass:

1. **Share the URL** with others to test
2. **Generate real podcasts** with your own content
3. **Monitor performance** in Railway dashboard
4. **Scale if needed** (Railway auto-scales)

---

## 💡 PRO TIPS

### Save Common Commands

Create a file `railway-commands.sh`:

```bash
#!/bin/bash

# Quick test commands
export APP_URL="https://your-app.railway.app"

# Health check
alias rw-health="curl $APP_URL/health"

# Get personas
alias rw-personas="curl $APP_URL/api/personas/defaults"

# Check logs
alias rw-logs="railway logs --tail"

# Redeploy
alias rw-deploy="railway up"
```

### Set Up Monitoring

Create a simple monitoring script:

```bash
#!/bin/bash

while true; do
  STATUS=$(curl -s https://your-app.railway.app/health | jq -r .status)
  echo "$(date): Status = $STATUS"
  sleep 60
done
```

---

## 📞 NEED HELP?

If any test fails:

1. **Check logs**: `railway logs`
2. **Verify environment variables**: `railway variables`
3. **Check database**: `railway run npx prisma studio`
4. **Redeploy**: `railway up`

**Common issues are always**:
- Missing environment variables
- Database not migrated
- Default personas not seeded
- OpenAI API key issues

---

**You're all set!** This guide ensures EVERY feature works perfectly on Railway.
