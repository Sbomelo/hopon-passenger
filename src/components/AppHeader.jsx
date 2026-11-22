import { useState } from 'react';
import { getTheme, toggleTheme } from '../utils/theme.js';
import PassengerProfile from './PassengerProfile.jsx';

export default function AppHeader({ title, subtitle, onBack, backLabel = 'Back to my trips', profile, onNavigate, onLogout,
    unreadCount = 0, onNotifications, onToggleTheme, isDark }) {
    const [dark, setDark] = useState(() => getTheme() === 'dark');

    function changeTheme() {
        if (onToggleTheme) onToggleTheme();
        else setDark(toggleTheme() === 'dark');
    }

    return (
        <header className="app-header">
            {onBack && <button className="icon-button" onClick={onBack} aria-label={backLabel}>←</button>}
            <div className="app-header__title">
                <h1 title={title}>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="app-header__actions">
                {onNotifications && <button className="icon-button" onClick={onNotifications}
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                    </svg>
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>}
                <button className="icon-button" onClick={changeTheme} aria-label="Toggle theme">
                    <span aria-hidden="true">{(isDark ?? dark) ? '☀' : '☾'}</span>
                </button>
                {onLogout && <PassengerProfile profile={profile} onNavigate={onNavigate} onLogout={onLogout} />}
            </div>
        </header>
    );
}
