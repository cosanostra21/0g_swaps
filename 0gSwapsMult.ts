import { executeSwap, runRandomSwapsForAccount } from "./ogJaineSwap";
import { loadPrivateKey } from "../keychain";

const SERVICE_NAME = "MetaMask";
const ACCOUNT_NAMES = ["Account1", "Account2", ...];      <-------     YOUR ACCOUNTS

const DIRECTIONS = [
  "eth-to-usdt", "usdt-to-eth",
  "btc-to-usdt", "usdt-to-btc",
  "eth-to-btc",
  "usdt-to-gimo", "gimo-to-usdt",
  "usdt-to-stog", "stog-to-usdt",
  "usdt-to-vog", "vog-to-usdt",
];

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const getRandomDelay = () => Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000; // 2-5 секунд

async function runSequentialSwapsForAccount(accountName: string, cycles: number = 1) {
  console.log(`\n=== Работаем с аккаунтом: ${accountName} ===`);

  const pk = await loadPrivateKey(SERVICE_NAME, accountName);
  if (!pk) {
    console.error(`❌ Ключ не найден для ${accountName}`);
    return;
  }

  let totalTransactions = 0;
  const totalDirections = DIRECTIONS.length * cycles;
  
  for (let c = 1; c <= cycles; c++) {
    console.log(`\n--- Цикл ${c}/${cycles} ---`);
    for (const direction of DIRECTIONS) {
      totalTransactions++;
      console.log(`[${accountName}] ➡️ ${direction} (${totalTransactions}/${totalDirections})`);
      const ok = await executeSwap(accountName, direction);
      if (!ok) {
        console.log(`[${accountName}] ⚠️ Своп не прошёл`);
      }
      
      if (totalTransactions < totalDirections) {
        const delay = getRandomDelay();
        console.log(`[${accountName}] ⏳ Пауза ${delay/1000}с...`);
        await sleep(delay);
      }
    }
  }
}

async function runForAllAccounts() {
  const shuffled = [...ACCOUNT_NAMES].sort(() => Math.random() - 0.5);
  let accountIndex = 0;
  const totalAccounts = shuffled.length;
  
  for (const acc of shuffled) {
    accountIndex++;
    console.log(`\n📊 Прогресс: ${accountIndex}/${totalAccounts} аккаунтов`);
    
    // Случайные свопы (до успеха) и затем полный проход по всем направлениям
    await runRandomSwapsForAccount(acc, 10);
    await runSequentialSwapsForAccount(acc, 1);
    
    if (accountIndex < totalAccounts) {
      const delay = Math.floor(Math.random() * (17000 - 12000 + 1)) + 12000; // 12-17 секунд
      console.log(`\n⏸ Пауза ${delay/1000}с перед следующим аккаунтом...`);
      await sleep(delay);
    }
  }
  console.log("\n✅ Все аккаунты отработали.");
}

if (require.main === module) {
  runForAllAccounts().catch(err => {
    console.error("❌ Ошибка:", err);
    process.exit(1);
  });
}


