import { HistoryItem } from "../types";

const STORAGE_KEY = 'p4p_monitor_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (item: HistoryItem) => {
  try {
    const history = getHistory();
    // Add new item to the beginning
    const updated = [item, ...history];
    // Optional: Limit history size to prevent quota issues (e.g., keep last 20)
    const limited = updated.slice(0, 50); 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    return limited;
  } catch (e) {
    console.error("Failed to save history", e);
    alert("保存失败：可能是浏览器存储空间已满。");
    return getHistory();
  }
};

export const deleteHistoryItem = (id: string) => {
  try {
    const history = getHistory();
    // Use String coercion to ensure safe comparison
    const updated = history.filter(item => String(item.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete history item", e);
    return getHistory();
  }
};