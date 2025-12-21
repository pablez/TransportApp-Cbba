const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const ORS_BASE = process.env.ORS_BASE || 'https://api.openrouteservice.org';

// Prefer secret from functions config: `firebase functions:config:set ors.key="KEY"`
let ORS_KEY = process.env.ORS_API_KEY || null;
try {
  const cfg = functions && functions.config && functions.config();
  if (!ORS_KEY && cfg && cfg.ors && cfg.ors.key) {
    ORS_KEY = cfg.ors.key;
  }
} catch (e) {
  // ignore when functions.config() not available in local env
}

if (!ORS_KEY) console.warn('⚠️ ORS proxy: ORS_API_KEY not set (set with `firebase functions:config:set ors.key="YOUR_KEY"` or env var).');

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Root info - helpful when opening in browser
app.get('/', (req, res) => {
  res.type('application/json').send(JSON.stringify({ service: 'ors-proxy', status: 'running' }));
});

// Respond to .well-known requests (Chrome DevTools / other agents) with no content
app.get('/.well-known/*', (req, res) => {
  res.status(204).end();
});

// Proxy for directions (geojson)
// POST /directions/:profile
// Body: { coordinates: [[lng,lat],[lng,lat], ...], ...options }
app.post('/directions/:profile', async (req, res) => {
  try {
    if (!ORS_KEY) return res.status(500).json({ error: 'ORS_API_KEY not configured' });

    const profile = req.params.profile || 'driving-car';
    const url = `${ORS_BASE}/v2/directions/${encodeURIComponent(profile)}/geojson`;

    const body = req.body || {};

    // Normalize legacy coordinate formats.
    // Accepts:
    // - { coordinates: [[lng,lat], [lng,lat], ...] }
    // - { coordinates: [{ lat: .., lng: .. }, { lat:.., lng:.. }, ...] }
    let coords = body.coordinates;
    if (Array.isArray(coords) && coords.length > 0 && typeof coords[0] === 'object' && !Array.isArray(coords[0])) {
      // convert array of objects like {lat, lng} or {lat, lon} or {latitude, longitude}
      coords = coords.map(pt => {
        if (!pt) return null;
        const lat = pt.lat !== undefined ? pt.lat : pt.latitude !== undefined ? pt.latitude : null;
        const lng = pt.lng !== undefined ? pt.lng : pt.lon !== undefined ? pt.lon : pt.longitude !== undefined ? pt.longitude : null;
        if (lat === null || lng === null) return null;
        return [Number(lng), Number(lat)];
      });
    }

    // Validate final coordinates array
    if (!Array.isArray(coords) || coords.length < 2 || coords.some(c => !Array.isArray(c) || c.length < 2 || Number.isNaN(Number(c[0])) || Number.isNaN(Number(c[1])))) {
      return res.status(400).json({
        error: 'coordinates array with at least two [lng,lat] points required',
        note: 'Accepted formats: coordinates:[[lng,lat],...] or coordinates:[{lat:..,lng:..},...]',
        receivedSample: Array.isArray(body.coordinates) ? body.coordinates.slice(0,3) : body.coordinates
      });
    }

    // Replace body.coordinates with normalized coords to forward to ORS
    body.coordinates = coords;

    // Remove any client-provided 'format' hints that ORS may reject
    if (body && typeof body === 'object') {
      delete body.format;
      delete body.geometry_format;
    }

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': ORS_KEY,
        'Content-Type': 'application/json',
        // Ask explicitly for GeoJSON (safe fallback to JSON)
        'Accept': 'application/geo+json, application/json'
      },
      body: JSON.stringify(body)
    };

    // Log outgoing request to ORS for debugging
    console.log('ORS proxy -> POST', url);
    // Avoid printing full key in logs, but show masked form
    const safeHeaders = Object.assign({}, fetchOptions.headers);
    if (safeHeaders.Authorization) {
      safeHeaders.Authorization = String(safeHeaders.Authorization).slice(0,6) + '...[REDACTED]';
    }
    console.log('ORS proxy -> headers', safeHeaders);
    console.log('ORS proxy -> body sample', JSON.stringify(body).slice(0,1000));

    const upstream = await fetch(url, fetchOptions);
    const text = await upstream.text();
    res.status(upstream.status).type('application/json').send(text);
  } catch (err) {
    console.error('ORS proxy error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Proxy for map tiles
// GET /tiles/:z/:x/:y(.ext)
// Configure the template via env `ORS_TILES_URL`, e.g.
// "https://api.openrouteservice.org/mapsurfer/tiles/v2/{z}/{x}/{y}.png" or any provider
// If template contains "{api_key}" it will be replaced with ORS_API_KEY; otherwise
// the proxy will send `Authorization: ORS_API_KEY` header when available.
app.get('/tiles/:z/:x/:y.:ext?', async (req, res) => {
  try {
    const { z, x, y, ext } = req.params;
    const template = process.env.ORS_TILES_URL || null;
    if (!template) return res.status(500).json({ error: 'ORS_TILES_URL not configured' });

    let tileUrl = template.replace(/\{z\}/g, z).replace(/\{x\}/g, x).replace(/\{y\}/g, y);
    if (ext) tileUrl = tileUrl.replace(/\{ext\}/g, ext);

    // If template contains {api_key} replace it; otherwise we'll add Authorization header
    const needsApiKeyInUrl = /\{api_key\}/.test(tileUrl);
    if (needsApiKeyInUrl) {
      tileUrl = tileUrl.replace(/\{api_key\}/g, ORS_KEY || '');
    }

    const headers = {};
    if (!needsApiKeyInUrl && ORS_KEY) headers['Authorization'] = ORS_KEY;

    console.log('ORS proxy -> tile request', tileUrl);

    const upstream = await fetch(tileUrl, { method: 'GET', headers });
    if (!upstream.ok) {
      const text = await upstream.text();
      console.warn('ORS tile upstream error', upstream.status, text.slice(0,200));
      return res.status(upstream.status).type('text/plain').send(text);
    }

    // Forward content-type and caching headers
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    // Allow caching for tiles
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await upstream.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('ORS tile proxy error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Try to export as Firebase Function if available; otherwise run standalone for local testing
let exportedAsFunction = false;
try {
  if (functions && typeof functions.runWith === 'function' && functions.https && typeof functions.https.onRequest === 'function') {
    exports.orsProxy = functions.runWith({ memory: '256MB', timeoutSeconds: 30 }).https.onRequest(app);
    exportedAsFunction = true;
  }
} catch (e) {
  // ignore and fallback to standalone
}

if (!exportedAsFunction) {
  // Fallback: export the express app and, when run directly, start a local server
  module.exports = app;
  if (require.main === module) {
    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`ORS proxy (standalone) listening on ${port}`));
  }
}

