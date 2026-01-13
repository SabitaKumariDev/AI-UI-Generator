import time
import os
from typing import Optional
from dotenv import load_dotenv
import logging
from collections import defaultdict

load_dotenv()
logger = logging.getLogger(__name__)

class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    Falls back gracefully if Redis is unavailable.
    """
    
    def __init__(self):
        self.max_requests_per_minute = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "10"))
        self.requests: dict = defaultdict(list)
    
    async def connect(self):
        """Initialize rate limiter"""
        logger.info("Rate limiter initialized (in-memory mode)")
    
    async def close(self):
        """Clean up"""
        self.requests.clear()
        logger.info("Rate limiter closed")
    
    def _clean_old_requests(self, identifier: str, window_seconds: int):
        """Remove requests outside the current window"""
        current_time = time.time()
        window_start = current_time - window_seconds
        self.requests[identifier] = [
            ts for ts in self.requests[identifier] if ts > window_start
        ]
    
    async def check_rate_limit(
        self,
        identifier: str,
        max_requests: Optional[int] = None,
        window_seconds: int = 60
    ) -> tuple[bool, int]:
        """
        Check if request is within rate limit.
        """
        max_requests = max_requests or self.max_requests_per_minute
        current_time = time.time()
        
        # Clean old requests
        self._clean_old_requests(identifier, window_seconds)
        
        request_count = len(self.requests[identifier])
        
        if request_count >= max_requests:
            return False, 0
        
        # Add current request
        self.requests[identifier].append(current_time)
        
        remaining = max_requests - request_count - 1
        return True, remaining
    
    async def check_outbound_rate_limit(self, service: str = "llm") -> bool:
        """
        Check rate limit for outbound API calls.
        """
        is_allowed, _ = await self.check_rate_limit(
            f"outbound:{service}",
            max_requests=5,
            window_seconds=1
        )
        return is_allowed

rate_limiter = RateLimiter()
