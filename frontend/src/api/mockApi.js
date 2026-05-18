// ── 버전 관리 ──────────────────────────────────────────
const STORAGE_KEY = 'mock_attendance_data';
const MOCK_VERSION = 3;

// ── 기본 데이터 생성 함수들 ────────────────────────────
const getDefaultUsers = () => [
  {
    username: 'student01', password: '1234', userType: 'student', userId: 'S001',
    name: '김학생', displayName: '김학생', email: 'student01@test.com',
    academyName: '스타토치',
    courses: [{ courseId: 'course-web', courseName: '웹프로그래밍' }],
    schedules: [
      { courseId: 'course-web', courseName: '웹프로그래밍', dayOfWeek: 'MON', classType: 'offline', startTime: '19:00', endTime: '21:00' },
    ],
  },
  {
    username: 'student02', password: '1234', userType: 'student', userId: 'S002',
    name: '이학생', displayName: '이학생', email: 'student02@test.com',
    academyName: '스타토치',
    courses: [
      { courseId: 'course-web', courseName: '웹프로그래밍' },
      { courseId: 'course-java', courseName: 'Java 기초반' },
    ],
    schedules: [
      { courseId: 'course-web', courseName: '웹프로그래밍', dayOfWeek: 'MON', classType: 'offline', startTime: '19:00', endTime: '21:00' },
      { courseId: 'course-java', courseName: 'Java 기초반', dayOfWeek: 'WED', classType: 'offline', startTime: '14:00', endTime: '17:00' },
    ],
  },
  {
    username: 'student03', password: '1234', userType: 'student', userId: 'S003',
    name: '박학생', displayName: '박학생', email: 'student03@test.com',
    academyName: '스타토치',
    courses: [{ courseId: 'course-java', courseName: 'Java 기초반' }],
    schedules: [
      { courseId: 'course-java', courseName: 'Java 기초반', dayOfWeek: 'WED', classType: 'offline', startTime: '14:00', endTime: '17:00' },
    ],
  },
  {
    username: 'teacher01', password: '1234', userType: 'teacher', userId: 'T001',
    name: '박강사', displayName: '박강사', email: 'teacher01@test.com',
    academyName: '스타토치',
    courses: [
      { courseId: 'course-web', courseName: '웹프로그래밍' },
      { courseId: 'course-java', courseName: 'Java 기초반' },
    ],
    schedules: [],
  },
  {
    username: 'admin01', password: '1234', userType: 'admin', userId: 'A001',
    name: '관리자', displayName: '관리자', email: 'admin01@test.com',
    academyName: '스타토치',
    courses: [],
    schedules: [],
  },
];

