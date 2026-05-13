import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

function AdminDashboard() {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.getTodayAttendance();
      setRecords(response.data || []);
    } catch (err) {
      setMessage('출석 현황을 불러오지 못했습니다.');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <p className="app-kicker">Administrator</p>
        <h2 className="dashboard-heading">관리자 대시보드</h2>
        <p className="dashboard-description">
        전체 출석 현황과 시스템 운영 상태를 확인하는 초기 화면입니다.
        </p>
      </div>

      <div className="dashboard-card">
        <h3 className="section-heading">오늘의 전체 출석 현황</h3>
        {message && <p className="error-text">{message}</p>}
        {records.length === 0 ? (
          <p className="muted-text">아직 등록된 출석 기록이 없습니다.</p>
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
                  <td>{record.checkedInAt}</td>
                  <td>
                    <span className="status-pill">{record.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
