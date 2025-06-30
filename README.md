# TripPoll 95 🎯

A retro-themed web application for creating and sharing ranked-choice voting polls, perfect for deciding on group travel destinations with friends.

## Features

- **Ranked Choice Voting**: Drag-and-drop interface for ranking options
- **Instant Runoff Calculation**: Proper ranked choice voting algorithm with round-by-round elimination
- **Retro UI**: Authentic Windows 95 aesthetic with modern functionality
- **Shareable Polls**: Easy sharing with voting and results links
- **Admin Controls**: Secure poll management with admin keys
- **Live Results**: Real-time results visualization

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Styling**: Tailwind CSS with custom retro theme
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Storage**: In-memory (ready for PostgreSQL with Drizzle ORM)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd trippoll-95
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## Usage

1. **Create a Poll**: Enter a title like "Where should we go next?" and description like "whats the vibe?"
2. **Add Options**: Enter 3-6 travel destinations
3. **Share**: Copy the voting link and share with friends
4. **Vote**: Drag and drop to rank options in order of preference  
5. **View Results**: See live results with instant runoff calculation

## Deployment

The app is ready for deployment on Replit or any Node.js hosting platform.

### Replit Deployment
- The project is already configured for Replit
- Just click "Deploy" in your Replit workspace

### Other Platforms
- Build command: `npm run build`
- Start command: `npm start`
- Port: 5000 (configurable via PORT environment variable)

## License

MIT License - Feel free to use for your own group decision making!

---

*Built with ❤️ for making group travel decisions easier*