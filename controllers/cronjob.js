const cron = require('node-cron');
const { User, payments } = require('../models/usermodel');
const { generatePaymentSchemasForUsers } = require('./usercontrol');

// Schedule the job to run at the start of each month (on the first day of the month at 00:00)
cron.schedule('0 0 1 * *', async () => {
    console.log('Generating payment schemas for users...');
    await generatePaymentSchemasForUsers();
    console.log('Payment schemas generated!');
  });

  cron.schedule('0 0 31 * *', async () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const pendingPayments = await payments.find({ year: currentYear, month: currentMonth, status: 'pending' });
    for (const payment of pendingPayments) {
      payment.status = 'due';
      await payment.save();
    }
    console.log(`Updated ${pendingPayments.length} payments to due status for month ${currentMonth} and year ${currentYear}`);
  });
  





  


