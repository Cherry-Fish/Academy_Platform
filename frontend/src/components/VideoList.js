import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

function VideoList({ onSelectVideo, currentRoom = null }) {
  const [videos, setVideos] = useState([]);
  const [watchHistory, setWatchHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [videosRes, historyRes] = await Promise.all([
        api.getVideos(),
        api.getMyWatchHistory()
      ]);
      
      setVideos(videosRes.data);
      setWatchHistory(historyRes.data);
    } catch (err) {
      console.error('데이터 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 과정 목록 추출
  const courses = ['all', ...new Set(videos.map(v => v.courseId))];

  // 필터링된 영상
  const roomCourseId = mapRoomToCourseId(currentRoom);
  const roomVideos = roomCourseId ? videos.filter((video) => video.courseId === roomCourseId) : videos;
  const filteredVideos = selectedCourse === 'all'
    ? roomVideos
    : roomVideos.filter(v => v.courseId === selectedCourse);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '20px' }}>
      <h2>📺 강의 영상</h2>
      {currentRoom && (
        <p style={{ marginTop: '-6px', marginBottom: '24px', color: '#6c757d' }}>
          현재 강의방: <strong>{currentRoom.name}</strong>
        </p>
      )}

      {/* 과정 필터 */}
      <div style={{ marginBottom: '30px' }}>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          style={{
            padding: '10px 15px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #dee2e6',
            minWidth: '200px'
          }}
        >
          <option value="all">전체 과정</option>
          {courses.filter(c => c !== 'all').map(courseId => {
            const courseVideo = videos.find(v => v.courseId === courseId);
            return (
              <option key={courseId} value={courseId}>
                {courseVideo?.courseName || courseId}
              </option>
            );
          })}
        </select>
      </div>

      {/* 영상 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredVideos.map(video => {
          const history = watchHistory[video.id];
          const percentage = history?.percentage || 0;
          const completed = history?.completed || false;

          return (
            <div
              key={video.id}
              onClick={() => onSelectVideo(video.id)}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: 'white'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* 썸네일 */}
              <div style={{ position: 'relative' }}>
                <img
                  src={video.thumbnail || 'https://via.placeholder.com/320x180?text=No+Thumbnail'}
                  alt={video.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
                
                {/* 완료 배지 */}
                {completed && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ✓ 완료
                  </div>
                )}

                {/* 진도율 바 */}
                {percentage > 0 && !completed && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'rgba(0,0,0,0.3)'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: '#007bff',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                )}

                {/* 재생 시간 */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {video.duration}
                </div>
              </div>

              {/* 영상 정보 */}
              <div style={{ padding: '15px' }}>
                <h3 style={{
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  lineHeight: '1.4'
                }}>
                  {video.title}
                </h3>
                
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '14px',
                  color: '#6c757d',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {video.description}
                </p>

                <div style={{
                  fontSize: '12px',
                  color: '#6c757d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>👨‍🏫 {video.teacherName}</span>
                  {percentage > 0 && !completed && (
                    <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                      {percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          color: '#6c757d'
        }}>
          <p style={{ fontSize: '18px', margin: 0 }}>등록된 강의 영상이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

export default VideoList;

function mapRoomToCourseId(room) {
  if (!room?.id) return null;
  if (room.id.includes('web')) return 'course-web';
  if (room.id.includes('java')) return 'course-java';
  if (room.id.includes('db')) return 'course-db';
  return null;
}
