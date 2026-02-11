const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const SOCRATA_API_URL = 'https://data.sfgov.org/resource/yhqp-riqs.json'; // Street Cleaning
const METERS_API_URL = 'https://data.sfgov.org/resource/8vzz-qzz9.json';   // Parking Meters
const RRP_API_URL = 'https://data.sfgov.org/resource/i886-hxz9.json';      // RPP Eligibility (Proxy)
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

app.post('/api/sms', async (req, res) => {
    const { message, latitude, longitude } = req.body;
    console.log(`Received message: ${message}, coords: ${latitude}, ${longitude}`);

    if (!message && (!latitude || !longitude)) {
        return res.status(400).json({ reply: "Please send a location or use your current location." });
    }

    try {
        let lat = latitude;
        let lon = longitude;
        let searchAddress = message;

        // Geocoding Logic
        if (!lat || !lon) {
            const cleanQuery = message
                .replace(/i'm parked (at|on)/i, '')
                .replace(/street cleaning/i, '')
                .trim();

            if (!cleanQuery.toLowerCase().includes('san francisco')) {
                searchAddress = `${cleanQuery}, San Francisco, CA`;
            } else {
                searchAddress = cleanQuery;
            }

            console.log(`Geocoding: ${searchAddress}`);
            const geoResponse = await axios.get(NOMINATIM_API_URL, {
                params: {
                    q: searchAddress,
                    format: 'json',
                    limit: 1
                },
                headers: { 'User-Agent': 'StreetCleaningBot/1.0' }
            });

            if (geoResponse.data.length > 0) {
                lat = parseFloat(geoResponse.data[0].lat);
                lon = parseFloat(geoResponse.data[0].lon);
                console.log(`Geocoded to: ${lat}, ${lon}`);
            } else {
                // Fallback for failed geocoding (basic text search)
                return await textSearch(cleanQuery, res);
            }
        }

        if (lat && lon) {
            const delta = 0.0005; // ~50m box
            const n = lat + delta;
            const s = lat - delta;
            const e = lon + delta;
            const w = lon - delta;

            const poly = `POLYGON((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`;

            // 1. Street Cleaning
            const cleaningPromise = axios.get(SOCRATA_API_URL, {
                params: { '$where': `intersects(line, '${poly}')` }
            });

            // 2. Parking Meters
            const metersPromise = axios.get(METERS_API_URL, {
                params: { '$where': `intersects(shape, '${poly}')` }
            });

            // 3. RPP Eligibility
            const rppPromise = axios.get(RRP_API_URL, {
                params: { '$where': `intersects(shape, '${poly}')` }
            });

            const [cleaningResp, metersResp, rppResp] = await Promise.all([cleaningPromise, metersPromise, rppPromise]);
            const cleaningData = cleaningResp.data;
            const metersData = metersResp.data;
            const rppData = rppResp.data;

            // Analysis
            const now = new Date();
            const currentDay = now.toLocaleString('en-US', { weekday: 'short' });
            const currentHour = now.getHours();

            // Check Cleaning
            let cleaningActive = false;
            let cleaningSoon = false;
            let nearbyCleaning = [];

            cleaningData.forEach(r => {
                const recDay = r.weekday === 'Tues' ? 'Tue' : r.weekday;
                const from = parseInt(r.fromhour);
                const to = parseInt(r.tohour);

                // Use 'limits' for cross streets as requested
                nearbyCleaning.push(`${r.corridor} (${r.limits}): ${recDay} ${r.fromhour}-${r.tohour}`);

                if (recDay === currentDay) {
                    if (currentHour >= from && currentHour < to) cleaningActive = true;
                    if (currentHour < from && (from - currentHour) <= 2) cleaningSoon = true;
                }
            });

            // Check Meters
            const meterNearby = metersData.length > 0;

            // Check RPP
            let rppArea = null;
            if (rppData.length > 0) {
                // Look for the first non-null eligibility
                const rppRecord = rppData.find(r => r.rppeligib && r.rppeligib !== 'N/A');
                if (rppRecord) rppArea = rppRecord.rppeligib;
            }

            // Construct Response
            let status = "YES";
            let color = "green";
            let mainMessage = "Parking allowed right now.";
            let rules = [];

            // 1. Evaluate Immediate Status
            if (cleaningActive) {
                status = "NO";
                color = "red";
                mainMessage = "Street cleaning is active!";
            } else if (cleaningSoon) {
                status = "NO";
                color = "orange"; // Warning
                mainMessage = "Cleaning starts soon (< 2 hrs).";
            } else if (meterNearby) {
                status = "PAY";
                color = "blue";
                mainMessage = "Metered parking.";
            }

            // 2. Build Rules List
            if (meterNearby) {
                rules.push("🅿️ Metered Parking: Check meter for rates & limits.");
            }
            if (rppArea) {
                rules.push(`🏠 RPP Area ${rppArea}: 2-hour limit unless you have a permit.`);
            } else if (!meterNearby) {
                rules.push("✅ No RPP/Meters found (General parking).");
            }

            rules.push("🚗 72-hour limit applies to all street parking.");

            res.json({
                status: status,
                statusColor: color,
                title: mainMessage,
                rules: rules,
                cleaning: nearbyCleaning.length > 0 ? nearbyCleaning : ["No cleaning schedules found nearby."]
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ reply: "Sorry, I had trouble checking the status." });
    }
});

async function textSearch(query, res) {
    const response = await axios.get(SOCRATA_API_URL, {
        params: { '$q': query, '$limit': 5 }
    });

    const data = response.data;
    if (data.length === 0) {
        return res.json({ reply: "I couldn't find any cleaning schedules." });
    }

    const schedules = data.map(r => `${r.corridor} (${r.limits}): ${r.weekday} ${r.fromhour}-${r.tohour}`);

    // Return a simplified structure for text search
    res.json({
        status: "INFO",
        statusColor: "yellow",
        title: "Search Results",
        rules: ["Text search only checks cleaning schedules."],
        cleaning: schedules
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
