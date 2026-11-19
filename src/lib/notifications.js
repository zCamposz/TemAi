import { useSyncExternalStore } from "react";

/**
 * Notificações no aplicativo (simuladas).
 * Como as reservas, ficam no localStorage: para testar, faça uma ação com uma
 * conta e entre com a outra conta no mesmo navegador para ver o aviso chegar.
 * O envio por e-mail/SMS é só simulado: aparece no console do navegador.
 */

const STORAGE_KEY = "temai.notificacoes.v1";
const MAX = 100;

let cache = null;
const listeners = new Set();

function read() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível: mantém só em memória */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useNotifications(userId) {
  const all = useSyncExternalStore(subscribe, read, read);
  return userId ? all.filter((n) => n.userId === userId) : [];
}

/** Cria uma notificação para o usuário. Sem destinatário (item de demonstração), ignora. */
export function notify(userId, { title, message }) {
  if (!userId) return;
  const item = {
    id: crypto.randomUUID(),
    userId,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  write([item, ...read()].slice(0, MAX));
  console.info(`[Tem Aí? · e-mail/SMS simulado] para ${userId}: ${title} — ${message}`);
}

export function markAllRead(userId) {
  write(read().map((n) => (n.userId === userId ? { ...n, read: true } : n)));
}

export function markRead(id) {
  write(read().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function clearNotifications(userId) {
  write(read().filter((n) => n.userId !== userId));
}
