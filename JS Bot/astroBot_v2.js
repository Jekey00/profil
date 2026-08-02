// Astro Bot – CSS/HTML-Version (kein Three.js / WebGL mehr nötig)
// Reagiert per CSS-Klassenwechsel auf den Chat-Zustand: is-idle / is-thinking / is-talking
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

document.addEventListener("DOMContentLoaded", () => {

    const bot = document.getElementById("astro-bot");
    const botContainer = document.getElementById("bot-container");
    const botChat = document.getElementById("bot-chat");

    let idleTimeout = null;

    function setBotState(state) {
        bot.classList.remove("is-idle", "is-thinking", "is-talking");
        bot.classList.add(state);
    }

    function returnToIdleAfter(ms) {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => setBotState("is-idle"), ms);
    }

    setBotState("is-idle");

    // Chat-Fenster öffnen/schließen
    botContainer.addEventListener("click", () => {
        const isOpen = botChat.style.display === "block";
        botChat.style.display = isOpen ? "none" : "block";
    });

    // n8n Chat einbinden
    createChat({
        webhookUrl: 'https://dessie-glossiest-desiredly.ngrok-free.dev/webhook/ecd08f35-6580-40c6-8f88-a18766819dee/chat',
        parent: '#n8n-chat-container',
        showFloatingButton: false
    });

    // Chat-DOM beobachten, um auf "tippt..." / neue Bot-Nachricht zu reagieren.
    // WICHTIG: Die konkreten Klassennamen des @n8n/chat-Widgets solltest du im
    // Browser (Rechtsklick -> Untersuchen) prüfen und ggf. anpassen, falls sich
    // die Bibliothek in Zukunft ändert. Als Fallback reagieren wir bewusst
    // breit (per Regex auf "typing"/"bot"/"assistant" im class-Namen), damit
    // kleinere Versionsunterschiede nichts kaputt machen.
    const chatRoot = document.getElementById("n8n-chat-container");

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                const cls = node.className ? String(node.className) : "";

                if (/typing/i.test(cls)) {
                    setBotState("is-thinking");
                } else if (/bot|assistant/i.test(cls)) {
                    setBotState("is-talking");
                    returnToIdleAfter(2500);
                }
            }
        }
    });

    observer.observe(chatRoot, { childList: true, subtree: true });

    // Wenn der Besucher selbst tippt/sendet, kurz in den "thinking"-Zustand
    // wechseln, bis eine Antwort erkannt wird (Fallback-Timeout falls die
    // Observer-Erkennung oben nichts findet).
    chatRoot.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            setBotState("is-thinking");
            returnToIdleAfter(8000); // Sicherheits-Fallback
        }
    });
});
