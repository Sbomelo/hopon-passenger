const OFF_ROUTE_KM = 0.2;
const BACK_ON_ROUTE_KM = 0.12;
const MAX_FIX_GAP_MS = 90_000;

export const toRad = degrees => degrees * Math.PI / 180;

export function haversineKm([lng1, lat1], [lng2, lat2]) {
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function projectOntoRoute(coords, point, startSegment = 0) {
    const longitudeScale = Math.cos(toRad(point[1]));
    let nearest = null;

    for (let segment = startSegment; segment < coords.length - 1; segment++) {
        const [fromLng, fromLat] = coords[segment];
        const [toLng, toLat] = coords[segment + 1];
        const dx = (toLng - fromLng) * longitudeScale;
        const dy = toLat - fromLat;
        const lengthSquared = dx * dx + dy * dy;
        const dot = (point[0] - fromLng) * longitudeScale * dx + (point[1] - fromLat) * dy;
        const fraction = lengthSquared ? Math.max(0, Math.min(1, dot / lengthSquared)) : 0;
        const coordinate = [fromLng + (toLng - fromLng) * fraction, fromLat + dy * fraction];
        const distance = haversineKm(point, coordinate);
        if (!nearest || distance < nearest.distance) nearest = { segment, coordinate, fraction, distance };
    }

    return nearest;
}

export function updateLiveRoute(previous, plannedCoords, fixes) {
    const route = previous ?? {
        path: plannedCoords, drawnPath: plannedCoords, position: null, candidate: null, detour: null,
        lastFixAt: -Infinity, firstSegment: 0,
    };

    let next = route;
    for (const fix of fixes) {
        const recordedAt = Date.parse(fix.recordedAt);
        if (!(recordedAt > next.lastFixAt)) continue;
        const point = [fix.longitude, fix.latitude];
        const projection = projectOntoRoute(next.path, point, next.firstSegment);

        if (next.detour && projection.distance <= BACK_ON_ROUTE_KM) {
            const traveled = [...next.drawnPath, projection.coordinate];
            const path = [...traveled, ...next.path.slice(projection.segment + 1)];
            const firstSegment = traveled.length - 1;
            next = { ...next, path, drawnPath: path, firstSegment, detour: null, candidate: null,
                position: { segment: firstSegment, fraction: 0 }, lastFixAt: recordedAt };
        } else if (next.detour) {
            const distance = next.detour.distance + haversineKm(next.drawnPath.at(-1), point);
            next = { ...next, drawnPath: [...next.drawnPath, point], detour: { distance }, lastFixAt: recordedAt };
        } else if (projection.distance <= OFF_ROUTE_KM) {
            next = { ...next, position: projection, candidate: null, lastFixAt: recordedAt };
        } else if (next.candidate && recordedAt - next.lastFixAt <= MAX_FIX_GAP_MS) {
            const departure = next.position ?? next.candidate.projection;
            const prefix = next.path.slice(0, departure.segment + 1);
            const drawnPath = [...prefix, departure.coordinate, next.candidate.point, point];
            const distance = haversineKm(departure.coordinate, next.candidate.point) + haversineKm(next.candidate.point, point);
            next = { ...next, drawnPath, position: departure, detour: { distance }, candidate: null, lastFixAt: recordedAt };
        } else {
            next = { ...next, candidate: { point, projection }, lastFixAt: recordedAt };
        }
    }

    return next;
}
