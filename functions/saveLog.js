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
        // Basic validation
        // session_type is not required for indoor climbs
        if (!location || (!session_type && activity_type !== 'indoor')) {
            return res.status(400).send('Missing required fields');
        }

        // Climbs are required unless it is a competition result only
        if ((!climbs || !climbs.length) && req.body.isResultOnly !== true) {
            return res.status(400).send('Missing climbs data');
        }

        const tableMapping = {
            'indoor': 'Indoor_Climbs',
            'outdoor': 'Outdoor_Climbs',
            'gym': 'Gym_Sessions',
            'fingerboard': 'Fingerboarding',
            'competition': 'Competition_Logs',
            'other': 'Other_Logs'
        };

        const tableId = tableMapping[activity_type || 'indoor'];
        const datasetId = 'training_plan_database_dataset';

        const crypto = require('crypto');
        // BigQuery expects an array of rows
        // If result only, create a dummy climb to generate the row
        const climbsList = (climbs && climbs.length) ? climbs : (req.body.isResultOnly ? [{ id: crypto.randomUUID(), name: 'Result', attempts: 'N/A', attempt_count: 0, notes: '' }] : []);

        const rows = climbsList.flatMap(climb => {
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
                row.climbing_type = climb.type || 'Bouldering';
                row.attempts = climb.attempts || 'Redpoint';
                row.climbs = {
                    route: climb.name,
                    grade: climb.grade,
                    notes: climb.notes
                };
                row.training = training || null;
                row.exercise_id = climb.id;
            } else if (activity_type === 'competition') {
                row.location = location;
                row.climbing_type = climb.type || 'Bouldering';
                row.position = req.body.position || climb.position || null;
                row.session_type = 'Competition';
                row.climbs = {
                    route: climb.name,
                    attempts: climb.attempts || 'Attempt',
                    attempt_count: parseInt(climb.attempt_count) || 1,
                    round: req.body.round || 'N/A',
                    notes: climb.notes
                };
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

        console.log('Uploading payload:', ndjson);

        // Write to a temporary file
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.json`);

        fs.writeFileSync(tempFilePath, ndjson);

        // Load Job Configuration

        let schemaFields = [
            { name: 'date', type: 'DATETIME' },
            // Location type depends on activity
            (activity_type === 'outdoor'
                ? {
                    name: 'location',
                    type: 'RECORD',
                    fields: [
                        { name: 'crag', type: 'STRING' },
                        { name: 'wall', type: 'STRING' }
                    ]
                }
                : { name: 'location', type: 'STRING' }
            ),
            { name: 'climbing_type', type: 'STRING' },
            { name: 'session_type', type: 'STRING' },
            { name: 'position', type: 'INTEGER' },
            { name: 'finger_load', type: 'NUMERIC' },
            { name: 'shoulder_load', type: 'NUMERIC' },
            { name: 'forearm_load', type: 'NUMERIC' },
            { name: 'exercise_id', type: 'STRING' },
            {
                name: 'training', type: 'RECORD', fields: [
                    { name: 'training_type', type: 'STRING' },
                    { name: 'difficulty', type: 'STRING' },
                    { name: 'category', type: 'STRING' },
                    { name: 'energy_system', type: 'STRING' },
                    { name: 'technique_focus', type: 'STRING' },
                    { name: 'wall_angle', type: 'STRING' }
                ]
            },
            {
                name: 'climbs', type: 'RECORD', mode: 'NULLABLE', fields: [
                    { name: 'route', type: 'STRING' },
                    { name: 'attempts', type: 'STRING' },
                    { name: 'round', type: 'STRING' },
                    { name: 'notes', type: 'STRING' },
                    { name: 'attempt_count', type: 'INTEGER' },
                    { name: 'grade', type: 'STRING' },
                    { name: 'name', type: 'STRING' }
                ]
            }
        ];

        const metadata = {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            schemaUpdateOptions: ['ALLOW_FIELD_ADDITION'],
            autodetect: false, // Turn off autodetect to rely on explicit schema
            schema: {
                fields: schemaFields
            }
        };

        // Run the Load Job
        // Use createLoadJob for more explicit control
        const jobResponse = await bigquery
            .dataset(datasetId)
            .table(tableId)
            .createLoadJob(tempFilePath, metadata);

        // Robustly extract the Job object (handle both [Job] and Job return types)
        const job = Array.isArray(jobResponse) ? jobResponse[0] : jobResponse;

        console.log(`Job created with ID: ${job.id}`);

        if (typeof job.getMetadata !== 'function') {
            console.error('Job object from BigQuery is invalid:', job);
            throw new Error(`BigQuery client returned unexpected Job object structure. ID: ${job.id || 'unknown'}`);
        }

        // Wait for the job to complete by polling
        let jobDone = false;
        while (!jobDone) {
            const [meta] = await job.getMetadata();
            if (meta.status.state === 'DONE') {
                jobDone = true;
                if (meta.status.errorResult) {
                    // Check for common errors
                    throw new Error(`Load Job Failed: ${meta.status.errorResult.message}`);
                }
            } else {
                // Wait 1000ms before checking again
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

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
