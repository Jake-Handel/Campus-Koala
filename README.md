# Study App

A full-stack study application built with Next.js and Flask. Features include task management, study timer with game time rewards, and calendar integration.

## Project Structure

```
study-app/
├── backend/
│   ├── venv/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   └── timer/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── types/
│   ├── public/
│   └── package.json
└── README.md
```

## Setup

### Backend Setup

1. Create and activate virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
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
