// Local Storage 키
const STORAGE_KEY = 'mock_attendance_data';

// Mock 데이터 불러오기
const loadMockData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    if (!data.userSessions) data.userSessions = {};
    if (!data.videos) data.videos = getDefaultVideos();
    if (!data.watchHistory) data.watchHistory = {};
    if (!data.assignments) data.assignments = getDefaultAssignments();
    if (!data.submissions) data.submissions = [];
    if (!data.attendanceSession) data.attendanceSession = { isOpen: false, openedAt: null, closeAt: null };
    if (!data.attendanceSchedule) data.attendanceSchedule = { startTime: null, durationMinutes: 10, enabled: false };
    return data;
  }
  return {
    users: [
      { username: 'student01', password: '1234', userType: 'student', userId: 'S001', name: '김학생' },
      { username: 'student02', password: '1234', userType: 'student', userId: 'S002', name: '이학생' },
      { username: 'teacher01', password: '1234', userType: 'teacher', userId: 'T001', name: '박강사' },
    ],
    attendanceHistory: {},
    registeredDevices: {},
    userSessions: {},
    deviceChangeRequests: [],
    allAttendanceRecords: [],
    videos: getDefaultVideos(),
    watchHistory: {},
    assignments: getDefaultAssignments(),
    submissions: [],
    attendanceSession: { isOpen: false, openedAt: null, closeAt: null },
    attendanceSchedule: { startTime: null, durationMinutes: 10, enabled: false },
  };
};

