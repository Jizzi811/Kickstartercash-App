// Lazy-Loader für Puter.js (kostenlose gpt-image-2-Bildgenerierung, user-pays).
// Das Script wird erst beim ersten Bedarf geladen statt global in index.html –
// so erreicht das Fremd-Script weder Landing/Auth noch andere Seiten (DSGVO,
// Angriffsfläche) und kostet dort keine Ladezeit.

const PUTER_SRC = "https://js.puter.com/v2/";
let loadPromise = null;

export function loadPuter() {
  if (window.puter?.ai) return Promise.resolve(window.puter);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PUTER_SRC;
    script.async = true;
    script.onload = () => {
      if (window.puter?.ai) resolve(window.puter);
      else reject(new Error("Puter.js geladen, aber window.puter fehlt"));
    };
    script.onerror = () => {
      loadPromise = null; // nächster Versuch darf neu laden
      reject(new Error("Puter.js konnte nicht geladen werden"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
