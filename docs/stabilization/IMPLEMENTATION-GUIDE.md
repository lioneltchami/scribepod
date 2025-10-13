# COMPLETE IMPLEMENTATION GUIDE
## Scribepod Stabilization: Phase 1-5 Step-by-Step

**Version:** 1.0
**Total Time:** 260 hours (~13 weeks, 1 developer)
**Target:** Transform experimental project → Production-ready system

---

## HOW TO USE THIS GUIDE

### For Each Phase:
1. Read the **Overview** section
2. Follow **Implementation Steps** in exact order
3. Test using **Verification** procedures
4. Mark **Success Criteria** complete before moving to next phase

### Before Starting ANY Phase:
```bash
# Create feature branch
git checkout -b phase-1-security

# Commit after each major change
git add .
git commit -m "feat: implement [specific change]"

# If something breaks, rollback
git reset --hard HEAD~1
```

---

## 🔴 PHASE 1: CRITICAL SECURITY & STABILITY
**Duration:** 1-2 weeks (40 hours)
**Priority:** IMMEDIATE - Must complete before any deployment

### What You'll Build
- Environment variable configuration
- CORS security restrictions
- Per-user session management
- Python startup improvements
- Automatic temp file cleanup
- Health check endpoints
- requirements.txt for Python

### Success Criteria
- [ ] Zero hardcoded URLs
- [ ] CORS restricted to allowed origins
- [ ] System handles 10+ concurrent users
- [ ] No temp file leaks after 1 hour testing
- [ ] Health endpoints return 200 OK
- [ ] Models load within 60 seconds
- [ ] Python environment reproducible

---

### STEP 1.1: Environment Configuration (4 hours)

#### Create .env File

```bash
# Create .env in project root
cd scribepod-master
touch .env
```

**File: `.env`**
```bash
# Server Configuration
NODE_ENV=development
REASON_SERVER_HOST=0.0.0.0
REASON_SERVER_PORT=4200
WHISPER_SERVER_HOST=localhost
WHISPER_SERVER_PORT=5000
FRONTEND_URL=http://localhost:3000

# Security
API_KEY=your-secret-key-change-in-production
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Python/Flask
FLASK_ENV=development
FLASK_DEBUG=0

# Logging
LOG_LEVEL=info

# External APIs (if used)
OPENAI_API_KEY=your-openai-key
PLAY_HT_SECRET_KEY=your-playht-key
PLAY_HT_USER_ID=your-playht-userid
ELEVEN_API=your-elevenlabs-key
```

#### Update .gitignore

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "logs/" >> .gitignore
echo "*.log" >> .gitignore
```

#### Install dotenv

```bash
npm install dotenv
cd agent/whisper && pip install python-dotenv
```

#### Load Environment Variables

**File: `reason/server.ts`** (Add at top)
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

**File: `agent/whisper/app.py`** (Add at top)
```python
import os
from dotenv import load_dotenv

load_dotenv()
```

#### Replace Hardcoded Values

**File: `reason/server.ts`** (Line 92)
```typescript
// BEFORE
const port = 4200;

// AFTER
const PORT = parseInt(process.env.REASON_SERVER_PORT || '4200');
const HOST = process.env.REASON_SERVER_HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Reason server listening on ${HOST}:${PORT}`);
});
```

**File: `reason/localInference.ts`** (Lines 21, 38)
```typescript
// BEFORE
const response = await axios.post("http://0.0.0.0:5000/transcribe", ...);

// AFTER
const WHISPER_BASE_URL = `http://${process.env.WHISPER_SERVER_HOST}:${process.env.WHISPER_SERVER_PORT}`;

export const postAudioData = async (file: any): Promise<string> => {
  // ...
  const response = await axios.post(`${WHISPER_BASE_URL}/transcribe`, form, {
    headers: form.getHeaders()
  });
  // ...
}

export const generateThoughts = async (conversation: string[]): Promise<Thots> => {
  // ...
  const response = await axios.post(`${WHISPER_BASE_URL}/generate_thots`, {
    conversation_speech: with_person_prepended
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  // ...
}
```

**File: `agent/ear/src/index.tsx`** (Lines 71, 102)
```typescript
// BEFORE
const response = await fetch(`http://0.0.0.0:4200/conversation?chunk=${chunkNumber}`, ...);

// AFTER
const REASON_BASE_URL = process.env.REACT_APP_REASON_URL || 'http://localhost:4200';

const postSilenceDetect = async (): Promise<string> => {
  const response = await fetch(`${REASON_BASE_URL}/silence_detect`, { method: "GET" });
  // ...
}

const postAudioDataToReason = async (blob: Blob, chunkNumber: number): Promise<any> => {
  // ...
  const response = await fetch(`${REASON_BASE_URL}/conversation?chunk=${chunkNumber}`, {
    method: "POST",
    body: formData,
    headers: myHeaders
  });
  // ...
}
```

**File: `agent/whisper/app.py`** (Line 193)
```python
# BEFORE
if __name__ == "__main__":
    load_model()
    app.run()

# AFTER
if __name__ == "__main__":
    host = os.getenv('WHISPER_SERVER_HOST', '0.0.0.0')
    port = int(os.getenv('WHISPER_SERVER_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', '0') == '1'

    load_model()
    app.run(host=host, port=port, debug=debug)
```

#### Test Configuration

```bash
# Test environment loading
node -e "require('dotenv').config(); console.log(process.env.REASON_SERVER_PORT)"
# Should output: 4200

python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('WHISPER_SERVER_PORT'))"
# Should output: 5000
```

---

### STEP 1.2: CORS Security (2 hours)

#### Update reason/server.ts

```typescript
// BEFORE (Line 10)
app.use(cors());

// AFTER
import cors from 'cors';

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-Id'],
  exposedHeaders: ['X-Session-Id']
}));
```

#### Update agent/whisper/app.py

```python
# BEFORE (Line 11)
CORS(app)

# AFTER
from flask_cors import CORS
import os

