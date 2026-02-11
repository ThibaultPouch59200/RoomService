# EpiRoom

A modern, responsive web application for displaying real-time room availability at Epitech Lille university.

## Features

- 🎨 **Visual Status Indicators**: Three-color system (Green/Yellow/Red) for instant room availability
- 📱 **Fully Responsive**: Works seamlessly on mobile, tablet, and desktop
- 📅 **Date Selection**: View room availability for any date (Today, Tomorrow, or custom date)
- 🏢 **Floor Selector**: Quick navigation between floors without scrolling
- 🔄 **Auto-Refresh**: Automatic updates every 2 minutes
- 🚪 **Detailed View**: Click any room to see all daily reservations
- 🔍 **Service Manager Distinction**: Clear differentiation between Intra and MyEpitech reservations
- 🏛️ **Office/Bureau Display**: Offices shown in grey and marked as non-bookable
- ⚡ **PWA Ready**: Can be installed as a mobile app

## Status Colors

- **Green**: Room is available (no reservations)
- **Yellow**: Reservation starting within 1 hour
- **Red**: Currently occupied
- **Grey**: Office/Bureau (not bookable)

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

## Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start the container:

```bash
docker-compose up -d
```

2. Stop the container:

```bash
docker-compose down
```

3. View logs:

```bash
docker-compose logs -f
```

### Using Docker directly

1. Build the image:

```bash
docker build -t epiroom .
```

2. Run the container:

```bash
docker run -p 3000:3000 epiroom
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## API

The application fetches data from the Epitech room planning API:

```
https://lille-epiroom.epitest.eu/api/v1/planning?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
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
