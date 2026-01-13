from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from database import init_db, generations_collection, prompts_collection, users_collection
from services.rate_limiter import rate_limiter
from services.llm_service import llm_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for database and services"""
    logger.info("Initializing database...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    await rate_limiter.connect()
    logger.info("Services started")
    
    yield
    
    await rate_limiter.close()
    logger.info("Services shut down")

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

class GenerateRequest(BaseModel):
    prompt: str

class GenerateResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    generated_code: str | None = None
    explanation: str | None = None
    error_message: str | None = None
    prompt: str | None = None
    created_at: str

class HistoryItem(BaseModel):
    id: str
    prompt: str
    status: str
    generated_code: str | None
    created_at: str

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        logger.error(f"[{request_id}] Request failed: {e}")
        raise

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/api/health":
        return await call_next(request)
    
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, remaining = await rate_limiter.check_rate_limit(client_ip)
    
    if not is_allowed:
        logger.warning(f"Rate limit exceeded for {client_ip}")
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again in a minute.",
                "retry_after": 60
            },
            headers={"Retry-After": "60"}
        )
    
    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response

async def process_generation(job_id: str, prompt: str):
    """Background task to process generation"""
    try:
        logger.info(f"Processing job {job_id}")
        
        # Update status to running
        await generations_collection.update_one(
            {"job_id": job_id},
            {"$set": {"status": "running", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Call LLM
        result = await llm_service.generate_ui_code(prompt, job_id)
        
        # Update with success
        await generations_collection.update_one(
            {"job_id": job_id},
            {"$set": {
                "status": "success",
                "generated_code": result["code"],
                "explanation": result["explanation"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        await generations_collection.update_one(
            {"job_id": job_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

@api_router.get("/")
async def root():
    return {"message": "AI UI Generator API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint with circuit breaker status"""
    llm_health = llm_service.get_health_status()
    return {
        "status": "healthy",
        "services": {
            "llm": llm_health
        }
    }

@api_router.post("/generate", response_model=GenerateResponse)
async def generate_ui(request: Request, body: GenerateRequest, background_tasks: BackgroundTasks):
    """Generate React UI from natural language prompt."""
    request_id = request.state.request_id
    logger.info(f"[{request_id}] Generate request: {body.prompt[:100]}...")
    
    job_id = str(uuid.uuid4())
    
    # Create generation record in MongoDB
    generation_doc = {
        "job_id": job_id,
        "prompt": body.prompt,
        "status": "pending",
        "generated_code": None,
        "explanation": None,
        "error_message": None,
        "user_id": "default_user",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await generations_collection.insert_one(generation_doc)
    
    # Process in background
    background_tasks.add_task(process_generation, job_id, body.prompt)
    
    logger.info(f"[{request_id}] Created job {job_id}")
    
    return GenerateResponse(
        job_id=job_id,
        status="pending",
        message="Generation job started"
    )

@api_router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get status of a generation job."""
    generation = await generations_collection.find_one(
        {"job_id": job_id},
        {"_id": 0}
    )
    
    if not generation:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        job_id=job_id,
        status=generation["status"],
        generated_code=generation.get("generated_code"),
        explanation=generation.get("explanation"),
        error_message=generation.get("error_message"),
        prompt=generation.get("prompt"),
        created_at=generation["created_at"]
    )

@api_router.get("/history")
async def get_history(limit: int = 20):
    """Get generation history for current user."""
    cursor = generations_collection.find(
        {"user_id": "default_user"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    
    history = []
    async for gen in cursor:
        history.append(HistoryItem(
            id=gen["job_id"],
            prompt=gen.get("prompt", ""),
            status=gen["status"],
            generated_code=gen.get("generated_code"),
            created_at=gen["created_at"]
        ))
    
    return {"history": history}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
