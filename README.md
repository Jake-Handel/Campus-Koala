# Study App

A full-stack study application built with Next.js and Flask. Features include task management, study timer with game time rewards, and calendar integration.

Campus Koala aims to foucs and enhance a student or teacher's study experience by tracking their progress and rewards. The app is designed to be user-friendly and accessible, with a focus on ease of use and integration with other tools. 

## Setup

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip3 install -r requirements.txt
```

2. Run the Flask server:
```bash
python3 app.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

Or run both frontend and backend concurrently:
```bash
cd frontend
npm run dev  # Terminal 1
npm run backend  # Terminal 2
```

## Features

- User authentication
- Task management with calendar integration
- Study timer with Pomodoro technique
- Game time rewards (20% of study time)
- Modern, responsive UI with Tailwind CSS

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Flask, SQLAlchemy
- Database: SQLite
