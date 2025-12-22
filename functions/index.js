const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client
const bigquery = new BigQuery({ projectId: 'training-plan-database' });

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.saveLog = async (req, res) => {
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { climbing_type, location, session_type, climbs, date } = req.body;

        // Basic validation
        if (!location || !session_type || !climbs || !climbs.length) {
            return res.status(400).send('Missing required fields');
        }

        const datasetId = 'training_plan_database_dataset';
        const tableId = 'Indoor_Climbs';

        // BigQuery expects an array of rows
        const rows = climbs.map(climb => {
            // Convert ISO date to BigQuery DATETIME format: YYYY-MM-DD HH:MM:SS
            const bqDate = date.replace('T', ' ').split('.')[0];

            return {
                climbing_type: climb.isRopes ? 'Ropes' : 'Bouldering',
                location: location,
                session_type: session_type,
                // IMPORTANT: Record field names must match BigQuery schema exactly
                climbs: {
                    route_name: climb.name,
                    grade: climb.grade,
                    notes: climb.notes
                },
                date: bqDate
            };
        });

        console.log(`Inserting ${rows.length} rows into ${datasetId}.${tableId}`);

        await bigquery
            .dataset(datasetId)
            .table(tableId)
            .insert(rows);

        res.status(200).send(`Successfully inserted ${rows.length} rows.`);
    } catch (error) {
        console.error('BIGQUERY INSERT ERROR:', JSON.stringify(error));

        // Expose errors for debugging
        const detailedError = error.errors ? JSON.stringify(error.errors) : error.message;
        res.status(500).send(`BigQuery Error: ${detailedError}`);
    }
};
