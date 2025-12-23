const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client
const bigquery = new BigQuery({ projectId: 'training-plan-database' });

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.deleteLog = async (req, res) => {
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

    if (req.method !== 'POST' && req.method !== 'DELETE') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { activity_type, delete_type, exercise_id, session_criteria, entry_criteria } = req.body;

        if (!activity_type || !delete_type) {
            return res.status(400).send('Missing required fields: activity_type and delete_type');
        }

        const tableMapping = {
            'indoor': 'Indoor_Climbs',
            'outdoor': 'Outdoor_Climbs',
            'fingerboard': 'Fingerboarding',
            'gym': 'Gym_Sessions',
            'competition': 'Competition_Logs',
            'other': 'Other_Logs'
        };

        const tableId = tableMapping[activity_type];
        if (!tableId) {
            return res.status(400).send('Invalid activity_type');
        }

        const datasetId = 'training_plan_database_dataset';
        const projectId = process.env.GCP_PROJECT_ID || 'training-plan-database';

        let whereClause = '';
        if (delete_type === 'entry') {
            const parts = [];
            if (exercise_id) {
                // Primary match by ID
                parts.push(`exercise_id = @exercise_id`);
            } else if (entry_criteria) {
                // Detailed match fallback
                if (entry_criteria.date) parts.push(`date = DATETIME(@date)`);
                if (entry_criteria.name) {
                    if (activity_type === 'fingerboard') {
                        parts.push(`exercise = @name`);
                    } else if (activity_type === 'gym' || activity_type === 'other') {
                        parts.push(`climbs.name = @name`);
                    } else if (activity_type === 'indoor' || activity_type === 'outdoor' || activity_type === 'competition') {
                        parts.push(`climbs.route = @name`);
                    }
                }
                if (entry_criteria.weight !== undefined) parts.push(`weight = @weight`);

                if (entry_criteria.location) {
                    if (activity_type === 'outdoor') {
                        parts.push(`(location.crag = @loc_crag OR CONCAT(location.crag, ' - ', location.wall) = @loc_crag)`);
                    } else {
                        parts.push(`location = @location_str`);
                    }
                }
            }

            if (parts.length === 0) return res.status(400).send('Insufficient criteria for entry deletion');
            whereClause = parts.join(' AND ');
        }
        else if (delete_type === 'session') {
            if (session_criteria) {
                const parts = [];
                if (session_criteria.date) parts.push(`date BETWEEN @date_start AND @date_end`);
                if (session_criteria.location) {
                    if (activity_type === 'outdoor') {
                        // Location is a record in outdoor
                        parts.push(`(CONCAT(location.crag, ' - ', location.wall) = @location OR location.crag = @location)`);
                    } else if (activity_type === 'fingerboard') {
                        // Fingerboard doesn't really have location in DB yet, but we use 'N/A'
                        // So skipping location check for fingerboard session delete if it's N/A
                    } else {
                        parts.push(`location = @location`);
                    }
                }
                if (session_criteria.session_type) {
                    if (activity_type === 'outdoor') {
                        // Only filter by climbing_type if it is NOT the generic 'Outdoor' label
                        // getLogs returns 'Outdoor' for all outdoor sessions, while DB has 'Bouldering'/'Sport' etc.
                        if (session_criteria.session_type !== 'Outdoor') {
                            parts.push(`climbing_type = @session_type`);
                        }
                    } else if (activity_type === 'fingerboard' || activity_type === 'indoor') {
                        // Session type is hardcoded in getLogs
                    } else {
                        parts.push(`session_type = @session_type`);
                    }
                }

                if (parts.length === 0) return res.status(400).send('Insufficient session_criteria');
                whereClause = parts.join(' AND ');
            } else {
                return res.status(400).send('Missing session_criteria for session deletion');
            }
        } else {
            return res.status(400).send('Invalid delete_type');
        }

        const query = `DELETE FROM \`${projectId}.${datasetId}.${tableId}\` WHERE ${whereClause}`;

        const params = {};
        if (exercise_id) params.exercise_id = exercise_id;
        if (entry_criteria) {
            if (entry_criteria.date) params.date = entry_criteria.date.replace('T', ' ').split('.')[0];
            if (entry_criteria.name) params.name = entry_criteria.name;
            if (entry_criteria.weight !== undefined) params.weight = entry_criteria.weight;
            if (entry_criteria.location) {
                if (typeof entry_criteria.location === 'object') {
                    params.loc_crag = entry_criteria.location.crag || '';
                    params.loc_wall = entry_criteria.location.wall || '';
                } else {
                    params.location_str = entry_criteria.location;
                }
            }
        }
        if (session_criteria) {
            if (session_criteria.date) {
                const rawDate = session_criteria.date.value || session_criteria.date;
                if (typeof rawDate === 'string') {
                    const dateOnly = rawDate.split('T')[0];
                    params.date_start = `${dateOnly} 00:00:00`;
                    params.date_end = `${dateOnly} 23:59:59`;
                }
            }
            if (session_criteria.location) params.location = session_criteria.location;
            if (session_criteria.session_type) params.session_type = session_criteria.session_type;
        }

        console.log(`Executing delete query: ${query} with params:`, params);

        const [rows, metadata] = await bigquery.query({
            query: query,
            params: params,
            // Wrap in a transaction or ensure DML stats are returned? 
            // Standard query returns job info.
        });

        // For DML, metadata.numDmlAffectedRows might be available depending on client version/job.
        // Or job.getQueryResults()

        // Actually, let's just inspect the job result if possible.
        // The simple client returns [rows] but we destructured it.

        // Let's try to return more info. 
        // Note: For DELETE, rows is empty.

        res.status(200).json({
            message: 'Successfully processed delete request.',
            // We can't easily get row count without job inspection, but let's assume success if no error.
            // Wait, for debugging, let's add the params we used to the response so the frontend can see what was sent.
            debug_params: params,
            debug_query: query
        });
    } catch (error) {
        console.error('DELETE ERROR:', error);
        res.status(500).send(`Delete Error: ${error.message}`);
    }
};
