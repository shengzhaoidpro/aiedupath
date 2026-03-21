import { MyLearningItem } from '../types';

const STORAGE_KEY = 'my_learning_items';

export function loadMyLearning(): MyLearningItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MyLearningItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: MyLearningItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToMyLearning(topic: string): MyLearningItem[] {
  const items = loadMyLearning();
  if (items.some((i) => i.topic === topic)) return items;
  const updated = [{ topic, addedAt: Date.now() }, ...items];
  save(updated);
  return updated;
}

export function removeFromMyLearning(topic: string): MyLearningItem[] {
  const updated = loadMyLearning().filter((i) => i.topic !== topic);
  save(updated);
  return updated;
}
