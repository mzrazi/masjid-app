const cron = require('node-cron');
const { User, payments } = require('../models/usermodel');
const { generatePaymentSchemaForUser, generatePaymentSchemasForCurrentMonth } = require('./paymentcontrol');


// This job generates payment schemas for all users on the first day of every month at midnight
const paymentSchemasJob =  cron.schedule('0 0 1 * *', async () => {
  try {
    console.log('Running cron job...');
    await generatePaymentSchemasForCurrentMonth();
    console.log('Done generating payment schemas');
  } catch (err) {
    console.error('Error generating payment schemas:', err);
  }
});

// This job updates payments to due status on the last day of every month at midnight
const updatePaymentsToDueJob = cron.schedule('0 0 31 * *', async () => {
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

module.exports = { paymentSchemasJob, updatePaymentsToDueJob };





  


