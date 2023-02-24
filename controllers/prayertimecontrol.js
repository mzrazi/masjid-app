const prayertime=require("../models/prayertimemodel")
const moment = require('moment');
const  mongoose=require('mongoose')
const axios=require('axios')







const interval = setInterval(() => {
    const now = moment();
    if (now.hour() === 0 && now.minute() === 0 && now.second() === 0) { // check once per day at midnight
      if (now.date() === 1) { // check if it's the first day of the month
        savePrayerTimes(); // save the prayer times
      }
    }
  }, 86400000);// 24 hours in milliseconds

module.exports={
  
      

saveprayertime:async()=>{
  
 
    const currentYear = moment().year();
    const currentMonth = moment().month() + 1; // month is zero-based
    
    const response = await axios.get(`http://api.aladhan.com/v1/calendarByCity/${currentYear}/${currentMonth}?city=Kochi&country=India&method=1`);
    
    const data = response.data.data;
    console.log(data[0]);
    const prayerTimes = data.map(day => ({
      date: moment(day.date.readable, 'DD MMM YYYY').toDate(),
      timestamp: moment(`${day.date.readable} ${day.meta.timezone}`, 'DD MMM YYYY Z').toDate(),
      fajr: day.timings.Fajr,
      sunrise: day.timings.Sunrise,
      dhuhr: day.timings.Dhuhr,
      asr: day.timings.Asr,
      maghrib: day.timings.Maghrib,
      isha: day.timings.Isha
    }));
    
    
    await prayertime.insertMany(prayerTimes);
  },


  
}