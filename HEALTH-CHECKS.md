# SCRIBEPOD - HEALTH CHECK ENDPOINTS

**Created:** October 13, 2025
**Status:** ✅ Health Checks Implemented
**Phase:** Phase 1 - Critical Security & Stability

---

## OVERVIEW

Health check endpoints have been added to both servers to enable monitoring, orchestration, and automated recovery. These endpoints follow industry-standard patterns used by Kubernetes, Docker, AWS ECS, and other container orchestration platforms.

---

## ENDPOINT TYPES

### 1. **Liveness Checks** (`/health`)
- **Purpose:** Verify the server process is running
- **Use Case:** Container orchestration restarts if this fails
- **Response:** Always returns 200 OK if server is alive

### 2. **Readiness Checks** (`/health/ready`)
- **Purpose:** Verify the server is ready to handle requests
- **Use Case:** Load balancers route traffic only when ready
- **Response:** 200 OK if ready, 503 Service Unavailable if not ready

---

## REASON SERVER HEALTH CHECKS

**Base URL:** `http://localhost:4200` (configurable via `REASON_SERVER_PORT`)

### Endpoint: `GET /health`

**Purpose:** Basic liveness check

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "reason-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development"
}
```

**Fields:**
- `status` - Always "ok" if server is running
- `service` - Service identifier
- `timestamp` - ISO 8601 timestamp
- `uptime` - Process uptime in seconds
- `environment` - NODE_ENV value (development/production)

**Example:**
```bash
curl http://localhost:4200/health
```

---

### Endpoint: `GET /health/ready`

**Purpose:** Readiness check - verifies connection to Whisper server

**Response (200 OK - Ready):**
```json
{
  "status": "ok",
  "service": "reason-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "checks": {
    "server": "ok",
    "whisperConnection": "ok"
  }
}
```

**Response (503 Service Unavailable - Not Ready):**
```json
{
  "status": "degraded",
  "service": "reason-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "checks": {
    "server": "ok",
    "whisperConnection": "error"
  },
  "error": "connect ECONNREFUSED 127.0.0.1:5000"
}
```

**Checks Performed:**
1. ✅ Reason server is running
2. ✅ Can connect to Whisper server (`WHISPER_SERVER_HOST:WHISPER_SERVER_PORT`)

**Example:**
```bash
curl http://localhost:4200/health/ready
```

**Return Codes:**
- `200` - Server is ready, all checks passed
- `503` - Server not ready (Whisper server unreachable)

---

## WHISPER SERVER HEALTH CHECKS

**Base URL:** `http://localhost:5000` (configurable via `WHISPER_SERVER_PORT`)

### Endpoint: `GET /health`

**Purpose:** Basic liveness check with system information

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "whisper-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "uptime": 1697107800,
  "environment": "development",
  "python_version": "3.13.7 (tags/v3.13.7:...) [MSC v.1940 64 bit (AMD64)]"
}
```

**Fields:**
- `status` - Always "ok" if server is running
- `service` - Service identifier
- `timestamp` - ISO 8601 timestamp
- `uptime` - Unix timestamp of process start time
- `environment` - FLASK_ENV value (development/production)
- `python_version` - Python version string

**Example:**
```bash
curl http://localhost:5000/health
```

**Note:** This endpoint is exempt from rate limiting

---

### Endpoint: `GET /health/ready`

**Purpose:** Readiness check - verifies AI models are loaded and resources are adequate

**Response (200 OK - Ready):**
```json
{
  "status": "ok",
  "service": "whisper-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "checks": {
    "server": "ok",
    "whisper_model": "ok",
    "text_model": "ok",
    "tokenizer": "ok",
    "memory": "45.2%",
    "memory_status": "ok"
  }
}
```

**Response (503 Service Unavailable - Not Ready - Models Not Loaded):**
```json
{
  "status": "not_ready",
  "service": "whisper-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "checks": {
    "server": "ok",
    "whisper_model": "not_loaded",
    "text_model": "not_loaded",
    "tokenizer": "not_loaded",
    "memory": "32.1%",
    "memory_status": "ok"
  }
}
```

**Response (503 Service Unavailable - Degraded - High Memory):**
```json
{
  "status": "degraded",
  "service": "whisper-server",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "checks": {
    "server": "ok",
    "whisper_model": "ok",
    "text_model": "ok",
    "tokenizer": "ok",
    "memory": "92.5%",
    "memory_status": "critical"
  }
}
```

**Checks Performed:**
1. ✅ Whisper model loaded (`whisper_model`)
2. ✅ Flan-T5 text model loaded (`text_model`)
3. ✅ Tokenizer loaded (`tokenizer`)
4. ✅ Memory usage acceptable (`memory`)

**Memory Thresholds:**
- **0-80%:** `memory_status: "ok"` - Normal
- **80-90%:** `memory_status: "warning"` - High but acceptable
- **>90%:** `memory_status: "critical"` - Returns 503

**Example:**
```bash
curl http://localhost:5000/health/ready
```

**Return Codes:**
- `200` - Server is ready, all models loaded, memory OK
- `503` - Server not ready (models not loaded or memory critical)

**Note:** This endpoint is exempt from rate limiting

---

## TESTING HEALTH CHECKS

### Manual Testing

**Test Reason Server:**
```bash
# Liveness check
curl -v http://localhost:4200/health

