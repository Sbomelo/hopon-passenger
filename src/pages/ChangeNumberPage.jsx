import { useState } from 'react';
import { requestPhoneChange, verifyPhoneChange } from '../api/hoponApi.js';
import AppHeader from '../components/AppHeader.jsx';

export default function ChangeNumberPage({ token, currentNumber, onBack, onChanged }) {
    const [newNumber, setNewNumber] = useState('');
    const [challenge, setChallenge] = useState(null);
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            if (challenge) {
                onChanged(await verifyPhoneChange(newNumber, code, token));
            } else {
                setChallenge(await requestPhoneChange(newNumber, token));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    function editNumber() {
        setChallenge(null);
        setCode('');
        setError('');
    }

    return (
        <div className="passenger-page">
            <AppHeader title="Change number" onBack={busy ? undefined : onBack} backLabel="Back" />
            <main className="page-content phone-change">
                <form className="section-card" onSubmit={submit}>
                    {challenge ? (
                        <>
                            <p>Enter the six-digit code sent to <strong>{newNumber}</strong>.</p>
                            {challenge.devOnlyCode && <p>Development code <strong>{challenge.devOnlyCode}</strong></p>}
                            <label htmlFor="new-number-code">One-time code</label>
                            <input id="new-number-code" className="hopon-input" type="text" inputMode="numeric"
                                pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code}
                                disabled={busy} onChange={event => setCode(event.target.value)} required autoFocus />
                        </>
                    ) : (
                        <>
                            {currentNumber && <p>Current number <strong>{currentNumber}</strong></p>}
                            <label htmlFor="new-number">New South African mobile number</label>
                            <input id="new-number" className="hopon-input" type="tel" autoComplete="tel" value={newNumber}
                                disabled={busy} onChange={event => setNewNumber(event.target.value)} required autoFocus />
                        </>
                    )}
                    {error && <p className="error-text" role="alert">{error}</p>}
                    <button className="hopon-btn" type="submit" disabled={busy}>
                        {challenge ? (busy ? 'Verifying…' : 'Verify and update number') : (busy ? 'Sending…' : 'Send one-time code')}
                    </button>
                    {challenge && <button type="button" className="phone-change__edit" onClick={editNumber} disabled={busy}>Edit or resend code</button>}
                </form>
            </main>
        </div>
    );
}
