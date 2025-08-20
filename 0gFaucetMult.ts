import { loadPrivateKey } from "../keychain";
import { mintTestTokens } from "./ogJaineFaucet";

const SERVICE_NAME = "MetaMask";
const ACCOUNT_NAMES = ["Account1", "Account2", ... ];         <---------       YOUR ACCOUNTS

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runForAllAccounts() {
  const shuffled = [...ACCOUNT_NAMES].sort(() => Math.random() - 0.5);
  for (const acc of shuffled) {
    const pk = await loadPrivateKey(SERVICE_NAME, acc);
    if (!pk) {
      console.error(`❌ Ключ не найден для ${acc}`);
      continue;
    }
    console.log(`\n=== Минтим для аккаунта: ${acc} ===`);
    await mintTestTokens(acc);
    console.log("\n⏸ Пауза 15 сек перед следующим аккаунтом...");
    await sleep(15_000);
  }
  console.log("\n✅ Минт по всем аккаунтам завершён");
}

if (require.main === module) {
  runForAllAccounts().catch(err => {
    console.error("❌ Ошибка:", err);
    process.exit(1);
  });
}



