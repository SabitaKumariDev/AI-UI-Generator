import os
import logging
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from dotenv import load_dotenv
from .circuit_breaker import llm_circuit_breaker

load_dotenv()
logger = logging.getLogger(__name__)

class LLMServiceError(Exception):
    """Base exception for LLM service errors"""
    pass

class CircuitBreakerOpenError(LLMServiceError):
    """Raised when circuit breaker is open"""
    pass

class RateLimitError(LLMServiceError):
    """Raised when rate limit is exceeded"""
    pass

class LLMService:
    """
    Fault-tolerant LLM service with:
    - Retry logic with exponential backoff
    - Circuit breaker pattern
    - Secure API key handling
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("No OPENAI_API_KEY found, LLM service will not work")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "gpt-4o"
    
    def _create_system_prompt(self) -> str:
        """Create system prompt for UI code generation"""
        return """You are an expert React and Tailwind CSS developer. Generate clean, production-ready React components.

Rules:
1. Use functional components with hooks
2. Use Tailwind CSS for all styling
3. Include ONLY React imports (import React from "react")
4. Make components responsive
5. DO NOT use PropTypes or any external validation libraries
6. Code should be copy-paste ready
7. Return ONLY the React component code, no markdown code blocks
8. Use modern React patterns
9. Include necessary state management with useState/useEffect if needed
10. Make the UI visually appealing with proper spacing and colors
11. DO NOT include TypeScript types or interfaces
12. Keep components simple and self-contained
13. DO NOT wrap code in markdown (no ```jsx or ``` blocks)"""
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(LLMServiceError),
        reraise=True
    )
    async def generate_ui_code(self, prompt: str, request_id: str) -> dict:
        """
        Generate React UI code from natural language prompt.
        """
        logger.info(f"[{request_id}] Generating UI code for prompt")
        
        # Check circuit breaker
        if not llm_circuit_breaker.can_execute():
            logger.error(f"[{request_id}] Circuit breaker is OPEN, rejecting request")
            raise CircuitBreakerOpenError(
                "LLM service is temporarily unavailable. Please try again later."
            )
        
        try:
            if not self.client:
                raise LLMServiceError("OpenAI API key not configured")
            
            logger.info(f"[{request_id}] Calling OpenAI API")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._create_system_prompt()},
                    {"role": "user", "content": f"Create a React component with Tailwind CSS for: {prompt}"}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Record success in circuit breaker
            llm_circuit_breaker.record_success()
            
            code = response.choices[0].message.content.strip()
            
            # Clean up response - remove markdown code blocks if present
            if code.startswith("```"):
                lines = code.split("\n")
                lines = lines[1:]  # Remove first line (```jsx)
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]  # Remove last line (```)
                code = "\n".join(lines)
            
            logger.info(f"[{request_id}] Successfully generated UI code")
            
            return {
                "code": code.strip(),
                "explanation": f"Generated React component based on: {prompt}"
            }
        
        except Exception as e:
            # Record failure in circuit breaker
            llm_circuit_breaker.record_failure()
            logger.error(f"[{request_id}] OpenAI API call failed: {type(e).__name__}: {e}")
            raise LLMServiceError(f"Failed to generate UI code: {str(e)}") from e
    
    def get_health_status(self) -> dict:
        """Get health status including circuit breaker state"""
        return {
            "service": "llm",
            "circuit_breaker": llm_circuit_breaker.get_state(),
            "api_key_configured": bool(self.api_key)
        }

# Global LLM service instance
llm_service = LLMService()
