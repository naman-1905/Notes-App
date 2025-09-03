// frontend/notes-app/app/utils/constants.js

// This reads the NEXT_PUBLIC_BASE_URL injected at build time
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

console.log('API Base URL:', BASE_URL); 