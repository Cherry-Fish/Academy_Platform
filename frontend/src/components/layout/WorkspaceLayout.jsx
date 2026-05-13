import React from 'react';

function WorkspaceLayout({
  railNodes = [],
  selectedRailId,
  onSelectRail,
  sidebarKicker,
  sidebarTitle,
  sidebarSubtitle,
  menuItems,
  activeSection,
  onSelectSection,
  selectedRoomDescription,
  profileName,
  profileRoleLabel,
  onOpenSettings,
  onLogout,
  topbarKicker,
  topbarTitle,
  topbarBadge,
  children,
}) {
  return (
    <div className="discord-app-shell">
      <aside className="server-rail">
        <div className="server-rail-brand">AP</div>
        <div className="server-rail-stack">
          {railNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={`server-node ${selectedRailId === node.id ? 'is-active' : ''}`}
              title={node.name}
              onClick={() => onSelectRail?.(node.id)}
            >
              {node.shortName}
            </button>
          ))}
        </div>
      </aside>

      <aside className="channel-sidebar">
        <div className="channel-sidebar-header">
          <p className="channel-sidebar-kicker">{sidebarKicker}</p>
          <h2 className="channel-sidebar-title">{sidebarTitle}</h2>
          {sidebarSubtitle ? (
            <p style={{ margin: '10px 0 0', color: '#b5bac1', fontSize: '14px' }}>{sidebarSubtitle}</p>
          ) : null}
        </div>

        <div className="channel-sidebar-scroll">
          <div className="channel-sidebar-section">
            <div className="channel-sidebar-label">메뉴</div>
            <div className="channel-nav">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`channel-link ${activeSection === item.key ? 'is-active' : ''}`}
                  onClick={() => onSelectSection(item.key)}
                >
                  <span className="channel-link-prefix">#</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="channel-sidebar-section">
            <div className="channel-sidebar-label">선택한 강의방</div>
            <div style={{ padding: '0 12px 8px', color: '#b5bac1', lineHeight: 1.7, fontSize: '14px' }}>
              {selectedRoomDescription}
            </div>
          </div>
        </div>

        <div className="channel-sidebar-footer">
          <div className="profile-row">
            <div className="profile-chip">
              <div className="profile-avatar">{(profileName || 'U').slice(0, 1).toUpperCase()}</div>
              <div className="profile-meta">
                <strong>{profileName}</strong>
                <span>{profileRoleLabel}</span>
              </div>
            </div>
            <button
              type="button"
              className="profile-settings-button"
              title="설정"
              aria-label="설정"
              onClick={onOpenSettings}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="profile-settings-icon">
                <path
                  fill="currentColor"
                  d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.22 1.13-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
                />
              </svg>
            </button>
          </div>
          <button type="button" className="ghost-button sidebar-logout" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </aside>

      <main className="discord-main-panel">
        <div className="content-topbar">
          <div>
            <p className="content-kicker">{topbarKicker}</p>
            <h1 className="content-title">{topbarTitle}</h1>
          </div>
          <div className="content-topbar-badge">{topbarBadge}</div>
        </div>

        <div className="discord-content-body" style={{ display: 'grid', gap: '20px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default WorkspaceLayout;
