import React, { useState, useEffect } from 'react';
import ChatScreen from './components/ChatScreen';
import RegisterModal from './components/RegisterModal';
import { User, ChatMessage } from './types';

// Вынесем приветствие в константу для переиспользования
const GUEST_WELCOME_MESSAGE: ChatMessage = {
    role: 'bot',
    text: `Здравствуйте! Я - ваш персональный толкователь снов. Расскажите, что вам приснилось, и я помогу раскрыть тайны вашего подсознания.`
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [guestMessages, setGuestMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Проверяем localStorage при запуске
    const storedUserId = localStorage.getItem('dream_user_id');
    const storedUserFirstName = localStorage.getItem('dream_user_firstName');
    const storedUserLastName = localStorage.getItem('dream_user_lastName');
    const storedUserDob = localStorage.getItem('dream_user_dob');
    const storedUserPhone = localStorage.getItem('dream_user_phone');

    if (storedUserId && storedUserFirstName && storedUserDob && storedUserPhone) {
      setUser({
        id: parseInt(storedUserId),
        firstName: storedUserFirstName,
        lastName: storedUserLastName === 'null' ? null : storedUserLastName,
        dob: storedUserDob,
        phone: storedUserPhone,
      });
      setIsGuest(false);
    } else {
      // Если пользователя нет, он - гость. Даем ему приветствие.
      setIsGuest(true);
      setGuestMessages([GUEST_WELCOME_MESSAGE]);
    }
  }, []);

  const handleRegisterSuccess = (registeredUser: User) => {
    localStorage.setItem('dream_user_id', String(registeredUser.id));
    localStorage.setItem('dream_user_firstName', registeredUser.firstName);
    localStorage.setItem('dream_user_lastName', String(registeredUser.lastName));
    localStorage.setItem('dream_user_dob', registeredUser.dob);
    localStorage.setItem('dream_user_phone', registeredUser.phone);

    setUser(registeredUser);
    setIsGuest(false);
    setShowRegisterModal(false);
    // Очищаем временные гостевые сообщения
    setGuestMessages([]);
  };

  // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ВЫХОДА ---
  const handleLogout = () => {
    // Очищаем данные пользователя
    localStorage.removeItem('dream_user_id');
    localStorage.removeItem('dream_user_firstName');
    // ... (удаляем остальные user поля)

    // Устанавливаем флаг, что гостевая попытка использована
    localStorage.setItem('guest_attempt_used', 'true');

    // Сбрасываем состояние
    setUser(null);
    setIsGuest(true);
    // Теперь чат для вышедшего пользователя будет пустым, но ввод будет заблокирован
    setGuestMessages([]);
  };
  // --- КОНЕЦ ИСПРАВЛЕНИЙ ---

  return (
    <div className="w-full min-h-screen bg-slate-900">
      <ChatScreen
        user={user}
        isGuest={isGuest}
        guestMessages={guestMessages}
        setGuestMessages={setGuestMessages}
        onLogout={handleLogout}
        onRequestRegister={() => setShowRegisterModal(true)}
      />
      {showRegisterModal && (
        <RegisterModal
          guestMessages={guestMessages}
          onRegisterSuccess={handleRegisterSuccess}
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
};

export default App;