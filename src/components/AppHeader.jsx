import { useEffect, useRef, useState } from 'react';
import { getTheme, toggleTheme } from '../utils/theme.js';

export default function AppHeader({ title, subtitle, onBack, onNavigate, onLogout,
    unreadCount = 0, onNotifications, onToggleTheme, isDark }) {
    const [dark, setDark] = useState(() => getTheme() === 'dark');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuButtonRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        function closeOutside(event) {
            if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
        }
        function closeOnEscape(event) {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        }
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [menuOpen]);

    function changeTheme() {
        if (onToggleTheme) onToggleTheme();
        else setDark(toggleTheme() === 'dark');
    }

    return (
        <header className="app-header">
            {onBack && <button className="icon-button" onClick={onBack} aria-label="Back to my trips">←</button>}
            <div className="app-header__title">
                <h1 title={title}>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="app-header__actions">
                <button className="icon-button" onClick={onNotifications} disabled={!onNotifications}
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                    </svg>
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                <button className="icon-button" onClick={changeTheme} aria-label="Toggle theme">
                    <span aria-hidden="true">{(isDark ?? dark) ? '☀' : '☾'}</span>
                </button>
                <div className="app-header__menu" ref={menuRef}>
                    <button ref={menuButtonRef} className="icon-button" aria-label="Open menu"
                        aria-expanded={menuOpen} aria-controls="header-menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
                    {menuOpen && <div id="header-menu" className="overflow-menu">
                        <button onClick={() => { setMenuOpen(false); onNavigate('emergency-contact'); }}>Emergency Contact</button>
                        <button onClick={onLogout}>Log out</button>
                    </div>}
                </div>
            </div>
        </header>
    );
}
