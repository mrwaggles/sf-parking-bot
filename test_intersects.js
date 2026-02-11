const axios = require('axios');

const SOCRATA_API_URL = 'https://data.sfgov.org/resource/yhqp-riqs.json';

// Near 20th and Shotwell
const lat = 37.75883;
const lon = -122.41578;

async function testIntersects() {
    try {
        console.log(`Testing intersects(line, 'POINT(...)')...`);
        // Note: Socrata WKT is POINT(lon lat)
        const pointWKT = `POINT(${lon} ${lat})`;
        const query = `\$where=intersects(line, '${pointWKT}')`;
        const url = `${SOCRATA_API_URL}?${query}`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url);
        console.log(`Found ${response.data.length} records.`);
        if (response.data.length > 0) {
            console.log("First record:", response.data[0].corridor, response.data[0].limits);
        }
    } catch (error) {
        console.error("intersects failed:", error.response ? error.response.data : error.message);
    }
}

testIntersects();