allowed_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
```

#### Test CORS

```bash
# Should FAIL (wrong origin)
curl -H "Origin: http://evil.com" http://localhost:4200/health
# Expected: CORS error

# Should SUCCEED (allowed origin)
curl -H "Origin: http://localhost:3000" http://localhost:4200/health
# Expected: Response with CORS headers
```

---

### STEP 1.3: Session Management (6 hours)

#### Create Session Types

**New File: `reason/types.ts`**
```typescript
export type StateType = 'listening' | 'responding' | 'done';

export interface Thots {
  intent: string;
  person_is: string;
  extra_state: string;
  thoughts: string;
  response: string;
}

export interface SessionData {
  sessionId: string;
  lastActivity: number;
  conversation: MindState;
}
```

#### Update MindState Class

**File: `reason/server.ts`** (Update class)
```typescript
class MindState {
  stateType: StateType;
  latestQuestion: string;
  thoughts: string[];
  derived_intent: string[];
  subject_is: string[];
  responses: string[];
  conversation: string[];
  lastActivity: number;  // NEW

  constructor(public conversationHistory: string[]) {
    this.latestQuestion = '';
    this.stateType = 'listening';
    this.thoughts = [];
    this.derived_intent = [];
    this.subject_is = [];
    this.responses = [];
    this.conversation = conversationHistory;
    this.lastActivity = Date.now();  // NEW
  }

  // Existing methods...
  updateThoughts = (thots: Thots) => {
    this.lastActivity = Date.now();  // NEW
    const {extra_state, intent, person_is, response, thoughts} = thots;
    const dedupedThoughts = Array.from(new Set([...this.thoughts, thoughts, extra_state])).slice(-5);
    const dedupedDerivedIntent = Array.from(new Set([...this.derived_intent, intent])).slice(-5);
    const dedupedSubjectIs = Array.from(new Set([...this.subject_is, person_is])).slice(-5);
    const dedupedResponses = Array.from(new Set([...this.responses, response])).slice(-5);
    this.subject_is = dedupedSubjectIs;
    this.thoughts = dedupedThoughts;
    this.derived_intent = dedupedDerivedIntent;
    this.responses = dedupedResponses;
  }

  updateConversation = (newTranscription: string, chunk: number) => {
    this.lastActivity = Date.now();  // NEW
    if (chunk === 1) {
      this.conversation = [...this.conversation, newTranscription];
    } else {
      this.conversation[this.conversation.length - 1] = newTranscription;
    }
    this.eventHandler({ type: 'new_transcription' });
  }

  // Rest of class...
}
```

#### Implement Session Management

**File: `reason/server.ts`** (Replace global conversation)
```typescript
import { v4 as uuidv4 } from 'uuid';

// BEFORE (Line 65)
// let conversation = new MindState([]);

// AFTER
const conversations = new Map<string, MindState>();