const getDefaultVideos = () => [
  { id: 1, title: '1주차 - React 기초', courseId: 'course-web', courseName: '웹프로그래밍', videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', duration: '3:41:26', description: 'React의 기본 개념과 컴포넌트에 대해 배웁니다.', uploadDate: '2026-01-01T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/Tn6-PIqc4UM/maxresdefault.jpg' },
  { id: 2, title: '2주차 - React Hooks', courseId: 'course-web', courseName: '웹프로그래밍', videoUrl: 'https://www.youtube.com/watch?v=g0mNOv_3YKg', duration: '16:27', description: 'useState, useEffect 등 React Hooks를 학습합니다.', uploadDate: '2026-01-08T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/g0mNOv_3YKg/maxresdefault.jpg' },
  { id: 3, title: '3주차 - 컴포넌트 심화', courseId: 'course-web', courseName: '웹프로그래밍', videoUrl: 'https://www.youtube.com/watch?v=EqSRgpswwWE', duration: '21:03', description: '컴포넌트 재사용과 props에 대해 깊이 있게 다룹니다.', uploadDate: '2026-01-15T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/EqSRgpswwWE/maxresdefault.jpg' },
  { id: 4, title: '1주차 - Java 배열 기초', courseId: 'course-java', courseName: 'Java 기초반', videoUrl: 'https://www.youtube.com/watch?v=KF6t61yuEKY', duration: '2:26:26', description: 'Java 배열과 반복문의 기초를 학습합니다.', uploadDate: '2026-01-01T09:00:00Z', teacherId: 'T001', teacherName: '박강사', thumbnail: 'https://img.youtube.com/vi/KF6t61yuEKY/maxresdefault.jpg' },
];

const getDefaultAssignments = () => [
  { id: 1, title: 'React 컴포넌트 만들기', courseId: 'course-web', courseName: '웹프로그래밍', description: 'useState를 사용한 간단한 카운터 컴포넌트를 만들어 제출하세요.', dueDate: '2026-06-15T23:59:59Z', maxScore: 100, teacherId: 'T001', teacherName: '박강사', createdAt: '2026-05-01T09:00:00Z' },
  { id: 2, title: 'Java 배열 실습', courseId: 'course-java', courseName: 'Java 기초반', description: '배열을 활용한 기초 알고리즘 문제를 풀어 제출하세요.', dueDate: '2026-06-20T23:59:59Z', maxScore: 100, teacherId: 'T001', teacherName: '박강사', createdAt: '2026-05-05T09:00:00Z' },
];

const getDefaultOfflineClasses = () => {
  const classes = [];
  // 5월 웹프로그래밍 - 매주 월요일
  [4, 11, 18, 25].forEach((day, i) => {
    classes.push({
      id: i + 1,
      courseId: 'course-web', courseName: '웹프로그래밍',
      title: '웹프로그래밍 정규수업',
      description: 'React 실습 위주 수업',
      dayOfWeek: 'MON',
      classDate: `2026-05-${String(day).padStart(2, '0')}`,
      startTime: '19:00', endTime: '21:00',
      location: '학원 301호', capacity: 18,
    });
  });
  // 5월 Java 기초반 - 매주 수요일
  [6, 13, 20, 27].forEach((day, i) => {
    classes.push({
      id: i + 5,
      courseId: 'course-java', courseName: 'Java 기초반',
      title: 'Java 기초반 정규수업',
      description: '문법 강의 및 문제 풀이',
      dayOfWeek: 'WED',
      classDate: `2026-05-${String(day).padStart(2, '0')}`,
      startTime: '14:00', endTime: '17:00',
      location: '학원 302호', capacity: 15,
    });
  });
  return classes;
};

const getDefaultInvitations = () => [
  { code: 'ABCD1234', role: 'student', academyName: '스타토치', status: 'active', expiresAt: '2026-12-31T23:59:59', createdAt: '2026-05-01T00:00:00Z', usedByUsername: null },
  { code: 'TCHR5678', role: 'teacher', academyName: '스타토치', status: 'active', expiresAt: '2026-12-31T23:59:59', createdAt: '2026-05-01T00:00:00Z', usedByUsername: null },
];

const getDefaultData = () => ({
  version: MOCK_VERSION,
  users: getDefaultUsers(),
  attendanceHistory: {},
  allAttendanceRecords: [],
  deviceChangeRequests: [],
  userSessions: {},
  registeredDevices: {},
  videos: getDefaultVideos(),
  watchHistory: {},
  assignments: getDefaultAssignments(),
  submissions: [],
  offlineClasses: getDefaultOfflineClasses(),
  invitations: getDefaultInvitations(),
  attendanceSession: { isOpen: false, openedAt: null, closeAt: null },
  attendanceSchedule: { startTime: null, durationMinutes: 10, enabled: false },
});

// ── 로컬 스토리지 ──────────────────────────────────────
const loadMockData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.version === MOCK_VERSION) return data;
    } catch { /* 파싱 실패 시 기본값 사용 */ }
  }
  return getDefaultData();
};

const saveMockData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

let mockData = loadMockData();
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ── 헬퍼 ──────────────────────────────────────────────
function getCurrentUser() {
  const token = localStorage.getItem('mattermost_token');
  if (!token) throw new Error('로그인이 필요합니다.');
  const userId = token.split('-')[2];
  return mockData.users.find(u => u.userId === userId);
}

