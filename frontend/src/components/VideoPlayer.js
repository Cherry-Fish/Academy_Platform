import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { api } from '../api/api';

function VideoPlayer({ videoId, onBack }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loadedSeconds: 0 });
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  const saveIntervalRef = useRef(null);

  useEffect(() => {
    fetchVideo();
    
    return () => {
      saveProgress();
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (playing) {
      saveIntervalRef.current = setInterval(() => {
        saveProgress();
      }, 10000);
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [playing, progress]);

  const fetchVideo = async () => {
    try {
      const response = await api.getVideoById(videoId);
      setVideo(response.data);
      
      const historyRes = await api.getMyWatchHistory();
      const videoHistory = historyRes.data[videoId];
      
      if (videoHistory && playerRef.current) {
        setTimeout(() => {
          playerRef.current.seekTo(videoHistory.watchedTime, 'seconds');
        }, 1000);
      }
    } catch (err) {
      console.error('영상 조회 실패:', err);
      alert('영상을 불러올 수 없습니다.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  //동영상 서버에 저장
  const saveProgress = async () => {
    if (!video || progress.playedSeconds === 0) return;

    const calculatedDuration = duration > 0 ? duration : progress.loadedSeconds;

    try {
      await api.saveWatchProgress(videoId, {
        watchedTime: progress.playedSeconds,
        totalTime: calculatedDuration
      });
    } catch (err) {
      console.error('시청 기록 저장 실패:', err);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '50px auto', 
        padding: '20px',
        textAlign: 'center' 
      }}>
        로딩 중...
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '50px auto', 
        padding: '20px',
        textAlign: 'center' 
      }}>
        영상을 찾을 수 없습니다.
      </div>
    );
  }

  //동영상 진행률 계산
  const calculatedDuration = duration > 0 ? duration : progress.loadedSeconds;
  const percentage = calculatedDuration > 0 ? Math.floor((progress.playedSeconds / calculatedDuration) * 100) : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '20px' }}>
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

      {/* 영상 플레이어 */}
      <div style={{
        position: 'relative',
        paddingTop: '56.25%',
        backgroundColor: '#000',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <ReactPlayer
          ref={playerRef}
          url={video.videoUrl}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          controls
          playing={playing}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            saveProgress();
          }}
          onProgress={(state) => {
            setProgress(state);
            if (state.loadedSeconds > duration) {
              setDuration(state.loadedSeconds);
            }
          }}
          onEnded={() => {
            setPlaying(false);
            saveProgress();
          }}
          config={{
            youtube: {
              playerVars: { 
                modestbranding: 1,
                rel: 0
              }
            }
          }}
        />
      </div>

      {/* 진도율 표시 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            시청 진도율: {percentage}%
          </span>
          <span style={{ fontSize: '14px', color: '#6c757d' }}>
            {formatTime(progress.playedSeconds)} / {formatTime(calculatedDuration)}
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#dee2e6',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: percentage >= 90 ? '#28a745' : '#007bff',
            transition: 'width 0.3s'
          }} />
        </div>
        
        {percentage >= 90 && (
          <div style={{
            marginTop: '10px',
            color: '#28a745',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ✓ 시청 완료!
          </div>
        )}
      </div>

      {/* 영상 정보 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid #dee2e6'
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
          {video.courseName}
        </div>

        <h2 style={{ margin: '10px 0 15px 0', fontSize: '24px' }}>
          {video.title}
        </h2>

        <div style={{
          display: 'flex',
          gap: '15px',
          fontSize: '14px',
          color: '#6c757d',
          marginBottom: '15px',
          paddingBottom: '15px',
          borderBottom: '1px solid #dee2e6'
        }}>
          <span>👨‍🏫 {video.teacherName}</span>
          <span>📅 {new Date(video.uploadDate).toLocaleDateString('ko-KR')}</span>
          <span>⏱️ {video.duration}</span>
        </div>

        <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#495057' }}>
          {video.description}
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#d1ecf1',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#0c5460'
      }}>
        💡 시청 기록은 10초마다 자동으로 저장됩니다. 다음에 다시 접속하면 이어서 볼 수 있어요!
      </div>
    </div>
  );
}

export default VideoPlayer;