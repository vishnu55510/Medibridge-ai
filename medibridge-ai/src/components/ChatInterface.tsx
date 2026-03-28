import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { ChatInterfaceProps } from '../types';
import { withRetry } from '../utils/RetryHandler';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatInterface = React.memo(function ChatInterface({ user, profileId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm your personal health assistant. I can answer questions and provide recommendations based *only* on the medical records you've uploaded. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [medicalContext, setMedicalContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Fetch all medical records to build the context
    const fetchRecords = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'profiles', profileId, 'records'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const records = snapshot.docs.map(doc => {
          const data = doc.data();
          return `
Type: ${data.type}
Date: ${data.date}
Doctor: ${data.doctor || data.doctorName || 'Unknown'}
Hospital: ${data.hospital || 'Unknown'}
Summary: ${data.summary}
Details: ${data.extractedData}
          `;
        });

        const contextString = records.length > 0 
          ? records.join('\n---\n') 
          : "The user has not uploaded any medical records yet.";
          
        setMedicalContext(contextString);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/profiles/${profileId}/records`);
      }
    };

    fetchRecords();
  }, [user.uid, profileId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const systemInstruction = `
        You are MediBridge AI, a personalized health assistant. 
        You must answer the user's questions and provide recommendations BASED STRICTLY AND ONLY on their previous medical records provided below.
        If the user asks a question that cannot be answered using their records, politely inform them that you do not have that information in their profile and advise them to consult their doctor.
        Do not provide general medical advice outside the scope of their uploaded records.
        
        USER'S MEDICAL RECORDS:
        ${medicalContext}
      `;
      
      const contents = [
        ...messages.slice(1).map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });
      });

      setMessages(prev => [...prev, { role: 'model', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMsg = "I encountered an error while trying to respond. Please try again.";
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMsg = "AI rate limit exceeded. Please wait a minute or upgrade your Gemini API quota in Google AI Studio.";
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col h-full" aria-label="Health Assistant Chat">
      <header className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
        <Bot className="h-6 w-6 text-white" aria-hidden="true" />
        <div>
          <h2 className="text-white font-semibold">MediBridge Assistant</h2>
          <p className="text-indigo-100 text-xs">Powered by your medical history</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50" role="log" aria-live="polite">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
            }`} aria-hidden="true">
              {msg.role === 'user' ? <UserIcon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
            }`}>
              <span className="sr-only">{msg.role === 'user' ? 'You said:' : 'Assistant said:'}</span>
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div className="prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4" aria-live="assertive">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center" aria-hidden="true">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" aria-hidden="true" />
              <span className="text-sm text-slate-500">Analyzing your records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} tabIndex={-1} />
      </div>

      <footer className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your medications, conditions, or history..."
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="bg-indigo-600 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </footer>
    </section>
  );
});

export default ChatInterface;
