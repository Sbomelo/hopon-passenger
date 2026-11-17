import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLES } from './mapStyles.js';
import { formatTime } from '../utils/format.js';
import './TripMap.css';

const OPERATOR_LABEL = 'Intercape'; // no Operator in the data model yet, demo-only constant
const GLIDE_MS = 1500;              // how long the bus takes to slide to a new GPS fix
const FOLLOW_ZOOM = 10.5;
const FIT_PADDING = { top: 90, bottom: 270, left: 50, right: 50 };


//  Geometry helpers (all points are [lng, lat])                             

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

function haversineKm([lng1, lat1], [lng2, lat2]) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function bearingDeg([lng1, lat1], [lng2, lat2]) {
    const p1 = toRad(lat1);
    const p2 = toRad(lat2);
    const dl = toRad(lng2 - lng1);
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const orderStops = (stops) => [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

function nearestVertex(coords, point) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < coords.length; i++) {
        const d = haversineKm(coords[i], point);
        if (d < bestD) {
            bestD = d;
            best = i;
        }
    }
    return best;
}

// cum[i] = km travelled along the road up to vertex i. stopDist[i] = where stop i sits on that scale.
function buildRoute(coords, stops) {
    const cum = [0];
    for (let i = 1; i < coords.length; i++) {
        cum.push(cum[i - 1] + haversineKm(coords[i - 1], coords[i]));
    }
    const stopDist = stops.map((s) => cum[nearestVertex(coords, [s.longitude, s.latitude])]);
    return { coords, cum, total: cum[cum.length - 1], stopDist };
}

// Where is the bus along the route, which stops has it passed, and which is next?
function locateBus(route, stops, busPosition) {
    const here = [busPosition.longitude, busPosition.latitude];
    const km = route.cum[nearestVertex(route.coords, here)];
    const nextIdx = route.stopDist.findIndex((d) => d > km + 0.5);
    const passedCount = nextIdx === -1 ? stops.length : nextIdx;

    return {
        progress: route.total > 0 ? km / route.total : 0,
        remainingKm: Math.max(0, Math.round(route.total - km)),
        passedCount,
        nextStop: stops[Math.min(passedCount, stops.length - 1)].name,
    };
}

//  Road route (free OSRM demo server, cached, falls back to straight lines) 

async function fetchRoadRoute(stops, signal) {
    const waypoints = stops.map((s) => `${s.longitude},${s.latitude}`).join(';');
    const cacheKey = `hopon-route:${waypoints}`;

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch {
        // storage blocked or corrupt entry: carry on and fetch
    }

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`OSRM ${res.status}`);
        const json = await res.json();
        const coords = json.routes?.[0]?.geometry?.coordinates;
        if (!coords?.length) throw new Error('OSRM returned no geometry');

        try {
            localStorage.setItem(cacheKey, JSON.stringify(coords));
        } catch {
            // storage full: not fatal
        }
        return coords;
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        console.warn('Road routing failed, using straight lines between stops:', err);
        return stops.map((s) => [s.longitude, s.latitude]);
    }
}

// Map layers                                                               

// MapLibre cannot read CSS variables itself, so we resolve the Hopon tokens to real colours here.
function readColors(el) {
    const cs = getComputedStyle(el);
    const v = (name) => cs.getPropertyValue(name).trim();
    return { todo: v('--map-route'), done: v('--map-route-done'), casing: v('--map-route-casing') };
}

const gradient = (colors, p) => [
    'step',
    ['line-progress'],
    colors.done,
    Math.min(Math.max(p, 0.0001), 0.9999),
    colors.todo,
];

function addRouteLayers(map, route, colors, progress) {
    if (map.getSource('route')) return;

    map.addSource('route', {
        type: 'geojson',
        lineMetrics: true,
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: route.coords } },
    });

    const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;

    map.addLayer(
        {
            id: 'route-casing',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': colors.casing,
                'line-width': ['interpolate', ['linear'], ['zoom'], 5, 8, 12, 17],
            },
        },
        firstSymbol,
    );

    map.addLayer(
        {
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-width': ['interpolate', ['linear'], ['zoom'], 5, 5, 12, 11],
                'line-gradient': gradient(colors, progress),
            },
        },
        firstSymbol,
    );
}

function fitToStops(map, stops, animate) {
    if (stops.length === 0) return;
    const first = [stops[0].longitude, stops[0].latitude];
    const bounds = stops.reduce(
        (b, s) => b.extend([s.longitude, s.latitude]),
        new maplibregl.LngLatBounds(first, first),
    );
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: 12, duration: animate ? 1000 : 0 });
}

//Component

