'use client';
import React, { useState } from 'react';
import { register } from '@/api/authApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import '../login/login.css';

// ── Validation helpers ──
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

const validateName = (val) => {
  if (!val.trim()) return 'Full name is required.';
  if (val.trim().length < 2) return 'Name must be at least 2 characters.';
  if (val.trim().length > 50) return 'Name must be under 50 characters.';
  return '';
};

const validateEmail = (val) => {
  if (!val.trim()) return 'Email is required.';
  if (!isValidEmail(val)) return 'Enter a valid email address.';
  return '';
};

const validatePassword = (val) => {
  if (!val) return 'Password is required.';
  if (val.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(val)) return 'Must include at least one uppercase letter.';
  if (!/[0-9]/.test(val)) return 'Must include at least one number.';
  return '';
};

const validateConfirmPassword = (pass, confirm) => {
  if (!confirm) return 'Please confirm your password.';
  if (pass !== confirm) return 'Passwords do not match.';
  return '';
};

// Password strength indicator
const getStrength = (val) => {
  if (!val) return { level: 0, label: '', color: '#e4e4e7' };
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const map = [
    { level: 0, label: '', color: '#e4e4e7' },
    { level: 1, label: 'Weak', color: '#ef4444' },
    { level: 2, label: 'Fair', color: '#f59e0b' },
    { level: 3, label: 'Good', color: '#3b82f6' },
    { level: 4, label: 'Strong', color: '#22c55e' },
  ];
  return map[score];
};

export default function RegisterPage() {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Field errors
  const [nameErr, setNameErr]       = useState('');
  const [emailErr, setEmailErr]     = useState('');
  const [passErr, setPassErr]       = useState('');
  const [confirmErr, setConfirmErr] = useState('');

  const { setUser } = useAuth();
  const router = useRouter();

  const strength = getStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Run all validations
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(password, confirm);
    setNameErr(nErr);
    setEmailErr(eErr);
    setPassErr(pErr);
    setConfirmErr(cErr);
    if (nErr || eErr || pErr || cErr) return;

    setError('');
    setLoading(true);
    try {
      const data = await register({ name: name.trim(), email: email.trim(), password });
      setUser(data.user);
      router.push('/dashboard/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (hasErr) => ({
    padding: '11px 20px',
    borderRadius: '9999px',
    border: `1px solid ${hasErr ? '#ef4444' : '#e4e4e7'}`,
    background: '#ffffff',
    color: '#09090b',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  });

  const errMsg = (msg) => msg ? (
    <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'block', textAlign: 'left', paddingLeft: '8px', marginTop: '2px' }}>
      {msg}
    </span>
  ) : null;

  return (
    <div className="login-container">
      <div className="login-logo">
        <div className="logo-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 2 22 22 22"></polygon>
          </svg>
        </div>
        <span className="logo-text">Pyramid</span>
      </div>

      <div className="login-card">
        <h1 className="login-title">Create an Account</h1>
        <p className="login-subtitle">Fill in the details below to get started.</p>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '16px' }}>

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameErr) setNameErr(validateName(e.target.value)); }}
              onBlur={() => setNameErr(validateName(name))}
              style={fieldStyle(nameErr)}
              autoFocus
            />
            {errMsg(nameErr)}
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value)); }}
              onBlur={() => setEmailErr(validateEmail(email))}
              style={fieldStyle(emailErr)}
            />
            {errMsg(emailErr)}
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <input
              type="password"
              placeholder="Password (8+ chars, uppercase, number)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passErr) setPassErr(validatePassword(e.target.value)); }}
              onBlur={() => setPassErr(validatePassword(password))}
              style={fieldStyle(passErr)}
            />
            {/* Strength bar */}
            {password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', marginTop: '2px' }}>
                <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength.level ? strength.color : '#e4e4e7', transition: 'background 0.2s' }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600, minWidth: '36px' }}>
                  {strength.label}
                </span>
              </div>
            )}
            {errMsg(passErr)}
          </div>

          {/* Confirm Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); if (confirmErr) setConfirmErr(validateConfirmPassword(password, e.target.value)); }}
              onBlur={() => setConfirmErr(validateConfirmPassword(password, confirm))}
              style={fieldStyle(confirmErr)}
            />
            {errMsg(confirmErr)}
          </div>

          <button type="submit" className="btn-pill-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push('/login')}
          style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          Already have an account? <span style={{ color: '#6366f1' }}>Login</span>
        </button>
      </div>
    </div>
  );
}