const getDefaultVideos = () => [
  { id: 1, title: '1주차 - React 기초', courseId: 'REACT101', courseName: 'React 웹 개발', videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', duration: '3:41:26', description: 'React의 기본 개념과 컴포넌트에 대해 배웁니다.', uploadDate: '2024-01-01T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/Tn6-PIqc4UM/maxresdefault.jpg' },
  { id: 2, title: '2주차 - React Hooks', courseId: 'REACT101', courseName: 'React 웹 개발', videoUrl: 'https://www.youtube.com/watch?v=g0mNOv_3YKg', duration: '16:27', description: 'useState, useEffect 등 React Hooks를 학습합니다.', uploadDate: '2024-01-08T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/g0mNOv_3YKg/maxresdefault.jpg' },
  { id: 3, title: '3주차 - 컴포넌트 심화', courseId: 'REACT101', courseName: 'React 웹 개발', videoUrl: 'https://www.youtube.com/watch?v=EqSRgpswwWE', duration: '21:03', description: '컴포넌트 재사용과 props에 대해 깊이 있게 다룹니다.', uploadDate: '2024-01-15T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/EqSRgpswwWE/maxresdefault.jpg' },
  { id: 4, title: '1주차 - JavaScript ES6', courseId: 'JS101', courseName: 'JavaScript 기초', videoUrl: 'https://www.youtube.com/watch?v=KF6t61yuEKY', duration: '2:26:26', description: 'JavaScript ES6의 새로운 기능들을 배웁니다.', uploadDate: '2024-01-01T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/KF6t61yuEKY/maxresdefault.jpg' },
];

const getDefaultAssignments = () => [
  { id: 1, title: 'React 컴포넌트 만들기', courseId: 'REACT101', courseName: 'React 웹 개발', description: 'useState를 사용한 간단한 카운터 컴포넌트를 만들어 제출하세요.', dueDate: '2024-02-15T23:59:59Z', maxScore: 100, teacherId: 'T001', teacherName: '박강사', createdAt: '2024-01-20T09:00:00Z' },
  { id: 2, title: 'JavaScript 배열 메소드 실습', courseId: 'JS101', courseName: 'JavaScript 기초', description: '배열의 map, filter, reduce를 사용하여 다음 문제를 해결하세요.', dueDate: '2024-02-20T23:59:59Z', maxScore: 100, teacherId: 'T001', teacherName: '박강사', createdAt: '2024-01-22T09:00:00Z' },
];

const saveMockData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

let mockData = loadMockData();
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  login: async (credentials) => {
    await delay();
    mockData = loadMockData();
    const user = mockData.users.find(u => u.username === credentials.username && u.password === credentials.password);
    if (!user) throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
    if (!mockData.userSessions) mockData.userSessions = {};
    const newToken = `mock-token-${user.userId}-${Date.now()}`;
    mockData.userSessions[user.userId] = newToken;
    saveMockData(mockData);
    return { data: { token: newToken, userType: user.userType, userId: user.userId, name: user.name } };
  },

  checkAttendance: async (deviceInfo) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const userId = currentUser.userId;
    const currentToken = localStorage.getItem('mattermost_token');

    applySchedule(mockData);
    saveMockData(mockData);

    if (!mockData.attendanceSession.isOpen) {
      throw { response: { data: { success: false, message: '출석 가능 시간이 아닙니다. 강사가 설정한 출석 시간을 확인해주세요.' } } };
    }

    const registeredDevice = mockData.registeredDevices[userId];
    if (!registeredDevice) {
      mockData.registeredDevices[userId] = { ...deviceInfo, sessionToken: currentToken };
      const record = { id: Date.now(), userId, studentId: userId, studentName: currentUser.name, timestamp: new Date().toISOString(), status: 'success', isNewDevice: true, deviceInfo };
      if (!mockData.attendanceHistory[userId]) mockData.attendanceHistory[userId] = [];
      mockData.attendanceHistory[userId].push(record);
      mockData.allAttendanceRecords.push(record);
      saveMockData(mockData);
      return { data: { success: true, message: '출석이 완료되었습니다! (기기 정보가 등록되었습니다)', isNewDevice: true, timestamp: record.timestamp } };
    }

    if (registeredDevice.sessionToken !== currentToken) {
      throw { response: { data: { success: false, message: '등록된 기기와 다릅니다. 기기 변경 요청을 해주세요.', requiresDeviceChange: true } } };
    }

    const isSameDevice = registeredDevice.userAgent === deviceInfo.userAgent && registeredDevice.platform === deviceInfo.platform;
    if (!isSameDevice) {
      throw { response: { data: { success: false, message: '등록된 기기와 다릅니다. 기기 변경 요청을 해주세요.', requiresDeviceChange: true } } };
    }

    const record = { id: Date.now(), userId, studentId: userId, studentName: currentUser.name, timestamp: new Date().toISOString(), status: 'success', isNewDevice: false, deviceInfo };
    if (!mockData.attendanceHistory[userId]) mockData.attendanceHistory[userId] = [];
    mockData.attendanceHistory[userId].push(record);
    mockData.allAttendanceRecords.push(record);
    saveMockData(mockData);
    return { data: { success: true, message: '출석이 완료되었습니다!', isNewDevice: false, timestamp: record.timestamp } };
  },

  getAttendanceHistory: async () => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    return { data: (mockData.attendanceHistory[currentUser.userId] || []).slice().reverse() };
  },

  requestDeviceChange: async () => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const existingRequest = mockData.deviceChangeRequests.find(req => req.studentId === currentUser.userId && req.status === 'pending');
    if (existingRequest) throw { response: { data: { message: '이미 승인 대기 중인 요청이 있습니다.' } } };
    const request = { id: Date.now(), studentId: currentUser.userId, studentName: currentUser.name, email: `${currentUser.userId}@example.com`, requestTime: new Date().toISOString(), currentDeviceInfo: mockData.registeredDevices[currentUser.userId] || {}, status: 'pending' };
    mockData.deviceChangeRequests.push(request);
    saveMockData(mockData);
    return { data: { success: true, message: '기기 변경 요청이 전송되었습니다.', requestId: request.id } };
  },

  getPendingRequests: async () => {
    await delay();
    mockData = loadMockData();
    return { data: mockData.deviceChangeRequests.filter(req => req.status === 'pending') };
  },

  approveDeviceChange: async (requestId) => {
    await delay();
    mockData = loadMockData();
    const request = mockData.deviceChangeRequests.find(req => req.id === requestId);
    if (!request) throw new Error('요청을 찾을 수 없습니다.');
    delete mockData.registeredDevices[request.studentId];
    if (mockData.userSessions) delete mockData.userSessions[request.studentId];
    request.status = 'approved';
    request.approvedTime = new Date().toISOString();
    saveMockData(mockData);
    return { data: { success: true, message: '승인이 완료되었습니다.' } };
  },

  rejectDeviceChange: async (requestId) => {
    await delay();
    mockData = loadMockData();
    const request = mockData.deviceChangeRequests.find(req => req.id === requestId);
    if (!request) throw new Error('요청을 찾을 수 없습니다.');
    request.status = 'rejected';
    request.rejectedTime = new Date().toISOString();
    saveMockData(mockData);
    return { data: { success: true, message: '거절되었습니다.' } };
  },

  getAllAttendanceRecords: async () => {
    await delay();
    mockData = loadMockData();
    return { data: mockData.allAttendanceRecords.slice().reverse() };
  },

  getVideos: async () => {
    await delay();
    mockData = loadMockData();
    return { data: mockData.videos };
  },

  getVideoById: async (videoId) => {
    await delay();
    mockData = loadMockData();
    const video = mockData.videos.find(v => v.id === parseInt(videoId));
    if (!video) throw new Error('영상을 찾을 수 없습니다.');
    return { data: video };
  },

  saveWatchProgress: async (videoId, progress) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const userId = currentUser.userId;
    if (!mockData.watchHistory[userId]) mockData.watchHistory[userId] = {};
    mockData.watchHistory[userId][videoId] = { videoId, watchedTime: progress.watchedTime, totalTime: progress.totalTime, percentage: Math.floor((progress.watchedTime / progress.totalTime) * 100), completed: progress.watchedTime / progress.totalTime >= 0.9, lastWatchedAt: new Date().toISOString() };
    saveMockData(mockData);
    return { data: { success: true, message: '시청 기록이 저장되었습니다.' } };
  },

  getMyWatchHistory: async () => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    return { data: mockData.watchHistory[currentUser.userId] || {} };
  },

  createVideo: async (videoData) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const getYouTubeId = (url) => { const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/; const match = url.match(regExp); return (match && match[2].length === 11) ? match[2] : null; };
    const youtubeId = getYouTubeId(videoData.videoUrl);
    const newVideo = { id: Date.now(), title: videoData.title, courseId: videoData.courseId || 'DEFAULT', courseName: videoData.courseName || '기타', videoUrl: videoData.videoUrl, duration: videoData.duration || '0:00', description: videoData.description, uploadDate: new Date().toISOString(), teacherId: currentUser.userId, teacherName: currentUser.name, thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : '' };
    mockData.videos.push(newVideo);
    saveMockData(mockData);
    return { data: { success: true, message: '영상이 등록되었습니다.', video: newVideo } };
  },

  deleteVideo: async (videoId) => {
    await delay();
    mockData = loadMockData();
    const index = mockData.videos.findIndex(v => v.id === parseInt(videoId));
    if (index === -1) throw new Error('영상을 찾을 수 없습니다.');
    mockData.videos.splice(index, 1);
    saveMockData(mockData);
    return { data: { success: true, message: '영상이 삭제되었습니다.' } };
  },

  getAllWatchHistory: async () => {
    await delay();
    mockData = loadMockData();
    const result = [];
    Object.keys(mockData.watchHistory).forEach(userId => {
      const user = mockData.users.find(u => u.userId === userId);
      const userHistory = mockData.watchHistory[userId];
      Object.keys(userHistory).forEach(videoId => {
        const video = mockData.videos.find(v => v.id === parseInt(videoId));
        const history = userHistory[videoId];
        result.push({ studentId: userId, studentName: user?.name || '알 수 없음', videoId: parseInt(videoId), videoTitle: video?.title || '삭제된 영상', percentage: history.percentage, completed: history.completed, lastWatchedAt: history.lastWatchedAt });
      });
    });
    return { data: result };
  },

  getAssignments: async () => {
    await delay();
    mockData = loadMockData();
    return { data: mockData.assignments };
  },

  getAssignmentById: async (assignmentId) => {
    await delay();
    mockData = loadMockData();
    const assignment = mockData.assignments.find(a => a.id === parseInt(assignmentId));
    if (!assignment) throw new Error('과제를 찾을 수 없습니다.');
    return { data: assignment };
  },

  submitAssignment: async (assignmentId, submissionData) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const existingIndex = mockData.submissions.findIndex(s => s.assignmentId === parseInt(assignmentId) && s.studentId === currentUser.userId);
    const submission = { id: existingIndex >= 0 ? mockData.submissions[existingIndex].id : Date.now(), assignmentId: parseInt(assignmentId), studentId: currentUser.userId, studentName: currentUser.name, content: submissionData.content, submittedAt: new Date().toISOString(), score: null, feedback: null, gradedAt: null };
    if (existingIndex >= 0) mockData.submissions[existingIndex] = submission;
    else mockData.submissions.push(submission);
    saveMockData(mockData);
    return { data: { success: true, message: '과제가 제출되었습니다.', submission } };
  },

  getMySubmissions: async () => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    return { data: mockData.submissions.filter(s => s.studentId === currentUser.userId) };
  },

  getMySubmission: async (assignmentId) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    return { data: mockData.submissions.find(s => s.assignmentId === parseInt(assignmentId) && s.studentId === currentUser.userId) || null };
  },

  createAssignment: async (assignmentData) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const newAssignment = { id: Date.now(), title: assignmentData.title, courseId: assignmentData.courseId || 'DEFAULT', courseName: assignmentData.courseName || '기타', description: assignmentData.description, dueDate: assignmentData.dueDate, maxScore: assignmentData.maxScore || 100, teacherId: currentUser.userId, teacherName: currentUser.name, createdAt: new Date().toISOString() };
    mockData.assignments.push(newAssignment);
    saveMockData(mockData);
    return { data: { success: true, message: '과제가 등록되었습니다.', assignment: newAssignment } };
  },

  deleteAssignment: async (assignmentId) => {
    await delay();
    mockData = loadMockData();
    const index = mockData.assignments.findIndex(a => a.id === parseInt(assignmentId));
    if (index === -1) throw new Error('과제를 찾을 수 없습니다.');
    mockData.assignments.splice(index, 1);
    mockData.submissions = mockData.submissions.filter(s => s.assignmentId !== parseInt(assignmentId));
    saveMockData(mockData);
    return { data: { success: true, message: '과제가 삭제되었습니다.' } };
  },

  getAllSubmissions: async (assignmentId) => {
    await delay();
    mockData = loadMockData();
    let submissions = mockData.submissions;
    if (assignmentId) submissions = submissions.filter(s => s.assignmentId === parseInt(assignmentId));
    return { data: submissions };
  },

  // ── 출석 세션 & 스케줄 API ─────────────────────

  getAttendanceSession: async () => {
    await delay(100);
    mockData = loadMockData();
    applySchedule(mockData);
    saveMockData(mockData);
    return { data: { session: mockData.attendanceSession, schedule: mockData.attendanceSchedule } };
  },

  // ★ 저장만 함 - applySchedule 호출 안 함 (다음 폴링에서 자동 적용)
  saveAttendanceSchedule: async (schedule) => {
    await delay();
    mockData = loadMockData();
    mockData.attendanceSchedule = { ...schedule };
    saveMockData(mockData);
    return { data: { success: true, schedule: mockData.attendanceSchedule } };
  },

  openAttendanceSession: async (durationMinutes) => {
    await delay();
    mockData = loadMockData();
    const openedAt = new Date();
    const closeAt = new Date(openedAt.getTime() + durationMinutes * 60 * 1000);
    mockData.attendanceSession = { isOpen: true, openedAt: openedAt.toISOString(), closeAt: closeAt.toISOString() };
    saveMockData(mockData);
    return { data: { success: true, session: mockData.attendanceSession } };
  },

  closeAttendanceSession: async () => {
    await delay();
    mockData = loadMockData();
    mockData.attendanceSession = { ...mockData.attendanceSession, isOpen: false };
    saveMockData(mockData);
    return { data: { success: true } };
  },

  gradeSubmission: async (submissionId, gradeData) => {
    await delay();
    mockData = loadMockData();
    const submission = mockData.submissions.find(s => s.id === parseInt(submissionId));
    if (!submission) throw new Error('제출물을 찾을 수 없습니다.');
    submission.score = gradeData.score;
    submission.feedback = gradeData.feedback;
    submission.gradedAt = new Date().toISOString();
    saveMockData(mockData);
    return { data: { success: true, message: '채점이 완료되었습니다.', submission } };
  },
};

