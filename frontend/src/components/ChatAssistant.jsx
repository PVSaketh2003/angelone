import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Globe, Sparkles, Volume2, VolumeX, Paperclip, File, XCircle, Copy, Check } from 'lucide-react';

function CodeSnippetBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-xl font-mono text-xs">
      <div className="bg-slate-900/90 px-3.5 py-2 flex items-center justify-between border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="ml-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-emerald-400 font-mono leading-relaxed select-all">
        <pre className="whitespace-pre"><code>{code}</code></pre>
      </div>
    </div>
  );
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi (हिंदी)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'es-ES', name: 'Spanish (Español)' },
  { code: 'fr-FR', name: 'French (Français)' }
];

const GREETINGS = {
  'en-US': 'Hello! I am Saketh, your Multilingual AI Copilot. Speak or type to me in any language!',
  'hi-IN': 'नमस्ते! मैं साकेत हूँ, आपका बहुभाषी AI कोपायलट। मुझसे किसी भी भाषा में बोलें या टाइप करें!',
  'ta-IN': 'வணக்கம்! நான் சாகேத், உங்கள் பன்மொழி AI கோபிலட். என்னிடம் பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள்!',
  'es-ES': '¡Hola! Soy Saketh, tu copiloto de IA multilingüe. ¡Háblame o escribe en cualquier idioma!',
  'fr-FR': 'Bonjour ! Je suis Saketh, votre copiloto IA multilingue. Parlez ou tapez dans n\'importe quelle langue !'
};

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: GREETINGS['en-US'] }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ sender: 'bot', text: GREETINGS[selectedLang] || GREETINGS['en-US'] }];
      }
      return prev;
    });
  }, [selectedLang]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = selectedLang;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const fullText = (input + ' ' + transcript).trim();
        setInput(fullText);
        handleSend(fullText, true);
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, [selectedLang, input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const speakResponse = (text, langCode) => {
    if (!('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel(); 
      const cleanText = text.replace(/[*#\-[\]`]/g, '').replace(/\n+/g, '. ').trim();
      const voices = window.speechSynthesis.getVoices();
      const prefix = langCode.split('-')[0].toLowerCase();
      
      const matchingVoices = voices.filter(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith(prefix) ||
        v.name.toLowerCase().includes(prefix)
      );

      const femaleVoice = matchingVoices.find(v => 
        /female|woman|girl|zira|samantha|victoria|karen|fiona|veena|google/i.test(v.name)
      ) || matchingVoices[0] || voices[0];

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.05; 
      utterance.rate = 0.98;   

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Synthesis Notice:", e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech start error:", e);
      }
    }
  };

  const handleSend = async (customInput = null, isVoiceTriggered = false) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;

    const userMsgText = textToSend;
    setMessages(prev => [...prev, { sender: 'user', text: userMsgText }]);
    
    const formData = new FormData();
    formData.append('prompt', textToSend);
    formData.append('language', selectedLang);

    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const botReply = data.response;
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);

      if (isVoiceEnabled || isVoiceTriggered) {
        speakResponse(botReply, selectedLang);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to the Multimodal Copilot LLM.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTextLines = (chunk, keyPrefix) => {
    const lines = chunk.split('\n');
    return lines.map((line, lIdx) => {
      const key = `${keyPrefix}-${lIdx}`;
      
      const codeParts = line.split(/(`.*?`)/g);
      const formattedLine = codeParts.map((part, pIdx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={pIdx} className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 font-semibold">
              {part.slice(1, -1)}
            </code>
          );
        }

        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
            return <strong key={bIdx} className="font-bold text-slate-900 dark:text-yellow-400">{bPart.slice(2, -2)}</strong>;
          }
          return bPart;
        });
      });

      if (line.startsWith('### ')) {
        return <h4 key={key} className="font-extrabold text-slate-900 dark:text-yellow-400 mt-2.5 mb-1 text-xs tracking-tight">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('- ')) {
        return <div key={key} className="ml-1 my-0.5 flex items-start gap-1.5"><span className="text-indigo-500 font-bold">•</span><span>{formattedLine}</span></div>;
      }
      return <div key={key} className={line.trim() === '' ? 'h-1.5' : 'my-0.5'}>{formattedLine}</div>;
    });
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    // Matches any markdown code block ```lang ... ``` cleanly
    const codeBlockRegex = /```(?:([a-zA-Z0-9_+#-]+)\s*)?\n?([\s\S]*?)```/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        const textChunk = text.substring(lastIndex, matchIndex);
        elements.push(...formatTextLines(textChunk, `txt-${lastIndex}`));
      }

      const lang = match[1] ? match[1].trim() : 'code';
      const code = match[2];
      elements.push(<CodeSnippetBlock key={`code-${matchIndex}`} code={code} language={lang} />);

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
      elements.push(...formatTextLines(text.substring(lastIndex), `txt-${lastIndex}`));
    }

    return elements;
  };


  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white glow-green" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-slate-900 w-[calc(100vw-2rem)] sm:w-96 h-[520px] sm:h-[600px] md:h-[650px] flex flex-col shadow-2xl rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom-10 md:zoom-in-95">

          
          <div className="bg-slate-950 p-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight text-white">Saketh AI Copilot</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Multimodal & Native Voice</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isVoiceEnabled) window.speechSynthesis?.cancel();
                  setIsVoiceEnabled(!isVoiceEnabled);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isVoiceEnabled ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'
                }`}
                title={isVoiceEnabled ? "Voice Output ON" : "Voice Output OFF"}
              >
                {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg">
                <Globe className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-300 focus:outline-none cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-900/40">
            {messages.map((msg, idx) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    isBot 
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm' 
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}>
                    {isBot ? renderFormattedText(msg.text) : msg.text}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-sm text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            
            <div className="flex items-center gap-2">

              <button
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening 
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-500 animate-pulse' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Speak in selected language"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all"
                disabled={isListening}
              />

              <button
                onClick={() => handleSend()}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
