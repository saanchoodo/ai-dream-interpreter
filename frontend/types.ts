// frontend/types.ts

export interface User {
  id: number;
  firstName: string; // Используем camelCase
  lastName: string | null; // Фамилия может отсутствовать
  dob: string;
  phone: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}