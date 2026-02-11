const axios = require('axios');

const REGS_API_URL = 'https://data.sfgov.org/resource/gdc7-dmcn.json';

async function testRegsSpatial() {
    try {
        console.log("Testing Regulations dataset spatial query...");
        // 20th and Shotwell (Residential/Mixed)
        const lat = 37.7586;
        const lon = -122.4168;

        const delta = 0.0005;
        const n = lat + delta;
        const s = lat - delta;
        const e = lon + delta;
        const w = lon - delta;

        // Dataset uses 'geometry' field (LineString)
        const poly = `POLYGON((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`;

        const url = `${REGS_API_URL}?$where=intersects(geometry, '${poly}')`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url);
        console.log(`Found ${response.data.length} records.`);

        response.data.forEach(r => {
            console.log(`- ${r.streetname} (${r.regulation}): ${r.days} ${r.from_time}-${r.to_time}`);
        });

    } catch (error) {
        console.error("Regs Spatial Query failed:", error.response ? error.response.data : error.message);
    }
}

testRegsSpatial();
