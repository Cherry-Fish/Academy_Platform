import React from 'react';

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1.5px solid #e2e8f0',
  fontSize: '15px',
  background: '#ffffff',
  color: '#1a1740',
  outline: 'none',
};

const readonlyStyle = {
  ...inputStyle,
  background: '#f8fafc',
  color: '#64748b',
  cursor: 'default',
};

function SettingsPanel({
  username,
  email,
  settingsName,
  setSettingsName,
  onSaveProfile,
  onLogout,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onChangePassword,
  actionLoading,
  deviceInfo,
  deviceRequestCompleted,
  onRequestDeviceChange,
  passwordDescription,
  deviceDescription,
  showDeviceSection = true,
  isDarkMode = false,
  toggleDarkMode,
}) {
  return (
    <>
      {/* ── 디스플레이 설정 ── */}
      <div className="dashboard-card">
        <h3 className="section-heading">디스플레이 설정</h3>
        <p className="muted-text" style={{ marginBottom: '20px' }}>
          화면 테마를 설정합니다. 변경 사항은 즉시 적용되며 다음 접속 시에도 유지됩니다.
        </p>

        <button
          type="button"
          onClick={toggleDarkMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '480px',
            padding: '18px 20px',
            borderRadius: '16px',
            border: '1.5px solid rgba(108,99,255,0.2)',
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(167,139,250,0.1))'
              : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: isDarkMode
                ? 'linear-gradient(135deg, #312e81, #1e1b4b)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '20px',
              boxShadow: isDarkMode
                ? '0 2px 10px rgba(49,46,129,0.5)'
                : '0 2px 10px rgba(251,191,36,0.4)',
            }}>
              {isDarkMode ? '🌙' : '☀️'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: isDarkMode ? '#c4b5fd' : '#1a1740' }}>
                {isDarkMode ? '다크 모드' : '라이트 모드'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {isDarkMode ? '어두운 화면으로 설정됨' : '밝은 화면으로 설정됨'}
              </div>
            </div>
          </div>

          {/* 토글 스위치 */}
          <div style={{
            width: '52px',
            height: '28px',
            borderRadius: '999px',
            background: isDarkMode
              ? 'linear-gradient(135deg, #6c63ff, #4f46e5)'
              : '#d1d5db',
            position: 'relative',
            transition: 'background 0.25s ease',
            boxShadow: isDarkMode ? '0 2px 10px rgba(108,99,255,0.4)' : 'none',
            flexShrink: 0,
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#ffffff',
              position: 'absolute',
              top: '3px',
              left: isDarkMode ? '27px' : '3px',
              transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </button>
      </div>

      {/* ── 프로필 설정 ── */}
      <div className="dashboard-card">
        <h3 className="section-heading">프로필 설정</h3>
        <div style={{ display: 'grid', gap: '16px', maxWidth: '680px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
              표시 이름
            </label>
            <input
              type="text"
              value={settingsName}
              onChange={(event) => setSettingsName(event.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
              Mattermost ID
            </label>
            <input type="text" value={username} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
              이메일
            </label>
            <input
              type="text"
              value={email || '등록된 이메일 정보가 없습니다.'}
              readOnly
              style={readonlyStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="legacy-login-button" onClick={onSaveProfile}>
              프로필 저장
            </button>
            <button type="button" className="ghost-button" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* ── 비밀번호 변경 ── */}
      <div className="dashboard-card">
        <h3 className="section-heading">비밀번호 변경</h3>
        {passwordDescription && (
          <p className="muted-text" style={{ marginBottom: '18px' }}>{passwordDescription}</p>
        )}
        <div style={{ display: 'grid', gap: '14px', maxWidth: '680px' }}>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="현재 비밀번호"
            style={inputStyle}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="새 비밀번호"
            style={inputStyle}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="새 비밀번호 확인"
            style={inputStyle}
          />
          <div>
            <button
              type="button"
              className="legacy-login-button"
              onClick={onChangePassword}
              disabled={actionLoading}
            >
              {actionLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 기기 인증 변경 ── */}
      {showDeviceSection && (
        <div className="dashboard-card">
          <h3 className="section-heading">기기 인증 변경</h3>
          {deviceDescription && (
            <p className="muted-text" style={{ marginBottom: '18px' }}>{deviceDescription}</p>
          )}
          <div style={{
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid rgba(108,99,255,0.12)',
            background: 'linear-gradient(135deg, rgba(108,99,255,0.04), rgba(167,139,250,0.04))',
            marginBottom: '18px',
          }}>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '13px',
              lineHeight: 1.8,
              fontFamily: 'inherit',
            }}>
{`브라우저: ${deviceInfo.userAgent}
플랫폼: ${deviceInfo.platform}
언어: ${deviceInfo.language}
화면 크기: ${deviceInfo.screenResolution}
확인 시각: ${new Date(deviceInfo.timestamp).toLocaleString('ko-KR')}`}
            </pre>
          </div>
          <button
            type="button"
            className="legacy-login-button"
            onClick={onRequestDeviceChange}
            disabled={actionLoading || deviceRequestCompleted}
          >
            {deviceRequestCompleted ? '✓ 요청 완료' : actionLoading ? '요청 중...' : '기기 인증 변경 요청'}
          </button>
        </div>
      )}
    </>
  );
}

export default SettingsPanel;
