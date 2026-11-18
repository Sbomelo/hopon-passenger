import { useEffect, useRef } from 'react';

export default function SosSheet({ contact, loading, error, onClose, onEditContact }) {
    const dialogRef = useRef(null);
    useEffect(() => {
        // A native modal provides focus trapping, Escape and focus restoration.
        dialogRef.current.showModal();
    }, []);

    return (
        <dialog ref={dialogRef} className="sos-sheet" aria-labelledby="sos-title" onCancel={onClose} onClose={onClose}>
            <div className="sos-sheet__header"><h2 id="sos-title">Emergency help</h2>
                <button className="icon-button" onClick={onClose} aria-label="Close emergency help">×</button></div>
            <p>Choose a number to call. Hopon does not call or send a message automatically.</p>
            {loading ? <p role="status">Loading your emergency contact…</p>
                : error ? <p className="error-text" role="alert">{error}</p>
                : contact ? <a className="sos-link" href={`tel:${contact.phoneNumber}`}>Call {contact.name} · {contact.phoneNumber}</a>
                : <p>No emergency contact saved yet.</p>}
            {(!contact || error) && <button className="tm-btn" onClick={onEditContact}>Emergency Contact</button>}
            <a className="sos-link" href="tel:10111">Call emergency services (10111)</a>
        </dialog>
    );
}
