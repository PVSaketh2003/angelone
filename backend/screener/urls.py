from django.urls import path
from .views import (
    ScreenedStocksView,
    AllStocksView,
    StockDetailView,
    LiveSignalsView,
    MLStatsView,
    CSVExportView,
    BacktestView,
    ConfigView,
    ChatAssistantView,
    stream_market_ticks,
)
from .auth_views import (
    RegisterView,
    VerifyRegistrationView,
    LoginInitiateView,
    LoginVerifyMFAView,
    ForgotPasswordView,
    ResetPasswordView
)

urlpatterns = [
    path('stocks/', ScreenedStocksView.as_view(), name='screened_stocks'),
    path('stocks/all/', AllStocksView.as_view(), name='all_stocks'),
    path('stocks/<str:symbol>/', StockDetailView.as_view(), name='stock_detail'),
    path('signals/', LiveSignalsView.as_view(), name='live_signals'),
    path('ml/stats/', MLStatsView.as_view(), name='ml_stats'),
    path('export/csv/', CSVExportView.as_view(), name='csv_export'),
    path('backtest/', BacktestView.as_view(), name='backtest'),
    path('config/', ConfigView.as_view(), name='config'),
    path('chat/', ChatAssistantView.as_view(), name='chat'),
    path('stream/', stream_market_ticks, name='market_stream'),
    
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/verify-registration/', VerifyRegistrationView.as_view(), name='auth_verify_registration'),
    path('auth/login/', LoginInitiateView.as_view(), name='auth_login_init'),
    path('auth/login/mfa/', LoginVerifyMFAView.as_view(), name='auth_login_mfa'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
]
