import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  getCostTrends: async (params?: {
    period?: string;
    department?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.get('/analytics/cost-trends', { params });
    return response.data;
  },

  getLicenseUtilization: async (params?: {
    applicationId?: string;
    department?: string;
    threshold?: number;
  }): Promise<ApiResponse> => {
    const response = await apiClient.get('/analytics/license-utilization', { params });
    return response.data;
  },

  getDepartmentBreakdown: async (params?: {
    period?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.get('/analytics/department-breakdown', { params });
    return response.data;
  },

  getRecommendations: async (params?: {
    priority?: string;
    type?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.get('/analytics/recommendations', { params });
    return response.data;
  },

  exportData: async (params: {
    format?: string;
    type?: string;
    dateRange?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.get('/analytics/export', { params });
    return response.data;
  },
};

// Applications API
export const applicationsAPI = {
  getAll: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.get(`/applications/${id}`);
    return response.data;
  },

  create: async (applicationData: {
    name: string;
    vendor: string;
    category: string;
    description?: string;
    website?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post('/applications', applicationData);
    return response.data;
  },
};

// Licenses API
export const licensesAPI = {
  getAll: async (params?: {
    applicationId?: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get('/licenses', { params });
    return response.data;
  },

  create: async (licenseData: {
    applicationId: string;
    userId?: string;
    licenseType: string;
    cost: number;
    billingCycle: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post('/licenses', licenseData);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (params?: {
    department?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  uploadInvoice: async (file: File, metadata: {
    vendor?: string;
    period?: string;
    description?: string;
  }): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const response = await apiClient.post('/upload/invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadUsageReport: async (file: File, metadata: {
    application?: string;
    reportType?: string;
    dateRange?: string;
  }): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const response = await apiClient.post('/upload/usage-report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadLicenseExport: async (file: File, metadata: {
    source?: string;
    exportDate?: string;
  }): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const response = await apiClient.post('/upload/license-export', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getFileStatus: async (fileId: string): Promise<ApiResponse> => {
    const response = await apiClient.get(`/upload/status/${fileId}`);
    return response.data;
  },
};

// Integrations API
export const integrationsAPI = {
  getAll: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/integrations');
    return response.data;
  },

  connectMicrosoft: async (credentials: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post('/integrations/microsoft', credentials);
    return response.data;
  },
};

// Alerts API
export const alertsAPI = {
  getAll: async (params?: {
    type?: string;
    severity?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get('/alerts', { params });
    return response.data;
  },

  markAsRead: async (alertId: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/alerts/${alertId}/read`);
    return response.data;
  },

  resolve: async (alertId: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/alerts/${alertId}/resolve`);
    return response.data;
  },
};

// Export all APIs
export default {
  auth: authAPI,
  analytics: analyticsAPI,
  applications: applicationsAPI,
  licenses: licensesAPI,
  users: usersAPI,
  upload: uploadAPI,
  integrations: integrationsAPI,
  alerts: alertsAPI,
};