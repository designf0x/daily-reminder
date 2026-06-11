import logging
import asyncio
import os
import sys
import argparse
from datetime import datetime, timezone, timedelta
from telegram import Bot

# === Настройки / Settings ===
# Read credentials from environment variables to prevent security leaks
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

# Default freedom start date: June 13, 2025 (fixed)
START_DATE = datetime(2025, 6, 13)

# === Сообщения / Messages ===
def get_duration_string(now_dt=None):
    if now_dt is None:
        now_dt = datetime.now(timezone.utc)
    
    start_year = START_DATE.year
    start_month = START_DATE.month
    start_day = START_DATE.day
    
    end_year = now_dt.year
    end_month = now_dt.month
    end_day = now_dt.day
    
    years = end_year - start_year
    months = end_month - start_month
    days = end_day - start_day
    
    if days < 0:
        first_of_current = datetime(end_year, end_month, 1)
        prev_month_date = first_of_current - timedelta(days=1)
        days += prev_month_date.day
        months -= 1
        
    if months < 0:
        months += 12
        years -= 1
        
    def get_plural(num, one, two, five):
        n = abs(num) % 100
        n1 = n % 10
        if 10 < n < 20:
            return five
        if 1 < n1 < 5:
            return two
        if n1 == 1:
            return one
        return five

    parts = []
    if years > 0:
        parts.append(f"{years} {get_plural(years, 'год', 'года', 'лет')}")
    if months > 0:
        parts.append(f"{months} {get_plural(months, 'месяц', 'месяца', 'месяцев')}")
    if days > 0 or not parts:
        parts.append(f"{days} {get_plural(days, 'день', 'дня', 'дней')}")
        
    return " ".join(parts)

def get_day_counter():
    today = datetime.now(timezone.utc).date()
    return (today - START_DATE.date()).days + 1

def get_morning_message():
    days_free = get_day_counter()
    idr_saved = days_free * 350000
    usd_saved = days_free * 20
    idr_formatted = f"{idr_saved:,}".replace(",", " ")
    usd_formatted = f"{usd_saved:,}".replace(",", " ")
    duration = get_duration_string()
    return (
        f"💪 Доброе утро!\n"
        f"Сегодня: {duration}\n"
        f"Сэкономлено денег: {idr_formatted} IDR / ${usd_formatted}\n\n"
        f"Ты выбираешь ясность.\n"
        f"Фокус на важном и осознанные решения.\n\n"
        f"Сделай 12 вдохов по Стрельниковой.\n"
        f"Помни про физические упражнения и Золотой час.\n\n"
        f"Ты — в игре. Поехали!"
    )

def get_evening_message():
    days_free = get_day_counter()
    idr_saved = days_free * 350000
    usd_saved = days_free * 20
    idr_formatted = f"{idr_saved:,}".replace(",", " ")
    usd_formatted = f"{usd_saved:,}".replace(",", " ")
    duration = get_duration_string()
    return (
        f"🌙 {duration} позади.\n"
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



