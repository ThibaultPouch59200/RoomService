# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EpiRoom is a responsive web application for displaying real-time room availability at Epitech Lille university. The application fetches room reservation data from an API and displays the occupancy status of rooms organized by floor.

## Core Requirements

### Room Status Display
- Display rooms organized by floor (Floor 0, 1, and 2)
- Three visual states based on current time:
  - **Green**: No reservation (room is free)
  - **Yellow**: Reservation within 1 hour or less
  - **Red**: Currently occupied (reservation active now)
- Distinguish between room types: Rooms (R) and Offices (B - Bureau)

### Reservation Details
- Click on any room to view all its reservations for the day
- Clearly differentiate between two service managers:
  - `intra`: Epitech internal system reservations
  - `my`: MyEpitech reservations
- Display reservation details: title, unit name, start time, end time

### UI/UX Priorities
- Responsive design that works on mobile, tablet, and desktop
- Progressive Web App (PWA) capabilities for mobile installation
- Intuitive, modern interface with excellent visual hierarchy
- Real-time or near-real-time updates of room status

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **UI Components**: Headless UI / shadcn/ui for accessible components

## API Integration

### Endpoint
```
https://lille-epiroom.epitest.eu/api/v1/fastPlanning?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Response Structure
The API returns an array containing an object with an `activities` array:
```typescript
{
  activities: [
    {
      id: string
      title: string
      second_title: string
      unit_name: string
      start_date: string // ISO 8601 format with Z timezone
      end_date: string   // ISO 8601 format with Z timezone
      room?: [{ id: number, name: string }] // Optional - some activities have no room
      service_manager: "intra" | "my"
    }
  ]
}
```

### Important Notes
- All dates are in UTC (Z timezone)
- Not all activities have a `room` field (some are general activities)
- Room names match those in `room.txt`
- Use the same date for both `startDate` and `endDate` to get a single day's schedule

## Room Configuration

Rooms are organized by floor as defined in `room.txt`:

**Floor 0**: Stark, Pru'ha, Mei Hatsume, Eliot Alderson (B), Bulma (B)
**Floor 1**: Microtech, Kanojedo, Arrakis, Pandora, Kaer Morhen, Krikkit, La Matrice, Gallifrey (B), Le Continental (B), Poudlar (B)
**Floor 2**: Denis, MacAlistair, Ritchie, Ada Lovelace, Al Jazari, Roland Moreno, Gwen, Barzey, Hedy Lamarr (B)

(B) indicates Bureau (office) rather than a regular room.

## Architecture

### Data Flow
1. Fetch daily schedule from API on page load and at regular intervals
2. Parse activities and group by room name
3. Calculate current status for each room based on:
   - Current time vs reservation start/end times
   - Upcoming reservations within 1 hour
4. Render floor-by-floor view with color-coded room status
5. Handle room click to show detailed reservation list

### State Management
- Use React hooks for local state management
- Consider SWR or React Query for API data fetching and caching
- Update room status periodically (e.g., every 1-2 minutes)

### Key Components Structure
- `RoomGrid`: Displays all rooms organized by floor
- `RoomCard`: Individual room with visual status indicator
- `RoomDetail`: Modal/panel showing all reservations for a selected room
- `ReservationItem`: Individual reservation display with service manager indicator

## Development Commands

### Project Setup
```bash
npm install          # Install dependencies
```

### Development
```bash
npm run dev          # Start development server (usually http://localhost:3000)
```

### Build
```bash
npm run build        # Create production build
npm start            # Run production build locally
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler checks
```

## Key Implementation Considerations

### Time Calculations
- Convert all UTC times from API to local timezone for display
- Compare current time with reservation windows to determine status
- Account for edge cases: overlapping reservations, all-day events

### Performance
- Memoize room status calculations
- Implement efficient re-rendering when time ticks forward
- Consider virtual scrolling if displaying many rooms

### Visual Design
- Use clear color contrast for status indicators (accessibility)
- Ensure touch targets are appropriately sized for mobile
- Implement smooth transitions between status changes
- Consider dark mode support

### PWA Features
- Add manifest.json with app icons and metadata
- Implement service worker for offline functionality
- Enable "Add to Home Screen" prompt on mobile
