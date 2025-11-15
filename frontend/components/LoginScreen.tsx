import React, { useState } from 'react';
import { User } from '../types';
import { MoonIcon } from './icons';
import { createUser, ApiError } from '../apiClient'; // Убираем 'loginUser'

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !birthDate || !phone.trim()) {
      setError('Имя, дата рождения и телефон обязательны для заполнения.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Вызываем единый "умный" эндпоинт. Бэкенд сам решит, что делать.
      const userFromApi = await createUser({
        first_name: firstName,
        last_name: lastName || null,
        dob: birthDate,
        phone: phone,
      });

      const loggedInUser: User = {
        id: userFromApi.id,
        firstName: userFromApi.first_name,
        lastName: userFromApi.last_name,
        dob: userFromApi.dob,
        phone: userFromApi.phone,
      };

      onLogin(loggedInUser);

    } catch (err) {
      // Ловим и отображаем любую ошибку от бэкенда (включая 409)
      if (err instanceof ApiError) {
        setError(err.data.detail || "Произошла неизвестная ошибка.");
      } else {
        setError('Не удалось связаться с сервером. Попробуйте снова.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl ring-1 ring-white/10">
        <div className="text-center">
            <div className="mx-auto h-16 w-16 text-indigo-400">
                <MoonIcon />
            </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">ИИ Сонник</h1>
          <p className="mt-2 text-lg text-slate-400">Раскройте тайны своих снов. Давайте начнем.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">Имя</label>
            <div className="mt-1">
              <input id="firstName" name="firstName" type="text" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Введите ваше имя" disabled={isLoading} />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">Фамилия <span className="text-slate-500">(необязательно)</span></label>
            <div className="mt-1">
              <input id="lastName" name="lastName" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Введите вашу фамилию" disabled={isLoading} />
            </div>
          </div>
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-slate-300">Дата рождения</label>
            <div className="mt-1">
              <input id="birthdate" name="birthdate" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="block w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading} />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300">Номер телефона</label>
            <div className="mt-1">
              <input id="phone" name="phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="+7 (999) 999-99-99" disabled={isLoading} />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Вход...' : 'Начать сессию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;