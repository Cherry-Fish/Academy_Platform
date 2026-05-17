import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api/api';
import { saveToken, removeToken, isAuthenticated } from './utils/auth';
import { getDeviceInfo } from './utils/deviceInfo';
import { useTheme } from './utils/useTheme';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import SettingsPanel from './components/shared/SettingsPanel';
import DateScrollPicker from './components/shared/DateScrollPicker';
import AttendanceSection from './components/student/AttendanceSection';
import StaffOverviewSection from './components/staff/StaffOverviewSection';

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
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [pendingCredentials, setPendingCredentials] = useState(null);

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
      const msg = error.response?.data?.message || error.message;
      if (msg === 'academy.user.not.registered') {
        setPendingCredentials({ username, password });
        setShowInviteForm(true);
        setMessage('');
      } else {
        setMessage(`로그인 실패: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithInvitation = async (event) => {
    event.preventDefault();
    if (!invitationCode.trim()) { setMessage('초대코드를 입력해주세요.'); return; }
    setLoading(true);
    setMessage('');
    try {
      const response = await api.joinWithInvitation({
        username: pendingCredentials.username,
        password: pendingCredentials.password,
        invitationCode: invitationCode.trim().toUpperCase(),
      });
      const nextUsername = response.data.username || pendingCredentials.username;
      const nextUserType = response.data.userType || 'student';
      saveToken(response.data.token || response.data.jwtToken);
      localStorage.setItem('academy_username', nextUsername);
      localStorage.setItem('userType', nextUserType);
      localStorage.setItem('academy_display_name', response.data.displayName || nextUsername);
      localStorage.setItem('academy_email', response.data.email || '');
      localStorage.setItem('academy_name', response.data.academyName || '');
      localStorage.setItem('academy_courses', JSON.stringify(response.data.courses || []));
      localStorage.setItem('academy_schedules', JSON.stringify(response.data.schedules || []));
      setUsername(nextUsername);
      setUserType(nextUserType);
      setDisplayName(response.data.displayName || nextUsername);
      setEmail(response.data.email || '');
      setLoggedIn(true);
      setShowInviteForm(false);
      setPendingCredentials(null);
      setInvitationCode('');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
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

  if (showInviteForm) {
    return (
      <div className="login-page">
        <div className="login-shell">
          <div className="login-card login-card-form">
            <div className="login-copy">
              <h1 className="login-title">초대코드 입력</h1>
              <p className="login-description">
                등록되지 않은 계정입니다.<br />
                관리자에게 받은 초대코드를 입력해주세요.
              </p>
            </div>
            {message && <div className="login-alert">{message}</div>}
            <form onSubmit={handleJoinWithInvitation} className="login-form">
              <div className="legacy-input-group">
                <span className="legacy-input-icon">코드</span>
                <input
                  type="text"
                  placeholder="초대코드 8자리 (예: AB3D5F7G)"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="legacy-input"
                  maxLength={8}
                  style={{ letterSpacing: '0.15em', fontWeight: 700 }}
                />
              </div>
              <div className="login-actions">
                <button type="submit" className="legacy-login-button" disabled={loading}>
                  {loading ? '처리 중...' : '가입하기'}
                </button>
                <button type="button" className="ghost-button" onClick={() => { setShowInviteForm(false); setMessage(''); setPendingCredentials(null); }}>
                  돌아가기
                </button>
              </div>
            </form>
          </div>
          <div className="login-card login-card-visual">
            <img src={process.env.PUBLIC_URL + "/images/login_illustration.png"} alt="Login illustration" className="login-illustration" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-card login-card-form">
          <div className="login-copy">
            <h1 className="login-title">Academy Platform</h1>
            <p className="login-description">
              학원 관리를 위한 통합 플랫폼입니다.<br />
              Mattermost 계정으로 로그인하세요.
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
            src={process.env.PUBLIC_URL + "/images/login_illustration.png"}
            alt="Login illustration"
            className="login-illustration"
          />
        </div>
      </div>
    </div>
  );
}

function BasicHome({ username, displayName, setDisplayName, email, setEmail, userType, onLogout }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
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
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserForm, setAdminUserForm] = useState({
    username: '',
    role: 'student',
    name: '',
    email: '',
    password: '',
    academyName: academyName || '스타토치 아카데미',
    courseIds: [],
  });
  const [staffVideoForm, setStaffVideoForm] = useState({
    courseId: 'course-web',
    courseName: '웹프로그래밍',
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
  });
  const [staffAssignmentForm, setStaffAssignmentForm] = useState({
    courseId: '',
    courseName: '',
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
    id: '',
    courseId: 'course-web',
    courseName: '웹프로그래밍',
    title: '',
    description: '',
    dayOfWeek: 'MON',
    startDate: new Date().toISOString().slice(0, 10),
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
  const [selectedCourseId, setSelectedCourseId] = useState(
    storedCourses[0]?.courseId || DEFAULT_STUDENT_COURSES[0]?.id || ''
  );

  useEffect(() => {
    setSettingsName(displayName || username);
  }, [displayName, username]);

  useEffect(() => {
    setAdminUserForm((prev) => ({
      ...prev,
      academyName: academyName || prev.academyName || '민트학원',
    }));
  }, [academyName]);

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
    if (userType === 'student' || storedCourses.length === 0) {
      return;
    }

    const stillExists = storedCourses.some((course) => course.courseId === selectedCourseId);
    if (!stillExists) {
      setSelectedCourseId(storedCourses[0].courseId);
    }
  }, [userType, selectedCourseId, storedCourses]);

  useEffect(() => {
    if (userType === 'admin') {
      if (activeSection === 'overview') {
        loadTodayAttendance();
        loadAdminUsers();
        return;
      }

      if (activeSection === 'users') {
        loadAdminUsers();
        loadInvitations();
        return;
      }

      if (activeSection === 'settings') {
        setInfoMessage('');
      }
      return;
    }

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

  const [invitations, setInvitations] = useState([]);
  const [inviteForm, setInviteForm] = useState({ role: 'student', academyName: academyName || '스타토치 아카데미', expiresAt: new Date().toISOString().slice(0, 10) });

  const loadInvitations = async () => {
    try {
      const response = await api.getInvitations();
      setInvitations(response.data || []);
    } catch { /* silent */ }
  };

  const handleCreateInvitation = async () => {
    setActionLoading(true);
    try {
      const payload = {
        role: inviteForm.role,
        academyName: inviteForm.academyName || '스타토치 아카데미',
        expiresAt: inviteForm.expiresAt ? `${inviteForm.expiresAt}T23:59:59` : null,
      };
      const response = await api.createInvitation(payload);
      setInfoMessage(`초대코드 생성: ${response.data.code}`);
      await loadInvitations();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeInvitation = async (code) => {
    if (!window.confirm(`코드 "${code}"를 취소하시겠습니까?`)) return;
    setActionLoading(true);
    try {
      await api.revokeInvitation(code);
      setInfoMessage('초대코드가 취소되었습니다.');
      await loadInvitations();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    setContentLoading(true);
    try {
      const response = await api.getAdminUsers();
      setAdminUsers(response.data || []);
      setInfoMessage('');
    } catch (error) {
      setInfoMessage('등록 사용자 목록을 불러오지 못했습니다.');
    } finally {
      setContentLoading(false);
    }
  };

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
      setStaffVideoForm((prev) => ({
        courseId: prev.courseId,
        courseName: prev.courseName,
        title: '',
        description: '',
        videoUrl: '',
        duration: '',
      }));
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
      setStaffAssignmentForm((prev) => ({
        courseId: prev.courseId,
        courseName: prev.courseName,
        title: '',
        description: '',
        dueDate: '',
        maxScore: 100,
      }));
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

  const resetStaffOfflineClassForm = () => {
    setStaffOfflineClassForm({
      id: '',
      courseId: storedCourses[0]?.courseId || 'course-web',
      courseName: storedCourses[0]?.courseName || '웹프로그래밍',
      title: '',
      description: '',
      dayOfWeek: 'MON',
      startDate: new Date().toISOString().slice(0, 10),
      startTime: '19:00',
      endTime: '21:00',
      location: '학원 301호',
      capacity: 18,
    });
  };

  const handleCreateOfflineClass = async () => {
    if (!staffOfflineClassForm.title.trim() || !staffOfflineClassForm.dayOfWeek) {
      setInfoMessage('오프라인 강의 제목과 반복 요일을 입력해주세요.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        courseId: staffOfflineClassForm.courseId,
        courseName: staffOfflineClassForm.courseName,
        title: staffOfflineClassForm.title,
        description: staffOfflineClassForm.description,
        dayOfWeek: staffOfflineClassForm.dayOfWeek,
        startDate: staffOfflineClassForm.startDate,
        startTime: staffOfflineClassForm.startTime,
        endTime: staffOfflineClassForm.endTime,
        location: staffOfflineClassForm.location,
        capacity: Number(staffOfflineClassForm.capacity),
      };
      const response = staffOfflineClassForm.id
        ? await api.updateOfflineClass(staffOfflineClassForm.id, payload)
        : await api.createOfflineClass(payload);
      setInfoMessage(staffOfflineClassForm.id
        ? `${response.data?.title || '오프라인 강의'} 일정이 수정되었습니다.`
        : `${response.data?.title || '오프라인 강의'} 일정이 등록되었습니다.`);
      resetStaffOfflineClassForm();
      await loadOfflineClasses(offlineMonth.year, offlineMonth.month);
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditOfflineClass = (offlineClass) => {
    setStaffOfflineClassForm({
      id: offlineClass.id,
      courseId: offlineClass.courseId,
      courseName: offlineClass.courseName,
      title: offlineClass.title,
      description: offlineClass.description || '',
      dayOfWeek: offlineClass.dayOfWeek || 'MON',
      startDate: offlineClass.classDate,
      startTime: offlineClass.startTime,
      endTime: offlineClass.endTime,
      location: offlineClass.location || '',
      capacity: offlineClass.capacity || 18,
    });
    setInfoMessage(`${offlineClass.classDate} 수업을 수정하는 중입니다.`);
  };

  const handleDeleteOfflineClass = async (offlineClassId) => {
    setActionLoading(true);
    try {
      await api.deleteOfflineClass(offlineClassId);
      if (staffOfflineClassForm.id === offlineClassId) {
        resetStaffOfflineClassForm();
      }
      setInfoMessage('오프라인 강의 일정이 취소되었습니다.');
      await loadOfflineClasses(offlineMonth.year, offlineMonth.month);
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

  const handleAdminUserFieldChange = (field, value) => {
    setAdminUserForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleAdminCourse = (courseId) => {
    setAdminUserForm((prev) => {
      const nextCourseIds = prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId];
      return {
        ...prev,
        courseIds: nextCourseIds,
      };
    });
  };

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'student', email: '', academyName: '', courseIds: [] });

  const handleStartEditUser = (user) => {
    setEditingUser(user.username);
    setEditForm({
      name: user.displayName || '',
      role: (user.role || 'student').toLowerCase(),
      email: user.email || '',
      academyName: user.academyName || academyName || '스타토치 아카데미',
      courseIds: (user.courses || []).map((c) => c.courseId),
    });
  };

  const handleUpdateAdminUser = async (availableCourseOptions) => {
    setActionLoading(true);
    try {
      const payload = {
        username: editingUser,
        role: editForm.role,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        academyName: editForm.academyName.trim() || '스타토치 아카데미',
        courses: availableCourseOptions
          .filter((c) => editForm.courseIds.includes(c.id))
          .map((c) => ({ courseId: c.id, courseName: c.name })),
      };
      const response = await api.updateAdminUser(editingUser, payload);
      setInfoMessage(response.data?.message || '수정되었습니다.');
      setEditingUser(null);
      await loadAdminUsers();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdminUser = async (username) => {
    if (!window.confirm(`"${username}" 사용자를 삭제하시겠습니까?\n관련 출석, 수강, 제출 데이터도 모두 삭제됩니다.`)) return;
    setActionLoading(true);
    try {
      const response = await api.deleteAdminUser(username);
      setInfoMessage(response.data?.message || '삭제되었습니다.');
      await loadAdminUsers();
    } catch (error) {
      setInfoMessage(error.response?.data?.message || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAdminUser = async (availableCourseOptions) => {
    if (!adminUserForm.username.trim() || !adminUserForm.name.trim() || !adminUserForm.email.trim()) {
      setInfoMessage('사용자명, 이름, 이메일은 모두 입력해야 합니다.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        username: adminUserForm.username.trim(),
        role: adminUserForm.role,
        name: adminUserForm.name.trim(),
        email: adminUserForm.email.trim(),
        password: adminUserForm.password.trim() || undefined,
        academyName: adminUserForm.academyName.trim() || '스타토치 아카데미',
        courses: availableCourseOptions
          .filter((course) => adminUserForm.courseIds.includes(course.id))
          .map((course) => ({
            courseId: course.id,
            courseName: course.name,
          })),
      };

      const response = await api.createAdminUser(payload);
      setInfoMessage(response.data?.message || '사용자가 등록되었습니다.');
      setAdminUserForm({
        username: '',
        role: 'student',
        name: '',
        email: '',
        password: '',
        academyName: academyName || '스타토치 아카데미',
        courseIds: [],
      });
      await loadAdminUsers();
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
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
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
      selectedCourseId={selectedCourseId}
      setSelectedCourseId={setSelectedCourseId}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      records={records}
      videos={videos}
      assignments={assignments}
      offlineClasses={offlineClasses}
      offlineMonth={offlineMonth}
      pendingRequests={pendingRequests}
      teacherStudents={teacherStudents}
      watchHistory={watchHistory}
      allSubmissions={allSubmissions}
      adminUsers={adminUsers}
      adminUserForm={adminUserForm}
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
      onEditOfflineClass={handleEditOfflineClass}
      onResetOfflineClassForm={resetStaffOfflineClassForm}
      onDeleteOfflineClass={handleDeleteOfflineClass}
      onGradeFieldChange={handleGradeFieldChange}
      onGradeSubmission={handleGradeSubmission}
      onAdminUserFieldChange={handleAdminUserFieldChange}
      onToggleAdminCourse={handleToggleAdminCourse}
      invitations={invitations}
      inviteForm={inviteForm}
      setInviteForm={setInviteForm}
      onCreateInvitation={handleCreateInvitation}
      onRevokeInvitation={handleRevokeInvitation}
      onCreateAdminUser={handleCreateAdminUser}
      onDeleteAdminUser={handleDeleteAdminUser}
      editingUser={editingUser}
      editForm={editForm}
      setEditForm={setEditForm}
      onStartEditUser={handleStartEditUser}
      onUpdateAdminUser={handleUpdateAdminUser}
      onCancelEditUser={() => setEditingUser(null)}
      onSaveProfile={handleSaveProfile}
      onChangePassword={handlePasswordChange}
      onRequestDeviceChange={handleDeviceChangeRequest}
      onLogout={onLogout}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
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
  selectedCourseId,
  setSelectedCourseId,
  activeSection,
  setActiveSection,
  records,
  videos,
  assignments,
  offlineClasses,
  offlineMonth,
  pendingRequests,
  teacherStudents,
  watchHistory,
  allSubmissions,
  adminUsers,
  adminUserForm,
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
  onEditOfflineClass,
  onResetOfflineClassForm,
  onDeleteOfflineClass,
  onGradeFieldChange,
  onGradeSubmission,
  invitations,
  inviteForm,
  setInviteForm,
  onCreateInvitation,
  onRevokeInvitation,
  onAdminUserFieldChange,
  onToggleAdminCourse,
  onCreateAdminUser,
  onDeleteAdminUser,
  editingUser,
  editForm,
  setEditForm,
  onStartEditUser,
  onUpdateAdminUser,
  onCancelEditUser,
  onSaveProfile,
  onChangePassword,
  onRequestDeviceChange,
  onLogout,
  isDarkMode,
  toggleDarkMode,
}) {
  const isAdmin = userType === 'admin';
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const menuItems = isAdmin
    ? [
        { key: 'overview', label: '개요', description: '등록 사용자와 전체 운영 요약' },
        { key: 'users', label: '사용자 관리', description: '학생과 강사를 등록하고 강의를 배정' },
      ]
    : [
        { key: 'overview', label: '개요', description: '오늘 출석 현황 확인' },
        { key: 'students', label: '수강 학생', description: '수업 중인 학생 정보 확인' },
        { key: 'deviceRequests', label: '기기 요청', description: '학생 기기 변경 요청 승인' },
        { key: 'offlineClasses', label: '오프라인 시간 설정', description: '월별 오프라인 강의 시간과 일정 설정' },
        { key: 'videos', label: '영상 관리', description: '강의 영상 등록과 시청 현황' },
        { key: 'assignments', label: '과제 관리', description: '과제 등록과 제출물 채점' },
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
  const mappedCourses = useMemo(() => {
    return (courses || []).map((course) => ({
      id: course.courseId,
      name: course.courseName,
      shortName: (course.courseName || course.courseId || '강').slice(0, 2),
      description: `${course.courseName || course.courseId} 관리 공간입니다.`,
    }));
  }, [courses]);
  const adminCourseOptions = useMemo(() => {
    const merged = new Map();

    DEFAULT_STUDENT_COURSES.forEach((course) => {
      merged.set(course.id, { id: course.id, name: course.name });
    });

    (courses || []).forEach((course) => {
      if (course?.courseId) {
        merged.set(course.courseId, { id: course.courseId, name: course.courseName || course.courseId });
      }
    });

    (adminUsers || []).forEach((user) => {
      (user.courses || []).forEach((course) => {
        if (course?.courseId) {
          merged.set(course.courseId, { id: course.courseId, name: course.courseName || course.courseId });
        }
      });
    });

    return Array.from(merged.values());
  }, [courses, adminUsers]);
  const adminRailNodes = useMemo(() => ([
    {
      id: 'academy-admin',
      name: academyName || '학원 관리',
      shortName: (academyName || '관리').slice(0, 2),
      description: '등록 사용자와 강의 배정을 관리하는 공간입니다.',
    },
  ]), [academyName]);
  const selectedCourse = useMemo(() => {
    return mappedCourses.find((course) => course.id === selectedCourseId) || mappedCourses[0] || null;
  }, [mappedCourses, selectedCourseId]);
  const filteredStudentsByCourse = useMemo(() => {
    if (!selectedCourse?.id) {
      return studentsByCourse;
    }
    return studentsByCourse.filter((group) => group.courseId === selectedCourse.id);
  }, [selectedCourse, studentsByCourse]);
  const filteredOfflineClasses = useMemo(() => {
    if (!selectedCourse?.id) {
      return offlineClasses;
    }
    return offlineClasses.filter((offlineClass) => offlineClass.courseId === selectedCourse.id);
  }, [offlineClasses, selectedCourse]);
  const filteredOfflineSchedules = useMemo(() => {
    if (!selectedCourse?.id) {
      return offlineSchedules;
    }
    return offlineSchedules.filter((schedule) => schedule.courseId === selectedCourse.id);
  }, [offlineSchedules, selectedCourse]);
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
  const staffTopbarBadge = userType === 'admin'
    ? '관리자는 같은 레이아웃 안에서 등록 사용자, 학원 소속, 강의 배정 흐름을 관리합니다.'
    : '강사는 학생과 같은 구조 안에서 출석, 학생, 오프라인 수업, 과제와 영상을 관리합니다.';

  return (
    <WorkspaceLayout
      railNodes={isAdmin ? adminRailNodes : mappedCourses}
      selectedRailId={isAdmin ? adminRailNodes[0]?.id : selectedCourseId}
      onSelectRail={isAdmin ? undefined : setSelectedCourseId}
      sidebarKicker={userType === 'admin' ? 'Admin Dashboard' : 'Teacher Dashboard'}
      sidebarTitle={isAdmin ? (academyName || `${getRoleLabel(userType)} 홈`) : (selectedCourse?.name || `${getRoleLabel(userType)} 홈`)}
      sidebarSubtitle={academyName}
      menuItems={menuItems}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      selectedRoomDescription={isAdmin
        ? '학생과 강사를 등록하고, 학원 소속과 수강 강의를 미리 배정하는 관리자 공간입니다.'
        : (selectedCourse?.description || '강의별 학생, 오프라인 시간, 과제와 영상을 같은 구조에서 관리합니다.')}
      profileName={displayName || username}
      profileRoleLabel={`${getRoleLabel(userType)} 계정`}
      onOpenSettings={() => setActiveSection('settings')}
      onLogout={onLogout}
      topbarKicker={isAdmin ? (academyName || '관리 공간') : (selectedCourse?.name || '관리 공간')}
      topbarTitle={menuItems.find((item) => item.key === activeSection)?.label}
      topbarBadge={staffTopbarBadge}
    >
      {infoMessage && <div className="login-alert">{infoMessage}</div>}

          {activeSection === 'overview' && (
            <StaffOverviewSection
              username={username}
              displayName={displayName}
              userType={userType}
              academyName={academyName}
              selectedCourse={selectedCourse}
              records={records}
              pendingRequests={pendingRequests}
              allSubmissions={allSubmissions}
              adminUsers={adminUsers}
              contentLoading={contentLoading}
              getRoleLabel={getRoleLabel}
            />
          )}

          {activeSection === 'users' && isAdmin && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">초대코드 관리</h3>
                <p className="muted-text" style={{ marginBottom: '18px' }}>초대코드를 생성해 전달하면, 상대방이 Mattermost 로그인 후 코드를 입력해 자동 등록됩니다.</p>
                <div style={{ display: 'grid', gap: '10px', maxWidth: '820px', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 200px', gap: '10px' }}>
                    <select value={inviteForm.role} onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))} style={staffInputStyle}>
                      <option value="student">학생</option>
                      <option value="teacher">강사</option>
                      <option value="admin">관리자</option>
                    </select>
                    <input style={staffInputStyle} placeholder="학원명" value={inviteForm.academyName} onChange={(e) => setInviteForm((p) => ({ ...p, academyName: e.target.value }))} />
                    <DateScrollPicker value={inviteForm.expiresAt} onChange={(v) => setInviteForm((p) => ({ ...p, expiresAt: v }))} />
                  </div>
                  <button onClick={onCreateInvitation} disabled={actionLoading} className="legacy-login-button" style={{ width: 'fit-content' }}>코드 생성</button>
                </div>
                {invitations.length > 0 && (
                  <div style={{ display: 'grid', gap: '8px', maxWidth: '820px' }}>
                    {invitations.map((inv) => (
                      <div key={inv.code} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: inv.status === 'active' ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: `1px solid ${inv.status === 'active' ? '#bbf7d0' : '#e2e8f0'}` }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '16px', letterSpacing: '0.1em', color: inv.status === 'active' ? '#15803d' : '#94a3b8' }}>{inv.code}</span>
                        <span className="status-pill" style={{ background: inv.status === 'active' ? '#dcfce7' : inv.status === 'used' ? '#e0f2fe' : '#fee2e2', color: inv.status === 'active' ? '#15803d' : inv.status === 'used' ? '#0369a1' : '#dc2626' }}>
                          {inv.status === 'active' ? '사용 가능' : inv.status === 'used' ? `사용됨 · ${inv.usedByUsername}` : '취소됨'}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>{inv.role === 'student' ? '학생' : inv.role === 'teacher' ? '강사' : '관리자'}</span>
                        {inv.expiresAt && <span style={{ color: '#94a3b8', fontSize: '12px' }}>~{inv.expiresAt.slice(0, 10)}</span>}
                        {inv.status === 'active' && (
                          <button onClick={() => onRevokeInvitation(inv.code)} disabled={actionLoading} style={{ marginLeft: 'auto', padding: '3px 8px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>취소</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">학생 / 강사 등록</h3>
                <p className="muted-text" style={{ marginBottom: '18px' }}>
                  비밀번호를 입력하면 Mattermost 계정이 자동으로 생성됩니다. 비밀번호를 비워두면 학원 시스템에만 등록됩니다 (기존 Mattermost 계정 연결).
                </p>
                <div style={{ display: 'grid', gap: '12px', maxWidth: '820px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px' }}>
                    <input type="text" placeholder="username" value={adminUserForm.username} onChange={(event) => onAdminUserFieldChange('username', event.target.value)} style={staffInputStyle} />
                    <select value={adminUserForm.role} onChange={(event) => onAdminUserFieldChange('role', event.target.value)} style={staffInputStyle}>
                      <option value="student">학생</option>
                      <option value="teacher">강사</option>
                      <option value="admin">관리자</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" placeholder="이름" value={adminUserForm.name} onChange={(event) => onAdminUserFieldChange('name', event.target.value)} style={staffInputStyle} />
                    <input type="email" placeholder="이메일" value={adminUserForm.email} onChange={(event) => onAdminUserFieldChange('email', event.target.value)} style={staffInputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="password" placeholder="비밀번호 (Mattermost 계정 자동 생성)" value={adminUserForm.password} onChange={(event) => onAdminUserFieldChange('password', event.target.value)} style={staffInputStyle} />
                    <input type="text" placeholder="학원명" value={adminUserForm.academyName} onChange={(event) => onAdminUserFieldChange('academyName', event.target.value)} style={staffInputStyle} />
                  </div>
                  <div className="info-card">
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>수강 / 담당 강의 배정</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {adminCourseOptions.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => onToggleAdminCourse(course.id)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '999px',
                            border: adminUserForm.courseIds.includes(course.id) ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                            background: adminUserForm.courseIds.includes(course.id) ? '#eef2ff' : '#ffffff',
                            color: adminUserForm.courseIds.includes(course.id) ? '#4338ca' : '#334155',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {course.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <button type="button" className="legacy-login-button" onClick={() => onCreateAdminUser(adminCourseOptions)} disabled={actionLoading}>
                      {actionLoading ? '등록 중...' : '사용자 등록'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">등록된 사용자 목록</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : adminUsers.length === 0 ? (
                  <p className="muted-text">등록된 사용자가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {adminUsers.map((user) => (
                      <div key={user.username} className="info-card">
                        {editingUser === user.username ? (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2a37', marginBottom: '4px' }}>{user.username} 수정</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <input className="legacy-input" placeholder="이름" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                              <select className="legacy-input" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
                                <option value="student">학생</option>
                                <option value="teacher">강사</option>
                                <option value="admin">관리자</option>
                              </select>
                              <input className="legacy-input" placeholder="이메일" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                              <input className="legacy-input" placeholder="학원명" value={editForm.academyName} onChange={(e) => setEditForm((p) => ({ ...p, academyName: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              {adminCourseOptions.map((c) => (
                                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={editForm.courseIds.includes(c.id)} onChange={() => setEditForm((p) => ({ ...p, courseIds: p.courseIds.includes(c.id) ? p.courseIds.filter((id) => id !== c.id) : [...p.courseIds, c.id] }))} />
                                  {c.name}
                                </label>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => onUpdateAdminUser(adminCourseOptions)} disabled={actionLoading} className="legacy-login-button" style={{ padding: '6px 16px', fontSize: '13px' }}>
                                {actionLoading ? '저장 중...' : '저장'}
                              </button>
                              <button onClick={onCancelEditUser} disabled={actionLoading} className="ghost-button" style={{ padding: '6px 16px', fontSize: '13px' }}>
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{user.displayName}</div>
                                <div style={{ color: '#64748b' }}>{user.username} · {user.email}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="status-pill">{getRoleLabel((user.role || '').toLowerCase())}</span>
                                <button onClick={() => onStartEditUser(user)} disabled={actionLoading} style={{ padding: '4px 10px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                                  수정
                                </button>
                                <button onClick={() => onDeleteAdminUser(user.username)} disabled={actionLoading} style={{ padding: '4px 10px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                                  삭제
                                </button>
                              </div>
                            </div>
                            <div style={{ color: '#475569', marginTop: '10px', lineHeight: 1.7 }}>
                              소속 학원: {user.academyName || '-'}
                            </div>
                            {(user.courses || []).length > 0 ? (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                {user.courses.map((course) => (
                                  <span key={`${user.username}-${course.courseId}`} className="status-pill" style={{ background: '#eef2ff', color: '#4338ca' }}>
                                    {course.courseName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: '#94a3b8', marginTop: '12px' }}>배정된 강의가 없습니다.</div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'students' && !isAdmin && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">수강 학생 요약</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div className="summary-mini-card">
                    <div className="summary-mini-label">{selectedCourse ? '현재 강의 학생' : '전체 학생'}</div>
                    <div className="summary-mini-value">{filteredStudentsByCourse.reduce((count, group) => count + group.students.length, 0)}명</div>
                  </div>
                  <div className="summary-mini-card">
                    <div className="summary-mini-label">담당 강의</div>
                    <div className="summary-mini-value">{(courses || []).length}개</div>
                  </div>
                  <div className="summary-mini-card">
                    <div className="summary-mini-label">오프라인 수업</div>
                    <div className="summary-mini-value">{offlineSchedules.length}개</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">{selectedCourse ? `${selectedCourse.name} 수강 학생` : '강의별 수강 학생'}</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : filteredStudentsByCourse.length === 0 ? (
                  <p className="muted-text">표시할 학생 정보가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '18px' }}>
                    {filteredStudentsByCourse.map((group) => (
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

          {activeSection === 'deviceRequests' && !isAdmin && (
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

          {activeSection === 'offlineClasses' && !isAdmin && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">담당 오프라인 시간표</h3>
                {filteredOfflineSchedules.length === 0 ? (
                  <p className="muted-text">등록된 오프라인 정규 시간표가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {filteredOfflineSchedules.map((schedule) => (
                      <div key={`${schedule.courseId}-${schedule.dayOfWeek}-${schedule.startTime}`} className="info-card">
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
                    <h3 className="section-heading" style={{ marginBottom: '8px' }}>
                      {staffOfflineClassForm.id ? '오프라인 강의 날짜 수정' : '오프라인 강의 반복 시간 등록'}
                    </h3>
                    <p className="muted-text" style={{ margin: 0 }}>
                      한 번 등록한 수업은 매주 반복으로 생성되고, 아래 캘린더에서 날짜별 수업을 눌러 개별 수정할 수 있습니다.
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
                    <select value={staffOfflineClassForm.dayOfWeek} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, dayOfWeek: event.target.value }))} style={staffInputStyle}>
                      <option value="MON">월요일</option>
                      <option value="TUE">화요일</option>
                      <option value="WED">수요일</option>
                      <option value="THU">목요일</option>
                      <option value="FRI">금요일</option>
                      <option value="SAT">토요일</option>
                      <option value="SUN">일요일</option>
                    </select>
                    <input type="date" value={staffOfflineClassForm.startDate} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, startDate: event.target.value }))} style={staffInputStyle} />
                    <input type="time" value={staffOfflineClassForm.startTime} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, startTime: event.target.value }))} style={staffInputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="time" value={staffOfflineClassForm.endTime} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, endTime: event.target.value }))} style={staffInputStyle} />
                    <input type="text" placeholder="장소" value={staffOfflineClassForm.location} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, location: event.target.value }))} style={staffInputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px' }}>
                    <input type="number" placeholder="정원" value={staffOfflineClassForm.capacity} onChange={(event) => setStaffOfflineClassForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))} style={staffInputStyle} />
                    <div className="info-card" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                      매주 {translateDayOfWeek(staffOfflineClassForm.dayOfWeek)} · {staffOfflineClassForm.startTime} - {staffOfflineClassForm.endTime}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="legacy-login-button" onClick={onCreateOfflineClass} disabled={actionLoading}>
                      {actionLoading ? '저장 중...' : staffOfflineClassForm.id ? '해당 날짜 수정 저장' : '반복 시간 등록'}
                    </button>
                    {staffOfflineClassForm.id ? (
                      <button type="button" className="ghost-button" onClick={onResetOfflineClassForm}>
                        수정 취소
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">월간 오프라인 강의 캘린더</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : (
                  <OfflineClassCalendar
                    year={offlineMonth.year}
                    month={offlineMonth.month}
                    offlineClasses={filteredOfflineClasses}
                    onEditOfflineClass={onEditOfflineClass}
                  />
                )}
              </div>

              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">이번 달 오프라인 일정</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : filteredOfflineClasses.length === 0 ? (
                  <p className="muted-text">등록된 오프라인 일정이 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {filteredOfflineClasses.map((offlineClass) => (
                      <div key={offlineClass.id} className="info-card">
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
                          <div>일정: {offlineClass.classDate} · {translateDayOfWeek(offlineClass.dayOfWeek)} · {offlineClass.startTime} - {offlineClass.endTime}</div>
                          <div>장소: {offlineClass.location}</div>
                          <div>정원: {offlineClass.capacity}명</div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <span className="status-pill" style={{ background: '#eef2ff', color: '#4338ca' }}>
                              매주 반복
                            </span>
                            {offlineClass.isOverride ? (
                              <span className="status-pill" style={{ background: '#fff7ed', color: '#c2410c' }}>
                                개별 수정됨
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            <button type="button" className="ghost-button" onClick={() => onEditOfflineClass(offlineClass)}>
                              해당 날짜 수정
                            </button>
                            <button type="button" className="ghost-button" onClick={() => onDeleteOfflineClass(offlineClass.id)}>
                              해당 날짜 취소
                            </button>
                          </div>
                          <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#ffffff', border: '1px solid #dbe4f0', color: '#475569', lineHeight: 1.6 }}>
                            이 수업은 학생이 직접 신청하지 않습니다. 학원 등록과 반 편성 시 관리자가 자동으로 수강생을 배정하는 방식으로 운영합니다.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'videos' && !isAdmin && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">강의 영상 등록</h3>
                <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
                  <select value={staffVideoForm.courseId} onChange={(event) => { const course = mappedCourses.find(c => c.id === event.target.value); setStaffVideoForm((prev) => ({ ...prev, courseId: event.target.value, courseName: course?.name || event.target.value })); }} style={staffInputStyle}>
                    {mappedCourses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
                  </select>
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
                ) : filteredVideos.length === 0 ? (
                  <p className="muted-text">등록된 영상이 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {filteredVideos.map((video) => (
                      <div key={video.id} className="info-card">
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

          {activeSection === 'assignments' && !isAdmin && (
            <>
              <div className="dashboard-card" style={{ borderRadius: '24px', padding: '28px' }}>
                <h3 className="section-heading">과제 등록</h3>
                <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
                  <select
                    value={staffAssignmentForm.courseId || ''}
                    onChange={(event) => {
                      const course = mappedCourses.find((c) => c.id === event.target.value);
                      setStaffAssignmentForm((prev) => ({ ...prev, courseId: event.target.value, courseName: course?.name || event.target.value }));
                    }}
                    style={staffInputStyle}
                  >
                    <option value="">과목 선택</option>
                    {mappedCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
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
                <h3 className="section-heading">과제 목록 & 제출 현황</h3>
                {contentLoading ? (
                  <p className="muted-text">불러오는 중...</p>
                ) : filteredAssignments.length === 0 ? (
                  <p className="muted-text">등록된 과제가 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '18px' }}>
                    {filteredAssignments.map((assignment) => {
                      const courseStudents = (studentsByCourse.find((g) => g.courseId === assignment.courseId)?.students) || [];
                      const submissionsForAssignment = allSubmissions.filter((s) => s.assignmentId === assignment.id);
                      const isExpanded = expandedAssignmentId === assignment.id;
                      return (
                        <div key={assignment.id} className="info-card">
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>{assignment.courseName}</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '6px' }}>{assignment.title}</div>
                          <div style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '10px' }}>{assignment.description}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <div style={{ fontSize: '14px', color: '#475569' }}>마감 {assignment.dueDate} · 배점 {assignment.maxScore}점</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => {
                                  setExpandedAssignmentId(isExpanded ? null : assignment.id);
                                  setViewingEntry(null);
                                }}
                              >
                                {isExpanded ? '학생 목록 닫기' : `학생 제출 현황 (${submissionsForAssignment.length}/${courseStudents.length})`}
                              </button>
                              <button type="button" className="ghost-button" style={{ color: '#ef4444' }} onClick={() => onDeleteAssignment(assignment.id)}>
                                삭제
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                              {courseStudents.length === 0 ? (
                                <p className="muted-text" style={{ fontSize: '14px' }}>이 과목에 등록된 학생이 없습니다.</p>
                              ) : (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  {courseStudents.map((student) => {
                                    const submission = submissionsForAssignment.find((s) => s.studentName === student.displayName);
                                    const entryKey = `${assignment.id}-${student.username}`;
                                    const isViewing = viewingEntry === entryKey;
                                    const gradeDraft = submission ? (gradingState[submission.id] || {}) : {};
                                    return (
                                      <div key={student.username}>
                                        <div
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '10px 14px', borderRadius: '10px',
                                            background: isViewing ? '#f0f9ff' : '#f8fafc',
                                            cursor: submission ? 'pointer' : 'default',
                                            border: isViewing ? '1px solid #bae6fd' : '1px solid transparent',
                                          }}
                                          onClick={() => {
                                            if (!submission) return;
                                            setViewingEntry(isViewing ? null : entryKey);
                                          }}
                                        >
                                          <span style={{ fontSize: '16px' }}>{submission ? '✓' : '✗'}</span>
                                          <span style={{ fontWeight: 600, color: '#1f2a37', flex: 1 }}>{student.displayName}</span>
                                          {submission && (
                                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                              {submission.score != null ? `${submission.score}점` : '미채점'} · {submission.submittedAt}
                                            </span>
                                          )}
                                          {!submission && (
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>미제출</span>
                                          )}
                                        </div>

                                        {isViewing && submission && (
                                          <div style={{ margin: '8px 0 4px 0', padding: '16px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
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
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'settings' && (
            <SettingsPanel
              username={username}
              email={email}
              settingsName={settingsName}
              setSettingsName={setSettingsName}
              onSaveProfile={onSaveProfile}
              onLogout={onLogout}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onChangePassword={onChangePassword}
              actionLoading={actionLoading}
              deviceInfo={deviceInfo}
              deviceRequestCompleted={deviceRequestCompleted}
              onRequestDeviceChange={onRequestDeviceChange}
              passwordDescription="현재 Mattermost 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
              deviceDescription="현재 접속 중인 기기 정보를 확인하고, 새 기기로 인증을 바꿔야 할 때 변경 요청을 보낼 수 있습니다."
              showDeviceSection={false}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          )}
    </WorkspaceLayout>
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
  isDarkMode,
  toggleDarkMode,
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
    { key: 'offlineClasses', label: '오프라인 강의', description: '월별 일정과 배정 수업 확인' },
    { key: 'assignments', label: '과제', description: '과제 확인과 제출 준비' },
  ];
  const pageTitle = activeSection === 'videos' || activeSection === 'assignments' || activeSection === 'offlineClasses'
    ? `${selectedCourse?.name || '강의방'} ${menuItems.find((item) => item.key === activeSection)?.label || ''}`.trim()
    : menuItems.find((item) => item.key === activeSection)?.label;

  return (
    <WorkspaceLayout
      railNodes={courses}
      selectedRailId={selectedCourseId}
      onSelectRail={(courseId) => {
        setSelectedCourseId(courseId);
        if (activeSection !== 'attendance' && activeSection !== 'settings') {
          setActiveSection('videos');
        }
      }}
      sidebarKicker="Student Dashboard"
      sidebarTitle={selectedCourse?.name || '학습 홈'}
      sidebarSubtitle={academyName}
      menuItems={menuItems}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      selectedRoomDescription={selectedCourse?.description || '수강 중인 강의방을 선택하면 영상과 과제가 해당 강의 기준으로 정리됩니다.'}
      profileName={displayName || username}
      profileRoleLabel="학생 계정"
      onOpenSettings={() => setActiveSection('settings')}
      onLogout={onLogout}
      topbarKicker={activeSection === 'attendance' || activeSection === 'settings' ? '학습 공간' : selectedCourse?.name || '강의방'}
      topbarTitle={pageTitle}
      topbarBadge="학생이 가장 자주 쓰는 화면만 먼저 정리했습니다. 출석은 전체 기준으로, 영상과 과제는 선택한 강의방 기준으로 보입니다."
    >

          {infoMessage && <div className="login-alert">{infoMessage}</div>}

          {activeSection === 'attendance' && (
            <AttendanceSection
              actionLoading={actionLoading}
              onAttendance={onAttendance}
              contentLoading={contentLoading}
              attendanceMonth={attendanceMonth}
              onAttendanceMonthChange={onAttendanceMonthChange}
              records={records}
              AttendanceCalendar={AttendanceCalendar}
              LegendItem={LegendItem}
              translateAttendanceStatus={translateAttendanceStatus}
              filteredSchedules={filteredSchedules}
              translateDayOfWeek={translateDayOfWeek}
            />
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
                  <div className="info-card">
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{selectedVideo.courseName}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2a37', marginBottom: '10px' }}>{selectedVideo.title}</div>
                    <div style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '14px' }}>{selectedVideo.description}</div>
                    <div style={{ fontSize: '14px', color: '#475569', marginBottom: '18px' }}>
                      강사 {selectedVideo.teacherName} · 재생 시간 {selectedVideo.duration}
                    </div>
                    <div style={{ borderRadius: '18px', overflow: 'hidden', background: '#0f172a' }}>
                      <iframe
                        title={selectedVideo.title}
                        src={(() => {
                          const url = selectedVideo.videoUrl || '';
                          if (url.includes('/embed/')) return url;
                          const short = url.match(/youtu\.be\/([^?&]+)/);
                          if (short) return `https://www.youtube.com/embed/${short[1]}`;
                          const watch = url.match(/[?&]v=([^&]+)/);
                          if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
                          return url;
                        })()}
                        style={{ width: '100%', height: '420px', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div style={{ marginTop: '10px', textAlign: 'right' }}>
                      <a href={selectedVideo.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#6366f1' }}>YouTube에서 보기 ↗</a>
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
                      강사가 등록한 {selectedCourse?.name || '강의방'} 오프라인 수업 일정을 확인할 수 있습니다. 학생 배정은 학원 등록 시 관리자가 자동으로 설정합니다.
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
                  <>
                    <OfflineClassCalendar
                      year={offlineMonth.year}
                      month={offlineMonth.month}
                      offlineClasses={filteredOfflineClasses}
                      selectable={false}
                    />

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '18px 0 20px' }}>
                      <LegendItem color="#eef2ff" border="#c7d2fe" label="반복 수업" />
                      <LegendItem color="#fff7ed" border="#fdba74" label="개별 수정된 수업" />
                    </div>

                    <div style={{ display: 'grid', gap: '14px' }}>
                      {filteredOfflineClasses.map((offlineClass) => {
                        return (
                          <div key={offlineClass.id} className="info-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{offlineClass.courseName}</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2a37', marginBottom: '8px' }}>{offlineClass.title}</div>
                              </div>
                              <span className="status-pill" style={{ background: '#eef2ff', color: '#4338ca' }}>
                                관리자 자동 배정
                              </span>
                            </div>
                            <div style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '12px' }}>{offlineClass.description}</div>
                            <div style={{ display: 'grid', gap: '6px', color: '#475569', fontSize: '14px', marginBottom: '16px' }}>
                              <div>일정: {offlineClass.classDate} · {translateDayOfWeek(offlineClass.dayOfWeek)} · {offlineClass.startTime} - {offlineClass.endTime}</div>
                              <div>장소: {offlineClass.location}</div>
                              <div>강사: {offlineClass.teacherName} · 정원 {offlineClass.capacity}명</div>
                            </div>
                            <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#ffffff', border: '1px solid #dbe4f0', color: '#475569', lineHeight: 1.6 }}>
                              이 수업은 학생이 직접 신청하지 않으며, 학원 등록 시 관리자가 시간표에 맞춰 자동 배정합니다.
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
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
                  <div className="info-card">
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
            <SettingsPanel
              username={username}
              email={email}
              settingsName={settingsName}
              setSettingsName={setSettingsName}
              onSaveProfile={onSaveProfile}
              onLogout={onLogout}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onChangePassword={onChangePassword}
              actionLoading={actionLoading}
              deviceInfo={deviceInfo}
              deviceRequestCompleted={deviceRequestCompleted}
              onRequestDeviceChange={onRequestDeviceChange}
              passwordDescription="현재 Mattermost 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
              deviceDescription="현재 접속 중인 기기 정보를 확인하고, 새 기기로 인증을 바꿔야 할 때 변경 요청을 보낼 수 있습니다."
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          )}
    </WorkspaceLayout>
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

function OfflineClassCalendar({ year, month, offlineClasses, onEditOfflineClass, selectable = true }) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();
  const groupedByDate = offlineClasses.reduce((accumulator, item) => {
    const key = item.classDate;
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(<div key={`offline-blank-${index}`} style={{ minHeight: '120px' }} />);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const items = groupedByDate[dateKey] || [];
    cells.push(
      <div
        key={dateKey}
        style={{
          minHeight: '120px',
          borderRadius: '18px',
          border: '1px solid #dbe4f0',
          background: items.length > 0 ? '#f8fbff' : '#ffffff',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ fontWeight: 700, color: '#334155' }}>{day}</div>
        <div style={{ display: 'grid', gap: '6px' }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onEditOfflineClass?.(item)}
              disabled={!selectable}
              style={{
                textAlign: 'left',
                border: 'none',
                background: item.isOverride ? '#fff7ed' : '#eef2ff',
                color: item.isOverride ? '#c2410c' : '#4338ca',
                borderRadius: '12px',
                padding: '8px 10px',
                cursor: selectable ? 'pointer' : 'default',
                opacity: selectable ? 1 : 0.95,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{item.startTime}</div>
              <div style={{ fontSize: '12px', lineHeight: 1.4 }}>{item.title}</div>
            </button>
          ))}
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
  border: '1.5px solid #e2e8f0',
  fontSize: '15px',
  background: '#ffffff',
  color: '#1a1740',
  outline: 'none',
};


export default App;
