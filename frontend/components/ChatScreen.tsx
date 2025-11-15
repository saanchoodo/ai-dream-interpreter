import React, {useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { BotIcon, UserIcon, SendIcon, LogoutIcon, SpeakerIcon, MicrophoneIcon } from './icons';
import { interpretDream, getChatHistory, ApiError, createInvoice } from '../apiClient';

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

const wittyLoadingMessages = [
    "Анализируем сон на предмет застрявшей между зубов котлеты...",
    "Сверяюсь с лунным календарем и курсом криптовалют...",
    "Ищу в вашем сне скрытые символы... пока нашел только кота.",
    "Подключаюсь к астралу... пожалуйста, оставайтесь на линии.",
    "Расшифровываю послание Морфея... он пишет неразборчиво.",
    "Прогоняю ваш сон через нейронную сеть снов... кажется, ей понравилось.",
    "Так, так... очень интересный случай. Консультируюсь с Фрейдом по Зуму.",
];

const ChatScreen: React.FC<ChatScreenProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const wittyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePaymentClick = async () => {
    try {
      const response = await createInvoice(user.id);
      window.open(response.payment_url, '_blank');
    } catch (error) {
      console.error("Ошибка создания счета:", error);
      alert("Не удалось создать ссылку на оплату. Попробуйте позже.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const history = await getChatHistory(user.id);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            { role: 'bot', text: `Здравствуйте, ${user.firstName}! Я - ваш персональный толкователь снов. Расскажите, что вам приснилось, и я помогу раскрыть тайны вашего подсознания.` }
          ]);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
        setMessages([
            { role: 'bot', text: `Здравствуйте, ${user.firstName}! Не удалось загрузить вашу историю переписки. Но вы можете начать новый диалог.` }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.firstName]);

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

  const handlePlayBrowserTTS = (textToSpeak: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert("Извините, ваш браузер не поддерживает озвучку текста.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setCurrentlyPlayingIndex(null);
      if (currentlyPlayingIndex === index) {
        return;
      }
    }

    if (!isTtsEnabled) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ru-RU';
    utterance.onstart = () => setCurrentlyPlayingIndex(index);
    utterance.onend = () => setCurrentlyPlayingIndex(null);
    window.speechSynthesis.speak(utterance);
  };

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
    const tempBotMessage: ChatMessage = { role: 'bot', text: 'indicator' };

    setMessages((prev) => [...prev, userMessage, tempBotMessage]);
    setInput('');
    setIsLoading(true);

    if (wittyIntervalRef.current) clearInterval(wittyIntervalRef.current);

    let wittyIndex = 0;
    wittyIntervalRef.current = setInterval(() => {
        setMessages(prev => {
            const newText = wittyLoadingMessages[wittyIndex % wittyLoadingMessages.length];
            wittyIndex++;
            return [...prev.slice(0, -1), { role: 'bot', text: newText }];
        });
    }, 2000);

    try {
      const response = await interpretDream(dreamText, parseInt(userId));
      const botMessage: ChatMessage = { role: 'bot', text: response.interpretation };
      // Запоминаем текущую длину массива сообщений, чтобы правильно передать индекс
      const newIndex = messages.length;
      setMessages((prev) => [...prev.slice(0, -1), botMessage]);
    } catch (error) {
        console.error("Failed to send message:", error);
        let errorText = "Произошла ошибка. Пожалуйста, попробуйте отправить сообщение еще раз.";
        if (error instanceof ApiError) {
          errorText = error.data.detail || errorText;
        }
        const errorMessage: ChatMessage = { role: 'bot', text: errorText };
        setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
        setIsLoading(false);
        if (wittyIntervalRef.current) {
            clearInterval(wittyIntervalRef.current);
        }
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
        <div className="flex items-center gap-4">

          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors">
              <LogoutIcon />
              Выйти
          </button>
        </div>
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
                {msg.text === 'indicator' ? <TypingIndicator /> : <p className="text-white whitespace-pre-wrap">{msg.text}</p>}
            </div>
            {msg.role === 'bot' && (
                <button
                    onClick={() => handlePlayBrowserTTS(msg.text, index)}
                    className={`self-center p-2 rounded-full transition-colors ${
                        currentlyPlayingIndex === index 
                        ? 'text-indigo-400 animate-pulse' 
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    } ${msg.text === 'indicator' || wittyLoadingMessages.includes(msg.text) ? 'invisible' : ''}`}
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
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
          <div className="flex items-start max-w-4xl mx-auto gap-2">
            <button
              onClick={handlePaymentClick}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium uppercase tracking-wider text-amber-300 bg-amber-900/50 rounded-full hover:bg-amber-800/50 transition-colors"
              aria-label="Получить премиум-толкование"
            >
              <span className="text-lg">✨</span>
              <span>ПРЕМИУМ</span>
            </button>
            <form onSubmit={handleSendMessage} className="flex items-start flex-1 gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                    }
                }}
                placeholder={isRecording ? 'Слушаю...' : "Опишите ваш сон..."}
                className="flex-1 w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-y-hidden"
                disabled={isLoading || isRecording}
              />
              <div className="flex-shrink-0 flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`p-3 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'}`}
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
              </div>
            </form>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;