'use client';

import { useState } from 'react';

interface ForgotPasswordScreenProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password') => void;
}

export default function ForgotPasswordScreen({ onNavigate }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!email) { setError('Email requis'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || 'Vérifiez votre email.');
      setStep('reset');
    } catch { setError('Erreur serveur'); }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!token || !newPassword) { setError('Tous les champs sont requis'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (newPassword.length < 6) { setError('Min. 6 caractères'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); setLoading(false); return; }
      setMessage('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
    } catch { setError('Erreur serveur'); }
    setLoading(false);
  };

  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
  const linkStyle = { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0d1520 100%)', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div style={{ width: 420, padding: '48px 40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>QC PILOT</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Réinitialisation du mot de passe</p>
        </div>

        {step === 'request' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" onKeyDown={(e) => e.key === 'Enter' && handleRequest()} />
            </div>
            <button onClick={handleRequest} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? 'var(--text-muted)' : 'var(--accent)', color: '#0a0e1a', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Code de réinitialisation</label>
              <input className="form-control" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Collez le code reçu" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input className="form-control" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 car." />
              </div>
              <div>
                <label style={labelStyle}>Confirmer</label>
                <input className="form-control" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer" />
              </div>
            </div>
            <button onClick={handleReset} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? 'var(--text-muted)' : 'var(--accent)', color: '#0a0e1a', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </>
        )}

        {message && <p style={{ color: 'var(--green, #22c55e)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{message}</p>}
        {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{error}</p>}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button style={linkStyle} onClick={() => onNavigate('login')}>Retour à la connexion</button>
        </div>
      </div>
    </div>
  );
}
