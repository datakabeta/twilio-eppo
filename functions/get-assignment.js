exports.handler = async function (context, event, callback) {

  const response = new Twilio.Response();

  const EppoSdk = require("@eppo/node-server-sdk");

  const { Analytics } = require("@segment/analytics-node");
  const analytics = new Analytics({ writeKey: context.SEGMENT_KEY_ASSIGNMENTS, maxEventsInBatch: 0 });
  
  try {

    //Eppo assignments logger 
    const assignmentLogger = {
      logAssignment: async function (assignment) {
        await trackEvent(assignment);
      }
    };

    //Initialize Eppo SDK
    const { init } = EppoSdk;
    await init({ apiKey: context.EPPO_SDK_KEY, assignmentLogger });

    //Get variation from Eppo
    const eppoClient = EppoSdk.getInstance();
    const variation = await getAssignment(event, eppoClient);

    //Return assignment
    response.appendHeader("Content-Type", "application/json");
    response.setStatusCode(200);
    response.setBody({ variation: variation, fakeUserID: userID });

    return callback(null, response);
  } catch (error) {
    // Return error
    console.error("Error:", error.message);
    return callback(error);
  }

  //Log assignment event in Segment
  async function trackEvent(assignment) {
    return new Promise(async (resolve, reject) => {
      try {
        analytics.track({
          userId: assignment.userID,
          event: `Feature Assignment`,
          properties: assignment,
        });
        resolve();
      } catch (err) {
        console.error("Error logging event to Segment");
        reject(err);
      }
    });
  }

  //Get assignment from Eppo  
  async function getAssignment(event, eppoClient) {

    return new Promise((resolve, reject) => {
      try {
        const assignment = eppoClient.getStringAssignment(event.userID, event.experimentKey);
        resolve(assignment);
      } catch (err) {
        console.error("Error getting variation");
        reject(err);
      }
    });
  }
};
