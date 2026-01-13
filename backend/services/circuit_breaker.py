import time
import os
from enum import Enum
from typing import Optional
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Circuit breaker triggered, blocking requests
    HALF_OPEN = "half_open"  # Testing if service recovered

class CircuitBreaker:
    """
    Circuit breaker pattern implementation for fault tolerance.
    Prevents cascading failures by stopping requests to failing services.
    """
    
    def __init__(
        self,
        failure_threshold: Optional[int] = None,
        timeout_seconds: Optional[int] = None,
        name: str = "default"
    ):
        self.name = name
        self.failure_threshold = failure_threshold or int(os.getenv("CIRCUIT_BREAKER_THRESHOLD", "5"))
        self.timeout_seconds = timeout_seconds or int(os.getenv("CIRCUIT_BREAKER_TIMEOUT", "60"))
        
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = CircuitState.CLOSED
        self.success_count = 0
    
    def record_success(self):
        """Record a successful request"""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= 2:  # After 2 successes, close the circuit
                logger.info(f"Circuit breaker '{self.name}' closing after successful requests")
                self._close_circuit()
        elif self.state == CircuitState.CLOSED:
            # Reset failure count on success
            self.failure_count = 0
    
    def record_failure(self):
        """Record a failed request"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.HALF_OPEN:
            logger.warning(f"Circuit breaker '{self.name}' opening due to failure in HALF_OPEN state")
            self._open_circuit()
        elif self.failure_count >= self.failure_threshold:
            logger.warning(
                f"Circuit breaker '{self.name}' opening due to {self.failure_count} failures "
                f"(threshold: {self.failure_threshold})"
            )
            self._open_circuit()
    
    def can_execute(self) -> bool:
        """Check if request can be executed"""
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            # Check if timeout has passed
            if self.last_failure_time and (time.time() - self.last_failure_time) >= self.timeout_seconds:
                logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
                self._half_open_circuit()
                return True
            return False
        
        # HALF_OPEN state - allow request to test service
        return True
    
    def _open_circuit(self):
        """Open the circuit (block requests)"""
        self.state = CircuitState.OPEN
        self.success_count = 0
    
    def _close_circuit(self):
        """Close the circuit (allow requests)"""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
    
    def _half_open_circuit(self):
        """Enter half-open state (test service)"""
        self.state = CircuitState.HALF_OPEN
        self.success_count = 0
    
    def get_state(self) -> dict:
        """Get current circuit breaker state"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "last_failure_time": self.last_failure_time,
            "timeout_seconds": self.timeout_seconds
        }

# Global circuit breaker instance for LLM calls
llm_circuit_breaker = CircuitBreaker(name="llm_service")