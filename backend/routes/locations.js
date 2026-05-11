const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/locations/nearby?lat=xx&lon=xx&radius=5000
router.get('/nearby', (req, res) => {
  try {
    const { lat, lon, radius = 5000 } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ code: 400, msg: 'lat and lon required' });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusM = parseInt(radius);

    // Haversine: 1 degree lat ≈ 111km
    const latDelta = radiusM / 111000;
    const lonDelta = radiusM / (111000 * Math.cos(latNum * Math.PI / 180));

    const rows = db.prepare(`
      SELECT id, user_id, drink_type, drink_name, location_name,
             latitude, longitude, created_at
      FROM drink_records
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude  BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(latNum - latDelta, latNum + latDelta, lonNum - lonDelta, lonNum + lonDelta);

    // filter precise distance in meters
    const withDist = rows.filter(r => {
      const d = haversine(latNum, lonNum, r.latitude, r.longitude);
      return d <= radiusM;
    });

    res.json({ code: 0, data: withDist });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

module.exports = router;
