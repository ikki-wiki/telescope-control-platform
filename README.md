# 🛰️ Telescope Control Platform

A web-based control platform built with **React Vite** (frontend) and **Flask** (backend) to interface with an LX200-compatible telescope system. Designed for deployment on a Raspberry Pi at the Observatório Astronómico da Universidade da Madeira.

---

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/telescope-control-platform.git
cd telescope-control-platform-main
```

---

### 2. Backend (Server)

#### Requirements
- Python 3.9+  
- INDI server running (with telescope driver, e.g., LX200 or Simulator)

#### Setup
```bash
cd server
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Run the server
```bash
python server.py
```

The server will start on **http://localhost:7123**.

---

### 3. Frontend (Client)

#### Requirements
- Node.js 18+  
- npm or yarn

#### Setup
```bash
cd client
npm install
```

#### Run the client
```bash
npm run dev
```

The frontend will be available at **http://localhost:5173** (by default).

---

## ⚙️ Usage

1. Start the **INDI server** and ensure your telescope driver (e.g., Meade LX200) is running.  
2. Launch the **backend** (`server/server.py`).  
3. Launch the **frontend** (`client` with `npm run dev`).  
4. Open the client in your browser → interact with the telescope.  

---

## 🧪 Running with Telescope Simulator

If you don’t have telescope hardware, you can test using the **INDI Telescope Simulator**.

1. Install INDI if not already installed:
   ```bash
   sudo apt-get install indi-bin
   ```
2. Start the INDI server with the telescope simulator:
   ```bash
   indiserver -v indi_simulator_telescope
   ```
   By default, this runs on **localhost:7624**.
3. Start the **backend**:
   ```bash
   cd server
   source venv/bin/activate
   python server.py
   ```
4. Start the **frontend**:
   ```bash
   cd client
   npm run dev
   ```
5. Open **http://localhost:5173** in your browser → you can now test the UI with the telescope simulator.

---

## 📂 Project Structure
```
telescope-control-platform-main/
│── client/        # React frontend (Vite)
│── server/        # Flask backend + INDI controllers
│── README.md      # This file
```

---

## 🚀 Features
- Slew to Coordinates  
- Monitor Live Telescope Position
- Adjust Slew Speed 
- Sync Date and Time
- Manual Telescope Control
- Park the Telescope
