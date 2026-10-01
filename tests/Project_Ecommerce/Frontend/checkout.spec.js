// E-Commerce Project -> Frontend Sub-Project -> Checkout Test
console.log('🛒 Initializing E-Commerce Checkout Flow...');

await page.setContent(`
  <div id="cart">
    <h2>Shopping Cart</h2>
    <div class="item">Item: Laptop ($1200)</div>
    <button id="checkout-btn">Proceed to Checkout</button>
    <div id="order-status">Ready</div>
  </div>
  <script>
    document.getElementById('checkout-btn').addEventListener('click', () => {
      document.getElementById('order-status').textContent = 'Order #9821 Placed Successfully!';
    });
  </script>
`);

await page.click('#checkout-btn');
const status = await page.textContent('#order-status');
console.log('📦 Order Status:', status);

if (status.includes('Placed Successfully')) {
  console.log('✅ Checkout Test PASSED');
} else {
  throw new Error('Checkout Failed');
}
