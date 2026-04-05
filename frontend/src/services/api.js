import axios from 'axios';
import { lookupLocationName } from '../utils/location';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').trim() || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const uploadComplaint = async (imageFile, priority, voiceFile = null, userEmail = null) => {
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

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchComplaints = async (userEmail = null, userRole = null, userDept = null) => {
  const params = new URLSearchParams();
  if (userEmail) params.append('user_email', userEmail);
  if (userRole) params.append('user_role', userRole);
  if (userDept) params.append('user_dept', userDept);
  
  const response = await api.get(`/complaints${params.toString() ? '?' + params.toString() : ''}`);
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

export const getAllUsers = async (adminEmail = null, adminRole = null) => {
  const params = new URLSearchParams();
  if (adminEmail) params.append('admin_email', adminEmail);
  if (adminRole) params.append('admin_role', adminRole);
  
  const response = await api.get(`/admin/users${params.toString() ? '?' + params.toString() : ''}`);
  return response.data;
};

export const assignUserRole = async (email, role, department = null, adminEmail = null, adminRole = null) => {
  const params = new URLSearchParams();
  if (adminEmail) params.append('admin_email', adminEmail);
  if (adminRole) params.append('admin_role', adminRole);
  
  const response = await api.post(`/admin/users/assign-role${params.toString() ? '?' + params.toString() : ''}`, {
    email,
    role,
    department
  });
  return response.data;
};

export const updateComplaint = async (id, data, userEmail = null, userRole = null) => {
  const params = new URLSearchParams();
  if (userEmail) params.append('user_email', userEmail);
  if (userRole) params.append('user_role', userRole);
  
  const response = await api.patch(`/complaints/${id}${params.toString() ? '?' + params.toString() : ''}`, data);
  return response.data;
};

export const uploadProof = async (id, imageFile, voiceFile = null) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (voiceFile) formData.append('voice', voiceFile);
  const response = await api.post(`/complaints/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitComplaintFeedback = async (id, feedback, comment = '', userEmail = null) => {
  const params = new URLSearchParams();
  if (userEmail) params.append('user_email', userEmail);

  const response = await api.post(
    `/complaints/${id}/feedback${params.toString() ? `?${params.toString()}` : ''}`,
    { feedback, comment },
  );
  return response.data;
};

export default api;
