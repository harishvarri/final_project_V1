import enLocale from './locales/en.json';
import teLocale from './locales/te.json';

const CATEGORY_LABELS = {
  dead_animals: { en: 'Dead Animals', te: 'మృత జంతువులు' },
  garbage: { en: 'Garbage', te: 'చెత్త' },
  illegal_dumping: { en: 'Illegal Dumping', te: 'అక్రమ చెత్త పారవేత' },
  pothole: { en: 'Pothole', te: 'రోడ్డు గుంత' },
  sewer: { en: 'Sewer', te: 'కాలువ / మురుగు' },
  streetlight: { en: 'Streetlight', te: 'వీధి దీపం' },
  waterlogging: { en: 'Waterlogging', te: 'నీటి నిల్వ' },
};

const STATUS_LABELS = {
  submitted: { en: 'Submitted', te: 'సమర్పించబడింది' },
  assigned: { en: 'Assigned', te: 'కేటాయించబడింది' },
  in_progress: { en: 'In Progress', te: 'పనిలో ఉంది' },
  waiting_approval: { en: 'Waiting Approval', te: 'ఆమోదం కోసం వేచి ఉంది' },
  resolved: { en: 'Resolved', te: 'పరిష్కరించబడింది' },
  closed: { en: 'Closed', te: 'మూసివేయబడింది' },
  reopened: { en: 'Reopened', te: 'మళ్లీ తెరవబడింది' },
  in_review: { en: 'In Review', te: 'సమీక్షలో ఉంది' },
  rejected: { en: 'Rejected', te: 'తిరస్కరించబడింది' },
  needs_manual_review: { en: 'Manual Review Needed', te: 'మాన్యువల్ సమీక్ష అవసరం' },
};

const PRIORITY_LABELS = {
  Low: { en: 'Low', te: 'తక్కువ' },
  Medium: { en: 'Medium', te: 'మధ్యస్థ' },
  High: { en: 'High', te: 'అధిక' },
  Urgent: { en: 'Urgent', te: 'అత్యవసరం' },
};

const ROLE_LABELS = {
  citizen: { en: 'Citizen', te: 'పౌరుడు' },
  officer: { en: 'Officer', te: 'అధికారి' },
  worker: { en: 'Worker', te: 'వర్కర్' },
  admin: { en: 'Admin', te: 'నిర్వాహకుడు' },
};

const DEPARTMENT_LABELS = {
  'All Departments': { en: 'All Departments', te: 'అన్ని శాఖలు' },
  'Road Department': { en: 'Road Department', te: 'రోడ్డు శాఖ' },
  'Sanitation Department': { en: 'Sanitation Department', te: 'పారిశుద్ధ్య శాఖ' },
  'Drainage Department': { en: 'Drainage Department', te: 'డ్రైనేజీ శాఖ' },
  'Electrical Department': { en: 'Electrical Department', te: 'విద్యుత్ శాఖ' },
  'Water Supply Department': { en: 'Water Supply Department', te: 'నీటి సరఫరా శాఖ' },
  'Infrastructure Department': { en: 'Infrastructure Department', te: 'మౌలిక వసతుల శాఖ' },
  'Urban Planning Department': { en: 'Urban Planning Department', te: 'పట్టణ ప్రణాళిక శాఖ' },
  'General Department': { en: 'General Department', te: 'సాధారణ శాఖ' },
  Unknown: { en: 'Unknown', te: 'తెలియదు' },
};

