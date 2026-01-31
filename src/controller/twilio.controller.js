import dotenv from "dotenv";
dotenv.config();

export const incomingCall = (req, res) => {
  const WS_URL = `wss://${process.env.DOMAIN}/ws`;
  console.log("WS_URL:", WS_URL);
  const WELCOME_GREETING = "Welcome to the Hospital Booking Agent. How can I assist you today?";

  const { body } = req;

  const callerNumber = body.Caller;

  // add stt provider

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="${WS_URL}?caller=${encodeURIComponent(callerNumber)}"
      welcomeGreeting="${WELCOME_GREETING}"
      ttsProvider="ElevenLabs"
      voice="jqcCZkN6Knx8BJ5TBdYR"
    />
  </Connect>
</Response>`;

  res.type("text/xml").send(xml);
};
