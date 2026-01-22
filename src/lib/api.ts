import type { Person, Link, FeatureRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// People API
export const peopleApi = {
  getAll: (): Promise<Person[]> => fetchApi<Person[]>('/api/people'),

  getById: (id: string): Promise<Person> => fetchApi<Person>(`/api/people/${id}`),

  create: (person: Person): Promise<Person> =>
    fetchApi<Person>('/api/people', {
      method: 'POST',
      body: JSON.stringify(person),
    }),

  update: (id: string, person: Partial<Person>): Promise<Person> =>
    fetchApi<Person>(`/api/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(person),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi<void>(`/api/people/${id}`, {
      method: 'DELETE',
    }),
};

// Links API
export const linksApi = {
  getAll: (): Promise<Link[]> => fetchApi<Link[]>('/api/links'),

  getById: (id: string): Promise<Link> => fetchApi<Link>(`/api/links/${id}`),

  create: (link: Link): Promise<Link> =>
    fetchApi<Link>('/api/links', {
      method: 'POST',
      body: JSON.stringify(link),
    }),

  update: (id: string, link: Partial<Link>): Promise<Link> =>
    fetchApi<Link>(`/api/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(link),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi<void>(`/api/links/${id}`, {
      method: 'DELETE',
    }),
};

// Feature Requests API
export const featureRequestsApi = {
  getAll: (): Promise<FeatureRequest[]> => fetchApi<FeatureRequest[]>('/api/feature-requests'),

  create: (request: FeatureRequest): Promise<FeatureRequest> =>
    fetchApi<FeatureRequest>('/api/feature-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi<void>(`/api/feature-requests/${id}`, {
      method: 'DELETE',
    }),
};

// Fetch all data at once
export async function fetchAllData(): Promise<{ people: Person[]; links: Link[] }> {
  const [people, links] = await Promise.all([
    peopleApi.getAll(),
    linksApi.getAll(),
  ]);
  return { people, links };
}
