import dotenv from "dotenv";
dotenv.config();

export const incomingCall = (req, res) => {
  const WS_URL = `wss://${process.env.DOMAIN}/ws`;
  console.log("WS_URL:", WS_URL);
  const WELCOME_GREETING = "Welcome to the Hospital Booking Agent. How can I assist you today?";

  console.log("Incoming call - generating TwiML response");

  // add stt provider

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="${WS_URL}"
      welcomeGreeting="${WELCOME_GREETING}"
      ttsProvider="ElevenLabs"
      voice="STxLVfvNUAFB2Mhc218c"
    />
  </Connect>
</Response>`;

  res.type("text/xml").send(xml);
};
