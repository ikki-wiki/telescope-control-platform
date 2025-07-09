# 🛰️ Telescope Control Platform

A web-based control platform built with **React** (frontend) and **Flask** (backend) to interface with an LX200-compatible telescope system. Designed for deployment on a Raspberry Pi at the Observatório Astronómico da Universidade da Madeira.

---

## 📦 Tech Stack

- 🖥️ **Frontend**: React + Vite
- 🧠 **Backend**: Python + Flask
- 🔌 **Communication**: TCP socket (LX200 protocol)
- 🧪 **Tested On**: Raspberry Pi, Windows PC

---

## 🧭 Project Structure

telescope-control-platform/
├── client/ # React frontend
├── server/ # Flask backend
│ ├── server.py # Flask API server
│ ├── telescope.py # Telescope command logic
│ └── venv/ # Python virtual environment (excluded from Git)
└── README.md

---

## 🚀 Getting Started

### ⚙️ 1. Clone the Repo

```bash
git clone https://github.com/ikki-wiki/telescope-control-platform.git
cd telescope-control-platform

🧠 2. Backend (Flask)

🔹 Setup Virtual Environment
cd server
python -m venv venv

🔹 Activate Environment
PowerShell: .\venv\Scripts\Activate.ps1
CMD: venv\Scripts\activate.bat

🔹 Install Requirements
pip install flask flask-cors
pip freeze > requirements.txt

🔹 Run the Server
python server.py
Server runs on: http://localhost:7123

🌐 3. Frontend (React)

🔹 Setup
cd ../client
npm install

🔹 Run Development Server
npm run dev
Opens on: http://localhost:5173 or similar (Vite default)

| Method | Route              | Description                |
| ------ | ------------------ | -------------------------- |
| POST   | `/api/movement`    | Move telescope (RA/DEC)    |
| POST   | `/api/alignment`   | Alignment mode             |
| POST   | `/api/information` | Get current info (RA, DEC) |
| POST   | `/api/setTime`     | Set date/time              |
| POST   | `/api/coordinates` | Slew to specific coords    |

💾 Deployment on Raspberry Pi
Clone this repo onto your Pi.

Set up Python virtual environment and install backend dependencies.

Build the React frontend:
cd client
npm run build

Serve the React build from Flask or using a web server like Nginx.

Use systemd or tmux to keep the backend running.

