import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../utils/api';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const loginData = { 
        username: username.trim(),
        password: password
      };
      
      console.log('Attempting login with:', { ...loginData, password: '***' });
      
      // Make the login request with credentials
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': window.location.origin
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(loginData),
      });
      
      console.log('Login response status:', response.status);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Invalid server response format');
      }
      
      const data = await response.json().catch(error => {
        console.error('Error parsing JSON response:', error);
        throw new Error('Failed to parse server response');
      });
      
      console.log('Login response data:', data);
      
      if (!response.ok) {
        const errorMessage = data?.error || `Login failed with status ${response.status}`;
        console.error('Login error:', {
          status: response.status,
          error: errorMessage,
          response: data
        });
        setError(errorMessage);
        return;
      }
      
      // Extract the token from the response
      const authToken = data?.access_token;
      
      if (!authToken) {
        console.error('No auth token in response:', data);
        setError('Authentication failed. No token received from server.');
        return;
      }
      
      console.log('Auth token received, storing in localStorage');
      
      // Store the token with the 'Bearer ' prefix
      const tokenValue = `Bearer ${authToken}`;
      localStorage.setItem('token', tokenValue);
      
      // Extract CSRF token from response headers if available
      const csrfToken = response.headers.get('X-CSRFToken');
      if (csrfToken) {
        console.log('CSRF token found in headers, setting cookie');
        document.cookie = `X-CSRFToken=${csrfToken}; Path=/; SameSite=Strict`;
      }
      
      // Verify token was stored
      const storedToken = localStorage.getItem('token');
      if (!storedToken || storedToken !== tokenValue) {
        console.error('Failed to store auth token in localStorage');
        setError('Failed to store authentication token');
        return;
      }
      
      // Redirect to dashboard or the original destination
      const redirectUrl = typeof router.query.redirect === 'string' 
        ? router.query.redirect 
        : '/dashboard';
        
      console.log('Login successful, redirecting to:', redirectUrl);
      router.push(redirectUrl);
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">Sign in</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
