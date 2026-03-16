'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';

interface LoginScreenProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password') => void;
}

export default function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loadDataFromAPI } = useStore();
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        setLoading(false);
        return;
      }
      // Load all data from PostgreSQL
      await loadDataFromAPI();
      // Login with user data
      login({
        id: data.user.id,
        username: data.user.email,
        password: '',
        fullName: data.user.fullName,
        roleId: data.user.roleId,
        poles: data.user.poles,
        ateliers: data.user.ateliers,
        active: data.user.active,
      });
      showToast('Bienvenue, ' + data.user.fullName, 'success');
    } catch (e: any) {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
  const linkStyle = { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100vw',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0d1520 100%)',
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 420, padding: '48px 40px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
            QC PILOT
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 2 }}>
            MULTIPRINT — Unified Multi-Pôles
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email</label>
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Mot de passe</label>
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 14, marginTop: 8,
            background: loading ? 'var(--text-muted)' : 'var(--accent)', color: '#0a0e1a',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase', letterSpacing: 1,
          }}
        >
          {loading ? 'Connexion...' : 'Connexion'}
        </button>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={linkStyle} onClick={() => onNavigate('register')}>
            Créer un compte
          </button>
          <button style={linkStyle} onClick={() => onNavigate('forgot-password')}>
            Mot de passe oublié ?
          </button>
        </div>
      </div>
    </div>
  );
}
