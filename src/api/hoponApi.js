const BASE = '/api';
export const AUTH_FAILURE_EVENT = 'hopon:auth-failure';

async function request(method,path, {body, token} = {}){

    const headers = {};

    if(token)
        headers['Authorization'] = `Bearer ${token}`;
    
    if(body)
        headers['Content-Type'] = 'application/json';

    const res = await fetch(`${BASE}${path}`,{
        method,
        headers,
        body: body? JSON.stringify(body) : undefined
    });

    if (token && (res.status === 401 || res.status === 403)) {
        window.dispatchEvent(new CustomEvent(AUTH_FAILURE_EVENT, { detail: { token } }));
    }

    const text = await res.text();
    let data = null;
    if (text) {
        try { data = JSON.parse(text); }
        catch { data = text; }
    }

    if(!res.ok){
        const msg = typeof data === 'string' ? data : data?.message ?? `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return data;
    
}
    //Authentication
    export const requestOtp = (phoneNumber) => request ('POST', '/auth/otp/request', {body: {phoneNumber}});

    export const verifyOtp = (phoneNumber, code) =>request('POST', '/auth/otp/verify', {body :{phoneNumber,code}});

    export const getPassengerProfile = (token) => request('GET', '/auth/profile', { token });

    export const requestPhoneChange = (phoneNumber, token) =>
        request('POST', '/auth/phone-change/request', { body: { phoneNumber }, token });

    export const verifyPhoneChange = (phoneNumber, code, token) =>
        request('POST', '/auth/phone-change/verify', { body: { phoneNumber, code }, token });

    //Trip Data
    export const getMyTrips = (token) => request('GET', '/trips/my-trips', {token});

    export const getNotifications = (token) => request('GET', '/notifications/my', { token });

    export const getMapData = (tripId, token) => request('GET', `/trips/${tripId}/map-data`, {token});

    export const getBoardingStatus = (tripId, token) => request('GET', `/trips/${tripId}/boarding-status`, { token });
    export const boardTrip = (tripId, token) => request('POST', `/trips/${tripId}/board`, { token });
    export const alightTrip = (tripId, token) => request('POST', `/trips/${tripId}/alight`, { token });
    export const getTripHistory = (tripId, token) => request('GET', `/trips/${tripId}/history`, { token });
    export const getAccessCheck = (tripId, token) => request('GET', `/trips/${tripId}/access-check`, { token });

    // Emergency contact
    export const getEmergencyContact = (token) =>
        request('GET', '/emergency-contact', { token });

    export const upsertEmergencyContact = (name, phoneNumber, token) =>
        request('PUT', '/emergency-contact', { body: { name, phoneNumber }, token });

    export const deleteEmergencyContact = (token) =>
        request('DELETE', '/emergency-contact', { token });
