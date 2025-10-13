# QUICK START GUIDE
## Emergency Fixes & Copy-Paste Solutions

**Use this when:** You need fixes NOW without reading 100 pages of documentation.

**⚠️ WARNING:** These are quick fixes. Read full documentation for complete understanding.

---

## 🔥 EMERGENCY: DEPLOY SAFELY IN 2 HOURS

### Step 1: Create .env File (5 minutes)

```bash
cd scribepod-master
cat > .env << 'EOF'
NODE_ENV=production
REASON_SERVER_HOST=0.0.0.0
REASON_SERVER_PORT=4200
WHISPER_SERVER_HOST=localhost
WHISPER_SERVER_PORT=5000
FRONTEND_URL=http://localhost:3000

API_KEY=CHANGE-THIS-TO-RANDOM-STRING
CORS_ALLOWED_ORIGINS=http://localhost:3000

FLASK_ENV=production
FLASK_DEBUG=0
LOG_LEVEL=info
EOF

# Generate random API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >> .env
```

### Step 2: Fix CORS (10 minutes)

**File: `reason/server.ts` - Line 10**
```typescript
// Replace: app.use(cors());
// With:
import cors from 'cors';
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**File: `agent/whisper/app.py` - Line 11**
```python
# Replace: CORS(app)
# With:
import os
allowed_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, resources={r"/*": {"origins": allowed_origins}})
```

### Step 3: Fix Temp File Leak (15 minutes)

**File: `agent/whisper/app.py` - Lines 26-35**
```python
# Add these imports at top
import shutil
from contextlib import contextmanager

# Add this function before @app.route('/transcribe')
@contextmanager
def temp_audio_file():
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        save_path = os.path.join(temp_dir, 'temp.wav')
        yield save_path
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

# Replace transcribe function with:
@app.route('/transcribe', methods=['POST'])
def transcribe():
    with temp_audio_file() as save_path:  # Uses context manager
        wav_file = request.files['audio_data']
        wav_file.save(save_path)
        result = whisper_model.transcribe(save_path, language='english')
        print('Transcription: ', result['text'])
        return result['text']
    # temp_dir automatically deleted here
```

### Step 4: Add Rate Limiting (20 minutes)

```bash
npm install express-rate-limit
cd agent/whisper && pip install flask-limiter
```

**File: `reason/server.ts` - After imports**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60 // 60 requests per minute
});

app.use('/conversation', limiter);
```

