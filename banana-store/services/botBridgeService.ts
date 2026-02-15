import { Product } from '../types';
import { Order, User } from './storageService';

interface BridgeResponse {
  ok?: boolean;
  reply?: string;
  message?: string;
}

const API_BASE_URL = ((import.meta.env.VITE_BOT_API_URL as string | undefined) || '').trim().replace(/\/$/, '');
const API_PREFIX = ((import.meta.env.VITE_BOT_API_PREFIX as string | undefined) || '/api/bot').trim() || '/api/bot';
const API_KEY = (import.meta.env.VITE_BOT_API_KEY as string | undefined) || '';
const API_KEY_HEADER = ((import.meta.env.VITE_BOT_API_KEY_HEADER as string | undefined) || 'x-api-key').toLowerCase();
const API_AUTH_SCHEME = (import.meta.env.VITE_BOT_API_AUTH_SCHEME as string | undefined) || '';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_BOT_API_TIMEOUT_MS || 10000);

const buildHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (API_KEY) {
    const value = API_AUTH_SCHEME ? `${API_AUTH_SCHEME} ${API_KEY}` : API_KEY;
    headers[API_KEY_HEADER] = value;
  }

  return headers;
};

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: API_BASE_URL ? 'omit' : 'same-origin'
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bridge request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
};

export const BotBridgeService = {
  askBot: async (message: string, products: Product[]): Promise<string> => {
    const data = await post<BridgeResponse>(`${API_PREFIX}/chat`, { message, products });
    return data.reply || 'I could not generate a recommendation right now. Please try again.';
  },

  sendOrder: async (order: Order, user: User | null, paymentMethod: string): Promise<void> => {
    await post<BridgeResponse>(`${API_PREFIX}/order`, { order, user, paymentMethod });
  }
};
