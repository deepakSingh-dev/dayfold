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
  syncToken: (docId) => request(`/api/sync/token?docId=${docId}`),

  // Custom fields
  listFields: (projectId) => request(`/api/projects/${projectId}/fields`),
  createField: (projectId, body) =>
    request(`/api/projects/${projectId}/fields`, { method: 'POST', body }),
  updateField: (id, body) => request(`/api/fields/${id}`, { method: 'PATCH', body }),
  deleteField: (id) => request(`/api/fields/${id}`, { method: 'DELETE' }),
  setTaskField: (taskId, body) => request(`/api/tasks/${taskId}/fields`, { method: 'PUT', body }),

  // Dependencies
  addDependency: (taskId, dependsOnTaskId) =>
    request(`/api/tasks/${taskId}/dependencies`, { method: 'POST', body: { dependsOnTaskId } }),
  removeDependency: (depId) => request(`/api/dependencies/${depId}`, { method: 'DELETE' }),

  me: () => request('/api/me'),

  // Comments
  listComments: (taskId) => request(`/api/tasks/${taskId}/comments`),
  addComment: (taskId, body) =>
    request(`/api/tasks/${taskId}/comments`, { method: 'POST', body: { body } }),
  updateComment: (id, body) => request(`/api/comments/${id}`, { method: 'PATCH', body: { body } }),
  deleteComment: (id) => request(`/api/comments/${id}`, { method: 'DELETE' }),

  // Attachments
  uploadAttachment: async (taskId, file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Upload failed');
    return data;
  },
  deleteAttachment: (id) => request(`/api/attachments/${id}`, { method: 'DELETE' }),

  // Turn into task
  createTaskBlock: (body) => request('/api/task-blocks', { method: 'POST', body }),

  // Uploads
  uploadImage: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Upload failed');
    return data; // { url, filename, size }
  },

  // Notes pages
  listPages: () => request('/api/pages'),
  createPage: (body) => request('/api/pages', { method: 'POST', body }),
  getPage: (id) => request(`/api/pages/${id}`),
  updatePage: (id, body) => request(`/api/pages/${id}`, { method: 'PATCH', body }),
  deletePage: (id) => request(`/api/pages/${id}`, { method: 'DELETE' }),
  restorePage: (id) => request(`/api/pages/${id}/restore`, { method: 'POST' }),

  // Aggregates
  myTasks: () => request('/api/my-tasks'),
  trash: () => request('/api/trash'),
};

/** Stable TanStack Query keys. */
export const queryKeys = {
  projects: ['projects'],
  projectData: (id) => ['project-data', id],
  task: (id) => ['task', id],
  pages: ['pages'],
  page: (id) => ['page', id],
  myTasks: ['my-tasks'],
  trash: ['trash'],
};