// Session cleanup (runs every 10 minutes)
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, state] of conversations.entries()) {
    if (now - state.lastActivity > SESSION_TIMEOUT) {
      conversations.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} inactive sessions`);
  }
}, CLEANUP_INTERVAL);

// Middleware to get/create session
const getOrCreateSession = (req: any): { sessionId: string; conversation: MindState } => {
  let sessionId = req.headers['x-session-id'];

  if (!sessionId || !conversations.has(sessionId)) {
    sessionId = uuidv4();
    conversations.set(sessionId, new MindState([]));
    console.log(`Created new session: ${sessionId}`);
  }

  const conversation = conversations.get(sessionId)!;
  return { sessionId, conversation };
};

// Update endpoint
app.post('/conversation', upload.any(), asyncHandler(async (req: any, res: any, next) => {
  const { chunk } = req.query;
  const { files } = req;

  const { sessionId, conversation } = getOrCreateSession(req);

  const chunkInt = parseInt(chunk);
  const buf = files[0];
  const transcriptionResponse = await postAudioData(buf);
  conversation.updateConversation(transcriptionResponse, chunkInt);

  const thots = await generateThoughts(conversation.conversation);
  conversation.updateThoughts(thots);

  const conversationState = {
    thoughts: conversation.thoughts,
    derived_intent: conversation.derived_intent,
    subject_is: conversation.subject_is,
    responses: conversation.responses,
  };

  // NEW: Return session ID in response
  res.json({
    sessionId,  // Client will store and send back
    transcriptionResponse,
    conversationState
  });
}));

// NEW: Session stats endpoint
app.get('/sessions/stats', (req, res) => {
  res.json({
    activeS sessions: conversations.size,
    sessions: Array.from(conversations.entries()).map(([id, state]) => ({
      sessionId: id,
      conversationLength: state.conversation.length,
      lastActivity: new Date(state.lastActivity).toISOString()
    }))
  });
});
```

#### Update Frontend to Use Sessions

**File: `agent/ear/src/index.tsx`** (Add session tracking)
```typescript
// At top of file
let sessionId: string | null = null;

// Update postAudioDataToReason function
const postAudioDataToReason = async (blob: Blob, chunkNumber: number): Promise<any> => {
  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Accept", "text/plain");
  myHeaders.append("Accept", "*/*");

  // NEW: Send session ID if we have one
  if (sessionId) {
    myHeaders.append("X-Session-Id", sessionId);
  }

  const formData = new FormData();
  formData.append("audio_data", blob, 'temp_recording');

  const response = await fetch(`${REASON_BASE_URL}/conversation?chunk=${chunkNumber}`, {
    method: "POST",
    body: formData,
    headers: myHeaders
  });

  if (response.status === 200) {
    const data = await response.json();

    // NEW: Store session ID from server
    if (data.sessionId) {
      sessionId = data.sessionId;
      console.log(`Using session: ${sessionId}`);
    }

    return {
      transcriptionResponse: data.transcriptionResponse,
      conversationState: data.conversationState
    };
  }

  return {transcriptionResponse: '', conversationState: {}};
}
```

#### Test Multi-User Sessions

```bash
# Terminal 1: Start servers
npm run start-reason-dev

# Terminal 2: Python
cd agent/whisper && python app.py

# Terminal 3: Test multi-user
# User 1
curl -X POST http://localhost:4200/conversation \
  -H "X-Session-Id: user1" \
  -F "audio_data=@test1.wav"

# User 2 (different session)
curl -X POST http://localhost:4200/conversation \
  -H "X-Session-Id: user2" \
  -F "audio_data=@test2.wav"

# Check sessions
curl http://localhost:4200/sessions/stats
# Should show 2 active sessions
```

---

### STEP 1.4: Fix Python Model Loading (3 hours)

**File: `agent/whisper/app.py`** (Replace load_model function)

```python
import logging
import torch

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

whisper_model = None
tokenizer = None
text_model = None

def load_model():
    """Load models with proper error handling and device detection"""
    global whisper_model, tokenizer, text_model

    try:
        # Check CUDA availability
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f'Loading models on device: {device}')

        if device == 'cpu':
            logger.warning('⚠️  CUDA not available! Using CPU (will be VERY slow)')
            logger.warning('⚠️  Consider using smaller models for CPU: base or small')

        # Load Whisper
        logger.info('Loading Whisper model...')
        model_size = 'large' if device == 'cuda' else 'base'  # Use smaller model on CPU
        whisper_model = whisper.load_model(model_size, device)
        logger.info(f'✓ Whisper {model_size} loaded successfully')

        # Load Tokenizer
        logger.info('Loading T5 tokenizer...')
        tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-xl")
        logger.info('✓ Tokenizer loaded successfully')

        # Load Flan-T5
        logger.info('Loading Flan-T5-XL model (this may take a while)...')
        if device == 'cuda':
            text_model = T5ForConditionalGeneration.from_pretrained(
                "google/flan-t5-xl",
                device_map="auto"
            )
        else:
            text_model = T5ForConditionalGeneration.from_pretrained(
                "google/flan-t5-xl"
            )
            text_model = text_model.to('cpu')
        logger.info('✓ Flan-T5-XL loaded successfully')

        logger.info('🚀 All models loaded and ready!')
        return True

    except Exception as e:
        logger.error(f'❌ Failed to load models: {e}', exc_info=True)
        raise RuntimeError(f'Model loading failed: {e}')

# Call at startup
if __name__ == "__main__":
    try:
        load_model()

        host = os.getenv('WHISPER_SERVER_HOST', '0.0.0.0')
        port = int(os.getenv('WHISPER_SERVER_PORT', 5000))
        debug = os.getenv('FLASK_DEBUG', '0') == '1'

        logger.info(f'Starting Flask server on {host}:{port}')
        app.run(host=host, port=port, debug=debug)
    except Exception as e:
        logger.error(f'Failed to start server: {e}')
        exit(1)
```

---

### STEP 1.5: Temp File Cleanup (2 hours)

**File: `agent/whisper/app.py`** (Update transcribe endpoint)

```python
import shutil
from contextlib import contextmanager

@contextmanager
def temp_audio_file():
    """
    Context manager for temporary audio files.
    Automatically cleans up even if errors occur.
    """
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        save_path = os.path.join(temp_dir, 'temp.wav')
        logger.debug(f'Created temp file: {save_path}')
        yield save_path
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
                logger.debug(f'Cleaned up temp dir: {temp_dir}')
            except Exception as e:
                logger.error(f'Failed to cleanup temp dir {temp_dir}: {e}')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file to text"""
    start_time = time.time()

    try:
        # Use context manager for automatic cleanup
        with temp_audio_file() as save_path:
            # Get audio file from request
            if 'audio_data' not in request.files:
                return jsonify({'error': 'No audio file provided'}), 400

            wav_file = request.files['audio_data']
            file_size = len(wav_file.read())
            wav_file.seek(0)  # Reset after reading size

            logger.info(f'Transcribing audio ({file_size} bytes)')

            # Save and transcribe
            wav_file.save(save_path)
            result = whisper_model.transcribe(save_path, language='english')

            duration = time.time() - start_time
            logger.info(f'Transcription complete in {duration:.2f}s: "{result["text"]}"')

            return result['text']

    except Exception as e:
        logger.error(f'Transcription failed: {e}', exc_info=True)
        return jsonify({'error': 'Transcription failed', 'message': str(e)}), 500
    # temp_dir automatically cleaned up here!
```

#### Test Cleanup

```bash
# Count temp directories before
before=$(ls /tmp | grep tmp | wc -l)
echo "Temp dirs before: $before"

# Make 50 transcription requests
for i in {1..50}; do
  curl -X POST http://localhost:5000/transcribe \
    -F "audio_data=@test.wav" > /dev/null 2>&1
done

# Wait a bit
sleep 2

# Count temp directories after
after=$(ls /tmp | grep tmp | wc -l)
echo "Temp dirs after: $after"

# Should be same or very close
if [ $after -le $((before + 5)) ]; then
  echo "✓ Cleanup working!"
else
  echo "✗ Temp file leak detected!"
fi
```

---

### STEP 1.6: Health Check Endpoints (2 hours)

**File: `reason/server.ts`** (Add before app.listen)

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'scribepod-reason',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: conversations.size
  });
});

// Readiness check (checks dependencies)
app.get('/ready', async (req, res) => {
  try {
    // Check if Whisper service is reachable
    const whisperHealth = await axios.get(`${WHISPER_BASE_URL}/health`, {
      timeout: 2000
    });

    if (whisperHealth.status === 200) {
      res.json({
        status: 'ready',
        dependencies: {
          whisper: 'ok'
        }
      });
    } else {
      throw new Error('Whisper service unhealthy');
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      reason: 'Whisper service unavailable',
      error: error.message
    });
  }
});
```

**File: `agent/whisper/app.py`** (Add before if __name__)

```python
import time

# Track startup time
start_time = time.time()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'scribepod-whisper',
        'version': '1.0.0',
        'cuda_available': torch.cuda.is_available(),
        'models_loaded': whisper_model is not None and text_model is not None,
        'uptime': time.time() - start_time
    })

