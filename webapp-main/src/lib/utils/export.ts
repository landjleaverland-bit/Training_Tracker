export function downloadCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // Get all unique keys from all objects (in case of optional fields)
    const headers = Array.from(new Set(data.flatMap(Object.keys)));

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            let val = row[header];

            // Handle null/undefined
            if (val === null || val === undefined) return '';

            // Handle arrays/objects
            if (typeof val === 'object') {
                // If it's a date object, format it
                if (val instanceof Date) return val.toISOString();

                // Otherwise stringify, but escape double quotes
                val = JSON.stringify(val).replace(/"/g, '""');
            } else {
                // Escape strings containing commas or quotes
                if (typeof val === 'string') {
                    val = val.replace(/"/g, '""');
                }
            }

            // Wrap in quotes if it contains comma, quote or newline, or is an object string
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                return `"${val}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
