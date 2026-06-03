// =============================================================================
// NCPL analytics helper — TEST INSTRUMENTATION
// =============================================================================
// Sends properly-categorized events to the NCPL Operational Intelligence
// platform so the dashboards (Error Intelligence, Incidents, Operational feed,
// Department/User Intelligence) can be exercised.
//
// NOTE: window.ncpl.track() always sends category "custom", which the Error
// Intelligence Center does not treat as an error. So error events are POSTed
// directly with category:"error". Business events use the same direct POST for
// consistency. This file is test scaffolding — safe to remove after testing.
// =============================================================================

function readConfig() {
  const el = document.querySelector('script[data-project][data-key]');
  const project = el?.getAttribute('data-project') || 'civic-desk';
  const key = el?.getAttribute('data-key') || '';
  let origin = 'https://analytics-tool-web.vercel.app';
  try { if (el?.src) origin = new URL(el.src).origin; } catch { /* keep default */ }
  return { project, key, endpoint: `${origin}/api/v1/events` };
}

/** Fire-and-forget batch send. Never throws into the host app. */
export async function sendEvents(events) {
  const { project, key, endpoint } = readConfig();
  if (!key) { console.warn('[ncpl-test] no data-key found on the script tag'); return; }
  const payload = {
    events: events.map((e) => ({
      portalId: project,
      source: 'web',
      occurredAt: new Date().toISOString(),
      ...e,
    })),
  };
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json', 'x-ncpl-api-key': key },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    console.log('[ncpl-test] sent', events.length, 'events →', res.status, body);
    return { status: res.status, body };
  } catch (err) {
    console.warn('[ncpl-test] send failed', err);
  }
}

/** Track one categorized error (use in real catch blocks too). */
export function trackError(errorType, message, extra = {}, userEmail = null) {
  return sendEvents([{
    category: 'error',
    name: 'error.captured',
    ...(userEmail ? { userEmail } : {}),
    metadata: { errorType, message: String(message).slice(0, 300), ...extra },
  }]);
}

/** Track one business event. */
export function trackBusiness(name, metadata = {}, userEmail = null) {
  return sendEvents([{
    category: 'custom',
    name,
    ...(userEmail ? { userEmail } : {}),
    metadata,
  }]);
}

// ── One-click test seeder: exercises every Operational Intelligence section ──
export async function seedOperationalTestData(userEmail = null) {
  const email = userEmail || undefined;
  const errors = [
    { errorType: 'api',            message: 'API request timed out (504) calling /upload' },
    { errorType: 'database',       message: 'database connection timeout: too many clients' },
    { errorType: 'authentication', message: '401 Unauthorized: invalid or expired token' },
    { errorType: 'authorization',  message: '403 Forbidden: insufficient permission for resource' },
    { errorType: 'network',        message: 'NetworkError: Failed to fetch (CORS)' },
    { errorType: 'frontend',       message: "TypeError: Cannot read properties of undefined (reading 'id')" },
  ].map((m) => ({ category: 'error', name: 'error.captured', ...(email ? { userEmail: email } : {}), metadata: m }));

  const business = [
    { name: 'complaint.created',   metadata: { category: 'pothole', department: 'Road Department' } },
    { name: 'complaint.submitted', metadata: { priority: 'high' } },
    { name: 'complaint.assigned',  metadata: { department: 'Sanitation Department' } },
    { name: 'complaint.updated',   metadata: { toStatus: 'in_review' } },
    { name: 'document.uploaded',   metadata: { fileName: 'proof.jpg' } },
    { name: 'report.generated',    metadata: { type: 'weekly' } },
  ].map((e) => ({ category: 'custom', name: e.name, ...(email ? { userEmail: email } : {}), metadata: e.metadata }));

  await sendEvents([...errors, ...business]);
  // Also trigger a REAL uncaught error to verify auto-capture (category 'error').
  setTimeout(() => { throw new Error('[ncpl-test] simulated uncaught error for auto-capture'); }, 0);
}
