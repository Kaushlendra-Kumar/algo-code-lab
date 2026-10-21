import { expect, test, type Page } from '@playwright/test';
import { DAYS, PATTERN_BY_ID, QUESTIONS } from '../src/content';
import { predictionTests } from '../src/lib/questions';

const errors = (page: Page) => {
  const list: string[] = [];
  page.on('pageerror', (e) => list.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') list.push(m.text());
  });
  return list;
};

const ROUTES = ['#/', '#/world', '#/roadmap', '#/day/1', '#/day/40', '#/patterns', '#/patterns/binary-search', '#/lab', '#/lab/sorting', '#/lab/grid-paths', '#/lab/graph-algos', '#/lab/dp', '#/questions', '#/daily', '#/revision', '#/progress', '#/settings', '#/does-not-exist'];

test('every main route renders without errors', async ({ page }) => {
  const errs = errors(page);
  for (const r of ROUTES) {
    await page.goto(r);
    await expect(page.locator('main h1').first(), r).toBeVisible();
  }
  expect(errs).toEqual([]);
});

test('no horizontal page scroll', async ({ page }) => {
  for (const r of ['#/', '#/day/5', '#/lab/sorting', '#/questions']) {
    await page.goto(r);
    await page.locator('main h1').first().waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, r).toBeLessThanOrEqual(1);
  }
});

test('lesson completion earns XP once and persists after reload', async ({ page }) => {
  await page.goto('#/day/1');
  await page.getByRole('tab', { name: /quiz & recap/i }).click();
  await page.getByRole('button', { name: 'Mark Day 1 complete (+50 XP)' }).click();
  await expect(page.getByRole('button', { name: 'Mark Day 1 complete (+50 XP)' })).toHaveCount(0);
  // Saving is debounced; wait until the write lands.
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('algoverse.progress') ?? '{}').xp ?? 0)).toBeGreaterThanOrEqual(50);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('algoverse.progress') ?? '{}'));
  await page.goto('#/progress');
  await expect(page.locator(".stat .v").filter({ hasText: new RegExp(`^${saved.xp} XP$`) })).toBeVisible();
  await page.reload();
  await expect(page.locator(".stat .v").filter({ hasText: new RegExp(`^${saved.xp} XP$`) })).toBeVisible();
  expect(Object.keys(saved.lessons ?? {})).toContain('1');
});

test('solving a question through the reasoning checks marks it solved', async ({ page }) => {
  const q = QUESTIONS.find((x) => x.day === 1)!;
  await page.goto(`#/questions/${q.id}`);
  await page.getByRole('radiogroup', { name: 'Approach' }).getByRole('radio', { name: PATTERN_BY_ID[q.patterns[0]].name, exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Complexity' }).getByRole('radio', { name: q.complexity.time, exact: true }).click();
  const tests = predictionTests(q);
  for (let i = 0; i < tests.length; i++) await page.getByLabel(`your stdout #${i + 1}`).fill(tests[i].out);
  await page.getByRole('button', { name: 'Check my reasoning' }).click();
  await expect(page.getByText('All checks passed — marked as solved.')).toBeVisible();
});

test('wrong predictions are reported honestly', async ({ page }) => {
  const q = QUESTIONS.find((x) => x.day === 2)!;
  await page.goto(`#/questions/${q.id}`);
  await page.getByRole('radiogroup', { name: 'Approach' }).getByRole('radio').first().click();
  await page.getByRole('radiogroup', { name: 'Complexity' }).getByRole('radio').first().click();
  const tests = predictionTests(q);
  for (let i = 0; i < tests.length; i++) await page.getByLabel(`your stdout #${i + 1}`).fill('definitely wrong');
  await page.getByRole('button', { name: 'Check my reasoning' }).click();
  await expect(page.getByText(/Not all checks passed/)).toBeVisible();
});

test('question bank filters by text', async ({ page }) => {
  const q = QUESTIONS[10];
  await page.goto('#/questions');
  await page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).first().fill(q.title);
  await expect(page.getByText(q.title).first()).toBeVisible();
});

test('sorting lab plays its visualization', async ({ page }) => {
  const errs = errors(page);
  await page.goto('#/lab/sorting');
  await page.getByRole('button', { name: /play/i }).first().click();
  await page.waitForTimeout(800);
  expect(errs).toEqual([]);
});

test('a scripted trace is labelled as such', async ({ page }) => {
  const day = DAYS.find((d) => d.exampleA.trace)!;
  await page.goto(`#/day/${day.day}`);
  await page.getByRole('tab', { name: /c\+\+ examples/i }).click();
  await page.getByRole('tab', { name: 'Step through' }).first().click();
  await expect(page.getByText('Scripted educational trace').first()).toBeAttached();
});
