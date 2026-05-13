import React from 'react';

function StaffOverviewSection({
  username,
  displayName,
  userType,
  academyName,
  selectedCourse,
  records,
  pendingRequests,
  allSubmissions,
  adminUsers,
  contentLoading,
  getRoleLabel,
}) {
  const overviewCards = userType === 'admin'
    ? [
        { label: '등록 사용자', value: `${adminUsers.length}명`, tone: 'default' },
        { label: '학생 계정', value: `${adminUsers.filter((u) => u.role === 'STUDENT' || u.role === 'student').length}명`, tone: 'default' },
        { label: '강사 계정', value: `${adminUsers.filter((u) => u.role === 'TEACHER' || u.role === 'teacher').length}명`, tone: 'accent' },
        { label: '오늘 출석 기록', value: `${records.length}건`, tone: records.length > 0 ? 'warn' : 'default' },
      ]
    : [
        { label: '현재 선택 강의', value: selectedCourse?.name || '-', tone: 'default' },
        { label: '오늘 출석 기록', value: `${records.length}건`, tone: 'default' },
        { label: '대기 중 요청', value: `${pendingRequests.length}건`, tone: pendingRequests.length > 0 ? 'warn' : 'default' },
        { label: '채점 대기 제출물', value: `${allSubmissions.length}건`, tone: allSubmissions.length > 0 ? 'accent' : 'default' },
      ];

  return (
    <>
      <div className="dashboard-card">
        <h3 className="section-heading">오늘의 관리 요약</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className={`summary-mini-card${card.tone === 'warn' ? ' summary-mini-card--warn' : card.tone === 'accent' ? ' summary-mini-card--accent' : ''}`}
            >
              <div className="summary-mini-label">{card.label}</div>
              <div
                className={`summary-mini-value${card.tone === 'warn' ? ' summary-mini-value--warn' : card.tone === 'accent' ? ' summary-mini-value--accent' : ''}`}
                style={{ fontSize: String(card.value).length > 10 ? '22px' : undefined }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="info-card" style={{ marginTop: '18px' }}>
          <div className="summary-mini-label">현재 로그인 정보</div>
          <div className="info-card-title--lg">{displayName || username}</div>
          <div className="info-card-meta">
            아이디 {username} · 역할 {getRoleLabel(userType)}
            {academyName ? ` · ${academyName}` : ''}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h3 className="section-heading">{userType === 'admin' ? '오늘의 전체 출석 현황' : '오늘의 출석 현황'}</h3>
        {contentLoading ? (
          <p className="muted-text">불러오는 중...</p>
        ) : records.length === 0 ? (
          <p className="muted-text">아직 표시할 기록이 없습니다.</p>
        ) : (
          <table className="soft-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>시간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.username}</td>
                  <td>{record.checkedInAt || record.timestamp}</td>
                  <td><span className="status-pill">{record.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default StaffOverviewSection;
