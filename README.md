# Hospital Booking Agent - Backend

A Node.js/Express backend server for a hospital booking system with AI-powered voice and chat interactions.

## 🚀 Features

- **AI-Powered Conversations**: OpenRouter integration for intelligent chat responses
- **Voice Integration**: Twilio voice call support with real-time WebSocket connections
- **Authentication**: JWT-based user authentication
- **Hospital Management**: Search and filter hospitals by location and specialty
- **Reservation System**: Book appointments with SMS confirmations
- **Real-time Communication**: WebSocket support for live interactions

## 🏗️ Architecture Flow

### Voice Agent Call Flow

Here's how the AI voice agent works when a user calls:

```
┌─────────────┐
│    User     │ Makes a phone call
│   (Caller)  │
└──────┬──────┘
       │
       │ 1. Initiates call
       ▼
┌─────────────────────┐
│   Twilio Voice      │
│   (PSTN/Client)     │ Receives incoming call
└──────┬──────────────┘
       │
       │ 2. Triggers webhook
       ▼
┌─────────────────────────────────────┐
│  POST /api/twilio/incoming-call     │
│  (Twilio Webhook Endpoint)          │ Returns TwiML with ConversationRelay config
└──────┬──────────────────────────────┘
       │
       │ 3. Establishes connection
       ▼
┌──────────────────────────────────────────┐
│   Twilio ConversationRelay API           │
│   ┌────────┐              ┌────────┐    │
│   │  STT   │              │  TTS   │    │ Speech-to-Text & Text-to-Speech
│   │(Twilio)│              │(11Labs)│    │
│   └───┬────┘              └───▲────┘    │
└───────┼───────────────────────┼──────────┘
        │                       │
        │ 4. Bidirectional      │
        │    WebSocket          │
        ▼                       │
┌────────────────────────────────────┐
│    WebSocket Server (WS /ws)       │
│                                    │
│  ┌──────────────────────────────┐ │
│  │   📨 Receives text from STT  │ │
│  └──────────┬───────────────────┘ │
│             │                      │
│             ▼                      │
│  ┌──────────────────────────────┐ │
│  │    🤖 LLM Processing         │ │ 5. AI processes the conversation
│  │    (OpenRouter API)          │ │    - Understands user intent
│  │                              │ │    - Accesses hospital database
│  │  • Hospital search logic    │ │    - Makes reservations
│  │  • Appointment booking      │ │    - Generates responses
│  │  • Knowledge base           │ │
│  │  • Tool calling (functions) │ │
│  └──────────┬───────────────────┘ │
│             │                      │
│             ▼                      │
│  ┌──────────────────────────────┐ │
│  │   📤 Sends text response     │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
        │
        │ 6. Text response
        │
        └──────────────────────────┐
                                   │
                                   ▼
        ┌──────────────────────────────────┐
        │  TTS (ElevenLabs via Twilio)     │ 7. Converts text to speech
        └──────────────┬───────────────────┘
                       │
                       │ 8. Audio delivery
                       ▼
                ┌─────────────┐
                │    User     │ Hears AI response
                │   (Caller)  │
                └─────────────┘
```

### Key Components:

1. **Twilio Voice**: Handles incoming phone calls (PSTN/Client)
2. **Webhook Endpoint**: Returns TwiML configuration with ConversationRelay settings
3. **ConversationRelay API**: Twilio's service that manages:
   - **STT (Speech-to-Text)**: Converts user's voice to text in real-time
   - **TTS (Text-to-Speech)**: Uses ElevenLabs voice to convert AI responses to audio
4. **WebSocket Server**: Bidirectional communication channel (`/ws` endpoint)
5. **LLM Logic**: OpenRouter AI processes conversations:
   - Understands user intent
   - Searches hospital database
   - Creates reservations
   - Executes function calls (tool calling)
6. **Response Flow**: Text → TTS → Audio → User

### Real-time Conversation Loop:

```
User speaks → STT → Text → WebSocket → LLM Processing →
Response Text → WebSocket → TTS → Audio → User hears
```

This creates a natural, real-time conversation experience where the AI can:

- Answer questions about hospitals
- Search for facilities by location or specialty
- Book appointments
- Confirm reservations via SMS

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **MongoDB**: v5.0 or higher
- **pnpm**: v10.27.0 or higher
- **Twilio Account**: For voice and SMS services
- **OpenRouter API Key**: For AI conversation capabilities

## 🔧 Dependencies Overview

### Core Dependencies

- **express**: Web application framework
- **mongoose**: MongoDB object modeling
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### AI & Communication Services

- **openai**: OpenAI SDK (used with OpenRouter)
- **@google/generative-ai**: Google Gemini AI integration
- **twilio**: Twilio API for voice calls and SMS
- **express-ws**: WebSocket support for real-time communication
- **ws**: WebSocket client and server

## 🛠️ Installation

1. **Install dependencies using pnpm:**

   ```bash
   pnpm install
   ```

