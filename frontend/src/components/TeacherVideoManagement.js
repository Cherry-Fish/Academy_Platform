import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

function TeacherVideoManagement({ currentRoom = null }) {
  const [videos, setVideos] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'stats'
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 영상 등록 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    courseName: '',
    videoUrl: '',
    duration: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [videosRes, historyRes] = await Promise.all([
        api.getVideos(),
        api.getAllWatchHistory()
      ]);
      
      setVideos(videosRes.data);
      setWatchHistory(historyRes.data);
    } catch (err) {
      console.error('데이터 조회 실패:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.videoUrl) {
      alert('제목과 영상 URL은 필수입니다.');
      return;
    }

    setLoading(true);
    try {
      await api.createVideo(formData);
      alert('영상이 등록되었습니다.');
      
      // 폼 초기화
      setFormData({
        title: '',
        courseId: '',
        courseName: '',
        videoUrl: '',
        duration: '',
        description: ''
      });
      
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert('영상 등록 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId, videoTitle) => {
    if (!window.confirm(`"${videoTitle}" 영상을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await api.deleteVideo(videoId);
      alert('영상이 삭제되었습니다.');
      fetchData();
    } catch (err) {
      alert('영상 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  // 영상별 시청 통계
  const getVideoStats = (videoId) => {
    const videoHistory = watchHistory.filter(h => h.videoId === videoId);
    const totalStudents = videoHistory.length;
    const completedStudents = videoHistory.filter(h => h.completed).length;
    const avgPercentage = totalStudents > 0 
      ? Math.floor(videoHistory.reduce((sum, h) => sum + h.percentage, 0) / totalStudents)
      : 0;

    return { totalStudents, completedStudents, avgPercentage };
  };

  const roomCourseId = mapRoomToCourseId(currentRoom);
  const filteredVideos = roomCourseId ? videos.filter((video) => video.courseId === roomCourseId) : videos;

  return (
    <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>📺 강의 영상 관리</h2>
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
          + 영상 등록
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
          영상 목록 ({filteredVideos.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '15px 30px',
            backgroundColor: activeTab === 'stats' ? '#007bff' : 'transparent',
            color: activeTab === 'stats' ? 'white' : '#6c757d',
            border: 'none',
            borderBottom: activeTab === 'stats' ? '3px solid #007bff' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          시청 통계
        </button>
      </div>

      {/* 영상 목록 탭 */}
      {activeTab === 'list' && (
        <div>
          {filteredVideos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>등록된 영상이 없습니다.</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>상단의 "+ 영상 등록" 버튼을 눌러 영상을 추가하세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredVideos.map(video => {
                const stats = getVideoStats(video.id);
                
                return (
                  <div
                    key={video.id}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      padding: '20px',
                      backgroundColor: 'white',
                      display: 'flex',
                      gap: '20px'
                    }}
                  >
                    {/* 썸네일 */}
                    <img
                      src={video.thumbnail || 'https://via.placeholder.com/200x120?text=No+Thumbnail'}
                      alt={video.title}
                      style={{
                        width: '200px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0
                      }}
                    />

                    {/* 영상 정보 */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        {video.courseName}
                      </div>

                      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                        {video.title}
                      </h3>

                      <p style={{
                        margin: '0 0 10px 0',
                        fontSize: '14px',
                        color: '#6c757d',
                        lineHeight: '1.5'
                      }}>
                        {video.description}
                      </p>

                      <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>
                        <span>📅 {new Date(video.uploadDate).toLocaleDateString('ko-KR')}</span>
                        <span style={{ margin: '0 10px' }}>|</span>
                        <span>⏱️ {video.duration}</span>
                      </div>

                      {/* 통계 */}
                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}>
                        <div>
                          <span style={{ color: '#6c757d' }}>시청 학생: </span>
                          <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                            {stats.totalStudents}명
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#6c757d' }}>완료: </span>
                          <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                            {stats.completedStudents}명
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#6c757d' }}>평균 진도율: </span>
                          <span style={{ fontWeight: 'bold', color: '#ffc107' }}>
                            {stats.avgPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => handleDelete(video.id, video.title)}
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 시청 통계 탭 */}
      {activeTab === 'stats' && (
        <div>
          {watchHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '18px', margin: 0 }}>시청 기록이 없습니다.</p>
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
                    <th style={{ padding: '15px', textAlign: 'left' }}>영상 제목</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>진도율</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>완료 여부</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>마지막 시청</th>
                  </tr>
                </thead>
                <tbody>
                  {watchHistory.map((record, index) => (
                    <tr 
                      key={index}
                      style={{
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                      }}
                    >
                      <td style={{ padding: '15px' }}>{record.studentName}</td>
                      <td style={{ padding: '15px' }}>{record.videoTitle}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#dee2e6',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${record.percentage}%`,
                              height: '100%',
                              backgroundColor: record.completed ? '#28a745' : '#007bff'
                            }} />
                          </div>
                          <span style={{ fontWeight: 'bold', minWidth: '45px' }}>
                            {record.percentage}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          padding: '5px 15px',
                          borderRadius: '20px',
                          backgroundColor: record.completed ? '#d4edda' : '#fff3cd',
                          color: record.completed ? '#155724' : '#856404',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {record.completed ? '✓ 완료' : '진행중'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontSize: '14px' }}>
                        {new Date(record.lastWatchedAt).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 영상 등록 모달 */}
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
            <h3 style={{ marginTop: 0 }}>📺 새 영상 등록</h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  영상 제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="예: 1주차 - React 기초"
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  YouTube URL *
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px'
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  YouTube 영상의 전체 URL을 입력하세요
                </small>
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
                  재생 시간
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="예: 1:30:00"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  설명
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="영상에 대한 설명을 입력하세요"
                  rows="4"
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
    </div>
  );
}

export default TeacherVideoManagement;

function mapRoomToCourseId(room) {
  if (!room?.id) return null;
  if (room.id.includes('web')) return 'course-web';
  if (room.id.includes('java')) return 'course-java';
  if (room.id.includes('db')) return 'course-db';
  return null;
}
