const axios = require('axios');

const METERS_API_URL = 'https://data.sfgov.org/resource/8vzz-qzz9.json';

// Near 20th and Shotwell (approx)
// Actually, let's use a location known to have meters, e.g., Mission St near 20th.
// 20th and Mission: 37.7586, -122.4190
const lat = 37.7586;
const lon = -122.4190;

async function testMetersSpatial() {
    try {
        console.log(`Testing meters spatial query...`);
        // Create a small bounding box
        const delta = 0.0005; // approx 50m
        const n = lat + delta;
        const s = lat - delta;
        const e = lon + delta;
        const w = lon - delta;

        // The meters dataset has a 'shape' column which is a Point.
        // SoQL within_box(shape, ...) might work or intersects(shape, POLYGON(...))

        const poly = `POLYGON((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`;
        const query = `\$where=intersects(shape, '${poly}')`;
        const url = `${METERS_API_URL}?${query}`;

        console.log(`URL: ${url}`);

        const response = await axios.get(url);
        console.log(`Found ${response.data.length} meters.`);
        if (response.data.length > 0) {
            const m = response.data[0];
            console.log("First meter:", m.street_name, m.cap_color, m.active_meter_flag);
        }
    } catch (error) {
        console.error("Query failed:", error.response ? error.response.data : error.message);
    }
}

testMetersSpatial();
