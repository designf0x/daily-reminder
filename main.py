import logging
import asyncio
import os
import sys
import argparse
from datetime import datetime, timezone
from telegram import Bot

# === Настройки / Settings ===
# Read credentials from environment variables to prevent security leaks
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

# Default freedom start date: June 13, 2025 (fixed)
START_DATE = datetime(2025, 6, 13)

# === Сообщения / Messages ===
def get_day_counter():
    # Use timezone-aware datetime.now(timezone.utc) to avoid Python 3.12+ deprecation warnings
    today = datetime.now(timezone.utc).date()
    return (today - START_DATE.date()).days + 1

def get_morning_message():
    days_free = get_day_counter()
    # Calculate savings: 350,000 IDR and $20 per day
    idr_saved = days_free * 350000
    usd_saved = days_free * 20
    idr_formatted = f"{idr_saved:,}".replace(",", " ")
    usd_formatted = f"{usd_saved:,}".replace(",", " ")
    return (
        f"💪 Доброе утро!\n"
        f"Сегодня день свободы номер {days_free}\n"
        f"Сэкономлено денег: {idr_formatted} IDR / ${usd_formatted}\n\n"
        f"Ты выбираешь ясность.\n"
        f"Фокус на важном и осознанные решения.\n\n"
        f"Сделай 12 вдохов по Стрельниковой.\n"
        f"Помни про физические упражнения и Золотой час.\n\n"
        f"Ты — в игре. Поехали!"
    )

def get_evening_message():
    days_free = get_day_counter()
    # Calculate savings: 350,000 IDR and $20 per day
    idr_saved = days_free * 350000
    usd_saved = days_free * 20
    idr_formatted = f"{idr_saved:,}".replace(",", " ")
    usd_formatted = f"{usd_saved:,}".replace(",", " ")
    return (
        f"🌙 День {days_free} окончен.\n"
        f"Ты остался верен себе?\n"
        f"Сэкономлено денег: {idr_formatted} IDR / ${usd_formatted}\n\n"
        f"Помни о практике благодарности, делай малые шаги.\n"
        f"Ты выбрал ясность. Будь лучшей версией себя.\n\n"
        f"Завтра продолжим."
    )

# === Отправка / Delivery ===
async def main():
    parser = argparse.ArgumentParser(description="Telegram Daily Reminder Bot")
    parser.add_argument(
        "--type",
        choices=["morning", "evening", "auto"],
        default="auto",
        help="Force sending a specific reminder (morning/evening). 'auto' uses UTC hour."
    )
    args = parser.parse_args()

    # Validate that credentials are set
    if not BOT_TOKEN:
        logging.error("Environment variable 'TELEGRAM_BOT_TOKEN' is missing!")
        sys.exit(1)
    if not CHAT_ID:
        logging.error("Environment variable 'TELEGRAM_CHAT_ID' is missing!")
        sys.exit(1)

    bot = Bot(token=BOT_TOKEN)

    # Determine message type
    if args.type == "morning":
        message = get_morning_message()
        msg_type_desc = "morning"
    elif args.type == "evening":
        message = get_evening_message()
        msg_type_desc = "evening"
    else:
        # Auto-detect using modern UTC hour
        now = datetime.now(timezone.utc)
        current_hour = now.hour
        logging.info(f"Auto-detecting message type. Current UTC hour: {current_hour}")
        if 0 <= current_hour < 10:
            message = get_morning_message()
            msg_type_desc = "morning (auto-detected)"
        else:
            message = get_evening_message()
            msg_type_desc = "evening (auto-detected)"

    logging.info(f"Sending {msg_type_desc} reminder to chat {CHAT_ID}...")
    
    try:
        await bot.send_message(chat_id=CHAT_ID, text=message)
        logging.info("Success! Telegram reminder sent.")
    except Exception as e:
        logging.error(f"Error publishing to Telegram: {e}")
        sys.exit(1)

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    asyncio.run(main())