@app.route('/ready', methods=['GET'])
def ready():
    """Readiness check endpoint"""
    if whisper_model is None or text_model is None:
        return jsonify({
            'status': 'not ready',
            'reason': 'Models not loaded yet'
        }), 503

    return jsonify({
        'status': 'ready',
        'models': {
            'whisper': 'loaded',
            'flan-t5': 'loaded'
        }
    })
```

#### Test Health Checks

```bash
# Test Reason server health
curl http://localhost:4200/health
# Expected: {"status":"ok",...}

# Test Whisper server health
curl http://localhost:5000/health
# Expected: {"status":"ok","cuda_available":true,...}

# Test readiness
curl http://localhost:4200/ready
# Expected: {"status":"ready",...}

curl http://localhost:5000/ready
# Expected: {"status":"ready",...}
```

---

### STEP 1.7: Create requirements.txt (1 hour)

**New File: `agent/whisper/requirements.txt`**
```txt
# Core Dependencies
flask==3.0.0
flask-cors==4.0.0
python-dotenv==1.0.0

# AI Models
openai-whisper==20231117
transformers==4.36.0

# PyTorch (choose ONE based on your system)
# For CUDA 11.8:
torch==2.1.0+cu118 --extra-index-url https://download.pytorch.org/whl/cu118

# For CPU only (much slower):
# torch==2.1.0

# Utilities
python-json-logger==2.0.7

# Optional: Rate Limiting
flask-limiter==3.5.0

# Development
pytest==7.4.3
black==23.12.1
```

**Installation Instructions**

```bash
# Create virtual environment
cd agent/whisper
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import whisper, transformers, flask; print('✓ All packages installed')"

# Lock versions for production
pip freeze > requirements-lock.txt
```

---

### STEP 1.8: Update Package Scripts

**File: `package.json`** (Update scripts)

```json
{
  "scripts": {
    "start": "npx tsx ./scribepod/scribepod.ts",
    "start-reason-dev": "nodemon --watch 'reason/**' --ext 'ts,json' --exec npm run start-reason",
    "start-reason": "npx tsx ./reason/server.ts",
    "start-whisper": "cd agent/whisper && python app.py",
    "start-frontend": "cd agent/ear && npm start",
    "dev": "concurrently \"npm run start-reason-dev\" \"npm run start-whisper\" \"npm run start-frontend\""
  }
}
```

Install concurrently for parallel execution:
```bash
npm install --save-dev concurrently
```

---

### PHASE 1 VERIFICATION CHECKLIST

Run through this checklist before proceeding to Phase 2:

#### Environment Configuration
- [ ] `.env` file created with all variables
- [ ] `.env` added to `.gitignore`
- [ ] `dotenv` loaded in all entry points
- [ ] No hardcoded URLs in codebase (search for "localhost", "0.0.0.0", "http://")
- [ ] Environment variables accessible from code

Test:
```bash
grep -r "http://localhost" --exclude-dir=node_modules --exclude-dir=venv .
# Should return no results (except in docs)
```

#### CORS Security
- [ ] CORS restricted to allowed origins
- [ ] Credentials enabled
- [ ] Proper headers configured
- [ ] Test with wrong origin fails
- [ ] Test with correct origin succeeds

Test:
```bash
# Should fail
curl -H "Origin: http://evil.com" http://localhost:4200/health

# Should succeed
curl -H "Origin: http://localhost:3000" http://localhost:4200/health
```

#### Session Management
- [ ] Global conversation replaced with Map
- [ ] Session cleanup runs every 10 minutes
- [ ] Frontend sends session ID
- [ ] Server returns session ID
- [ ] Multiple concurrent users work correctly

Test:
```bash
# Check session stats
curl http://localhost:4200/sessions/stats
# Start 2 different sessions, verify both appear in stats
```

#### Python Improvements
- [ ] CUDA availability checked
- [ ] Models load with error handling
- [ ] Logging configured properly
- [ ] Startup logs show device (cuda/cpu)
- [ ] Server starts within 60 seconds

Test:
```bash
cd agent/whisper && python app.py
# Watch logs for:
# - "Loading models on device: cuda"
# - "✓ All models loaded and ready!"
# - "Starting Flask server..."
```

#### Temp File Cleanup
- [ ] Context manager implemented
- [ ] Temp files cleaned automatically
- [ ] Cleanup works even on errors
- [ ] No temp file accumulation

Test:
```bash
# Run cleanup test script from Step 1.5
# Verify temp dir count doesn't grow
```

#### Health Checks
- [ ] `/health` endpoint returns 200 OK
- [ ] `/ready` endpoint checks dependencies
- [ ] Health shows correct uptime
- [ ] Health shows CUDA status
- [ ] Health shows models loaded status

Test:
```bash
curl http://localhost:4200/health | jq '.'
curl http://localhost:5000/health | jq '.'
curl http://localhost:4200/ready | jq '.'
curl http://localhost:5000/ready | jq '.'
```

#### Requirements
- [ ] `requirements.txt` created
- [ ] All dependencies listed
- [ ] Correct PyTorch version for system
- [ ] Virtual environment works
- [ ] Can reproduce environment from requirements.txt

Test:
```bash
cd agent/whisper
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "import whisper, transformers; print('✓ Works')"
```

#### Integration Test
- [ ] All services start successfully
- [ ] Frontend can reach Reason server
- [ ] Reason can reach Whisper server
- [ ] Audio upload → transcription works
- [ ] Thought generation works
- [ ] Sessions persist across requests

Test:
```bash
# Start all services
npm run dev

# Open browser to http://localhost:3000
# Allow microphone access
# Speak into microphone
# Verify transcription appears
# Verify cognitive state updates
```

---

### PHASE 1 COMPLETION

Once all verification steps pass:

```bash
# Commit Phase 1
git add .
git commit -m "feat(phase-1): implement security and stability improvements

