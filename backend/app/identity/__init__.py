"""BrandMind Brand Identity Engine – four-layer DNA + injection + scoring.

See docs/BRAND_IDENTITY_ENGINE.md. The DNA lives inside the brand document, so
it is available wherever a brand is resolved; ``inject_context`` is the single
DNA Injection Service used by every AI entry point via ``_brand_context``.
"""

from . import schema, service

__all__ = ["schema", "service"]
