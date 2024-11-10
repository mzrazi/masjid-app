var express = require('express');
const { reset } = require('nodemon');
const { changeAdminPass, changeAdminUsername } = require('../controllers/admincontrol');
const { saveprayertime } = require('../controllers/prayertimecontrol');
const { viewevents, editProfile, changePassword, addfamily, viewall, viewuserfamily, userdetails, savemessage, editfamily, deletefamily, getimages, forgotpassword, verifytoken, resetpassword, getuserpayment, getCurrentAndPastPayments, getPrayerTimesForMonth, generatePaymentSchemasForUsers, getPaymentStatus, getAllPaymentStatuses, getAllNotifications } = require('../controllers/usercontrol');
var router = express.Router();
const userController = require('../controllers/usercontrol');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User =require('../models/usermodel')

const razorpay = new Razorpay({
  key_id: 'rzp_test_6i5nQKZQNF4RNj',
  key_secret: 'bu5DwShi4kj3oGx29dk14VW7'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect("/admin")
});

router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/verify-email/:token',userController.verifyEmail)
router.get('/view-events',viewevents)
router.put('/edit-profile',editProfile)
router.post("/change-password", changePassword)
router.post("/add-families",addfamily)
router.get("/view-families",viewall)
router.post("/user-family",viewuserfamily)
router.post("/user-details",userdetails)
router.post("/message",savemessage)
router.put("/edit-member",editfamily)
router.delete("/delete-member",deletefamily)
router.get("/gallery",getimages)
router.post("/forgot-password",forgotpassword),
router.get("/verify-token/:resetToken",verifytoken)
router.post("/reset-password/:resetToken",resetpassword)
router.get('/prayertime',saveprayertime)
router.get('/prayertime-month',getPrayerTimesForMonth)
router.post('/user-payment',getPaymentStatus)
router.post('/user-all-payment',getAllPaymentStatuses)
router.get('/payment-schema',generatePaymentSchemasForUsers)
router.post("/user-notification",getAllNotifications)





router.post('/create-order', async (req, res) => {
  const { amount, currency = 'INR' } = req.body;

  try {
    const options = {
      amount: amount, // Amount is in smallest currency unit (e.g., paise for INR)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log(order)
    res.json({ orderId: order.id ,orderAmount:order.amount});
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error });
  }
});
router.post('/verify-payment', async (req, res) => {
  const { orderId, paymentId, signature, amount, userId } = req.body;  // Include userId in the request

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', 'bu5DwShi4kj3oGx29dk14VW7')  // Replace with your Razorpay Secret Key
    .update(body)
    .digest('hex');

  console.log(req.body);  // Debugging: Output the request body

  // Step 1: Verify the signature
  if (expectedSignature === signature) {
    try {
      // Step 2: Fetch the user from the database using userId
      const user = await User.findById(userId);  // Ensure you pass the correct userId from frontend
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Step 3: Save the payment status to the PaymentStatus collection
      const paymentStatus = new PaymentStatus({
        user: userId,  // The user who made the donation
        year: new Date().getFullYear(),  // The current year
        month: new Date().getMonth() + 1,  // The current month (1-12)
        amount: amount / 100,  // Amount in INR (Razorpay sends it in paise)
        status: 'paid',  // Payment is successful
        paidOn: new Date().toISOString(),  // The date the payment was made
      });

      // Save the payment status to the database
      await paymentStatus.save();

      // Step 4: Respond with success
      res.json({
        message: 'Payment verified successfully',
        status: 'success',
        paymentStatus: paymentStatus,  // Optional: You can return the saved payment status
      });
    } catch (error) {
      console.error('Error saving payment status:', error);
      res.status(500).json({ message: 'Error saving payment status', error });
    }
  } else {
    // Signature verification failed
    res.status(400).json({ message: 'Payment verification failed' });
  }
});


module.exports = router; 
