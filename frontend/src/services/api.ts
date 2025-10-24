const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  skipDefaultHeaders?: boolean;
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipDefaultHeaders, headers, body, ...rest } = options;
  const isJsonBody = Boolean(body) && !skipDefaultHeaders;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: isJsonBody
      ? {
          'Content-Type': 'application/json',
          ...headers,
        }
      : headers,
    body,
    ...rest,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data as T;
}

export interface CreateClientPayload {
  nome: string;
  endereco: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  nomeEmpresa?: string;
  cnpj?: string;
}

export interface CreateSupplierPayload {
  nome: string;
  contato: string;
  telefone?: string;
}

export interface CreateProductPayload {
  nome: string;
  categoria?: string;
  estoque?: number;
  price: number;
}

export interface UpdateBudgetStatusPayload {
  status: string;
}

export const api = {
  clients: {
    list: () => request('/clients'),
    create: (payload: CreateClientPayload) => request('/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: string, payload: CreateClientPayload) => request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    remove: (id: string) => request<void>(`/clients/${id}`, { method: 'DELETE' }),
  },
  suppliers: {
    list: () => request('/suppliers'),
    create: (payload: CreateSupplierPayload) => request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: string, payload: CreateSupplierPayload) => request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    remove: (id: string) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => request('/products'),
    create: (payload: CreateProductPayload) => request('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: string, payload: CreateProductPayload) => request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    remove: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  },
  budgets: {
    list: () => request('/budgets'),
    get: (id: string) => request(`/budgets/${id}`),
    create: (payload: unknown) => request('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    updateStatus: (id: string, payload: UpdateBudgetStatusPayload) => request(`/budgets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  },
};
