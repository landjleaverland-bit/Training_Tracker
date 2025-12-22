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
        const rows = climbs.flatMap(climb => {
            // Convert ISO date to BigQuery DATETIME format: YYYY-MM-DD HH:MM:SS
            const bqDate = date.replace('T', ' ').split('.')[0];

            if (activity_type === 'fingerboard') {
                // Handle multiple weight/rep details per exercise
                const details = climb.details && climb.details.length ? climb.details : [{ weight: climb.weight, reps: climb.reps }];

                return details.map(detail => ({
                    date: bqDate,
                    exercise: climb.name,
                    grip: climb.grip_type || 'N/A',
                    weight: parseFloat(detail.weight) || 0,
                    sets: parseInt(climb.sets) || 0,
                    reps: String(detail.reps || '1'),
                    notes: climb.notes,
                    exercise_id: climb.id
                }));
            }

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
                row.exercise_id = climb.id;
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
                row.exercise_id = climb.id;
            } else {
                // Fallback / Gym / Other
                row.location = location;
                row.session_type = session_type;
                row.climbs = {
                    name: climb.name,
                    notes: climb.notes
                };
            }

            return [row];
        });

        // Create NDJSON string (Newline Delimited JSON)
        // BigQuery Load requires a string where each line is a valid JSON object
        const ndjson = rows.map(row => JSON.stringify(row)).join('\n');

        // Write to a temporary file
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.json`);

        fs.writeFileSync(tempFilePath, ndjson);

        // Load Job Configuration
        const metadata = {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            // schemaUpdateOptions: ['ALLOW_FIELD_ADDITION'], // Optional: Allow schema evolution
            // autodetect: true, // Optional: Let BQ infer schema if needed
        };

        console.log(`Starting Batch Load Job for ${rows.length} rows into ${datasetId}.${tableId}`);

        // Run the Load Job
        const [job] = await bigquery
            .dataset(datasetId)
            .table(tableId)
            .load(tempFilePath, metadata);

        console.log(`Job ${job.id} started.`);

        // Wait for the job to complete
        await job.promise();

        console.log(`Job ${job.id} completed.`);

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        res.status(200).send(`Successfully loaded ${rows.length} rows.`);
    } catch (error) {
        console.error('BIGQUERY LOAD ERROR:', error);

        // Clean up temp file if it exists and error occurred
        // (Basic cleanup, might need try-finally block for robustness in production)
        try {
            // fs and tempFilePath scopes are inside try block, so this simple cleanup might fail if error happened before definitions
            // But for this snippet, error.message is key.
        } catch (e) { }

        const detailedError = error.errors ? JSON.stringify(error.errors) : error.message;
        res.status(500).send(`BigQuery Error: ${detailedError}`);
    }
};
