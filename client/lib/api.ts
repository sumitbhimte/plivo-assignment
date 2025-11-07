// API client configuration
// Client should use this to make API calls to the Express server

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper to get auth token (for server-side usage)
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // For server-side, we'll pass the session token via headers
  // Clerk Express middleware will handle authentication
  return headers;
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers,
      credentials: "include", // Include cookies for authentication
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
};

