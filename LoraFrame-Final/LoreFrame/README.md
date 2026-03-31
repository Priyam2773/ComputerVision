# 🌌 LoraFrame - Generative AI Studio

**LoraFrame** (formerly Invitro Frontend) is a cutting-edge web interface for a professional Generative AI engine. It is designed to empower creators with persistent character identity management, high-fidelity image generation, and motion video synthesis.

## ✨ Key Features

### 🎬 Professional Studio Dashboard
The core experience resides in the **Studio Dashboard**, a cinematic interface for advanced generation tasks:
-   **TechHUD**: Real-time holographic overlay displaying GPU status, neural credits, and job queues.
-   **Director Panel**: A sophisticated command center for inputting prompts and controlling generation parameters.
-   **Timeline**: A visual history of your generated assets (images & videos), allowing for easy review and iteration.

### 👤 Neural Identity (Cast Locker)
Maintain character consistency across thousands of generations with the **Cast Locker**:
-   **Identity Persistence**: Upload reference images to create "Cast Members". The system extracts and locks onto facial features.
-   **Memory Health**: Real-time monitoring of "Neural Health" (vector integrity) for each character.
-   **Auto-Recalibration**: Tools to re-extract and fix identity vectors if generation drift occurs.

### 🌊 Cinematic UX/UI
-   **Immersive Design**: Built on a dark, cyberpunk-inspired aesthetic with glassmorphism, glowing accents, and smooth animations using [Framer Motion](https://www.framer.com/motion/).
-   **WebGL Effects**: The landing page (`DashFront`) features dynamic background layers, deep space starfields, and holographic previews.
-   **Responsive Layout**: Fully responsive interface that adapts to various screen sizes.

---

## 🛠️ Technology Stack

-   **Frontend Framework**: [React 19](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: 
    -   [TailwindCSS v4](https://tailwindcss.com/) (latest engine)
    -   [Framer Motion](https://www.framer.com/motion/) (Animation)
    -   [Lucide React](https://lucide.dev/) (Icons)
-   **Routing**: `react-router-dom` (HashRouter for robust client-side routing)
-   **State Management**: React Context (`StudioContext`)
-   **Notifications**: `react-toastify`

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18 or higher recommended)
-   npm or yarn

### Installation
1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd INVITRO_FRONTEND
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_BASE_URL=http://localhost:8000  # Replace with your backend URL
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

### Building for Production
```bash
npm run build
```

---

## 🧠 Core Systems

### 1. Generation Pipeline (`StudioContext`)
The robust `generateStoryboard` function handles the complex lifecycle of an AI job:
1.  **Identity Refresh**: Automatically calls `/api/v1/characters/{id}/reextract-identity` to ensure the character's face vector is current.
2.  **Job Dispatch**: Sends the prompt and configuration to `/api/v1/generate`.
3.  **Polling**: Continuously checks `/api/v1/jobs/{id}` until the status is `success` or `failed`.
4.  **Video Synthesis**: If video mode is active, it chains a subsequent call to `/api/v1/generate-video-from-image` after the initial image is ready.

### 2. Routing Logic
The application uses `HashRouter` to prevent 404 errors on refresh when hosted on static file servers or environments without server-side rewrite rules.
-   **`/`**: Landing Page (Cinematic Intro)
-   **`/Tool`**: Main Studio Dashboard (requires `StudioContext`)
-   **`/auth`**: Authentication Gate

---

## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

*Powered by Invitro Engine & DeepCine Technology*
