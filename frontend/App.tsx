import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // --- 1. ОБНОВЛЕННАЯ ЛОГИКА ПРОВЕРКИ СЕССИИ ---
  useEffect(() => {
    // Пытаемся достать все данные пользователя из хранилища браузера
    const storedUserId = localStorage.getItem('dream_user_id');
    const storedUserFirstName = localStorage.getItem('dream_user_firstName');
    const storedUserLastName = localStorage.getItem('dream_user_lastName');
    const storedUserDob = localStorage.getItem('dream_user_dob');
    const storedUserPhone = localStorage.getItem('dream_user_phone');

    // Если есть хотя бы ID и имя, считаем, что пользователь вошел в систему
    if (storedUserId && storedUserFirstName && storedUserDob && storedUserPhone) {
      setUser({
        id: parseInt(storedUserId),
        firstName: storedUserFirstName,
        // lastName может быть null, поэтому проверяем его наличие
        lastName: storedUserLastName === 'null' ? null : storedUserLastName,
        dob: storedUserDob,
        phone: storedUserPhone,
      });
    }
  }, []); // Пустой массив зависимостей = выполнится только один раз

  // --- 2. ОБНОВЛЕННАЯ ФУНКЦИЯ ЛОГИНА ---
  const handleLogin = (loggedInUser: User) => {
    // Сохраняем все новые поля в localStorage
    localStorage.setItem('dream_user_id', String(loggedInUser.id));
    localStorage.setItem('dream_user_firstName', loggedInUser.firstName);
    // lastName может быть null, поэтому сохраняем его как строку 'null'
    localStorage.setItem('dream_user_lastName', String(loggedInUser.lastName));
    localStorage.setItem('dream_user_dob', loggedInUser.dob);
    localStorage.setItem('dream_user_phone', loggedInUser.phone);

    // Устанавливаем пользователя в состояние, чтобы переключить экран
    setUser(loggedInUser);
  };

  // --- 3. ОБНОВЛЕННАЯ ФУНКЦИЯ ВЫХОДА ---
  const handleLogout = () => {
    // Очищаем все ключи из localStorage при выходе
    localStorage.removeItem('dream_user_id');
    localStorage.removeItem('dream_user_firstName');
    localStorage.removeItem('dream_user_lastName');
    localStorage.removeItem('dream_user_dob');
    localStorage.removeItem('dream_user_phone');
    setUser(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900">
      {user ? <ChatScreen user={user} onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />}
    </div>
  );
};

export default App;