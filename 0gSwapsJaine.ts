import Web3 from "web3";
import { getPrivateKey } from "../data/loadAccount";

const RPC_URL = "https://lightnode-json-rpc-0g.grandvalleys.com";
const CONTRACT_ADDRESS = "0xb95B5953FF8ee5D5d9818CdbEfE363ff2191318c";

const ABI = [
  {
    type: "function",
    inputs: [{
      name: "params",
      internalType: "struct ISwapRouter.ExactInputSingleParams",
      type: "tuple",
      components: [{
        name: "tokenIn",
        internalType: "address",
        type: "address"
      }, {
        name: "tokenOut",
        internalType: "address",
        type: "address"
      }, {
        name: "fee",
        internalType: "uint24",
        type: "uint24"
      }, {
        name: "recipient",
        internalType: "address",
        type: "address"
      }, {
        name: "deadline",
        internalType: "uint256",
        type: "uint256"
      }, {
        name: "amountIn",
        internalType: "uint256",
        type: "uint256"
      }, {
        name: "amountOutMinimum",
        internalType: "uint256",
        type: "uint256"
      }, {
        name: "sqrtPriceLimitX96",
        internalType: "uint160",
        type: "uint160"
      }]
    }],
    name: "exactInputSingle",
    outputs: [{
      name: "amountOut",
      internalType: "uint256",
      type: "uint256"
    }],
    stateMutability: "payable"
  }
];

// ABI для ERC-20 токенов (approve, allowance, balanceOf)
const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
];

// Адреса токенов
const ETH_ADDRESS = "0x0fe9b43625fa7edd663adcec0728dd635e4abf7c";
const USDT_ADDRESS = "0x3ec8a8705be1d5ca90066b37ba62c4183b024ebf";
const BTC_ADDRESS = "0x36f6414ff1df609214ddaba71c84f18bcf00f67d";
const GIMO_ADDRESS = "0xba2ae6c8cddd628a087d7e43c1ba9844c5bf9638";
const STOG_ADDRESS = "0x14d2f76020c1ecb29bcd673b51d8026c6836a66a";
const VOG_ADDRESS = "0x78a8d4014000df30b49eb0c29822b6c7c79d68ca";