2. **Create environment file:**
   Create a `.env` file in the backend directory with the following variables:

   ```env
   # Server Configuration
   PORT=5000
   DOMAIN=your-domain.com  # For production, or localhost:5000 for development

   # Database
   MONGODB_URI=mongodb://localhost:27017/hospital-booking-agent

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # OpenRouter API (for AI conversations)
   OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key

   # Twilio Configuration (for voice calls and SMS)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## 🔑 Getting API Keys

### OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Add it to your `.env` file as `OPENROUTER_API_KEY`

**Note**: OpenRouter provides access to multiple AI models including GPT-4, Claude, and others through a single API.

### Twilio Configuration

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase or configure a Twilio phone number with voice capabilities
4. Add credentials to your `.env` file:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

**Twilio Features Used:**

- Voice calls with ConversationRelay
- SMS notifications for appointment confirmations
- WebSocket integration for real-time voice processing

## 💾 Database Setup

1. **Start MongoDB:**

   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community

   # Or run manually
   mongod --config /usr/local/etc/mongod.conf
   ```

2. **Seed the database with sample hospitals:**
   ```bash
   pnpm seed
   ```
   This will populate your database with sample hospital data across different cities.

## 🚀 Running the Application

### Development Mode (with auto-restart)

```bash
pnpm dev
```

### Production Mode

```bash
pnpm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── index.js               # Server entry point
│   ├── controller/            # Request handlers
│   │   ├── auth.controller.js
│   │   ├── hospital.controller.js
│   │   ├── reservation.controller.js
│   │   ├── twilio.controller.js
│   │   └── user.controller.js
│   ├── middleware/            # Custom middleware
│   │   └── auth.middleware.js
│   ├── modules/               # Mongoose models
│   │   ├── calllog.model.js
│   │   ├── customer.model.js
│   │   ├── hospital.model.js
│   │   ├── reservation.model.js
│   │   └── user.model.js
│   ├── routes/                # API routes
│   │   ├── auth.routes.js
│   │   ├── hospital.routes.js
│   │   ├── reservation.routes.js
│   │   ├── twilio.routes.js
│   │   └── user.routes.js
│   └── utils/                 # Helper functions
│       ├── hospitalUtils.js
│       └── reservationUtils.js
├── seed.js                    # Database seeding script
├── package.json
└── .env                       # Environment variables (create this)
```

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Hospitals

- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `GET /api/hospitals/location/:city` - Search hospitals by city
- `GET /api/hospitals/specialty/:specialty` - Filter by specialty

### Reservations

- `POST /api/reservations` - Create new appointment
- `GET /api/reservations/:id` - Get reservation details
- `GET /api/reservations/user/:userId` - Get user's reservations

### Twilio

- `POST /api/twilio/incoming-call` - Handle incoming voice calls
- `WS /ws` - WebSocket endpoint for real-time voice communication

## 🔒 Environment Variables Details

| Variable              | Description                 | Required | Example                                            |
| --------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `PORT`                | Server port                 | No       | `5000`                                             |
| `DOMAIN`              | Server domain for WebSocket | Yes      | `example.com`                                      |
| `MONGODB_URI`         | MongoDB connection string   | Yes      | `mongodb://localhost:27017/hospital-booking-agent` |
| `JWT_SECRET`          | Secret key for JWT tokens   | Yes      | `your-secret-key`                                  |
| `OPENROUTER_API_KEY`  | OpenRouter API key          | Yes      | `sk-or-v1-...`                                     |
| `TWILIO_ACCOUNT_SID`  | Twilio account identifier   | Yes      | `ACxxxxx...`                                       |
| `TWILIO_AUTH_TOKEN`   | Twilio authentication token | Yes      | `your-auth-token`                                  |
| `TWILIO_PHONE_NUMBER` | Twilio phone number         | Yes      | `+1234567890`                                      |

## 🧪 Testing

Test the voice call functionality:

1. Configure Twilio webhook to point to your `/api/twilio/incoming-call` endpoint
2. Call your Twilio number
3. The system will connect you to an AI-powered voice agent

## 🐛 Troubleshooting

**MongoDB Connection Issues:**

- Ensure MongoDB is running: `brew services list`
- Check connection string in `.env`

**Twilio WebSocket Issues:**

- Verify `DOMAIN` environment variable is set correctly
- For local development, use ngrok to expose your local server

**OpenRouter API Issues:**

- Verify API key is valid
- Check OpenRouter dashboard for usage limits
- Ensure you have credits in your OpenRouter account

## 📝 Notes

- The server uses WebSocket for real-time voice communication with Twilio
- OpenRouter is used instead of direct OpenAI API for cost efficiency and model flexibility
- SMS notifications are sent automatically when reservations are created
- All passwords are hashed using bcrypt before storage

## 🤝 Development

For development with hot-reload, use:

```bash
pnpm dev
```

This will use nodemon to automatically restart the server on file changes.
