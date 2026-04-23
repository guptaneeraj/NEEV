const fs = require('fs');

const DIRECTUS_URL = 'https://directus.neevios.com'; // Replace with your URL
const COLLECTION_NAME = 'Activities'; // Your collection name
const ADMIN_TOKEN = 'KYe03vXlzO8-P1ec00OzGNJpFSHmyYj3'; // Your Directus token

// 1. Load the updated JSON file
const rawData = fs.readFileSync('Neev_Database_Final.json', 'utf8');
const allActivities = JSON.parse(rawData);

// 2. Strip the data down to ONLY the ID and the two new fields
// This makes the upload lightning fast and ensures you don't overwrite existing text
const updatePayload = allActivities.map(activity => {
    return {
        id: activity.id,
        energy_level: activity.energy_level,
        duration_mins: activity.duration_mins
    };
});

async function updateData() {
    console.log(`Starting batch update for ${updatePayload.length} activities...`);

    try {
        // 3. Send a PATCH request to update existing items
        const response = await fetch(`${DIRECTUS_URL}/items/${COLLECTION_NAME}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            },
            body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Update failed:", JSON.stringify(error, null, 2));
            return;
        }

        const result = await response.json();
        console.log(`Success! Updated ${result.data.length} records in Directus.`);

    } catch (error) {
        console.error("Network or script error:", error);
    }
}

updateData();