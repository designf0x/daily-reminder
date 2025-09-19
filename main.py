import logging
from telegram import Bot
import asyncio
from datetime import datetime

# === Настройки ===
BOT_TOKEN = '7881392569:AAEK0Y6KkDBrXZHDGArDStId9XA8w-b73vY'
CHAT_ID = '105349137'
START_DATE = datetime(2025, 6, 13)

# === Сообщения ===
def get_day_counter():
    today = datetime.utcnow().date()
    return (today - START_DATE.date()).days + 1

def get_morning_message():
    days_free = get_day_counter()
    return (
        f"💪 Доброе утро.\n"
        f"Сегодня день #{days_free} свободы.\n"
        f"Ты выбираешь ясность.\n"
        f"Без дыма. Без мутных решений.\n\n"
        f"Сделай 12 вдохов по Стрельниковой.\n"
        f"Потом — настрой внимание и войди в Золотой час.\n\n"
        f"Ты — в игре. Поехали."
    )

def get_evening_message():
    days_free = get_day_counter()
    return (
        f"🌙 День #{days_free} окончен.\n"
        f"Ты остался верен себе?\n\n"
        f"Если нет — проанализируй. Если да — зафиксируй:\n"
        f"Ты выбрал ясность. Так строится новая версия.\n\n"
        f"Завтра продолжим."
    )

# === Отправка ===
async def send_reminder():
    bot = Bot(token=BOT_TOKEN)
    now = datetime.utcnow()
    current_hour = now.hour

    if 0 <= current_hour < 10:
        message = get_morning_message()
    else:
        message = get_evening_message()

    await bot.send_message(chat_id=CHAT_ID, text=message)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(send_reminder())



