import { useState, useEffect } from 'react';
import {
    getEmergencyContact,
    upsertEmergencyContact,
    deleteEmergencyContact
} from '../api/hoponApi.js';

export default function EmergencyContactPage({ token, onBack }) {

    // The contact object returned from the server, or null if none exists.
    const [contact, setContact] = useState(null);

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Load the current contact when the page mounts.
    useEffect(() => {
        const saved = localStorage.getItem('hopon-theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);

        async function load() {
            try {
                const data = await getEmergencyContact(token);
                if (data) {
                    setContact(data);
                    setName(data.name);
                    setPhoneNumber(data.phoneNumber);
                }
            } catch (err) {
                setError(err.message ?? 'Failed to load your emergency contact.');
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [token]);

    async function handleSave(e) {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!name.trim() || !phoneNumber.trim()) {
            setError('Both name and phone number are required.');
            return;
        }

        setSaving(true);
        try {
            const updated = await upsertEmergencyContact(name.trim(), phoneNumber.trim(), token);
            setContact(updated);
            setSuccessMsg('Emergency contact saved.');
        } catch (err) {
            setError(err.message ?? 'Failed to save your emergency contact.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm('Remove your emergency contact?')) return;

        setError('');
        setSuccessMsg('');
        setDeleting(true);
        try {
            await deleteEmergencyContact(token);
            setContact(null);
            setName('');
            setPhoneNumber('');
            setSuccessMsg('Emergency contact removed.');
        } catch (err) {
            setError(err.message ?? 'Failed to remove your emergency contact.');
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <p style={{ opacity: 0.6 }}>Loading…</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

            <header style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0.7rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexShrink: 0
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '0.3rem 0.65rem',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        fontSize: '0.9rem',
                        flexShrink: 0
                    }}
                >
                    Back
                </button>
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-interactive)', fontSize: '1.05rem' }}>
                        Emergency Contact
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.05rem' }}>
                        Notified when you arrive at your stop
                    </div>
                </div>
            </header>

            <div style={{ flex: 1, padding: '1.5rem 1rem', width: '100%', maxWidth: '480px', margin: '0 auto' }}>

                <div style={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.6
                }}>
                    <strong style={{ color: 'var(--color-interactive)' }}>🆘 How this works</strong>
                    <p style={{ marginTop: '0.4rem', opacity: 0.8 }}>
                        Save a trusted person's number below. When your bus arrives at your stop,
                        they'll receive a notification so they know you've arrived safely.
                    </p>
                </div>

                {contact && (
                    <div style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '0.9rem 1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--color-interactive)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '1rem',
                            flexShrink: 0
                        }}>
                            {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{contact.name}</div>
                            <div style={{ fontSize: '0.82rem', opacity: 0.65 }}>{contact.phoneNumber}</div>
                            <div style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '0.1rem' }}>
                                {contact.updatedAt
                                    ? `Updated ${new Date(contact.updatedAt).toLocaleDateString()}`
                                    : `Added ${new Date(contact.createdAt).toLocaleDateString()}`}
                            </div>
                        </div>
                    </div>
                )}

                {!contact && !loading && (
                    <p style={{ opacity: 0.5, fontSize: '0.875rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                        No emergency contact saved yet.
                    </p>
                )}

                {/* Form */}
                <form onSubmit={handleSave}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                        Contact name
                    </label>
                    <input
                        className="hopon-input"
                        type="text"
                        placeholder="e.g. Mom, Dad, Sipho"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={100}
                    />

                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', marginTop: '0.5rem' }}>
                        Phone number
                    </label>
                    <input
                        className="hopon-input"
                        type="tel"
                        placeholder="+27 83 000 0000"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        maxLength={20}
                    />

                    {error && (
                        <p className="error-text" style={{ marginBottom: '0.75rem' }}>{error}</p>
                    )}

                    {successMsg && (
                        <p style={{ color: 'var(--color-success)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                            ✓ {successMsg}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="hopon-btn"
                        disabled={saving || deleting}
                    >
                        {saving ? 'Saving…' : contact ? 'Update contact' : 'Save contact'}
                    </button>

                    {contact && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={saving || deleting}
                            style={{
                                width: '100%',
                                marginTop: '0.75rem',
                                padding: '0.7rem',
                                borderRadius: '8px',
                                border: '1.5px solid var(--color-danger)',
                                background: 'transparent',
                                color: 'var(--color-danger)',
                                fontFamily: 'var(--font-base)',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: deleting ? 'not-allowed' : 'pointer',
                                opacity: deleting ? 0.6 : 1,
                                transition: 'background 0.15s ease, color 0.15s ease'
                            }}
                        >
                            {deleting ? 'Removing…' : 'Remove contact'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}