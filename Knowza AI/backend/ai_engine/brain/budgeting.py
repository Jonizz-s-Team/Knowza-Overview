from dataclasses import dataclass
from .constants import INTENTS

@dataclass
class TokenBudget:
    input_cap: int
    output_cap: int
    history_limit: int
    history_char_limit: int
    system_prompt_limit: int
    knowledge_limit: int
    temperature: float
    timeout: int

_BUDGETS = {
    INTENTS.EXPLAIN_SIMPLE: TokenBudget(
        input_cap=8_000,
        output_cap=500,
        history_limit=5,
        history_char_limit=1500,
        system_prompt_limit=1500,
        knowledge_limit=2,
        temperature=0.3,
        timeout=15,
    ),
    INTENTS.EXPLAIN_DEEP: TokenBudget(
        input_cap=32_000,
        output_cap=2048,
        history_limit=15,
        history_char_limit=4000,
        system_prompt_limit=4000,
        knowledge_limit=6,
        temperature=0.5,
        timeout=30,
    ),
    INTENTS.TEST_GEN: TokenBudget(
        input_cap=16_000,
        output_cap=1500,
        history_limit=3,
        history_char_limit=1000,
        system_prompt_limit=3000,
        knowledge_limit=4,
        temperature=0.6,
        timeout=25,
    ),
    INTENTS.SOCRATIC_COACH: TokenBudget(
        input_cap=12_000,
        output_cap=600,
        history_limit=8,
        history_char_limit=2000,
        system_prompt_limit=2000,
        knowledge_limit=3,
        temperature=0.4,
        timeout=15,
    ),
    INTENTS.SIMPLIFY: TokenBudget(
        input_cap=10_000,
        output_cap=600,
        history_limit=5,
        history_char_limit=2000,
        system_prompt_limit=2000,
        knowledge_limit=2,
        temperature=0.3,
        timeout=15,
    ),
    INTENTS.DEEPEN: TokenBudget(
        input_cap=32_000,
        output_cap=2048,
        history_limit=10,
        history_char_limit=4000,
        system_prompt_limit=4000,
        knowledge_limit=6,
        temperature=0.5,
        timeout=30,
    ),
    INTENTS.ARTICLE_GEN: TokenBudget(
        input_cap=64_000,
        output_cap=8192,
        history_limit=5,
        history_char_limit=2000,
        system_prompt_limit=4000,
        knowledge_limit=10,
        temperature=0.3,
        timeout=60,
    ),
    INTENTS.TEST_COACH: TokenBudget(
        input_cap=6_000,
        output_cap=400,
        history_limit=4,
        history_char_limit=1200,
        system_prompt_limit=1500,
        knowledge_limit=2,
        temperature=0.3,
        timeout=10,
    ),
    INTENTS.TEST_REVIEW: TokenBudget(
        input_cap=8_000,
        output_cap=1200,
        history_limit=0,
        history_char_limit=0,
        system_prompt_limit=2000,
        knowledge_limit=3,
        temperature=0.6,
        timeout=20,
    ),
    INTENTS.TEST_REVIEW_DEEP: TokenBudget(
        input_cap=16_000,
        output_cap=3000,
        history_limit=0,
        history_char_limit=0,
        system_prompt_limit=3000,
        knowledge_limit=5,
        temperature=0.5,
        timeout=30,
    ),
}

_DEFAULT_BUDGET = TokenBudget(
    input_cap=16_000,
    output_cap=1000,
    history_limit=8,
    history_char_limit=2000,
    system_prompt_limit=3000,
    knowledge_limit=4,
    temperature=0.5,
    timeout=20,
)

def get_budget(intent: str) -> TokenBudget:
    return _BUDGETS.get(intent, _DEFAULT_BUDGET)
