import Web3 from "web3";
import { getPrivateKey } from "../data/loadAccount";

const RPC_URL = "https://lightnode-json-rpc-0g.grandvalleys.com";

// ABI для минта токенов (метод 0x1249c58b)
const MINT_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view"
  }
];

// Адреса токенов для минта
const TEST_TOKENS = [
  {
    name: "BTC",
    address: "0x36f6414FF1df609214dDAbA71c84f18bcf00F67d"
  },
  {
    name: "Test ETH", 
    address: "0x0fE9B43625fA7EdD663aDcEC0728DD635e4AbF7c"
  },
  {
    name: "USDT", 
    address: "0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf"
  }
];

export async function mintTestTokens(accountName: string) {
  const privateKey = await getPrivateKey(accountName);
  if (!privateKey) {
    console.error("❌ Приватный ключ не найден");
    process.exit(1);
  }

  const web3 = new Web3(RPC_URL);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  console.log("🔧 Минт тестовых токенов для:", account.address);

  for (const token of TEST_TOKENS) {
    let balanceFormatted = "0";
    
    try {
      console.log(`\n📋 Минтим ${token.name}...`);
      
      const contract = new web3.eth.Contract(MINT_ABI as any, token.address);
      
      // Проверяем контракт
      const code = await web3.eth.getCode(token.address);
      if (code === '0x' || code === '0x0') {
        console.log(`❌ Контракт ${token.name} не найден по адресу:`, token.address);
        continue;
      }

      // Проверяем текущий баланс
      try {
        const balance = await contract.methods.balanceOf(account.address).call();
        const decimals = await contract.methods.decimals().call();
        balanceFormatted = web3.utils.fromWei(balance as unknown as string, 'ether');
        console.log(`  • Текущий баланс: ${balanceFormatted} ${token.name}`);
      } catch (error) {
        console.log(`  • Не удалось проверить баланс: ${error}`);
      }

      // Кодируем вызов mint (без параметров)
      const data = contract.methods
        .mint()
        .encodeABI();

      console.log(`  • Method ID: ${data.substring(0, 10)}`);

      const nonce = await web3.eth.getTransactionCount(account.address);
      const gasLimit = 500_000;
      const gasPrice = await web3.eth.getGasPrice();

      const tx = {
        from: account.address,
        to: token.address,
        data: data,
        gas: gasLimit,
        gasPrice,
        nonce,
        value: "0"
      };

      // Симуляция транзакции
      try {
        console.log("  🔍 Симуляция...");
        const simulation = await web3.eth.call(tx);
        console.log("  ✅ Симуляция успешна");
      } catch (simError) {
        console.log("  ⚠️ Симуляция не удалась, но продолжаем...");
        if (simError instanceof Error) {
          console.log(`    • Причина: ${simError.message}`);
        }
      }

      // Отправляем транзакцию
      console.log("  📤 Отправляем транзакцию...");
      const signed = await web3.eth.accounts.signTransaction(tx, privateKey);

      if (!signed.rawTransaction) {
        throw new Error("Не удалось подписать транзакцию");
      }

      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      console.log(`  ✅ ${token.name} успешно заминчен!`);
      console.log(`    • Hash: ${receipt.transactionHash}`);
      console.log(`    • Gas used: ${receipt.gasUsed}`);

      // Проверяем новый баланс
      try {
        const newBalance = await contract.methods.balanceOf(account.address).call();
        const newBalanceFormatted = web3.utils.fromWei(newBalance as unknown as string, 'ether');
        console.log(`    • Новый баланс: ${newBalanceFormatted} ${token.name}`);
      } catch (error) {
        console.log(`    • Не удалось проверить новый баланс: ${error}`);
      }

    } catch (error) {
      // Проверяем, является ли ошибка "Wait 24 hours"
      if (error && typeof error === 'object' && 'reason' in error) {
        const reason = (error as any).reason;
        if (reason && reason.includes('Wait 24 hours')) {
          console.log(`  ⏰ ${token.name}: Токены уже забраны, необходимо подождать 24 часа`);
          console.log(`    • Текущий баланс: ${balanceFormatted} ${token.name}`);
        } else {
          console.error(`❌ Ошибка при минте ${token.name}:`, error);
        }
      } else {
        console.error(`❌ Ошибка при минте ${token.name}:`, error);
      }
    }
  }

  console.log("\n🎉 Минт тестовых токенов завершен!");
}

if (require.main === module) {
  const accountName = process.argv[2];
  if (!accountName) {
    console.error("❌ Укажи имя аккаунта в параметрах");
    console.error("Использование: npx ts-node src/Og/ogMintTestTokens.ts <accountName>");
    process.exit(1);
  }
  mintTestTokens(accountName).catch(err => {
    console.error("❌ Ошибка:", err);
    process.exit(1);
  });
}
