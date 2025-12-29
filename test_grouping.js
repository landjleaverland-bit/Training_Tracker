
const filterAndGroupData = (data) => {
    const selectedType = 'competition';
    const groups = {};
    const seenRows = new Set();

    data.forEach(row => {
        const dateStr = row.date; // Simplified
        const key = `${dateStr}|${row.location}|Competition`;

        if (!groups[key]) {
            groups[key] = {
                key,
                items: [],
                rounds: {}
            };
        }

        const climbsToProcess = [row]; // Mimic getLogs behavior

        climbsToProcess.forEach(climb => {
            const itemData = {
                name: climb.name,
                round: climb.round,
                // simplified
            };

            const dedupKey = `${dateStr}|${JSON.stringify({
                n: itemData.name,
                r: itemData.round
            })}`;

            console.log(`Processing: ${itemData.name} - ${itemData.round}`);
            console.log(`DedupKey: ${dedupKey}`);

            if (seenRows.has(dedupKey)) {
                console.log('Duplicate found, skipping');
                return;
            }
            seenRows.add(dedupKey);

            if (selectedType === "competition") {
                if (!groups[key].rounds) groups[key].rounds = {};

                const roundName = itemData.round || "Unknown";
                if (!groups[key].rounds[roundName]) {
                    groups[key].rounds[roundName] = [];
                }
                groups[key].rounds[roundName].push(itemData);
            }
            groups[key].items.push(itemData);
        });
    });

    return Object.values(groups);
};

const mockData = [
    {
        date: '2023-10-27',
        location: 'Test Gym',
        name: 'Problem 1',
        round: 'Qualifiers'
    },
    {
        date: '2023-10-27',
        location: 'Test Gym',
        name: 'Problem 1',
        round: 'Finals'
    }
];

const result = filterAndGroupData(mockData);
console.log(JSON.stringify(result, null, 2));
