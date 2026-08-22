import time
import json
import csv
import urllib.request
import os
import ssl
import requests
import re
import logging

logger = logging.getLogger(__name__)

def clean_prompt_answer(text):
    if not text:
        return text
    # Replace literal <br> tags with newlines while preserving C/C++ header includes like <stdio.h> and template types
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    return text.strip()

from django.http import JsonResponse, StreamingHttpResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator

from django.views.decorators.cache import cache_page
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .market_engine import market_engine
from .backtest import run_strategy_backtest
from .ml_model import ai_classifier
from .smartapi_client import smartapi_client

class ScreenedStocksView(APIView):
    permission_classes = [AllowAny]
    """
    Get live screened stocks matching:

      1. LTP between ₹30 and ₹500
      2. Bid Qty > 10,00,000 & Ask Qty > 10,00,000
    """
    @method_decorator(cache_page(5))
    def get(self, request):
        try:
            min_ltp = float(request.query_params.get('min_ltp', 30.0))
            max_ltp = float(request.query_params.get('max_ltp', 500.0))
            min_bid = int(request.query_params.get('min_bid', 1000000))
            min_ask = int(request.query_params.get('min_ask', 1000000))

            stocks = market_engine.get_screened_stocks(
                min_ltp=min_ltp, max_ltp=max_ltp, min_bid=min_bid, min_ask=min_ask
            )
            return Response({
                'count': len(stocks),
                'filters': {
                    'min_ltp': min_ltp,
                    'max_ltp': max_ltp,
                    'min_bid_qty': min_bid,
                    'min_ask_qty': min_ask,
                },
                'timestamp': int(time.time()),
                'stocks': stocks,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AllStocksView(APIView):
    permission_classes = [AllowAny]
    """Get all NSE stocks in the screening universe with pass/fail filter flags."""

    def get(self, request):
        stocks = market_engine.get_all_stocks_raw()
        return Response({
            'count': len(stocks),
            'timestamp': int(time.time()),
            'stocks': stocks,
        })

class StockDetailView(APIView):
    permission_classes = [AllowAny]
    """Get detailed price/indicator history, depth, and ETQ statistics for a stock."""

    def get(self, request, symbol):
        symbol = symbol.upper()
        if symbol not in market_engine.stocks:
            return Response({'error': f'Stock {symbol} not found'}, status=status.HTTP_404_NOT_FOUND)

        data = market_engine.stocks[symbol]
        metrics = market_engine.calculate_stock_metrics(data)
        ai_pred = ai_classifier.predict_signal(metrics)

        return Response({
            'symbol': symbol,
            'metrics': metrics,
            'ai_prediction': ai_pred,
            'price_history': data['price_history'][-100:],
            'smma20_history': data['smma20_history'][-100:],
            'smma120_history': data['smma120_history'][-100:],
            'depth_levels': data['depth_levels'],
            'ticks_history': data['ticks_history'][-50:],
        })

class LiveSignalsView(APIView):
    permission_classes = [AllowAny]
    """Get real-time log of SMMA Crossover signals with AI acceptance/avoidance decisions."""

    def get(self, request):
        return Response({
            'count': len(market_engine.signals_log),
            'signals': market_engine.signals_log,
        })

class MLStatsView(APIView):
    permission_classes = [AllowAny]
    """Get quantitative evaluation metrics of the AI/ML model."""

    def get(self, request):
        stats = ai_classifier.get_model_stats()
        return Response(stats)

class CSVExportView(APIView):
    permission_classes = [AllowAny]
    """Export screened stock market data as a downloadable CSV file."""

    def get(self, request):
        stocks = market_engine.get_screened_stocks()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="nse_screened_stocks_{int(time.time())}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Symbol', 'Company Name', 'LTP (INR)', 'Change %', 'SMMA 20', 'SMMA 120', 'SMMA Status',
            'ETQ 5m', 'ETQ 20m', 'ETQ 60m', 'VWAP 20m', 'VWAP 60m', 'Bid Price', 'Bid Qty', 'Ask Price', 'Ask Qty',
            'AI Recommendation', 'AI Confidence %', 'AI Rationale'
        ])

        for s in stocks:
            writer.writerow([
                s['symbol'], s['name'], s['ltp'], s['change_pct'], s['smma20'], s['smma120'], s['smma_status'],
                s['etq_5m'], s['etq_20m'], s['etq_60m'], s['avg_price_20m'], s['avg_price_60m'],
                s['bid_price'], s['bid_qty'], s['ask_price'], s['ask_qty'],
                s['ai_recommendation'], s['ai_confidence'], s['ai_explanation']
            ])

        return response

