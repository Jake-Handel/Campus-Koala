/**
 * Get CSRF token from cookies
 * @returns CSRF token or null if not found
 */
const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split('; X-CSRFToken=');
    
    if (parts.length === 2) {
      const part = parts.pop();
      if (part) {
        return part.split(';').shift() || null;
      }
    }
  } catch (error) {
    console.error('Error getting CSRF token:', error);
  }
  
  return null;
};

/**
 * Get JWT token from localStorage
 * @returns JWT token or null if not found
 */
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
  headers?: Headers;
}

/**
 * Make an API request with CSRF and JWT token handling
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Promise with the API response
 */
export async function api<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Get tokens
  const csrfToken = getCsrfToken();
  const authToken = getAuthToken();
  
  // Set up headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002',
    ...(options.headers as Record<string, string> || {})
  });
  
  // Add CSRF token if available
  if (csrfToken) {
    headers.set('X-CSRFToken', csrfToken);
  }
  
  // Add Authorization header if user is logged in
  if (authToken) {
    // Ensure the token has the Bearer prefix
    const token = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    headers.set('Authorization', token);
    console.log('Adding Authorization header to request');
  } else {
    console.log('No auth token available for request');
  }
  
  // Prepare request options
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' as const, // Important for cookies and credentials
    mode: 'cors',
    cache: 'no-cache',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    // Add CORS headers for preflight
    ...(options.method && options.method.toUpperCase() !== 'GET' && {
      headers: {
        ...headers,
        'Access-Control-Allow-Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002',
        'Access-Control-Allow-Credentials': 'true',
      },
    }),
  };

  // Ensure URL is properly formatted
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const apiUrl = url.startsWith('http')
    ? url
    : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    
  // Ensure we don't double-add the base URL
  const finalUrl = apiUrl.replace(/([^:]\/)\/+/g, '$1'); // Remove double slashes
  
  console.log('API Request:', {
    url: finalUrl,
    method: options.method || 'GET',
    headers: Object.fromEntries(headers.entries()),
    body: options.body
  });
  
  try {
    console.log(`Making request to: ${apiUrl}`, { requestOptions });
    const response = await fetch(apiUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Response status: ${response.status} ${response.statusText}`, {
      url: apiUrl,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      
      // Only redirect if we're in the browser and not on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      
      // Try to get error message from response
      let errorMessage = 'Your session has expired. Please log in again.';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      return {
        error: errorMessage,
        status: 401,
        headers: response.headers,
      };
    }
    
    // Handle successful response (status 200-299)
    if (response.ok) {
      // Check if response has content
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('Response data:', data);
          return { 
            data, 
            status: response.status, 
            headers: response.headers,
            error: undefined
          };
        }
        
        // For non-JSON responses
        const text = await response.text();
        console.log('Non-JSON response:', text);
        return { 
          data: text as unknown as T, 
          status: response.status, 
          headers: response.headers,
          error: undefined
        };
      } catch (e) {
        console.error('Error parsing response:', e);
        return {
          error: 'Error parsing server response',
          status: response.status,
          headers: response.headers,
          data: undefined
        };
      }
    }
    
    // Handle error responses
    let error = `Request failed with status ${response.status}`;
    let errorData: any = null;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        error = errorData.message || errorData.error || JSON.stringify(errorData);
      } else {
        error = await response.text() || error;
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
      try {
        error = await response.text() || error;
      } catch (textError) {
        console.error('Error reading error response as text:', textError);
      }
    }
    
    console.error('API Error:', {
      url: apiUrl,
      status: response.status,
      error,
      errorData,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    return {
      error,
      status: response.status,
      headers: response.headers,
      data: errorData || undefined
    };  
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
    };
  }
}

/**
 * Helper function for GET requests
 */
export async function get<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return api<T>(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Helper function for POST requests
 */
export async function post<T = any>(
  url: string, 
  data: any, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return api<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Helper function for PUT requests
 */
export async function put<T = any>(
  url: string, 
  data: any, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return api<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Helper function for DELETE requests
 */
export async function del<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return api<T>(url, {
    ...options,
    method: 'DELETE',
  });
}

// Helper function for common HTTP methods
export const apiHelper = {
  get: <T = any>(url: string) => get<T>(url),
  post: <T = any>(url: string, body?: any) => post<T>(url, body),
  put: <T = any>(url: string, body?: any) => put<T>(url, body),
  delete: <T = any>(url: string) => del<T>(url),
  patch: <T = any>(url: string, body?: any) => 
    api<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
