import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Icon from "./Icon";

const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

let nextId = 0;

function Toast({ title, message, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const leave = setTimeout(() => setVisible(false), 5000);
    const remove = setTimeout(onDone, 5300);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(leave);
      clearTimeout(remove);
    };
  }, [onDone]);

  return (
    <div className={visible ? "toast show" : "toast"}>
      <Icon name="checkCircle" />
      <div>
        {title && <strong>{title}</strong>}
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message) => {
    setToasts((current) => [...current, { id: ++nextId, title, message }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-region" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              onDone={() => dismiss(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
