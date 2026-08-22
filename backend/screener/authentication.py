import logging
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

logger = logging.getLogger(__name__)

class SafeJWTAuthentication(JWTAuthentication):
    """
    Custom SimpleJWT Authentication backend that safely handles invalid or expired
    tokens. If a Bearer token is expired or corrupted, it falls back to AnonymousUser
    rather than aborting with an authentication exception on AllowAny views.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, AuthenticationFailed) as e:
            logger.debug(f"[SafeJWTAuthentication] Invalid or expired token ignored: {e}")
            return None
        except Exception as e:
            logger.warning(f"[SafeJWTAuthentication] Token processing error: {e}")
            return None
