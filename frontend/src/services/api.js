import axios from 'axios';
import { lookupLocationName } from '../utils/location';
import { supabase } from './supabaseClient';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').trim() || '/api';
const GRADIO_API_URL = (import.meta.env.VITE_GRADIO_API_URL || 'https://4dcf97b9438c1f4ced.gradio.live/').trim();
const GRADIO_BASE_URL = GRADIO_API_URL.replace(/\/+$/, '');
const REPORT_MODE = (import.meta.env.VITE_REPORT_API_MODE || 'backend').trim().toLowerCase();
const SAVE_GRADIO_TO_BACKEND = (import.meta.env.VITE_GRADIO_SAVE_TO_BACKEND || 'true').trim().toLowerCase() === 'true';
const CONFIDENCE_THRESHOLD = 0.6;
const CATEGORY_TO_DEPARTMENT = {
  dead_animals: 'Sanitation Department',
  garbage: 'Sanitation Department',
  illegal_dumping: 'Sanitation Department',
  pothole: 'Road Department',
  sewer: 'Water Supply Department',
  streetlight: 'Electrical Department',
  waterlogging: 'Drainage Department',
};
const CATEGORY_ALIASES = {
  dead_animal: 'dead_animals',
  deadanimals: 'dead_animals',
  illegaldumping: 'illegal_dumping',
  illegal_dump: 'illegal_dumping',
  illegal_dumps: 'illegal_dumping',
  sewage: 'sewer',
  sewage_issue: 'sewer',
  sewage_issues: 'sewer',
  sewerage: 'sewer',
  street_light: 'streetlight',
  street_lights: 'streetlight',
  streetlight_problem: 'streetlight',
  streetlight_problems: 'streetlight',
  water_logging: 'waterlogging',
  water_logged: 'waterlogging',
};
const FEEDBACK_TO_STATUS = {
  solved: 'closed',
  partially_solved: 'in_review',
  not_solved: 'reopened',
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

const createMissingApiError = (message = 'Backend API is unavailable.') => {
  const error = new Error(message);
  error.isMissingApi = true;
  return error;
};

const isLikelyHtmlDocument = (payload) =>
  typeof payload === 'string' && /^\s*</.test(payload);

const normalizeCategoryKey = (value = '') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!normalized) return null;
  if (CATEGORY_TO_DEPARTMENT[normalized]) return normalized;
  if (CATEGORY_ALIASES[normalized]) return CATEGORY_ALIASES[normalized];

  const collapsed = normalized.replace(/_/g, '');
  const directMatch = Object.keys(CATEGORY_TO_DEPARTMENT).find((key) => key.replace(/_/g, '') === collapsed);
  return directMatch || null;
};

const normalizeTopPrediction = (raw) => {
  if (!raw) return { category: 'unknown', confidence: 0, scores: {} };

  if (Array.isArray(raw) && raw.length > 0) {
    return normalizeTopPrediction(raw[0]);
  }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    if (typeof raw.label === 'string') {
      const category = normalizeCategoryKey(raw.label) || 'unknown';
      const scores = Array.isArray(raw.confidences)
        ? Object.fromEntries(
            raw.confidences
              .map((c) => [normalizeCategoryKey(c.label), Number(c.confidence || 0)])
              .filter(([label]) => Boolean(label))
          )
        : {};
      const confidence = Array.isArray(raw.confidences)
        ? Number(scores[category] || raw.confidences.find((c) => c.label === raw.label)?.confidence || 0)
        : 0;
      return { category, confidence, scores };
    }

    const entries = Object.entries(raw)
      .map(([key, value]) => [normalizeCategoryKey(key), value])
      .filter(([key, value]) => Boolean(key) && typeof value === 'number');
    if (entries.length > 0) {
      const [category, confidence] = entries.sort((a, b) => b[1] - a[1])[0];
      return { category, confidence: Number(confidence || 0), scores: Object.fromEntries(entries) };
    }
  }

  if (typeof raw === 'string') {
    return { category: normalizeCategoryKey(raw) || 'unknown', confidence: 0, scores: {} };
  }

  return { category: 'unknown', confidence: 0, scores: {} };
};

const shouldUseSupabaseFallback = (error) => {
  if (error?.isMissingApi) return true;

  const status = error?.response?.status;
  if ([404, 405, 500, 502, 503, 504].includes(status)) return true;

  const contentType = String(error?.response?.headers?.['content-type'] || '').toLowerCase();
  if (contentType.includes('text/html') || isLikelyHtmlDocument(error?.response?.data)) return true;

  if (!error?.response) return true;

  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('failed to fetch')
  );
};

