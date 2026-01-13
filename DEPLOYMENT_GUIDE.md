# Deployment Guide - AI UI Generator

## Prerequisites

Before deploying, ensure you have:
- ✅ OpenAI API Key from https://platform.openai.com/api-keys
- ✅ PostgreSQL database (local or cloud)
- ✅ Redis instance (local or cloud)
- ✅ Node.js 18+ and Python 3.11+

## Step 1: Configure Environment Variables

### Backend (.env)

Create `/app/backend/.env` with:

```bash
# Database
POSTGRES_URL=postgresql://username:password@host:5432/database_name
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=10

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60

# CORS (adjust for production)
CORS_ORIGINS=https://yourdomain.com
```

### Frontend (.env)

Create `/app/frontend/.env` with:

```bash
REACT_APP_BACKEND_URL=https://api.yourdomain.com
WDS_SOCKET_PORT=443
```

## Step 2: Install Dependencies

```bash
# Backend
cd /app/backend
pip install -r requirements.txt

# Frontend
cd /app/frontend
yarn install
```

## Step 3: Initialize Database

```bash
# The database tables will be created automatically on first run
# Make sure PostgreSQL is running and accessible
```

## Step 4: Start Services

### Local Development

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start PostgreSQL (if not running)
sudo service postgresql start

# Terminal 3: Start Backend
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 4: Start Worker
cd /app/backend
python worker.py

# Terminal 5: Start Frontend
cd /app/frontend
yarn start
```

### Production with Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: v0_clone
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    
  backend:
    build: ./backend
    environment:
      POSTGRES_URL: postgresql://postgres:your_secure_password@postgres:5432/v0_clone
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    ports:
      - "8001:8001"
  
  worker:
    build: ./backend
    command: python worker.py
    environment:
      POSTGRES_URL: postgresql://postgres:your_secure_password@postgres:5432/v0_clone
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
  
  frontend:
    build: ./frontend
    environment:
      REACT_APP_BACKEND_URL: https://api.yourdomain.com
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

Run with:
```bash
export OPENAI_API_KEY=sk-proj-xxxxx
docker-compose up -d
```

## Step 5: Deploy to Cloud Platforms

### Vercel (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `REACT_APP_BACKEND_URL=https://api.yourdomain.com`
4. Deploy

### Railway/Render (Backend)

1. Push code to GitHub
2. Create new web service
3. Set environment variables (all from backend .env)
4. Deploy backend and worker as separate services

### AWS/GCP/Azure

Use the provided docker-compose.yml as a starting point and adapt for:
- ECS/EKS (AWS)
- Cloud Run (GCP)
- Container Instances (Azure)

## Step 6: Set Up Domain & SSL

1. Point your domain to the deployment
2. Configure SSL certificate (Let's Encrypt or cloud provider)
3. Update CORS_ORIGINS in backend .env
4. Update REACT_APP_BACKEND_URL in frontend .env

## Step 7: Monitoring & Logs

### Health Check Endpoint

```bash
curl https://api.yourdomain.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "llm": {
      "service": "llm",
      "circuit_breaker": {
        "state": "closed"
      },
      "api_key_configured": true
    }
  }
}
```

### View Logs

```bash
# Backend
tail -f /var/log/app/backend.log

# Worker
tail -f /var/log/app/worker.log
```

## Troubleshooting

### API Key Issues

If you see "OpenAI API key not configured":
1. Verify OPENAI_API_KEY is set in backend/.env
2. Restart backend service
3. Check logs for errors

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $POSTGRES_URL

# Check if tables exist
\dt
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli -u $REDIS_URL ping
```

### Worker Not Processing Jobs

```bash
# Check worker process
ps aux | grep worker.py

# Restart worker
pkill -f worker.py
python /app/backend/worker.py &
```

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Set strong CORS_ORIGINS (not *)
- [ ] Use HTTPS in production
- [ ] Rotate OpenAI API key periodically
- [ ] Set up rate limiting at infrastructure level
- [ ] Enable database backups
- [ ] Use environment variables for all secrets
- [ ] Set up monitoring and alerting

## Cost Optimization

### OpenAI Usage

- Default model: gpt-4o (~$5 per 1M input tokens)
- Consider gpt-4o-mini for lower cost (~$0.15 per 1M tokens)
- Set MAX_REQUESTS_PER_MINUTE to control usage
- Monitor usage at https://platform.openai.com/usage

### Infrastructure

- Use serverless functions where possible
- Auto-scale based on traffic
- Use Redis caching aggressively
- Consider CDN for frontend

## Support

For issues or questions:
1. Check logs first
2. Review troubleshooting section
3. Test with health check endpoint
4. Verify all environment variables are set

---

**Built by You** 🚀
