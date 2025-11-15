# Vercel Deployment Quick Start

**Time to Deploy**: 10 minutes
**Cost**: Free tier available (with limitations)

---

## ⚠️ IMPORTANT: Limitations on Vercel

### What Will Work:
✅ Health checks
✅ Persona library endpoints
✅ Content ingestion (small files)
✅ Database queries
✅ Short API calls (<10s)

### What Won't Work:
❌ **Podcast generation** (too slow - will timeout after 10s on free tier, 60s on Pro)
❌ **Conversation sessions** (no persistent memory between requests)
❌ **Long conversations** (might timeout)

**For full functionality, use Railway instead** (see VERCEL_DEPLOYMENT_ASSESSMENT.md)

---

## 🚀 DEPLOYMENT STEPS

### Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **Database** - Choose one:
   - Vercel Postgres (paid)
   - Supabase (free tier available)
   - Neon (free tier available)
3. **OpenAI API Key** - Get from https://platform.openai.com

---

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Setup Database (Choose One)

#### Option A: Supabase (Recommended - Has Free Tier)

1. Go to https://supabase.com
2. Click "New Project"
3. Name: `scribepod`
4. Database password: (create a strong password)
5. Wait for project to initialize (~2 minutes)
6. Go to Settings > Database
7. Copy the **Connection String** (Pooling mode)
   - Format: `postgres://postgres.[project-ref]:[password]@[host]:6543/postgres`
8. Save this for Step 5

#### Option B: Neon

1. Go to https://neon.tech
2. Sign up / Login
3. Create new project: `scribepod`
4. Copy the connection string
5. Save for Step 5

#### Option C: Vercel Postgres (No Free Tier)

```bash
# After initial deployment, add from Vercel dashboard
# Storage > Postgres > Create
```

---

### Step 4: Deploy to Vercel

```bash
# Initialize Vercel project
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Your account)
# - Link to existing project? No
# - Project name? scribepod (or your choice)
# - Directory? ./ (just press Enter)
# - Override settings? No
```

**This will deploy your app!** You'll get a URL like: `https://scribepod-xxx.vercel.app`

---

### Step 5: Add Environment Variables

**Via Vercel Dashboard** (Easier):

1. Go to https://vercel.com/dashboard
2. Select your `scribepod` project
3. Go to **Settings** > **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your database connection string | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI API key (sk-...) | Production, Preview, Development |

**Or via CLI**:

```bash
# Add DATABASE_URL
vercel env add DATABASE_URL
# When prompted: Production, Preview, Development
# Paste your database URL

# Add OPENAI_API_KEY
vercel env add OPENAI_API_KEY
# When prompted: Production, Preview, Development
# Paste your OpenAI key
```

---

### Step 6: Redeploy with Environment Variables

```bash
vercel --prod
```

---

### Step 7: Run Database Migrations

**Important**: You need to run migrations to create tables.

```bash
# Pull environment variables locally
vercel env pull .env.local

# Run migrations against production database
npx prisma migrate deploy

# Or if that doesn't work, generate and push schema
npx prisma generate
npx prisma db push
```

---

### Step 8: Seed Database with Default Personas

**Visit your seed endpoint**:

```
https://your-app.vercel.app/api/seed
```

You should see:
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "created": ["Sarah Chen", "Marcus Thompson", ...],
  "total": 8
}
```

---

## ✅ VERIFICATION

### Test Your Deployment

1. **Health Check**:
   ```bash
   curl https://your-app.vercel.app/health
   ```

2. **Get Default Personas**:
   ```bash
   curl https://your-app.vercel.app/api/personas/defaults
   ```

3. **Get Preset Combinations**:
   ```bash
   curl https://your-app.vercel.app/api/personas/presets
   ```

4. **Test Short Conversation** (might work):
   ```bash
   curl -X POST https://your-app.vercel.app/api/conversations \
     -H "Content-Type: application/json" \
     -d '{
       "personaIds": ["get-id-from-step-2"]
     }'
   ```

---

## ⚠️ KNOWN ISSUES ON VERCEL

### 1. Podcast Generation Will Timeout

**Problem**: Takes 30-60+ seconds, Vercel limit is 10s (free) or 60s (Pro)

**Workaround**: Not available without major refactoring

### 2. Sessions Don't Persist

**Problem**: In-memory sessions reset between requests

**Fix Required**: Implement Redis (see VERCEL_DEPLOYMENT_ASSESSMENT.md)

### 3. Cold Starts

**Problem**: First request after inactivity is slow (5-10s)

**No fix**: This is normal for serverless

---

## 💰 COSTS

### Free Tier:
- 100 GB bandwidth
- 100 hours serverless execution
- **10 second timeout** (most features won't work)

### Pro Tier ($20/month):
- Unlimited bandwidth
- Unlimited execution
- **60 second timeout** (podcast generation still might timeout)
- Team collaboration

---

## 🔧 TROUBLESHOOTING

### "Error: Can't reach database server"

- Check DATABASE_URL is set correctly
- Verify database is accessible (check IP whitelist if using Supabase)
- Run `npx prisma migrate deploy`

### "OpenAI API key not configured"

- Check OPENAI_API_KEY is set in Vercel dashboard
- Redeploy after adding: `vercel --prod`

### "Module not found"

- Vercel needs to install dependencies
- Check package.json has all dependencies
- Redeploy

### Timeouts on /api/podcasts/generate

- **Expected behavior** on free tier
- Upgrade to Pro ($20/mo) for 60s timeout
- Or use Railway for unlimited timeouts

---

## 📊 RECOMMENDED NEXT STEPS

If you want **full functionality**:

1. **Use Railway instead** - $5/month, no timeouts, no refactoring needed
2. **Or refactor for Vercel** - See VERCEL_DEPLOYMENT_ASSESSMENT.md

For now, you can:
- ✅ Test the persona library
- ✅ Test content ingestion
- ✅ Test short API calls
- ❌ Cannot generate full podcasts (too slow)

---

## 🚀 ALTERNATIVE: Quick Railway Deployment

For comparison, here's Railway (recommended):

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# That's it! Everything works with no code changes
```

**Railway Benefits**:
- ✅ No timeouts
- ✅ PostgreSQL included
- ✅ No refactoring needed
- ✅ $5/month (vs Vercel $20)

---

## 📞 NEED HELP?

Check these files:
- `VERCEL_DEPLOYMENT_ASSESSMENT.md` - Full analysis
- `FINAL_COMPREHENSIVE_REVIEW.md` - System overview
- `PHASE_3_DOCUMENTATION.md` - Feature documentation

**Recommendation**: For testing purposes, Vercel works. For production, use Railway.
