# 🎉 Birthday Wishes

A beautiful, animated birthday celebration page with real-time comments, photo sharing, reactions, and an admin dashboard. Built with vanilla JavaScript, Firebase, and GSAP animations.

## ✨ Features

- **Animated Hero** — Floating particles, confetti, balloon bursts, and GSAP scroll animations
- **🎵 Background Music** — Auto-play toggle with play/pause controls
- **⏰ Countdown Timer** — Set any birthday date with live countdown
- **💌 Birthday Card** — Multiple styles (Classic, Balloon, Confetti, Elegant, Fun)
- **🎨 6 Themes** — Pastel, Neon, Vintage, Ocean, Space, Golden
- **📸 Photo Upload** — Drag & drop or click to upload birthday photos (Firebase Storage + local)
- **💬 Real-time Comments** — Firebase Firestore with approval workflow
- **❤️ Reactions** — Hearts, Cakes, Balloons, Confetti, Stars with burst animations
- **💝 Message Generator** — 30 prewritten wishes in 5 categories, copy with one click
- **🔗 Share Links** — WhatsApp, Facebook, X/Twitter, Telegram, plus native share
- **🛡️ Admin Dashboard** — Password-protected panel to manage comments, photos, reactions, and settings
- **📱 Fully Responsive** — Works on phones, tablets, and desktops

## 🚀 Quick Start

### 1. Deploy to GitHub Pages (Easiest)

1. Fork or clone this repo
2. Push to GitHub
3. Go to Settings → Pages → Source: GitHub Actions (or deploy from `main` branch)
4. Your site is live at `https://<username>.github.io/birthday-wishes/`

### 2. Set Up Firebase (for persistent data)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use existing)
3. Enable **Firestore Database** → Create database (Test mode)
4. Enable **Authentication** → Sign-in method → Email/Password → Add a user
5. Enable **Storage** (optional, for photo uploads)
6. Register a **Web app** and copy the config
7. Open `js/firebase-config.js` and replace the config values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Without Firebase, all data uses localStorage — still fully functional!**

### 3. Add Background Music

Place an MP3 file at `assets/music/birthday.mp3` or update the source in `index.html`.

### 4. Open Locally

Just open `index.html` in any browser — no build tools needed.

## 🔐 Admin Dashboard

Access at `dashboard.html` on your deployed site.

- **Default local credentials:** `admin@birthday.com` / `admin123`
- **Firebase Auth:** Use the email/password you created in Firebase

Dashboard features:
- Overview with stats
- Approve / delete / reply to comments
- Search and filter comments
- Export comments to CSV
- Manage uploaded photos
- View reaction analytics
- Update page settings

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5, CSS3, ES6+ | Core structure and styling |
| Firebase Firestore | Real-time comment database |
| Firebase Storage | Photo uploads |
| Firebase Auth | Admin authentication |
| GSAP 3.12 | Scroll-triggered animations |
| Canvas API | Confetti and balloon particle system |
| Font Awesome 6 | Icons |
| Google Fonts | Poppins + Great Vibes typography |

## 📁 Project Structure

```
birthday-wishes/
├── index.html              # Main birthday page
├── dashboard.html          # Admin dashboard
├── css/
│   └── style.css           # All styles (responsive, themes, animations)
├── js/
│   ├── firebase-config.js  # Firebase initialization
│   ├── auth.js             # Authentication module
│   ├── animations.js       # Canvas confetti, balloons, GSAP
│   ├── comments.js         # Real-time comment system
│   ├── countdown.js        # Countdown timer
│   ├── themes.js           # Theme & card style switcher
│   ├── messages.js         # Birthday message generator
│   ├── dashboard.js        # Admin dashboard logic
│   └── app.js              # Main application orchestrator
├── assets/
│   ├── music/
│   │   └── birthday.mp3    # Background music (add your own)
│   └── images/
├── README.md
└── LICENSE
```

## 🎨 Customization

- **Themes:** Edit `:root` CSS variables in `style.css`
- **Messages:** Edit the `messages` array in `js/messages.js`
- **Card styles:** Add CSS classes in `style.css` following `.card-style-*` pattern
- **Colors:** Modify the COLORS array in `js/animations.js` for confetti

## 📄 License

MIT — free to use, modify, and share.

---

Made with ❤️ to celebrate life's beautiful moments.
