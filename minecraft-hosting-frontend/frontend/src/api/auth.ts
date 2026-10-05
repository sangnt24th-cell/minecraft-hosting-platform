import { apiClient } from './client';

export interface AuthResponse {
  accessToken: string;
  user: { id: string; username: string; email: string; role: string };
}

export async function login(username: string, password: string) {
  const res = await apiClient.post<AuthResponse>('/auth/login', {
    username,
    password,
  });
  return res.data;
}

export async function register(
  username: string,
  email: string,
  password: string,
) {
  const res = await apiClient.post<AuthResponse>('/auth/register', {
    username,
    email,
    password,
  });
  return res.data;
}
