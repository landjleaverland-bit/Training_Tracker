import { expect, test } from '@playwright/test';

test.describe('Authentication Smoke Tests', () => {
    test('Unauthenticated user is shown the login page', async ({ page }) => {
        await page.goto('/');

        // Check for Login component elements
        await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
        await expect(page.locator('.app-container')).not.toBeVisible();
    });

    test.fixme('Protected route redirects or shows login', async ({ page }) => {
        await page.goto('/log');

        // Should still show login
        await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    });
});
