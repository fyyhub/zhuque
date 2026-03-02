import request from '@/utils/request';

export const authApi = {
  login: (username: string, password: string) =>
    request.post<{ token: string }>('/auth/login', { username, password }),
};
