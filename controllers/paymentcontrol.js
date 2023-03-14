

const { User, payments } = require('../models/usermodel');

// This function generates a payment schema for a given user for the given year and month
async function generatePaymentSchemaForUser(user, year, month) {
    console.log(user);
    const existingPayment = await payments.findOne({ user: user._id, year: year, month: month });
    if (!existingPayment) {
      const payment = new payments({
        user: user._id,
        year: year,
        month: month,
        amount: 1000,
        status: 'due'
      });
      await payment.save();
    }
  }
  
  // This function generates payment schemas for all users for the current year and month
  async function generatePaymentSchemasForCurrentMonth() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
  
    const users = await User.find();
    for (const user of users) {
      await generatePaymentSchemaForUser(user, currentYear, currentMonth);
    }
  }
 
  // This route handler generates a payment schema for a new user when they sign up
  async function handleUserSignup(User) {
    const user =User; // assuming the user object is attached to the request object
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    await generatePaymentSchemaForUser(user, currentYear, currentMonth);
    console.log("generated");
  }
  

module.exports = {
  generatePaymentSchemaForUser,
  generatePaymentSchemasForCurrentMonth,
  handleUserSignup
};
