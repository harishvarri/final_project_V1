// =============================================================================
// TestOpsPanel — TEST-ONLY floating panel to exercise NCPL Operational
// Intelligence (errors + business events). Remove after testing.
//
// Visible only when the URL has ?optest=1 (so it never shows for real users).
// =============================================================================
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { seedOperationalTestData, trackError, trackBusiness } from '../services/analytics';

export default function TestOpsPanel() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  let auth = {};
  try { auth = useAuth() || {}; } catch { /* provider missing */ }
  const email = auth?.user?.email || null;

  useEffect(() => {
    try { setShow(new URLSearchParams(window.location.search).has('optest')); } catch { /* noop */ }
  }, []);

  if (!show) return null;

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 4000); };

  const fireAll = async () => { await seedOperationalTestData(email); flash('Sent 6 errors + 6 business events + 1 real uncaught error'); };
  const fireErrors = async () => {
    await Promise.all([
      trackError('api', 'API 504 timeout on /upload', {}, email),
      trackError('database', 'DB connection pool exhausted', {}, email),
      trackError('authentication', '401 invalid token', {}, email),
      trackError('network', 'Failed to fetch (CORS)', {}, email),
    ]);
    flash('Sent 4 categorized errors');
  };
  const fireBusiness = async () => {
    await Promise.all([
      trackBusiness('complaint.created', { category: 'pothole' }, email),
      trackBusiness('complaint.updated', { toStatus: 'closed' }, email),
      trackBusiness('document.uploaded', { fileName: 'proof.jpg' }, email),
    ]);
    flash('Sent 3 business events');
  };
  const fireRealError = () => { setTimeout(() => { throw new Error('[ncpl-test] manual uncaught error'); }, 0); flash('Threw a real uncaught error (auto-captured)'); };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, width: 240, background: '#0f172a', color: '#fff', borderRadius: 10, padding: 12, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>NCPL Ops Test {email ? `· ${email}` : '(anon)'}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        <button onClick={fireAll} style={btn('#6366f1')}>Fire everything</button>
        <button onClick={fireErrors} style={btn('#ef4444')}>Fire errors (4)</button>
        <button onClick={fireBusiness} style={btn('#10b981')}>Fire business events (3)</button>
        <button onClick={fireRealError} style={btn('#f59e0b')}>Throw real error</button>
      </div>
      {msg && <div style={{ marginTop: 8, color: '#a7f3d0' }}>{msg}</div>}
      <div style={{ marginTop: 8, opacity: .6 }}>Remove this panel after testing.</div>
    </div>
  );
}

function btn(bg) {
  return { background: bg, color: '#fff', border: 0, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontWeight: 600 };
}
