const { Keypair } = require("@solana/web3.js");
const { HDKey } = require("micro-ed25519-hdkey");
const bip39 = require("bip39");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
process.removeAllListeners('warning');

// Открытие файла address.txt для записи
const addressFilePath = path.resolve(__dirname, "address.txt");
const addressStream = fs.createWriteStream(addressFilePath, { flags: "a" });

// Функция для генерации адреса из мнемонической фразы
function generateFromMnemonic(mnemonic) {
    // Проверка на пустую строку и валидность мнемонической фразы
    if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
      console.log(`Invalid or empty mnemonic: ${mnemonic}`);
      return; // Выход из функции, если мнемоническая фраза недействительна
    }
  
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");
    const hd = HDKey.fromMasterSeed(seed.toString("hex"));
  
    const derivationPath = `m/44'/501'/0'/0'`;
    const derivedKey = hd.derive(derivationPath);
  
    const keypair = Keypair.fromSeed(derivedKey.privateKey);
    const privateKey = Buffer.from(keypair.secretKey).toString("hex");
    const publicKey = keypair.publicKey.toBase58();
  
    // Запись в файл в формате privateKey:address
    addressStream.write(`${mnemonic}:${privateKey}:${publicKey}\n`);
    console.log(`Address from mnemonic: ${publicKey}`);
  }
  
// Функция для генерации адреса из приватного ключа
function generateFromPrivateKey(privateKeyHex) {
  const privateKey = Buffer.from(privateKeyHex, 'hex');
  const keypair = Keypair.fromSecretKey(privateKey);

  const publicKey = keypair.publicKey.toBase58();

  // Запись в файл в формате privateKey:address
  addressStream.write(`${privateKeyHex}:${publicKey}\n`);
  console.log(`Address from private key: ${publicKey}`);
}

// Чтение данных из seed.txt и private keys.txt
const mnemonicFilePath = path.resolve(__dirname, "seed.txt");
const privateKeyFilePath = path.resolve(__dirname, "private keys.txt");

// Вопрос для пользователя: использовать сид фразы или приватные ключи
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Choose an option:\n1. Generate from seed phrases in seed.txt\n2. Generate from private keys in private keys.txt\nYour choice: ", (choice) => {
  if (choice === '1') {
    // Чтение и генерация из мнемонических фраз
    const seedData = fs.readFileSync(mnemonicFilePath, "utf8").trim().split("\n");
    seedData.forEach(mnemonic => {
      generateFromMnemonic(mnemonic.trim());
    });
    rl.close();
    addressStream.end();
  } else if (choice === '2') {
    // Чтение и генерация из приватных ключей
    const privateKeyData = fs.readFileSync(privateKeyFilePath, "utf8").trim().split("\n");
    privateKeyData.forEach(privateKeyHex => {
      generateFromPrivateKey(privateKeyHex.trim());
    });
    rl.close();
    addressStream.end();
  } else {
    console.log("Invalid choice. Please run the script again and choose a valid option.");
    rl.close();
  }
});