const getDepartmentFromCategory = (category) =>
  CATEGORY_TO_DEPARTMENT[category] || 'General Department';

const parseTopPredictionsText = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, scorePart] = line.split(':');
      const category = normalizeCategoryKey(labelPart);
      const confidence = Number.parseFloat(String(scorePart || '').trim());
      return {
        category,
        confidence: Number.isFinite(confidence) ? confidence : 0,
      };
    })
    .filter((item) => item.category);

const parseGradioSpaceResult = (payload) => {
  if (!Array.isArray(payload) || payload.length < 4) {
    throw new Error('Gradio API returned an unrecognized prediction format.');
  }

  const category = normalizeCategoryKey(payload[0]) || 'unknown';
  const confidence = Number.parseFloat(String(payload[2] || '0'));
  const top3 = parseTopPredictionsText(payload[3]);
  const normalizedConfidence = Number.isFinite(confidence)
    ? confidence
    : Number(top3[0]?.confidence || 0);
  const normalizedCategory = category !== 'unknown'
    ? category
    : (top3[0]?.category || 'unknown');

  return {
    category: normalizedCategory,
    confidence: normalizedConfidence,
    top3,
    department: String(payload[1] || getDepartmentFromCategory(normalizedCategory)),
    status: normalizedConfidence < CONFIDENCE_THRESHOLD ? 'needs_manual_review' : 'classified_only',
    message: 'Image classified using Gradio endpoint',
    prediction_source: 'gradio',
  };
};

