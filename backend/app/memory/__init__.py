"""BrandMind Multi-Brain Memory – Brand / Business / Experience brains.

See docs/MULTI_BRAIN_MEMORY.md. Agents request memory through ``router`` (the
Memory Router / Memory Context API) instead of reading collections directly.
"""

from . import registry, router

__all__ = ["registry", "router"]
