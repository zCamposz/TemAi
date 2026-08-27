import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Announce from "./pages/Announce";
import About from "./pages/About";

/** Rola para o topo a cada navegação, ou para a seção quando há âncora. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.replace("#", ""));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorar" element={<Explore />} />
          <Route path="/produto/:slug" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/anunciar" element={<Announce />} />
          <Route path="/sobre" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}
