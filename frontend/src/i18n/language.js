const CATEGORY_LABELS = {
  dead_animals: { en: 'Dead Animals', te: 'à°®à±ƒà°¤ à°œà°‚à°¤à±à°µà±à°²à±' },
  garbage: { en: 'Garbage', te: 'à°šà±†à°¤à±à°¤' },
  illegal_dumping: { en: 'Illegal Dumping', te: 'à°…à°•à±à°°à°® à°šà±†à°¤à±à°¤ à°ªà°¾à°°à°µà±‡à°¤' },
  pothole: { en: 'Pothole', te: 'à°°à±‹à°¡à±à°¡à± à°—à±à°‚à°¤' },
  sewer: { en: 'Sewer', te: 'à°•à°¾à°²à±à°µ / à°®à±à°°à±à°—à±' },
  streetlight: { en: 'Streetlight', te: 'à°µà±€à°§à°¿ à°¦à±€à°ªà°‚' },
  waterlogging: { en: 'Waterlogging', te: 'à°¨à±€à°Ÿà°¿ à°¨à°¿à°²à±à°µ' },
};

const STATUS_LABELS = {
  submitted: { en: 'Submitted', te: 'à°¸à°®à°°à±à°ªà°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿' },
  assigned: { en: 'Assigned', te: 'à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿' },
  in_progress: { en: 'In Progress', te: 'à°ªà°¨à°¿à°²à±‹ à°‰à°‚à°¦à°¿' },
  waiting_approval: { en: 'Waiting Approval', te: 'à°†à°®à±‹à°¦à°‚ à°•à±‹à°¸à°‚ à°µà±‡à°šà°¿ à°‰à°‚à°¦à°¿' },
  resolved: { en: 'Resolved', te: 'Resolved' },
  closed: { en: 'Closed', te: 'Closed' },
  reopened: { en: 'Reopened', te: 'Reopened' },
  in_review: { en: 'In Review', te: 'In Review' },
  rejected: { en: 'Rejected', te: 'à°¤à°¿à°°à°¸à±à°•à°°à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿' },
  needs_manual_review: { en: 'Manual Review Needed', te: 'à°®à°¾à°¨à±à°¯à±à°µà°²à± à°¸à°®à±€à°•à±à°· à°…à°µà°¸à°°à°‚' },
};

const PRIORITY_LABELS = {
  Low: { en: 'Low', te: 'à°¤à°•à±à°•à±à°µ' },
  Medium: { en: 'Medium', te: 'à°®à°§à±à°¯à°¸à±à°¥' },
  High: { en: 'High', te: 'à°…à°§à°¿à°•' },
  Urgent: { en: 'Urgent', te: 'à°…à°¤à±à°¯à°µà°¸à°°à°‚' },
};

const ROLE_LABELS = {
  citizen: { en: 'Citizen', te: 'à°ªà±Œà°°à±à°¡à±' },
  officer: { en: 'Officer', te: 'à°…à°§à°¿à°•à°¾à°°à°¿' },
  worker: { en: 'Worker', te: 'à°•à°¾à°°à±à°®à°¿à°•à±à°¡à±' },
  admin: { en: 'Admin', te: 'à°¨à°¿à°°à±à°µà°¾à°¹à°•à±à°¡à±' },
};

const DEPARTMENT_LABELS = {
  'All Departments': { en: 'All Departments', te: 'à°…à°¨à±à°¨à°¿ à°¶à°¾à°–à°²à±' },
  'Road Department': { en: 'Road Department', te: 'à°°à±‹à°¡à±à°¡à± à°¶à°¾à°–' },
  'Sanitation Department': { en: 'Sanitation Department', te: 'à°¶à±à°­à±à°°à°¤ à°¶à°¾à°–' },
  'Drainage Department': { en: 'Drainage Department', te: 'à°¡à±à°°à±ˆà°¨à±‡à°œà± à°¶à°¾à°–' },
  'Electrical Department': { en: 'Electrical Department', te: 'à°µà°¿à°¦à±à°¯à±à°¤à± à°¶à°¾à°–' },
  'Water Supply Department': { en: 'Water Supply Department', te: 'à°¨à±€à°Ÿà°¿ à°¸à°°à°«à°°à°¾ à°¶à°¾à°–' },
  'Infrastructure Department': { en: 'Infrastructure Department', te: 'à°®à±Œà°²à°¿à°• à°µà°¸à°¤à±à°² à°¶à°¾à°–' },
  'Urban Planning Department': { en: 'Urban Planning Department', te: 'à°ªà°Ÿà±à°Ÿà°£ à°ªà±à°°à°£à°¾à°³à°¿à°• à°¶à°¾à°–' },
  'General Department': { en: 'General Department', te: 'à°¸à°¾à°§à°¾à°°à°£ à°¶à°¾à°–' },
  Unknown: { en: 'Unknown', te: 'à°¤à±†à°²à°¿à°¯à°¦à±' },
};

