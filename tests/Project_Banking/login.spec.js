// Banking Project -> Authentication Suite
console.log('🏦 Running Secure Banking Login Test...');

await page.setContent(`
  <form id="login-form">
    <h3>Banking Portal</h3>
    <input id="user" value="vip_customer" />
    <input id="pass" type="password" value="secret123" />
    <button id="submit-btn" type="button">Sign In</button>
    <div id="auth-msg">Logged Out</div>
  </form>
  <script>
    document.getElementById('submit-btn').addEventListener('click', () => {
      document.getElementById('auth-msg').textContent = '2FA Token Verified. Welcome VIP!';
    });
  </script>
`);

await page.click('#submit-btn');
const msg = await page.textContent('#auth-msg');
console.log('🔐 Auth Message:', msg);

if (msg.includes('Verified')) {
  console.log('✅ Banking Login Assertion PASSED');
} else {
  throw new Error('Authentication failed');
}
