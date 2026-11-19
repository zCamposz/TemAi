import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Icon from "./Icon";
import {
  clearNotifications,
  markAllRead,
  markRead,
  useNotifications,
} from "../lib/notifications";

function timeAgo(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { items, reload } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="notif-btn"
        aria-label={unread ? `Notificações (${unread} não lidas)` : "Notificações"}
        aria-expanded={open}
        onClick={() => {
          if (!open && unread) markAllRead(user.id).then(reload);
          setOpen((v) => !v);
        }}
      >
        <Icon name="bell" />
        {unread > 0 ? <span className="notif-badge">{unread > 9 ? "9+" : unread}</span> : null}
      </button>

      {open ? (
        <div className="notif-panel" role="dialog" aria-label="Notificações">
          <div className="notif-head">
            <strong>Notificações</strong>
            <div>
              <button type="button" onClick={() => markAllRead(user.id).then(reload)} disabled={!unread}>
                Marcar como lidas
              </button>
              <button type="button" onClick={() => clearNotifications(user.id).then(reload)} disabled={!items.length}>
                Limpar
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="notif-empty">Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id} className={n.read ? "" : "unread"}>
                  <Link
                    to="/reservas"
                    onClick={() => {
                      markRead(n.id).then(reload);
                      setOpen(false);
                    }}
                  >
                    <strong>{n.title}</strong>
                    <span>{n.message}</span>
                    <small>{timeAgo(n.createdAt)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