const MESSAGE_TRANSLATIONS = {
  'Please select a valid image file': { en: 'Please select a valid image file', te: 'à°¦à°¯à°šà±‡à°¸à°¿ à°¸à°°à±ˆà°¨ à°šà°¿à°¤à±à°°à°‚ à°«à±ˆà°²à±â€Œà°¨à± à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿' },
  'Image must be under 5MB': { en: 'Image must be under 5MB', te: 'à°šà°¿à°¤à±à°°à°‚ 5MB à°²à±‹à°ªà± à°‰à°‚à°¡à°¾à°²à°¿' },
  'Please upload an image first': { en: 'Please upload an image first', te: 'à°®à±à°‚à°¦à±à°—à°¾ à°’à°• à°šà°¿à°¤à±à°°à°¾à°¨à±à°¨à°¿ à°…à°ªà±à°²à±‹à°¡à± à°šà±‡à°¯à°‚à°¡à°¿' },
  'Complaint submitted successfully!': { en: 'Complaint submitted successfully!', te: 'à°«à°¿à°°à±à°¯à°¾à°¦à± à°µà°¿à°œà°¯à°µà°‚à°¤à°‚à°—à°¾ à°¸à°®à°°à±à°ªà°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿!' },
  'Submission failed. Please try again.': { en: 'Submission failed. Please try again.', te: 'à°¸à°®à°°à±à°ªà°£ à°µà°¿à°«à°²à°®à±ˆà°‚à°¦à°¿. à°¦à°¯à°šà±‡à°¸à°¿ à°®à°³à±à°²à±€ à°ªà±à°°à°¯à°¤à±à°¨à°¿à°‚à°šà°‚à°¡à°¿.' },
  'An error occurred': { en: 'An error occurred', te: 'à°’à°• à°²à±‹à°ªà°‚ à°œà°°à°¿à°—à°¿à°‚à°¦à°¿' },
  'Login failed': { en: 'Login failed', te: 'à°²à°¾à°—à°¿à°¨à± à°µà°¿à°«à°²à°®à±ˆà°‚à°¦à°¿' },
  'Signup failed': { en: 'Signup failed', te: 'à°¸à±ˆà°¨à± à°…à°ªà± à°µà°¿à°«à°²à°®à±ˆà°‚à°¦à°¿' },
  'Signup successful. Please check your email to confirm.': {
    en: 'Signup successful. Please check your email to confirm.',
    te: 'à°¸à±ˆà°¨à± à°…à°ªà± à°µà°¿à°œà°¯à°µà°‚à°¤à°®à±ˆà°‚à°¦à°¿. à°§à±ƒà°µà±€à°•à°°à°£ à°•à±‹à°¸à°‚ à°®à±€ à°‡à°®à±†à°¯à°¿à°²à± à°šà±‚à°¡à°‚à°¡à°¿.',
  },
  'Invalid login credentials': { en: 'Invalid login credentials', te: 'à°¤à°ªà±à°ªà± à°²à°¾à°—à°¿à°¨à± à°µà°¿à°µà°°à°¾à°²à±' },
  'User already registered': { en: 'User already registered', te: 'à°µà°¿à°¨à°¿à°¯à±‹à°—à°¦à°¾à°°à± à°‡à°ªà±à°ªà°Ÿà°¿à°•à±‡ à°¨à°®à±‹à°¦à± à°…à°¯à±à°¯à°¾à°°à±' },
  'Email not confirmed': { en: 'Email not confirmed', te: 'à°‡à°®à±†à°¯à°¿à°²à± à°‡à°‚à°•à°¾ à°§à±ƒà°µà±€à°•à°°à°¿à°‚à°šà°¬à°¡à°²à±‡à°¦à±' },
  'Failed to fetch complaints': { en: 'Failed to fetch complaints', te: 'à°«à°¿à°°à±à°¯à°¾à°¦à±à°²à°¨à± à°ªà±Šà°‚à°¦à°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Failed to load your reported issues': { en: 'Failed to load your reported issues', te: 'à°®à±€ à°¨à°¿à°µà±‡à°¦à°¿à°‚à°šà°¿à°¨ à°¸à°®à°¸à±à°¯à°²à°¨à± à°²à±‹à°¡à± à°šà±‡à°¯à°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Failed to fetch issues': { en: 'Failed to fetch issues', te: 'à°¸à°®à°¸à±à°¯à°²à°¨à± à°ªà±Šà°‚à°¦à°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Failed to load data': { en: 'Failed to load data', te: 'à°¡à±‡à°Ÿà°¾à°¨à± à°²à±‹à°¡à± à°šà±‡à°¯à°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Please enter an email': { en: 'Please enter an email', te: 'à°¦à°¯à°šà±‡à°¸à°¿ à°‡à°®à±†à°¯à°¿à°²à± à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°‚à°¡à°¿' },
  'Failed to assign role': { en: 'Failed to assign role', te: 'à°ªà°¾à°¤à±à°° à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Task assigned successfully!': { en: 'Task assigned successfully!', te: 'à°ªà°¨à°¿ à°µà°¿à°œà°¯à°µà°‚à°¤à°‚à°—à°¾ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿!' },
  'Failed to assign task': { en: 'Failed to assign task', te: 'à°ªà°¨à°¿ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Task verified and closed!': { en: 'Task verified and closed!', te: 'à°ªà°¨à°¿ à°§à±ƒà°µà±€à°•à°°à°¿à°‚à°šà°¿ à°®à±‚à°¸à°¿à°µà±‡à°¯à°¬à°¡à°¿à°‚à°¦à°¿!' },
  'Failed to approve task': { en: 'Failed to approve task', te: 'à°ªà°¨à°¿à°¨à°¿ à°†à°®à±‹à°¦à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Please provide a rejection reason in the notes field.': {
    en: 'Please provide a rejection reason in the notes field.',
    te: 'à°—à°®à°¨à°¿à°•à°² à°µà°¿à°­à°¾à°—à°‚à°²à±‹ à°¤à°¿à°°à°¸à±à°•à°°à°£ à°•à°¾à°°à°£à°¾à°¨à±à°¨à°¿ à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°‚à°¡à°¿.',
  },
  'Task rejected and sent back for rework!': { en: 'Task rejected and sent back for rework!', te: 'à°ªà°¨à°¿ à°¤à°¿à°°à°¸à±à°•à°°à°¿à°‚à°šà°¿ à°®à°³à±à°²à±€ à°šà±‡à°¯à°¡à°¾à°¨à°¿à°•à°¿ à°ªà°‚à°ªà°¬à°¡à°¿à°‚à°¦à°¿!' },
  'Failed to reject task': { en: 'Failed to reject task', te: 'à°ªà°¨à°¿à°¨à°¿ à°¤à°¿à°°à°¸à±à°•à°°à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Failed to load tasks': { en: 'Failed to load tasks', te: 'à°ªà°¨à±à°²à°¨à± à°²à±‹à°¡à± à°šà±‡à°¯à°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Task started! Stay safe.': { en: 'Task started! Stay safe.', te: 'à°ªà°¨à°¿ à°ªà±à°°à°¾à°°à°‚à°­à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿! à°œà°¾à°—à±à°°à°¤à±à°¤à°—à°¾ à°‰à°‚à°¡à°‚à°¡à°¿.' },
  'Failed to update task': { en: 'Failed to update task', te: 'à°ªà°¨à°¿ à°¸à±à°¥à°¿à°¤à°¿ à°¨à°µà±€à°•à°°à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚' },
  'Proof uploaded! Sent to officer for approval.': {
    en: 'Proof uploaded! Sent to officer for approval.',
    te: 'à°°à±à°œà±à°µà± à°…à°ªà±à°²à±‹à°¡à± à°…à°¯à°¿à°‚à°¦à°¿! à°…à°§à°¿à°•à°¾à°°à°¿à°•à°¿ à°†à°®à±‹à°¦à°‚ à°•à±‹à°¸à°‚ à°ªà°‚à°ªà°¬à°¡à°¿à°‚à°¦à°¿.',
  },
  'Upload failed. Try again.': { en: 'Upload failed. Try again.', te: 'à°…à°ªà±à°²à±‹à°¡à± à°µà°¿à°«à°²à°®à±ˆà°‚à°¦à°¿. à°®à°³à±à°²à±€ à°ªà±à°°à°¯à°¤à±à°¨à°¿à°‚à°šà°‚à°¡à°¿.' },
};

function humanize(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function lookup(map, language, value, fallback = value) {
  if (!value) return fallback;
  return map[value]?.[language] || map[value]?.en || fallback;
}

export function translateCategory(language, value) {
  return lookup(CATEGORY_LABELS, language, value, humanize(value));
}

export function translateStatus(language, value) {
  return lookup(STATUS_LABELS, language, value, humanize(value));
}

export function translatePriority(language, value) {
  return lookup(PRIORITY_LABELS, language, value, value);
}

export function translateRole(language, value) {
  return lookup(ROLE_LABELS, language, value, humanize(value));
}

export function translateDepartment(language, value) {
  if (!value) return value;
  const direct = lookup(DEPARTMENT_LABELS, language, value, value);
  if (direct !== value || DEPARTMENT_LABELS[value]) return direct;

  const match = Object.keys(DEPARTMENT_LABELS).find((key) => value.startsWith(key));
  if (!match) return value;
  const translatedBase = lookup(DEPARTMENT_LABELS, language, match, match);
  return value.replace(match, translatedBase);
}

export function translateMessage(language, message) {
  return lookup(MESSAGE_TRANSLATIONS, language, message, message);
}

export function getLocale(language) {
  return language === 'te' ? 'te-IN' : 'en-US';
}

export function formatDate(language, value, options = {}) {
  if (!value) return '--';
  try {
    return new Date(value).toLocaleDateString(getLocale(language), options);
  } catch {
    return '--';
  }
}

export function formatDateTime(language, value, options = {}) {
  if (!value) return '--';
  try {
    return new Date(value).toLocaleString(getLocale(language), options);
  } catch {
    return '--';
  }
}


