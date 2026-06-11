import { fetchDeepSeekMotivation, getMorningMessage, getEveningMessage } from "./src/index";

async function testFormatters() {
  console.log("⏳ Testing reminder formatters...");
  
  const days = 365;
  const mockAdvice = "Дыхание — это твой мост к внутренней свободе и тишине.";
  
  const morningMsg = getMorningMessage(days, mockAdvice);
  const eveningMsg = getEveningMessage(days, mockAdvice);
  
  if (morningMsg.includes("день свободы номер 365") && morningMsg.includes(mockAdvice)) {
    console.log("  ✅ Morning message formatter works correctly.");
  } else {
    console.error("  ❌ Morning message formatter failed.");
    process.exit(1);
  }

  if (eveningMsg.includes("День 365 окончен") && eveningMsg.includes(mockAdvice)) {
    console.log("  ✅ Evening message formatter works correctly.");
  } else {
    console.error("  ❌ Evening message formatter failed.");
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
