import os
import asyncio
import json
import uuid
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.client.session.aiohttp import AiohttpSession
from aiohttp import ClientTimeout
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("ADMIN_BOT_TOKEN")
PASSWORD = os.getenv("ADMIN_PASSWORD")
MINI_APP_USERNAME = os.getenv("MINI_APP_USERNAME", "selling") # Default if not set
DOMAIN = os.getenv("DOMAIN")

# Increase timeout for VPS network stability
session = AiohttpSession(timeout=ClientTimeout(total=60, connect=20))
bot = Bot(token=TOKEN, session=session)
dp = Dispatcher()

# Simple storage for authorized admins and links
AUTHORIZED_ADMINS = set()
GENERATED_LINKS = {} # id -> {type: 'auto'|'custom', price: float, username: str, pfp: str}

def save_admins():
    with open("admins.json", "w") as f:
        json.dump(list(AUTHORIZED_ADMINS), f)

def load_data():
    global AUTHORIZED_ADMINS, GENERATED_LINKS
    if os.path.exists("admins.json"):
        with open("admins.json", "r") as f:
            AUTHORIZED_ADMINS = set(json.load(f))
    if os.path.exists("links.json"):
        with open("links.json", "r") as f:
            GENERATED_LINKS = json.load(f)

load_data()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id in AUTHORIZED_ADMINS:
        await message.answer("Welcome back, Admin! Use /generate to create a new link.")
    else:
        await message.answer("Please enter the password to access admin features.")

@dp.message(F.text == PASSWORD)
async def handle_password(message: types.Message):
    AUTHORIZED_ADMINS.add(message.from_user.id)
    save_admins()
    await message.answer("Success! You are now an authorized admin.\n\n"
                         "Commands:\n"
                         "/generate_auto [price_ton] - Create an automated link\n"
                         "/generate_custom [price_ton] [username] [pfp_url] - Create a custom link")

@dp.message(Command("generate_auto"))
async def cmd_gen_auto(message: types.Message):
    if message.from_user.id not in AUTHORIZED_ADMINS:
        return

    mini_app_username = os.getenv("MINI_APP_USERNAME", "selling")

    args = message.text.split()
    price = args[1] if len(args) > 1 else "382"

    link_id = str(uuid.uuid4())[:8]
    GENERATED_LINKS[link_id] = {
        "type": "auto",
        "price": price
    }

    # Save links to file
    with open("links.json", "w") as f:
        json.dump(GENERATED_LINKS, f)

    link = f"https://t.me/{mini_app_username}/fragment?startapp={link_id}"
    await message.answer(f"✅ Automated Link Generated!\n\nPrice: {price} TON\nLink: `{link}`", parse_mode="Markdown")

@dp.message(Command("generate_custom"))
async def cmd_gen_custom(message: types.Message):
    if message.from_user.id not in AUTHORIZED_ADMINS:
        return

    mini_app_username = os.getenv("MINI_APP_USERNAME", "selling")

    args = message.text.split()
    if len(args) < 4:
        await message.answer("Usage: /generate_custom [price] [username] [pfp_url]")
        return

    price = args[1]
    username = args[2]
    pfp = args[3]

    link_id = str(uuid.uuid4())[:8]
    GENERATED_LINKS[link_id] = {
        "type": "custom",
        "price": price,
        "username": username,
        "pfp": pfp
    }

    with open("links.json", "w") as f:
        json.dump(GENERATED_LINKS, f)

    link = f"https://t.me/{mini_app_username}/fragment?startapp={link_id}"
    await message.answer(f"✅ Custom Link Generated!\n\nUsername: @{username}\nPrice: {price} TON\nLink: `{link}`", parse_mode="Markdown")

async def main():
    print("Admin Bot starting...")
    while True:
        try:
            await dp.start_polling(bot)
        except Exception as e:
            print(f"Polling error: {e}. Retrying in 10s...")
            await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(main())
