import { apiClient } from './client';
import { CreateServerPayload, ServerInstance, ServerStats } from '../types/server';

export async function fetchServers() {
  const res = await apiClient.get<ServerInstance[]>('/servers');
  return res.data;
}

export async function fetchServer(id: string) {
  const res = await apiClient.get<ServerInstance>(`/servers/${id}`);
  return res.data;
}

export async function createServer(payload: CreateServerPayload) {
  const res = await apiClient.post<ServerInstance>('/servers', payload);
  return res.data;
}

export async function startServer(id: string) {
  await apiClient.post(`/servers/${id}/start`);
}

export async function stopServer(id: string) {
  await apiClient.post(`/servers/${id}/stop`);
}

export async function restartServer(id: string) {
  await apiClient.post(`/servers/${id}/restart`);
}

export async function deleteServer(id: string) {
  await apiClient.delete(`/servers/${id}`);
}

export async function fetchStats(id: string) {
  const res = await apiClient.get<ServerStats>(`/servers/${id}/stats`);
  return res.data;
}

export async function execCommand(id: string, command: string) {
  const res = await apiClient.post<string>(`/servers/${id}/command`, {
    command,
  });
  return res.data;
}
