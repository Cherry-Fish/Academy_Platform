import React from 'react';
import ReactPlayer from 'react-player';

// URL을 로드해 영상 길이를 감지하는 숨겨진 플레이어 컴포넌트
function DurationDetector({ url, onDuration }) {
  if (!url) return null;
  return (
    <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
      <ReactPlayer
        url={url}
        width={1}
        height={1}
        playing={false}
        onDuration={onDuration}
      />
    </div>
  );
}

export default DurationDetector;
