import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ note, children }) {
  return (
    <>
      {note && (
        <div className="proto-note">
          <strong>Protótipo navegável</strong> — {note}
        </div>
      )}
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
