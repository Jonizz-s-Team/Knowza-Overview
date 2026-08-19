import os
import threading
import logging

logger = logging.getLogger(__name__)

# Providers and their environment variable prefixes
PROVIDERS = {
    'gemini': 'GEMINI_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'claude': 'CLAUDE_API_KEY',
    'groq': 'GROQ_API_KEY'
}

class APIKeyManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(APIKeyManager, cls).__new__(cls)
                cls._instance._init_state()
            return cls._instance
            
    def _init_state(self):
        self.keys = {p: [] for p in PROVIDERS}
        self.current_index = {p: 0 for p in PROVIDERS}
        self._load_keys()
        
    def _load_keys(self):
        """Loads keys from .env. Supports up to 10 keys: PREFIX_1, PREFIX_2..."""
        for provider, prefix in PROVIDERS.items():
            # First try unnumbered base key (e.g., GEMINI_API_KEY)
            base_key = os.environ.get(prefix, '').strip()
            if base_key and base_key not in self.keys[provider]:
                self.keys[provider].append(base_key)
            
            # Then look for numbered keys 1 through 10
            for i in range(1, 11):
                key_name = f"{prefix}_{i}"
                key_value = os.environ.get(key_name, '').strip()
                if key_value and key_value not in self.keys[provider]:
                    self.keys[provider].append(key_value)
                    
        for provider, keys in self.keys.items():
            if keys:
                logger.info(f"Loaded {len(keys)} keys for {provider}")

    def get_key(self, provider: str) -> str:
        """Returns the next available key for a provider using round-robin."""
        if provider not in self.keys or not self.keys[provider]:
            return None
            
        with self._lock:
            idx = self.current_index[provider]
            key = self.keys[provider][idx]
            # Advance index for next time (Round Robin)
            self.current_index[provider] = (idx + 1) % len(self.keys[provider])
            return key
            
    def rotate_on_error(self, provider: str):
        """Manually rotate if a 429 error or quota issue occurs."""
        with self._lock:
            if self.keys.get(provider):
                # We skip one step ahead just to be sure we rotate away from failing key
                idx = self.current_index[provider]
                self.current_index[provider] = (idx + 1) % len(self.keys[provider])
                logger.warning(f"Rotated key for {provider} due to failure.")

keys_manager = APIKeyManager()
