import { Env } from "./types";

// Start date: June 13, 2025 (fixed)
const START_DATE = new Date("2025-06-13");

/**
 * Calculates the number of days since the start date in UTC.
 */
function getDayCounter(): number {
  const now = new Date();
  const utcStart = Date.UTC(START_DATE.getUTCFullYear(), START_DATE.getUTCMonth(), START_DATE.getUTCDate());
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffTime = utcNow - utcStart;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Formats a number with spaces as thousand separators to match original Python formatting.
 */
function formatNumber(num: number): string {
  return num.toLocaleString("en-US").replace(/,/g, " ");
}

/**
 * Generates the morning reminder message.
 */
function getMorningMessage(): string {
  const daysFree = getDayCounter();
  const idrSaved = daysFree * 350000;
  const usdSaved = daysFree * 20;
  const idrFormatted = formatNumber(idrSaved);
  const usdFormatted = formatNumber(usdSaved);

  return (
    `💪 Доброе утро!\n` +
    `Сегодня день свободы номер ${daysFree}\n` +
    `Сэкономлено денег: ${idrFormatted} IDR / $${usdFormatted}\n\n` +
    `Ты выбираешь ясность.\n` +
    `Без дыма и мутных решений.\n\n` +
    `Сделай 12 вдохов по Стрельниковой.\n` +
    `Помни про физические упражнения и Золотой час.\n\n` +
    `Ты — в игре. Поехали!`
  );
}

/**
 * Generates the evening reminder message.
 */
function getEveningMessage(): string {
  const daysFree = getDayCounter();
  const idrSaved = daysFree * 350000;
  const usdSaved = daysFree * 20;
  const idrFormatted = formatNumber(idrSaved);
  const usdFormatted = formatNumber(usdSaved);

  return (
    `🌙 День ${daysFree} окончен.\n` +
    `Ты остался верен себе?\n` +
    `Сэкономлено денег: ${idrFormatted} IDR / $${usdFormatted}\n\n` +
    `Помни о практике благодарности, делай малые шаги.\n` +
    `Ты выбрал ясность. Будь лучшей версией себя.\n\n` +
    `Завтра продолжим.`
  );
}

/**
 * Delivers the generated message to Telegram.
 */
async function sendTelegramMessage(chatId: string, text: string, token: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API responded with status ${response.status}: ${errorText}`);
  }
}

export default {
  /**
   * HTTP Handler for testing and previewing reminders.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Direct trigger tests
    if (path === "/test/morning" || path === "/test/evening") {
      const isMorning = path === "/test/morning";
      const message = isMorning ? getMorningMessage() : getEveningMessage();
      const typeDesc = isMorning ? "morning" : "evening";

      try {
        await sendTelegramMessage(env.TELEGRAM_CHAT_ID, message, env.TELEGRAM_BOT_TOKEN);
        return new Response(`Successfully sent ${typeDesc} reminder.`, { status: 200 });
      } catch (err: any) {
        return new Response(`Failed to send reminder: ${err.message}`, { status: 500 });
      }
    }

    // Direct message previews in browser
    if (path === "/preview/morning" || path === "/preview/evening") {
      const isMorning = path === "/preview/morning";
      const message = isMorning ? getMorningMessage() : getEveningMessage();
      return new Response(message, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Root Info Route
    return new Response(
      `☀️ Daily Reminder Bot is running!\n\n` +
      `Available endpoints:\n` +
      `  GET /preview/morning  - Preview the morning message\n` +
      `  GET /preview/evening  - Preview the evening message\n` +
      `  GET /test/morning     - Trigger morning message to Telegram\n` +
      `  GET /test/evening     - Trigger evening message to Telegram\n`,
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  },

  /**
   * Scheduled Handler for Cron triggers.
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger fired: ${controller.cron} at ${new Date().toISOString()}`);

    let message: string;
    let typeDesc: string;

    if (controller.cron === "5 1 * * *") {
      message = getMorningMessage();
      typeDesc = "morning";
    } else if (controller.cron === "5 13 * * *") {
      message = getEveningMessage();
      typeDesc = "evening";
    } else {
      // Auto-detect based on current UTC hour
      const currentHour = new Date().getUTCHours();
      if (currentHour >= 0 && currentHour < 10) {
        message = getMorningMessage();
        typeDesc = "morning (auto-detected)";
      } else {
        message = getEveningMessage();
        typeDesc = "evening (auto-detected)";
      }
    }

    console.log(`Sending ${typeDesc} reminder to chat ${env.TELEGRAM_CHAT_ID}...`);

    ctx.waitUntil(
      sendTelegramMessage(env.TELEGRAM_CHAT_ID, message, env.TELEGRAM_BOT_TOKEN)
        .then(() => {
          console.log(`Successfully sent ${typeDesc} reminder to Telegram.`);
        })
        .catch((err) => {
          console.error(`Error sending scheduled ${typeDesc} reminder:`, err);
        })
    );
  }
};