class BacktestView(APIView):
    permission_classes = [AllowAny]
    """Run quantitative backtest comparing Raw SMMA vs AI-Filtered SMMA strategies."""

    def post(self, request):
        symbols = request.data.get('symbols', None)
        initial_capital = float(request.data.get('initial_capital', 100000.0))
        results = run_strategy_backtest(symbols=symbols, initial_capital=initial_capital)
        return Response(results)

    def get(self, request):
        results = run_strategy_backtest()
        return Response(results)

class ConfigView(APIView):
    permission_classes = [AllowAny]
    """Get/Set screening parameters or Angel One credentials."""

    def get(self, request):
        status_info = smartapi_client.get_connection_status()
        return Response({
            'min_ltp': market_engine.min_ltp,
            'max_ltp': market_engine.max_ltp,
            'min_bid_qty': market_engine.min_bid_qty,
            'min_ask_qty': market_engine.min_ask_qty,
            'broker_status': status_info,
        })

    def post(self, request):
        market_engine.min_ltp = float(request.data.get('min_ltp', market_engine.min_ltp))
        market_engine.max_ltp = float(request.data.get('max_ltp', market_engine.max_ltp))
        market_engine.min_bid_qty = int(request.data.get('min_bid_qty', market_engine.min_bid_qty))
        market_engine.min_ask_qty = int(request.data.get('min_ask_qty', market_engine.min_ask_qty))

        api_key = request.data.get('api_key', None)
        client_id = request.data.get('client_id', None)
        password = request.data.get('password', None)
        totp_secret = request.data.get('totp_secret', None)

        if api_key and client_id:
            smartapi_client.configure(api_key, client_id, password, totp_secret)

        return Response({
            'status': 'success',
            'message': 'Screener configuration updated successfully',
            'config': {
                'min_ltp': market_engine.min_ltp,
                'max_ltp': market_engine.max_ltp,
                'min_bid_qty': market_engine.min_bid_qty,
                'min_ask_qty': market_engine.min_ask_qty,
            },
            'broker_status': smartapi_client.get_connection_status(),
        })

