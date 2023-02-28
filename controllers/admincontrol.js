const event = require("../models/event")




module.exports={

  viewevents: async() => {
    try {
      const events = await event.find({});
      return events;
    } catch (error) {
      console.error(error);
      throw new Error('Error getting events');
    }
  },
  
  deleteevent: async (id) => {
    try {
      const deletedEvent = await event.findByIdAndDelete(id);
      if (!deletedEvent) {
        throw new Error('Event not found');
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  
  getevent: async (id) => {
    try {
      const newevent = await event.findById(id);
      if (!newevent) {
        throw new Error('Event not found');
      }
      return newevent;
    } catch (error) {
      console.error(error);
      throw new Error('Error getting event');
    }
  },

  announce:(data)=>{
    
    const { title, message } = data;

  // Create a new document using the model
  const newAnnounce = new Announce({ title, message });

  // Save the document to the database
  newAnnounce.save((err) => {
    if (err) {
      // Handle any validation errors
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return validationErrors
    } else {
     return true
    }
  });
  },
  
  
  
}
      