import { useEffect, useState } from "react";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* depolama kapalıysa uygulama yine çalışır, sadece hatırlamaz */
  }
}

/** localStorage'a bağlı state. */
export function useStored(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue];
}
