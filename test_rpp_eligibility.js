const axios = require('axios');

// "Residential Parking Permit Eligibility Parcels"
const RPP_API_URL = 'https://data.sfgov.org/resource/i886-hxz9.json';

async function testRPPEligibility() {
    try {
        console.log("Testing RPP Eligibility (i886-hxz9)...");
        // 20th and Shotwell seems to be RPP Area I or Z.
        // Let's retry the spatial query using 'shape' or 'the_geom' or 'geometry'.
        // First, check one record to see schema.
        const schemaResp = await axios.get(`${RPP_API_URL}?$limit=1`);
        if (schemaResp.data.length > 0) {
            console.log("Sample Record:", JSON.stringify(schemaResp.data[0], null, 2));
        }

    } catch (error) {
        console.error("RPP Query failed:", error.response ? error.response.status : error.message);
    }
}

testRPPEligibility();
