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
            console.error('Missing fields:', req.body);
            return res.status(400).send('Missing required fields: activity_type and delete_type');
        }
        console.log('DELETE Request:', JSON.stringify(req.body));

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
                    const isUnknown = entry_criteria.name === 'N/A' || entry_criteria.name === 'Unknown Problem';
                    if (activity_type === 'fingerboard') {
                        if (isUnknown) parts.push(`(exercise IS NULL OR exercise = 'N/A' OR exercise = '' OR exercise = 'Unknown Problem')`);
                        else parts.push(`exercise = @name`);
                    } else if (activity_type === 'gym' || activity_type === 'other') {
                        if (isUnknown) parts.push(`(climbs.name IS NULL OR climbs.name = 'N/A' OR climbs.name = '' OR climbs.name = 'Unknown Problem')`);
                        else parts.push(`climbs.name = @name`);
                    } else if (activity_type === 'indoor' || activity_type === 'outdoor' || activity_type === 'competition') {
                        if (isUnknown) parts.push(`(climbs.route IS NULL OR climbs.route = 'N/A' OR climbs.route = '' OR climbs.route = 'Unknown Problem')`);
                        else parts.push(`climbs.route = @name`);
                    }
                }
                if (entry_criteria.weight !== undefined) parts.push(`weight = @weight`);

                if (entry_criteria.location) {
                    const isLocUnknown = entry_criteria.location === 'N/A';
                    if (activity_type === 'outdoor') {
                        if (isLocUnknown) parts.push(`(location IS NULL OR location.crag IS NULL OR location.crag = 'N/A' OR location.crag = '')`);
                        else parts.push(`(location.crag = @loc_crag OR CONCAT(location.crag, ' - ', location.wall) = @loc_crag)`);
                    } else {
                        if (isLocUnknown) parts.push(`(location IS NULL OR location = 'N/A' OR location = '')`);
                        else parts.push(`location = @location_str`);
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
                        if (session_criteria.location === 'N/A') {
                            parts.push(`(location IS NULL OR location.crag IS NULL OR location.crag = 'N/A' OR location.crag = '')`);
                        } else {
                            parts.push(`(CONCAT(location.crag, ' - ', location.wall) = @location OR location.crag = @location)`);
                        }
                    } else if (activity_type === 'fingerboard') {
                        // Fingerboard handling
                    } else {
                        if (session_criteria.location === 'N/A') {
                            parts.push(`(location IS NULL OR location = 'N/A' OR location = '')`);
                        } else {
                            parts.push(`location = @location`);
                        }
                    }
                }
                if (session_criteria.session_type) {
                    if (session_criteria.session_type === 'N/A') {
                        parts.push(`(session_type IS NULL OR session_type = 'N/A' OR session_type = '')`);
                    } else if (activity_type === 'outdoor') {
                        if (session_criteria.session_type !== 'Outdoor') {
                            parts.push(`climbing_type = @session_type`);
                        }
                    } else if (activity_type === 'fingerboard' || activity_type === 'indoor' || activity_type === 'competition') {
                        // Redundant
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
                    if (activity_type === 'outdoor') {
                        // Handle case where frontend defines location as string (legacy/fallback)
                        params.loc_crag = entry_criteria.location;
                        params.loc_wall = ''; // Ensure param exists if query uses it?
                        // Actually, query uses @loc_crag. Matches location.crag or concat.
                    } else {
                        params.location_str = entry_criteria.location;
                    }
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



        const [job] = await bigquery.createQueryJob({
            query: query,
            params: params,
        });

        // Wait for the query to complete
        await job.getQueryResults();

        // Fetch job metadata to get affected rows stats
        const [metadata] = await job.getMetadata();
        const deletedCount = metadata.statistics?.query?.numDmlAffectedRows || 0;

        console.log(`Deleted ${deletedCount} rows.`);

        res.status(200).json({ message: 'Successfully processed delete request.', deleted: deletedCount });
    } catch (error) {
        console.error('DELETE ERROR:', error);
        res.status(500).send(`Delete Error: ${error.message}`);
    }
};
