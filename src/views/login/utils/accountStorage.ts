import { storageLocal } from "@pureadmin/utils";

const ACCOUNT_STORAGE_KEY = "saved-accounts";

export interface SavedAccount {
  username: string;
  password: string;
  timestamp: number; // 保存时间戳，用于排序
}

/**
 * 获取所有已保存的账号
 */
export function getSavedAccounts(): SavedAccount[] {
  const accounts = storageLocal().getItem<SavedAccount[]>(ACCOUNT_STORAGE_KEY);
  return accounts || [];
}

/**
 * 保存账号和密码
 */
export function saveAccount(username: string, password: string): void {
  const accounts = getSavedAccounts();

  // 检查账号是否已存在
  const existingIndex = accounts.findIndex(acc => acc.username === username);

  if (existingIndex >= 0) {
    // 如果已存在，更新密码和时间戳
    accounts[existingIndex].password = password;
    accounts[existingIndex].timestamp = Date.now();
  } else {
    // 如果不存在，添加新账号（最多保存10个）
    if (accounts.length >= 10) {
      // 删除最旧的账号
      accounts.sort((a, b) => a.timestamp - b.timestamp);
      accounts.shift();
    }
    accounts.push({
      username,
      password,
      timestamp: Date.now()
    });
  }

  // 按时间戳倒序排列（最新的在前）
  accounts.sort((a, b) => b.timestamp - a.timestamp);

  storageLocal().setItem(ACCOUNT_STORAGE_KEY, accounts);
}

/**
 * 获取指定账号的密码
 */
export function getAccountPassword(username: string): string | null {
  const accounts = getSavedAccounts();
  const account = accounts.find(acc => acc.username === username);
  return account ? account.password : null;
}

/**
 * 删除已保存的账号
 */
export function removeAccount(username: string): void {
  const accounts = getSavedAccounts();
  const filteredAccounts = accounts.filter(acc => acc.username !== username);
  storageLocal().setItem(ACCOUNT_STORAGE_KEY, filteredAccounts);
}

/**
 * 清空所有已保存的账号
 */
export function clearAllAccounts(): void {
  storageLocal().removeItem(ACCOUNT_STORAGE_KEY);
}
