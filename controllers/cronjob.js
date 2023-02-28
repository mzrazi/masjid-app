const cron = require('node-cron');
const { User, payments } = require('../models/usermodel');


// Schedule a job to run at the start of every year
cron.schedule('0 0 1 1 *', async () => {
  try {
    const currentYear = new Date().getFullYear();
    const users = await User.find({});

    for (const user of users) {
      const payment = await Payment.findOne({ user: user._id, year: currentYear });

      if (!payment) {
        const newPayment = new payments({
            user: user._id,
            year: currentYear,
            months: [
              { month: "jan", status: "pending"},
              { month: "feb", status: "pending"},
              { month: "mar", status: "pending"},
              { month: "apr", status: "pending"},
              { month: "may", status: "pending"},
              { month: "jun", status: "pending"},
              { month: "jul", status: "pending"},
              { month: "aug", status: "pending"},
              { month: "sep", status: "pending"},
              { month: "oct", status: "pending"},
              { month: "nov", status: "pending"},
              { month: "dec", status: "pending"},
            ],
          });

        await newPayment.save();
      }
    }
  } catch (error) {
    console.error(error);
  }
});