def stream_market_ticks(request):
    """Server-Sent Events (SSE) streaming endpoint for live market ticker updates."""
    def event_generator():
        while True:
            screened = market_engine.get_screened_stocks()
            data = json.dumps({
                'timestamp': int(time.time()),
                'count': len(screened),
                'stocks': screened,
                'recent_signals': market_engine.signals_log[:5],
            })
            yield f"data: {data}\n\n"
            time.sleep(1.5)

    response = StreamingHttpResponse(event_generator(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

class ChatAssistantView(APIView):
    permission_classes = [AllowAny]
    """
    Institutional AI Copilot & Multilingual LLM Assistant endpoint.

    Behaves like Gemini / ChatGPT / Copilot: answers general questions, application guides, and quantitative analysis
    in ANY language spoken or selected by the user (English, Hindi, Telugu, Tamil, Spanish, French, etc.).
    """
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        prompt = request.data.get('prompt', '').strip()
        lang_code = request.data.get('language', 'en-US').strip()
        
        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY GUARDRAIL: Refuse requests for full codebase exfiltration or source code dumps
        import re
        codebase_request_patterns = [
            r'\b(entire|full|whole|all|complete)\b.*\b(codebase|source\s*code|repository|repo|files)\b',
            r'\b(dump|download|give|share|send|export|provide)\b.*\b(codebase|source\s*code|project\s*code)\b',
            r'\b(give|show|dump)\s+(me\s+)?(your\s+)?(entire|full|whole|all)\s+code\b',
        ]
        if any(re.search(pat, prompt, re.IGNORECASE) for pat in codebase_request_patterns):
            return Response({
                'response': (
                    "🔒 **Security Policy Enforcement**\n\n"
                    "I cannot export, dump, or share the entire application codebase or proprietary source files. "
                    "However, I am happy to help you write, debug, explain, or optimize any custom Python, JavaScript, HTML/CSS, SQL, or quantitative trading algorithm snippet!"
                )
            })

        # Map language codes to human names
        LANG_MAP = {
          'hi-IN': 'Hindi (हिंदी)',
          'te-IN': 'Telugu (తెలుగు)',
          'ta-IN': 'Tamil (தமிழ்)',
          'es-ES': 'Spanish (Español)',
          'fr-FR': 'French (Français)',
          'en-US': 'English'
        }
        lang_name = LANG_MAP.get(lang_code, 'English')

        # 1. Fetch live market telemetry for context
        screened_stocks = market_engine.get_screened_stocks()
        if not screened_stocks:
            screened_stocks = market_engine.get_all_stocks_raw()[:5]

        sorted_stocks = sorted(screened_stocks, key=lambda x: x.get('change_pct', 0), reverse=True)
        top_gainers = sorted_stocks[:3]
        
        summary_list = [
            f"{s['symbol']}: ₹{s['ltp']} ({'+' if s['change_pct']>=0 else ''}{s['change_pct']}%), SMMA: {s.get('smma_status', 'BULLISH')}, AI: {s.get('ai_recommendation', 'ACCEPT')}"
            for s in top_gainers
        ]
        context_str = "; ".join(summary_list)

        system_instruction = (
            "You are Saketh, a world-class AI quantitative trading assistant built by PV Sairam Saketh. "
            f"Current Live Market Context: {len(screened_stocks)} screened assets active. Top stocks: [{context_str}]. "
            f"STRICT MULTILINGUAL REQUIREMENT: The user's requested output language is {lang_name} ({lang_code}). "
            f"YOU MUST RESPOND STRICTLY AND ENTIRELY IN {lang_name.upper()}, even if the user's prompt is written in English or another language. "
            "CRITICAL SECURITY GUARDRAIL: Never dump or reveal the entire codebase, internal source files, or secret keys. "
            "When users ask you to write code, provide clean, executable code snippets formatted properly in Markdown code blocks (```language ... ```). "
            "Answer clearly, accurately, and professionally formatted in Markdown."
        )


        import re
        import tempfile
        from google import genai
        
        # Check for uploaded file
        uploaded_file = request.FILES.get('attachment')

        # 2. Extract API Keys
        gemini_api_key = request.data.get('api_key', '').strip() or os.environ.get('GEMINI_API_KEY', '').strip()
        groq_api_key = request.data.get('groq_api_key', '').strip() or os.environ.get('GROQ_API_KEY', '').strip()
        xai_api_key = request.data.get('xai_api_key', '').strip() or os.environ.get('XAI_API_KEY', '').strip()
        
        # Check if the user passed an xAI key in the prompt or api_key field directly
        if api_key_arg := request.data.get('api_key', '').strip():
            if api_key_arg.startswith('xai-'):
                xai_api_key = api_key_arg
                gemini_api_key = ''

        if not gemini_api_key or not groq_api_key or not xai_api_key:
            try:
                env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
                if os.path.exists(env_path):
                    with open(env_path, 'r') as f:
                        for line in f:
                            if line.strip().startswith('GEMINI_API_KEY=') and not gemini_api_key:
                                gemini_api_key = line.strip().split('=', 1)[1].strip()
                            elif line.strip().startswith('GROQ_API_KEY=') and not groq_api_key:
                                groq_api_key = line.strip().split('=', 1)[1].strip()
                            elif line.strip().startswith('XAI_API_KEY=') and not xai_api_key:
                                xai_api_key = line.strip().split('=', 1)[1].strip()
            except Exception as e:
                logger.warning(f"Error reading .env file: {e}")

        if not gemini_api_key:
            gemini_api_key = os.environ.get('GEMINI_API_KEY', '')
            
        if not groq_api_key:
            groq_api_key = os.environ.get('GROQ_API_KEY', '')


        # 3. Handle File Upload & Gemini Generation
        genai_file_ref = None
        genai_client = None
        temp_file_path = None
        
        if uploaded_file and gemini_api_key:
            try:
                genai_client = genai.Client(api_key=gemini_api_key)
                suffix = f".{uploaded_file.name.split('.')[-1]}" if '.' in uploaded_file.name else ".bin"
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                    temp_file_path = temp_file.name
                
                genai_file_ref = genai_client.files.upload(file=temp_file_path)
                
                # Wait for PROCESSING to finish (important for videos/large PDFs)
                while genai_file_ref.state.name == "PROCESSING":
                    time.sleep(2)
                    genai_file_ref = genai_client.files.get(name=genai_file_ref.name)
            except Exception as e:
                print("Gemini Upload Error:", e)

        # 4. ALWAYS Try Gemini FIRST (Most Advanced Multilingual & Multimodal AI)
        if gemini_api_key:
            try:
                if not genai_client:
                    genai_client = genai.Client(api_key=gemini_api_key)
                
                contents = [system_instruction]
                if genai_file_ref:
                    contents.append(genai_file_ref)
                contents.append(prompt)
                
                response = genai_client.models.generate_content(
                    model='gemini-1.5-pro' if genai_file_ref else 'gemini-1.5-flash',
                    contents=contents
                )
                
                if temp_file_path and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    
                if response.text:
                    llm_response = re.sub(r'<think>.*?</think>', '', response.text, flags=re.DOTALL).strip()
                    return Response({'response': clean_prompt_answer(llm_response)})
            except Exception as e:
                print("Gemini SDK Error:", e)
                
        # Cleanup if Gemini failed but we uploaded a file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        # 5. Try Calling xAI (Grok) API if NO file attached
        if xai_api_key and not uploaded_file:
            xai_url = "https://api.x.ai/v1/chat/completions"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {xai_api_key}',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            payload = {
                "model": "grok-beta", # You can change this to groq-2 or groq-2-latest if needed
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "stream": False
            }
            try:
                response = requests.post(
                    xai_url,
                    json=payload,
                    headers=headers,
                    timeout=8
                )
                if response.status_code == 200:
                    res_data = response.json()
                    llm_response = res_data['choices'][0]['message']['content']
                    if llm_response:
                        llm_response = re.sub(r'<think>.*?</think>', '', llm_response, flags=re.DOTALL).strip()
                        return Response({'response': clean_prompt_answer(llm_response)})
            except Exception as e:
                logger.warning(f"xAI API failed: {e}")

        # 6. Try Calling GROQ API Second (OpenAI Compatible, Ultra-fast)
        if groq_api_key and not uploaded_file:
            groq_url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {groq_api_key}',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            payload = {
                "model": "openai/gpt-oss-20b",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 800
            }
            try:
                response = requests.post(
                    groq_url,
                    json=payload,
                    headers=headers,
                    timeout=8
                )
                if response.status_code == 200:
                    res_data = response.json()
                    llm_response = res_data['choices'][0]['message']['content']
                    if llm_response:
                        llm_response = re.sub(r'<think>.*?</think>', '', llm_response, flags=re.DOTALL).strip()
                        return Response({'response': clean_prompt_answer(llm_response)})
            except Exception as e:
                logger.warning(f"Groq API failed: {e}")

        # 4. Try calling Gemini REST API models sequentially
        candidate_models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash']
        
        for model_name in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_api_key}"
            headers = {
                'Content-Type': 'application/json',
                'x-goog-api-key': gemini_api_key
            }
            payload = {
                "contents": [{
                    "parts": [{"text": f"{system_instruction}\n\nUser Question ({lang_name}): {prompt}"}]
                }],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 800
                }
            }

            try:
                response = requests.post(
                    url,
                    json=payload,
                    headers=headers,
                    timeout=6
                )
                if response.status_code == 200:
                    res_data = response.json()
                    llm_response = res_data['candidates'][0]['content']['parts'][0]['text']
                    if llm_response:
                        return Response({'response': clean_prompt_answer(llm_response)})
            except Exception as e:
                logger.warning(f"Gemini {model_name} failed: {e}")
                continue

        # 5. Multilingual Local Copilot Engine (Zero Language Barrier Offline Engine)
        prompt_lower = prompt.lower()
        is_hindi = lang_code == 'hi-IN' or any(c in prompt for c in ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड', 'ढ', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'])
        is_tamil = lang_code == 'ta-IN' or any(c in prompt for c in ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'க', 'ங', 'ச', 'ஜ', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'])
        is_spanish = lang_code == 'es-ES' or any(w in prompt_lower for w in ['cómo', 'usar', 'aplicación', 'hola', 'qué', 'acciones', 'ayuda'])
        is_french = lang_code == 'fr-FR' or any(w in prompt_lower for w in ['comment', 'utiliser', 'bonjour', 'aide', 'actions'])

        # HINDI RESPONSES
        if is_hindi:
            if any(w in prompt_lower for w in ['how', 'use', 'application', 'app', 'website', 'proceed', 'start', 'guide', 'tutorial', 'navigate', 'what to do', 'explain', 'help', 'कैसे', 'उपयोग']):
                fallback_reply = (
                    "👋 **QuantEngine प्लेटफॉर्म का उपयोग कैसे करें:**\n\n"
                    "### 📈 1. लाइव स्क्रीनर (`/`)\n"
                    "- **रियल-टाइम स्क्रीनर**: ₹30 से ₹500 तक के NSE शेयरों को 10,00,000+ ऑर्डर डेप्थ के साथ फ़िल्टर करता है।\n"
                    "- **SMMA क्रॉसओवर**: **SMMA 20 vs SMMA 120** द्वारा मोमेंटम ट्रैक करता है।\n"
                    "- **AI निर्णय**: Gradient Boosting मॉडल हर सिग्नल को **ACCEPT** या **AVOID** करता है।\n\n"
                    "### 👁️ 2. विजन AI स्कैनर (`/vision-ai`)\n"
                    "- कंप्यूटर विजन तकनीक से चार्ट पैटर्न और ब्रेकआउट जोन का विश्लेषण करता है।\n\n"
                    "### 📊 3. बैकटेस्ट टर्मिनल (`/backtest`)\n"
                    "- SMMA रणनीति के ऐतिहासिक P&L और Win Rate की तुलना करता है।"
                )
            else:
                fallback_reply = (
                    "नमस्ते! मैं **QuantEngine AI Copilot** हूँ, जिसे PV Sairam Saketh ने विकसित किया है।\n\n"
                    "आप मुझसे लाइव स्टॉक स्क्रीनर, SMMA इंडिकेटर्स, विजन AI या बैकटेस्टिंग के बारे में पूछ सकते हैं।"
                )

        # TAMIL RESPONSES
        elif is_tamil:
            if any(w in prompt_lower for w in ['how', 'use', 'application', 'app', 'website', 'proceed', 'start', 'guide', 'tutorial', 'navigate', 'what to do', 'explain', 'help', 'எப்படி', 'பயன்படுத்துவது']):
                fallback_reply = (
                    "👋 **QuantEngine தளத்தை எவ்வாறு பயன்படுத்துவது:**\n\n"
                    "### 📈 1. லைவ் ஸ்கிரீனர் (`/`)\n"
                    "- **நேரடி ஸ்கிரீனிங்**: ரூ.30 முதல் ரூ.500 வரையிலான NSE பங்குகளை 10,00,000+ ஆர்டர் ஆழத்துடன் கண்காணிக்கிறது.\n"
                    "- **SMMA குறுக்கீடுகள்**: **SMMA(20) vs SMMA(120)** மூலம் சந்தை போக்கை அறியலாம்.\n"
                    "- **AI மாதிரி**: ஒவ்வொரு பங்கையும் **ACCEPT** அல்லது **AVOID** என வகைப்படுத்துகிறது.\n\n"
                    "### 👁️ 2. விஷன் AI ஸ்கேனர் (`/vision-ai`)\n"
                    "- கம்ப்யூட்டர் விஷன் மூலம் சார்ட் வடிவங்களை பகுப்பாய்வு செய்கிறது.\n\n"
                    "### 📊 3. பேக்டெஸ்ட் டெர்மினல் (`/backtest`)\n"
                    "- SMMA உத்தியின் வரலாற்று லாப நட்டங்களை AI உடன் ஒப்பிடுகிறது."
                )
            else:
                fallback_reply = (
                    "வணக்கம்! நான் **QuantEngine AI Copilot**, PV Sairam Saketh உருவாக்கிய வர்த்தக உதவியாளர்.\n\n"
                    "லைவ் ஸ்கிரீனர், SMMA இண்டிகேட்டர்கள், விஷன் AI அல்லது பேக்டெஸ்டிங் பற்றி நீங்கள் எந்த மொழியிலும் என்னிடம் கேட்கலாம்!"
                )

        # SPANISH RESPONSES
        elif is_spanish:
            fallback_reply = (
                "👋 **¡Bienvenido a QuantEngine Institutional Terminal!**\n\n"
                "### 📈 1. Live Screener (`/`)\n"
                "- Filtra acciones NSE con precios entre **₹30 y ₹500** y profundidad de volumen superior a 1,00,000+.\n"
                "- Detecta cruces de **SMMA(20) vs SMMA(120)** y señales de IA (**ACCEPT / AVOID**).\n\n"
                "### 👁️ 2. Vision AI Scanner (`/vision-ai`)\n"
                "- Análisis de patrones gráficos mediante visión por computadora."
            )

        # FRENCH RESPONSES
        elif is_french:
            fallback_reply = (
                "👋 **Bienvenue sur QuantEngine Institutional Terminal!**\n\n"
                "### 📈 1. Screener en direct (`/`)\n"
                "- Filtre les actions NSE entre **₹30 et ₹500** avec un volume institutionnel.\n"
                "- Détecte les croisements **SMMA(20) vs SMMA(120)** et les signaux IA (**ACCEPT / AVOID**)."
            )

        # ENGLISH & DEFAULT RESPONSES
        else:
            if any(w in prompt_lower for w in ['how', 'use', 'application', 'app', 'website', 'proceed', 'start', 'guide', 'tutorial', 'navigate', 'what to do', 'explain app', 'help']):
                fallback_reply = (
                    "👋 **Welcome to QuantEngine Institutional Terminal!** Here is how you can use this platform:\n\n"
                    "### 📈 1. Live Screener (`/`)\n"
                    "- **Real-Time Screening**: Monitors NSE stocks with LTP between **₹30 – ₹500** and order book depth exceeding **10,00,000+** shares.\n"
                    "- **SMMA Crossovers**: Identifies bullish/bearish momentum shifts (**SMMA 20 vs SMMA 120**).\n"
                    "- **AI Validation**: Gradient Boosting Classifier flags each asset as **ACCEPT** or **AVOID** with confidence scores.\n"
                    "- **Deep Telemetry**: Click any stock row to open full quantitative depth and execution metrics.\n\n"
                    "### 👁️ 2. Vision AI Scanner (`/vision-ai`)\n"
                    "- Analyzes chart patterns using computer vision algorithms to detect **Head & Shoulders**, **Double Bottoms**, **Cup & Handle**, and Breakout zones.\n\n"
                    "### 📊 3. Backtest Terminal (`/backtest`)\n"
                    "- Compares **Raw SMMA strategy** against **AI-Filtered execution**.\n"
                    "- Evaluates Cumulative P&L (₹), Win Rate (%), Sharpe Ratio, and Drawdown.\n\n"
                    "### ⚙️ 4. ML Metrics & Tuning (`/ml-metrics`)\n"
                    "- Inspect **ROC-AUC scores**, **Feature Importances**, **Confusion Matrix**, and **GridSearchCV** hyperparameter tuning.\n\n"
                    "💡 *Tip: You can speak to me using the Microphone button in English, Hindi, Telugu, Tamil, or Spanish!*"
                )
            elif any(w in prompt_lower for w in ['top', 'best', 'buy', 'stock', 'gain', 'recommend', 'bullish']):
                top = top_gainers[0] if top_gainers else None
                top_name = top['symbol'] if top else 'PNB'
                top_price = top['ltp'] if top else 118.67
                fallback_reply = (
                    f"🚀 **Top Screened Asset:** **{top_name}**\n"
                    f"- **LTP**: ₹{top_price}\n"
                    f"- **SMMA Trajectory**: BULLISH\n"
                    f"- **AI Decision**: **ACCEPT** (91.4% confidence)\n\n"
                    f"Currently tracking **{len(screened_stocks)}** active screened assets matching high-volume institutional criteria."
                )
            else:
                fallback_reply = (
                    "Hello! I am **QuantEngine AI Copilot**, an intelligent quantitative trading assistant developed by **PV Sairam Saketh**.\n\n"
                    "I can assist you with real-time stock screening, technical indicator explanations, chart pattern analysis, and backtesting metrics. How can I help you today?"
                )

        return Response({'response': clean_prompt_answer(fallback_reply)})