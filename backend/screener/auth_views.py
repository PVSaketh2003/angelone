from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.core.validators import validate_email

from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
import logging
from .models import OTPVerification
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


    def post(self, request):
        try:
            data = request.data or {}
            username = str(data.get('username', '')).strip()
            email = str(data.get('email', '')).strip().lower()
            password = str(data.get('password', '')).strip()

            if not username or not email or not password:
                return Response({'error': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)

            if len(username) < 3:
                return Response({'error': 'Username must be at least 3 characters long'}, status=status.HTTP_400_BAD_REQUEST)

            if len(password) < 6:
                return Response({'error': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_email(email)
            except ValidationError:
                return Response({'error': 'Please provide a valid email address'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username__iexact=username).exists():
                return Response({'error': 'A user with this username already exists'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(email__iexact=email).exists():
                return Response({'error': 'A user with this email address already exists'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                user = User.objects.create_user(username=username, email=email, password=password, is_active=False)
                otp = OTPVerification.objects.create(user=user, purpose='REGISTRATION')
            
            try:
                send_mail(
                    'Your QuantEngine Registration Code',
                    f'Your OTP code is {otp.otp_code}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )


            except Exception as e:
                logger.warning(f"Registration email delivery issue for {email}: {e}")

            return Response({'message': 'User registered successfully. Please check your email for the OTP.'})

        except IntegrityError as e:
            return Response({'error': 'Database integrity error during registration. User or email may already exist.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error in RegisterView: {e}", exc_info=True)
            return Response({'error': f'Failed to process registration: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyRegistrationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


    def post(self, request):
        try:
            data = request.data or {}
            username = str(data.get('username', '')).strip()
            otp_code = str(data.get('otp', '')).strip()

            if not username or not otp_code:
                return Response({'error': 'Username and OTP code are required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(username__iexact=username)
            except User.DoesNotExist:
                return Response({'error': 'User account not found'}, status=status.HTTP_404_NOT_FOUND)

            otp = OTPVerification.objects.filter(user=user, otp_code=otp_code, purpose='REGISTRATION').last()
            
            if otp and otp.is_valid():
                with transaction.atomic():
                    otp.is_used = True
                    otp.save()
                    user.is_active = True
                    user.save()
                return Response({'message': 'Account verified successfully. You can now login.'})
            else:
                return Response({'error': 'Invalid or expired registration OTP code'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error in VerifyRegistrationView: {e}", exc_info=True)
            return Response({'error': f'Verification failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginInitiateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


    def post(self, request):
        try:
            data = request.data or {}
            username = str(data.get('username', '')).strip()
            password = str(data.get('password', '')).strip()

            if not username or not password:
                return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(username=username, password=password)
            if user is not None:
                if not user.is_active:
                    return Response({'error': 'Account is not verified. Please check your email for activation OTP.'}, status=status.HTTP_403_FORBIDDEN)
                
                # Generate MFA OTP
                with transaction.atomic():
                    otp = OTPVerification.objects.create(user=user, purpose='LOGIN_MFA')

                try:
                    send_mail(
                        'Your QuantEngine Login MFA Code',
                        f'Your MFA OTP code is {otp.otp_code}',
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    logger.warning(f"MFA email delivery issue for {user.email}: {e}")

                return Response({'message': 'MFA OTP code sent to your email. Please verify.'})
            else:
                return Response({'error': 'Invalid username or password credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            logger.error(f"Unexpected error in LoginInitiateView: {e}", exc_info=True)
            return Response({'error': f'Login initiation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginVerifyMFAView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


    def post(self, request):
        try:
            data = request.data or {}
            username = str(data.get('username', '')).strip()
            otp_code = str(data.get('otp', '')).strip()

            if not username or not otp_code:
                return Response({'error': 'Username and OTP code are required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(username__iexact=username)
            except User.DoesNotExist:
                return Response({'error': 'User account not found'}, status=status.HTTP_404_NOT_FOUND)

            otp = OTPVerification.objects.filter(user=user, otp_code=otp_code, purpose='LOGIN_MFA').last()
            
            if otp and otp.is_valid():
                with transaction.atomic():
                    otp.is_used = True
                    otp.save()
                tokens = get_tokens_for_user(user)
                return Response({'tokens': tokens, 'username': user.username})
            else:
                return Response({'error': 'Invalid or expired MFA OTP code'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error in LoginVerifyMFAView: {e}", exc_info=True)
            return Response({'error': f'MFA verification failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


    def post(self, request):
        try:
            data = request.data or {}
            email = str(data.get('email', '')).strip().lower()

            if not email:
                return Response({'error': 'Email address is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_email(email)
            except ValidationError:
                return Response({'error': 'Please provide a valid email address'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email__iexact=email)
                with transaction.atomic():
                    otp = OTPVerification.objects.create(user=user, purpose='PASSWORD_RESET')
                try:
                    send_mail(
                        'Your QuantEngine Password Reset Code',
                        f'Your OTP for password reset is {otp.otp_code}',
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=True,
                    )
                except Exception as e:
                    logger.warning(f"Password reset email delivery issue for {email}: {e}")
            except User.DoesNotExist:
                pass # Prevent email enumeration security vulnerability

            return Response({'message': 'If an account exists for this email, an OTP code has been sent.'})

        except Exception as e:
            logger.error(f"Unexpected error in ForgotPasswordView: {e}", exc_info=True)
            return Response({'error': f'Password reset request failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


    def post(self, request):
        try:
            data = request.data or {}
            email = str(data.get('email', '')).strip().lower()
            otp_code = str(data.get('otp', '')).strip()
            new_password = str(data.get('new_password', '')).strip()

            if not email or not otp_code or not new_password:
                return Response({'error': 'Email, OTP code, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

            if len(new_password) < 6:
                return Response({'error': 'New password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return Response({'error': 'Invalid email or user account not found'}, status=status.HTTP_400_BAD_REQUEST)

            otp = OTPVerification.objects.filter(user=user, otp_code=otp_code, purpose='PASSWORD_RESET').last()
            
            if otp and otp.is_valid():
                with transaction.atomic():
                    otp.is_used = True
                    otp.save()
                    user.set_password(new_password)
                    user.save()
                return Response({'message': 'Password reset successfully. You can now login with your new password.'})
            else:
                return Response({'error': 'Invalid or expired password reset OTP code'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error in ResetPasswordView: {e}", exc_info=True)
            return Response({'error': f'Password reset failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


