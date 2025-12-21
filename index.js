
import { GoogleGenAI } from "@google/genai";

// UI DOM Elements
const openAiBtn = document.getElementById('open-ai');
const closeAiBtn = document.getElementById('close-ai');
const aiModal = document.getElementById('ai-modal');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const navButtons = document.querySelectorAll('[data-scroll]');

// State Management
let messageHistory = [];

// Navigation Logic
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-scroll');
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Modal Control
const toggleModal = (show) => {
    if (show) {
        aiModal.classList.remove('hidden');
        chatInput.focus();
    } else {
        aiModal.classList.add('hidden');
    }
};

openAiBtn.addEventListener('click', () => toggleModal(true));
closeAiBtn.addEventListener('click', () => toggleModal(false));

// Chat Helper Functions
const appendMessage = (role, text) => {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
        role === 'user' 
        ? 'bg-primary text-white rounded-tr-none shadow-md' 
        : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700 shadow-sm'
    }`;
    bubble.textContent = text;
    
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const showLoading = () => {
    const loader = document.createElement('div');
    loader.id = 'chat-loader';
    loader.className = 'flex justify-start';
    loader.innerHTML = `
        <div class="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-700 flex gap-1">
            <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
            <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div class="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
    `;
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loader;
};

// Main AI Integration
const handleSendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    
    const loader = showLoading();

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                ...messageHistory.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                })),
                { role: 'user', parts: [{ text: text }] }
            ],
            config: {
                systemInstruction: "Du bist der KI-Berater von 'TomTen - Digitale Lösungen'. Repräsentiere Thomas, einen Entwickler für NGOs und soziale Einrichtungen. Antworte kurz, ruhig und professionell auf Deutsch. Fokus: IT-Wartung, Automatisierung, Barrierefreiheit.",
                temperature: 0.7,
            }
        });

        loader.remove();
        const aiResponse = response.text || 'Entschuldigung, ich konnte keine Antwort generieren.';
        appendMessage('assistant', aiResponse);
        
        // Update History
        messageHistory.push({ role: 'user', content: text });
        messageHistory.push({ role: 'assistant', content: aiResponse });
        
    } catch (error) {
        console.error("AI Error:", error);
        loader.remove();
        appendMessage('assistant', 'Verbindungsfehler. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per E-Mail.');
    }
};

// Event Listeners for Chat
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});
