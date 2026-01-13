# AI UI Generator

A full-stack application that transforms natural language prompts into production-ready React + Tailwind CSS components using OpenAI's GPT-4o.

![AI UI Generator](https://img.shields.io/badge/AI-UI%20Generator-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991)

## Features

- 🎨 **Natural Language to UI** - Describe your component in plain English
- ⚡ **Live Preview** - See your generated component render in real-time
- 📝 **Code Viewer** - View and copy the generated React code
- 🔄 **Generation History** - Access your previous generations
- 🛡️ **Fault Tolerant** - Circuit breaker pattern with retry logic
- 🚦 **Rate Limiting** - Built-in request rate limiting

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  FastAPI Server │────▶│   OpenAI API    │
│   (Port 3000)   │     │   (Port 8001)   │     │    (GPT-4o)     │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │    MongoDB      │
                        │   (Storage)     │
                        │                 │
                        └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| AI | OpenAI GPT-4o |

## Project Structure

```
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── database.py            # MongoDB connection
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── services/
│       ├── llm_service.py     # OpenAI integration
│       ├── circuit_breaker.py # Fault tolerance
│       └── rate_limiter.py    # Rate limiting
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── PromptForm.jsx    # Input form
│   │   │   ├── CodeViewer.jsx    # Code display
│   │   │   ├── LivePreview.jsx   # Component preview
│   │   │   └── Header.jsx
│   │   └── pages/
│   │       ├── GeneratorPage.jsx
│   │       └── HistoryPage.jsx
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API Key

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Clone-V0_AI-Agent-Fix_V1
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_ui_generator
CORS_ORIGINS=*
MAX_REQUESTS_PER_MINUTE=10
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60
```

### 4. Start MongoDB

```bash
# If using Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally and start the service
```

### 5. Start Backend Server

```bash
cd backend
python server.py
```

Server runs at: `http://localhost:8001`

### 6. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install
# or
npm install
```

### 7. Configure Frontend Environment

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 8. Start Frontend

```bash
yarn start
# or
npm start
```

App runs at: `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate UI from prompt |
| `GET` | `/api/jobs/{job_id}` | Get generation status |
| `GET` | `/api/history` | Get generation history |
| `GET` | `/api/health` | Health check |

### Example API Usage

```bash
# Generate UI
curl -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A modern pricing card with 3 tiers"}'

# Response:
# {"job_id": "abc-123", "status": "pending", "message": "Generation job started"}

# Check status
curl http://localhost:8001/api/jobs/abc-123
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `ai_ui_generator` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `MAX_REQUESTS_PER_MINUTE` | Rate limit | `10` |
| `CIRCUIT_BREAKER_THRESHOLD` | Failures before circuit opens | `5` |
| `CIRCUIT_BREAKER_TIMEOUT` | Circuit breaker reset time (seconds) | `60` |

## Fault Tolerance

### Circuit Breaker
The app implements a circuit breaker pattern to prevent cascading failures:
- **Closed**: Normal operation
- **Open**: After 5 consecutive failures, requests are rejected for 60 seconds
- **Half-Open**: After timeout, allows one test request

### Rate Limiting
- **Per-user limit**: 10 requests per minute
- **Prevents API abuse** and controls costs

## Troubleshooting

### Port Already in Use
```bash
# Windows - Find and kill process on port 8001
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Or change port in server.py
uvicorn.run(app, host="0.0.0.0", port=8002)
```

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check `MONGO_URL` in `.env`
- For MongoDB Atlas, whitelist your IP

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is correct
- Check your OpenAI account has credits
- Ensure API key has proper permissions

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
