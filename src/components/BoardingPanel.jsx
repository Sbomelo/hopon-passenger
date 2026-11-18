import { formatDateTime } from '../utils/format.js';

export default function BoardingPanel({ status, onBoard, onAlight, busy, error }) {
    return (
        <section className="boarding-panel" aria-label="Boarding confirmation" aria-busy={busy}>
            <div className="boarding-panel__row">
                <div aria-live="polite">
                    <strong>{status?.hasAlighted ? 'Journey confirmed' : status?.hasBoarded ? 'You are on board' : 'Boarding'}</strong>
                    {status?.hasBoarded && <p>Boarded {formatDateTime(status.boardedAt)}</p>}
                    {status?.hasAlighted && <p>Left {formatDateTime(status.alightedAt)}</p>}
                    {!status && !error && <p>Loading boarding status…</p>}
                </div>
                {!status?.hasAlighted && <button className="hopon-btn" disabled={busy || (!status && !error)}
                    onClick={status?.hasBoarded ? onAlight : onBoard}>
                    {busy ? 'Please wait…' : !status ? 'Retry status' : status.hasBoarded ? "I've left the bus" : "I've boarded"}
                </button>}
            </div>
            {error && <p className="error-text" role="alert">{error}</p>}
        </section>
    );
}