const MESSAGE_TRANSLATIONS = {
  'Please select a valid image file': { en: 'Please select a valid image file', te: 'దయచేసి సరైన చిత్ర ఫైల్‌ను ఎంచుకోండి' },
  'Image must be under 5MB': { en: 'Image must be under 5MB', te: 'చిత్రం 5MB లోపు ఉండాలి' },
  'Please upload an image first': { en: 'Please upload an image first', te: 'ముందుగా ఒక చిత్రాన్ని అప్‌లోడ్ చేయండి' },
  'Complaint submitted successfully!': { en: 'Complaint submitted successfully!', te: 'ఫిర్యాదు విజయవంతంగా సమర్పించబడింది!' },
  'Submission failed. Please try again.': { en: 'Submission failed. Please try again.', te: 'సమర్పణ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.' },
  'An error occurred': { en: 'An error occurred', te: 'ఒక లోపం జరిగింది' },
  'Login failed': { en: 'Login failed', te: 'లాగిన్ విఫలమైంది' },
  'Signup failed': { en: 'Signup failed', te: 'సైన్ అప్ విఫలమైంది' },
  'Signup successful. Please check your email to confirm.': {
    en: 'Signup successful. Please check your email to confirm.',
    te: 'సైన్ అప్ విజయవంతమైంది. నిర్ధారణ కోసం మీ ఇమెయిల్‌ను చూడండి.',
  },
  'Invalid login credentials': { en: 'Invalid login credentials', te: 'తప్పు లాగిన్ వివరాలు' },
  'User already registered': { en: 'User already registered', te: 'వినియోగదారు ఇప్పటికే నమోదు అయ్యారు' },
  'Email not confirmed': { en: 'Email not confirmed', te: 'ఇమెయిల్ ఇంకా నిర్ధారించబడలేదు' },
  'Failed to fetch complaints': { en: 'Failed to fetch complaints', te: 'ఫిర్యాదులను పొందలేకపోయాం' },
  'Failed to load your reported issues': { en: 'Failed to load your reported issues', te: 'మీరు నివేదించిన సమస్యలను లోడ్ చేయలేకపోయాం' },
  'Failed to fetch issues': { en: 'Failed to fetch issues', te: 'సమస్యలను పొందలేకపోయాం' },
  'Failed to load data': { en: 'Failed to load data', te: 'డేటాను లోడ్ చేయలేకపోయాం' },
  'Please enter an email': { en: 'Please enter an email', te: 'దయచేసి ఇమెయిల్ నమోదు చేయండి' },
  'Failed to assign role': { en: 'Failed to assign role', te: 'పాత్ర కేటాయించలేకపోయాం' },
  'Task assigned successfully!': { en: 'Task assigned successfully!', te: 'పని విజయవంతంగా కేటాయించబడింది!' },
  'Failed to assign task': { en: 'Failed to assign task', te: 'పని కేటాయించలేకపోయాం' },
  'Task verified and closed!': { en: 'Task verified and closed!', te: 'పని ధృవీకరించి మూసివేయబడింది!' },
  'Failed to approve task': { en: 'Failed to approve task', te: 'పనిని ఆమోదించలేకపోయాం' },
  'Please provide a rejection reason in the notes field.': {
    en: 'Please provide a rejection reason in the notes field.',
    te: 'దయచేసి గమనికల భాగంలో తిరస్కరణ కారణాన్ని నమోదు చేయండి.',
  },
  'Task rejected and sent back for rework!': { en: 'Task rejected and sent back for rework!', te: 'పని తిరస్కరించి మళ్లీ పనికి పంపించబడింది!' },
  'Failed to reject task': { en: 'Failed to reject task', te: 'పనిని తిరస్కరించలేకపోయాం' },
  'Failed to load tasks': { en: 'Failed to load tasks', te: 'పనులను లోడ్ చేయలేకపోయాం' },
  'Task started! Stay safe.': { en: 'Task started! Stay safe.', te: 'పని ప్రారంభమైంది! జాగ్రత్తగా ఉండండి.' },
  'Failed to update task': { en: 'Failed to update task', te: 'పని స్థితిని నవీకరించలేకపోయాం' },
  'Proof uploaded! Sent to officer for approval.': {
    en: 'Proof uploaded! Sent to officer for approval.',
    te: 'రుజువు అప్‌లోడ్ అయింది! ఆమోదం కోసం అధికారికి పంపబడింది.',
  },
  'Upload failed. Try again.': { en: 'Upload failed. Try again.', te: 'అప్‌లోడ్ విఫలమైంది. మళ్లీ ప్రయత్నించండి.' },
  'Home': { en: 'Home', te: 'హోమ్' },
  'Report Issue': { en: 'Report Issue', te: 'ఫిర్యాదు నమోదు' },
  'Your Issues': { en: 'Your Issues', te: 'మీ ఫిర్యాదులు' },
  'My Tasks': { en: 'My Tasks', te: 'నా పనులు' },
  'Dashboard': { en: 'Dashboard', te: 'డ్యాష్‌బోర్డ్' },
  'All Issues': { en: 'All Issues', te: 'అన్ని సమస్యలు' },
  'Analytics': { en: 'Analytics', te: 'విశ్లేషణలు' },
  'Logout': { en: 'Logout', te: 'లాగ్‌అవుట్' },
  'Login': { en: 'Login', te: 'లాగిన్' },
  'Language': { en: 'Language', te: 'భాష' },
  'All Civic Issues': { en: 'All Civic Issues', te: 'అన్ని పౌర సమస్యలు' },
  'Track all reported issues and their status': {
    en: 'Track all reported issues and their status',
    te: 'నివేదించిన అన్ని సమస్యలు మరియు వాటి స్థితిని చూడండి',
  },
  'Filters': { en: 'Filters', te: 'ఫిల్టర్లు' },
  'Category': { en: 'Category', te: 'వర్గం' },
  'All Categories': { en: 'All Categories', te: 'అన్ని వర్గాలు' },
  'Search': { en: 'Search', te: 'శోధన' },
  'Search issues...': { en: 'Search issues...', te: 'సమస్యలను శోధించండి...' },
  'Loading issues...': { en: 'Loading issues...', te: 'సమస్యలు లోడ్ అవుతున్నాయి...' },
  'No issues found matching your filters.': {
    en: 'No issues found matching your filters.',
    te: 'మీ ఫిల్టర్లకు సరిపోయే సమస్యలు కనిపించలేదు.',
  },
  'All Status': { en: 'All Status', te: 'అన్ని స్థితులు' },
  'All Statuses': { en: 'All Statuses', te: 'అన్ని స్థితులు' },
  'Unassigned': { en: 'Unassigned', te: 'కేటాయించలేదు' },
  'Requires Approval': { en: 'Requires Approval', te: 'ఆమోదం అవసరం' },
  'Assigned / In Progress': { en: 'Assigned / In Progress', te: 'కేటాయించబడింది / పనిలో ఉంది' },
  'Awaiting Citizen Feedback': { en: 'Awaiting Citizen Feedback', te: 'పౌరుడి అభిప్రాయం కోసం వేచి ఉంది' },
  'Citizen Voice': { en: 'Citizen Voice', te: 'పౌరుడి వాయిస్' },
  'Worker Voice': { en: 'Worker Voice', te: 'వర్కర్ వాయిస్' },
  'Citizen Voice Note': { en: 'Citizen Voice Note', te: 'పౌరుడి వాయిస్ నోట్' },
  'Worker Voice Note': { en: 'Worker Voice Note', te: 'వర్కర్ వాయిస్ నోట్' },
  'Citizen feedback requires follow-up action.': {
    en: 'Citizen feedback requires follow-up action.',
    te: 'పౌరుడి అభిప్రాయంపై ఫాలో-అప్ చర్య అవసరం ఉంది.',
  },
  'Officer Resolved, Awaiting Citizen Feedback': {
    en: 'Officer Resolved, Awaiting Citizen Feedback',
    te: 'అధికారి పరిష్కరించారు, పౌరుడి అభిప్రాయం కోసం వేచి ఉంది',
  },
  'No closing remarks provided.': { en: 'No closing remarks provided.', te: 'ముగింపు గమనికలు ఇవ్వలేదు.' },
  'Citizen confirmation is still pending before this complaint is fully closed.': {
    en: 'Citizen confirmation is still pending before this complaint is fully closed.',
    te: 'ఈ ఫిర్యాదు పూర్తిగా మూసివేయబడే ముందు పౌరుడి నిర్ధారణ ఇంకా రావాలి.',
  },
  'Citizen Confirmed and Closed': { en: 'Citizen Confirmed and Closed', te: 'పౌరుడు నిర్ధారించి మూసివేయబడింది' },
  'The citizen confirmed that the issue is fully solved.': {
    en: 'The citizen confirmed that the issue is fully solved.',
    te: 'ఈ సమస్య పూర్తిగా పరిష్కారమైందని పౌరుడు నిర్ధారించారు.',
  },
  'Citizen Feedback': { en: 'Citizen Feedback', te: 'పౌరుడి అభిప్రాయం' },
  'Decision': { en: 'Decision', te: 'నిర్ణయం' },
  'Complaint ID': { en: 'Complaint ID', te: 'ఫిర్యాదు ఐడి' },
  'Citizen Report': { en: 'Citizen Report', te: 'పౌరుడి నివేదిక' },
  'Work Proof': { en: 'Work Proof', te: 'పని రుజువు' },
  'Proof of work': { en: 'Proof of work', te: 'పని రుజువు' },
  'No image available': { en: 'No image available', te: 'చిత్రం అందుబాటులో లేదు' },
  'No proof image available': { en: 'No proof image available', te: 'రుజువు చిత్రం అందుబాటులో లేదు' },
  'No proof image uploaded yet': { en: 'No proof image uploaded yet', te: 'రుజువు చిత్రం ఇంకా అప్‌లోడ్ చేయలేదు' },
  'No citizen voice note attached.': { en: 'No citizen voice note attached.', te: 'పౌరుడి వాయిస్ నోట్ జతచేయలేదు.' },
  'No worker voice note uploaded yet.': { en: 'No worker voice note uploaded yet.', te: 'వర్కర్ వాయిస్ నోట్ ఇంకా అప్‌లోడ్ చేయలేదు.' },
  'Department': { en: 'Department', te: 'శాఖ' },
  'Status': { en: 'Status', te: 'స్థితి' },
  'Priority': { en: 'Priority', te: 'ప్రాధాన్యత' },
  'Reported On': { en: 'Reported On', te: 'నివేదించిన తేదీ' },
  'Location': { en: 'Location', te: 'స్థానం' },
  'Officer Notes': { en: 'Officer Notes', te: 'అధికారి గమనికలు' },
  'Updating role and department for': {
    en: 'Updating role and department for',
    te: 'పాత్ర మరియు శాఖను నవీకరిస్తున్నారు:',
  },
  'Cancel Editing': { en: 'Cancel Editing', te: 'సవరణ రద్దు చేయి' },
  'Edit': { en: 'Edit', te: 'సవరించు' },
  'Saving...': { en: 'Saving...', te: 'సేవ్ అవుతోంది...' },
  'Save Changes': { en: 'Save Changes', te: 'మార్పులు సేవ్ చేయి' },
  'Edit User': { en: 'Edit User', te: 'వినియోగదారుని సవరించు' },
  'Central Dashboard': { en: 'Central Dashboard', te: 'కేంద్ర డ్యాష్‌బోర్డ్' },
  'Department Officer Dashboard': { en: 'Department Officer Dashboard', te: 'శాఖ అధికారి డ్యాష్‌బోర్డ్' },
  'System Administrator': { en: 'System Administrator', te: 'సిస్టమ్ నిర్వాహకుడు' },
  'Refresh': { en: 'Refresh', te: 'రిఫ్రెష్' },
  'Total Issues': { en: 'Total Issues', te: 'మొత్తం సమస్యలు' },
  'Requires Action': { en: 'Requires Action', te: 'చర్య అవసరం' },
  'On Ground': { en: 'On Ground', te: 'స్థలంలో పని' },
  'High Priority': { en: 'High Priority', te: 'అధిక ప్రాధాన్యత' },
  'Loading complaints...': { en: 'Loading complaints...', te: 'ఫిర్యాదులు లోడ్ అవుతున్నాయి...' },
  'Issue': { en: 'Issue', te: 'సమస్య' },
  'Assigned To': { en: 'Assigned To', te: 'కేటాయించిన వ్యక్తి' },
  'Date': { en: 'Date', te: 'తేదీ' },
  'No active issues for your department!': {
    en: 'No active issues for your department!',
    te: 'మీ శాఖకు క్రియాశీల సమస్యలు లేవు!',
  },
  'ID': { en: 'ID', te: 'ఐడి' },
  'Not Assigned': { en: 'Not Assigned', te: 'ఇంకా కేటాయించలేదు' },
  'Issue Action Center': { en: 'Issue Action Center', te: 'సమస్య చర్య కేంద్రం' },
  'Before (Reported)': { en: 'Before (Reported)', te: 'ముందు (నివేదించినది)' },
  'After (Proof of Work)': { en: 'After (Proof of Work)', te: 'తర్వాత (పని రుజువు)' },
  'Wrong Department?': { en: 'Wrong Department?', te: 'తప్పు శాఖా?' },
  'Forward this complaint to the correct department': {
    en: 'Forward this complaint to the correct department',
    te: 'ఈ ఫిర్యాదును సరైన శాఖకు మళ్లించండి',
  },
  'Use this when the AI assigned the complaint to the wrong department. The case will be sent back as unassigned for the receiving department.': {
    en: 'Use this when the AI assigned the complaint to the wrong department. The case will be sent back as unassigned for the receiving department.',
    te: 'AI ఫిర్యాదును తప్పు శాఖకు కేటాయించినప్పుడు దీనిని ఉపయోగించండి. ఈ కేసు స్వీకరించే శాఖకు కేటాయించని స్థితిలో తిరిగి పంపబడుతుంది.',
  },
  'Forwarding...': { en: 'Forwarding...', te: 'మళ్లిస్తోంది...' },
  'Forward Case': { en: 'Forward Case', te: 'కేసును మళ్లించండి' },
  'Assign to Field Worker': { en: 'Assign to Field Worker', te: 'ఫీల్డ్ వర్కర్‌కు కేటాయించండి' },
  'Select an active worker to dispatch to this exact location.': {
    en: 'Select an active worker to dispatch to this exact location.',
    te: 'ఈ ఖచ్చితమైన ప్రదేశానికి పంపేందుకు క్రియాశీల వర్కర్‌ను ఎంచుకోండి.',
  },
  'No workers are available for this department right now.': {
    en: 'No workers are available for this department right now.',
    te: 'ఈ శాఖకు ప్రస్తుతం వర్కర్లు అందుబాటులో లేరు.',
  },
  'Assigning...': { en: 'Assigning...', te: 'కేటాయిస్తోంది...' },
  'Dispatch Worker': { en: 'Dispatch Worker', te: 'వర్కర్‌ను పంపండి' },
  'Waiting for Ground Worker': { en: 'Waiting for Ground Worker', te: 'ఫీల్డ్ వర్కర్ కోసం వేచి ఉంది' },
  'Review Ground Verification Proof': {
    en: 'Review Ground Verification Proof',
    te: 'ఫీల్డ్ ధృవీకరణ రుజువును సమీక్షించండి',
  },
  'Add official closing remarks or state why you are rejecting the work...': {
    en: 'Add official closing remarks or state why you are rejecting the work...',
    te: 'అధికారిక ముగింపు గమనికలు జోడించండి లేదా మీరు పనిని ఎందుకు తిరస్కరిస్తున్నారో వివరించండి...',
  },
  'Reject (Rework)': { en: 'Reject (Rework)', te: 'తిరస్కరించండి (మళ్లీ పని)' },
  'Verify & Close Issue': { en: 'Verify & Close Issue', te: 'ధృవీకరించి సమస్యను మూసివేయండి' },
  'Approved by Officer': { en: 'Approved by Officer', te: 'అధికారిచే ఆమోదించబడింది' },
  'Select a worker before dispatching this complaint.': {
    en: 'Select a worker before dispatching this complaint.',
    te: 'ఈ ఫిర్యాదును పంపించే ముందు ఒక వర్కర్‌ను ఎంచుకోండి.',
  },
  'Choose a different department to reroute this complaint.': {
    en: 'Choose a different department to reroute this complaint.',
    te: 'ఈ ఫిర్యాదును మళ్లించడానికి వేరే శాఖను ఎంచుకోండి.',
  },
  'Failed to forward complaint to the selected department.': {
    en: 'Failed to forward complaint to the selected department.',
    te: 'ఎంచుకున్న శాఖకు ఫిర్యాదును మళ్లించలేకపోయాం.',
  },
};

