[# 🌍 Tourism Explorer

A full-stack tourism and location exploration application built with a modern serverless architecture, featuring interactive search, location-based attractions, and real-time weather information.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework / Bundler:** Vite, React
* **Styling:** Tailwind CSS / Modern CSS Components

### **Backend**
* **Runtime / Deployment:** Cloudflare Workers
* **Framework:** Hono (Fast, lightweight web framework for the web-standards-compliant runtime)
* **APIs Integrated:** 
  * **Geoapify API** (for points of interest and location search)
  * **Open-Meteo API** (for real-time weather data)

---

## 📁 Project Structure

```text
tourism-explorer/
├── src/
│   ├── backend/           # Cloudflare Worker backend (Hono app)
│   │   ├── index.js       # Main API entry point & CORS configuration
│   │   └── places.js      # API integrations (Geoapify & Open-Meteo)
│   ├── frontend/          # Frontend application files
│   └── ...
├── .env.development       # Local environment configuration
├── package.json           # Root package configuration
└── README.md
](https://github.com/ratneshyadav1812/tourism-explorer)
