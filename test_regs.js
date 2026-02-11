const axios = require('axios');

// "Parking regulations (except non-metered color curb)"
const REGS_API_URL = 'https://data.sfgov.org/resource/gdc7-dmcn.json';

async function testRegs() {
    try {
        console.log("Testing Regulations dataset (gdc7-dmcn)...");
        // 20th and Mission: 37.7586, -122.4190 (Mission is commercial, likely meters)
        // Let's try 20th and Shotwell (Residential/Mixed): 37.7586, -122.4168
        const lat = 37.7586;
        const lon = -122.4168;

        const delta = 0.0005;
        const n = lat + delta;
        const s = lat - delta;
        const e = lon + delta;
        const w = lon - delta;

        // This dataset might use 'geometry' or 'the_geom' or 'shape'
        // Let's first inspect a single record to see the schema
        const schemaResp = await axios.get(`${REGS_API_URL}?$limit=1`);
        if (schemaResp.data.length > 0) {
            console.log("Sample Record:", JSON.stringify(schemaResp.data[0], null, 2));
        }

        // Try spatial query if shape field exists
        // Assuming 'shape' or similar based on previous experience, but let's check schema first output above.
        // I will optimistically try 'intersects(geometry, ...)' as that's common for these line datasets.

        // Actually, let's wait for the schema log. 
        // I'll just do a small query by street name to verify data content first.
        const streetResp = await axios.get(`${REGS_API_URL}?streetname=Shotwell&$limit=3`);
        console.log(`Found ${streetResp.data.length} records for Shotwell`);
        if (streetResp.data.length > 0) {
            console.log("Shotwell Record:", JSON.stringify(streetResp.data[0], null, 2));
        }

    } catch (error) {
        console.error("Regs Query failed:", error.response ? error.response.status : error.message);
    }
}

testRegs();
