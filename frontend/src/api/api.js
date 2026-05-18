import axios from 'axios';
import { getToken } from '../utils/auth';
import { mockApi } from './mockApi'; // Mock API import

/*
[[백엔드 연결 준비 사항들 정리]]
- API 응답 형식 변경
- 날짜 시간 형식 변경
- CORS 설정 확인
- - Spring Boot에서 다음과 같이 설정:
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")  // React 개발 서버
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
*/

// Mock 모드 설정 (true: Mock 사용, false: 실제 API 사용)
const USE_MOCK_API = false;

//나중에 실제 서버 IP로 변경
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mattermost_token');
      localStorage.removeItem('userType');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 실제 API 함수들
const realApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  updateProfile: (payload) => apiClient.post('/auth/profile', payload),
  changePassword: (payload) => apiClient.post('/auth/password', payload),
  checkAttendance: () => apiClient.post('/attendance/check-in'),
  getAttendanceHistory: (params) => apiClient.get('/attendance/history', { params }),
  getTodayAttendance: () => apiClient.get('/attendance/today'),
  getAttendanceSession: () => apiClient.get('/attendance/session'),
  saveAttendanceSchedule: (schedule) => apiClient.post('/attendance/session/schedule', schedule),
  openAttendanceSession: (durationMinutes) => apiClient.post('/attendance/session/open', { durationMinutes }),
  closeAttendanceSession: () => apiClient.delete('/attendance/session'),
  requestDeviceChange: (payload) => apiClient.post('/device/change-request', payload),
  getPendingRequests: () => apiClient.get('/teacher/pending-requests'),
  getTeacherStudents: () => apiClient.get('/teacher/students'),
  getCourseStudents: (courseCode) => apiClient.get(`/teacher/courses/${courseCode}/students`),
  getAdminUsers: () => apiClient.get('/admin/users'),
  createAdminUser: (payload) => apiClient.post('/admin/users', payload),
  deleteAdminUser: (username) => apiClient.delete(`/admin/users/${username}`),
  updateAdminUser: (username, payload) => apiClient.put(`/admin/users/${username}`, payload),
  getInvitations: () => apiClient.get('/admin/invitations'),
  createInvitation: (payload) => apiClient.post('/admin/invitations', payload),
  revokeInvitation: (code) => apiClient.delete(`/admin/invitations/${code}`),
  joinWithInvitation: (payload) => apiClient.post('/auth/join', payload),
  approveDeviceChange: (requestId) => apiClient.post(`/teacher/approve/${requestId}`),
  rejectDeviceChange: (requestId) => apiClient.post(`/teacher/reject/${requestId}`),
  getAllAttendanceRecords: (params) => apiClient.get('/teacher/attendance-records', { params }),
  getVideos: () => apiClient.get('/videos'),
  getVideoById: (videoId) => apiClient.get(`/videos/${videoId}`),
  getMyWatchHistory: () => apiClient.get('/videos/watch-history'),
  getAllWatchHistory: () => apiClient.get('/videos/watch-history/all'),
  saveWatchProgress: (videoId, payload) => apiClient.post(`/videos/${videoId}/progress`, payload),
  createVideo: (payload) => apiClient.post('/videos', payload),
  updateVideo: (videoId, payload) => apiClient.put(`/videos/${videoId}`, payload),
  deleteVideo: (videoId) => apiClient.delete(`/videos/${videoId}`),
  getAssignments: () => apiClient.get('/assignments'),
  getAssignmentById: (assignmentId) => apiClient.get(`/assignments/${assignmentId}`),
  getMySubmissions: () => apiClient.get('/assignments/submissions/me'),
  getMySubmission: (assignmentId) => apiClient.get(`/assignments/${assignmentId}/submission/me`),
  submitAssignment: (assignmentId, payload) => apiClient.post(`/assignments/${assignmentId}/submit`, payload),
  createAssignment: (payload) => apiClient.post('/assignments', payload),
  deleteAssignment: (assignmentId) => apiClient.delete(`/assignments/${assignmentId}`),
  getAllSubmissions: (assignmentId) => apiClient.get('/assignments/submissions', { params: { assignmentId } }),
  gradeSubmission: (submissionId, payload) => apiClient.post(`/assignments/submissions/${submissionId}/grade`, payload),
  getOfflineClasses: (params) => apiClient.get('/offline-classes', { params }),
  createOfflineClass: (payload) => apiClient.post('/offline-classes', payload),
  updateOfflineClass: (offlineClassId, payload) => apiClient.put(`/offline-classes/${offlineClassId}`, payload),
  deleteOfflineClass: (offlineClassId) => apiClient.delete(`/offline-classes/${offlineClassId}`),
};

// Mock 모드에 따라 API 선택
export const api = USE_MOCK_API ? mockApi : realApi;

export default apiClient;
