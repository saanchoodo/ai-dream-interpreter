// frontend/apiClient.ts

const API_BASE_URL = 'https://ai-dream-interpreter.onrender.com';

// Функция для регистрации нового пользователя
export const createUser = async (name: string, dob: string): Promise<{ id: number; name: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dob })
    });
    if (!response.ok) {
        throw new Error('Failed to create user');
    }
    return response.json();
};

// Функция для отправки сна
export const interpretDream = async (text: string, userId: number): Promise<{ interpretation: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user_id: userId })
    });
    if (!response.ok) {
        throw new Error('Failed to get interpretation');
    }
    return response.json();
};

export const getChatHistory = async (userId: number): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/history`);
    if (!response.ok) {
        throw new Error('Failed to get chat history');
    }
    return response.json();
};