# Readiness check (requires Whisper server running)
curl -v http://localhost:4200/health/ready
```

**Test Whisper Server:**
```bash
# Liveness check
curl -v http://localhost:5000/health

# Readiness check (models must be loaded)
curl -v http://localhost:5000/health/ready
```

---

### Automated Testing Script

**File:** `test-health-checks.sh`

**Usage:**
```bash
./test-health-checks.sh
```

**Output:**
```
======================================================================
SCRIBEPOD HEALTH CHECK TESTING
======================================================================

TEST 1: Reason Server - Liveness Check
✓ PASS - Reason server is alive (200 OK)

TEST 2: Whisper Server - Liveness Check
✓ PASS - Whisper server is alive (200 OK)

TEST 3: Reason Server - Readiness Check
✓ PASS - Reason server is ready (200 OK)

TEST 4: Whisper Server - Readiness Check
✓ PASS - Whisper server is ready (200 OK)

======================================================================
SUMMARY
======================================================================
Total Tests: 4
Passed: 4
Failed: 0

✓ ALL HEALTH CHECKS PASSED!
```

---

## INTEGRATION WITH ORCHESTRATION PLATFORMS

### Docker Compose

```yaml
version: '3.8'
services:
  reason-server:
    image: scribepod/reason-server
    ports:
      - "4200:4200"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4200/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  whisper-server:
    image: scribepod/whisper-server
    ports:
      - "5000:5000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s  # Allow time for models to load
```

---

### Kubernetes

**Reason Server:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: reason-server
spec:
  containers:
  - name: reason-server
    image: scribepod/reason-server
    ports:
    - containerPort: 4200
    livenessProbe:
      httpGet:
        path: /health
        port: 4200
      initialDelaySeconds: 10
      periodSeconds: 30
      timeoutSeconds: 5
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 4200
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
```

**Whisper Server:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: whisper-server
spec:
  containers:
  - name: whisper-server
    image: scribepod/whisper-server
    ports:
    - containerPort: 5000
    livenessProbe:
      httpGet:
        path: /health
        port: 5000
      initialDelaySeconds: 10
      periodSeconds: 30
      timeoutSeconds: 5
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 5000
      initialDelaySeconds: 120  # Allow time for models to load
      periodSeconds: 10
      timeoutSeconds: 5
```

---

### AWS ECS Task Definition

```json
{
  "family": "scribepod-whisper",
  "containerDefinitions": [
    {
      "name": "whisper-server",
      "image": "scribepod/whisper-server:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:5000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 120
      }
    }
  ]
}
```

---

## MONITORING & ALERTING

### Prometheus Metrics (Future Enhancement)

The health check endpoints can be scraped by Prometheus for monitoring:

```yaml
scrape_configs:
  - job_name: 'scribepod-reason'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:4200']

  - job_name: 'scribepod-whisper'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:5000']
