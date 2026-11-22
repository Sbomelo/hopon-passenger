import { useEffect, useRef, useState } from 'react';

export default function PassengerProfile({ profile, onNavigate, onLogout }) {
    const [open, setOpen] = useState(false);
    const menu = useRef(null);
    const trigger = useRef(null);
    const name = profile?.fullName?.trim() || 'Profile';

    useEffect(() => {
        if (!open) return;

        function closeOutside(event) {
            if (!menu.current?.contains(event.target)) setOpen(false);
        }

        function closeOnEscape(event) {
            if (event.key !== 'Escape') return;
            setOpen(false);
            trigger.current?.focus();
        }

        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    return (
        <div className="passenger-profile" ref={menu}>
            <button type="button" className="passenger-profile__trigger" ref={trigger} title={name}
                aria-label={`${name}, passenger profile`} aria-expanded={open} aria-controls="passenger-profile-menu"
                onClick={() => setOpen(!open)}>
                <span>{name}</span><span aria-hidden="true">▾</span>
            </button>
            <div id="passenger-profile-menu" className="overflow-menu" hidden={!open}>
                <strong className="passenger-profile__name">{name}</strong>
                <button type="button" onClick={() => onNavigate('emergency-contact')}>Emergency contact</button>
                <button type="button" onClick={() => onNavigate('change-number')}>Change number</button>
                <button type="button" onClick={onLogout}>Log out</button>
            </div>
        </div>
    );
}
