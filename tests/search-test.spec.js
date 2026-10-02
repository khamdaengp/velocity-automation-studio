// Velocity Automation Studio - Search and Form Automation Test
console.log('⚡ Starting Wikipedia search test...');

await page.goto('https://en.wikipedia.org', { waitUntil: 'domcontentloaded' });
console.log('🌐 Page loaded: Wikipedia Homepage');

// Type into search box with zero lag
const searchInput = page.locator('#searchInput').first();
await searchInput.fill('Playwright (software)');
console.log('⌨️ Input filled into search bar');

// Submit search
await page.keyboard.press('Enter');
await page.waitForLoadState('domcontentloaded');

const currentUrl = page.url();
console.log('🔗 Current URL:', currentUrl);

const pageTitle = await page.title();
console.log('🎯 Search Result Title:', pageTitle);
