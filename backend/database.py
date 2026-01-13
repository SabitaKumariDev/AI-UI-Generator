from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
generations_collection = db["generations"]
users_collection = db["users"]
prompts_collection = db["prompts"]

async def init_db():
    """Initialize database indexes"""
    await generations_collection.create_index("job_id")
    await generations_collection.create_index("created_at")
    await prompts_collection.create_index("user_id")

async def get_db():
    """Get database reference"""
    return db
