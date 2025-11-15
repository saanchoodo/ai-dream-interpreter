const API_BASE_URL = 'http://localhost:8000';

// Определяем кастомный класс ошибки, чтобы хранить в нем ответ сервера
export class ApiError extends Error {
    response: Response;
    data: any;

    constructor(response: Response, data: any) {
        super(`API Error: ${response.status}`);
        this.response = response;
        this.data = data;
    }
}

// Определяем интерфейс для данных, которые мы отправляем
interface CreateUserPayload {
    first_name: string;
    last_name?: string | null;
    dob: string;
    phone: string;
}

// Определяем интерфейс для ответа от бэкенда
interface UserResponse {
    id: number;
    first_name: string;
    last_name?: string | null;
    dob: string;
    phone: string;
}

// Функция для регистрации нового пользователя
export const createUser = async (payload: CreateUserPayload): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        // Создаем и "выбрасываем" нашу кастомную ошибку
        throw new ApiError(response, errorData);
    }

    return response.json();
};

// Функция для отправки сна (остается без изменений)
export const interpretDream = async (text: string, userId: number): Promise<{ interpretation: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user_id: userId })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }
    return response.json();
};

export const getChatHistory = async (userId: number): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/history`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }
    return response.json();
};

// frontend/apiClient.ts
// ... (ApiError, createUser, interpretDream, getChatHistory) ...

// --- НОВАЯ ФУНКЦИЯ ---
export const createInvoice = async (userId: number): Promise<{ payment_url: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/payment/create_invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: 100.0 }) // Можно передавать и другие параметры
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }

    return response.json();
};