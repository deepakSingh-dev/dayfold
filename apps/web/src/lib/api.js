/**
 * Thin fetch wrapper for the JSON API. Throws an Error with the server's
 * message on non-2xx so TanStack Query's onError/toasts can surface it.
 */
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Projects
  listProjects: () => request('/api/projects'),
  createProject: (body) => request('/api/projects', { method: 'POST', body }),
  updateProject: (id, body) => request(`/api/projects/${id}`, { method: 'PATCH', body }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
  restoreProject: (id) => request(`/api/projects/${id}/restore`, { method: 'POST' }),
  projectData: (id) => request(`/api/projects/${id}/data`),

  // Sections
  createSection: (body) => request('/api/sections', { method: 'POST', body }),
  updateSection: (id, body) => request(`/api/sections/${id}`, { method: 'PATCH', body }),
  deleteSection: (id) => request(`/api/sections/${id}`, { method: 'DELETE' }),

  // Tasks
  createTask: (body) => request('/api/tasks', { method: 'POST', body }),
  getTask: (id) => request(`/api/tasks/${id}`),
  updateTask: (id, body) => request(`/api/tasks/${id}`, { method: 'PATCH', body }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  restoreTask: (id) => request(`/api/tasks/${id}/restore`, { method: 'POST' }),

  // Docs (editor)
  getTaskDoc: (taskId) => request(`/api/tasks/${taskId}/doc`),
  saveDoc: (docId, body) => request(`/api/docs/${docId}`, { method: 'PUT', body }),

  // Uploads
  uploadImage: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Upload failed');
    return data; // { url, filename, size }
  },

  // Aggregates
  myTasks: () => request('/api/my-tasks'),
  trash: () => request('/api/trash'),
};

/** Stable TanStack Query keys. */
export const queryKeys = {
  projects: ['projects'],
  projectData: (id) => ['project-data', id],
  task: (id) => ['task', id],
  myTasks: ['my-tasks'],
  trash: ['trash'],
};