// Функция для проверки и выполнения approve
async function checkAndApprove(web3: Web3, tokenAddress: string, spenderAddress: string, amount: string, account: any, privateKey: string) {
  const tokenContract = new web3.eth.Contract(ERC20_ABI as any, tokenAddress);
  
  try {
    // Проверяем текущий allowance
    const allowance = await tokenContract.methods.allowance(account.address, spenderAddress).call();
    
    // Если allowance меньше необходимого количества, делаем approve
    if (BigInt(allowance as unknown as string) < BigInt(amount)) {
      console.log(`🔐 Approve...`);
      
      const approveData = tokenContract.methods
        .approve(spenderAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        .encodeABI();
      
      const nonce = await web3.eth.getTransactionCount(account.address);
      const gasPrice = await web3.eth.getGasPrice();
      
      const approveTx = {
        from: account.address,
        to: tokenAddress,
        data: approveData,
        gas: 100_000,
        gasPrice,
        nonce,
        value: "0"
      };
      
      // Симуляция approve
      try {
        await web3.eth.call(approveTx);
      } catch (simError) {
        // Игнорируем ошибки симуляции
      }
      
      // Отправляем approve транзакцию
      const signed = await web3.eth.accounts.signTransaction(approveTx, privateKey);
      
      if (!signed.rawTransaction) {
        throw new Error("Не удалось подписать approve транзакцию");
      }
      
      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      console.log(`✅ Approve OK`);
      
      // Ждем немного для подтверждения транзакции
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } else {
      console.log(`✅ Allowance OK`);
    }
  } catch (error) {
    console.log(`⚠️ Ошибка approve`);
  }
}

// Функция для генерации случайного числа в диапазоне
function getRandomAmount(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Функция для получения случайной пары для обмена
function getRandomDirection(): string {
  const directions = [
    "eth-to-usdt", "usdt-to-eth",
    "btc-to-usdt", "usdt-to-btc",
    "eth-to-btc",
    "usdt-to-gimo", "gimo-to-usdt",
    "usdt-to-stog", "stog-to-usdt",
    "usdt-to-vog", "vog-to-usdt"
  ];
  return directions[Math.floor(Math.random() * directions.length)];
}

// Функция для получения случайной суммы в зависимости от токена
function getRandomAmountForToken(tokenName: string): string {
  switch (tokenName) {
    case "BTC":
      const btcAmount = getRandomAmount(0.001, 0.003);
      return Web3.utils.toWei(btcAmount.toString(), 'ether');
    case "ETH":
      const ethAmount = getRandomAmount(0.01, 0.03);
      return Web3.utils.toWei(ethAmount.toString(), 'ether');
    case "USDT":
      const usdtAmount = getRandomAmount(100, 500);
      return Web3.utils.toWei(usdtAmount.toString(), 'ether'); // USDT имеет 18 decimals
    case "GIMO":
      const gimoAmount = getRandomAmount(0.0001, 0.0002);
      return Web3.utils.toWei(gimoAmount.toString(), 'ether');
    case "stOG":
      const stogAmount = getRandomAmount(0.00001, 0.00002);
      return Web3.utils.toWei(stogAmount.toString(), 'ether');
    case "VOG":
      const vogAmount = getRandomAmount(0.002, 0.004);
      return Web3.utils.toWei(vogAmount.toString(), 'ether');
    default:
      return "100000000000000000"; // 0.1 ETH по умолчанию
  }
}

// Функция для форматирования суммы токена для отображения
function formatTokenAmount(amount: string, tokenName: string): string {
  switch (tokenName) {
    case "USDT":
      return Web3.utils.fromWei(amount, 'ether'); // USDT имеет 18 decimals
    default:
      return Web3.utils.fromWei(amount, 'ether');
  }
}

// Функция для форматирования баланса токена (уже в правильных единицах)
function formatTokenBalance(balance: string, tokenName: string): string {
  switch (tokenName) {
    case "USDT":
      // Баланс USDT приходит в wei (18 decimals), как и все остальные токены
      return Web3.utils.fromWei(balance, 'ether');
    default:
      // Остальные токены в wei (18 decimals)
      return Web3.utils.fromWei(balance, 'ether');
  }
}

export async function executeSwap(accountName: string, direction: string, maxRetries: number = 5): Promise<boolean> {
  const privateKey = await getPrivateKey(accountName);
  if (!privateKey) {
    console.error("❌ Приватный ключ не найден");
    return false;
  }

  const web3 = new Web3(RPC_URL);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  const contract = new web3.eth.Contract(ABI as any, CONTRACT_ADDRESS);

  // Проверяем контракт
  const code = await web3.eth.getCode(CONTRACT_ADDRESS);
  if (code === '0x' || code === '0x0') {
    console.error("❌ Контракт не найден по адресу:", CONTRACT_ADDRESS);
    return false;
  }

  // Определяем направление обмена
  let tokenIn, tokenOut, amountIn, tokenInName, tokenOutName;
  
  if (direction === "usdt-to-eth") {
    tokenIn = USDT_ADDRESS;
    tokenOut = ETH_ADDRESS;
    amountIn = getRandomAmountForToken("USDT");
    tokenInName = "USDT";
    tokenOutName = "ETH";
  } else if (direction === "btc-to-usdt") {
    tokenIn = BTC_ADDRESS;
    tokenOut = USDT_ADDRESS;
    amountIn = getRandomAmountForToken("BTC");
    tokenInName = "BTC";
    tokenOutName = "USDT";
  } else if (direction === "usdt-to-btc") {
    tokenIn = USDT_ADDRESS;
    tokenOut = BTC_ADDRESS;
    amountIn = getRandomAmountForToken("USDT");
    tokenInName = "USDT";
    tokenOutName = "BTC";
  } else if (direction === "eth-to-btc") {
    tokenIn = ETH_ADDRESS;
    tokenOut = BTC_ADDRESS;
    amountIn = getRandomAmountForToken("ETH");
    tokenInName = "ETH";
    tokenOutName = "BTC";
  } else if (direction === "usdt-to-gimo") {
    tokenIn = USDT_ADDRESS;
    tokenOut = GIMO_ADDRESS;
    amountIn = getRandomAmountForToken("USDT");
    tokenInName = "USDT";
    tokenOutName = "GIMO";
  } else if (direction === "gimo-to-usdt") {
    tokenIn = GIMO_ADDRESS;
    tokenOut = USDT_ADDRESS;
    amountIn = getRandomAmountForToken("GIMO");
    tokenInName = "GIMO";
    tokenOutName = "USDT";
  } else if (direction === "usdt-to-stog") {
    tokenIn = USDT_ADDRESS;
    tokenOut = STOG_ADDRESS;
    amountIn = getRandomAmountForToken("USDT");
    tokenInName = "USDT";
    tokenOutName = "stOG";
  } else if (direction === "stog-to-usdt") {
    tokenIn = STOG_ADDRESS;
    tokenOut = USDT_ADDRESS;
    amountIn = getRandomAmountForToken("stOG");
    tokenInName = "stOG";
    tokenOutName = "USDT";
  } else if (direction === "usdt-to-vog") {
    tokenIn = USDT_ADDRESS;
    tokenOut = VOG_ADDRESS;
    amountIn = getRandomAmountForToken("USDT");
    tokenInName = "USDT";
    tokenOutName = "VOG";
  } else if (direction === "vog-to-usdt") {
    tokenIn = VOG_ADDRESS;
    tokenOut = USDT_ADDRESS;
    amountIn = getRandomAmountForToken("VOG");
    tokenInName = "VOG";
    tokenOutName = "USDT";
  } else if (direction === "eth-to-usdt") {
    tokenIn = ETH_ADDRESS;
    tokenOut = USDT_ADDRESS;
    amountIn = getRandomAmountForToken("ETH");
    tokenInName = "ETH";
    tokenOutName = "USDT";
  } else {
    // Если направление не распознано, возвращаем false
    console.log(`❌ Направление не распознано: ${direction}`);
    return false;
  }

  // Параметры из предоставленных данных
  const params = {
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    fee: 500, // 0x1f4 = 500
    recipient: account.address, // Получатель - адрес аккаунта
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 час от текущего времени
    amountIn: amountIn,
    amountOutMinimum: "0", // Минимальный возврат = 0
    sqrtPriceLimitX96: "0" // Без ограничения цены
  };

  console.log(`🔧 ${tokenInName} → ${tokenOutName} | Amount: ${formatTokenAmount(params.amountIn, tokenInName)} ${tokenInName}`);

  // Проверяем баланс токена, который обмениваем
  const tokenContract = new web3.eth.Contract(ERC20_ABI as any, params.tokenIn);
  try {
    const balance = await tokenContract.methods.balanceOf(account.address).call();
    const balanceFormatted = formatTokenBalance(balance as unknown as string, tokenInName);
    const amountFormatted = formatTokenAmount(params.amountIn, tokenInName);
    
    console.log(`💰 Баланс: ${balanceFormatted} ${tokenInName} | Нужно: ${amountFormatted} ${tokenInName}`);
    
    // Сравниваем сырые значения (в wei/smallest units)
    const balanceBigInt = BigInt(balance as unknown as string);
    const amountInBigInt = BigInt(params.amountIn);
    
    // Все токены используют одинаковый формат (18 decimals)
    const balanceToCompare = balanceBigInt;
    const amountToCompare = amountInBigInt;
    
    if (balanceToCompare < amountToCompare) {
      console.log(`❌ Недостаточно ${tokenInName}`);
      return false;
    }
    console.log(`✅ Баланс OK`);
  } catch (error) {
    console.log(`⚠️ Ошибка баланса: ${error}`);
    return false;
  }

  // Проверяем и выполняем approve для токена, который обмениваем
  await checkAndApprove(web3, params.tokenIn, CONTRACT_ADDRESS, params.amountIn, account, privateKey);

  // Кодируем вызов exactInputSingle
  const data = contract.methods
    .exactInputSingle(params)
    .encodeABI();

  const nonce = await web3.eth.getTransactionCount(account.address);
  const gasLimit = 5_000_000;
  const gasPrice = await web3.eth.getGasPrice();

  const tx = {
    from: account.address,
    to: CONTRACT_ADDRESS,
    data: data,
    gas: gasLimit,
    gasPrice,
    nonce,
    value: "0" // Нативная монета OG используется только для комиссии
  };

  // Симуляция транзакции
  try {
    await web3.eth.call(tx);
    console.log("🔍 Симуляция OK");
  } catch (simError) {
    console.log("⚠️ Симуляция неудачна");
  }

  console.log("📤 Отправка...");

  try {
    // Подписываем и отправляем транзакцию
    const signed = await web3.eth.accounts.signTransaction(tx, privateKey);

    if (!signed.rawTransaction) {
      throw new Error("Не удалось подписать транзакцию");
    }

    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    const hash = receipt.transactionHash as string;
    console.log(`✅ Hash: ${hash.substring(0, 10)}...`);
    
    if (receipt.status) {
      console.log("🎉 Успех!");
      return true;
    } else {
      console.log("⚠️ Статус неуспешный");
      return false;
    }
  } catch (error) {
    console.log("❌ Ошибка отправки");
    return false;
  }
}

export async function runRandomSwapsForAccount(accountName: string, attempts: number = 10) {
  console.log(`[${accountName}] 🎲 Случайные обмены...`);
  let i = 0;
  while (i < attempts) {
    i++;
    const randomDirection = getRandomDirection();
    console.log(`[${accountName}] 🔄 ${i}/${attempts}: ${randomDirection}`);
    const success = await executeSwap(accountName, randomDirection);
    if (success) {
      console.log(`[${accountName}] 🎉 Успех!`);
      break;
    }
    console.log(`[${accountName}] ❌ Неудача`);
    
    if (i < attempts) {
      const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // 5-10 секунд
      console.log(`[${accountName}] ⏳ Пауза ${delay/1000}с...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function main(accountName: string, direction?: string) {
  if (direction) {
    // Если указано конкретное направление, выполняем его
    const success = await executeSwap(accountName, direction);
    if (!success) {
      console.log("❌ Обмен не удался");
    }
  } else {
    // Если направление не указано, пробуем случайные пары
    console.log("🎲 Запускаем случайные обмены...");
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      attempts++;
      const randomDirection = getRandomDirection();
      console.log(`\n🔄 Попытка ${attempts}/${maxAttempts}: ${randomDirection}`);
      
      const success = await executeSwap(accountName, randomDirection);
      if (success) {
        console.log("🎉 Успешный обмен!");
        break;
      } else {
        console.log("❌ Обмен не удался, пробуем следующую пару...");
        // Небольшая пауза между попытками
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log("❌ Все попытки исчерпаны");
    }
  }
}

if (require.main === module) {
  const accountName = process.argv[2];
  const direction = process.argv[3]; // Убираем значение по умолчанию
  
  if (!accountName) {
    console.error("❌ Укажи имя аккаунта в параметрах");
    console.error("Использование: npx ts-node src/Og/ogJaineSwap.ts <accountName> [direction]");
    console.error("Направления:");
    console.error("  • eth-to-usdt - обмен ETH на USDT");
    console.error("  • usdt-to-eth - обмен USDT на ETH");
    console.error("  • btc-to-usdt - обмен BTC на USDT");
    console.error("  • usdt-to-btc - обмен USDT на BTC");
    console.error("  • eth-to-btc - обмен ETH на BTC");
    console.error("  • usdt-to-gimo - обмен USDT на GIMO");
    console.error("  • gimo-to-usdt - обмен GIMO на USDT");
    console.error("  • usdt-to-stog - обмен USDT на stOG");
    console.error("  • stog-to-usdt - обмен stOG на USDT");
    console.error("  • usdt-to-vog - обмен USDT на VOG");
    console.error("  • vog-to-usdt - обмен VOG на USDT");
    console.error("");
    console.error("Если направление не указано, будут выполнены случайные обмены");
    process.exit(1);
  }
  
  main(accountName, direction).catch(err => {
    console.error("❌ Ошибка:", err);
    process.exit(1);
  });
}