export default function TripMap({ stops, busPosition, routeName, status, styleKey, onStyleChange, children }) {
    // Refs: values the effects and the animation loop share without causing re-renders.
    const wrapRef = useRef(null);
    const mapElRef = useRef(null);
    const mapRef = useRef(null);
    const busRef = useRef(null);
    const busOnMapRef = useRef(false);
    const stopMarkersRef = useRef([]);
    const styleReadyRef = useRef(false);
    const appliedStyleRef = useRef(styleKey);
    const progressRef = useRef(0);
    const displayedRef = useRef(null);      // where the bus is drawn right now
    const glideRef = useRef(null);          // { from, to, start } while sliding to a new fix
    const headingTargetRef = useRef(0);
    const followRef = useRef(false);

    const [route, setRoute] = useState(null);
    const [follow, setFollow] = useState(false);

    /* 1. Create the map once and run the animation loop */
    useEffect(() => {
        const map = new maplibregl.Map({
            container: mapElRef.current,
            style: MAP_STYLES[appliedStyleRef.current].url,
            center: [29.5, -28],
            zoom: 5,
            attributionControl: { compact: true },
        });
        mapRef.current = map;
        styleReadyRef.current = false;

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(
            new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
            }),
            'top-right',
        );

        const busEl = document.createElement('div');
        busEl.className = 'tm-bus';
        busEl.innerHTML = `
            <span class="tm-bus__pulse"></span>
            <span class="tm-bus__core">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M12 3l7 17-7-4-7 4z" fill="currentColor"/>
                </svg>
            </span>`;
        const bus = new maplibregl.Marker({ element: busEl, rotationAlignment: 'map' });
        busRef.current = bus;
        busOnMapRef.current = false;

        // Fires after the first style AND after every setStyle().
        map.on('style.load', () => {
            styleReadyRef.current = true;
        });

        // originalEvent exists only for real user input, not for our own jumpTo calls.
        map.on('movestart', (e) => {
            if (e.originalEvent) setFollow(false);
        });

        // rAF loop: slides the bus between GPS fixes, smooths its heading, and drives Follow mode.
        let raf = 0;
        let heading = 0;

        const tick = (now) => {
            const glide = glideRef.current;
            if (glide) {
                const t = Math.min(Math.max((now - glide.start) / GLIDE_MS, 0), 1);
                const pos = [
                    glide.from[0] + (glide.to[0] - glide.from[0]) * t,
                    glide.from[1] + (glide.to[1] - glide.from[1]) * t,
                ];
                displayedRef.current = pos;
                bus.setLngLat(pos);
                if (t === 1) glideRef.current = null;
            }

            // Turn toward the target heading by the shortest angle so turns look smooth.
            const diff = ((headingTargetRef.current - heading + 540) % 360) - 180;
            if (Math.abs(diff) > 0.1) {
                heading = (heading + diff * 0.12 + 360) % 360;
                bus.setRotation(heading);
            }

            if (followRef.current && displayedRef.current) {
                const z = map.getZoom();
                map.jumpTo({ center: displayedRef.current, zoom: z + (FOLLOW_ZOOM - z) * 0.06 });
            }

            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            bus.remove();
            map.remove();
            mapRef.current = null;
            busRef.current = null;
            busOnMapRef.current = false;
            displayedRef.current = null;
            glideRef.current = null;
            styleReadyRef.current = false;
        };
    }, []);

    /* 2. Keep the loop's copy of "follow" in sync with the state */
    useEffect(() => {
        followRef.current = follow;
    }, [follow]);

    /* 3. Basemap switch */
    useEffect(() => {
        const map = mapRef.current;
        if (!map || appliedStyleRef.current === styleKey) return;
        appliedStyleRef.current = styleKey;
        styleReadyRef.current = false;
        // diff:false forces a full reload so 'style.load' reliably fires and the route can be re-added.
        map.setStyle(MAP_STYLES[styleKey].url, { diff: false });
    }, [styleKey]);

    /* 4. Stop markers + initial framing */
    useEffect(() => {
        const map = mapRef.current;
        const ordered = orderStops(stops);
        if (!map || ordered.length === 0) return;

        stopMarkersRef.current = ordered.map((s, i) => {
            const el = document.createElement('div');
            el.className = 'tm-stop' + (i === 0 || i === ordered.length - 1 ? ' tm-stop--end' : '');
            const dot = document.createElement('span');
            dot.className = 'tm-stop__dot';
            const label = document.createElement('span');
            label.className = 'tm-stop__label';
            label.textContent = s.name; // textContent, not innerHTML: names now come from the database
            el.append(dot, label);

            return new maplibregl.Marker({ element: el, anchor: 'left', offset: [-7, 0] })
                .setLngLat([s.longitude, s.latitude])
                .addTo(map);
        });

        fitToStops(map, ordered, false);

        return () => {
            stopMarkersRef.current.forEach((m) => m.remove());
            stopMarkersRef.current = [];
        };
    }, [stops]);

    /* 5. Fetch the road geometry between the stops */
    useEffect(() => {
        const ordered = orderStops(stops);
        if (ordered.length < 2) return;

        const ctrl = new AbortController();
        fetchRoadRoute(ordered, ctrl.signal)
            .then((coords) => setRoute(buildRoute(coords, ordered)))
            .catch((err) => {
                if (err.name !== 'AbortError') console.error(err);
            });

        return () => ctrl.abort();
    }, [stops]);

    /* 6. Draw the route, and re-draw it after every basemap switch (setStyle wipes custom layers) */
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !route) return;

        const draw = () =>
            addRouteLayers(map, route, readColors(wrapRef.current), progressRef.current);

        if (styleReadyRef.current) draw();
        map.on('style.load', draw);
        return () => map.off('style.load', draw);
    }, [route]);

    /* 7. New GPS fix -> glide the bus to it */
    useEffect(() => {
        const map = mapRef.current;
        const bus = busRef.current;
        if (!map || !bus || !busPosition) return;

        const to = [busPosition.longitude, busPosition.latitude];
        const from = displayedRef.current ?? to;

        if (!busOnMapRef.current) {
            bus.setLngLat(to).addTo(map);
            busOnMapRef.current = true;
        }
        if (haversineKm(from, to) > 0.02) headingTargetRef.current = bearingDeg(from, to);

        glideRef.current = { from, to, start: performance.now() };
    }, [busPosition]);

    /* Progress along the route is derived from the latest GPS fix, a plain calculation in render */
    const orderedStops = orderStops(stops);
    const trip = route && busPosition ? locateBus(route, orderedStops, busPosition) : null;
    const progress = trip?.progress ?? 0;
    const passedCount = trip?.passedCount ?? 0;

    /* 8. Recolour the travelled part of the route + dim passed stops */
    useEffect(() => {
        progressRef.current = progress;
        if (!route) return;

        const map = mapRef.current;
        if (styleReadyRef.current && map?.getLayer('route-line')) {
            map.setPaintProperty(
                'route-line',
                'line-gradient',
                gradient(readColors(wrapRef.current), progress),
            );
        }
        stopMarkersRef.current.forEach((m, i) =>
            m.getElement().classList.toggle('is-passed', i < passedCount),
        );
    }, [progress, passedCount, route]);

    const isLive = status === 'Scheduled' || status === 'InProgress' || status === 'Delayed';
    const lastUpdate = busPosition
        ? formatTime(busPosition.recordedAt)
        : null;

    return (
        <div ref={wrapRef} className="tm-wrap">
            <div ref={mapElRef} className="tm-map" />

            <div className="tm-styles" role="group" aria-label="Map style">
                {Object.entries(MAP_STYLES).map(([key, s]) => (
                    <button
                        key={key}
                        type="button"
                        className={'tm-chip' + (key === styleKey ? ' is-active' : '')}
                        onClick={() => onStyleChange(key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="tm-bottom">
                {children}
            <section className="tm-card">
                <header className="tm-card__head">
                    <div>
                        <span className="tm-card__eyebrow">
                            {OPERATOR_LABEL} · {isLive ? 'Live' : 'Ended'}
                        </span>
                        <h2 className="tm-card__title">{routeName}</h2>
                    </div>
                    {status === 'Delayed' && <span className="tm-badge tm-badge--delayed">Delayed</span>}
                </header>

                <div className="tm-progress">
                    <div className="tm-progress__bar" style={{ width: `${progress * 100}%` }} />
                </div>

                <div className="tm-card__row">
                    <div>
                        <small>Next stop</small>
                        <strong>{trip ? trip.nextStop : '—'}</strong>
                    </div>
                    <div>
                        <small>Remaining</small>
                        <strong>{trip ? `${trip.remainingKm} km` : '—'}</strong>
                    </div>
                </div>

                <p className="tm-card__foot">
                    {lastUpdate ? `Last GPS update ${lastUpdate}` : 'Waiting for bus location…'}
                </p>

                <div className="tm-card__actions">
                    <button
                        type="button"
                        className="tm-btn"
                        onClick={() => {
                            setFollow(false);
                            fitToStops(mapRef.current, orderedStops, true);
                        }}
                    >
                        Whole route
                    </button>
                    <button
                        type="button"
                        disabled={!busPosition}
                        className={'tm-btn tm-btn--primary' + (follow ? ' is-on' : '')}
                        onClick={() => setFollow((f) => !f)}
                    >
                        {follow ? 'Following bus' : 'Follow bus'}
                    </button>
                </div>
            </section>
            </div>
        </div>
    );
}
