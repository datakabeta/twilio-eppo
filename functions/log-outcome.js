exports.handler = async function (context, event, callback) {
  const response = new Twilio.Response();

  const { Analytics } = require('@segment/analytics-node');
  const analytics = new Analytics({ 'writeKey': context.SEGMENT_WRITE_KEY, maxEventsInBatch: 1 });

  try {
    //Log experiment outcomes in Segment
    const trackResult = await trackEvent(event);

    //Return success
    response.appendHeader("Content-Type", "application/json");
    response.setStatusCode(200);
    response.setBody({ status: "success" });

    return callback(null, response);
  } catch (error) {
    //Return error
    console.error("Error:", error.message);
    callback(error);
  }

  // Log the user's response as an event in Segment
  async function trackEvent(event) {
    return new Promise((resolve, reject) => {
      try {
        analytics.track({
          userId: event.userID,
          event: `User Response`,
          properties: { experimentKey: event.experimentKey, has_user_replied: event.has_user_replied, userID: event.userID }
        });

        resolve("Logged");
        
      } catch (err) {
        console.error("Error logging event to Segment");
        reject(err);
      }
    });
  }

};


