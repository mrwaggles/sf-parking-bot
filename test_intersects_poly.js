const axios = require('axios');
const geolib = require('geolib'); // We'll need to install this: npm install geolib

const SOCRATA_API_URL = 'https://data.sfgov.org/resource/yhqp-riqs.json';

// Near 20th and Shotwell
const lat = 37.75883;
const lon = -122.41578;
const radius = 50; // meters

async function testBox() {
    try {
        console.log(`Testing within_box...`);
        // Create a bounding box roughly +/- 0.001 degrees (approx 100m)
        const delta = 0.001;
        const n = lat + delta;
        const s = lat - delta;
        const e = lon + delta;
        const w = lon - delta;

        // SoQL within_box(line, num_lat_nw, num_lon_nw, num_lat_se, num_lon_se)
        // Wait, line is a LineString. docs say Point. But let's try. 
        // If not, we download all data (it's small? 54k rows?) No, likely too big.

        // Actually, let's try to search by street name from reverse geocoding if spatial fails.
        // But for this test, let's try formatting a LINESTRING query or just use the intersects with a POLYGON buffer.

        // Let's try intersects with a buffer polygon (WKT).
        // Construct a small square around the point.
        const poly = `POLYGON((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`;

        const query = `\$where=intersects(line, '${poly}')`;
        const url = `${SOCRATA_API_URL}?${query}`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url);
        console.log(`Found ${response.data.length} records.`);
        if (response.data.length > 0) {
            console.log("First record:", response.data[0].corridor, response.data[0].limits);
        }
    } catch (error) {
        console.error("Query failed:", error.response ? error.response.data : error.message);
    }
}

testBox();
