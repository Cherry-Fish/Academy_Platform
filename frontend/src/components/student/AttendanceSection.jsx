import React from 'react';

function AttendanceSection({
  actionLoading,
  onAttendance,
  contentLoading,
  attendanceMonth,
  onAttendanceMonthChange,
  records,
  AttendanceCalendar,
  LegendItem,
  translateAttendanceStatus,
  filteredSchedules,
  translateDayOfWeek,
}) {
  return (
    <>
      <div className="dashboard-card">
        <h3 className="section-heading">출석 체크</h3>
        <p className="muted-text" style={{ marginBottom: '20px' }}>
          버튼을 누르면 오늘 출석 기록이 바로 저장됩니다.
        </p>
        <button
          type="button"
          className="legacy-login-button"
          onClick={onAttendance}
          disabled={actionLoading}
          style={{ minWidth: '120px' }}
        >
          {actionLoading ? '처리 중...' : '✓ 출석 체크'}
        </button>
      </div>

      <div className="dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h3 className="section-heading" style={{ marginBottom: 0 }}>출석 달력</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" className="ghost-button" style={{ padding: '7px 14px', fontSize: '13px' }} onClick={() => onAttendanceMonthChange(-1)}>
              ← 이전
            </button>
            <div style={{
              minWidth: '110px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '15px',
              color: '#1a1740',
              background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(167,139,250,0.08))',
              border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: '10px',
              padding: '7px 12px'
            }}>
              {attendanceMonth.year}.{String(attendanceMonth.month).padStart(2, '0')}
            </div>
            <button type="button" className="ghost-button" style={{ padding: '7px 14px', fontSize: '13px' }} onClick={() => onAttendanceMonthChange(1)}>
              다음 →
            </button>
          </div>
        </div>
        {contentLoading ? (
          <p className="muted-text">불러오는 중...</p>
        ) : (
          <>
            <AttendanceCalendar
              year={attendanceMonth.year}
              month={attendanceMonth.month}
              records={records}
            />

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '16px 0 20px' }}>
              <LegendItem color="#dcfce7" border="#86efac" label="출석" />
              <LegendItem color="#fef3c7" border="#fbbf24" label="지각" />
              <LegendItem color="#fee2e2" border="#fca5a5" label="결석" />
            </div>

            <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#1a1740' }}>이번 달 출석 목록</h4>
            {records.length === 0 ? (
              <p className="muted-text">이번 달 기록이 아직 없습니다.</p>
            ) : (
              <table className="soft-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>시간</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={`${record.id}-${record.attendanceDate}`}>
                      <td style={{ fontWeight: 600 }}>{record.attendanceDate}</td>
                      <td style={{ color: '#64748b' }}>{record.checkedInAt || record.timestamp}</td>
                      <td><span className="status-pill">{translateAttendanceStatus(record.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="dashboard-card">
        <h3 className="section-heading">내 시간표</h3>
        <p className="muted-text" style={{ marginBottom: '18px' }}>
          현재 수강 중인 강의 시간표입니다.
        </p>
        {filteredSchedules.length === 0 ? (
          <p className="muted-text">등록된 시간표가 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredSchedules.map((schedule, index) => (
              <div
                key={`${schedule.courseId}-${schedule.dayOfWeek}-${index}-card`}
                style={{
                  padding: '18px 20px',
                  border: '1px solid rgba(108,99,255,0.12)',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,255,0.9))',
                  boxShadow: '0 2px 10px rgba(108,99,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#7c6df7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
                    {translateDayOfWeek(schedule.dayOfWeek)} · {schedule.classType === 'offline' ? '오프라인' : '온라인'}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#1a1740', marginBottom: '4px' }}>{schedule.courseName}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{schedule.startTime} – {schedule.endTime}</div>
                </div>
                <span className="status-pill" style={
                  schedule.classType === 'offline'
                    ? { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }
                    : { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' }
                }>
                  {schedule.classType === 'offline' ? '🏫 오프라인' : '💻 온라인'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AttendanceSection;
