//로그인 기능
import React, { useState } from 'react';
import { api } from '../api/api';
import { saveToken } from '../utils/auth';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

const handleLogin = async (e) => { //디버그 용도
  e.preventDefault();
  
  console.log('입력한 값:', { username, password });
  console.log('username 길이:', username.length);
  console.log('password 길이:', password.length);
  
  try {
    const response = await api.login({ username, password });
    console.log('로그인 응답:', response.data);
    
    saveToken(response.data.token || response.data.jwtToken);
    localStorage.setItem('academy_username', response.data.username || username);
    console.log('토큰 저장 완료');
    
    onLoginSuccess(response.data.userType || 'student');
    console.log('로그인 성공!');
  } catch (err) {
    console.error('로그인 에러:', err);
    setError('로그인 실패: ' + (err.response?.data?.message || err.message));
  }
};

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-card login-card-form">
          <div className="login-copy">
            <h1 className="login-title">로그인</h1>
            <p className="login-description">로그인하세요.</p>
          </div>
          {error && <div className="login-alert">{error}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <div className="legacy-input-group">
              <span className="legacy-input-icon">ID</span>
              <input
                type="text"
                placeholder="ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="legacy-input"
              />
            </div>
            <div className="legacy-input-group">
              <span className="legacy-input-icon">PW</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="legacy-input"
              />
            </div>
            <div className="login-actions">
              <button type="submit" className="legacy-login-button">
                로그인
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

export default Login;

/*
[크기]
width: '100px'          // 가로 크기
height: '50px'          // 세로 크기
minWidth: '200px'       // 최소 가로 크기
maxWidth: '500px'       // 최대 가로 크기

[여백]
margin: '10px'          // 바깥 여백 (상하좌우 모두)
marginTop: '20px'       // 위쪽 여백
marginBottom: '20px'    // 아래쪽 여백
marginLeft: '10px'      // 왼쪽 여백
marginRight: '10px'     // 오른쪽 여백

padding: '15px'         // 안쪽 여백 (상하좌우 모두)
paddingTop: '10px'      // 위쪽 안쪽 여백
paddingBottom: '10px'   // 아래쪽 안쪽 여백

[글자]
fontSize: '20px'        // 글자 크기
fontWeight: 'bold'      // 굵기 (bold, normal, 100~900)
color: 'blue'           // 글자 색상
textAlign: 'center'     // 정렬 (left, center, right)
lineHeight: '1.5'       // 줄 간격

[배경]
backgroundColor: 'red'  // 배경 색상
background: 'url(이미지주소)'  // 배경 이미지

[테두리]
border: '1px solid black'  // 테두리
borderRadius: '5px'        // 둥근 모서리
borderBottom: '2px solid red'  // 아래쪽 테두리만

[배치]
display: 'flex'         // flexbox 사용
flexDirection: 'row'    // 가로 배치 (column = 세로)
justifyContent: 'center'  // 가로 정렬
alignItems: 'center'    // 세로 정렬
gap: '10px'             // 요소 간 간격

position: 'absolute'    // 위치 지정 방식
top: '0'                // 위에서부터 거리
left: '0'               // 왼쪽에서부터 거리

[기타]
cursor: 'pointer'       // 마우스 커서 모양 (손가락 모양)
opacity: '0.5'          // 투명도 (0~1)
boxShadow: '0 2px 4px rgba(0,0,0,0.1)'  // 그림자
overflow: 'hidden'      // 넘치는 내용 숨기기
*/
