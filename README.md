# EpiRoom

A modern, responsive web application for displaying real-time room availability at Epitech Lille university.

## Features

- 🎨 **Visual Status Indicators**: Three-color system (Green/Yellow/Red) for instant room availability
- 📱 **Fully Responsive**: Works seamlessly on mobile, tablet, and desktop
- 🔄 **Auto-Refresh**: Automatic updates every 2 minutes
- 📅 **Detailed View**: Click any room to see all daily reservations
- 🏢 **Floor Organization**: Rooms organized by floor (0, 1, 2)
- 🔍 **Service Manager Distinction**: Clear differentiation between Intra and MyEpitech reservations
- ⚡ **PWA Ready**: Can be installed as a mobile app

## Status Colors

- **Green**: Room is available (no reservations)
- **Yellow**: Reservation starting within 1 hour
- **Red**: Currently occupied

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: Native Fetch API with auto-refresh

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm start            # Run production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## API

The application fetches data from the Epitech room planning API:

```
https://lille-epiroom.epitest.eu/api/v1/fastPlanning?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

## Room Configuration

### Floor 0
- Stark, Pru'ha, Mei Hatsume (Rooms)
- Eliot Alderson, Bulma (Offices)

### Floor 1
- Microtech, Kanojedo, Arrakis, Pandora, Kaer Morhen, Krikkit, La Matrice (Rooms)
- Gallifrey, Le Continental, Poudlar (Offices)

### Floor 2
- Denis, MacAlistair, Ritchie, Ada Lovelace, Al Jazari, Roland Moreno, Gwen, Barzey (Rooms)
- Hedy Lamarr (Office)

## License

This project is for educational purposes at Epitech Lille.