function humanize(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const LOCALES = {
  en: enLocale,
  te: teLocale,
};

function getLanguageBundle(language) {
  return LOCALES[language] || LOCALES.en;
}

function lookupBundleSection(section, language, key, fallback = key) {
  if (!key) return fallback;

  const bundle = getLanguageBundle(language);
  const englishBundle = LOCALES.en;
  return repairLocalizedText(bundle?.[section]?.[key] || englishBundle?.[section]?.[key] || fallback);
}

function lookup(map, language, value, fallback = value) {
  if (!value) return fallback;
  return repairLocalizedText(map[value]?.[language] || map[value]?.en || fallback);
}

export function translateCategory(language, value) {
  return lookupBundleSection('categories', language, value, humanize(value));
}

export function translateStatus(language, value) {
  return lookupBundleSection('statuses', language, value, humanize(value));
}

export function translatePriority(language, value) {
  return lookupBundleSection('priorities', language, value, value);
}

export function translateRole(language, value) {
  return lookupBundleSection('roles', language, value, humanize(value));
}

export function translateDepartment(language, value) {
  if (!value) return value;
  const direct = lookupBundleSection('departments', language, value, value);
  if (direct !== value || LOCALES.en.departments?.[value]) return direct;

  const match = Object.keys(LOCALES.en.departments || {}).find((key) => value.startsWith(key));
  if (!match) return repairLocalizedText(value);
  const translatedBase = lookupBundleSection('departments', language, match, match);
  return repairLocalizedText(value.replace(match, translatedBase));
}

export function translateMessage(language, message) {
  return lookupBundleSection('messages', language, message, repairLocalizedText(message));
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

const MOJIBAKE_PATTERN = /(?:Ã.|à.|â.|ð.|Ð.|Ñ.)/;

export function hasMojibake(value) {
  return typeof value === 'string' && MOJIBAKE_PATTERN.test(value);
}

export function repairLocalizedText(value) {
  if (typeof value !== 'string' || value.length === 0) return value;
  if (!MOJIBAKE_PATTERN.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const hasTelugu = /[\u0C00-\u0C7F]/.test(decoded);
    const reducedMojibake = (decoded.match(MOJIBAKE_PATTERN) || []).length < (value.match(MOJIBAKE_PATTERN) || []).length;
    return hasTelugu || reducedMojibake ? decoded : value;
  } catch {
    return value;
  }
}
