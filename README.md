# Divine Fantasy: Whispers

A web-based RPG that blends social simulation, skilling, and strategic conquest in a dark fantasy world.

## Project Structure

- `docs/` - Technical docs, ADRs, and game design docs (`docs/gdd/`)
- `src/` - The React game application source

## Getting Started

1. Navigate to the game directory:
   ```bash
   cd divine_fantasy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Current Status

Phase 2.3: Main Game Loop & Screen Management - Complete
- Refactored App.tsx to use a Game component for screen management
- Updated useUIStore with all screen types
- Integrated game clock logic

Next: Phase 3.1 - Character & World mechanics
