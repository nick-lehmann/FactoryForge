import { expect, test } from '@playwright/test';

test('home page lists factories heading', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Your factories' })).toBeVisible();
});
