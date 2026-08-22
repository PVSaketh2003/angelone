import os
import requests
import json
import logging

key = os.environ.get('GEMINI_API_KEY', '')
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
resp = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
print(resp.status_code)
print(resp.text)
