import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import { getDeviceInfo } from '../utils/deviceInfo';
import VideoList from './VideoList';
import VideoPlayer from './VideoPlayer';
import AssignmentList from './AssignmentList';
import AssignmentDetail from './AssignmentDetail';

function StudentDashboard({ activeTab = 'attendance', currentRoom = null }) {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  // 출석 세션 상태
  const [session, setSession] = useState({ isOpen: false, openedAt: null, closeAt: null });
  const [schedule, setSchedule] = useState({ startTime: null, durationMinutes: 10, enabled: false });
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceHistory();
      fetchSession();
      pollRef.current = setInterval(fetchSession, 10000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [activeTab]);

  // 카운트다운
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (session.isOpen && session.closeAt) {
      setSessionExpired(false);
      const tick = () => {
        const diff = Math.floor((new Date(session.closeAt) - new Date()) / 1000);
        if (diff <= 0) {
          setRemainingSeconds(0);
          setSession(prev => ({ ...prev, isOpen: false }));
          setSessionExpired(true);
          clearInterval(timerRef.current);
        } else {
          setRemainingSeconds(diff);
        }
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      setRemainingSeconds(null);
    }
    return () => clearInterval(timerRef.current);
  }, [session.isOpen, session.closeAt]);

  const fetchSession = async () => {
    try {
      const res = await api.getAttendanceSession();
      setSession(res.data.session);
      setSchedule(res.data.schedule);
    } catch (err) {
      console.error('세션 조회 실패:', err);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await api.getAttendanceHistory();
      setHistory(response.data);
    } catch (err) {
      console.error('출석 이력 조회 실패:', err);
    }
  };

  const handleAttendance = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const deviceInfo = getDeviceInfo();
      const response = await api.checkAttendance(deviceInfo);
      
      setAttendanceStatus('success');
      setMessage(response.data.message || '출석이 완료되었습니다!');
      fetchAttendanceHistory();
      
    } catch (err) {
      setAttendanceStatus('error');
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('출석 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceChangeRequest = async () => {
    if (!window.confirm('기기 변경을 요청하시겠습니까? 강사 승인이 필요합니다.')) {
      return;
    }

    try {
      await api.requestDeviceChange();
      alert('기기 변경 요청이 전송되었습니다. 강사 승인을 기다려주세요.');
    } catch (err) {
      alert('기기 변경 요청 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSelectVideo = (videoId) => {
    setSelectedVideoId(videoId);
  };

  const handleBackToVideoList = () => {
    setSelectedVideoId(null);
  };

  const handleSelectAssignment = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleBackToAssignmentList = () => {
    setSelectedAssignmentId(null);
  };

  // 영상 재생 중일 때
  if (selectedVideoId) {
    return <VideoPlayer videoId={selectedVideoId} onBack={handleBackToVideoList} />;
  }

  // 과제 상세 보기 중일 때
  if (selectedAssignmentId) {
    return <AssignmentDetail assignmentId={selectedAssignmentId} onBack={handleBackToAssignmentList} />;
  }

  return (
    <div style={{ maxWidth: '1000px', padding: '20px' }}>
      {/* 출석 관리 탭 */}
      {activeTab === 'attendance' && (
        <div>
          <h2>📚 학생 출석 시스템</h2>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            {/* 세션 상태 + 스케줄 안내 */}
            <div style={{
              display: 'inline-block', marginBottom: '12px',
              padding: '7px 20px', borderRadius: '20px',
              backgroundColor: session.isOpen ? '#d4edda' : '#f8d7da',
              color: session.isOpen ? '#155724' : '#721c24',
              fontWeight: 'bold', fontSize: '14px',
            }}>
              {session.isOpen
                ? '🟢 출석 가능'
                : sessionExpired
                  ? '🔴 출석 시간이 종료되었습니다'
                  : '🔴 출석 불가'}
            </div>

            {/* 스케줄 안내 (출석 닫힌 상태에서만) */}
            {!session.isOpen && schedule.enabled && schedule.startTime && (
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '14px' }}>
                다음 출석 시간: 매일 <strong>{schedule.startTime}</strong>{' '}
                ({schedule.durationMinutes}분간)
              </div>
            )}

            {/* 카운트다운 */}
            {session.isOpen && remainingSeconds !== null && (
              <div style={{
                fontSize: '30px', fontWeight: 'bold', marginBottom: '14px',
                fontVariantNumeric: 'tabular-nums', letterSpacing: '2px',
                color: remainingSeconds <= 60 ? '#dc3545' : '#28a745',
              }}>
                {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')} {/*???*/}
                <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: 'normal', marginLeft: '8px' }}>남음</span>
              </div>
            )}

            <button
              onClick={handleAttendance}
              disabled={loading || !session.isOpen}
              style={{
                width: '200px', height: '200px', borderRadius: '50%',
                fontSize: '24px', fontWeight: 'bold',
                backgroundColor: loading || !session.isOpen ? '#6c757d' : '#28a745',
                color: 'white', border: 'none',
                cursor: loading || !session.isOpen ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                opacity: !session.isOpen ? 0.55 : 1,
              }}
              onMouseOver={(e) => { if (!loading && session.isOpen) e.target.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              {loading ? '처리중...' : '출석하기'}
            </button>

            {message && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: attendanceStatus === 'success' ? '#d4edda' : '#f8d7da',
                color: attendanceStatus === 'success' ? '#155724' : '#721c24',
                fontWeight: 'bold'
              }}>
                {message}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <button
              onClick={handleDeviceChangeRequest}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📱 기기 변경 요청
            </button>
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              다른 기기에서 출석하려면 기기 변경을 요청하세요
            </p>
          </div>

          <div>
            <h3>📋 나의 출석 이력</h3>
            {history.length === 0 ? (
              <p style={{ color: '#6c757d', textAlign: 'center' }}>출석 이력이 없습니다.</p>
            ) : (
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                border: '1px solid #dee2e6',
                borderRadius: '5px'
              }}>
                {history.map((record, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '15px',
                      borderBottom: index < history.length - 1 ? '1px solid #dee2e6' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {new Date(record.timestamp).toLocaleDateString('ko-KR')}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {new Date(record.timestamp).toLocaleTimeString('ko-KR')}
                      </div>
                    </div>
                    <div style={{
                      padding: '5px 15px',
                      borderRadius: '20px',
                      backgroundColor: record.status === 'success' ? '#d4edda' : '#f8d7da',
                      color: record.status === 'success' ? '#155724' : '#721c24',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {record.status === 'success' ? '✓ 출석' : '✗ 실패'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                현재 기기 정보 보기
              </summary>
              <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(getDeviceInfo(), null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* 강의 영상 탭 */}
      {activeTab === 'videos' && (
        <VideoList onSelectVideo={handleSelectVideo} currentRoom={currentRoom} />
      )}

      {/* 과제 탭 */}
      {activeTab === 'assignments' && (
        <AssignmentList onSelectAssignment={handleSelectAssignment} currentRoom={currentRoom} />
      )}
    </div>
  );
}

export default StudentDashboard;
