import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import TeacherVideoManagement from './TeacherVideoManagement';
import TeacherAssignmentManagement from './TeacherAssignmentManagement';

function TeacherDashboard({ activeTab = 'attendance-session', currentRoom = null }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  // 출석 세션 & 스케줄 상태
  const [session, setSession] = useState({ isOpen: false, openedAt: null, closeAt: null });
  const [schedule, setSchedule] = useState({ startTime: '', durationMinutes: 10, enabled: false });
  const [scheduleForm, setScheduleForm] = useState({ startTime: '', durationMinutes: 10, enabled: false });
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'attendance-session') {
      fetchSession();
      pollRef.current = setInterval(fetchSession, 5000);
    } else {
      clearInterval(pollRef.current);
      if (activeTab === 'requests') fetchPendingRequests();
      else if (activeTab === 'records') fetchAllAttendanceRecords();
    }
    return () => clearInterval(pollRef.current);
  }, [activeTab]);

  // 카운트다운 타이머
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (session.isOpen && session.closeAt) {
      const tick = () => {
        const diff = Math.floor((new Date(session.closeAt) - new Date()) / 1000);
        if (diff <= 0) {
          setRemainingSeconds(0);
          setSession(prev => ({ ...prev, isOpen: false }));
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
      setScheduleForm(res.data.schedule);
    } catch (err) {
      console.error('세션 조회 실패:', err);
    }
  };

  const handleSaveSchedule = async () => {
    if (scheduleForm.enabled && !scheduleForm.startTime) {
      setScheduleMsg('시작 시간을 입력해주세요.');
      return;
    }
    setSessionLoading(true);
    try {
      const res = await api.saveAttendanceSchedule(scheduleForm);
      setSchedule(res.data.schedule);
      setSession(prev => prev); // 세션 갱신 트리거
      await fetchSession();
      setScheduleMsg('저장되었습니다.');
      setTimeout(() => setScheduleMsg(''), 2500);
    } catch (err) {
      setScheduleMsg('저장 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setSessionLoading(false);
    }
  };

  const handleManualOpen = async () => {
    setSessionLoading(true);
    try {
      const res = await api.openAttendanceSession(scheduleForm.durationMinutes || 10);
      setSession(res.data.session);
    } catch (err) {
      alert('오류: ' + (err.response?.data?.message || err.message));
    } finally {
      setSessionLoading(false);
    }
  };

  const handleManualClose = async () => {
    if (!window.confirm('출석을 지금 닫겠습니까?')) return;
    setSessionLoading(true);
    try {
      await api.closeAttendanceSession();
      setSession(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      alert('오류: ' + (err.response?.data?.message || err.message));
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.getPendingRequests();
      setPendingRequests(response.data);
    } catch (err) {
      console.error('승인 대기 목록 조회 실패:', err);
    }
  };

  const fetchAllAttendanceRecords = async () => {
    try {
      const response = await api.getAllAttendanceRecords();
      setAttendanceRecords(response.data);
    } catch (err) {
      console.error('출석 기록 조회 실패:', err);
    }
  };

  const handleApprove = async (requestId, studentName) => {
    if (!window.confirm(`${studentName} 학생의 기기 변경을 승인하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.approveDeviceChange(requestId);
      alert('승인이 완료되었습니다.');
      fetchPendingRequests();
    } catch (err) {
      alert('승인 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId, studentName) => {
    if (!window.confirm(`${studentName} 학생의 기기 변경을 거절하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.rejectDeviceChange(requestId);
      alert('거절되었습니다.');
      fetchPendingRequests();
    } catch (err) {
      alert('거절 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', padding: '20px' }}>
      <h2>👨‍🏫 강사 관리 대시보드</h2>

      {/* 출석 세션 관리 탭 */}
      {activeTab === 'attendance-session' && (
        <div>
          <h3>⏱️ 출석 세션 관리</h3>

          {/* ── 현재 상태 ── */}
          <div style={{
            padding: '24px', borderRadius: '12px', marginBottom: '28px', textAlign: 'center',
            backgroundColor: session.isOpen ? '#d4edda' : '#f8f9fa',
            border: `2px solid ${session.isOpen ? '#28a745' : '#dee2e6'}`,
          }}>
            <div style={{ fontSize: '44px', marginBottom: '6px' }}>{session.isOpen ? '🟢' : '🔴'}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: session.isOpen ? '#155724' : '#6c757d' }}>
              {session.isOpen ? '출석 진행 중' : '출석 닫힘'}
            </div>
            {session.isOpen && remainingSeconds !== null && (
              <div style={{
                fontSize: '40px', fontWeight: 'bold', marginTop: '10px',
                fontVariantNumeric: 'tabular-nums', letterSpacing: '2px',
                color: remainingSeconds <= 60 ? '#dc3545' : '#155724',
              }}>
                {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}
                <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: 'normal', marginLeft: '8px' }}>남음</span>
              </div>
            )}
            {session.isOpen && (
              <div style={{ fontSize: '13px', color: '#155724', marginTop: '6px' }}>
                {new Date(session.openedAt).toLocaleTimeString('ko-KR')} ~{' '}
                {new Date(session.closeAt).toLocaleTimeString('ko-KR')}
              </div>
            )}
          </div>

          {/* ── 자동 스케줄 설정 ── */}
          <div style={{ padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>🔁 자동 스케줄 (매일 반복)</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                <input
                  type="checkbox"
                  checked={scheduleForm.enabled}
                  onChange={e => setScheduleForm(prev => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                {scheduleForm.enabled ? '활성화' : '활성화'}
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>시작 시간</label>
                <input
                  type="time"
                  value={scheduleForm.startTime || ''}
                  onChange={e => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                  style={{ padding: '8px 10px', fontSize: '15px', border: '1px solid #ced4da', borderRadius: '5px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>출석 시간</label>
                <input
                  type="number"
                  min="1" max="120"
                  value={scheduleForm.durationMinutes}
                  onChange={e => setScheduleForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                  style={{ width: '70px', padding: '8px', fontSize: '15px', border: '1px solid #ced4da', borderRadius: '5px', textAlign: 'center' }}
                />
                <span style={{ color: '#6c757d' }}>분</span>
              </div>
              <button
                onClick={handleSaveSchedule}
                disabled={sessionLoading}
                style={{
                  padding: '9px 22px', backgroundColor: '#007bff', color: 'white',
                  border: 'none', borderRadius: '6px', fontWeight: 'bold',
                  fontSize: '14px', cursor: sessionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                💾 저장
              </button>
            </div>

            {scheduleMsg && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: scheduleMsg.includes('실패') ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                {scheduleMsg}
              </div>
            )}

            {schedule.enabled && schedule.startTime && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#6c757d', backgroundColor: '#e9ecef', padding: '8px 12px', borderRadius: '6px' }}>
                📅 매일 <strong>{schedule.startTime}</strong> 에 자동으로 열리고,{' '}
                <strong>{schedule.durationMinutes}분</strong> 후 자동 종료됩니다.
              </div>
            )}
          </div>

          {/* ── 수동 제어 ── */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleManualOpen}
              disabled={sessionLoading || session.isOpen}
              style={{
                flex: 1, padding: '12px', backgroundColor: session.isOpen ? '#6c757d' : '#28a745',
                color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold',
                fontSize: '15px', cursor: sessionLoading || session.isOpen ? 'not-allowed' : 'pointer',
                opacity: session.isOpen ? 0.5 : 1,
              }}
            >
              ✅ 지금 바로 열기
            </button>
            <button
              onClick={handleManualClose}
              disabled={sessionLoading || !session.isOpen}
              style={{
                flex: 1, padding: '12px', backgroundColor: !session.isOpen ? '#6c757d' : '#dc3545',
                color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold',
                fontSize: '15px', cursor: sessionLoading || !session.isOpen ? 'not-allowed' : 'pointer',
                opacity: !session.isOpen ? 0.5 : 1,
              }}
            >
              🔒 지금 바로 닫기
            </button>
          </div>
          <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '8px' }}>
            * 수동 제어는 스케줄과 무관하게 즉시 적용됩니다.
          </p>
        </div>
      )}

      {/* 기기 변경 승인 탭 */}
      {activeTab === 'requests' && (
        <div>
          <h3>📱 기기 변경 승인 대기</h3>
          
          {pendingRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>승인 대기 중인 요청이 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '10px',
                    padding: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                        {request.studentName} ({request.studentId})
                      </h4>
                      <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                        <div>📅 요청 시간: {new Date(request.requestTime).toLocaleString('ko-KR')}</div>
                        <div>📧 이메일: {request.email}</div>
                      </div>
                      
                      <details style={{ marginTop: '15px' }}>
                        <summary style={{ 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          color: '#007bff',
                          fontSize: '14px'
                        }}>
                          기존 기기 정보 보기
                        </summary>
                        <pre style={{
                          marginTop: '10px',
                          padding: '10px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '5px',
                          fontSize: '12px',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {JSON.stringify(request.currentDeviceInfo, null, 2)}
                        </pre>
                      </details>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                      <button
                        onClick={() => handleApprove(request.id, request.studentName)}
                        disabled={loading}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}
                      >
                        ✓ 승인
                      </button>
                      <button
                        onClick={() => handleReject(request.id, request.studentName)}
                        disabled={loading}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}
                      >
                        ✗ 거절
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 전체 출석 현황 탭 */}
      {activeTab === 'records' && (
        <div>
          <h3>📊 전체 학생 출석 현황</h3>
          
          {attendanceRecords.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>출석 기록이 없습니다.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>학생명</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>학번</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>출석 시간</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>상태</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>기기 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record, index) => (
                      <tr 
                        key={index}
                        style={{
                          borderBottom: '1px solid #dee2e6',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                        }}
                      >
                        <td style={{ padding: '15px' }}>{record.studentName}</td>
                        <td style={{ padding: '15px' }}>{record.studentId}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {new Date(record.timestamp).toLocaleString('ko-KR')}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            padding: '5px 15px',
                            borderRadius: '20px',
                            backgroundColor: record.status === 'success' ? '#d4edda' : '#f8d7da',
                            color: record.status === 'success' ? '#155724' : '#721c24',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {record.status === 'success' ? '✓ 출석' : '✗ 실패'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            padding: '5px 15px',
                            borderRadius: '20px',
                            backgroundColor: record.isNewDevice ? '#fff3cd' : '#d1ecf1',
                            color: record.isNewDevice ? '#856404' : '#0c5460',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {record.isNewDevice ? '🆕 신규등록' : '✓ 등록기기'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: '30px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#d4edda',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#155724' }}>
                    {attendanceRecords.filter(r => r.status === 'success').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#155724', marginTop: '5px' }}>
                    총 출석 완료
                  </div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#721c24' }}>
                    {attendanceRecords.filter(r => r.status !== 'success').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#721c24', marginTop: '5px' }}>
                    출석 실패
                  </div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>
                    {attendanceRecords.filter(r => r.isNewDevice).length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404', marginTop: '5px' }}>
                    신규 기기 등록
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 강의 영상 관리 탭 */}
      {activeTab === 'videos' && (
        <TeacherVideoManagement currentRoom={currentRoom} />
      )}

      {/* 과제 관리 탭 */}
      {activeTab === 'assignments' && (
        <TeacherAssignmentManagement currentRoom={currentRoom} />
      )}
    </div>
  );
}

export default TeacherDashboard;
