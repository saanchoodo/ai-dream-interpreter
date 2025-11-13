
export interface User {
    id: number;
  name: string;
  birthDate: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}
