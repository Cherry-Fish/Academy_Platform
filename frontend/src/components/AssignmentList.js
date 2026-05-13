//과제 제출 기능
import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

function AssignmentList({ onSelectAssignment, currentRoom = null }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.getAssignments(),
        api.getMySubmissions()
      ]);
      
      setAssignments(assignmentsRes.data);
      setSubmissions(submissionsRes.data);
    } catch (err) {
      console.error('데이터 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(s => s.assignmentId === assignmentId);
    
    if (!submission) {
      return { status: 'not_submitted', label: '미제출', color: '#dc3545' };
    }
    
    if (submission.score !== null) {
      return { status: 'graded', label: `채점완료 (${submission.score}점)`, color: '#28a745' };
    }
    
    return { status: 'submitted', label: '제출완료', color: '#007bff' };
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const roomCourseId = mapRoomToCourseId(currentRoom);
  const filteredAssignments = roomCourseId
    ? assignments.filter((assignment) => assignment.courseId === roomCourseId)
    : assignments;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '20px' }}>
      <h2>📝 과제</h2>
      {currentRoom && (
        <p style={{ marginTop: '-6px', marginBottom: '24px', color: '#6c757d' }}>
          현재 강의방: <strong>{currentRoom.name}</strong>
        </p>
      )}

      {filteredAssignments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          color: '#6c757d'
        }}>
          <p style={{ fontSize: '18px', margin: 0 }}>등록된 과제가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredAssignments.map(assignment => {
            const submissionStatus = getSubmissionStatus(assignment.id);
            const overdue = isOverdue(assignment.dueDate);
            const dueDate = new Date(assignment.dueDate);

            return (
              <div
                key={assignment.id}
                onClick={() => onSelectAssignment(assignment.id)}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '12px',
                      fontSize: '12px',
                      marginBottom: '8px'
                    }}>
                      {assignment.courseName}
                    </div>

                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
                      {assignment.title}
                    </h3>

                    <p style={{
                      margin: '0 0 15px 0',
                      fontSize: '14px',
                      color: '#6c757d',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {assignment.description}
                    </p>

                    <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#6c757d' }}>
                      <span>👨‍🏫 {assignment.teacherName}</span>
                      <span>📅 마감: {dueDate.toLocaleString('ko-KR')}</span>
                      <span>💯 배점: {assignment.maxScore}점</span>
                    </div>
                  </div>

                  <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                    {/* 제출 상태 */}
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      backgroundColor: submissionStatus.status === 'not_submitted' ? '#f8d7da' : 
                                       submissionStatus.status === 'graded' ? '#d4edda' : '#d1ecf1',
                      color: submissionStatus.color,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {submissionStatus.label}
                    </span>

                    {/* 마감 여부 */}
                    {overdue && submissionStatus.status === 'not_submitted' && (
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ 마감
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssignmentList;

function mapRoomToCourseId(room) {
  if (!room?.id) return null;
  if (room.id.includes('web')) return 'course-web';
  if (room.id.includes('java')) return 'course-java';
  if (room.id.includes('db')) return 'course-db';
  return null;
}
