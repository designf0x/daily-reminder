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
 * Fetches motivational advice from DeepSeek.
 * Returns a fallback motivational message or empty string on failure.
 */
export async function fetchDeepSeekMotivation(daysFree: number, isMorning: boolean, env: Env): Promise<string> {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log("DeepSeek API key is not configured, skipping AI advice.");
    return "";
  }

  const modelName = env.DEEPSEEK_MODEL || "deepseek-chat";
  const url = "https://api.deepseek.com/chat/completions";

  const timeOfDay = isMorning ? "начала дня" : "завершения дня";
  const prompt = `Напиши ОДНО короткое, вдохновляющее и глубокое предложение на русском языке для ${timeOfDay} (пользователь уже ${daysFree} дней сфокусирован на самосовершенствовании и дисциплине).

Предложение должно быть строго сфокусировано на одной из следующих тем (или их гармоничном сочетании):
1. Становление лучшей версией себя: раскрытие внутреннего потенциала, расширение личных возможностей и преодоление инерции.
2. Золотой час и мышление изобилия: правильный настрой на день, фокусировка на возможностях, созидательный фокус.
3. Физическое здоровье, дыхательные упражнения, тренировки и забота о своем теле.
4. Постоянство, дисциплина, долгосрочное мышление и ценность ежедневных малых шагов.
5. Фокус, управление своим вниманием, ментальная ясность и устранение ментального шума.
6. Благодарность, эмоциональная стойкость (resilience) и поддержание глубокого внутреннего баланса.

Критически важные требования:
- Направляй фокус исключительно на созидание нового, развитие и силу воли.
- Категорически запрещено любое упоминание борьбы с зависимостями, сигаретами, курением, вредными привычками или отказом от чего-либо старого. Пиши так, словно этих проблем никогда не существовало в жизни пользователя, и его путь — это путь чистого развития с чистого листа.
- Формат: строго ОДНО предложение.
- Избегай банальных лозунгов и дешевой мотивации (никаких "ты справишься", "верь в себя", "просто начни" и т.д.). Текст должен звучать мудро, зрело и глубоко.`;

  const payload = {
    model: modelName,
    messages: [
      {
        role: "system",
        content: "Ты — вдохновляющий ментор по личному развитию, дисциплине и ментальному балансу. Твоя цель — создавать емкие, глубокие и оригинальные афоризмы, лишенные клише."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`DeepSeek API returned error status ${response.status}: ${await response.text()}`);
      return "";
    }

    const data: any = await response.json();
    const advice = data.choices?.[0]?.message?.content;
    if (!advice) {
      return "";
    }
    return advice.trim().replace(/^"|"$/g, ''); // Clean any wrapping quotes
  } catch (err) {
    console.error("Error fetching motivation from DeepSeek:", err);
    return "";
  }
}

/**
 * Generates the morning reminder message.
 */
export function getMorningMessage(daysFree: number, advice: string): string {
  const idrSaved = daysFree * 350000;
  const usdSaved = daysFree * 20;
  const idrFormatted = formatNumber(idrSaved);
  const usdFormatted = formatNumber(usdSaved);

  const adviceBlock = advice ? `💡 Мудрость дня: ${advice}\n\n` : "";

  return (
    `💪 Доброе утро!\n` +
    `Сегодня день свободы номер ${daysFree}\n` +
    `Сэкономлено денег: ${idrFormatted} IDR / $${usdFormatted}\n\n` +
    `Ты выбираешь ясность.\n` +
    `Фокус на важном и осознанные решения.\n\n` +
    adviceBlock +
    `Сделай 12 вдохов по Стрельниковой.\n` +
    `Помни про физические упражнения и Золотой час.\n\n` +
    `Ты — в игре. Поехали!`
  );
}

/**
 * Generates the evening reminder message.
 */
export function getEveningMessage(daysFree: number, advice: string): string {
  const idrSaved = daysFree * 350000;
  const usdSaved = daysFree * 20;
  const idrFormatted = formatNumber(idrSaved);
  const usdFormatted = formatNumber(usdSaved);

  const adviceBlock = advice ? `💡 Напутствие на вечер: ${advice}\n\n` : "";

  return (
    `🌙 День ${daysFree} окончен.\n` +
    `Ты остался верен себе?\n` +
    `Сэкономлено денег: ${idrFormatted} IDR / $${usdFormatted}\n\n` +
    `Помни о практике благодарности, делай малые шаги.\n` +
    `Ты выбрал ясность. Будь лучшей версией себя.\n\n` +
    adviceBlock +
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
      const daysFree = getDayCounter();
      const advice = await fetchDeepSeekMotivation(daysFree, isMorning, env);
      const message = isMorning ? getMorningMessage(daysFree, advice) : getEveningMessage(daysFree, advice);
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
      const daysFree = getDayCounter();
      let advice = "";
      if (env.DEEPSEEK_API_KEY) {
        advice = await fetchDeepSeekMotivation(daysFree, isMorning, env);
      } else {
        advice = isMorning 
          ? "Направление внимания определяет силу твоего дня — начни его с созидания." 
          : "Внутренний баланс строится на верности своим приоритетам и тишине ума.";
      }
      const message = isMorning ? getMorningMessage(daysFree, advice) : getEveningMessage(daysFree, advice);
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

    let isMorning = true;
    let typeDesc = "morning";

    if (controller.cron === "5 1 * * *") {
      isMorning = true;
      typeDesc = "morning";
    } else if (controller.cron === "5 13 * * *") {
      isMorning = false;
      typeDesc = "evening";
    } else {
      // Auto-detect based on current UTC hour
      const currentHour = new Date().getUTCHours();
      if (currentHour >= 0 && currentHour < 10) {
        isMorning = true;
        typeDesc = "morning (auto-detected)";
      } else {
        isMorning = false;
        typeDesc = "evening (auto-detected)";
      }
    }

    const daysFree = getDayCounter();

    ctx.waitUntil(
      (async () => {
        const advice = await fetchDeepSeekMotivation(daysFree, isMorning, env);
        const message = isMorning ? getMorningMessage(daysFree, advice) : getEveningMessage(daysFree, advice);

        console.log(`Sending ${typeDesc} reminder to chat ${env.TELEGRAM_CHAT_ID}...`);
        await sendTelegramMessage(env.TELEGRAM_CHAT_ID, message, env.TELEGRAM_BOT_TOKEN);
        console.log(`Successfully sent ${typeDesc} reminder to Telegram.`);
      })().catch((err) => {
        console.error(`Error sending scheduled ${typeDesc} reminder:`, err);
      })
    );
  }
};
