import React, { useState, useEffect } from 'react'; // <--- 1. Импортируем useEffect
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // --- 2. ДОБАВЛЯЕМ ЛОГИКУ ПРОВЕРКИ СЕССИИ ПРИ ЗАПУСКЕ ---
  useEffect(() => {
    // Пытаемся достать ID пользователя из хранилища браузера
    const storedUserId = localStorage.getItem('dream_user_id');
    const storedUserName = localStorage.getItem('dream_user_name');
    const storedUserDob = localStorage.getItem('dream_user_dob');

    // Если все данные есть, считаем, что пользователь уже вошел в систему
    if (storedUserId && storedUserName && storedUserDob) {
      setUser({
        id: parseInt(storedUserId),
        name: storedUserName,
        birthDate: storedUserDob,
      });
    }
  }, []); // Пустой массив зависимостей означает, что этот код выполнится только один раз при запуске

  // --- 3. АДАПТИРУЕМ ФУНКЦИЮ ЛОГИНА ---
  // Теперь она будет принимать объект User целиком от LoginScreen
  const handleLogin = (loggedInUser: User) => {
    // Сохраняем все данные о пользователе в localStorage, чтобы "запомнить" его
    localStorage.setItem('dream_user_id', String(loggedInUser.id));
    localStorage.setItem('dream_user_name', loggedInUser.name);
    localStorage.setItem('dream_user_dob', loggedInUser.birthDate);
    
    // Устанавливаем пользователя в состояние, что вызовет переключение на экран чата
    setUser(loggedInUser);
  };
  
  const handleLogout = () => {
    // Очищаем localStorage при выходе
    localStorage.removeItem('dream_user_id');
    localStorage.removeItem('dream_user_name');
    localStorage.removeItem('dream_user_dob');
    setUser(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900">
      {user ? <ChatScreen user={user} onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />}
    </div>
  );
};

export default App;