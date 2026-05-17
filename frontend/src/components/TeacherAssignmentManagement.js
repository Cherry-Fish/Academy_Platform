import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

function TeacherAssignmentManagement({ currentRoom = null }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'submissions'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  
  // 과제 등록 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    courseName: '',
    description: '',
    dueDate: '',
    maxScore: 100
  });

  // 채점 폼 데이터
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: ''
  });

  useEffect(() => {
    fetchAssignments();
    fetchAllSubmissions();
  }, []);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchAllSubmissions();
    }
  }, [activeTab, selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      const response = await api.getAssignments();
      setAssignments(response.data);
    } catch (err) {
      console.error('과제 조회 실패:', err);
    }
  };

  const fetchAllSubmissions = async () => {
    setSubmissionError(null);
    try {
      const assignmentId = selectedAssignment?.id;
      const response = await api.getAllSubmissions(assignmentId);
      setSubmissions(response.data);
    } catch (err) {
      console.error('제출물 조회 실패:', err);
      setSubmissionError('제출물을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGradeInputChange = (e) => {
    const { name, value } = e.target;
    setGradeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.dueDate) {
      alert('제목, 설명, 마감일은 필수입니다.');
      return;
    }

    setLoading(true);
    try {
      await api.createAssignment(formData);
      alert('과제가 등록되었습니다.');
      
      // 폼 초기화
      setFormData({
        title: '',
        courseId: '',
        courseName: '',
        description: '',
        dueDate: '',
        maxScore: 100
      });
      
      setShowAddModal(false);
      fetchAssignments();
    } catch (err) {
      alert('과제 등록 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId, assignmentTitle) => {
    if (!window.confirm(`"${assignmentTitle}" 과제를 삭제하시겠습니까?\n관련된 모든 제출물도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await api.deleteAssignment(assignmentId);
      alert('과제가 삭제되었습니다.');
      fetchAssignments();
    } catch (err) {
      alert('과제 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score || '',
      feedback: submission.feedback || ''
    });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();

    if (gradeData.score === '' || gradeData.score < 0) {
      alert('점수를 입력해주세요.');
      return;
    }

    if (!window.confirm('채점을 완료하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await api.gradeSubmission(selectedSubmission.id, gradeData);
      alert('채점이 완료되었습니다.');
      
      setShowGradeModal(false);
      setSelectedSubmission(null);
      fetchAllSubmissions();
    } catch (err) {
      alert('채점 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 과제별 제출 통계
  const getSubmissionStats = (assignmentId) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
    const totalSubmitted = assignmentSubmissions.length;
    const graded = assignmentSubmissions.filter(s => s.score !== null).length;
    const avgScore = graded > 0
      ? Math.floor(assignmentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / graded)
      : 0;

    return { totalSubmitted, graded, avgScore };
  };

  const roomCourseId = mapRoomToCourseId(currentRoom);
  const filteredAssignments = roomCourseId
    ? assignments.filter((assignment) => assignment.courseId === roomCourseId)
    : assignments;

  return (
    <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>📝 과제 관리</h2>
          {currentRoom && <p style={{ margin: '8px 0 0', color: '#6c757d' }}>현재 강의방: <strong>{currentRoom.name}</strong></p>}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          + 과제 등록
        </button>
      </div>

      {/* 탭 메뉴 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        borderBottom: '2px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '15px 30px',
            backgroundColor: activeTab === 'list' ? '#007bff' : 'transparent',
            color: activeTab === 'list' ? 'white' : '#6c757d',
            border: 'none',
            borderBottom: activeTab === 'list' ? '3px solid #007bff' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          과제 목록 ({filteredAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          style={{
            padding: '15px 30px',
            backgroundColor: activeTab === 'submissions' ? '#007bff' : 'transparent',
            color: activeTab === 'submissions' ? 'white' : '#6c757d',
            border: 'none',
            borderBottom: activeTab === 'submissions' ? '3px solid #007bff' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          제출물 관리
        </button>
      </div>

      {/* 과제 목록 탭 */}
      {activeTab === 'list' && (
        <div>
          {filteredAssignments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>등록된 과제가 없습니다.</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>상단의 "+ 과제 등록" 버튼을 눌러 과제를 추가하세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredAssignments.map(assignment => {
                const stats = getSubmissionStats(assignment.id);
                const dueDate = new Date(assignment.dueDate);
                const isOverdue = dueDate < new Date();
                
                return (
                  <div
                    key={assignment.id}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      padding: '20px',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
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

                        {isOverdue && (
                          <span style={{
                            marginLeft: '10px',
                            padding: '4px 10px',
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            마감
                          </span>
                        )}

                        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                          {assignment.title}
                        </h3>

                        <p style={{
                          margin: '0 0 10px 0',
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

                        <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>
                          <span>📅 마감: {dueDate.toLocaleString('ko-KR')}</span>
                          <span style={{ margin: '0 10px' }}>|</span>
                          <span>💯 배점: {assignment.maxScore}점</span>
                        </div>

                        {/* 제출 통계 */}
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          padding: '10px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '5px',
                          fontSize: '14px'
                        }}>
                          <div>
                            <span style={{ color: '#6c757d' }}>제출: </span>
                            <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                              {stats.totalSubmitted}명
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#6c757d' }}>채점 완료: </span>
                            <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                              {stats.graded}명
                            </span>
                          </div>
                          {stats.graded > 0 && (
                            <div>
                              <span style={{ color: '#6c757d' }}>평균 점수: </span>
                              <span style={{ fontWeight: 'bold', color: '#ffc107' }}>
                                {stats.avgScore}점
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 버튼들 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setActiveTab('submissions');
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          제출물 보기
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id, assignment.title)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 제출물 관리 탭 */}
      {activeTab === 'submissions' && (
        <div>
          {/* 과제 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              과제 선택:
            </label>
            <select
              value={selectedAssignment?.id || ''}
              onChange={(e) => {
                const assignment = assignments.find(a => a.id === e.target.value);
                setSelectedAssignment(assignment || null);
              }}
              style={{
                padding: '10px 15px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #dee2e6',
                minWidth: '300px'
              }}
            >
              <option value="">전체 과제</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>

          {submissionError ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8d7da',
              borderRadius: '10px',
              color: '#721c24'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>{submissionError}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>제출된 과제가 없습니다.</p>
            </div>
          ) : (
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
                    <th style={{ padding: '15px', textAlign: 'left' }}>과제명</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>제출 시간</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>점수</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>상태</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => {
                    const assignment = assignments.find(a => a.id === submission.assignmentId);
                    
                    return (
                      <tr 
                        key={index}
                        style={{
                          borderBottom: '1px solid #dee2e6',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                        }}
                      >
                        <td style={{ padding: '15px' }}>{submission.studentName}</td>
                        <td style={{ padding: '15px' }}>{assignment?.title || '삭제된 과제'}</td>
                        <td style={{ padding: '15px', textAlign: 'center', fontSize: '14px' }}>
                          {new Date(submission.submittedAt).toLocaleString('ko-KR')}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {submission.score !== null ? (
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#28a745' }}>
                              {submission.score}점
                            </span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            padding: '5px 15px',
                            borderRadius: '20px',
                            backgroundColor: submission.score !== null ? '#d4edda' : '#fff3cd',
                            color: submission.score !== null ? '#155724' : '#856404',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {submission.score !== null ? '✓ 채점완료' : '⏳ 대기중'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <button
                            onClick={() => openGradeModal(submission)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: submission.score !== null ? '#6c757d' : '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            {submission.score !== null ? '수정' : '채점하기'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 과제 등록 모달 */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>📝 새 과제 등록</h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  과제 제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="예: React 컴포넌트 만들기"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    과정 ID
                  </label>
                  <input
                    type="text"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    placeholder="예: REACT101"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    과정명
                  </label>
                  <input
                    type="text"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    placeholder="예: React 웹 개발"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  과제 설명 *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="과제에 대한 설명을 입력하세요"
                  required
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    마감일 *
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    배점
                  </label>
                  <input
                    type="number"
                    name="maxScore"
                    value={formData.maxScore}
                    onChange={handleInputChange}
                    min="0"
                    max="1000"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {loading ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 채점 모달 */}
      {showGradeModal && selectedSubmission && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>
              ✏️ 채점하기 - {selectedSubmission.studentName}
            </h3>
            
            {/* 제출 내용 */}
            <div style={{
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>제출 내용:</h4>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {selectedSubmission.content}
              </pre>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                제출 시간: {new Date(selectedSubmission.submittedAt).toLocaleString('ko-KR')}
              </div>
            </div>

            <form onSubmit={handleGradeSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  점수 *
                </label>
                <input
                  type="number"
                  name="score"
                  value={gradeData.score}
                  onChange={handleGradeInputChange}
                  min="0"
                  max={assignments.find(a => a.id === selectedSubmission.assignmentId)?.maxScore || 100}
                  required
                  style={{
                    width: '200px',
                    padding: '10px',
                    fontSize: '18px',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px'
                  }}
                />
                <span style={{ marginLeft: '10px', fontSize: '16px', color: '#6c757d' }}>
                  / {assignments.find(a => a.id === selectedSubmission.assignmentId)?.maxScore || 100}점
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  피드백
                </label>
                <textarea
                  name="feedback"
                  value={gradeData.feedback}
                  onChange={handleGradeInputChange}
                  placeholder="학생에게 전달할 피드백을 입력하세요 (선택사항)"
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowGradeModal(false);
                    setSelectedSubmission(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {loading ? '채점 중...' : '채점 완료'}
                </button>
              </div>
            </form>
      </div>
    </div>
  )}
</div>
);
}

export default TeacherAssignmentManagement;

function mapRoomToCourseId(room) {
  if (!room?.id) return null;
  if (room.id.includes('web')) return 'course-web';
  if (room.id.includes('java')) return 'course-java';
  if (room.id.includes('db')) return 'course-db';
  return null;
}
