'use client';
import React, { useState, useEffect } from 'react';
import { login as loginApi, sendOTP, verifyOTP } from '@/api/authApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import './login.css';

// ── Validation helpers ──────────────────────────────────────────
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
const isValidOtp   = (val) => /^\d{6}$/.test(val.trim());

export default function LoginPage() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpSent, setOtpSent]   = useState(false);
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);

  // Field-level errors
  const [emailErr, setEmailErr]     = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [otpErr, setOtpErr]         = useState('');

  const { setUser, loginAsGuest } = useAuth();
  const router = useRouter();

  // Auto-clear info message after 60 seconds
  useEffect(() => {
    if (!info) return;
    const timer = setTimeout(() => setInfo(''), 60000);
    return () => clearTimeout(timer);
  }, [info]);

  // ── Inline validators ──
  const validateEmail = (val) => {
    if (!val.trim()) return 'Email is required.';
    if (!isValidEmail(val)) return 'Enter a valid email address.';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const validateOtp = (val) => {
    if (!val.trim()) return 'OTP is required.';
    if (!isValidOtp(val)) return 'OTP must be exactly 6 digits (numbers only).';
    return '';
  };

  // ── Handlers ──
  const handleGuestLogin = () => loginAsGuest();

  const handleGoogleClick = () => {
    setError('');
    setLoading(true);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const apiUrl = isLocal ? 'http://localhost:4000/api' : (process.env.NEXT_PUBLIC_API_URL || 'https://todo-saas.onrender.com/api');
    const backendBase = apiUrl.replace(/\/api\/?$/, '');

    window.location.href = `${backendBase}/auth/google`;
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (eErr || pErr) return;

    setError('');
    setInfo('Logging in...');
    setLoading(true);
    try {
      const data = await loginApi({ email: email.trim(), password });
      setUser(data.user);
      router.push('/dashboard/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const eErr = validateEmail(email);
    setEmailErr(eErr);
    if (eErr) return;

    setError('');
    setInfo('Sending OTP to your email...');
    setLoading(true);
    try {
      await sendOTP(email.trim());
      setOtpSent(true);
      setInfo('6-digit OTP sent to your email!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const oErr = validateOtp(otp);
    setEmailErr(eErr);
    setOtpErr(oErr);
    if (eErr || oErr) return;

    setError('');
    setInfo('Verifying OTP...');
    setLoading(true);
    try {
      const data = await verifyOTP(email.trim(), otp.trim());
      setUser(data.user);
      router.push('/dashboard/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP. Try again.');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: only allow digits ──
  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    if (otpErr) setOtpErr(validateOtp(val));
  };

  const fieldStyle = (hasErr) => ({
    border: `1px solid ${hasErr ? '#ef4444' : '#e4e4e7'}`,
    backgroundColor: '#ffffff',
    color: '#000000',
  });

  const errMsg = (msg) => msg ? (
    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '-6px', display: 'block', textAlign: 'left', paddingLeft: '4px' }}>
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
        <h1 className="login-title">Let's get back on track</h1>
        <p className="login-subtitle">Enter your email below to login to your account.</p>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ color: '#6366f1', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem', padding: '8px 12px', background: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
            {info}
          </div>
        )}

        {showEmailLogin ? (
          !useOtpMode ? (
            /* ── Password Login ── */
            <form onSubmit={handlePasswordLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value)); }}
                  onBlur={() => setEmailErr(validateEmail(email))}
                  className="login-input"
                  style={fieldStyle(emailErr)}
                  autoFocus
                />
                {errMsg(emailErr)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordErr) setPasswordErr(validatePassword(e.target.value)); }}
                  onBlur={() => setPasswordErr(validatePassword(password))}
                  className="login-input"
                  style={fieldStyle(passwordErr)}
                />
                {errMsg(passwordErr)}
              </div>

              <button type="submit" className="btn-pill-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem' }}>
                <button type="button" onClick={() => { setUseOtpMode(true); setEmailErr(''); setPasswordErr(''); setError(''); }} style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer' }}>
                  Login via OTP
                </button>
                <button type="button" onClick={() => { setShowEmailLogin(false); setEmailErr(''); setPasswordErr(''); setError(''); }} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                  Back
                </button>
              </div>
            </form>
          ) : (
            /* ── OTP Login ── */
            <form onSubmit={handleVerifyOTP} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value)); }}
                  onBlur={() => setEmailErr(validateEmail(email))}
                  className="login-input"
                  style={fieldStyle(emailErr)}
                  disabled={otpSent}
                  autoFocus={!otpSent}
                />
                {errMsg(emailErr)}
              </div>

              {!otpSent ? (
                <button type="button" className="btn-pill-primary" onClick={handleSendOTP} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP Email'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={handleOtpChange}
                    onBlur={() => setOtpErr(validateOtp(otp))}
                    className="login-input"
                    style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.25rem', ...fieldStyle(otpErr) }}
                    maxLength={6}
                    autoFocus
                  />
                  {errMsg(otpErr)}
                  <button type="submit" className="btn-pill-primary" disabled={loading || otp.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify OTP & Login'}
                  </button>
                </div>
              )}

              <button type="button" onClick={() => { setUseOtpMode(false); setOtpSent(false); setOtp(''); setOtpErr(''); setEmailErr(''); setError(''); }} style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem' }}>
                Back to Password Login
              </button>
            </form>
          )
        ) : (
          /* ── Main actions ── */
          <div className="login-actions">
            <button type="button" className="btn-pill-primary" onClick={handleGuestLogin}>
              Continue as Guest
            </button>

            <button type="button" className="btn-pill-outline" onClick={handleGoogleClick} disabled={loading}>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', fontFamily: 'sans-serif' }}>G</span>
              <span>{loading ? 'Connecting...' : 'Login with Google'}</span>
            </button>

            <button type="button" onClick={() => setShowEmailLogin(true)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.75rem', marginTop: '4px' }}>
              Or login with Email &amp; Password
            </button>
          </div>
        )}
      </div>

      <p className="login-terms">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </p>
    </div>
  );
}