function getCurrentUser() {
  const token = localStorage.getItem('mattermost_token');
  if (!token) throw new Error('로그인이 필요합니다.');
  const userId = token.split('-')[2];
  return mockData.users.find(u => u.userId === userId);
}

function applySchedule(data) {
  const schedule = data.attendanceSchedule;
  const session = data.attendanceSession;

  const validTime = /^\d{1,2}:\d{2}$/.test(String(schedule?.startTime || ''));
  if (!schedule || !schedule.enabled || !validTime) {
    if (session.isOpen && session.closeAt && new Date() >= new Date(session.closeAt)) {
      data.attendanceSession.isOpen = false;
    }
    return;
  }

  const now = new Date();
  const [hh, mm] = schedule.startTime.split(':').map(Number);

  const openAt = new Date(now);
  openAt.setHours(hh, mm, 0, 0);
  const closeAt = new Date(openAt.getTime() + (schedule.durationMinutes || 10) * 60 * 1000);

  if (isNaN(openAt.getTime()) || isNaN(closeAt.getTime())) {
    if (session.isOpen && session.closeAt && new Date() >= new Date(session.closeAt)) {
      data.attendanceSession.isOpen = false;
    }
    return;
  }

if (now >= openAt && now < closeAt) {
  data.attendanceSession = {
    isOpen: true,
    openedAt: openAt.toISOString(),
    closeAt: closeAt.toISOString(),
  };
} else {
  data.attendanceSession.isOpen = false;
}
}

export const resetMockData = () => {
  localStorage.removeItem(STORAGE_KEY);
  mockData = loadMockData();
  console.log('Mock 데이터가 초기화되었습니다.');
};