- Add environment variable configuration
- Implement CORS security
- Add per-user session management
- Fix Python model loading
- Implement temp file cleanup
- Add health check endpoints
- Create requirements.txt

All Phase 1 verification tests passing."

# Merge to main
git checkout main
git merge phase-1-security
git push
```

🎉 **Phase 1 Complete!** System is now secure enough for limited production deployment.

---

## 🟠 PHASE 2: ERROR HANDLING & RELIABILITY
**Duration:** 2-3 weeks (60 hours)
**Priority:** HIGH - Required for reliable operation

### What You'll Build
- Request validation middleware
- Rate limiting
- Retry logic with exponential backoff
- Structured logging (Winston)
- Frontend error boundaries
- Timeout configuration
- Error tracking

### Success Criteria
- [ ] System recovers from 95% of errors automatically
- [ ] No silent failures
- [ ] All errors logged with context
- [ ] Rate limiting blocks abuse
- [ ] Timeouts prevent hanging requests
- [ ] User sees helpful error messages

---

### STEP 2.1: Install Dependencies (30 minutes)

```bash
# Node.js packages
npm install winston express-rate-limit express-validator

# Python packages
cd agent/whisper
pip install flask-limiter tenacity python-json-logger
pip freeze > requirements.txt
```

---

### STEP 2.2: Structured Logging (4 hours)

**New File: `lib/logger.ts`**
```typescript
import winston from 'winston';
import path from 'path';

const logDir = 'logs';

// Ensure log directory exists
import fs from 'fs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'scribepod-reason' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Console output in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

**Update reason/server.ts** (Replace console.log)
```typescript
import logger from '../lib/logger';

// Replace all console.log calls
// BEFORE: console.log('hi');
// AFTER: logger.info('Silence detection event received');

// Example usage throughout server.ts:
app.post('/conversation', upload.any(), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { chunk } = req.query;

  logger.info('Processing conversation request', {
    chunk,
    sessionId: req.headers['x-session-id'],
    fileSize: req.files?.[0]?.size
  });

  try {
    // ... existing logic

    const duration = Date.now() - startTime;
    logger.info('Conversation request completed', {
      sessionId,
      duration,
      chunkNumber: chunkInt
    });

    res.json({ sessionId, transcriptionResponse, conversationState });
  } catch (error: any) {
    logger.error('Conversation request failed', {
      error: error.message,
      stack: error.stack,
      sessionId: req.headers['x-session-id'],
      duration: Date.now() - startTime
    });
    throw error;
  }
}));
```

**New File: `agent/whisper/lib/logger.py`**
```python
import logging
import os
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record):
        log_obj = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'service': 'scribepod-whisper',
            'message': record.getMessage(),
        }

        if hasattr(record, 'extra'):
            log_obj.update(record.extra)

        if record.exc_info:
            log_obj['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_obj)

def setup_logger(name='scribepod'):
    """Setup logger with file and console handlers"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Create logs directory
    os.makedirs('logs', exist_ok=True)

    # File handler (JSON format)
    fh = logging.FileHandler('logs/whisper.log')
    fh.setFormatter(JsonFormatter())
    logger.addHandler(fh)

    # Console handler (simple format for development)
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(ch)

    return logger

logger = setup_logger()
```

**Update agent/whisper/app.py** (Replace print statements)
```python
from lib.logger import logger
import time

# Replace all print() calls with logger calls

@app.route('/transcribe', methods=['POST'])
def transcribe():
    start_time = time.time()
    request_id = str(uuid.uuid4())

    logger.info('Transcription request received', extra={
        'request_id': request_id,
        'remote_addr': request.remote_addr
    })

    try:
        with temp_audio_file() as save_path:
            # ... existing logic

            duration = time.time() - start_time
            logger.info('Transcription completed', extra={
                'request_id': request_id,
                'duration': duration,
                'text_length': len(result['text']),
                'words': len(result['text'].split())
            })

            return result['text']

    except Exception as e:
        duration = time.time() - start_time
        logger.error('Transcription failed', extra={
            'request_id': request_id,
            'duration': duration,
            'error': str(e)
        }, exc_info=True)
        raise
```

---

### STEP 2.3: Request Validation (4 hours)

**New File: `middleware/validation.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export interface ValidationError {
  field: string;
  message: string;
}

export class RequestValidationError extends Error {
  constructor(public errors: ValidationError[]) {
    super('Request validation failed');
    this.name = 'RequestValidationError';
  }
}

export const validateAudioUpload = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];

  // Check file exists
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    errors.push({ field: 'audio_data', message: 'No audio file provided' });
  } else {
    const file = req.files[0];

    // Check file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      errors.push({
        field: 'audio_data',
        message: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`
      });
    }

    // Check file type
    const allowedTypes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push({
        field: 'audio_data',
        message: `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`
      });
    }
  }

  // Check chunk parameter
  const chunk = req.query.chunk;
  if (!chunk) {
    errors.push({ field: 'chunk', message: 'Chunk parameter is required' });
  } else {
    const chunkNum = parseInt(chunk as string);
    if (isNaN(chunkNum) || chunkNum < 1) {
      errors.push({
        field: 'chunk',
        message: 'Chunk must be a positive integer'
      });
    }
  }

  if (errors.length > 0) {
    logger.warn('Request validation failed', { errors });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const validateSessionId = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'];

  if (sessionId) {
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId as string)) {
      logger.warn('Invalid session ID format', { sessionId });
      return res.status(400).json({
        error: 'Invalid session ID format'
      });
    }
  }

  next();
};
```

**Update reason/server.ts** (Apply validation)
```typescript
import { validateAudioUpload, validateSessionId } from '../middleware/validation';

app.post('/conversation',
  upload.any(),
  validateSessionId,
  validateAudioUpload,
  asyncHandler(async (req, res) => {
    // Now we're guaranteed to have valid inputs
    // ... existing logic
  })
);
```

**Add Python Validation** (agent/whisper/app.py)
```python
from functools import wraps
from flask import request, jsonify

