// import React, { createContext, useState, useContext, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const navigate = useNavigate();

//   const API_URL = 'http://localhost:5000/api';

//   // Set axios default header
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   }

//   useEffect(() => {
//     if (token) {
//       fetchUser();
//     } else {
//       setLoading(false);
//     }
//   }, [token]);

//   const fetchUser = async () => {
//     try {
//       const response = await axios.get(`${API_URL}/auth/me`);
//       setUser(response.data.user);
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       logout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (email, password) => {
//     try {
//       const response = await axios.post(`${API_URL}/auth/login`, {
//         email,
//         password
//       });
      
//       const { token, user } = response.data;
//       localStorage.setItem('token', token);
//       setToken(token);
//       setUser(user);
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
//       return { success: true };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.response?.data?.message || 'Login failed'
//       };
//     }
//   };

//   const signup = async (userData) => {
//     try {
//       const response = await axios.post(`${API_URL}/auth/signup`, userData);
      
//       const { token, user } = response.data;
//       localStorage.setItem('token', token);
//       setToken(token);
//       setUser(user);
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
//       return { success: true, user };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.response?.data?.message || 'Signup failed'
//       };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setToken(null);
//     setUser(null);
//     delete axios.defaults.headers.common['Authorization'];
//     navigate('/login');
//   };

//   const updateProfile = async (profileData) => {
//     try {
//       const response = await axios.put(`${API_URL}/users/profile`, profileData);
//       setUser(response.data.user);
//       return { success: true, user: response.data.user };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.response?.data?.message || 'Update failed'
//       };
//     }
//   };

//   const value = {
//     user,
//     loading,
//     login,
//     signup,
//     logout,
//     updateProfile,
//     isAuthenticated: !!user,
//     isPatient: user?.role === 'patient',
//     isTherapist: user?.role === 'therapist',
//     isAdmin: user?.role === 'admin'
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';

  // Set axios default header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      console.log('Fetching user with token:', token);
      const response = await axios.get(`${API_URL}/auth/me`);
      console.log('User fetched:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Logging in with:', email);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      console.log('Login successful, token received:', token);
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, profileData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isPatient: user?.role === 'patient',
    isTherapist: user?.role === 'therapist',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};