const requestGradioPrediction = async (imageFile) => {
  if (!GRADIO_BASE_URL) {
    throw new Error('VITE_GRADIO_API_URL is missing. Set it in frontend/.env');
  }

  const uploadFormData = new FormData();
  uploadFormData.append('files', imageFile);

  const uploadResponse = await fetch(`${GRADIO_BASE_URL}/upload`, {
    method: 'POST',
    body: uploadFormData,
  });

  const uploadPayload = await uploadResponse.json().catch(() => null);

  if (!uploadResponse.ok || !Array.isArray(uploadPayload) || !uploadPayload[0]) {
    const errorMessage =
      uploadPayload?.error ||
      uploadPayload?.detail ||
      `Gradio upload failed with status ${uploadResponse.status}`;
    throw new Error(errorMessage);
  }

  const predictResponse = await fetch(`${GRADIO_BASE_URL}/call/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [{ path: uploadPayload[0] }],
    }),
  });

  const predictPayload = await predictResponse.json().catch(() => null);

  if (!predictResponse.ok || !predictPayload?.event_id) {
    const errorMessage =
      predictPayload?.error ||
      predictPayload?.detail ||
      `Gradio prediction failed with status ${predictResponse.status}`;
    throw new Error(errorMessage);
  }

  const eventResponse = await fetch(`${GRADIO_BASE_URL}/call/predict/${predictPayload.event_id}`);
  const eventText = await eventResponse.text();
  if (!eventResponse.ok) {
    throw new Error(`Failed to fetch Gradio prediction result (${eventResponse.status}).`);
  }

  const dataLine = eventText
    .split('\n')
    .find((line) => line.startsWith('data: '));

  if (!dataLine) {
    throw new Error('Gradio result stream did not include prediction data.');
  }

  return JSON.parse(dataLine.slice(6));
};

const appendPredictionToFormData = (formData, prediction) => {
  if (!formData || !prediction?.category) return;
  formData.set('prediction_category', prediction.category);
  formData.set('prediction_confidence', String(Number(prediction.confidence || 0)));

  if (Array.isArray(prediction.top3) && prediction.top3.length > 0) {
    formData.set(
      'prediction_top3',
      JSON.stringify(
        prediction.top3
          .map((item) => ({
            category: normalizeCategoryKey(item.category),
            confidence: Number(item.confidence || 0),
          }))
          .filter((item) => item.category)
      )
    );
  }
};

const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
};

const buildStoragePath = (filename = '', pathPrefix = '', defaultExtension = '.bin') => {
  const extensionMatch = filename.match(/(\.[a-z0-9]+)$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() || defaultExtension;
  const uniqueName =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const cleanPrefix = pathPrefix.replace(/^\/+|\/+$/g, '');
  return cleanPrefix ? `${cleanPrefix}/${uniqueName}${extension}` : `${uniqueName}${extension}`;
};

const uploadFileToSupabase = async (file, { bucketName = 'complaints', pathPrefix = '', defaultExtension = '.bin' } = {}) => {
  if (!file) return '';

  const storagePath = buildStoragePath(file.name, pathPrefix, defaultExtension);
  const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const publicUrl = getPublicUrl(bucketName, storagePath);
  if (!publicUrl) {
    throw new Error(`Storage upload succeeded but no public URL was returned for ${storagePath}`);
  }
  return publicUrl;
};

const fetchComplaintsFromSupabase = async (userEmail = null, userRole = null, userDept = null) => {
  let resolvedUserEmail = userEmail ? String(userEmail).trim().toLowerCase() : '';
  if (!resolvedUserEmail) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    resolvedUserEmail = String(user?.email || '').trim().toLowerCase();
  }

  let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

  if (userRole === 'admin') {
    // no filter
  } else if (userRole === 'officer') {
    if (userDept) query = query.ilike('department', `%${userDept}%`);
  } else if (userRole === 'worker') {
    if (resolvedUserEmail) query = query.eq('worker_id', resolvedUserEmail);
  } else if (resolvedUserEmail) {
    query = query.eq('user_email', resolvedUserEmail);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const fetchAnalyticsFromSupabase = async () => {
  const complaints = await fetchComplaintsFromSupabase(null, 'admin');
  const categories = {};
  const departments = {};
  const statuses = {};

  complaints.forEach((complaint) => {
    const category = complaint.category || 'unknown';
    const department = complaint.department || 'Unknown';
    const status = complaint.status || 'unknown';
    categories[category] = (categories[category] || 0) + 1;
    departments[department] = (departments[department] || 0) + 1;
    statuses[status] = (statuses[status] || 0) + 1;
  });

  return {
    total: complaints.length,
    resolved: complaints.filter((complaint) => complaint.status === 'closed').length,
    pending: complaints.filter((complaint) =>
      ['submitted', 'assigned', 'in_progress', 'waiting_approval', 'resolved', 'reopened', 'in_review'].includes(complaint.status)
    ).length,
    categories,
    departments,
    statuses,
  };
};

const fetchUsersFromSupabase = async () => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const extractMissingColumnName = (error) => {
  const message = String(error?.message || error?.details || error || '');
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
};

const upsertUserRoleInSupabase = async (email, role, department = null) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || 'citizen').trim().toLowerCase();
  const normalizedDepartment = ['officer', 'worker'].includes(normalizedRole)
    ? (department || null)
    : null;

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existingUser) {
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: normalizedRole,
        department: normalizedDepartment,
      })
      .eq('email', normalizedEmail)
      .select()
      .single();

    if (updateError) throw updateError;
    return {
      success: true,
      message: `User ${normalizedEmail} role updated to ${normalizedRole}`,
      user: updatedUser,
      persistence_mode: 'supabase_direct',
    };
  }

  const { data: createdUser, error: insertError } = await supabase
    .from('users')
    .insert([
      {
        email: normalizedEmail,
        role: normalizedRole,
        department: normalizedDepartment,
      },
    ])
    .select()
    .single();

  if (insertError) throw insertError;

  return {
    success: true,
    message: `New user ${normalizedEmail} created with role ${normalizedRole}`,
    user: createdUser,
    persistence_mode: 'supabase_direct',
  };
};

const updateComplaintInSupabase = async (id, data, { optionalFields = [] } = {}) => {
  const updateData = Object.fromEntries(
    Object.entries({
      ...data,
      updated_at: new Date().toISOString(),
    }).filter(([, value]) => value !== undefined)
  );

  if (updateData.worker_id && !updateData.status) {
    updateData.status = 'assigned';
  }

  if (updateData.status === 'resolved') {
    updateData.rejection_reason = null;
    updateData.citizen_feedback = null;
    updateData.feedback_comment = null;
    updateData.feedback_submitted_at = null;
  }

  const remainingUpdateData = { ...updateData };
  const optionalFieldSet = new Set(optionalFields);

  for (let attempt = 0; attempt <= optionalFieldSet.size; attempt += 1) {
    const { data: updated, error } = await supabase
      .from('complaints')
      .update(remainingUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (!error) return updated;

    const missingColumn = extractMissingColumnName(error);
    if (missingColumn && optionalFieldSet.has(missingColumn) && missingColumn in remainingUpdateData) {
      delete remainingUpdateData[missingColumn];
      continue;
    }

    throw error;
  }

  throw new Error('Failed to update complaint in Supabase.');
};

const uploadProofDirectlyToSupabase = async (id, imageFile, voiceFile = null) => {
  const proofUrl = await uploadFileToSupabase(imageFile, {
    bucketName: 'complaints',
    pathPrefix: 'proof',
    defaultExtension: '.jpg',
  });

  let workerVoiceUrl = null;
  if (voiceFile) {
    workerVoiceUrl = await uploadFileToSupabase(voiceFile, {
      bucketName: 'complaints',
      pathPrefix: 'voice/worker',
      defaultExtension: '.webm',
    });
  }

  const updatePayload = {
    proof_url: proofUrl,
    status: 'waiting_approval',
  };

  if (workerVoiceUrl) {
    updatePayload.worker_voice_url = workerVoiceUrl;
  }

  const complaint = await updateComplaintInSupabase(id, updatePayload, {
    optionalFields: ['worker_voice_url', 'updated_at'],
  });
  return {
    success: true,
    message: 'Proof uploaded and sent to officer for approval',
    complaint,
    persistence_mode: 'supabase_direct',
  };
};

const buildFallbackPrediction = async (imageFile) => {
  if (GRADIO_API_URL) {
    try {
      return await predictWithGradio(imageFile);
    } catch (error) {
      console.warn('Gradio fallback classification failed:', error);
    }
  }

  return {
    category: 'manual_review',
    confidence: 0,
    top3: [],
    department: 'General Department',
    status: 'needs_manual_review',
    message: 'Complaint saved for manual review because the backend classifier was unavailable.',
  };
};

const saveComplaintDirectlyToSupabase = async (formData, imageFile, voiceFile = null, userEmail = null, basePrediction = null) => {
  const prediction = basePrediction || (await buildFallbackPrediction(imageFile));
  let resolvedUserEmail = userEmail ? String(userEmail).trim().toLowerCase() : '';
  if (!resolvedUserEmail) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    resolvedUserEmail = String(user?.email || '').trim().toLowerCase();
  }
  const imageUrl = await uploadFileToSupabase(imageFile, {
    bucketName: 'complaints',
    pathPrefix: 'complaints',
    defaultExtension: '.jpg',
  });

  let voiceUrl = null;
  if (voiceFile) {
    voiceUrl = await uploadFileToSupabase(voiceFile, {
      bucketName: 'complaints',
      pathPrefix: 'voice/citizen',
      defaultExtension: '.webm',
    });
  }

  const confidence = Number(prediction?.confidence || 0);
  const category = prediction?.category || 'manual_review';
  const latitude = Number(formData.get('latitude') || 0);
  const longitude = Number(formData.get('longitude') || 0);
  const locationName = String(formData.get('location_name') || '').trim() || null;
  const priority = String(formData.get('priority') || 'Medium');
  const now = new Date().toISOString();
  const needsManualReview = confidence < CONFIDENCE_THRESHOLD;

  const payload = {
    category,
    confidence,
    department: getDepartmentFromCategory(category),
    priority,
    latitude,
    longitude,
    location_name: locationName,
    user_email: resolvedUserEmail || String(formData.get('user_email') || '').trim().toLowerCase() || 'anonymous@civic.local',
    status: 'submitted',
    image_url: imageUrl,
    is_confident: !needsManualReview,
    citizen_voice_url: voiceUrl,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('complaints').insert([payload]).select().single();
  if (error) throw error;

  const result = {
    category,
    confidence,
    department: payload.department,
    status: needsManualReview ? 'needs_manual_review' : 'submitted',
    message: needsManualReview ? 'Requires manual review' : 'Complaint submitted successfully',
    complaint_id: data?.id,
    persisted: true,
    persistence_mode: 'supabase_direct',
    prediction_source: prediction?.prediction_source || 'supabase_direct',
  };

  if (Array.isArray(prediction?.top3) && prediction.top3.length > 0 && needsManualReview) {
    result.top3 = prediction.top3;
  }

  return result;
};

export const predictWithGradio = async (imageFile) => {
  if (!GRADIO_BASE_URL) {
    throw new Error('VITE_GRADIO_API_URL is missing. Set it in frontend/.env');
  }

  const result = await requestGradioPrediction(imageFile);
  return parseGradioSpaceResult(result);
};

const buildComplaintFormData = async (imageFile, priority, voiceFile = null, userEmail = null) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('priority', priority);
  if (voiceFile) formData.append('voice', voiceFile);
  if (userEmail) formData.append('user_email', userEmail);

  if ('geolocation' in navigator) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      formData.append('latitude', pos.coords.latitude);
      formData.append('longitude', pos.coords.longitude);
      const locationName = await lookupLocationName(pos.coords.latitude, pos.coords.longitude);
      if (locationName) formData.append('location_name', locationName);
    } catch {
      formData.append('latitude', '0');
      formData.append('longitude', '0');
    }
  }
  return formData;
};

export const uploadComplaint = async (imageFile, priority, voiceFile = null, userEmail = null) => {
  const formData = await buildComplaintFormData(imageFile, priority, voiceFile, userEmail);
  let gradioPrediction = null;

  if (GRADIO_API_URL) {
    try {
      gradioPrediction = await predictWithGradio(imageFile);
      appendPredictionToFormData(formData, gradioPrediction);
    } catch (error) {
      console.warn('Gradio prediction unavailable, falling back to backend classifier:', error);
      if (REPORT_MODE === 'gradio') {
        gradioPrediction = null;
      }
    }
  }

  if (REPORT_MODE === 'gradio' && gradioPrediction && !SAVE_GRADIO_TO_BACKEND) {
    return gradioPrediction;
  }

  if (REPORT_MODE === 'gradio' && !gradioPrediction && !SAVE_GRADIO_TO_BACKEND) {
    throw new Error('Gradio classification is unavailable right now.');
  }

  if (REPORT_MODE === 'gradio' && SAVE_GRADIO_TO_BACKEND) {
    if (!gradioPrediction) {
      throw new Error('Gradio classification is unavailable right now.');
    }
    return saveComplaintDirectlyToSupabase(formData, imageFile, voiceFile, userEmail, gradioPrediction);
  }

  const mergePersistedResponse = (payload) => {
    if (!gradioPrediction) return payload;
    return {
      ...gradioPrediction,
      ...payload,
      top3: payload?.top3 || gradioPrediction.top3,
      department: payload?.department || gradioPrediction.department,
      prediction_source: payload?.prediction_source || gradioPrediction.prediction_source,
    };
  };

  try {
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response?.data || isLikelyHtmlDocument(response.data)) {
      throw createMissingApiError('Backend upload API returned an invalid response.');
    }
    return mergePersistedResponse(response.data);
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return saveComplaintDirectlyToSupabase(formData, imageFile, voiceFile, userEmail, gradioPrediction || undefined);
    }

    if (REPORT_MODE === 'gradio' && gradioPrediction) {
      return {
        ...gradioPrediction,
        persisted: false,
        warning: error?.response?.data?.error || 'Classification succeeded, but complaint persistence failed.',
      };
    }
    throw error;
  }
};

export const fetchComplaints = async (userEmail = null, userRole = null, userDept = null) => {
  const params = new URLSearchParams();
  if (userEmail) params.append('user_email', userEmail);
  if (userRole) params.append('user_role', userRole);
  if (userDept) params.append('user_dept', userDept);

  try {
    const response = await api.get(`/complaints${params.toString() ? '?' + params.toString() : ''}`);
    const payload = response?.data;
    if (isLikelyHtmlDocument(payload)) {
      throw createMissingApiError('Backend complaints API returned HTML instead of JSON.');
    }
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return fetchComplaintsFromSupabase(userEmail, userRole, userDept);
    }
    throw error;
  }
};

export const fetchAnalytics = async () => {
  try {
    const response = await api.get('/analytics');
    if (!response?.data || isLikelyHtmlDocument(response.data)) {
      throw createMissingApiError('Backend analytics API returned an invalid response.');
    }
    return response.data;
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return fetchAnalyticsFromSupabase();
    }
    throw error;
  }
};

export const getAllUsers = async (adminEmail = null, adminRole = null) => {
  const params = new URLSearchParams();
  if (adminEmail) params.append('admin_email', adminEmail);
  if (adminRole) params.append('admin_role', adminRole);

  try {
    const response = await api.get(`/admin/users${params.toString() ? '?' + params.toString() : ''}`);
    const payload = response?.data;
    if (isLikelyHtmlDocument(payload)) {
      throw createMissingApiError('Backend users API returned HTML instead of JSON.');
    }
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } catch (error) {
    if (shouldUseSupabaseFallback(error) || (error?.response?.status === 403 && adminRole === 'officer')) {
      return fetchUsersFromSupabase();
    }
    throw error;
  }
};

export const assignUserRole = async (email, role, department = null, adminEmail = null, adminRole = null) => {
  const params = new URLSearchParams();
  if (adminEmail) params.append('admin_email', adminEmail);
  if (adminRole) params.append('admin_role', adminRole);

  try {
    const response = await api.post(`/admin/users/assign-role${params.toString() ? '?' + params.toString() : ''}`, {
      email,
      role,
      department,
    });
    if (!response?.data || isLikelyHtmlDocument(response.data)) {
      throw createMissingApiError('Backend role assignment API returned an invalid response.');
    }
    return response.data;
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return upsertUserRoleInSupabase(email, role, department);
    }
    throw error;
  }
};

export const updateComplaint = async (id, data, userEmail = null, userRole = null) => {
  const params = new URLSearchParams();
  if (userEmail) params.append('user_email', userEmail);
  if (userRole) params.append('user_role', userRole);

  try {
    const response = await api.patch(`/complaints/${id}${params.toString() ? '?' + params.toString() : ''}`, data);
    if (!response?.data || isLikelyHtmlDocument(response.data)) {
      throw createMissingApiError('Backend complaint update API returned an invalid response.');
    }
    return response.data;
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return updateComplaintInSupabase(id, data);
    }
    throw error;
  }
};

export const uploadProof = async (id, imageFile, voiceFile = null) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (voiceFile) formData.append('voice', voiceFile);
  try {
    const response = await api.post(`/complaints/${id}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response?.data || isLikelyHtmlDocument(response.data)) {
      throw createMissingApiError('Backend proof upload API returned an invalid response.');
    }
    return response.data;
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return uploadProofDirectlyToSupabase(id, imageFile, voiceFile);
    }
    throw error;
  }
};

