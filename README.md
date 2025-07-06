<div align="center">
  <h1>📚 Campus Koala</h1>
  <p>A modern, gamified study companion that helps you stay focused and productive</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
</div>

## 🚀 Overview

Campus Koala is a feature-rich study application designed to enhance productivity through gamification and smart time management. It combines task management, a Pomodoro-style study timer, and a reward system to make studying more engaging and effective.

### ✨ Key Features

- **🎯 Task Management** - Create, track, and organize your study tasks
- **⏱️ Study Timer** - Pomodoro technique with customizable work/break intervals
- **🎮 Game Time Rewards** - Earn gaming minutes based on study time (20% of study time)
- **📅 Calendar Integration** - Schedule and visualize your study sessions
- **📊 Progress Tracking** - Monitor your study habits and productivity
- **🔐 User Authentication** - Secure login and personalized experience
- **🌓 Dark/Light Mode** - Eye-friendly interface for any lighting condition

## 🛠️ Tech Stack

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS with custom theming
- **Backend**: Python Flask with SQLAlchemy ORM
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React Context API
- **Deployment**: Docker & Docker Compose (included)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 13+
- Docker (optional, for containerized deployment)

### 🏗️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/study-app.git
   cd study-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### ⚙️ Configuration

1. Create a `.env` file in the `backend` directory:
   ```env
   FLASK_APP=app.py
   FLASK_ENV=development
   DATABASE_URL=postgresql://username:password@localhost:5432/studyapp
   JWT_SECRET_KEY=your-secret-key-here
   ```

2. Configure frontend environment in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### 🚀 Running the Application

#### Development Mode

1. **Start the backend**:
   ```bash
   cd backend
   flask run
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

#### Using Docker (Production)

```bash
docker-compose up --build
```

## 📚 API Documentation

Detailed API documentation is available at `/api/docs` when running the backend server.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using Next.js and Flask
- Inspired by various productivity and Pomodoro applications
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Flask, SQLAlchemy
- Database: SQLite
