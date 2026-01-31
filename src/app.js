import express from "express";
import expressWs from "express-ws";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import http from "http";
import {
  getNearbyHospitals,
  getHospitalsByLocation,
  getHospitalsBySpecialty,
  getAllHospitals,
  formatHospitalResponse,
} from "./utils/hospitalUtils.js";
import { createReservation, formatReservationResponse, validateReservationData } from "./utils/reservationUtils.js";
// import Customer from "./modules/customer.model.js";
// import Hospital from "./modules/hospital.model.js";
// import Reservation from "./modules/reservation.model.js";

dotenv.config();

const app = express();

// Enable WebSocket support before routes
expressWs(app);

// Load routes after express-ws patches Router
const authRoutes = (await import("./routes/auth.routes.js")).default;
const reservationRoutes = (await import("./routes/reservation.routes.js")).default;
const twilioRoutes = (await import("./routes/twilio.routes.js")).default;
const hospitalRoutes = (await import("./routes/hospital.routes.js")).default;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes

app.use("/api/twilio", twilioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", reservationRoutes);
app.use("/api/hospitals", hospitalRoutes);

const SYSTEM_PROMPT = `
You are a helpful and friendly hospital booking voice assistant. This conversation is happening over a phone call, so your responses will be spoken aloud.

Information:
Today date is ${new Date().toLocaleDateString()} ${new Date().toLocaleDateString("en-US", { weekday: "long" })}

Your role is to:
1. Help customers find nearby hospitals based on their location
2. Provide information about hospital specialties and availability
3. Book appointments for patients
4. Answer questions about hospital services

Please adhere to these rules:
1. Provide clear, concise, and direct answers
2. Spell out all numbers
3. Do not use any special characters
4. Keep the conversation natural and engaging
5. Ask for location (city, state, or coordinates) when helping find hospitals
6. Confirm important details before booking appointments
`;

// Define tools/functions for OpenAI
const tools = [
  {
    type: "function",
    function: {
      name: "get_nearby_hospitals",
      description:
        "Find hospitals near a specific location using coordinates (latitude and longitude). Returns hospitals within a specified distance.",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "number",
            description: "Latitude coordinate of the location",
          },
          longitude: {
            type: "number",
            description: "Longitude coordinate of the location",
          },
          maxDistance: {
            type: "number",
            description: "Maximum distance in meters (default: 5000)",
            default: 5000,
          },
          limit: {
            type: "number",
            description: "Maximum number of hospitals to return (default: 5)",
            default: 5,
          },
        },
        required: ["latitude", "longitude"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_hospitals_by_location",
      description:
        "Find hospitals by city, state, or zip code. Use this when the user provides a city name or zip code.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name",
          },
          state: {
            type: "string",
            description: "State name or abbreviation",
          },
          zipCode: {
            type: "string",
            description: "Zip code",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_hospitals_by_specialty",
      description:
        "Find hospitals that offer a specific medical specialty (e.g., cardiology, pediatrics, orthopedics). Optionally filter by location.",
      parameters: {
        type: "object",
        properties: {
          specialty: {
            type: "string",
            description: "Medical specialty to search for",
          },
          latitude: {
            type: "number",
            description: "Optional latitude for location-based search",
          },
          longitude: {
            type: "number",
            description: "Optional longitude for location-based search",
          },
          maxDistance: {
            type: "number",
            description: "Maximum distance in meters (default: 10000)",
            default: 10000,
          },
        },
        required: ["specialty"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_hospitals",
      description:
        "Get a list of all available hospitals in the system. Returns hospitals with their names, contact info, specialties, and ratings.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of hospitals to return (default: 50)",
            default: 50,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reservation",
      description:
        "Create a new hospital appointment reservation for a customer. Collects customer name, selects hospital, appointment type, and date.",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "Full name of the customer/patient",
          },
          customerPhone: {
            type: "string",
            description: "Phone number of the customer",
          },
          hospitalName: {
            type: "string",
            description: "Name of the hospital",
          },
          appointmentType: {
            type: "string",
            enum: ["consultation", "surgery", "checkup", "emergency", "follow-up"],
            description: "Type of appointment",
          },
          reservationDate: {
            type: "string",
            description: "Date of the appointment (ISO format: YYYY-MM-DD)",
          },
          timeSlot: {
            type: "string",
            description: "Time slot for the appointment (e.g., 09:00 AM)",
          },
          reason: {
            type: "string",
            description: "Reason for the appointment",
          },
        },
        required: ["customerName", "hospitalName", "appointmentType", "reservationDate", "timeSlot"],
      },
    },
  },
];

/* ------------------ OpenAI Init ------------------ */
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// if (!OPENAI_API_KEY) {
//   throw new Error("OPENAI_API_KEY not set");
// }

/* ------------------ OpenAI Init with OpenRouter ------------------ */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY not set");
}

const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // required by OpenRouter
    "X-Title": "Hospital Voice Agent",
  },
});

/* Store active chat sessions */
const sessions = new Map();

const server = http.createServer(app);

/* ------------------ WebSocket Server ------------------ */
const wss = new WebSocketServer({ server, path: "/ws" });