**File: `agent/whisper/app.py` - After app = flask.Flask(__name__)**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(app=app, key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

# Add @limiter.limit("60 per minute") before each route
@app.route('/transcribe', methods=['POST'])
@limiter.limit("60 per minute")
def transcribe():
    # ... existing code
```

### Step 5: Add Health Checks (10 minutes)

**File: `reason/server.ts` - Before app.listen()**
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'scribepod-reason' });
});
```

**File: `agent/whisper/app.py` - Before if __name__**
```python
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'service': 'scribepod-whisper' })
```

### Step 6: Create requirements.txt (5 minutes)

**File: `agent/whisper/requirements.txt`**
```txt
flask==3.0.0
flask-cors==4.0.0
flask-limiter==3.5.0
openai-whisper==20231117
transformers==4.36.0
torch==2.1.0
python-dotenv==1.0.0
```

### Step 7: Load Environment Variables (15 minutes)

```bash
npm install dotenv
```

**File: `reason/server.ts` - Line 1 (add at top)**
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

**File: `reason/server.ts` - Line 92 (replace port)**
```typescript
// Replace: const port = 4200;
// With:
const PORT = parseInt(process.env.REASON_SERVER_PORT || '4200');
const HOST = process.env.REASON_SERVER_HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
```

**File: `agent/whisper/app.py` - Line 1 (add at top)**
```python
import os
from dotenv import load_dotenv
load_dotenv()
```

**File: `agent/whisper/app.py` - Lines 191-193 (replace)**
```python
# Replace entire if __name__ == "__main__" block with:
if __name__ == "__main__":
    host = os.getenv('WHISPER_SERVER_HOST', '0.0.0.0')
    port = int(os.getenv('WHISPER_SERVER_PORT', 5000))
    load_model()
    app.run(host=host, port=port, debug=False)
```

### Step 8: Test Everything (10 minutes)

```bash
# Install Python deps
cd agent/whisper
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start services
cd ../..
npm install
npm run start-reason &  # Starts Reason server
cd agent/whisper && python app.py &  # Starts Whisper
cd agent/ear && npm install && npm start  # Starts frontend

# Test health checks
curl http://localhost:4200/health
curl http://localhost:5000/health

# Test rate limiting (should fail after 60 requests)
for i in {1..65}; do curl http://localhost:4200/health; done
```

---

## 🛠️ COMMON FIXES

### Fix: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Fix: "No module named 'whisper'"
```bash
cd agent/whisper
pip install openai-whisper
```

### Fix: "CUDA not available"
```bash
# Install CUDA-enabled PyTorch
pip install torch==2.1.0+cu118 --extra-index-url https://download.pytorch.org/whl/cu118
```

### Fix: "Port 4200 already in use"
```bash
# Find and kill process using port
lsof -ti:4200 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :4200   # Windows (then taskkill /PID <pid> /F)
```

### Fix: "Temp directory filling up"
**Already fixed in Step 3 above** ✅

### Fix: "Getting other users' conversations"
**Need Session Management - See IMPLEMENTATION-GUIDE.md Phase 1 Step 1.3**

### Fix: "Anyone can access my API"
**Need Authentication - See IMPLEMENTATION-GUIDE.md Phase 1 Step 1.1 + Add API key middleware**

---

## 📝 COPY-PASTE: Basic Authentication (10 minutes)

**New File: `middleware/auth.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};
```

**File: `reason/server.ts` - Apply to routes**
```typescript
import { requireAuth } from '../middleware/auth';

app.post('/conversation', requireAuth, upload.any(), asyncHandler(...));
```

Test:
```bash
# Should fail
curl http://localhost:4200/conversation

# Should succeed
curl -H "X-API-Key: YOUR_API_KEY_FROM_ENV" http://localhost:4200/conversation
```

---

## 🐳 COPY-PASTE: Docker Compose (30 minutes)

**New File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  reason:
    build: .
    ports:
      - "4200:4200"
    environment:
      - NODE_ENV=production
      - WHISPER_SERVER_HOST=whisper
      - WHISPER_SERVER_PORT=5000
    depends_on:
      - whisper

  whisper:
    build: ./agent/whisper
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  frontend:
    build: ./agent/ear
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_REASON_URL=http://localhost:4200
    depends_on:
      - reason
```

**New File: `Dockerfile` (root)**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4200
CMD ["npm", "run", "start-reason"]
```

**New File: `agent/whisper/Dockerfile`**
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
```

**New File: `agent/ear/Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Start:
```bash
docker-compose up --build
```

---

## 🔍 DEBUGGING CHEAT SHEET

### Check Logs
```bash
# Reason server
tail -f logs/combined.log

# Whisper server
tail -f agent/whisper/logs/whisper.log

# Docker logs
docker-compose logs -f reason
docker-compose logs -f whisper
```

### Check Health
```bash
# All services
curl http://localhost:4200/health
curl http://localhost:5000/health
curl http://localhost:3000  # Frontend

# With JSON formatting
curl http://localhost:4200/health | jq '.'
```

### Check Rate Limits
```bash
# Current rate limit status (if implemented)
curl http://localhost:4200/status

# Test rate limiting
for i in {1..100}; do
  curl -w "\nStatus: %{http_code}\n" http://localhost:4200/health
  sleep 0.5
done
```

### Check Sessions
```bash
# If implemented
curl http://localhost:4200/sessions/stats | jq '.'
```

### Check Temp Files
```bash
# List temp directories
ls -la /tmp | grep tmp | wc -l

# Monitor temp file creation
watch 'ls /tmp | grep tmp | wc -l'

# Clean up manually if needed
rm -rf /tmp/tmp*
```

---

## ⚡ PERFORMANCE QUICK WINS

### 1. Use Smaller Whisper Model (If CPU-bound)
**File: `agent/whisper/app.py` - Line 21**
```python
# Replace: whisper_model = whisper.load_model("large", 'cuda')
# With:
whisper_model = whisper.load_model("base", 'cuda')  # 5x faster, slightly less accurate
```

### 2. Reduce Audio Quality (Faster Upload)
**File: `agent/ear/src/index.tsx` - Line 134**
```typescript
// Replace: const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
// With:
const blob = new Blob(chunks, { 'type': 'audio/webm; codecs=opus' });
```

### 3. Increase Chunk Interval (Less Frequent Processing)
**File: `agent/ear/src/index.tsx` - Line 6**
```typescript
// Replace: const INTERVAL = 1000;
// With:
const INTERVAL = 2000;  // Process every 2 seconds instead of 1
```

---

## 📊 MONITORING ONE-LINERS

### CPU Usage
```bash
# Linux/Mac
top -b -n 1 | grep python
top -b -n 1 | grep node

# Watch continuously
watch 'ps aux | grep -E "(python|node)" | grep -v grep'
```

### Memory Usage
```bash
# Python memory
ps aux | grep python | awk '{print $4}'

# Node memory
ps aux | grep node | awk '{print $4}'
```

### Request Count
```bash
# Count requests in logs
grep "POST /conversation" logs/combined.log | wc -l

# Requests per minute (last 100 lines)
tail -100 logs/combined.log | grep "POST /conversation" | wc -l
```

### Error Rate
```bash
# Count errors in last hour
grep "ERROR" logs/combined.log | tail -100 | wc -l

# Show recent errors
grep "ERROR" logs/combined.log | tail -10
```

---

## 🚨 EMERGENCY SHUTDOWN

### Stop All Services
```bash
# Kill all node processes
pkill -f node

# Kill all python processes (⚠️ WARNING: kills ALL python)
pkill -f python

# Kill specific ports
lsof -ti:4200,5000,3000 | xargs kill -9

# Docker
docker-compose down
```

### Emergency Cleanup
```bash
# Clear all temp files
rm -rf /tmp/tmp*

# Clear logs
rm -rf logs/*.log

# Clear node_modules (if corrupted)
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Clear Python cache
find . -name "__pycache__" -type d -prune -exec rm -rf '{}' +
```

---

## 📦 DEPLOYMENT CHECKLIST

Before deploying to production:

```bash
# 1. Environment check
[ -f .env ] && echo "✓ .env exists" || echo "✗ Missing .env"
grep -q "CHANGE-THIS" .env && echo "✗ Change default API keys!" || echo "✓ API keys customized"

# 2. Dependencies check
npm list dotenv express-rate-limit > /dev/null && echo "✓ Node deps OK" || echo "✗ Run npm install"
cd agent/whisper && pip show flask whisper > /dev/null && echo "✓ Python deps OK" || echo "✗ Run pip install"

# 3. Security check
grep -r "http://localhost" --exclude-dir=node_modules . && echo "✗ Hardcoded URLs found!" || echo "✓ No hardcoded URLs"
grep -r "console.log" reason/ && echo "⚠ Console.logs found (consider removing)" || echo "✓ No console.logs"

# 4. Health check
curl -f http://localhost:4200/health && echo "✓ Reason healthy" || echo "✗ Reason unhealthy"
curl -f http://localhost:5000/health && echo "✓ Whisper healthy" || echo "✗ Whisper unhealthy"

# 5. Functionality check
echo "Testing conversation endpoint..."
curl -X POST http://localhost:4200/conversation -F "audio_data=@test.wav" && echo "✓ Working" || echo "✗ Failed"
```

---

## 🎯 WHAT'S NEXT?

After quick fixes are applied:

1. **Read Full Documentation**
   - 📖 `01-CURRENT-STATE-ANALYSIS.md` - Understand the codebase
   - 🔒 `02-VULNERABILITIES-REPORT.md` - Know all risks
   - 🛠️ `IMPLEMENTATION-GUIDE.md` - Complete stabilization

2. **Implement Remaining Phases**
   - Phase 2: Error Handling (2 weeks)
   - Phase 3: Code Quality (2 weeks)
   - Phase 4: Scalability (3-4 weeks)
   - Phase 5: Production Deployment (1-2 weeks)

3. **Set Up Monitoring**
   - Sentry for error tracking
   - Prometheus for metrics
   - Grafana for dashboards

4. **Automated Testing**
   - Unit tests (Jest, Pytest)
   - Integration tests
   - Load testing (k6, Artillery)

---

## 💡 PRO TIPS

### Fastest Way to Find Issues
```bash
# Search for common problems
grep -r "console.log\|print(" . --exclude-dir={node_modules,venv}
grep -r "http://localhost\|http://0.0.0.0" . --exclude-dir={node_modules,venv}
grep -r "TODO\|FIXME\|HACK\|XXX" . --exclude-dir={node_modules,venv}
```

### Quick Performance Test
```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Linux
brew install httpd  # Mac

# Test endpoint
ab -n 100 -c 10 http://localhost:4200/health
# -n 100 = 100 requests
# -c 10 = 10 concurrent
```

### Quick Backup Before Changes
```bash
# Backup entire project
tar -czf scribepod-backup-$(date +%Y%m%d).tar.gz scribepod-master/

# Backup just code (no node_modules)
tar -czf scribepod-code-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='venv' \
  --exclude='.git' \
  scribepod-master/
```

---

## 🆘 STILL STUCK?

1. Check logs: `tail -f logs/combined.log`
2. Check health: `curl http://localhost:4200/health`
3. Restart services: Kill everything and start fresh
4. Check GitHub issues: Search for similar problems
5. Read full docs: `README.md` in docs/stabilization/

**Remember:** Quick fixes get you running, but full implementation makes you stable!
