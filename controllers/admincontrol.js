const event = require("../models/event")




module.exports={

    viewevents: async() => {
      var events=await event.find({})
      return events
}
}
      