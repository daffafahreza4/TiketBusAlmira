const dotenv = require('dotenv');
const { snap, core, config } = require('../config/midtrans');

// Load environment variables
dotenv.config();

/**
 * Test Midtrans configuration and API connectivity
 */
async function testMidtransConfig() {
  console.log('🧪 Testing Midtrans Configuration...');
  console.log('Environment:', config.environment);
  console.log('Server Key:', config.serverKey ? `${config.serverKey.slice(0, 10)}...` : 'Not configured');
  console.log('Client Key:', config.clientKey ? `${config.clientKey.slice(0, 10)}...` : 'Not configured');
  console.log('');
}

/**
 * Test creating a Snap token
 */
async function testCreateSnapToken() {
  console.log('🎫 Testing Snap Token Creation...');
  
  const parameter = {
    transaction_details: {
      order_id: `TEST-ORDER-${Date.now()}`,
      gross_amount: 150000
    },
    credit_card: {
      secure: true
    },
    customer_details: {
      first_name: 'Test User',
      email: 'test@example.com',
      phone: '08123456789'
    },
    item_details: [
      {
        id: 'TICKET-TEST',
        price: 150000,
        quantity: 1,
        name: 'Test Tiket Bus Jakarta → Bandung',
        brand: 'Almira Bus',
        category: 'Transportation'
      }
    ]
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    console.log('✅ Snap token created successfully');
    console.log('Token:', transaction.token);
    console.log('Redirect URL:', transaction.redirect_url);
    console.log('');
    return transaction;
  } catch (error) {
    console.error('❌ Failed to create Snap token:', error.message);
    console.log('');
    return null;
  }
}

/**
 * Test transaction status inquiry
 */
async function testTransactionStatus(orderId) {
  console.log('📊 Testing Transaction Status Inquiry...');
  
  try {
    const status = await core.transaction.status(orderId);
    console.log('✅ Status inquiry successful');
    console.log('Transaction Status:', status.transaction_status);
    console.log('Order ID:', status.order_id);
    console.log('');
    return status;
  } catch (error) {
    console.error('❌ Failed to get transaction status:', error.message);
    console.log('');
    return null;
  }
}

/**
 * Display test credit card numbers for sandbox
 */
function displayTestCards() {
  console.log('💳 Midtrans Sandbox Test Credit Cards:');
  console.log('┌─────────────────────┬─────────┬─────┬──────────────────┐');
  console.log('│ Card Number         │ CVV     │ Exp │ Expected Result  │');
  console.log('├─────────────────────┼─────────┼─────┼──────────────────┤');
  console.log('│ 4811 1111 1111 1114 │ 123     │ 01/25│ Success          │');
  console.log('│ 4911 1111 1111 1113 │ 123     │ 01/25│ Failure          │');
  console.log('│ 4411 1111 1111 1118 │ 123     │ 01/25│ Challenge by FDS │');
  console.log('│ 2223 0000 0000 0007 │ 123     │ 01/25│ Success (MC)     │');
  console.log('└─────────────────────┴─────────┴─────┴──────────────────┘');
  console.log('');
  
  console.log('🏪 Virtual Account Test:');
  console.log('- Use any amount');
  console.log('- Payment will be auto-accepted in sandbox');
  console.log('');
  
  console.log('📱 E-wallet Test:');
  console.log('- GoPay: Use the simulator app');
  console.log('- ShopeePay: Will redirect to simulator');
  console.log('');
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Midtrans Payment System Tests\n');
  
  // Test configuration
  testMidtransConfig();
  
  // Display test cards info
  displayTestCards();
  
  // Test Snap token creation
  const transaction = await testCreateSnapToken();
  
  if (transaction) {
    // Test status inquiry with the created order
    const orderId = `TEST-ORDER-${Date.now()}`;
    await testTransactionStatus(orderId);
  }
  
  console.log('🏁 All tests completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Try creating a payment from your frontend');
  console.log('2. Use the test credit cards above');
  console.log('3. Check webhook notifications in your server logs');
  console.log('4. Monitor your Midtrans dashboard');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
}

module.exports = {
  testMidtransConfig,
  testCreateSnapToken,
  testTransactionStatus,
  displayTestCards,
  runTests
};