```

### Alerting Rules

**Example Prometheus Alert:**
```yaml
groups:
  - name: scribepod_health
    rules:
      - alert: WhisperServerDown
        expr: up{job="scribepod-whisper"} == 0
        for: 5m
        annotations:
          summary: "Whisper server is down"
          description: "Whisper server has been down for more than 5 minutes"

      - alert: WhisperServerNotReady
        expr: http_response_code{endpoint="/health/ready"} != 200
        for: 5m
        annotations:
          summary: "Whisper server not ready"
          description: "Whisper server models not loaded or resources insufficient"
```

---

## TROUBLESHOOTING

### Reason Server Returns 503 on Readiness Check

**Possible Causes:**
1. Whisper server is not running
2. Whisper server port misconfigured
3. Network connectivity issue

**Solution:**
```bash
# Check if Whisper server is running
curl http://localhost:5000/health

# Check environment variables
echo $WHISPER_SERVER_HOST
echo $WHISPER_SERVER_PORT

# Test connectivity
telnet localhost 5000
```

---

### Whisper Server Returns 503 on Readiness Check

**Possible Causes:**
1. Models not loaded yet (takes 2-5 minutes on first start)
2. Models failed to load (out of memory)
3. Memory usage critical (>90%)

**Solution:**
```bash
# Check if models are loaded
curl http://localhost:5000/health/ready | jq '.checks'

# Check memory usage
curl http://localhost:5000/health/ready | jq '.checks.memory'

# Check server logs for model loading errors
# Look for "[Whisper Server] Loading AI models..." messages
```

---

### Health Checks Taking Too Long

**Possible Causes:**
1. Reason server readiness check has 5-second timeout for Whisper connection
2. Server under heavy load

**Solution:**
- Adjust timeout in code if needed
- Scale resources (more CPU/RAM)
- Use separate health check endpoints with shorter timeouts

---

## SECURITY CONSIDERATIONS

### Rate Limiting

**Reason Server:**
- Health checks are subject to global rate limiting (60 req/min)
- Consider exempting health checks if orchestration platform requires frequent polling

**Whisper Server:**
- Health checks are **EXEMPT** from rate limiting (`@limiter.exempt`)
- Safe for frequent polling by monitoring systems

### Authentication

**Current State:**
- Health checks are **unauthenticated** (industry standard)
- Accessible to anyone who can reach the server

**Future Enhancement:**
- Add optional authentication for health checks in production
- Use internal-only health check endpoints

---

## BEST PRACTICES

### 1. **Separate Liveness and Readiness**
- Use `/health` for liveness (quick, always succeeds if server is up)
- Use `/health/ready` for readiness (comprehensive, can fail if dependencies unavailable)

### 2. **Appropriate Timeouts**
- Liveness checks: 5-10 seconds
- Readiness checks: 10-30 seconds (longer for AI model loading)

### 3. **Start Period**
- Allow sufficient time for AI models to load before first readiness check
- Recommended: 120 seconds (2 minutes) for Whisper server

### 4. **Frequency**
- Liveness checks: Every 30 seconds
- Readiness checks: Every 10-15 seconds

### 5. **Retries**
- Allow 3-5 retries before marking unhealthy
- Prevents false positives from transient network issues

---

## CHANGELOG

**October 13, 2025:**
- ✅ Added `/health` endpoint to Reason server
- ✅ Added `/health/ready` endpoint to Reason server
- ✅ Added `/health` endpoint to Whisper server
- ✅ Added `/health/ready` endpoint to Whisper server
- ✅ Implemented model loading checks
- ✅ Implemented memory usage monitoring
- ✅ Exempted health checks from rate limiting (Whisper server)
- ✅ Added comprehensive documentation

---

## NEXT STEPS

**Current Status:** Step 7 Complete ✅

**Next: Step 8 - Test All Services**

Testing will verify:
- ✅ Both servers start successfully
- ✅ Health checks return correct status
- ✅ All security fixes work properly
- ✅ Services can communicate
- ✅ Ready for production deployment

---

**Last Updated:** October 13, 2025
**Status:** Health Checks Implemented ✅
**Ready for:** Step 8 (Testing All Services)
