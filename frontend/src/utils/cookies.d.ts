// Type declarations for cookies utility

declare const getCookie: (name: string) => string | null;
declare const setCookie: (name: string, value: string, days?: number) => void;
declare const deleteCookie: (name: string) => void;

export { getCookie, setCookie, deleteCookie };