/* ------------------ WebSocket Logic ------------------ */
wss.on("connection", (ws, req) => {
  let callSid = null;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const callerNumber = url.searchParams.get("caller");

  console.log("Incoming call from:", callerNumber);

  ws.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      /* ---------- Setup ---------- */
      if (message.type === "setup") {
        callSid = message.callSid;
        console.log("Call started:", callSid);

        sessions.set(callSid, [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "system",
            content: `Caller Number: ${callerNumber}`,
          },
        ]);

        // Auto-fetch all hospitals when user comes in
        try {
          const allHospitals = await getAllHospitals(50);
          const hospitalsInfo = allHospitals
            .map(
              (h) => `${h.hospitalName} - ${h.location?.city || ""}, Phone: ${h.phone}, Rating: ${h.rating || "N/A"}`,
            )
            .join("; ");

          const systemContext = {
            role: "assistant",
            content: `Here are the available hospitals: ${hospitalsInfo}\n\nI'm ready to help you book an appointment. Which hospital would you like to visit?\n`,
          };

          sessions.get(callSid).push(systemContext);
          console.log("Fetched and set hospital context for call:", callSid);
        } catch (error) {
          console.error("Error fetching hospitals on setup:", error);
        }
      } else if (message.type === "prompt") {
        /* ---------- Prompt ---------- */
        if (!callSid || !sessions.has(callSid)) return;

        const userText = message.voicePrompt;
        console.log("User:", userText);

        const history = sessions.get(callSid);

        history.push({
          role: "user",
          content: userText,
        });

        let completion = await openai.chat.completions.create({
          model: "openai/gpt-4o-mini",
          messages: history,
          tools: tools,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 180,
        });

        let responseMessage = completion.choices[0].message;

        // Handle tool calls
        if (responseMessage.tool_calls) {
          history.push(responseMessage);

          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            console.log(`Calling function: ${functionName}`, functionArgs);

            let functionResponse;

            try {
              if (functionName === "get_all_hospitals") {
                const hospitals = await getAllHospitals(functionArgs.limit || 50);
                functionResponse = JSON.stringify(hospitals);
              } else if (functionName === "get_nearby_hospitals") {
                const hospitals = await getNearbyHospitals(
                  functionArgs.longitude,
                  functionArgs.latitude,
                  functionArgs.maxDistance,
                  functionArgs.limit,
                );
                functionResponse = JSON.stringify(hospitals);
              } else if (functionName === "get_hospitals_by_location") {
                const hospitals = await getHospitalsByLocation(
                  functionArgs.city,
                  functionArgs.state,
                  functionArgs.zipCode,
                );
                functionResponse = JSON.stringify(hospitals);
              } else if (functionName === "get_hospitals_by_specialty") {
                const hospitals = await getHospitalsBySpecialty(
                  functionArgs.specialty,
                  functionArgs.longitude,
                  functionArgs.latitude,
                  functionArgs.maxDistance,
                );
                functionResponse = JSON.stringify(hospitals);
              } else if (functionName === "create_reservation") {
                // Handle reservation creation
                try {
                  const {
                    customerName,
                    customerPhone,
                    hospitalName,
                    appointmentType,
                    reservationDate,
                    timeSlot,
                    reason,
                  } = functionArgs;

                  console.log("Creating reservation for caller:", callerNumber);

                  // Validate reservation data
                  const validation = validateReservationData({
                    customerName,
                    hospitalName,
                    appointmentType,
                    reservationDate,
                    timeSlot,
                  });

                  if (!validation.isValid) {
                    functionResponse = JSON.stringify({
                      success: false,
                      error: "Validation failed",
                      errors: validation.errors,
                    });
                  } else {
                    // Create reservation using utility
                    const result = await createReservation(
                      customerName,
                      customerPhone || callerNumber,
                      hospitalName,
                      appointmentType,
                      reservationDate,
                      timeSlot,
                      reason,
                      callerNumber,
                    );
                    functionResponse = JSON.stringify(result);
                  }
                } catch (reservationError) {
                  functionResponse = JSON.stringify({
                    success: false,
                    error: "Failed to create reservation",
                    message: reservationError.message,
                  });
                }
              }
            } catch (error) {
              functionResponse = JSON.stringify({
                error: "Failed to fetch hospitals",
                message: error.message,
              });
            }

            history.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: functionResponse,
            });
          }

          // Get final response after tool calls
          completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: history,
            temperature: 0.3,
            max_tokens: 180,
          });

          responseMessage = completion.choices[0].message;
        }

        const reply = responseMessage.content;

        history.push({
          role: "assistant",
          content: reply,
        });

        ws.send(
          JSON.stringify({
            type: "text",
            token: reply,
            last: true,
          }),
        );

        console.log("Bot:", reply);
      } else if (message.type === "interrupt") {
        /* ---------- Interrupt ---------- */
        console.log("Barge-in detected:", callSid);
        // Optional: truncate history or cancel generation
      }
    } catch (err) {
      console.error("WS Error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Call ended:", callSid);
    if (callSid) sessions.delete(callSid);
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

export default server;