def validate_audio_file(f):
    """Decorator to validate audio file uploads"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'audio_data' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        file = request.files['audio_data']

        # Check file size (max 10MB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)  # Reset

        MAX_SIZE = 10 * 1024 * 1024
        if file_size > MAX_SIZE:
            return jsonify({
                'error': 'File too large',
                'max_size': f'{MAX_SIZE / 1024 / 1024}MB',
                'actual_size': f'{file_size / 1024 / 1024:.2f}MB'
            }), 413

        # Check content type
        allowed_types = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/mpeg', 'audio/webm']
        content_type = file.content_type

        if content_type not in allowed_types:
            return jsonify({
                'error': 'Invalid file type',
                'allowed': allowed_types,
                'received': content_type
            }), 415

        return f(*args, **kwargs)
    return wrapper

def validate_json_schema(schema):
    """Decorator to validate JSON request body"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            data = request.get_json()

            if not data:
                return jsonify({'error': 'Invalid JSON'}), 400

            for field, field_type in schema.items():
                if field not in data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400

                if not isinstance(data[field], field_type):
                    return jsonify({
                        'error': f'Invalid type for {field}',
                        'expected': field_type.__name__,
                        'received': type(data[field]).__name__
                    }), 400

                if field_type == list and len(data[field]) == 0:
                    return jsonify({'error': f'{field} cannot be empty'}), 400

            return f(*args, **kwargs)
        return wrapper
    return decorator

# Apply validation
@app.route('/transcribe', methods=['POST'])
@validate_audio_file
def transcribe():
    # Now guaranteed to have valid audio file
    # ... existing logic

@app.route('/generate_thots', methods=['POST'])
@validate_json_schema({'conversation_speech': list})
def generate_thots():
    # Now guaranteed to have valid JSON
    # ... existing logic
```

---

### STEP 2.4: Rate Limiting (3 hours)

**Update reason/server.ts**
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Strict limiter for expensive operations
const conversationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (1 per second)
  keyGenerator: (req) => {
    // Rate limit by session ID if available, otherwise IP
    return req.headers['x-session-id'] as string || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ready';
  }
});

// Apply rate limiters
app.use('/conversation', conversationLimiter);
app.use('/silence_detect', apiLimiter);
```

**Update agent/whisper/app.py**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",  # Use Redis in production
    headers_enabled=True
)

# Apply rate limiting to endpoints
@app.route('/transcribe', methods=['POST'])
@limiter.limit("60 per minute")
@validate_audio_file
def transcribe():
    # ... existing logic

@app.route('/generate_thots', methods=['POST'])
@limiter.limit("100 per minute")
@validate_json_schema({'conversation_speech': list})
def generate_thots():
    # ... existing logic

# Health checks shouldn't be rate limited
@app.route('/health', methods=['GET'])
@limiter.exempt
def health():
    # ... existing logic
```

---

### STEP 2.5: Retry Logic & Timeouts (6 hours)

**New File: `lib/retry.ts`**
```typescript
import logger from './logger';

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
  timeout?: number;
  retryableErrors?: string[];
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  timeout: 30000,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'],
  retryableStatuses: [500, 502, 503, 504]
};

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError?: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Apply timeout if specified
      if (opts.timeout) {
        return await Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), opts.timeout)
          )
        ]);
      } else {
        return await fn();
      }
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const isRetryableError =
        opts.retryableErrors?.includes(error.code) ||
        opts.retryableStatuses?.includes(error.response?.status);

      if (!isRetryableError || attempt === opts.maxRetries) {
        logger.error('Operation failed after retries', {
          attempts: attempt + 1,
          error: error.message
        });
        throw new RetryError(
          `Operation failed after ${attempt + 1} attempts`,
          attempt + 1,
          lastError
        );
      }

      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt);
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
        error: error.message,
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        delay
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

**Update reason/localInference.ts**
```typescript
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { retryWithBackoff } from '../lib/retry';
import logger from '../lib/logger';

const WHISPER_BASE_URL = `http://${process.env.WHISPER_SERVER_HOST}:${process.env.WHISPER_SERVER_PORT}`;

export class TranscriptionError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export const postAudioData = async (file: any): Promise<string> => {
  return retryWithBackoff(async () => {
    const form = new FormData();
    form.append('audio_data', file.buffer, {
      filename: 'recording.wav',
      contentType: 'audio/wav',
      knownLength: file.size
    });

    try {
      const response = await axios.post(`${WHISPER_BASE_URL}/transcribe`, form, {
        headers: form.getHeaders(),
        timeout: 60000  // 60 second timeout for transcription
      });

      return response.data;
    } catch (error: any) {
      // Log and re-throw with context
      logger.error('Transcription request failed', {
        error: error.message,
        status: error.response?.status
      });

      if (error.code === 'ETIMEDOUT') {
        throw new TranscriptionError('Transcription service timeout', 504, error);
      } else if (error.response?.status === 503) {
        throw new TranscriptionError('Transcription service unavailable', 503, error);
      } else if (error.response?.status === 429) {
        throw new TranscriptionError('Rate limit exceeded', 429, error);
      } else {
        throw new TranscriptionError('Transcription failed', error.response?.status, error);
      }
    }
  }, {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    timeout: 60000
  });
};

