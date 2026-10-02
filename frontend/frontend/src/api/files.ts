import { apiClient } from './client';

export async function fetchFileContent(serverId: string, filename: string) {
  const res = await apiClient.get<{ filename: string; content: string }>(
    `/servers/${serverId}/files/${filename}`,
  );
  return res.data.content;
}

export async function updateFileContent(
  serverId: string,
  filename: string,
  content: string,
) {
  const res = await apiClient.put<{ success: boolean; needsRestart: boolean }>(
    `/servers/${serverId}/files/${filename}`,
    { content },
  );
  return res.data;
}
