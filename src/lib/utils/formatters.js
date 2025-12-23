// @ts-nocheck
/**
 * Normalizes a location object or string into a displayable string.
 * @param {string|object} location 
 * @returns {string}
 */
export function normalizeLocation(location) {
    let loc = location || "N/A";
    if (typeof loc === "object" && loc !== null) {
        // Handle BigQuery RECORD/STRUCT style keys if they differ, currently assuming area/crag/wall
        if (loc.area || loc.crag) {
            loc = loc.area
                ? `${loc.area} > ${loc.crag}`
                : loc.crag || "";
            if (loc.wall || location.wall) {
                const wall = loc.wall || location.wall;
                loc = `${loc} - ${wall}`;
            }
        } else {
            loc = JSON.stringify(loc);
        }
    }
    return loc;
}

/**
 * Formats a date string or object into a short string.
 * @param {string|object} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr.value || dateStr);
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "2-digit",
    });
}
