// Cookie utility functions with TypeScript support

/**
 * Get a cookie value by name
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const part = parts.pop();
    if (part) {
      return part.split(';').shift() || null;
    }
  }
  
  return null;
};

/**
 * Set a cookie
 * @param name - The name of the cookie
 * @param value - The value to set
 * @param days - Number of days until the cookie expires (default: 7)
 */
const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof document === 'undefined') return;
  
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  const secure = window?.location?.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${value || ''}${expires}; path=/; samesite=strict${secure}`;
};

/**
 * Delete a cookie
 * @param name - The name of the cookie to delete
 */
const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export { getCookie, setCookie, deleteCookie };
