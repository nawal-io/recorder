# 🎥 Screen & Camera Recorder (Loom-like Studio)

A lightweight, privacy-focused, 100% client-side web application for screen recording with a draggable camera bubble overlay. Built with modern web technologies, it allows users to record their screen, webcam, and audio without uploading any video data to external servers.

![SnapStrip Photobooth Preview](https://raw.githubusercontent.com/nawalauliahasanhunaifa/arsip-laporan-praktikum/main/assets/wip.png)

---

## ✨ Features

* **🎥 Dual Stream Capture:** Seamlessly record screen (`getDisplayMedia`) alongside a draggable webcam overlay (`getUserMedia`).
* **🎛️ Real-Time Canvas Compositing:** Combines video feeds dynamically onto an HTML5 Canvas at 60 FPS.
* **🎙️ Audio Mixing:** Blends system sound and microphone inputs into a unified audio stream.
* **⏱️ Recording Controls:** Full control over recording states (Start, Pause, Resume, Stop) with a live duration timer.
* **🎬 Instant Preview & Export:** Watch recordings instantly in-browser and download them as high-quality `.webm` files.
* **🔒 100% Client-Side & Private:** Zero backend dependency; all video rendering and recording stay strictly inside your browser.

---

## 🛠️ Tech Stack & Browser APIs

* **Frontend Framework:** React + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS + Framer Motion
* **Icons:** Lucide React
* **Core APIs:** 
  * `Screen Capture API` (`navigator.mediaDevices.getDisplayMedia`)
  * `Media Capture and Streams API` (`navigator.mediaDevices.getUserMedia`)
  * `MediaRecorder API`
  * `HTML5 Canvas API` & `Web Audio API`

---

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/nawaliauliahasanhunaifa/recorder.git](https://github.com/nawaliauliahasanhunaifa/recorder.git)
   cd recorder
