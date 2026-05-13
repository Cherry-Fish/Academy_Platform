import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api/api';
import { saveToken, removeToken, isAuthenticated } from './utils/auth';
import { getDeviceInfo } from './utils/deviceInfo';

const DEFAULT_STUDENT_COURSES = [
  { id: 'course-web', name: '웹프로그래밍', shortName: '웹', description: '프론트엔드와 React 수업 자료를 모아보는 강의방입니다.' },
  { id: 'course-java', name: 'Java 기초반', shortName: 'Ja', description: '기초 문법과 문제 풀이를 진행하는 Java 강의방입니다.' },
  { id: 'course-db', name: '데이터베이스', shortName: 'DB', description: 'SQL과 데이터 모델링을 정리하는 데이터베이스 강의방입니다.' },
];

function App() {
  const [username, setUsername] = useState(localStorage.getItem('academy_username') || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(localStorage.getItem('userType') || '');
  const [displayName, setDisplayName] = useState(localStorage.getItem('academy_display_name') || '');
  const [email, setEmail] = useState(localStorage.getItem('academy_email') || '');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const hasSession = isAuthenticated() && !!localStorage.getItem('userType');
    if (!hasSession) {
      return;
    }

    try {
      setLoggedIn(true);
    } catch (error) {
      removeToken();
      localStorage.removeItem('userType');
      setLoggedIn(false);
      setMessage('저장된 세션을 불러오지 못해 로그인 화면으로 복구했습니다.');
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.login({ username, password });
      const nextUsername = response.data.username || username;
      const nextUserType = response.data.userType || 'student';
      const nextDisplayName = response.data.displayName || nextUsername;
      const nextEmail = response.data.email || '';

      saveToken(response.data.token || response.data.jwtToken);
      localStorage.setItem('academy_username', nextUsername);
      localStorage.setItem('userType', nextUserType);
      localStorage.setItem('academy_display_name', nextDisplayName);
      localStorage.setItem('academy_email', nextEmail);
      localStorage.setItem('academy_name', response.data.academyName || '');
      localStorage.setItem('academy_courses', JSON.stringify(response.data.courses || []));
      localStorage.setItem('academy_schedules', JSON.stringify(response.data.schedules || []));

      setUsername(nextUsername);
      setUserType(nextUserType);
      setDisplayName(nextDisplayName);
      setEmail(nextEmail);
      setLoggedIn(true);
      setPassword('');
      setMessage(`로그인 성공: ${nextUsername} (${nextUserType})`);
    } catch (error) {
      setMessage(`로그인 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('userType');
    setLoggedIn(false);
    setUserType('');
    setDisplayName('');
    setEmail('');
    setPassword('');
    setMessage('로그아웃되었습니다.');
  };

  if (loggedIn) {
    return (
      <BasicHome
        username={username}
        displayName={displayName}
        setDisplayName={setDisplayName}
        email={email}
        setEmail={setEmail}
        userType={userType}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-card login-card-form">
          <div className="login-copy">
            <h1 className="login-title">Academy Platform</h1>
            <p className="login-description">
              로그인부터 복구했고, 이제 기본 기능 홈을 다시 연결한 상태입니다.
            </p>
          </div>

          {message && <div className="login-alert">{message}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="legacy-input-group">
              <span className="legacy-input-icon">ID</span>
              <input
                type="text"
                placeholder="Mattermost ID"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="legacy-input"
              />
            </div>

            <div className="legacy-input-group">
              <span className="legacy-input-icon">PW</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="legacy-input"
              />
            </div>

            <div className="login-actions">
              <button type="submit" className="legacy-login-button" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  removeToken();
                  localStorage.removeItem('userType');
                  localStorage.removeItem('academy_name');
                  localStorage.removeItem('academy_courses');
                  localStorage.removeItem('academy_schedules');
                  setDisplayName('');
                  setEmail('');
                  setMessage('저장된 세션을 초기화했습니다.');
                }}
              >
                세션 초기화
              </button>
            </div>
          </form>
        </div>

        <div className="login-card login-card-visual">
          <img
            src="/images/login_illustration.png"
            alt="Login illustration"
            className="login-illustration"
          />
        </div>
      </div>
    </div>
  );
}

function BasicHome({ username, displayName, setDisplayName, email, setEmail, userType, onLogout }) {
  const today = new Date();
  const [activeSection, setActiveSection] = useState(userType === 'student' ? 'attendance' : 'overview');
  const [academyName] = useState(localStorage.getItem('academy_name') || '');
  const [storedCourses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('academy_courses') || '[]');
    } catch (error) {
      return [];
    }
  });
  const [storedSchedules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('academy_schedules') || '[]');
    } catch (error) {
      return [];
    }
  });
  const [records, setRecords] = useState([]);
  const [videos, setVideos] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [offlineClasses, setOfflineClasses] = useState([]);
  const [myOfflineApplications, setMyOfflineApplications] = useState([]);
  const [allOfflineApplications, setAllOfflineApplications] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [staffVideoForm, setStaffVideoForm] = useState({
    courseId: 'course-web',
    courseName: '웹프로그래밍',
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
  });
  const [staffAssignmentForm, setStaffAssignmentForm] = useState({
    courseId: 'course-web',
    courseName: '웹프로그래밍',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
  });
  const [gradingState, setGradingState] = useState({});
  const [attendanceMonth, setAttendanceMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [offlineMonth, setOfflineMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [infoMessage, setInfoMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [settingsName, setSettingsName] = useState(displayName || username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deviceRequestCompleted, setDeviceRequestCompleted] = useState(
    localStorage.getItem(`device_change_requested:${username}`) === 'true'
  );
  const [staffOfflineClassForm, setStaffOfflineClassForm] = useState({
    courseId: 'course-web',
    courseName: '웹프로그래밍',
    title: '',
    description: '',
    classDate: '',
    startTime: '19:00',
    endTime: '21:00',
    location: '학원 301호',
    capacity: 18,
  });
  const deviceInfo = useMemo(() => getDeviceInfo(), []);
  const studentCourses = useMemo(() => {
    if (userType !== 'student') {
      return [];
    }

    const seen = new Set();
    const merged = [];

    const bootstrapCourses = storedCourses.length > 0
      ? storedCourses.map((course) => ({
        id: course.courseId,
        name: course.courseName,
        shortName: (course.courseName || course.courseId || '').slice(0, 2),
        description: `${course.courseName || course.courseId} 강의방입니다.`,
      }))
      : DEFAULT_STUDENT_COURSES;

    bootstrapCourses.forEach((course) => {
      if (seen.has(course.id)) {
        return;
      }
      seen.add(course.id);
      merged.push(course);
    });

    [...videos, ...assignments].forEach((item) => {
      if (!item?.courseId || seen.has(item.courseId)) {
        return;
      }

      seen.add(item.courseId);
      merged.push({
        id: item.courseId,
        name: item.courseName || item.courseId,
        shortName: (item.courseName || item.courseId).slice(0, 2),
        description: `${item.courseName || item.courseId} 강의방`,
      });
    });

    return merged;
  }, [userType, storedCourses, videos, assignments]);
  const [selectedCourseId, setSelectedCourseId] = useState(DEFAULT_STUDENT_COURSES[0]?.id || '');

  useEffect(() => {
    setSettingsName(displayName || username);
  }, [displayName, username]);

  useEffect(() => {
    setDeviceRequestCompleted(localStorage.getItem(`device_change_requested:${username}`) === 'true');
  }, [username]);

  useEffect(() => {
    if (userType !== 'student' || studentCourses.length === 0) {
      return;
    }

    const stillExists = studentCourses.some((course) => course.id === selectedCourseId);
    if (!stillExists) {
      setSelectedCourseId(studentCourses[0].id);
    }
  }, [userType, selectedCourseId, studentCourses]);

  useEffect(() => {
    if (userType !== 'student') {
      if (activeSection === 'overview') {
        loadTodayAttendance();
        return;
      }

      if (activeSection === 'deviceRequests') {
        loadPendingRequests();
        return;
      }

      if (activeSection === 'students') {
        loadTeacherStudents();
        return;
      }

      if (activeSection === 'videos') {
        loadVideos();
        loadWatchHistory();
        return;
      }

      if (activeSection === 'offlineClasses') {
        loadOfflineClasses(offlineMonth.year, offlineMonth.month);
        loadAllOfflineApplications();
        return;
      }

      if (activeSection === 'assignments') {
        loadAssignments();
        loadAllSubmissions();
        return;
      }

      if (activeSection === 'settings') {
        setInfoMessage('');
      }
      return;
    }

    if (activeSection === 'attendance') {
      loadStudentAttendance(attendanceMonth.year, attendanceMonth.month);
      return;
    }

    if (activeSection === 'videos') {
      setSelectedAssignment(null);
      loadVideos();
      return;
    }

    if (activeSection === 'offlineClasses') {
      setSelectedVideo(null);
      setSelectedAssignment(null);
      loadOfflineClasses(offlineMonth.year, offlineMonth.month);
      loadMyOfflineApplications();
      return;
    }

    if (activeSection === 'assignments') {
      setSelectedVideo(null);
      loadAssignments();
      return;
    }

    if (activeSection === 'settings') {
      setSelectedVideo(null);
      setSelectedAssignment(null);
      setInfoMessage('');
    }
  }, [userType, activeSection, attendanceMonth.year, attendanceMonth.month, offlineMonth.year, offlineMonth.month]);

  const loadStudentAttendance = async (year, month) => {
    setContentLoading(true);
    try {
      const response = await api.getAttendanceHistory({ year, month });
      setRecords(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('출석 이력을 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    setContentLoading(true);
    try {
      const response = await api.getTodayAttendance();
      setRecords(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('출석 현황을 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const loadVideos = async () => {
    setContentLoading(true);
    try {
      const response = await api.getVideos();
      setVideos(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('강의 영상을 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const loadOfflineClasses = async (year, month) => {
    setContentLoading(true);
    try {
      const response = await api.getOfflineClasses({ year, month });
      setOfflineClasses(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('오프라인 강의 일정을 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const loadMyOfflineApplications = async () => {
    try {
      const response = await api.getMyOfflineApplications();
      setMyOfflineApplications(response.data || []);
    } catch (error) {
      setInfoMessage('내 수강 신청 내역을 불러오지 못했습니다.');
    }
  };

  const loadAllOfflineApplications = async () => {
    try {
      const response = await api.getAllOfflineApplications();
      setAllOfflineApplications(response.data || []);
    } catch (error) {
      setInfoMessage('오프라인 신청 학생 목록을 불러오지 못했습니다.');
    }
  };

  const loadPendingRequests = async () => {
    setContentLoading(true);
    try {
      const response = await api.getPendingRequests();
      setPendingRequests(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('기기 변경 요청 목록을 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const loadTeacherStudents = async () => {
    setContentLoading(true);
    try {
      const response = await api.getTeacherStudents();
      setTeacherStudents(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('수강 학생 정보를 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const loadWatchHistory = async () => {
    try {
      const response = await api.getAllWatchHistory();
      setWatchHistory(response.data || []);
    } catch (error) {
      setInfoMessage('영상 시청 현황을 불러오지 못했습니다.');
    }
  };

  const loadAllSubmissions = async () => {
    try {
      const response = await api.getAllSubmissions();
      setAllSubmissions(response.data || []);
    } catch (error) {
      setInfoMessage('과제 제출 목록을 불러오지 못했습니다.');
    }
  };

  const loadAssignments = async () => {
    setContentLoading(true);
    try {
      const response = await api.getAssignments();
      setAssignments(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('과제를 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleSelectVideo = async (videoId) => {
    setContentLoading(true);
    try {
      const response = await api.getVideoById(videoId);
      setSelectedVideo(response.data);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('영상 상세 정보를 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleSelectAssignment = async (assignmentId) => {
    setContentLoading(true);
    try {
      const [assignmentResponse, submissionResponse] = await Promise.all([
        api.getAssignmentById(assignmentId),
        api.getMySubmission(assignmentId),
      ]);
      setSelectedAssignment(assignmentResponse.data);
      setAssignmentSubmission(submissionResponse.data || null);
      setSubmissionContent(submissionResponse.data?.content || '');
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('과제 상세 정보를 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submissionContent.trim()) {
      setInfoMessage('제출할 내용을 입력해주세요.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.submitAssignment(selectedAssignment.id, { content: submissionContent });
      setAssignmentSubmission(response.data.submission || null);
      setInfoMessage(response.data.message || '과제가 제출되었습니다.');
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttendance = async () => {
    setActionLoading(true);
    setInfoMessage('');
    try {
      const response = await api.checkAttendance();
      setInfoMessage(response.data.message || '출석이 완료되었습니다.');
      await loadStudentAttendance(attendanceMonth.year, attendanceMonth.month);
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfile = () => {
    const nextName = settingsName.trim() || username;

    setActionLoading(true);
    api.updateProfile({
      username,
      displayName: nextName,
    })
      .then((response) => {
        const nextDisplayName = response.data?.displayName || nextName;
        const nextEmail = response.data?.email || email || '';
        localStorage.setItem('academy_display_name', nextDisplayName);
        localStorage.setItem('academy_email', nextEmail);
        setDisplayName(nextDisplayName);
        setEmail(nextEmail);
        setInfoMessage(response.data?.message || '프로필 이름이 저장되었습니다.');
      })
      .catch((error) => {
        setInfoMessage(error.response?.data?.message || error.message);
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  const handleAttendanceMonthChange = (direction) => {
    setAttendanceMonth((prev) => {
      const current = new Date(prev.year, prev.month - 1, 1);
      current.setMonth(current.getMonth() + direction);
      return {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
      };
    });
  };

  const handleOfflineMonthChange = (direction) => {
    setOfflineMonth((prev) => {
      const current = new Date(prev.year, prev.month - 1, 1);
      current.setMonth(current.getMonth() + direction);
      return {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
      };
    });
  };

  const handleDeviceChangeRequest = async () => {
    setActionLoading(true);
    try {
      const response = await api.requestDeviceChange({
        username,
        deviceInfo,
      });
      localStorage.setItem(`device_change_requested:${username}`, 'true');
      setDeviceRequestCompleted(true);
      setInfoMessage(response.data?.message || '기기 변경 요청이 접수되었습니다.');
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyOfflineClass = async (offlineClassId) => {
    setActionLoading(true);
    try {
      const response = await api.applyOfflineClass(offlineClassId);
      setInfoMessage(response.data?.message || '오프라인 강의 수강 신청이 완료되었습니다.');
      await loadOfflineClasses(offlineMonth.year, offlineMonth.month);
      await loadMyOfflineApplications();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setInfoMessage('비밀번호 변경 항목을 모두 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setInfoMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.changePassword({
        username,
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setInfoMessage(response.data?.message || '비밀번호가 변경되었습니다.');
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await api.approveDeviceChange(requestId);
      setInfoMessage(response.data?.message || '승인되었습니다.');
      await loadPendingRequests();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await api.rejectDeviceChange(requestId);
      setInfoMessage(response.data?.message || '거절되었습니다.');
      await loadPendingRequests();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!staffVideoForm.title.trim() || !staffVideoForm.videoUrl.trim()) {
      setInfoMessage('영상 제목과 URL을 입력해주세요.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.createVideo(staffVideoForm);
      setInfoMessage(`${response.data?.title || '영상'}이 등록되었습니다.`);
      setStaffVideoForm({
        courseId: 'course-web',
        courseName: '웹프로그래밍',
        title: '',
        description: '',
        videoUrl: '',
        duration: '',
      });
      await loadVideos();
      await loadWatchHistory();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    setActionLoading(true);
    try {
      await api.deleteVideo(videoId);
      setInfoMessage('영상이 삭제되었습니다.');
      await loadVideos();
      await loadWatchHistory();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!staffAssignmentForm.title.trim() || !staffAssignmentForm.dueDate.trim()) {
      setInfoMessage('과제 제목과 마감일을 입력해주세요.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.createAssignment(staffAssignmentForm);
      setInfoMessage(`${response.data?.title || '과제'}가 등록되었습니다.`);
      setStaffAssignmentForm({
        courseId: 'course-web',
        courseName: '웹프로그래밍',
        title: '',
        description: '',
        dueDate: '',
        maxScore: 100,
      });
      await loadAssignments();
      await loadAllSubmissions();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    setActionLoading(true);
    try {
      await api.deleteAssignment(assignmentId);
      setInfoMessage('과제가 삭제되었습니다.');
      await loadAssignments();
      await loadAllSubmissions();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOfflineClass = async () => {
    if (!staffOfflineClassForm.title.trim() || !staffOfflineClassForm.classDate.trim()) {
      setInfoMessage('오프라인 강의 제목과 날짜를 입력해주세요.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.createOfflineClass(staffOfflineClassForm);
      setInfoMessage(`${response.data?.title || '오프라인 강의'} 일정이 등록되었습니다.`);
      setStaffOfflineClassForm({
        courseId: 'course-web',
        courseName: '웹프로그래밍',
        title: '',
        description: '',
        classDate: '',
        startTime: '19:00',
        endTime: '21:00',
        location: '학원 301호',
        capacity: 18,
      });
      await loadOfflineClasses(offlineMonth.year, offlineMonth.month);
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOfflineClass = async (offlineClassId) => {
    setActionLoading(true);
    try {
      await api.deleteOfflineClass(offlineClassId);
      setInfoMessage('오프라인 강의 일정이 삭제되었습니다.');
      await loadOfflineClasses(offlineMonth.year, offlineMonth.month);
      await loadMyOfflineApplications();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGradeFieldChange = (submissionId, field, value) => {
    setGradingState((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value,
      },
    }));
  };

  const handleGradeSubmission = async (submissionId) => {
    const draft = gradingState[submissionId] || {};
    setActionLoading(true);
    try {
      const response = await api.gradeSubmission(submissionId, {
        score: draft.score || 0,
        feedback: draft.feedback || '',
      });
      setInfoMessage(`${response.data?.studentName || '학생'} 제출물이 채점되었습니다.`);
      await loadAllSubmissions();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (userType === 'student') {
    return (
      <StudentHome
        username={username}
        displayName={displayName}
        email={email}
        academyName={academyName}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        courses={studentCourses}
        schedules={storedSchedules}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        records={records}
        attendanceMonth={attendanceMonth}
        offlineMonth={offlineMonth}
        videos={videos}
        assignments={assignments}
        offlineClasses={offlineClasses}
        myOfflineApplications={myOfflineApplications}
        selectedVideo={selectedVideo}
        setSelectedVideo={setSelectedVideo}
        selectedAssignment={selectedAssignment}
        setSelectedAssignment={setSelectedAssignment}
        assignmentSubmission={assignmentSubmission}
        submissionContent={submissionContent}
        setSubmissionContent={setSubmissionContent}
        infoMessage={infoMessage}
        actionLoading={actionLoading}
        contentLoading={contentLoading}
        onAttendance={handleAttendance}
        onAttendanceMonthChange={handleAttendanceMonthChange}
        onOfflineMonthChange={handleOfflineMonthChange}
        onSelectVideo={handleSelectVideo}
        onSelectAssignment={handleSelectAssignment}
        onSubmitAssignment={handleSubmitAssignment}
        onApplyOfflineClass={handleApplyOfflineClass}
        settingsName={settingsName}
        setSettingsName={setSettingsName}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        deviceRequestCompleted={deviceRequestCompleted}
        deviceInfo={deviceInfo}
        onSaveProfile={handleSaveProfile}
        onChangePassword={handlePasswordChange}
        onRequestDeviceChange={handleDeviceChangeRequest}
        onLogout={onLogout}
      />
    );
  }

  return (
    <StaffHome
      username={username}
      displayName={displayName}
      email={email}
      userType={userType}
      academyName={academyName}
      courses={storedCourses}
      schedules={storedSchedules}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      records={records}
      videos={videos}
      assignments={assignments}
      offlineClasses={offlineClasses}
      offlineMonth={offlineMonth}
      pendingRequests={pendingRequests}
      teacherStudents={teacherStudents}
      allOfflineApplications={allOfflineApplications}
      watchHistory={watchHistory}
      allSubmissions={allSubmissions}
      infoMessage={infoMessage}
      actionLoading={actionLoading}
      contentLoading={contentLoading}
      settingsName={settingsName}
      setSettingsName={setSettingsName}
      currentPassword={currentPassword}
      setCurrentPassword={setCurrentPassword}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      deviceRequestCompleted={deviceRequestCompleted}
      deviceInfo={deviceInfo}
      staffVideoForm={staffVideoForm}
      setStaffVideoForm={setStaffVideoForm}
      staffAssignmentForm={staffAssignmentForm}
      setStaffAssignmentForm={setStaffAssignmentForm}
      staffOfflineClassForm={staffOfflineClassForm}
      setStaffOfflineClassForm={setStaffOfflineClassForm}
      gradingState={gradingState}
      onApproveRequest={handleApproveRequest}
      onRejectRequest={handleRejectRequest}
      onCreateVideo={handleCreateVideo}
      onDeleteVideo={handleDeleteVideo}
      onCreateAssignment={handleCreateAssignment}
      onDeleteAssignment={handleDeleteAssignment}
      onOfflineMonthChange={handleOfflineMonthChange}
      onCreateOfflineClass={handleCreateOfflineClass}
      onDeleteOfflineClass={handleDeleteOfflineClass}
      onGradeFieldChange={handleGradeFieldChange}
      onGradeSubmission={handleGradeSubmission}
      onSaveProfile={handleSaveProfile}
      onChangePassword={handlePasswordChange}
      onRequestDeviceChange={handleDeviceChangeRequest}
      onLogout={onLogout}
    />
  );
}

function StaffHome({
  username,
  displayName,
  email,
  userType,
  academyName,
  courses,
  schedules,
  activeSection,
  setActiveSection,
  records,
  videos,
  assignments,
  offlineClasses,
  offlineMonth,
  pendingRequests,
  teacherStudents,
  allOfflineApplications,
  watchHistory,
  allSubmissions,
  infoMessage,
  actionLoading,
  contentLoading,
  settingsName,
  setSettingsName,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  deviceRequestCompleted,
  deviceInfo,
  staffVideoForm,
  setStaffVideoForm,
  staffAssignmentForm,
  setStaffAssignmentForm,
  staffOfflineClassForm,
  setStaffOfflineClassForm,
  gradingState,
  onApproveRequest,
  onRejectRequest,
  onCreateVideo,
  onDeleteVideo,
  onCreateAssignment,
  onDeleteAssignment,
  onOfflineMonthChange,
  onCreateOfflineClass,
  onDeleteOfflineClass,
  onGradeFieldChange,
  onGradeSubmission,
  onSaveProfile,
  onChangePassword,
  onRequestDeviceChange,
  onLogout,
}) {
  const menuItems = [
    { key: 'overview', label: '개요', description: '오늘 출석 현황 확인' },
    { key: 'students', label: '수강 학생', description: '수업 중인 학생 정보 확인' },
    { key: 'deviceRequests', label: '기기 요청', description: '학생 기기 변경 요청 승인' },
    { key: 'offlineClasses', label: '오프라인 시간 설정', description: '월별 오프라인 강의 시간과 일정 설정' },
    { key: 'videos', label: '영상 관리', description: '강의 영상 등록과 시청 현황' },
    { key: 'assignments', label: '과제 관리', description: '과제 등록과 제출물 채점' },
    { key: 'settings', label: '설정', description: '프로필과 기기 관리' },
  ];
  const offlineSchedules = useMemo(() => {
    return (schedules || []).filter((schedule) => schedule.classType === 'offline');
  }, [schedules]);
  const studentsByCourse = useMemo(() => {
    const grouped = new Map();
    teacherStudents.forEach((student) => {
      (student.enrolledCourses || []).forEach((course) => {
        const existing = grouped.get(course.id || course.courseId) || {
          courseId: course.id || course.courseId,
          courseName: course.name || course.courseName,
          students: [],
        };
        existing.students.push(student);
        grouped.set(existing.courseId, existing);
      });
    });
    return Array.from(grouped.values());
  }, [teacherStudents]);
  const applicationsByOfflineClass = useMemo(() => {
    const grouped = new Map();
    (allOfflineApplications || []).forEach((application) => {
      const existing = grouped.get(application.offlineClassId) || [];
      existing.push(application);
      grouped.set(application.offlineClassId, existing);
    });
    return grouped;
  }, [allOfflineApplications]);

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f8', padding: '32px' }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        <aside style={{ background: '#1f2633', borderRadius: '24px', padding: '24px', color: 'white', boxShadow: '0 18px 36px rgba(15,23,42,0.18)' }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fb4ff', fontWeight: 700 }}>
              {userType === 'admin' ? 'Admin Dashboard' : 'Teacher Dashboard'}
            </div>
            <h2 style={{ margin: '12px 0 8px', fontSize: '28px' }}>{getRoleLabel(userType)} 홈</h2>
            <p style={{ margin: 0, color: '#cdd6e3', lineHeight: 1.6 }}>
              관리자와 강사는 전체 출석 현황을 먼저 확인할 수 있고, 설정에서 계정 정보와 기기 인증도 관리할 수 있습니다.
            </p>
          </div>

          <div className="channel-sidebar-scroll" style={{ paddingTop: '18px' }}>
            <div style={{ display: 'grid', gap: '10px' }}>
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: activeSection === item.key ? '1px solid #7c8dff' : '1px solid rgba(255,255,255,0.08)',
                    background: activeSection === item.key ? 'rgba(88, 101, 242, 0.24)' : 'rgba(255,255,255,0.04)',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', color: '#cdd6e3' }}>{item.description}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#9fb4ff', fontSize: '13px', marginBottom: '8px' }}>현재 사용자</div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>{displayName || username}</div>
              <div style={{ color: '#cdd6e3', marginTop: '6px' }}>{getRoleLabel(userType)} 계정</div>
              {academyName ? (
                <div style={{ color: '#cdd6e3', marginTop: '6px', fontSize: '14px' }}>{academyName}</div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={onLogout}
            style={{ width: '100%', marginTop: '16px' }}
          >
            로그아웃
          </button>
        </aside>

        <main style={{ display: 'grid', gap: '20px' }}>
          <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
            <h1 style={{ margin: '0 0 10px', fontSize: '40px', color: '#1f2a37', letterSpacing: '-0.04em' }}>
              {menuItems.find((item) => item.key === activeSection)?.label}
            </h1>
            <p className="muted-text" style={{ margin: 0 }}>
              강사와 관리자 화면도 학생 화면과 같은 기준으로 정리하고 있습니다.
            </p>
          </div>

          {infoMessage && <div className="login-alert">{infoMessage}</div>}

          {activeSection === 'overview' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">현재 로그인 정보</h3>
                <p className="muted-text" style={{ marginBottom: '8px' }}>
                  아이디: <strong>{username}</strong>
                </p>
                <p className="muted-text" style={{ marginBottom: 0 }}>
                  역할: <strong>{getRoleLabel(userType)}</strong>
                </p>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">오늘의 출석 현황</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : records.length === 0 ? (
                  <p className="muted-text">아직 표시할 기록이 없습니다.</p>
                ) : (
                  <table className="soft-table">
                    <thead>
                      <tr>
                        <th>이름</th>
                        <th>시간</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td>{record.username}</td>
                          <td>{record.checkedInAt || record.timestamp}</td>
                          <td><span className="status-pill">{record.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeSection === 'students' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">수강 학생 요약</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div style={summaryCardStyle}>
                    <div style={summaryLabelStyle}>전체 학생</div>
                    <div style={summaryValueStyle}>{teacherStudents.length}명</div>
                  </div>
                  <div style={summaryCardStyle}>
                    <div style={summaryLabelStyle}>담당 강의</div>
                    <div style={summaryValueStyle}>{(courses || []).length}개</div>
                  </div>
                  <div style={summaryCardStyle}>
                    <div style={summaryLabelStyle}>오프라인 수업</div>
                    <div style={summaryValueStyle}>{offlineSchedules.length}개</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">강의별 수강 학생</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : studentsByCourse.length === 0 ? (
                  <p className="muted-text">표시할 학생 정보가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '18px' }}>
                    {studentsByCourse.map((group) => (
                      <div key={group.courseId} style={{ padding: '18px', borderRadius: '18px', border: '1px solid #dbe4f0', background: '#f8fbff' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '12px' }}>{group.courseName}</div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {group.students.map((student) => (
                            <div key={`${group.courseId}-${student.username}`} style={{ padding: '14px 16px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2a37' }}>{student.displayName}</div>
                                  <div style={{ color: '#64748b', marginTop: '4px' }}>{student.username} · {student.email}</div>
                                </div>
                                <div style={{ color: '#475569', fontSize: '14px' }}>{student.academyName}</div>
                              </div>
                              {(student.schedules || []).length > 0 ? (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                  {student.schedules.map((schedule) => (
                                    <span key={`${student.username}-${schedule.courseId}-${schedule.dayOfWeek}-${schedule.startTime}`} className="status-pill">
                                      {translateDayOfWeek(schedule.dayOfWeek)} {schedule.startTime}-{schedule.endTime}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'deviceRequests' && (
            <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
              <h3 className="section-heading">기기 변경 요청</h3>
              {contentLoading ? (
                <p className="muted-text">불러오는 중...</p>
              ) : pendingRequests.length === 0 ? (
                <p className="muted-text">현재 대기 중인 기기 변경 요청이 없습니다.</p>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{ padding: '18px', borderRadius: '18px', border: '1px solid #dbe4f0', background: '#f8fbff' }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2a37', marginBottom: '6px' }}>{request.username}</div>
                      <div style={{ color: '#64748b', marginBottom: '10px' }}>요청 시각 {request.requestedAt}</div>
                      <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7, marginBottom: '14px' }}>
                        기기: {request.deviceInfo?.platform || '알 수 없음'} / 언어: {request.deviceInfo?.language || '-'} / 화면: {request.deviceInfo?.screenResolution || '-'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="button" className="legacy-login-button" onClick={() => onApproveRequest(request.id)} disabled={actionLoading}>
                          승인
                        </button>
                        <button type="button" className="ghost-button" onClick={() => onRejectRequest(request.id)}>
                          반려
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'offlineClasses' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">담당 오프라인 시간표</h3>
                {offlineSchedules.length === 0 ? (
                  <p className="muted-text">등록된 오프라인 정규 시간표가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {offlineSchedules.map((schedule) => (
                      <div key={`${schedule.courseId}-${schedule.dayOfWeek}-${schedule.startTime}`} style={{ padding: '16px 18px', borderRadius: '18px', border: '1px solid #dbe4f0', background: '#fffdfa' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2a37', marginBottom: '6px' }}>{schedule.courseName}</div>
                        <div style={{ color: '#475569' }}>
                          매주 {translateDayOfWeek(schedule.dayOfWeek)} · {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 className="section-heading" style={{ marginBottom: '8px' }}>오프라인 강의 시간 등록</h3>
                    <p className="muted-text" style={{ margin: 0 }}>
                      해당 월에 진행할 오프라인 수업 일정을 등록하면 모든 학생이 바로 보고 수강 신청할 수 있습니다.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button type="button" className="ghost-button" onClick={() => onOfflineMonthChange(-1)}>
                      이전 달
                    </button>
                    <div style={{ minWidth: '120px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                      {offlineMonth.year}.{String(offlineMonth.month).padStart(2, '0')}
                    </div>
                    <button type="button" className="ghost-button" onClick={() => onOfflineMonthChange(1)}>
                      다음 달
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
                  <select
                    value={staffOfflineClassForm.courseId}
                    onChange={(event) => {
                      const selectedCourse = (courses || []).find((course) => course.courseId === event.target.value);
                      setStaffOfflineClassForm((prev) => ({
                        ...prev,
                        courseId: event.target.value,
                        courseName: selectedCourse?.courseName || prev.courseName,
                      }));
                    }}
                    style={staffInputStyle}
                  >
                    {(courses || []).map((course) => (
                      <option key={course.courseId} value={course.courseId}>{course.courseName}</option>
                    ))}
                  </select>
                  <input type="text" placeholder="과목명" value={staffOfflineClassForm.courseName} readOnly style={{ ...staffInputStyle, background: '#f8fafc', color: '#64748b' }} />
                  <input type="text" placeholder="오프라인 강의 제목" value={staffOfflineClassForm.title} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, title: event.target.value }))} style={staffInputStyle} />
                  <textarea placeholder="강의 설명" value={staffOfflineClassForm.description} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} style={{ ...staffInputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <input type="date" value={staffOfflineClassForm.classDate} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, classDate: event.target.value }))} style={staffInputStyle} />
                    <input type="time" value={staffOfflineClassForm.startTime} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, startTime: event.target.value }))} style={staffInputStyle} />
                    <input type="time" value={staffOfflineClassForm.endTime} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, endTime: event.target.value }))} style={staffInputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '12px' }}>
                    <input type="text" placeholder="장소" value={staffOfflineClassForm.location} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, location: event.target.value }))} style={staffInputStyle} />
                    <input type="number" placeholder="정원" value={staffOfflineClassForm.capacity} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))} style={staffInputStyle} />
                  </div>
                  <div>
                    <button type="button" className="legacy-login-button" onClick={onCreateOfflineClass} disabled={actionLoading}>
                      {actionLoading ? '등록 중...' : '오프라인 일정 등록'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">이번 달 오프라인 일정</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : offlineClasses.length === 0 ? (
                  <p className="muted-text">등록된 오프라인 일정이 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {offlineClasses.map((offlineClass) => (
                      <div key={offlineClass.id} style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#f8fbff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{offlineClass.courseName}</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{offlineClass.title}</div>
                          </div>
                          <button type="button" className="ghost-button" onClick={() => onDeleteOfflineClass(offlineClass.id)}>
                            삭제
                          </button>
                        </div>
                        <div style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '12px' }}>{offlineClass.description}</div>
                        <div style={{ display: 'grid', gap: '6px', color: '#475569', fontSize: '14px' }}>
                          <div>일정: {offlineClass.classDate} · {offlineClass.startTime} - {offlineClass.endTime}</div>
                          <div>장소: {offlineClass.location}</div>
                          <div>정원: {offlineClass.enrolledCount}/{offlineClass.capacity}</div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>신청 학생</div>
                          {(applicationsByOfflineClass.get(offlineClass.id) || []).length === 0 ? (
                            <p className="muted-text" style={{ margin: 0 }}>아직 신청한 학생이 없습니다.</p>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {(applicationsByOfflineClass.get(offlineClass.id) || []).map((application) => (
                                <span key={application.id} className="status-pill" style={{ background: '#eef2ff', color: '#4338ca' }}>
                                  {application.username}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'videos' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">강의 영상 등록</h3>
                <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
                  <input type="text" placeholder="과목명" value={staffVideoForm.courseName} onChange={(event) => setStaffVideoForm((prev) => ({ ...prev, courseName: event.target.value }))} style={staffInputStyle} />
                  <input type="text" placeholder="영상 제목" value={staffVideoForm.title} onChange={(event) => setStaffVideoForm((prev) => ({ ...prev, title: event.target.value }))} style={staffInputStyle} />
                  <textarea placeholder="영상 설명" value={staffVideoForm.description} onChange={(event) => setStaffVideoForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} style={{ ...staffInputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  <input type="text" placeholder="YouTube URL" value={staffVideoForm.videoUrl} onChange={(event) => setStaffVideoForm((prev) => ({ ...prev, videoUrl: event.target.value }))} style={staffInputStyle} />
                  <input type="text" placeholder="재생 시간 예: 18:24" value={staffVideoForm.duration} onChange={(event) => setStaffVideoForm((prev) => ({ ...prev, duration: event.target.value }))} style={staffInputStyle} />
                  <div>
                    <button type="button" className="legacy-login-button" onClick={onCreateVideo} disabled={actionLoading}>
                      {actionLoading ? '등록 중...' : '영상 등록'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">등록된 영상</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : videos.length === 0 ? (
                  <p className="muted-text">등록된 영상이 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {videos.map((video) => (
                      <div key={video.id} style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#f8fbff' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{video.courseName}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{video.title}</div>
                        <div style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '10px' }}>{video.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '14px', color: '#475569' }}>강사 {video.teacherName} · 재생 시간 {video.duration}</div>
                          <button type="button" className="ghost-button" onClick={() => onDeleteVideo(video.id)}>
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">영상 시청 현황</h3>
                {watchHistory.length === 0 ? (
                  <p className="muted-text">아직 저장된 시청 기록이 없습니다.</p>
                ) : (
                  <table className="soft-table">
                    <thead>
                      <tr>
                        <th>학생</th>
                        <th>영상</th>
                        <th>진도율</th>
                        <th>최근 시청</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchHistory.map((item) => (
                        <tr key={`${item.studentName}-${item.videoId}`}>
                          <td>{item.studentName}</td>
                          <td>{item.videoTitle}</td>
                          <td>{item.percentage}%</td>
                          <td>{item.lastWatchedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeSection === 'assignments' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">과제 등록</h3>
                <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
                  <input type="text" placeholder="과목명" value={staffAssignmentForm.courseName} onChange={(event) => setStaffAssignmentForm((prev) => ({ ...prev, courseName: event.target.value }))} style={staffInputStyle} />
                  <input type="text" placeholder="과제 제목" value={staffAssignmentForm.title} onChange={(event) => setStaffAssignmentForm((prev) => ({ ...prev, title: event.target.value }))} style={staffInputStyle} />
                  <textarea placeholder="과제 설명" value={staffAssignmentForm.description} onChange={(event) => setStaffAssignmentForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} style={{ ...staffInputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  <input type="text" placeholder="마감일 예: 2026-04-07T18:00:00" value={staffAssignmentForm.dueDate} onChange={(event) => setStaffAssignmentForm((prev) => ({ ...prev, dueDate: event.target.value }))} style={staffInputStyle} />
                  <input type="number" placeholder="배점" value={staffAssignmentForm.maxScore} onChange={(event) => setStaffAssignmentForm((prev) => ({ ...prev, maxScore: Number(event.target.value) }))} style={staffInputStyle} />
                  <div>
                    <button type="button" className="legacy-login-button" onClick={onCreateAssignment} disabled={actionLoading}>
                      {actionLoading ? '등록 중...' : '과제 등록'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">등록된 과제</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : assignments.length === 0 ? (
                  <p className="muted-text">등록된 과제가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {assignments.map((assignment) => (
                      <div key={assignment.id} style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#fffdfa' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{assignment.courseName}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{assignment.title}</div>
                        <div style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '10px' }}>{assignment.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '14px', color: '#475569' }}>마감 {assignment.dueDate} · 배점 {assignment.maxScore}점</div>
                          <button type="button" className="ghost-button" onClick={() => onDeleteAssignment(assignment.id)}>
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">제출물 채점</h3>
                {allSubmissions.length === 0 ? (
                  <p className="muted-text">아직 제출된 과제가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {allSubmissions.map((submission) => {
                      const gradeDraft = gradingState[submission.id] || {};
                      return (
                        <div key={submission.id} style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#f8fafc' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{submission.studentName}</div>
                          <div style={{ color: '#64748b', marginBottom: '12px' }}>제출 시각 {submission.submittedAt}</div>
                          <div style={{ color: '#334155', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{submission.content}</div>
                          <div style={{ display: 'grid', gap: '10px', maxWidth: '520px' }}>
                            <input
                              type="number"
                              placeholder="점수"
                              value={gradeDraft.score ?? submission.score ?? ''}
                              onChange={(event) => onGradeFieldChange(submission.id, 'score', event.target.value)}
                              style={staffInputStyle}
                            />
                            <textarea
                              rows={3}
                              placeholder="피드백"
                              value={gradeDraft.feedback ?? submission.feedback ?? ''}
                              onChange={(event) => onGradeFieldChange(submission.id, 'feedback', event.target.value)}
                              style={{ ...staffInputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                            />
                            <div>
                              <button type="button" className="legacy-login-button" onClick={() => onGradeSubmission(submission.id)} disabled={actionLoading}>
                                {actionLoading ? '저장 중...' : '채점 저장'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'settings' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">프로필 설정</h3>
                <div style={{ display: 'grid', gap: '16px', maxWidth: '680px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      표시 이름
                    </label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(event) => setSettingsName(event.target.value)}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #dbe4f0', fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Mattermost ID
                    </label>
                    <input
                      type="text"
                      value={username}
                      readOnly
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      이메일
                    </label>
                    <input
                      type="text"
                      value={email || '등록된 이메일 정보가 없습니다.'}
                      readOnly
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '16px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="legacy-login-button" onClick={onSaveProfile}>
                      프로필 저장
                    </button>
                    <button type="button" className="ghost-button" onClick={onLogout}>
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">비밀번호 변경</h3>
                <div style={{ display: 'grid', gap: '16px', maxWidth: '680px' }}>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="현재 비밀번호"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #dbe4f0', fontSize: '16px' }}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="새 비밀번호"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #dbe4f0', fontSize: '16px' }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="새 비밀번호 확인"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #dbe4f0', fontSize: '16px' }}
                  />
                  <div>
                    <button type="button" className="legacy-login-button" onClick={onChangePassword} disabled={actionLoading}>
                      {actionLoading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">기기 인증 변경</h3>
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    border: '1px solid #dbe4f0',
                    background: '#f8fbff',
                    marginBottom: '18px',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#334155',
                      fontFamily: 'inherit',
                    }}
                  >
{`브라우저: ${deviceInfo.userAgent}
플랫폼: ${deviceInfo.platform}
언어: ${deviceInfo.language}
화면 크기: ${deviceInfo.screenResolution}
확인 시각: ${new Date(deviceInfo.timestamp).toLocaleString('ko-KR')}`}
                  </pre>
                </div>
                <button
                  type="button"
                  className="legacy-login-button"
                  onClick={onRequestDeviceChange}
                  disabled={actionLoading || deviceRequestCompleted}
                >
                  {deviceRequestCompleted ? '요청 완료' : actionLoading ? '요청 중...' : '기기 인증 변경 요청'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StudentHome({
  username,
  displayName,
  email,
  academyName,
  activeSection,
  setActiveSection,
  courses,
  schedules,
  selectedCourseId,
  setSelectedCourseId,
  records,
  attendanceMonth,
  offlineMonth,
  videos,
  assignments,
  offlineClasses,
  myOfflineApplications,
  selectedVideo,
  setSelectedVideo,
  selectedAssignment,
  setSelectedAssignment,
  assignmentSubmission,
  submissionContent,
  setSubmissionContent,
  infoMessage,
  actionLoading,
  contentLoading,
  onAttendance,
  onAttendanceMonthChange,
  onOfflineMonthChange,
  onSelectVideo,
  onSelectAssignment,
  onSubmitAssignment,
  onApplyOfflineClass,
  settingsName,
  setSettingsName,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  deviceRequestCompleted,
  deviceInfo,
  onSaveProfile,
  onChangePassword,
  onRequestDeviceChange,
  onLogout,
}) {
  const selectedCourse = useMemo(() => {
    return courses.find((course) => course.id === selectedCourseId) || courses[0] || null;
  }, [courses, selectedCourseId]);
  const filteredVideos = useMemo(() => {
    if (!selectedCourse?.id) {
      return videos;
    }
    return videos.filter((video) => video.courseId === selectedCourse.id);
  }, [videos, selectedCourse]);
  const filteredAssignments = useMemo(() => {
    if (!selectedCourse?.id) {
      return assignments;
    }
    return assignments.filter((assignment) => assignment.courseId === selectedCourse.id);
  }, [assignments, selectedCourse]);
  const filteredOfflineClasses = useMemo(() => {
    if (!selectedCourse?.id) {
      return offlineClasses;
    }
    return offlineClasses.filter((item) => item.courseId === selectedCourse.id);
  }, [offlineClasses, selectedCourse]);
  const appliedOfflineClassIds = useMemo(() => {
    return new Set(myOfflineApplications.map((item) => item.offlineClassId));
  }, [myOfflineApplications]);
  const filteredSchedules = useMemo(() => {
    if (!selectedCourse?.id) {
      return schedules;
    }
    return schedules.filter((schedule) => schedule.courseId === selectedCourse.id);
  }, [schedules, selectedCourse]);

  useEffect(() => {
    setSelectedVideo(null);
    setSelectedAssignment(null);
  }, [selectedCourseId, setSelectedAssignment, setSelectedVideo]);

  const menuItems = [
    { key: 'attendance', label: '출석', description: '출석 체크와 이력 확인' },
    { key: 'videos', label: '강의 영상', description: '수강 중인 강의 보기' },
    { key: 'offlineClasses', label: '오프라인 강의', description: '월별 일정 확인과 수강 신청' },
    { key: 'assignments', label: '과제', description: '과제 확인과 제출 준비' },
    { key: 'settings', label: '설정', description: '프로필과 기기 관리' },
  ];
  const pageTitle = activeSection === 'videos' || activeSection === 'assignments' || activeSection === 'offlineClasses'
    ? `${selectedCourse?.name || '강의방'} ${menuItems.find((item) => item.key === activeSection)?.label || ''}`.trim()
    : menuItems.find((item) => item.key === activeSection)?.label;

  return (
    <div className="discord-app-shell">
      <aside className="server-rail">
        <div className="server-rail-brand">AP</div>
        <div className="server-rail-stack">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              className={`server-node ${selectedCourseId === course.id ? 'is-active' : ''}`}
              title={course.name}
              onClick={() => {
                setSelectedCourseId(course.id);
                if (activeSection !== 'attendance' && activeSection !== 'settings') {
                  setActiveSection('videos');
                }
              }}
            >
              {course.shortName}
            </button>
          ))}
        </div>
      </aside>

      <aside className="channel-sidebar">
        <div className="channel-sidebar-header">
          <p className="channel-sidebar-kicker">Student Dashboard</p>
          <h2 className="channel-sidebar-title">{selectedCourse?.name || '학습 홈'}</h2>
          {academyName ? (
            <p style={{ margin: '10px 0 0', color: '#b5bac1', fontSize: '14px' }}>{academyName}</p>
          ) : null}
        </div>

        <div className="channel-sidebar-scroll">
          <div className="channel-sidebar-section">
            <div className="channel-sidebar-label">메뉴</div>
            <div className="channel-nav">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`channel-link ${activeSection === item.key ? 'is-active' : ''}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  <span className="channel-link-prefix">#</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="channel-sidebar-section">
            <div className="channel-sidebar-label">선택한 강의방</div>
            <div style={{ padding: '0 12px 8px', color: '#b5bac1', lineHeight: 1.7, fontSize: '14px' }}>
              {selectedCourse?.description || '수강 중인 강의방을 선택하면 영상과 과제가 해당 강의 기준으로 정리됩니다.'}
            </div>
          </div>
        </div>

        <div className="channel-sidebar-footer">
          <div className="profile-row">
            <div className="profile-chip">
              <div className="profile-avatar">{(displayName || username || 'S').slice(0, 1).toUpperCase()}</div>
              <div className="profile-meta">
                <strong>{displayName || username}</strong>
                <span>학생 계정</span>
              </div>
            </div>
            <button
              type="button"
              className="profile-settings-button"
              title="설정"
              aria-label="설정"
              onClick={() => setActiveSection('settings')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="profile-settings-icon">
                <path
                  fill="currentColor"
                  d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.22 1.13-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
                />
              </svg>
            </button>
          </div>
          <button type="button" className="ghost-button sidebar-logout" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </aside>

      <main className="discord-main-panel">
        <div className="content-topbar">
          <div>
            <p className="content-kicker">
              {activeSection === 'attendance' || activeSection === 'settings' ? '학습 공간' : selectedCourse?.name || '강의방'}
            </p>
            <h1 className="content-title">{pageTitle}</h1>
          </div>
          <div className="content-topbar-badge">
            학생이 가장 자주 쓰는 화면만 먼저 정리했습니다. 출석은 전체 기준으로, 영상과 과제는 선택한 강의방 기준으로 보입니다.
          </div>
        </div>

        <div className="discord-content-body" style={{ display: 'grid', gap: '20px' }}>

          {infoMessage && <div className="login-alert">{infoMessage}</div>}

          {activeSection === 'attendance' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">출석 체크</h3>
                <p className="muted-text" style={{ marginBottom: '18px' }}>
                  버튼을 누르면 오늘 출석 기록이 바로 저장됩니다.
                </p>
                <button
                  type="button"
                  className="legacy-login-button"
                  onClick={onAttendance}
                  disabled={actionLoading}
                >
                  {actionLoading ? '처리 중...' : '출석 체크'}
                </button>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <h3 className="section-heading" style={{ marginBottom: 0 }}>출석 달력</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button type="button" className="ghost-button" onClick={() => onAttendanceMonthChange(-1)}>
                      이전 달
                    </button>
                    <div style={{ minWidth: '120px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                      {attendanceMonth.year}.{String(attendanceMonth.month).padStart(2, '0')}
                    </div>
                    <button type="button" className="ghost-button" onClick={() => onAttendanceMonthChange(1)}>
                      다음 달
                    </button>
                  </div>
                </div>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : (
                  <>
                    <AttendanceCalendar
                      year={attendanceMonth.year}
                      month={attendanceMonth.month}
                      records={records}
                    />

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '18px 0 20px' }}>
                      <LegendItem color="#dcfce7" border="#86efac" label="출석" />
                      <LegendItem color="#fef3c7" border="#fbbf24" label="지각" />
                      <LegendItem color="#fee2e2" border="#fca5a5" label="결석" />
                    </div>

                    <h4 style={{ margin: '0 0 14px', fontSize: '18px', color: '#334155' }}>이번 달 출석 목록</h4>
                    {records.length === 0 ? (
                      <p className="muted-text">이번 달 기록이 아직 없습니다.</p>
                    ) : (
                      <table className="soft-table">
                        <thead>
                          <tr>
                            <th>날짜</th>
                            <th>시간</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record) => (
                            <tr key={`${record.id}-${record.attendanceDate}`}>
                              <td>{record.attendanceDate}</td>
                              <td>{record.checkedInAt || record.timestamp}</td>
                              <td><span className="status-pill">{translateAttendanceStatus(record.status)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">내 시간표</h3>
                <p className="muted-text" style={{ marginBottom: '18px' }}>
                  출석과 함께 확인할 수 있도록 현재 수강 중인 {selectedCourse?.name || '강의'} 시간표를 같이 보여줍니다.
                </p>
                {filteredSchedules.length === 0 ? (
                  <p className="muted-text">등록된 시간표가 없습니다.</p>
                ) : (
                  <>
                    <table className="soft-table">
                      <thead>
                        <tr>
                          <th>강의</th>
                          <th>요일</th>
                          <th>시간</th>
                          <th>유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSchedules.map((schedule, index) => (
                          <tr key={`${schedule.courseId}-${schedule.dayOfWeek}-${schedule.startTime}-${index}`}>
                            <td>{schedule.courseName}</td>
                            <td>{translateDayOfWeek(schedule.dayOfWeek)}</td>
                            <td>{schedule.startTime} - {schedule.endTime}</td>
                            <td><span className="status-pill" style={schedule.classType === 'offline' ? { background: '#fef3c7', color: '#92400e' } : { background: '#dbeafe', color: '#1d4ed8' }}>{schedule.classType === 'offline' ? '오프라인' : '온라인'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
                      {filteredSchedules.map((schedule, index) => (
                        <div key={`${schedule.courseId}-${schedule.dayOfWeek}-${index}-card`} style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#f8fbff' }}>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{translateDayOfWeek(schedule.dayOfWeek)} · {schedule.classType === 'offline' ? '오프라인 수업' : '온라인 수업'}</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{schedule.courseName}</div>
                          <div style={{ color: '#475569' }}>{schedule.startTime} - {schedule.endTime}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {activeSection === 'videos' && (
            <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
              <h3 className="section-heading">강의 영상</h3>
              {contentLoading ? (
                <p className="muted-text">불러오는 중...</p>
              ) : filteredVideos.length === 0 ? (
                <p className="muted-text">등록된 영상이 없습니다.</p>
              ) : selectedVideo ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ width: 'fit-content', color: '#334155', borderColor: '#dbe4f0', background: '#fff' }}
                    onClick={() => setSelectedVideo(null)}
                  >
                    목록으로 돌아가기
                  </button>
                  <div style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#f8fbff' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{selectedVideo.courseName}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2a37', marginBottom: '10px' }}>{selectedVideo.title}</div>
                    <div style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '14px' }}>{selectedVideo.description}</div>
                    <div style={{ fontSize: '14px', color: '#475569', marginBottom: '18px' }}>
                      강사 {selectedVideo.teacherName} · 재생 시간 {selectedVideo.duration}
                    </div>
                    <div style={{ borderRadius: '18px', overflow: 'hidden', background: '#0f172a' }}>
                      <iframe
                        title={selectedVideo.title}
                        src={selectedVideo.videoUrl.replace('watch?v=', 'embed/')}
                        style={{ width: '100%', height: '420px', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {filteredVideos.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => onSelectVideo(video.id)}
                      style={{
                        padding: '18px',
                        border: '1px solid #dbe4f0',
                        borderRadius: '18px',
                        background: '#f8fbff',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{video.courseName}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{video.title}</div>
                      <div style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '10px' }}>{video.description}</div>
                      <div style={{ fontSize: '14px', color: '#475569' }}>강사 {video.teacherName} · 재생 시간 {video.duration}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'offlineClasses' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 className="section-heading" style={{ marginBottom: '8px' }}>오프라인 강의 일정</h3>
                    <p className="muted-text" style={{ margin: 0 }}>
                      강사가 등록한 {selectedCourse?.name || '강의방'} 오프라인 수업 일정을 확인하고 바로 수강 신청할 수 있습니다.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button type="button" className="ghost-button" onClick={() => onOfflineMonthChange(-1)}>
                      이전 달
                    </button>
                    <div style={{ minWidth: '120px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                      {offlineMonth.year}.{String(offlineMonth.month).padStart(2, '0')}
                    </div>
                    <button type="button" className="ghost-button" onClick={() => onOfflineMonthChange(1)}>
                      다음 달
                    </button>
                  </div>
                </div>

                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : filteredOfflineClasses.length === 0 ? (
                  <p className="muted-text">이번 달에 열린 오프라인 강의 일정이 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {filteredOfflineClasses.map((offlineClass) => {
                      const isApplied = appliedOfflineClassIds.has(offlineClass.id);
                      const isFull = offlineClass.enrolledCount >= offlineClass.capacity;
                      return (
                        <div key={offlineClass.id} style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#f8fbff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{offlineClass.courseName}</div>
                              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{offlineClass.title}</div>
                            </div>
                            <span className="status-pill" style={isApplied ? {} : isFull ? { background: '#fee2e2', color: '#b91c1c' } : { background: '#eef2ff', color: '#4338ca' }}>
                              {isApplied ? '신청 완료' : isFull ? '정원 마감' : '신청 가능'}
                            </span>
                          </div>
                          <div style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '12px' }}>{offlineClass.description}</div>
                          <div style={{ display: 'grid', gap: '6px', color: '#475569', fontSize: '14px', marginBottom: '16px' }}>
                            <div>일정: {offlineClass.classDate} {offlineClass.startTime} - {offlineClass.endTime}</div>
                            <div>장소: {offlineClass.location}</div>
                            <div>강사: {offlineClass.teacherName} · 신청 {offlineClass.enrolledCount}/{offlineClass.capacity}</div>
                          </div>
                          <button
                            type="button"
                            className="legacy-login-button"
                            onClick={() => onApplyOfflineClass(offlineClass.id)}
                            disabled={actionLoading || isApplied || isFull}
                          >
                            {isApplied ? '신청 완료' : isFull ? '정원 마감' : actionLoading ? '처리 중...' : '수강 신청'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">내 오프라인 신청 내역</h3>
                {myOfflineApplications.length === 0 ? (
                  <p className="muted-text">아직 신청한 오프라인 강의가 없습니다.</p>
                ) : (
                  <table className="soft-table">
                    <thead>
                      <tr>
                        <th>강의</th>
                        <th>일정</th>
                        <th>장소</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myOfflineApplications.map((application) => (
                        <tr key={application.id}>
                          <td>{application.title}</td>
                          <td>{application.classDate} {application.startTime}-{application.endTime}</td>
                          <td>{application.location}</td>
                          <td><span className="status-pill">신청 완료</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeSection === 'assignments' && (
            <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
              <h3 className="section-heading">과제</h3>
              {contentLoading ? (
                <p className="muted-text">불러오는 중...</p>
              ) : filteredAssignments.length === 0 ? (
                <p className="muted-text">등록된 과제가 없습니다.</p>
              ) : selectedAssignment ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ width: 'fit-content', color: '#334155', borderColor: '#dbe4f0', background: '#fff' }}
                    onClick={() => setSelectedAssignment(null)}
                  >
                    목록으로 돌아가기
                  </button>
                  <div style={{ padding: '18px', border: '1px solid #dbe4f0', borderRadius: '18px', background: '#fffdfa' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{selectedAssignment.courseName}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{selectedAssignment.title}</div>
                    <div style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '14px' }}>{selectedAssignment.description}</div>
                    <div style={{ fontSize: '14px', color: '#475569', marginBottom: '18px' }}>
                      마감 {selectedAssignment.dueDate} · 배점 {selectedAssignment.maxScore}점
                    </div>

                    {assignmentSubmission && (
                      <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '16px', background: '#eff6ff', color: '#1d4ed8' }}>
                        제출 완료: {assignmentSubmission.submittedAt}
                        {assignmentSubmission.score !== null && assignmentSubmission.score !== undefined && (
                          <span> · 점수 {assignmentSubmission.score}점</span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gap: '12px' }}>
                      <label style={{ fontWeight: 700, color: '#334155' }}>제출 내용</label>
                      <textarea
                        value={submissionContent}
                        onChange={(event) => setSubmissionContent(event.target.value)}
                        rows={10}
                        placeholder="과제 내용을 작성하세요."
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '16px',
                          border: '1px solid #dbe4f0',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          lineHeight: 1.6,
                        }}
                      />
                      <button
                        type="button"
                        className="legacy-login-button"
                        style={{ width: 'fit-content' }}
                        onClick={onSubmitAssignment}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '제출 중...' : assignmentSubmission ? '다시 제출하기' : '과제 제출'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {filteredAssignments.map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => onSelectAssignment(assignment.id)}
                      style={{
                        padding: '18px',
                        border: '1px solid #dbe4f0',
                        borderRadius: '18px',
                        background: '#fffdfa',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{assignment.courseName}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{assignment.title}</div>
                      <div style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '10px' }}>{assignment.description}</div>
                      <div style={{ fontSize: '14px', color: '#475569' }}>
                        마감 {assignment.dueDate} · 배점 {assignment.maxScore}점
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'settings' && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">프로필 설정</h3>
                <div style={{ display: 'grid', gap: '16px', maxWidth: '680px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      표시 이름
                    </label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(event) => setSettingsName(event.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: '1px solid #dbe4f0',
                        fontSize: '16px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Mattermost ID
                    </label>
                    <input
                      type="text"
                      value={username}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        fontSize: '16px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      이메일
                    </label>
                    <input
                      type="text"
                      value={email || '등록된 이메일 정보가 없습니다.'}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        fontSize: '16px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="legacy-login-button" onClick={onSaveProfile}>
                      프로필 저장
                    </button>
                    <button type="button" className="ghost-button" onClick={onLogout}>
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">비밀번호 변경</h3>
                <p className="muted-text" style={{ marginBottom: '18px' }}>
                  현재 Mattermost 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
                </p>
                <div style={{ display: 'grid', gap: '16px', maxWidth: '680px' }}>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="현재 비밀번호"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: '1px solid #dbe4f0',
                      fontSize: '16px',
                    }}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="새 비밀번호"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: '1px solid #dbe4f0',
                      fontSize: '16px',
                    }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="새 비밀번호 확인"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: '1px solid #dbe4f0',
                      fontSize: '16px',
                    }}
                  />
                  <div>
                    <button
                      type="button"
                      className="legacy-login-button"
                      onClick={onChangePassword}
                      disabled={actionLoading}
                    >
                      {actionLoading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">기기 인증 변경</h3>
                <p className="muted-text" style={{ marginBottom: '18px' }}>
                  현재 접속 중인 기기 정보를 확인하고, 새 기기로 인증을 바꿔야 할 때 변경 요청을 보낼 수 있습니다.
                </p>
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    border: '1px solid #dbe4f0',
                    background: '#f8fbff',
                    marginBottom: '18px',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#334155',
                      fontFamily: 'inherit',
                    }}
                  >
{`브라우저: ${deviceInfo.userAgent}
플랫폼: ${deviceInfo.platform}
언어: ${deviceInfo.language}
화면 크기: ${deviceInfo.screenResolution}
확인 시각: ${new Date(deviceInfo.timestamp).toLocaleString('ko-KR')}`}
                  </pre>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="legacy-login-button"
                    onClick={onRequestDeviceChange}
                    disabled={actionLoading || deviceRequestCompleted}
                  >
                    {deviceRequestCompleted ? '요청 완료' : actionLoading ? '요청 중...' : '기기 인증 변경 요청'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function getRoleLabel(type) {
  if (type === 'teacher') return '강사';
  if (type === 'admin') return '관리자';
  return '학생';
}

function translateDayOfWeek(dayOfWeek) {
  if (dayOfWeek === 'MON') return '월요일';
  if (dayOfWeek === 'TUE') return '화요일';
  if (dayOfWeek === 'WED') return '수요일';
  if (dayOfWeek === 'THU') return '목요일';
  if (dayOfWeek === 'FRI') return '금요일';
  if (dayOfWeek === 'SAT') return '토요일';
  if (dayOfWeek === 'SUN') return '일요일';
  return dayOfWeek || '-';
}

function AttendanceCalendar({ year, month, records }) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells = [];
  const statusMap = Object.fromEntries(records.map((record) => [record.attendanceDate, record.status]));

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(<div key={`blank-${index}`} style={{ minHeight: '92px' }} />);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = statusMap[dateKey];
    const palette = getAttendancePalette(status);

    cells.push(
      <div
        key={dateKey}
        style={{
          minHeight: '92px',
          borderRadius: '18px',
          border: `1px solid ${palette.border}`,
          background: palette.background,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontWeight: 700, color: '#334155' }}>{day}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: palette.text }}>
          {translateAttendanceStatus(status)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
          <div key={label} style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', paddingBottom: '4px' }}>
            {label}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px' }}>
        {cells}
      </div>
    </div>
  );
}

function LegendItem({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '14px', height: '14px', borderRadius: '999px', background: color, border: `1px solid ${border}` }} />
      <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function translateAttendanceStatus(status) {
  if (status === 'present') return '출석';
  if (status === 'late') return '지각';
  if (status === 'absent') return '결석';
  return '미기록';
}

function getAttendancePalette(status) {
  if (status === 'present') {
    return { background: '#dcfce7', border: '#86efac', text: '#166534' };
  }
  if (status === 'late') {
    return { background: '#fef3c7', border: '#fbbf24', text: '#92400e' };
  }
  if (status === 'absent') {
    return { background: '#fee2e2', border: '#fca5a5', text: '#b91c1c' };
  }
  return { background: '#f8fafc', border: '#e2e8f0', text: '#94a3b8' };
}

const staffInputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid #dbe4f0',
  fontSize: '16px',
};

const summaryCardStyle = {
  padding: '18px 20px',
  borderRadius: '18px',
  border: '1px solid #dbe4f0',
  background: '#f8fbff',
};

const summaryLabelStyle = {
  fontSize: '13px',
  color: '#64748b',
  marginBottom: '8px',
};

const summaryValueStyle = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#1f2a37',
};

export default App;
