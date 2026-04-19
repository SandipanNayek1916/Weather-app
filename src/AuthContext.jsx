import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);

  async function fetchFavorites(token) {
    try {
      const res = await fetch('http://localhost:3001/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Failed to sync favorites', err);
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('weather_token');
    const savedUser = localStorage.getItem('weather_user');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      fetchFavorites(savedToken);
    }
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    setUser(data.user);
    localStorage.setItem('weather_token', data.token);
    localStorage.setItem('weather_user', JSON.stringify(data.user));
    await fetchFavorites(data.token);
  };

  const register = async (email, password) => {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    setUser(data.user);
    localStorage.setItem('weather_token', data.token);
    localStorage.setItem('weather_user', JSON.stringify(data.user));
    setFavorites([]);
  };

  const logout = () => {
    setUser(null);
    setFavorites([]);
    localStorage.removeItem('weather_user');
    localStorage.removeItem('weather_token');
  };

  const toggleFavorite = async (city) => {
    const token = localStorage.getItem('weather_token');
    if (!token) return; // Must be logged in

    try {
      const res = await fetch('http://localhost:3001/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city })
      });
      if (res.ok) {
        const updated = await res.json();
        setFavorites(updated);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const isFavorite = (city) => {
    if (!city) return false;
    return favorites.some(f => f.lat === city.lat && f.lon === city.lon);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, favorites, toggleFavorite, isFavorite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
