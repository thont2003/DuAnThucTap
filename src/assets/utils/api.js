import { BASE_URL } from './constants';

export const apiCall = async (method, endpoint, data) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : null,
    });
    let responseData = null;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      responseData = null;
    }
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};