function buildLoginResponse(user, token) {
  return {
    token,
    userType: user.userType,
    userId: user.userId,
    username: user.username,
    name: user.name,
    displayName: user.displayName || user.name,
    email: user.email || '',
    academyName: user.academyName || '스타토치',
    courses: user.courses || [],
    schedules: user.schedules || [],
  };
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

  if (now >= openAt && now < closeAt) {
    data.attendanceSession = { isOpen: true, openedAt: openAt.toISOString(), closeAt: closeAt.toISOString() };
  } else {
    data.attendanceSession.isOpen = false;
  }
}

function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Mock API ───────────────────────────────────────────
export const mockApi = {

  // ── 인증 ──────────────────────────────────────────────
  login: async (credentials) => {
    await delay();
    mockData = loadMockData();
    const user = mockData.users.find(u => u.username === credentials.username && u.password === credentials.password);
    if (!user) throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
    const token = `mock-token-${user.userId}-${Date.now()}`;
    mockData.userSessions[user.userId] = token;
    saveMockData(mockData);
    return { data: buildLoginResponse(user, token) };
  },

  joinWithInvitation: async ({ username, password, invitationCode }) => {
    await delay();
    mockData = loadMockData();
    const invitation = mockData.invitations.find(inv => inv.code === invitationCode && inv.status === 'active');
    if (!invitation) throw { response: { data: { message: '유효하지 않거나 만료된 초대코드입니다.' } } };
    if (mockData.users.find(u => u.username === username)) {
      throw { response: { data: { message: '이미 사용 중인 아이디입니다.' } } };
    }
    const userId = `U${Date.now()}`;
    const newUser = {
      username, password, userType: invitation.role, userId,
      name: username, displayName: username, email: '',
      academyName: invitation.academyName || '스타토치',
      courses: [], schedules: [],
    };
    mockData.users.push(newUser);
    invitation.status = 'used';
    invitation.usedByUsername = username;
    const token = `mock-token-${userId}-${Date.now()}`;
    mockData.userSessions[userId] = token;
    saveMockData(mockData);
    return { data: buildLoginResponse(newUser, token) };
  },

  updateProfile: async ({ username, displayName }) => {
    await delay();
    mockData = loadMockData();
    const user = mockData.users.find(u => u.username === username);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    user.displayName = displayName || user.displayName;
    user.name = displayName || user.name;
    saveMockData(mockData);
    return { data: { message: '프로필이 수정되었습니다.', displayName: user.displayName, email: user.email } };
  },

  changePassword: async ({ username, currentPassword, newPassword }) => {
    await delay();
    mockData = loadMockData();
    const user = mockData.users.find(u => u.username === username);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    if (user.password !== currentPassword) throw { response: { data: { message: '현재 비밀번호가 올바르지 않습니다.' } } };
    user.password = newPassword;
    saveMockData(mockData);
    return { data: { message: '비밀번호가 변경되었습니다.' } };
  },

  // ── 출석 ──────────────────────────────────────────────
  checkAttendance: async () => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    applySchedule(mockData);

    if (!mockData.attendanceSession.isOpen) {
      throw { response: { data: { success: false, message: '출석 가능 시간이 아닙니다. 강사가 설정한 출석 시간을 확인해주세요.' } } };
    }

    const now = new Date();
    const attendanceDate = now.toISOString().slice(0, 10);
    const alreadyToday = (mockData.attendanceHistory[currentUser.userId] || []).some(r => r.attendanceDate === attendanceDate);
    if (alreadyToday) {
      throw { response: { data: { success: false, message: '오늘 이미 출석했습니다.' } } };
    }

    const record = {
      id: Date.now(),
      userId: currentUser.userId,
      studentId: currentUser.userId,
      studentName: currentUser.displayName || currentUser.name,
      username: currentUser.username,
      attendanceDate,
      checkedInAt: now.toLocaleTimeString('ko-KR'),
      timestamp: now.toISOString(),
      status: 'present',
      isNewDevice: false,
    };

    if (!mockData.attendanceHistory[currentUser.userId]) mockData.attendanceHistory[currentUser.userId] = [];
    mockData.attendanceHistory[currentUser.userId].push(record);
    mockData.allAttendanceRecords.push(record);
    saveMockData(mockData);
    return { data: { success: true, message: '출석이 완료되었습니다!', timestamp: record.timestamp } };
  },

  getAttendanceHistory: async (params = {}) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    let records = (mockData.attendanceHistory[currentUser.userId] || []).slice().reverse();
    if (params.year && params.month) {
      records = records.filter(r => {
        const [y, m] = (r.attendanceDate || r.timestamp?.slice(0, 7) || '').split('-').map(Number);
        return y === params.year && m === params.month;
      });
    }
    return { data: records };
  },

  getTodayAttendance: async () => {
    await delay();
    mockData = loadMockData();
    const today = new Date().toISOString().slice(0, 10);
    const records = mockData.allAttendanceRecords
      .filter(r => (r.attendanceDate || r.timestamp?.slice(0, 10)) === today)
      .map(r => ({
        id: r.id,
        username: r.username || r.studentName,
        checkedInAt: r.checkedInAt || r.timestamp,
        status: r.status === 'success' ? '출석' : (r.status || '출석'),
      }));
    return { data: records };
  },

  getAllAttendanceRecords: async (params = {}) => {
    await delay();
    mockData = loadMockData();
    return { data: mockData.allAttendanceRecords.slice().reverse() };
  },

  getAttendanceSession: async () => {
    await delay(100);
    mockData = loadMockData();
    applySchedule(mockData);
    saveMockData(mockData);
    return { data: { session: mockData.attendanceSession, schedule: mockData.attendanceSchedule } };
  },

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

  // ── 기기 변경 요청 ─────────────────────────────────────
  requestDeviceChange: async (payload) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const existingRequest = mockData.deviceChangeRequests.find(req => req.studentId === currentUser.userId && req.status === 'pending');
    if (existingRequest) throw { response: { data: { message: '이미 승인 대기 중인 요청이 있습니다.' } } };
    const request = {
      id: Date.now(),
      studentId: currentUser.userId,
      studentName: currentUser.displayName || currentUser.name,
      email: currentUser.email || `${currentUser.username}@example.com`,
      requestTime: new Date().toISOString(),
      currentDeviceInfo: payload?.deviceInfo || {},
      status: 'pending',
    };
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

  // ── 강사: 수강 학생 ─────────────────────────────────────
  getTeacherStudents: async () => {
    await delay();
    mockData = loadMockData();
    const students = mockData.users
      .filter(u => u.userType === 'student')
      .map(u => ({
        userId: u.userId,
        username: u.username,
        name: u.name,
        displayName: u.displayName || u.name,
        email: u.email || '',
        enrolledCourses: (u.courses || []).map(c => ({
          id: c.courseId,
          courseId: c.courseId,
          courseName: c.courseName,
        })),
      }));
    return { data: students };
  },

  getCourseStudents: async (courseCode) => {
    await delay();
    mockData = loadMockData();
    const students = mockData.users
      .filter(u => u.userType === 'student' && (u.courses || []).some(c => c.courseId === courseCode))
      .map(u => ({
        userId: u.userId,
        username: u.username,
        name: u.name,
        displayName: u.displayName || u.name,
        email: u.email || '',
      }));
    return { data: students };
  },

  // ── 영상 ──────────────────────────────────────────────
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

  createVideo: async (videoData) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const getYouTubeId = (url) => {
      const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      return match && match[2].length === 11 ? match[2] : null;
    };
    const youtubeId = getYouTubeId(videoData.videoUrl || '');
    const newVideo = {
      id: Date.now(),
      title: videoData.title,
      courseId: videoData.courseId || 'DEFAULT',
      courseName: videoData.courseName || '기타',
      videoUrl: videoData.videoUrl,
      duration: videoData.duration || '0:00',
      description: videoData.description,
      uploadDate: new Date().toISOString(),
      teacherId: currentUser.userId,
      teacherName: currentUser.displayName || currentUser.name,
      thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : '',
    };
    mockData.videos.push(newVideo);
    saveMockData(mockData);
    return { data: { ...newVideo, success: true, message: '영상이 등록되었습니다.', title: newVideo.title } };
  },

  uploadVideoFile: async (formData) => {
    await delay(800);
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const newVideo = {
      id: Date.now(),
      title: formData.get('title') || '업로드된 영상',
      courseId: formData.get('courseId') || 'DEFAULT',
      courseName: formData.get('courseName') || '기타',
      videoUrl: '',
      duration: String(Math.floor((parseInt(formData.get('durationSeconds') || 0) / 60))).padStart(2, '0') + ':' + String((parseInt(formData.get('durationSeconds') || 0) % 60)).padStart(2, '0'),
      description: formData.get('description') || '',
      uploadDate: new Date().toISOString(),
      teacherId: currentUser.userId,
      teacherName: currentUser.displayName || currentUser.name,
      thumbnail: '',
      isLocalFile: true,
    };
    mockData.videos.push(newVideo);
    saveMockData(mockData);
    return { data: { ...newVideo, success: true, message: '영상 파일이 업로드되었습니다.', title: newVideo.title } };
  },

  updateVideo: async (videoId, form) => {
    await delay();
    mockData = loadMockData();
    const video = mockData.videos.find(v => v.id === parseInt(videoId));
    if (!video) throw new Error('영상을 찾을 수 없습니다.');
    Object.assign(video, {
      title: form.title ?? video.title,
      courseId: form.courseId ?? video.courseId,
      courseName: form.courseName ?? video.courseName,
      description: form.description ?? video.description,
      videoUrl: form.videoUrl ?? video.videoUrl,
      duration: form.duration ?? video.duration,
    });
    saveMockData(mockData);
    return { data: { success: true, message: '영상이 수정되었습니다.', video } };
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

  saveWatchProgress: async (videoId, progress) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const userId = currentUser.userId;
    if (!mockData.watchHistory[userId]) mockData.watchHistory[userId] = {};
    mockData.watchHistory[userId][videoId] = {
      videoId,
      watchedTime: progress.watchedTime,
      totalTime: progress.totalTime,
      percentage: Math.floor((progress.watchedTime / progress.totalTime) * 100),
      completed: progress.watchedTime / progress.totalTime >= 0.9,
      lastWatchedAt: new Date().toISOString(),
    };
    saveMockData(mockData);
    return { data: { success: true, message: '시청 기록이 저장되었습니다.' } };
  },

  getMyWatchHistory: async () => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    return { data: mockData.watchHistory[currentUser.userId] || {} };
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
        result.push({
          studentId: userId,
          studentName: user?.displayName || user?.name || '알 수 없음',
          videoId: parseInt(videoId),
          videoTitle: video?.title || '삭제된 영상',
          percentage: history.percentage,
          completed: history.completed,
          lastWatchedAt: history.lastWatchedAt,
        });
      });
    });
    return { data: result };
  },

  // ── 과제 ──────────────────────────────────────────────
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

  createAssignment: async (assignmentData) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const newAssignment = {
      id: Date.now(),
      title: assignmentData.title,
      courseId: assignmentData.courseId || 'DEFAULT',
      courseName: assignmentData.courseName || '기타',
      description: assignmentData.description,
      dueDate: assignmentData.dueDate,
      maxScore: assignmentData.maxScore || 100,
      teacherId: currentUser.userId,
      teacherName: currentUser.displayName || currentUser.name,
      createdAt: new Date().toISOString(),
    };
    mockData.assignments.push(newAssignment);
    saveMockData(mockData);
    return { data: { ...newAssignment, success: true, message: '과제가 등록되었습니다.', title: newAssignment.title } };
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

  submitAssignment: async (assignmentId, submissionData) => {
    await delay();
    mockData = loadMockData();
    const currentUser = getCurrentUser();
    const existingIndex = mockData.submissions.findIndex(s => s.assignmentId === parseInt(assignmentId) && s.studentId === currentUser.userId);
    const submission = {
      id: existingIndex >= 0 ? mockData.submissions[existingIndex].id : Date.now(),
      assignmentId: parseInt(assignmentId),
      studentId: currentUser.userId,
      studentName: currentUser.displayName || currentUser.name,
      content: submissionData.content,
      submittedAt: new Date().toISOString(),
      score: null,
      feedback: null,
      gradedAt: null,
    };
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
    const submission = mockData.submissions.find(s => s.assignmentId === parseInt(assignmentId) && s.studentId === currentUser.userId) || null;
    if (submission && submission.score !== null && submission.score !== undefined) {
      submission.score = Number(submission.score);
    }
    return { data: submission };
  },

  getAllSubmissions: async (assignmentId) => {
    await delay();
    mockData = loadMockData();
    let submissions = mockData.submissions;
    if (assignmentId) submissions = submissions.filter(s => s.assignmentId === parseInt(assignmentId));
    return { data: submissions };
  },

  gradeSubmission: async (submissionId, gradeData) => {
    await delay();
    mockData = loadMockData();
    const submission = mockData.submissions.find(s => s.id === parseInt(submissionId));
    if (!submission) throw new Error('제출물을 찾을 수 없습니다.');
    submission.score = Number(gradeData.score);
    submission.feedback = gradeData.feedback || null;
    submission.gradedAt = new Date().toISOString();
    saveMockData(mockData);
    return { data: { success: true, message: '채점이 완료되었습니다.', submission, studentName: submission.studentName } };
  },

  // ── 오프라인 강의 ──────────────────────────────────────
  getOfflineClasses: async (params = {}) => {
    await delay();
    mockData = loadMockData();
    let classes = mockData.offlineClasses;
    if (params.year && params.month) {
      const prefix = `${params.year}-${String(params.month).padStart(2, '0')}`;
      classes = classes.filter(c => (c.classDate || '').startsWith(prefix));
    }
    return { data: classes };
  },

  createOfflineClass: async (payload) => {
    await delay();
    mockData = loadMockData();
    const newClass = {
      id: Date.now(),
      courseId: payload.courseId,
      courseName: payload.courseName,
      title: payload.title,
      description: payload.description || '',
      dayOfWeek: payload.dayOfWeek,
      classDate: payload.startDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location || '',
      capacity: payload.capacity || 18,
    };
    mockData.offlineClasses.push(newClass);
    saveMockData(mockData);
    return { data: { ...newClass, success: true, message: '오프라인 강의 일정이 등록되었습니다.', title: newClass.title } };
  },

  updateOfflineClass: async (offlineClassId, payload) => {
    await delay();
    mockData = loadMockData();
    const offlineClass = mockData.offlineClasses.find(c => c.id === offlineClassId || c.id === parseInt(offlineClassId));
    if (!offlineClass) throw new Error('오프라인 강의를 찾을 수 없습니다.');
    Object.assign(offlineClass, {
      courseId: payload.courseId ?? offlineClass.courseId,
      courseName: payload.courseName ?? offlineClass.courseName,
      title: payload.title ?? offlineClass.title,
      description: payload.description ?? offlineClass.description,
      dayOfWeek: payload.dayOfWeek ?? offlineClass.dayOfWeek,
      classDate: payload.startDate ?? offlineClass.classDate,
      startTime: payload.startTime ?? offlineClass.startTime,
      endTime: payload.endTime ?? offlineClass.endTime,
      location: payload.location ?? offlineClass.location,
      capacity: payload.capacity ?? offlineClass.capacity,
    });
    saveMockData(mockData);
    return { data: { ...offlineClass, success: true, message: '오프라인 강의 일정이 수정되었습니다.', title: offlineClass.title } };
  },

  deleteOfflineClass: async (offlineClassId) => {
    await delay();
    mockData = loadMockData();
    const index = mockData.offlineClasses.findIndex(c => c.id === offlineClassId || c.id === parseInt(offlineClassId));
    if (index === -1) throw new Error('오프라인 강의를 찾을 수 없습니다.');
    mockData.offlineClasses.splice(index, 1);
    saveMockData(mockData);
    return { data: { success: true, message: '오프라인 강의 일정이 취소되었습니다.' } };
  },

  // ── 관리자: 사용자 관리 ────────────────────────────────
  getAdminUsers: async () => {
    await delay();
    mockData = loadMockData();
    const result = mockData.users.map(u => ({
      username: u.username,
      role: u.userType,
      displayName: u.displayName || u.name,
      email: u.email || '',
      academyName: u.academyName || '',
      courses: u.courses || [],
    }));
    return { data: result };
  },

  createAdminUser: async (payload) => {
    await delay();
    mockData = loadMockData();
    if (mockData.users.find(u => u.username === payload.username)) {
      throw { response: { data: { message: '이미 사용 중인 아이디입니다.' } } };
    }
    const userId = `U${Date.now()}`;
    const newUser = {
      username: payload.username,
      password: payload.password || '1234',
      userType: payload.role || 'student',
      userId,
      name: payload.name || payload.username,
      displayName: payload.name || payload.username,
      email: payload.email || '',
      academyName: payload.academyName || '스타토치',
      courses: (payload.courses || []).map(c => ({ courseId: c.courseId || c.id, courseName: c.courseName || c.name })),
      schedules: [],
    };
    mockData.users.push(newUser);
    saveMockData(mockData);
    return { data: { message: `${payload.name || payload.username} 계정이 생성되었습니다.` } };
  },

  updateAdminUser: async (username, payload) => {
    await delay();
    mockData = loadMockData();
    const user = mockData.users.find(u => u.username === username);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    user.userType = payload.role || user.userType;
    user.name = payload.name || user.name;
    user.displayName = payload.name || user.displayName;
    user.email = payload.email ?? user.email;
    user.academyName = payload.academyName || user.academyName;
    user.courses = (payload.courses || []).map(c => ({ courseId: c.courseId || c.id, courseName: c.courseName || c.name }));
    saveMockData(mockData);
    return { data: { message: '수정되었습니다.' } };
  },

  deleteAdminUser: async (username) => {
    await delay();
    mockData = loadMockData();
    const index = mockData.users.findIndex(u => u.username === username);
    if (index === -1) throw new Error('사용자를 찾을 수 없습니다.');
    const user = mockData.users[index];
    mockData.users.splice(index, 1);
    delete mockData.attendanceHistory[user.userId];
    delete mockData.watchHistory[user.userId];
    mockData.submissions = mockData.submissions.filter(s => s.studentId !== user.userId);
    saveMockData(mockData);
    return { data: { message: '삭제되었습니다.' } };
  },

  // ── 관리자: 초대코드 ────────────────────────────────────
  getInvitations: async () => {
    await delay();
    mockData = loadMockData();
    return { data: mockData.invitations };
  },

  createInvitation: async (payload) => {
    await delay();
    mockData = loadMockData();
    const code = generateCode(8);
    const invitation = {
      code,
      role: payload.role || 'student',
      academyName: payload.academyName || '스타토치',
      status: 'active',
      expiresAt: payload.expiresAt || null,
      createdAt: new Date().toISOString(),
      usedByUsername: null,
    };
    mockData.invitations.push(invitation);
    saveMockData(mockData);
    return { data: { code, message: '초대코드가 생성되었습니다.' } };
  },

  revokeInvitation: async (code) => {
    await delay();
    mockData = loadMockData();
    const invitation = mockData.invitations.find(inv => inv.code === code);
    if (!invitation) throw new Error('초대코드를 찾을 수 없습니다.');
    invitation.status = 'revoked';
    saveMockData(mockData);
    return { data: { message: '초대코드가 취소되었습니다.' } };
  },
};

export const resetMockData = () => {
  localStorage.removeItem(STORAGE_KEY);
  mockData = loadMockData();
  console.log('Mock 데이터가 초기화되었습니다.');
};
