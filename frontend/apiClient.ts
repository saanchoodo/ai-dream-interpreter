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

// --- ИНТЕРФЕЙСЫ ДЛЯ ТИПИЗАЦИИ ---

// Интерфейс для одной пары "вопрос-ответ" гостя
interface GuestMessagePayload {
    request_text: string;
    response_text: string;
}

// --- 1. ОБНОВЛЯЕМ ИНТЕРФЕЙС ДАННЫХ ДЛЯ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ ---
interface CreateUserPayload {
    first_name: string;
    last_name?: string | null;
    dob: string;
    phone: string;
    guest_messages?: GuestMessagePayload[]; // Добавляем опциональное поле
}

interface UserResponse {
    id: number;
    first_name: string;
    last_name?: string | null;
    dob: string;
    phone: string;
}

// --- ФУНКЦИИ API ---

// Функция для регистрации нового пользователя (код остается без изменений, т.к. он уже принимает payload)
export const createUser = async (payload: CreateUserPayload): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }

    return response.json();
};

// Функция для отправки сна от ГОСТЯ
export const interpretGuestDream = async (text: string): Promise<{ interpretation: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/interpret_guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }
    return response.json();
};

// Функция для отправки сна от ЗАРЕГИСТРИРОВАННОГО пользователя
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

// Функция для получения истории чата
export const getChatHistory = async (userId: number): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/history`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }
    return response.json();
};

// Функция для создания счета на оплату
export const createInvoice = async (userId: number): Promise<{ payment_url: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/payment/create_invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: 100.0 })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response, errorData);
    }

    return response.json();
};