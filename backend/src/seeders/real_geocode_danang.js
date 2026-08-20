'use strict';

const https = require('https');
const models = require('../models');

/**
 * Clean up address string to extract clean street name for geocoding
 */
function extractStreetQuery(address, city = '') {
  if (!address) return '';
  // Remove house numbers at start, e.g. "99 Nguyễn Đình Thi" -> "Nguyễn Đình Thi", "241. Bế Văn Đàn" -> "Bế Văn Đàn"
  let clean = address
    .replace(/^[0-9]+[a-zA-Z0-9\/\-\.]*\s*/, '')
    .replace(/^số\s*[0-9]+[a-zA-Z0-9\/\-\.]*\s*/i, '')
    .replace(/^ngõ\s*[0-9]+[a-zA-Z0-9\/\-\.]*\s*/i, '')
    .replace(/^hẻm\s*[0-9]+[a-zA-Z0-9\/\-\.]*\s*/i, '')
    .replace(/^kiệt\s*[0-9]+[a-zA-Z0-9\/\-\.]*\s*/i, '')
    .replace(/^tầng\s*[0-9]+\s*[-–,]\s*/i, '')
    .trim();

  // Split by comma
  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return address;

  let street = parts[0];
  if (!street.toLowerCase().startsWith('đường') && !street.toLowerCase().startsWith('duong')) {
    street = 'Đường ' + street;
  }

  const cityName = city && !city.includes('Việt Nam') ? city : 'Đà Nẵng';
  return `${street}, ${cityName}`;
}

/**
 * Query Nominatim OpenStreetMap Geocoder with rate limiting
 */
function geocodeQuery(query) {
  return new Promise((resolve) => {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1';
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'SportHubAI_Geocoder/1.0 (contact@sporthub.vn)'
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              resolve({
                lat: Number(Number(parsed[0].lat).toFixed(6)),
                lng: Number(Number(parsed[0].lon).toFixed(6)),
                displayName: parsed[0].display_name
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

(async () => {
  try {
    console.log('[Real-Geocoder] Fetching Da Nang venues to update with exact street coordinates...');
    const daNangBranches = await models.Branch.findAll({
      where: models.sequelize.where(
        models.sequelize.fn('LOWER', models.sequelize.col('street_address')),
        { [models.Sequelize.Op.like]: '%đà nẵng%' }
      )
    });

    console.log(`[Real-Geocoder] Found ${daNangBranches.length} Da Nang branches.`);

    let successCount = 0;
    let fallbackCount = 0;

    for (let i = 0; i < daNangBranches.length; i++) {
      const b = daNangBranches[i];
      const query = extractStreetQuery(b.street_address, b.ward_district_city);

      let coords = await geocodeQuery(query);

      // If street query failed, try second part or ward
      if (!coords && b.street_address.includes(',')) {
        const parts = b.street_address.split(',');
        if (parts.length > 1) {
          const altQuery = `${parts[1].trim()}, Đà Nẵng`;
          coords = await geocodeQuery(altQuery);
        }
      }

      if (coords) {
        // Apply tiny micro-jitter (10-20 meters) based on house number hash so multiple venues on same street don't stack on exact same spot
        const houseHash = Math.abs((b.street_address || '').split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
        const angle = (houseHash % 360) * (Math.PI / 180);
        const dist = ((houseHash % 100) / 100) * 0.0004;

        const finalCoords = {
          lat: Number((coords.lat + dist * Math.cos(angle)).toFixed(6)),
          lng: Number((coords.lng + dist * Math.sin(angle)).toFixed(6))
        };

        b.geo_coordinates = JSON.stringify(finalCoords);
        await b.save();
        successCount++;
        console.log(`[${i + 1}/${daNangBranches.length}] [MATCH] ${b.street_address} -> ${JSON.stringify(finalCoords)} (${coords.displayName.slice(0, 50)}...)`);
      } else {
        fallbackCount++;
        console.log(`[${i + 1}/${daNangBranches.length}] [SKIP] ${b.street_address} (Query: ${query})`);
      }

      // 800ms delay to respect Nominatim API rate limit
      await new Promise((r) => setTimeout(r, 800));
    }

    console.log(`[Real-Geocoder] DONE! Successfully geocoded ${successCount} venues to exact street coordinates (${fallbackCount} skipped/kept).`);
    process.exit(0);
  } catch (err) {
    console.error('[Real-Geocoder Error]', err);
    process.exit(1);
  }
})();
