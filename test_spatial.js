const axios = require('axios');

const SOCRATA_API_URL = 'https://data.sfgov.org/resource/yhqp-riqs.json';

// Near 20th and Shotwell
const lat = 37.75883;
const lon = -122.41578;
const radius = 50; // meters

async function testSpatial() {
    try {
        console.log(`Testing within_circle(line, ${lat}, ${lon}, ${radius})...`);
        const query = `\$where=within_circle(line, ${lat}, ${lon}, ${radius})`;
        const url = `${SOCRATA_API_URL}?${query}`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url);
        console.log(`Found ${response.data.length} records.`);
        if (response.data.length > 0) {
            console.log("First record:", response.data[0].corridor, response.data[0].limits);
        }
    } catch (error) {
        console.error("within_circle failed:", error.response ? error.response.data : error.message);

        // Try intersects with a small point (this is unlikely to work for LineString unless exact, 
        // but maybe Socrata supports intersects(line, point))
        // Actually, let's try intersects with a tiny buffer if possible, but constructing a Polygon WKT is annoying.
        // Let's just see if within_circle works first.
    }
}

testSpatial();
