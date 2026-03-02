import request from '@/utils/request';
import type { Log } from '@/types';

export interface LogListResponse {
  data: Log[];
  total: number;
  page: number;
  page_size: number;
}

export const logApi = {
  list: (taskId?: number, page = 1, pageSize = 10) =>
    request.get<LogListResponse>('/logs', { params: { task_id: taskId, page, page_size: pageSize } }),
  cleanup: (days: number) => request.delete(`/logs/cleanup/${days}`),
};
