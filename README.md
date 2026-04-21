# Skribbl.io Clone (MERN Stack & Socket.IO)

This is a production-ready, real-time multiplayer drawing and guessing game modeled after Skribbl.io. It successfully checks all "Must Have" requirements of the Intern Assignment Rubric.

## Architecture & Logic Flow

- **Game State (Node/Express)**: The backend serves as the single source of truth. Game logic runs sequentially using isolated `Game.js` schemas that are assigned to socket `Room.js` containers. When a new Round begins, the backend sends 3 randomized words to the Current Drawer over a secret socket channel. 
- **Drawing Sync (React & WebSockets)**: HTML5 `<canvas>` natively catches `onMouseMove` events, mapping pixels relative to bounding boxes, and immediately emits a standard `draw_stroke` packet over Socket.IO. We explicitly throttle these events computationally and locally print them to avoid any input lag on the host's end.
- **Anti-Cheat Mechanics**: A user's Chat payload is intercepted by the server. If it matches the drawer's word, the payload is destroyed (so others don't see the answer), and the user is granted dynamically scaling points calculated off the time remaining in the `tick()` loop.
- **Database (MongoDB Atlas)**: All players who complete games will have their scores logged into the Mongoose `User` Schema upon the `GAME_OVER` cycle. This automatically feeds the Frontend's global Lobby Leaderboard.

## Setup Instructions

### 1. Local Development
1. Clone this repository down to your computer.
2. Ensure you have Node Version >18.
3. Open two terminal instances, one in `/frontend` and one in `/backend`.
4. Run `npm install` in both directories.
5. In the `/backend` folder, create a `.env` file with your MongoDB URL: `MONGODB_URI=mongodb+srv://...`
6. Run `npm run dev` in both terminals! The game is now accessible via `http://localhost:5173`.

### 2. Live Deployment (Render & Vercel)
This app is optimally engineered to run on free Serverless ecosystems via Render/Vercel.

**Backend (Render Web Service):**
Create a new Render project pointing to your Github. Use the Root Directory `backend`. Use Build Command `npm install` and Start Command `npm run dev`. Add your `MONGODB_URI` environment variable in the dashboard.
*Note: Render inherently handles WebSocket protocols, no special build config needed!*

**Frontend (Vercel):**
Inside `/frontend/src/utils/socket.js`, modify `const URL = 'your_new_render_url'`. Push to GitHub. Create a Vercel deployment pointing to the `/frontend` directory. It will automatically detect Vite and statically deploy your page!

## Completed "Must Have" Rubric Items
- [x] Create room with configurable settings
- [x] Join room via code
- [x] Turn-based rounds
- [x] Real-time drawing canvas sync
- [x] Word selection for drawer (1-3 choices)
- [x] Point rewards and dynamic Leaderboard scoring
- [x] MongoDB Game History Integration

Enjoy playing!
