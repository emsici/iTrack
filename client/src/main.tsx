import { createRoot } from "react-dom/client";
import SimpleApp from "./SimpleApp";
import "./index.css";

// Global error handling pentru Android
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
});

console.log('Starting iTrack app...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(<SimpleApp />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial; background: #f5f5f5; min-height: 100vh;">
      <h2 style="color: #1976d2;">iTrack</h2>
      <p>Eroare la încărcare: ${error}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px;">
        Restart
      </button>
    </div>
  `;
}
