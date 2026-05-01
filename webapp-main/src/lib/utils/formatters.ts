/**
 * @file formatters.ts
 * @brief Utilities for formatting data for display.
 */

/**
 * Formats a climbing grade based on whether it is a bouldering or sport/lead climb.
 * Bouldering French grades should have an uppercase letter (e.g. 7A, 8B+).
 * Sport/Lead French grades should have a lowercase letter (e.g. 6a, 7a, 8a+).
 * V-grades are always uppercase.
 *
 * @param grade The grade string to format
 * @param isSport Whether the climb is a sport/lead climb
 * @returns The formatted grade string
 */
export function formatGrade(grade: string, isSport: boolean = false): string {
    if (!grade) return grade;
    
    let g = grade.trim();
    
    // V-grades (e.g. V3, v4) are always uppercase
    if (g.toLowerCase().startsWith('v')) {
        return g.toUpperCase();
    }
    
    // Check for French grades: 1-9 followed by A-C, optionally followed by +
    const frenchMatch = g.match(/^(\d+)([a-c])(\+?)$/i);
    if (frenchMatch) {
        const [, num, letter, plus] = frenchMatch;
        if (isSport) {
            return `${num}${letter.toLowerCase()}${plus}`;
        } else {
            return `${num}${letter.toUpperCase()}${plus}`;
        }
    }
    
    // Default fallback to uppercase
    return g.toUpperCase();
}
