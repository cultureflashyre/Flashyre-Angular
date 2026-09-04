// playwright/recruiter-workflow-bulk-import/05-unmatched-resumes-resolver.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis } from './test-fixtures';

test.describe('Scenario 5: Unmatched Resumes Resolver & Manual Candidate Linking', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
    await page.click('button.tab:has-text("Unmatched Resumes")');
  });

  test('should display unmatched resume cards with AI-parsed metadata and clean filenames', async ({ page }) => {
    const cards = page.locator('.unmatched-card');
    await expect(cards).toHaveCount(2);

    // Card 1: Vikram Aditya
    const card1 = cards.nth(0);
    const fileName1 = card1.locator('.unmatched-file-name');
    await expect(fileName1).toHaveText('Vikram_Aditya_Senior_Java_Resume.pdf');
    await expect(fileName1).not.toContainText('98765432-');

    // AI-parsed snapshot fields
    await expect(card1.locator('.ai-meta-row:has(.ai-meta-label:has-text("Parsed Name:")) .ai-meta-val')).toHaveText('Vikram Aditya');
    await expect(card1.locator('.ai-meta-row:has(.ai-meta-label:has-text("Phone:")) .ai-meta-val')).toHaveText('9876543210');
    await expect(card1.locator('.ai-meta-row:has(.ai-meta-label:has-text("Email:")) .ai-meta-val')).toHaveText('vikram.aditya@techcloud.io');
    await expect(card1.locator('.ai-skills-tag')).toContainText('Java, Spring Boot');

    // Diagnostic chip
    await expect(card1.locator('.diag-chip')).toHaveText('AMBIGUOUS_MATCH');

    // Card 2: Ananya Deshmukh
    const card2 = cards.nth(1);
    const fileName2 = card2.locator('.unmatched-file-name');
    await expect(fileName2).toHaveText('Ananya_Deshmukh_Data_Engineer.pdf');
    await expect(fileName2).not.toContainText('11223344-');
    await expect(card2.locator('.diag-chip')).toHaveText('NO_MATCH');
  });

  test('should open Resolve Modal, search candidate, and attach resume to candidate profile', async ({ page }) => {
    const card1 = page.locator('.unmatched-card').first();
    await card1.locator('button.resolve-action-btn:has-text("Resolve & Attach")').click();

    // Verify Resolve Modal is visible
    const resolveModal = page.locator('.modal-content.resolve-modal');
    await expect(resolveModal).toBeVisible();

    // Verify modal header displays clean filename
    const modalSub = resolveModal.locator('.modal-header p');
    await expect(modalSub).toHaveText('Linking: Vikram_Aditya_Senior_Java_Resume.pdf');
    await expect(modalSub).not.toContainText('98765432-');

    // Search for candidate "Vikram"
    const searchBox = resolveModal.locator('.modal-search-box input');
    await searchBox.fill('Vikram');

    // Candidate list filtered
    const candidateItems = resolveModal.locator('.candidate-pick-item');
    await expect(candidateItems).toHaveCount(2);

    // Select candidate Vikram Aditya (ID 501)
    await candidateItems.first().click();
    await expect(candidateItems.first()).toHaveClass(/selected/);

    // Click Confirm Link
    const confirmBtn = resolveModal.locator('button:has-text("Confirm Link & Attach Resume")');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Modal closes
    await expect(resolveModal).not.toBeVisible();
  });

  test('should display all-resolved empty state when no unmatched resumes exist', async ({ page }) => {
    // Override API to return empty list
    await setupMockAuthAndApis(page, { unmatchedResumes: [] });
    await page.goto('/recruiter-workflow-bulk-import');
    await page.click('button.tab:has-text("Unmatched Resumes")');

    const emptyView = page.locator('.all-resolved-view');
    await expect(emptyView).toBeVisible();
    await expect(emptyView.locator('h3')).toHaveText('All Resumes Successfully Matched!');
  });
});
