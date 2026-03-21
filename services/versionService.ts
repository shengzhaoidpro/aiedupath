import { LearningPath, PathVersion } from '../types';

const storageKey = (topic: string) => `path_${topic}_versions`;

export function loadVersions(topic: string): PathVersion[] {
  try {
    const raw = localStorage.getItem(storageKey(topic));
    return raw ? (JSON.parse(raw) as PathVersion[]) : [];
  } catch {
    return [];
  }
}

export function saveNewVersion(
  topic: string,
  path: LearningPath,
  iterationNote?: string,
): PathVersion[] {
  const existing = loadVersions(topic);
  const newVersion: PathVersion = {
    version: existing.length + 1,
    path,
    createdAt: Date.now(),
    isStarred: false,
    iterationNote,
  };
  const updated = [...existing, newVersion];
  localStorage.setItem(storageKey(topic), JSON.stringify(updated));
  return updated;
}

export function toggleStar(topic: string, versionNum: number): PathVersion[] {
  const existing = loadVersions(topic);
  const updated = existing.map((v) =>
    v.version === versionNum ? { ...v, isStarred: !v.isStarred } : v,
  );
  localStorage.setItem(storageKey(topic), JSON.stringify(updated));
  return updated;
}
