import { VALID_GRADES_LOWER } from '$lib/constants';

/**
 * Checks if a grade string is valid (case-insensitive).
 * Empty strings are considered valid (optional input phase).
 */
export function isValidGrade(grade: string): boolean {
    if (!grade || !grade.trim()) return true;
    return VALID_GRADES_LOWER.includes(grade.trim().toLowerCase());
}

/**
 * Validates an array of items ensuring required fields are present.
 * @param items Array of objects to check
 * @param field Field name to check for truthiness
 */
export function validateRequiredField<T>(items: T[], field: keyof T): boolean {
    return items.every(item => !!item[field]);
}

/**
 * Checks if any climb in the list has an invalid grade.
 */
export function hasInvalidGrades(climbs: { grade: string }[]): boolean {
    return climbs.some(c => c.grade.trim() && !isValidGrade(c.grade));
}
