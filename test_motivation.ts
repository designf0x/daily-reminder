import { fetchDeepSeekMotivation, getMorningMessage, getEveningMessage } from "./src/index";

async function testFormatters() {
  console.log("⏳ Testing reminder formatters...");
  
  const days = 365;
  const mockAdvice = "Дыхание — это твой мост к внутренней свободе и тишине.";
  
  const testDate = new Date("2026-06-18"); // 1 year and 5 days since 2025-06-13
  const morningMsg = getMorningMessage(days, mockAdvice, testDate);
  const eveningMsg = getEveningMessage(days, mockAdvice, testDate);
  
  if (morningMsg.includes("Сегодня: 1 год 5 дней") && morningMsg.includes(mockAdvice)) {
    console.log("  ✅ Morning message formatter works correctly.");
  } else {
    console.error("  ❌ Morning message formatter failed:", morningMsg);
    process.exit(1);
  }

  if (eveningMsg.includes("1 год 5 дней позади") && eveningMsg.includes(mockAdvice)) {
    console.log("  ✅ Evening message formatter works correctly.");
  } else {
    console.error("  ❌ Evening message formatter failed:", eveningMsg);
    process.exit(1);
  }
}

async function testDeepSeekMissingKey() {
  console.log("\n⏳ Testing DeepSeek missing API key handling...");
  
  const env = {
    TELEGRAM_BOT_TOKEN: "mock_token",
    TELEGRAM_CHAT_ID: "mock_chat",
  };
  
  const res = await fetchDeepSeekMotivation(365, true, env);
  if (res === "") {
    console.log("  ✅ fetchDeepSeekMotivation returns empty string gracefully when API key is missing.");
  } else {
    console.error("  ❌ fetchDeepSeekMotivation failed to handle missing API key.");
    process.exit(1);
  }
}

async function runAll() {
  console.log("🚀 Starting Daily Reminder Test Suite...");
  await testFormatters();
  await testDeepSeekMissingKey();
  console.log("\n✨ ALL LOCAL TESTS PASSED SUCCESSFULLY! ✨");
}

runAll().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
