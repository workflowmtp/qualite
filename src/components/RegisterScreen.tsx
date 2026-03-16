'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';

interface RegisterScreenProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password') => void;
}

export default function RegisterScreen({ onNavigate }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loadDataFromAPI } = useStore();
  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }
      await loadDataFromAPI();
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
      showToast('Compte créé ! Bienvenue, ' + data.user.fullName, 'success');
    } catch (e: any) {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
  const linkStyle = { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0d1520 100%)', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div style={{ width: 420, padding: '48px 40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>QC PILOT</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Créer un compte</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Nom complet</label>
          <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Dupont" onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 car." onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
          </div>
          <div>
            <label style={labelStyle}>Confirmer</label>
            <input className="form-control" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer" onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
          </div>
        </div>

        <button onClick={handleRegister} disabled={loading} style={{ width: '100%', padding: 14, marginTop: 8, background: loading ? 'var(--text-muted)' : 'var(--accent)', color: '#0a0e1a', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
          {loading ? 'Inscription...' : 'Créer mon compte'}
        </button>

        {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{error}</p>}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Déjà un compte ? </span>
          <button style={linkStyle} onClick={() => onNavigate('login')}>Se connecter</button>
        </div>
      </div>
    </div>
  );
}
