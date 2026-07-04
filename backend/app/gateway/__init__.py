"""BrandMind AI Provider Gateway.

Business modules import ``gateway`` from here and never talk to a provider
directly. See docs/AI_PROVIDER_GATEWAY.md.
"""

from .core import gateway, AIGateway, GatewayResult
from .config import default_config, merge_config
from . import capabilities, registry

__all__ = [
    "gateway", "AIGateway", "GatewayResult",
    "default_config", "merge_config",
    "capabilities", "registry",
]