const submitComplaintFeedbackInSupabase = async (id, feedback, comment = '', userEmail = null) => {
  const normalizedFeedback = String(feedback || '').trim().toLowerCase();
  const normalizedUserEmail = String(userEmail || '').trim().toLowerCase();
  const nextStatus = FEEDBACK_TO_STATUS[normalizedFeedback];

  if (!nextStatus) {
    throw new Error(`Invalid feedback. Must be one of ${Object.keys(FEEDBACK_TO_STATUS).join(', ')}`);
  }

  if (!normalizedUserEmail) {
    throw new Error('Missing user email');
  }

  const { data: complaint, error: fetchError } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!complaint) throw new Error('Complaint not found');

  const ownerEmail = String(complaint.user_email || '').trim().toLowerCase();
  if (ownerEmail !== normalizedUserEmail) {
    throw new Error('You can only submit feedback for your own complaints');
  }

  if (complaint.status !== 'resolved') {
    throw new Error('Feedback can only be submitted after the officer marks the issue as resolved.');
  }

  const feedbackComment = String(comment || '').trim() || null;
  const updatedComplaint = await updateComplaintInSupabase(
    id,
    {
      citizen_feedback: normalizedFeedback,
      feedback_comment: feedbackComment,
      feedback_submitted_at: new Date().toISOString(),
      status: nextStatus,
    },
    {
      optionalFields: ['citizen_feedback', 'feedback_comment', 'feedback_submitted_at', 'updated_at'],
    },
  );

  return {
    success: true,
    message: 'Feedback submitted successfully',
    complaint: updatedComplaint,
    persistence_mode: 'supabase_direct',
  };
};

export const submitComplaintFeedback = async (id, feedback, comment = '', userEmail = null) => {
  const params = new URLSearchParams();
  if (userEmail) params.append('user_email', userEmail);

  try {
    const response = await api.post(
      `/complaints/${id}/feedback${params.toString() ? `?${params.toString()}` : ''}`,
      { feedback, comment },
    );
    if (!response?.data || isLikelyHtmlDocument(response.data)) {
      throw createMissingApiError('Backend feedback API returned an invalid response.');
    }
    return response.data;
  } catch (error) {
    if (shouldUseSupabaseFallback(error)) {
      return submitComplaintFeedbackInSupabase(id, feedback, comment, userEmail);
    }
    throw error;
  }
};

export default api;
