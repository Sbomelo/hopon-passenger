import { useState } from "react";
import { requestOtp, verifyOtp } from "../api/hoponApi";

export default function LoginPage({onLogin}){
    const[step, setStep] = useState(1);
    const[phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [devcode, setDevCode] = useState('');
    const[error, setError] = useState('');
    const[loading, setLoading] = useState(false);

    async function handleRequestOtp(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try{
            const data = await requestOtp(phoneNumber);
            if(data.devOnlyCode) 
                setDevCode(data.devOnlyCode);
            
            setStep(2);
        }catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try{
            const data = await verifyOtp(phoneNumber, code);
            onLogin(data.token)
        }catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

        return(

            <div style={{minHeight: '100vh',display: 'flex',alignItems: 'center',justifyContent: 'center', background: 'var(--color-bg)',padding: '1rem'}}>
                <div style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem',width: '100%',maxWidth: '380px',boxShadow: '0 8px 32px rgba(0, 0, 0, 0.07)'}}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ color: 'var(--color-interactive)', fontSize: '2.2rem', marginBottom: '0.3rem' }}>
                            Hopon
                        </h1>
                        <p style={{ opacity: 0.65, fontSize: '0.9rem' }}>
                            Track your bus in real time
                        </p>
                    </div>

                    {step === 1? (
                        <form onSubmit={handleRequestOtp}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                                Phone number
                            </label>
                            <input  className="hopon-input" type="tel" placeholder="+27 83 000 0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required autoFocus/>
                            {error && <p className="error-text">{error}</p>}
                            <button className="hopon-btn" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send one-time code'}</button>
                        </form>
                     ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '1rem' }}>
                                Enter the 6-digit code sent to <strong>{phoneNumber}</strong>
                            </p>
                            {devcode && (
                                <div style={{background: 'var(--color-surface-alt)',border: '1px dashed var(--color-border)', borderRadius: '8px',padding: '0.5rem 0.75rem',marginBottom: '0.75rem',fontSize: '0.85rem'}}>
                                    <span style={{ opacity: 0.65 }}> Dev mode - your code:</span>
                                    <strong style={{ fontFamily: 'monospace', color: 'var(--color-interactive)', letterSpacing: '0.1em' }}>{devcode}</strong>
                                </div>
                            )}

                            <input  className="hopon-input" type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={e => setCode(e.target.value)}  required autoFocus  style={{ letterSpacing: '0.25em', fontSize: '1.3rem', textAlign: 'center' }}/>
                            
                            <button type="button"  onClick={() => { setStep(1); setError(''); setDevCode(''); setCode(''); }} style={{background: 'none', border: 'none', color: 'var(--color-interactive)', cursor: 'pointer', display: 'block',  margin: '0.9rem auto 0', fontSize: '0.88rem'}}>
                                Change number
                            </button>
                        </form>
                     )}
                </div>
            </div>
        );
}
