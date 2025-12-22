const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client
const bigquery = new BigQuery({ projectId: 'training-plan-database' });

/**
 * Retrieves logs from BigQuery based on activity type.
 */
exports.getLogs = async (req, res) => {
    // Set CORS headers for all responses
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // Authorization Check
    const authHeader = req.get('Authorization');
    const expectedKey = process.env.APP_AUTH_KEY;

    if (!expectedKey) {
        console.error('APP_AUTH_KEY environment variable is not set');
        return res.status(500).send('Server configuration error: APP_AUTH_KEY missing');
    }

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
        console.warn('Unauthorized attempt');
        return res.status(401).send('Unauthorized');
    }

    const { type } = req.query;
    if (!type) {
        return res.status(400).send('Missing activity type');
    }

    const tableMapping = {
        'indoor': 'Indoor_Climbs',
        'outdoor': 'Outdoor_Climbs',
        'gym': 'Gym_Sessions',
        'fingerboard': 'Fingerboarding',
        'other': 'Other_Logs'
    };

    const tableId = tableMapping[type];
    if (!tableId) {
        return res.status(400).send(`Invalid activity type: ${type}`);
    }

    const datasetId = 'training_plan_database_dataset';

    try {
        const query = `
            SELECT *
            FROM \`${process.env.GCP_PROJECT_ID || 'training-plan-database'}.${datasetId}.${tableId}\`
            ORDER BY date DESC
            LIMIT 50
        `;

        const [rows] = await bigquery.query({ query });
        res.status(200).json(rows);
    } catch (error) {
        console.error('BigQuery Query Error:', error);
        res.status(500).send(`Error retrieving data: ${error.message}`);
    }
};
