import React, { useState } from 'react';
import { User } from '../types'; // <--- 1. Возвращаем импорт типа User
import { MoonIcon } from './icons';
import { createUser } from '../apiClient';

// <--- 2. Меняем интерфейс пропсов, чтобы onLogin снова принимал объект User
interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- 3. ГЛАВНОЕ ИЗМЕНЕНИЕ ВНУТРИ handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) {
      setError('Please enter your name and birth date.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Вызываем API, он вернет объект с id и name (как настроено на бэкенде)
      const userFromApi = await createUser(name, birthDate);

      // Формируем ПОЛНЫЙ объект пользователя, который ожидает App.tsx
      const loggedInUser: User = {
        id: userFromApi.id,
        name: name, // Берем имя, которое пользователь только что ввел
        birthDate: birthDate, // И дату рождения
      };

      // Вызываем onLogin и передаем в него весь объект
      onLogin(loggedInUser);

    } catch (err) {
      console.error("Ошибка при создании пользователя:", err);
      setError('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl ring-1 ring-white/10">
        <div className="text-center">
            <div className="mx-auto h-16 w-16 text-indigo-400">
                <MoonIcon />
            </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI Sleep Reader
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Unlock insights into your sleep. Let's get started.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">
              Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your first name"
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-slate-300">
              Birth Date
            </label>
            <div className="mt-1">
              <input
                id="birthdate"
                name="birthdate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Begin Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;