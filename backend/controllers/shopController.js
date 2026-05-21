// SERVICE SHOPS DISCOVERY CONTROLLER
// Handles listing hardware, plumbing, electrical, and material supplier shops nearby.

const db = require('../config/db');

// Retrieve all service shops with radial coordinates distance calculations
const getNearbyShops = async (req, res) => {
  const { latitude, longitude, category, maxDistance = 15 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and Longitude query parameters are required for shop search.' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const distLimit = parseFloat(maxDistance);

  try {
    let queryText = `
      SELECT 
        id, name, category, rating, phone, address, latitude, longitude, availability,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance
      FROM shops
      WHERE availability = 'Open'
    `;
    
    const params = [lat, lng];

    const result = await db.query(queryText, params);

    let shops = result.rows.map(s => ({
      ...s,
      rating: parseFloat(s.rating || 5.00),
      distance: s.distance ? parseFloat(s.distance) : parseFloat((Math.sqrt(Math.pow(s.latitude - lat, 2) + Math.pow(s.longitude - lng, 2)) * 111.32).toFixed(2))
    }));

    // Filter by category if requested
    if (category) {
      shops = shops.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by max distance
    shops = shops.filter(s => s.distance <= distLimit);

    // Sort by distance ascending
    shops.sort((a, b) => a.distance - b.distance);

    res.status(200).json(shops);
  } catch (error) {
    console.error('Nearby shops discovery error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve nearby service shops.' });
  }
};

module.exports = {
  getNearbyShops
};
