import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { ChatMessage, Product } from '../types';
import { getStreamingRecommendation } from '../services/geminiService';
import { BotBridgeService } from '../services/botBridgeService';
import { BRAND_CONFIG } from '../config/brandConfig';

interface ChatBotProps {
  products: Product[];
}

export const ChatBot: React.FC<ChatBotProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Yo! ${BRAND_CONFIG.identity.botName} here. What digital goods are we huntin' today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: prompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      let responseText = '';
      try {
        responseText = await BotBridgeService.askBot(prompt, products);
      } catch (bridgeError) {
        console.warn('Bot bridge unavailable, using Gemini fallback.', bridgeError);
        responseText = await getStreamingRecommendation(prompt, products);
      }

      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'I am having trouble right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 p-5 rounded-3xl shadow-[0_0_30px_rgba(250,204,21,0.2)] bg-yellow-400 hover:scale-110 transition-all transform active:scale-95 group"
      >
        {isOpen ? <X className="w-6 h-6 text-black transition-transform hover:rotate-90" /> : <MessageSquare className="w-6 h-6 text-black group-hover:rotate-12 transition-transform" />}
      </button>

      <div className={`fixed bottom-28 right-8 w-[380px] bg-[#111] border border-white/10 rounded-[32px] shadow-2xl z-50 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'}`} style={{ maxHeight: '550px', height: '60vh' }}>
        <div className="p-6 bg-yellow-400 flex items-center gap-3">
          <div className="w-10 h-10 bg-black/10 rounded-2xl flex items-center justify-center animate-pop-in">
            {BRAND_CONFIG.assets.logoUrl ? (
              <img
                src={BRAND_CONFIG.assets.logoUrl}
                alt={`${BRAND_CONFIG.identity.botName} logo`}
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <Bot className="w-6 h-6 text-black" />
            )}
          </div>
          <div className="animate-slide-up">
            <h3 className="font-black text-black leading-tight">{BRAND_CONFIG.emojis.bot} {BRAND_CONFIG.identity.botName.toUpperCase()}</h3>
            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">Active Intelligence</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0a0a0a] scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 animate-reveal ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-medium transition-all transform hover:scale-[1.02] ${msg.role === 'user' ? 'bg-[#facc15] text-black rounded-tr-sm' : 'bg-white/5 text-white/80 rounded-tl-sm border border-white/5'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1 p-2 animate-fade-in">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}
        </div>

        <div className="p-5 bg-[#0a0a0a] border-t border-white/5">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about restocks..." className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:border-yellow-400 transition-all text-sm" />
            <button onClick={handleSend} disabled={!input.trim() || isTyping} className="p-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl transition-all disabled:opacity-50 transform active:scale-90"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </>
  );
};
