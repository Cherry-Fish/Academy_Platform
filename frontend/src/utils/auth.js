// 로컬 스토리지에 토큰 저장/불러오기
export const saveToken = (token) => {
  localStorage.setItem('mattermost_token', token);
};

export const getToken = () => {
  return localStorage.getItem('mattermost_token');
};

export const removeToken = () => {
  localStorage.removeItem('mattermost_token');
  localStorage.removeItem('academy_username');
  localStorage.removeItem('academy_display_name');
  localStorage.removeItem('academy_email');
  localStorage.removeItem('academy_name');
  localStorage.removeItem('academy_courses');
  localStorage.removeItem('academy_schedules');
};

export const isAuthenticated = () => {
  return !!getToken();
};
