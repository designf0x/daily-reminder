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

  const categories = [
    {
      name: "Цитата выдающейся личности",
      description: "Глубокая, оригинальная и неизбитая мысль великого философа, ученого, писателя, лидера или исторического деятеля (например, Марк Аврелий, Сенека, Эпиктет, Лао-Цзы, Виктор Франкл, Альберт Эйнштейн, Ницше, Черчилль и др.). Цитата должна быть приведена на русском языке с кратким, исключительно практическим выводом о том, как применить эту мысль прямо сегодня."
    },
    {
      name: "Практический принцип стоицизма или восточной мудрости",
      description: "Конкретный прикладной принцип стоической философии (дихотомия контроля, Amor Fati, Memento Mori, добродетель как единственное благо) или восточной концепции (Кайдзен, Икигай, Ваби-Саби, У-Вэй). Опиши суть концепции и сформулируй одно конкретное ментальное или физическое упражнение на сегодня."
    },
    {
      name: "Когнитивная психология и нейробиология эффективности",
      description: "Современное научное открытие или модель работы мозга и поведения (фокус внимания, дофаминовое планирование, кривая забывания, нейропластичность, влияние сна/дыхания на когнитивные функции). Опиши, как применить это знание для улучшения концентрации, памяти или снижения ментальной усталости сегодня."
    },
    {
      name: "Ментальная стойкость (Resilience) и эмоциональное равновесие",
      description: "Совет по управлению стрессом, преодолению неопределенности, сохранению ясности ума и хладнокровия. Сформулируй практический прием заземления или когнитивной переоценки для поддержания стабильного и уравновешенного состояния в течение дня."
    },
    {
      name: "Благодарность, созидание и мышление изобилия",
      description: "Практика, направленная на смещение внимания с дефицита и трудностей на возможности, ценность текущего момента и признательность за прогресс. Сформулируй микро-упражнение для Золотого часа (начала дня) или вечернего анализа, способствующее позитивному и созидательному настрою."
    }
  ];

  const selected = categories[Math.floor(Math.random() * categories.length)];
  const timeOfDay = isMorning ? "начала дня" : "завершения дня";
  
  const prompt = `Напиши краткое, исключительно прикладное напутствие из ровно 3 коротких предложений на русском языке для ${timeOfDay}.

Твой ответ должен быть строго и полностью основан на одной теме:
Категория: ${selected.name}
Инструкция: ${selected.description}

Инструкции к содержанию:
1. Выбери из своей базы знаний одну глубокую идею, цитату или концепцию, соответствующую этой категории, и раскрой её. Категорически запрещено смешивать разные категории в одном сообщении.
2. Формулируй мысли исключительно в позитивном ключе (что и как ДЕЛАТЬ). Категорически запрещено использовать негативное фреймирование (правила в стиле "не делай X", "избегай Y").
3. Каждый совет должен быть предельно практичным, заземленным и сформулированным как конкретное правило для управления своими действиями, мыслями или вниманием сегодня.
4. Избегай банальных лозунгов, дешевой мотивации и клише (никаких "ты справишься", "верь в себя", "просто начни" и т.д.). Текст должен звучать мудро, зрело и нести реальную практическую пользу.
5. Объем: строго 3 коротких предложения. Не используй кавычки вокруг всего текста (только для цитат внутри, если необходимо), списки и нумерацию.`;

  const payload = {
    model: modelName,
    messages: [
      {
        role: "system",
        content: "Ты — прагматичный ментор по личной эффективности, осознанности и ментальному балансу. Твоя задача — написать ровно 3 коротких, прикладных и глубоких предложения на русском языке на основе заданной темы, исключая эзотерику, воду и избитые клише."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 300,
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
 * Calculates the formatted duration since START_DATE in years, months, and days with Russian plurals.
 */
export function getDurationString(now: Date = new Date()): string {
  const startYear = START_DATE.getUTCFullYear();
  const startMonth = START_DATE.getUTCMonth();
  const startDay = START_DATE.getUTCDate();

  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth();
  const endDay = now.getUTCDate();

  let years = endYear - startYear;
  let months = endMonth - startMonth;
  let days = endDay - startDay;

  if (days < 0) {
    const prevMonthDate = new Date(Date.UTC(endYear, endMonth, 0));
    days += prevMonthDate.getUTCDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const getPlural = (num: number, one: string, two: string, five: string): string => {
    const n = Math.abs(num) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  };

  const parts: string[] = [];
  if (years > 0) {
    const yearWord = getPlural(years, "год", "года", "лет");
    parts.push(`${years} ${yearWord}`);
  }
  if (months > 0) {
    const monthWord = getPlural(months, "месяц", "месяца", "месяцев");
    parts.push(`${months} ${monthWord}`);
  }
  if (days > 0 || parts.length === 0) {
    const dayWord = getPlural(days, "день", "дня", "дней");
    parts.push(`${days} ${dayWord}`);
  }

  return parts.join(" ");
}

/**
 * Generates the morning reminder message.
 */
export function getMorningMessage(daysFree: number, advice: string, now: Date = new Date()): string {
  const idrSaved = daysFree * 350000;
  const usdSaved = daysFree * 20;
  const idrFormatted = formatNumber(idrSaved);
  const usdFormatted = formatNumber(usdSaved);
  const duration = getDurationString(now);

  const adviceBlock = advice ? `💡 Мудрость дня: ${advice}\n\n` : "";

  return (
    `💪 Доброе утро!\n` +
    `Сегодня: ${duration}\n` +
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
export function getEveningMessage(daysFree: number, advice: string, now: Date = new Date()): string {
  const idrSaved = daysFree * 350000;
  const usdSaved = daysFree * 20;
  const idrFormatted = formatNumber(idrSaved);
  const usdFormatted = formatNumber(usdSaved);
  const duration = getDurationString(now);

  const adviceBlock = advice ? `💡 Напутствие на вечер: ${advice}\n\n` : "";

  return (
    `🌙 ${duration} позади.\n` +
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
          ? "«Твоя жизнь формируется твоими мыслями», — писал Марк Аврелий. Сделай осознанный выбор направлять внимание только на те задачи, которые находятся в твоем круге контроля. Начни утро с минуты тишины и настройки фокуса на созидании." 
          : "Зафиксируй одно положительное событие сегодняшнего дня и поблагодари себя за сделанный выбор. Наведи порядок на рабочем месте, освобождая пространство для завтрашних решений. Прими полную ответственность за результаты дня и оставь все заботы в прошлом перед сном.";
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
