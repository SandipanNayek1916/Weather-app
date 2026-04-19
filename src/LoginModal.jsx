import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            style={{ padding: '32px', borderRadius: '24px', background: 'rgba(20, 25, 35, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', maxWidth: '400px', width: '100%', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {isRegistering ? 'Create Account' : 'Sign In'}
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b96a5', cursor: 'pointer', padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <p style={{ color: '#8b96a5', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              {isRegistering ? 'Create an account to securely save your places.' : 'Sign in to access your saved places.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                autoFocus
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              
              {error && <div style={{ color: '#ff4d4d', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontSize: '16px', fontWeight: '500', cursor: 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Continue')}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#8b96a5' }}>
              {isRegistering ? 'Already have an account? ' : 'Need an account? '}
              <span style={{ color: 'white', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? 'Sign In' : 'Register'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
