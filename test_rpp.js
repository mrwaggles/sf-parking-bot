const axios = require('axios');

// Trying "Residential Parking Permit Blocks" dataset
// Often available as a shapefile or geojson.
// Let's try searching for "Residential Parking Permit" on data.sfgov.org via Socrata discovery API if possible, or just guess common IDs from search results.
// Search result said "Residential Parking Permit Eligibility" is available.

const RPP_API_URL = 'https://data.sfgov.org/resource/qbyz-te2i.json'; // "Map of Parking Regulations" - let's retry this one carefully.
// If that failed, let's try finding the "Residential Parking Permit Zones" dataset. ID: `h2n9-q338` (This is a guess/common ID, but I should verify via search).

// Let's use the search result from the previous step which might give a better ID.
// Actually, I'll just try to query the "Parking Regulations" again but check for 'regulation' column.

async function testRPP() {
    try {
        console.log("Testing RPP dataset...");
        // 20th and Mission: 37.7586, -122.4190
        const lat = 37.7586;
        const lon = -122.4190;

        // Bounding box
        const delta = 0.0005;
        const n = lat + delta;
        const s = lat - delta;
        const e = lon + delta;
        const w = lon - delta;
        const poly = `POLYGON((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`;

        // Trying qbyz-te2i with spatial query
        const url = `${RPP_API_URL}?$where=intersects(shape, '${poly}')`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url);
        console.log(`Found ${response.data.length} regs.`);
        if (response.data.length > 0) {
            console.log(JSON.stringify(response.data[0], null, 2));
        }
    } catch (error) {
        console.error("RPP Query failed:", error.response ? error.response.status : error.message);
    }
}

testRPP();
