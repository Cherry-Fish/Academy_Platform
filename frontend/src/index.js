import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#111827', color: '#f8fafc', padding: '40px', fontFamily: 'sans-serif' }}>
          <h1 style={{ marginTop: 0, marginBottom: '16px' }}>화면 오류가 발생했습니다.</h1>
          <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
            지금은 빈 화면 대신 오류를 직접 보이도록 바꿨습니다. 아래 내용을 보내주시면 바로 이어서 고치겠습니다.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#1f2937', padding: '16px', borderRadius: '12px' }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