export const generateThoughts = async (conversation: string[]): Promise<Thots> => {
  return retryWithBackoff(async () => {
    const with_person_prepended = conversation.map((sentence) => 'person: ' + sentence);

    try {
      const response = await axios.post(`${WHISPER_BASE_URL}/generate_thots`, {
        conversation_speech: with_person_prepended
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000  // 45 second timeout for thought generation
      });

      return response.data;
    } catch (error: any) {
      logger.error('Thought generation failed', {
        error: error.message,
        conversationLength: conversation.length
      });

      throw new Error(`Thought generation failed: ${error.message}`);
    }
  }, {
    maxRetries: 2,
    delayMs: 1500,
    backoffMultiplier: 2
  });
};
```

**Update agent/ear/src/index.tsx** (Add timeout)
```typescript
const postAudioDataToReason = async (blob: Blob, chunkNumber: number): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");

  if (sessionId) {
    myHeaders.append("X-Session-Id", sessionId);
  }

  const formData = new FormData();
  formData.append("audio_data", blob, 'temp_recording');

  try {
    const response = await fetch(`${REASON_BASE_URL}/conversation?chunk=${chunkNumber}`, {
      method: "POST",
      body: formData,
      headers: myHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      const data = await response.json();

      if (data.sessionId) {
        sessionId = data.sessionId;
      }

      return {
        transcriptionResponse: data.transcriptionResponse,
        conversationState: data.conversationState
      };
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please slow down.');
    } else {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 30 seconds');
    }
    throw error;
  }
}
```

---

### STEP 2.6: Frontend Error Handling (6 hours)

**Update agent/ear/src/index.tsx** (Add error display)
```typescript
// Add error state
let lastError: string | null = null;
const errorElement: any = document.querySelector('.error-message');

const displayError = (message: string) => {
  lastError = message;
  if (errorElement) {
    errorElement.innerHTML = `❌ Error: ${message}`;
    errorElement.style.display = 'block';
  }
  console.error('Error:', message);

  // Clear error after 10 seconds
  setTimeout(() => {
    if (errorElement && lastError === message) {
      errorElement.style.display = 'none';
    }
  }, 10000);
};

const clearError = () => {
  lastError = null;
  if (errorElement) {
    errorElement.style.display = 'none';
  }
};

// Update ondataavailable with error handling
mediaRecorder.ondataavailable = async (e) => {
  const currentBlob = e.data;
  chunks.push(currentBlob);

  if (currentBlob.size > 5000 && !isProcessing) {
    const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });

    isProcessing = true;
    try {
      const response = await postAudioDataToReason(blob, chunks.length);
      const transcribedText = response.transcriptionResponse;

      clearError();  // Clear any previous errors
      updateResponse('>' + JSON.stringify(response.conversationState, null, 2));

      if (chunks.length >= FLUSH) {
        chunks = [];
        transcribedTextState[transcribedTextState.length - 1] = transcribedText;
        transcribedTextState.push('');
      } else {
        transcribedTextState[transcribedTextState.length - 1] = transcribedText;
      }

      updateTranscription(transcribedTextState);
    } catch (error: any) {
      console.error('Audio processing failed:', error);

      // Display user-friendly error message
      if (error.message.includes('timeout')) {
        displayError('Server is taking too long to respond. Please try again.');
      } else if (error.message.includes('Rate limit')) {
        displayError('You\'re sending too many requests. Please wait a moment.');
      } else if (error.message.includes('Network')) {
        displayError('Network error. Please check your connection.');
      } else {
        displayError('Failed to process audio. Please try again.');
      }
    } finally {
      isProcessing = false;
    }
  }
}
```

**Update agent/ear/public/index.html** (Add error display)
```html
<div class="error-message" style="display: none; color: red; background: #ffebee; padding: 10px; margin: 10px 0; border-radius: 4px;">
</div>
```

---

### STEP 2.7: Centralized Error Handler (3 hours)

**New File: `middleware/errorHandler.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import { RequestValidationError } from './validation';
import { TranscriptionError } from '../reason/localInference';

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  retryable?: boolean;
  timestamp: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const timestamp = new Date().toISOString();

  // Log error with context
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    sessionId: req.headers['x-session-id'],
    timestamp
  });

  // Handle specific error types
  if (error instanceof RequestValidationError) {
    const response: ErrorResponse = {
      error: 'Validation failed',
      details: error.errors,
      retryable: false,
      timestamp
    };
    return res.status(400).json(response);
  }

  if (error instanceof TranscriptionError) {
    const response: ErrorResponse = {
      error: 'Transcription failed',
      message: error.message,
      retryable: error.statusCode === 503 || error.statusCode === 504,
      timestamp
    };
    return res.status(error.statusCode || 500).json(response);
  }

  // Default error response
  const response: ErrorResponse = {
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    retryable: false,
    timestamp
  };

  res.status(500).json(response);
};

// Apply to Express app (in server.ts, after all routes)
// app.use(errorHandler);
```

**Update reason/server.ts** (Add error handler)
```typescript
import { errorHandler } from '../middleware/errorHandler';

// ... all route definitions

// Error handler must be last
app.use(errorHandler);
```

---

### PHASE 2 VERIFICATION CHECKLIST

#### Logging
- [ ] Winston configured and working
- [ ] Python JSON logging working
- [ ] Logs written to files
- [ ] Logs include context (sessionId, duration, etc.)
- [ ] No `console.log` or `print()` statements remain

Test:
```bash
# Make some requests
curl -X POST http://localhost:4200/conversation -F "audio_data=@test.wav"

# Check logs created
ls -lh logs/
cat logs/combined.log | jq '.'
cat logs/whisper.log | jq '.'
```

#### Validation
- [ ] Invalid requests rejected with 400
- [ ] Large files rejected with 413
- [ ] Wrong content type rejected with 415
- [ ] Missing fields detected
- [ ] Helpful error messages returned

Test:
```bash
# No file
curl -X POST http://localhost:5000/transcribe
# Expected: 400 with error message

# Wrong content type
curl -X POST http://localhost:5000/transcribe -F "audio_data=@test.txt"
# Expected: 415 with error message
```

#### Rate Limiting
- [ ] Rate limiter blocks excessive requests
- [ ] Returns 429 status code
- [ ] Includes Retry-After header
- [ ] Per-session rate limiting works
- [ ] Health checks not rate limited

Test:
```bash
# Send 100 requests quickly
for i in {1..100}; do
  curl -X POST http://localhost:4200/conversation \
    -F "audio_data=@test.wav" &
done
wait

