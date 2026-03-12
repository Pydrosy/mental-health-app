// frontend/src/services/api.js
import axios from 'axios';

// Use relative URLs - they will be proxied by nginx
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, config.params || config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access forbidden:', error.response.data.message);
      }
      
      // Handle 429 Too Many Requests
      if (error.response.status === 429) {
        console.warn('Rate limited. Please wait before making more requests.');
      }
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      
      // Check if it's a CORS error
      if (error.message === 'Network Error') {
        console.error('Possible CORS error or backend not reachable');
      }
      
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (userData) => api.post('/auth/signup', userData),
  getMe: () => api.get('/auth/me'),
};

// User endpoints
export const users = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePatientDetails: (data) => api.put('/users/patient/details', data),
  updateTherapistDetails: (data) => api.put('/users/therapist/details', data),
};

// Therapist endpoints
export const therapists = {
  getAll: (params) => api.get('/therapists', { params }),
  getById: (id) => api.get(`/therapists/${id}`),
  getAvailability: (id) => api.get(`/therapists/${id}/availability`),
  updateAvailability: (availabilityData) => api.put('/therapists/availability', { availability: availabilityData }),
  getReviews: (id, params) => api.get(`/therapists/${id}/reviews`, { params }),
  getStats: () => api.get('/therapists/stats/dashboard'),
};

// Session endpoints
export const sessions = {
  create: (data) => api.post('/sessions', data),
  getMySessions: (params) => api.get('/sessions/my-sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  updateStatus: (id, data) => api.patch(`/sessions/${id}/status`, data),
  addNotes: (id, data) => api.post(`/sessions/${id}/notes`, data),
  rateSession: (id, data) => api.post(`/sessions/${id}/rate`, data),
};

// Message endpoints
export const messages = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (userId, params) => 
    api.get(`/messages/conversation/${userId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  editMessage: (id, content) => api.patch(`/messages/${id}`, { content }),
};

// Matching endpoints
export const matching = {
  getRecommendations: (params) => 
    api.get('/matching/recommendations', { params }),
  getGNNRecommendations: (params) => 
    api.get('/matching/gnn-recommendations', { params }),
  getSimilarTherapists: (id) => 
    api.get(`/matching/similar/${id}`),
  getMatchingInsights: (id) => 
    api.get(`/matching/insights/${id}`),
};

export default api;