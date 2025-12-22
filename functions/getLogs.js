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

    const { type, startDate, endDate, location, session, grade } = req.query;
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
        let whereClauses = [];
        const queryOptions = {
            params: {}
        };

        if (type === 'outdoor') {
            if (location) {
                whereClauses.push("(location.crag LIKE @location OR location.wall LIKE @location)");
                queryOptions.params.location = `%${location}%`;
            }
            if (session) {
                whereClauses.push("climbing_type = @session");
                queryOptions.params.session = session;
            }
        } else {
            if (location) {
                whereClauses.push("location = @location");
                queryOptions.params.location = location;
            }
            if (session) {
                whereClauses.push("session_type = @session");
                queryOptions.params.session = session;
            }
        }

        if (startDate) {
            whereClauses.push("date >= @startDate");
            queryOptions.params.startDate = startDate;
        }
        if (endDate) {
            whereClauses.push("date <= @endDate");
            queryOptions.params.endDate = endDate;
        }
        if (grade) {
            whereClauses.push("climbs.grade = @grade");
            queryOptions.params.grade = grade;
        }

        let whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : "";

        // Normalize output based on activity type
        let selectClause = "*";
        if (type === 'outdoor') {
            // Flatten location for simpler frontend handling
            selectClause = "CONCAT(location.crag, ' - ', location.wall) as location, climbing_type as session_type, * EXCEPT(location, climbing_type)";
        }

        const query = `
            SELECT ${selectClause}
            FROM \`${process.env.GCP_PROJECT_ID || 'training-plan-database'}.${datasetId}.${tableId}\`
            ${whereString}
            ORDER BY date DESC
            LIMIT 100
        `;

        queryOptions.query = query;

        const [rows] = await bigquery.query(queryOptions);
        res.status(200).json(rows);
    } catch (error) {
        console.error('BigQuery Query Error:', error);
        res.status(500).send(`Error retrieving data: ${error.message}`);
    }
};
