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
        const { activity_type, location, session_type, finger_load, shoulder_load, forearm_load, training, climbs, date } = req.body;

        // Basic validation
        if (!location || !session_type || !climbs || !climbs.length) {
            return res.status(400).send('Missing required fields');
        }

        const tableMapping = {
            'indoor': 'Indoor_Climbs',
            'outdoor': 'Outdoor_Climbs',
            'gym': 'Gym_Sessions',
            'fingerboard': 'Fingerboarding',
            'other': 'Other_Logs'
        };

        const tableId = tableMapping[activity_type || 'indoor'];
        const datasetId = 'training_plan_database_dataset';

        // BigQuery expects an array of rows
        const rows = climbs.map(climb => {
            // Convert ISO date to BigQuery DATETIME format: YYYY-MM-DD HH:MM:SS
            const bqDate = date.replace('T', ' ').split('.')[0];

            const row = {
                finger_load: finger_load || 0,
                shoulder_load: shoulder_load || 0,
                forearm_load: forearm_load || 0,
                date: bqDate
            };

            if (activity_type === 'outdoor') {
                row.location = {
                    crag: location.area ? `${location.area} > ${location.crag}` : (location.crag || ''),
                    wall: location.wall || ''
                };
                row.climbing_type = climb.type || 'Bouldering';
                row.attempts = climb.attempts || 'Redpoint';
                row.climbs = {
                    route: climb.name,
                    grade: climb.grade,
                    notes: climb.notes
                };
                row.training = training || null;
            } else if (activity_type === 'indoor' || !activity_type) {
                row.location = location;
                row.session_type = session_type;
                row.climbing_type = climb.type || 'Bouldering';
                row.attempts = climb.attempts || 'Redpoint';
                row.climbs = {
                    route: climb.name,
                    grade: climb.grade,
                    notes: climb.notes
                };
                row.training = training || null;
            } else if (activity_type === 'fingerboard') {
                row.location = location;
                row.session_type = session_type;
                row.climbs = {
                    exercise: climb.name,
                    grip: climb.grip_type || 'N/A',
                    weight: parseFloat(climb.weight) || 0,
                    sets: parseInt(climb.sets) || 0,
                    reps: String(climb.reps || '1'),
                    notes: climb.notes
                };
            } else {
                // Fallback / Gym / Other
                row.location = location;
                row.session_type = session_type;
                row.climbs = {
                    name: climb.name,
                    notes: climb.notes
                };
            }

            return row;
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
