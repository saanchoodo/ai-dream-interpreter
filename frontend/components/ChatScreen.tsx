import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { BotIcon, UserIcon, SendIcon, LogoutIcon, SpeakerIcon, MicrophoneIcon } from './icons';
import { interpretDream, getChatHistory } from '../apiClient'; // <-- Убедитесь, что getChatHistory импортирован

interface ChatScreenProps {
  user: User;
  onLogout: () => void;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"></div>
    </div>
);

const ChatScreen: React.FC<ChatScreenProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <--- Теперь используется для загрузки истории
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- ГЛАВНОЕ ИЗМЕНЕНИЕ: ЗАГРУЗКА ИСТОРИИ ЧАТА ПРИ ЗАПУСКЕ ---
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return; // Убедимся, что user есть

      setIsLoading(true);
      try {
        const history = await getChatHistory(user.id);

        if (history.length > 0) {
          // Если история есть, отображаем ее
          setMessages(history);
        } else {
          // Если истории нет (новый пользователь), показываем приветствие
          setMessages([
            { role: 'bot', text: `Здравствуйте, ${user.name}! Я - ваш персональный толкователь снов. Расскажите, что вам приснилось, и я помогу раскрыть тайны вашего подсознания.` }
          ]);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
        // Если ошибка, показываем сообщение об ошибке вместо приветствия
        setMessages([
            { role: 'bot', text: `Здравствуйте, ${user.name}! Не удалось загрузить вашу историю переписки. Но вы можете начать новый диалог.` }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.name]); // Зависим от user.id и user.name
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // Настройка распознавания речи (ASR)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'ru-RU';
      recognition.interimResults = false;
      recognition.onresult = (event: any) => setInput(event.results[0][0].transcript);
      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        setIsRecording(false);
      };
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  // Отправка сообщения на бэкенд
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const dreamText = input.trim();
    const userId = localStorage.getItem('dream_user_id');

    if (dreamText.length < 10) {
        alert("Пожалуйста, опишите свой сон немного подробнее. Минимум 10 символов.");
        return;
    }

    if (!dreamText || isLoading || !userId) return;

    const userMessage: ChatMessage = { role: 'user', text: dreamText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await interpretDream(dreamText, parseInt(userId));
      const botMessage: ChatMessage = { role: 'bot', text: response.interpretation };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Пытаемся получить текст ошибки от бэкенда
      let errorText = "Произошла ошибка. Пожалуйста, попробуйте отправить сообщение еще раз.";
      if (error instanceof Error && (error as any).response) {
          const responseError = await (error as any).response.json();
          errorText = responseError.detail || errorText;
      }
      const errorMessage: ChatMessage = { role: 'bot', text: errorText };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayBrowserTTS = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ru-RU';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Извините, ваш браузер не поддерживает озвучку текста.");
    }
  };

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Извините, ваш браузер не поддерживает распознавание речи.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <header className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shadow-md z-10">
        <h1 className="text-xl font-bold text-white">ИИ Сонник</h1>
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors">
            <LogoutIcon />
            Выйти
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <BotIcon />
              </div>
            )}
            <div className={`max-w-md md:max-w-lg lg:max-w-2xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                <p className="text-white whitespace-pre-wrap">{msg.text}</p>
            </div>

            {msg.role === 'bot' && (
                <button
                    onClick={() => handlePlayBrowserTTS(msg.text)}
                    className="self-center p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                    aria-label="Озвучить сообщение"
                >
                    <SpeakerIcon/>
                </button>
             )}

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                <UserIcon />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <BotIcon />
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-slate-700 rounded-bl-none">
                    <TypingIndicator />
                </div>
            </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
        <form onSubmit={handleSendMessage} className="flex items-center max-w-4xl mx-auto gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? 'Слушаю...' : "Опишите ваш сон..."}
            className="flex-1 w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-full shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading || isRecording}
          />
          <button
            type="button"
            onClick={handleToggleRecording}
            className={`p-3 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 animate-pulse ring-2 ring-offset-2 ring-offset-slate-800 ring-red-500' : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'}`}
            disabled={isLoading}
            aria-label={isRecording ? 'Остановить запись' : 'Начать голосовой ввод'}
          >
            <MicrophoneIcon />
          </button>
          <button
            type="submit"
            className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            disabled={!input.trim() || isLoading || isRecording}
          >
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatScreen;