const BASE = '/api';

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

    const data = await res.json().catch(() => null);

    if(!res.ok){
        const msg = typeof data === 'string' ? data : data?.message ?? `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return data;
    
}
    //Authentication
    export const requestOtp = (phoneNumber) => request ('POST', '/auth/otp/request', {body: {phoneNumber}});

    export const verifyOtp = (phoneNumber, code) =>request('POST', '/auth/otp/verify', {body :{phoneNumber,code}});

    //Trip Data
    export const getMyTrips = (token) => request('GET', '/trips/my-trips', {token});

    export const getMapData = (tripId, token) => request('GET', `/trips/${tripId}/map-data`, {token});

    // Emergency contact
    export const getEmergencyContact = (token) =>
        request('GET', '/emergency-contact', { token });

    export const upsertEmergencyContact = (name, phoneNumber, token) =>
        request('PUT', '/emergency-contact', { body: { name, phoneNumber }, token });

    export const deleteEmergencyContact = (token) =>
        request('DELETE', '/emergency-contact', { token });