# Next request should be rate limited
curl -X POST http://localhost:4200/conversation -F "audio_data=@test.wav"
# Expected: 429 Too Many Requests
```

#### Retry Logic
- [ ] Network errors trigger retries
- [ ] Exponential backoff working
- [ ] Max retries respected
- [ ] Non-retryable errors fail immediately
- [ ] Logs show retry attempts

Test:
```bash
# Stop Whisper server
# Make request to Reason server
curl -X POST http://localhost:4200/conversation -F "audio_data=@test.wav"
# Check logs for retry attempts
# Should see "Attempt 1 failed, retrying..." messages
```

#### Timeouts
- [ ] Requests timeout after configured duration
- [ ] Frontend shows timeout error
- [ ] Backend logs timeout
- [ ] Resources cleaned up on timeout

Test:
```bash
# This test requires modifying code temporarily to add a delay
# Or using a tool like toxiproxy to simulate slow network
```

#### Error Handling
- [ ] All errors logged with context
- [ ] User sees helpful error messages
- [ ] Error handler catches all errors
- [ ] Stack traces not exposed to users (production)
- [ ] Errors include retry guidance

Test:
```bash
# Trigger various errors and verify handling
# 1. Invalid input
# 2. Service unavailable
# 3. Rate limit exceeded
# 4. Timeout
# 5. Internal server error
```

---

### PHASE 2 COMPLETION

```bash
git add .
git commit -m "feat(phase-2): implement error handling and reliability

- Add structured logging with Winston
- Implement request validation
- Add rate limiting
- Implement retry logic with exponential backoff
- Add timeout configuration
- Add centralized error handler
- Improve user-facing error messages

All Phase 2 verification tests passing."

git checkout main
git merge phase-2-reliability
git push
```

🎉 **Phase 2 Complete!** System now handles errors gracefully and is reliable.

---

## 🟡 PHASE 3: CODE QUALITY & MAINTAINABILITY
**Duration:** 2 weeks (40 hours)

### Overview
- Remove duplicate code
- Add TypeScript strict mode
- Implement unit & integration tests
- Add pre-commit hooks
- Code formatting & linting
- API documentation

### Quick Implementation Summary

**Key Files to Create:**
- `__tests__/` directories for tests
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.husky/` - Git hooks
- `jest.config.js` - Jest configuration

**Major Changes:**
1. Delete duplicate functions in `app.py` (lines 57-89)
2. Enable TypeScript strict mode
3. Add 70%+ test coverage
4. Setup pre-commit hooks

**Detailed instructions:** See separate Phase 3 document or Quick Start guide.

---

## 🟠 PHASE 4: SCALABILITY & PERFORMANCE
**Duration:** 3-4 weeks (80 hours)

### Overview
- Docker Compose setup
- Response caching (Redis)
- WebRTC streaming migration
- Load balancing (Nginx)
- Database integration (PostgreSQL)
- Horizontal scaling

### Quick Implementation Summary

**Key Additions:**
- `docker-compose.yml` - Container orchestration
- `Dockerfile` for each service
- `.dockerignore` files
- Redis for caching
- PostgreSQL for persistence
- Nginx configuration

**Performance Improvements:**
- Current latency: 2.5s → Target: 400ms (6x faster)
- Current capacity: 10 users → Target: 100+ users
- Add response caching (60% hit rate)

**Detailed instructions:** See separate Phase 4 document.

---

## 🟢 PHASE 5: PRODUCTION DEPLOYMENT
**Duration:** 1-2 weeks (40 hours)

### Overview
- CI/CD pipeline (GitHub Actions)
- Error tracking (Sentry)
- Metrics (Prometheus + Grafana)
- Cloud deployment (AWS/GCP/Azure)
- SSL/TLS configuration
- Backup & disaster recovery

### Quick Implementation Summary

**Key Additions:**
- `.github/workflows/ci.yml` - CI/CD pipeline
- `kubernetes/` or `terraform/` - Infrastructure as Code
- Sentry integration
- Prometheus exporters
- Grafana dashboards
- Backup scripts

**Production Checklist:**
- [ ] Automated deployment working
- [ ] Monitoring and alerting configured
- [ ] Backups running daily
- [ ] SSL/TLS A+ rating
- [ ] 99.9% uptime SLA

**Detailed instructions:** See separate Phase 5 document.

---

## 🎯 FINAL CHECKLIST

Before calling the project "production-ready":

### Security ✅
- [ ] All CRITICAL vulnerabilities fixed
- [ ] All HIGH vulnerabilities fixed
- [ ] OWASP top 10 addressed
- [ ] Penetration testing passed
- [ ] Security audit completed

### Reliability ✅
- [ ] 99.9% uptime over 30 days
- [ ] Error rate <1%
- [ ] Auto-recovery from failures
- [ ] Circuit breakers implemented
- [ ] Graceful degradation working

### Performance ✅
- [ ] Latency <500ms (p95)
- [ ] Throughput >100 req/sec
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Memory leaks fixed
- [ ] CPU usage optimized

### Quality ✅
- [ ] Test coverage ≥70%
- [ ] All tests passing
- [ ] TypeScript strict mode enabled
- [ ] Zero linting errors
- [ ] Code reviewed

### Operations ✅
- [ ] Automated deployment
- [ ] Monitoring dashboards
- [ ] Alerting configured
- [ ] Runbooks documented
- [ ] On-call rotation established

### Documentation ✅
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Troubleshooting guide written
- [ ] Architecture documented
- [ ] Contributing guidelines created

---

## 📞 GETTING HELP

Stuck on implementation? Check:

1. **Quick Start Guide** - Copy-paste solutions
2. **Verification Sections** - Testing procedures
3. **Error Messages** - Logs in `logs/` directory
4. **Health Endpoints** - `/health` and `/ready`
5. **GitHub Issues** - Check for similar problems

Common issues:
- **Models won't load:** Check CUDA availability
- **Tests failing:** Check environment variables
- **Docker won't start:** Check ports not in use
- **Rate limit too strict:** Adjust in `.env`

---

**Document Status:** COMPLETE
**Last Updated:** October 2025
**Next Steps:** Begin Phase 1 implementation
