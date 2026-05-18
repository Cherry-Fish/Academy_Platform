import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

function AssignmentDetail({ assignmentId, onBack }) {
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      const [assignmentRes, submissionRes] = await Promise.all([
        api.getAssignmentById(assignmentId),
        api.getMySubmission(assignmentId)
      ]);

      console.log('=== 과제 상세 데이터 ===');
      console.log('assignment:', assignmentRes.data);
      console.log('submission:', submissionRes.data);
    
      setAssignment(assignmentRes.data);
      setSubmission(submissionRes.data);
    
      // 기존 제출물이 있으면 내용 불러오기
      if (submissionRes.data) {
        console.log('기존 제출물 있음:', submissionRes.data);
        setContent(submissionRes.data.content);
      } else {
        console.log('제출물 없음 - 새로 작성 가능');
      }
    } catch (err) {
      console.error('데이터 조회 실패:', err);
      alert('과제를 불러올 수 없습니다.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('제출 내용을 입력해주세요.');
      return;
    }

    if (!window.confirm(submission ? '과제를 재제출하시겠습니까?' : '과제를 제출하시겠습니까?')) {
      return;
    }

    setSubmitting(true);
    try {
      await api.submitAssignment(assignmentId, { content });
      alert('과제가 제출되었습니다!');
      
      // 데이터 새로고침
      fetchData();
    } catch (err) {
      alert('제출 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const canSubmit = () => {
    console.log('=== canSubmit 체크 ===');
    console.log('submission:', submission);
    console.log('submission?.score:', submission?.score);
    console.log('dueDate:', assignment?.dueDate);
    console.log('isOverdue:', isOverdue(assignment?.dueDate));
  
    const result = (submission?.score === null || submission?.score === undefined) && !isOverdue(assignment?.dueDate);
    console.log('최종 결과 (제출 가능?):', result);
  
    return result;
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1000px', 
        margin: '50px auto', 
        padding: '20px',
        textAlign: 'center' 
      }}>
        로딩 중...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div style={{ 
        maxWidth: '1000px', 
        margin: '50px auto', 
        padding: '20px',
        textAlign: 'center' 
      }}>
        과제를 찾을 수 없습니다.
      </div>
    );
  }

  const dueDate = new Date(assignment.dueDate);
  const overdue = isOverdue(assignment.dueDate);

  return (
    <div style={{ maxWidth: '1000px', margin: '50px auto', padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← 목록으로 돌아가기
      </button>

      {/* 과제 정보 */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '5px 12px',
          backgroundColor: '#e9ecef',
          borderRadius: '15px',
          fontSize: '12px',
          color: '#495057',
          marginBottom: '10px'
        }}>
          {assignment.courseName}
        </div>

        <h2 style={{ margin: '10px 0 20px 0', fontSize: '28px' }}>
          {assignment.title}
        </h2>

        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '14px',
          color: '#6c757d',
          marginBottom: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid #dee2e6'
        }}>
          <span>👨‍🏫 {assignment.teacherName}</span>
          <span>📅 마감일: {dueDate.toLocaleString('ko-KR')}</span>
          <span>💯 배점: {assignment.maxScore}점</span>
        </div>

        {/* 마감 경고 */}
        {overdue && !submission?.score && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '5px',
            color: '#856404',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            ⚠️ 이 과제는 마감되었습니다.
          </div>
        )}

        <div style={{
          fontSize: '15px',
          lineHeight: '1.8',
          color: '#495057',
          whiteSpace: 'pre-line'
        }}>
          {assignment.description}
        </div>
      </div>

      {/* 제출 현황 */}
      {submission && (
        <div style={{
          backgroundColor: submission.score !== null ? '#d4edda' : '#d1ecf1',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: `1px solid ${submission.score !== null ? '#c3e6cb' : '#bee5eb'}`
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '18px',
            color: submission.score !== null ? '#155724' : '#0c5460'
          }}>
            {submission.score !== null ? '✓ 채점 완료' : '✓ 제출 완료'}
          </h3>

          <div style={{ fontSize: '14px', color: '#495057', marginBottom: '10px' }}>
            <strong>제출 시간:</strong> {new Date(submission.submittedAt).toLocaleString('ko-KR')}
          </div>

          {submission.score !== null && (
            <>
              <div style={{ fontSize: '14px', color: '#495057', marginBottom: '10px' }}>
                <strong>점수:</strong> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                  {submission.score}점
                </span> / {assignment.maxScore}점
              </div>

              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '1px solid #dee2e6'
              }}>
                <strong style={{ display: 'block', marginBottom: '10px', color: '#495057' }}>
                  강사 피드백:
                </strong>
                <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-line', color: submission.feedback ? '#212529' : '#adb5bd', fontStyle: submission.feedback ? 'normal' : 'italic' }}>
                  {submission.feedback || '(피드백 없음)'}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                채점 시간: {new Date(submission.gradedAt).toLocaleString('ko-KR')}
              </div>
            </>
          )}
        </div>
      )}

      {/* 제출 폼 */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
          {submission?.score ? '제출 내용 (채점 완료)' : submission ? '과제 재제출' : '과제 제출'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              제출 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submission && submission.score !== null}
              placeholder="과제 내용을 작성하세요..."
              rows="15"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '5px',
                resize: 'vertical',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                backgroundColor: submission?.score !== null ? '#f8f9fa' : 'white'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '12px' }}>
              코드를 작성할 경우 들여쓰기를 유지하세요.
            </small>
          </div>

          {/* 디버깅용 */}
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            marginBottom: '10px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div>submission: {JSON.stringify(submission)}</div>
            <div>submission?.score: {submission?.score}</div>
            <div>overdue: {overdue ? 'true' : 'false'}</div>
            <div>canSubmit(): {canSubmit() ? 'true' : 'false'}</div>
          </div>

          {canSubmit() && (
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: submitting || !content.trim() ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {submitting ? '제출 중...' : submission ? '재제출하기' : '제출하기'}
            </button>
          )}

          {submission && submission.score !== null && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e9ecef',
              borderRadius: '5px',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '14px'
            }}>
              채점이 완료된 과제는 수정할 수 없습니다.
            </div>
          )}

          {overdue && !submission && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8d7da',
              borderRadius: '5px',
              textAlign: 'center',
              color: '#721c24',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              마감된 과제는 제출할 수 없습니다.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default AssignmentDetail;