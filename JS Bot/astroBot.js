// Astro Bot – CSS/HTML-Version (kein Three.js / WebGL mehr nötig)
// Reagiert per CSS-Klassenwechsel auf den Chat-Zustand: is-idle / is-thinking / is-talking
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

document.addEventListener("DOMContentLoaded", () => {

    const bot = document.getElementById("astro-bot");
    const botContainer = document.getElementById("bot-container");
    const botChat = document.getElementById("bot-chat");

    let idleTimeout = null;

    function setBotState(state) {
        const normalized = state.startsWith("is-") ? state : `is-${state}`;
        bot.classList.remove("is-idle", "is-thinking", "is-talking", "is-error", "is-happy");
        bot.classList.add(normalized);
    }

    // Global verfügbar machen, damit andere Skripte auf der Seite (z. B. ein
    // "Besucher tippt gerade" Hook) den Bot-Zustand direkt ansteuern können:
    // window.botState("thinking") / window.botState("talking") / window.botState("idle")
    window.botState = setBotState;

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

    // Schlüsselwörter, die im Bot-Text nach Erfolg/Fehler suchen.
    // Bei Bedarf anpassen/erweitern, falls der System-Prompt andere Formulierungen nutzt.
    const ERROR_PATTERNS = /kein termin frei|fehler|nicht erreichbar|leider (ist |sind )?(kein|keine)|entschuldigung.*(fehler|problem)/i;
    const SUCCESS_PATTERNS = /termin (wurde |ist )?(erfolgreich )?(gebucht|erstellt|angelegt)|termin bestätigt|ihr termin steht/i;

    function reactToBotMessage(text) {
        if (!text) {
            setBotState("is-talking");
            returnToIdleAfter(2500);
            return;
        }
        if (ERROR_PATTERNS.test(text)) {
            setBotState("is-error");
            returnToIdleAfter(4000);
        } else if (SUCCESS_PATTERNS.test(text)) {
            setBotState("is-happy");
            returnToIdleAfter(4000);
        } else {
            setBotState("is-talking");
            returnToIdleAfter(2500);
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                const cls = node.className ? String(node.className) : "";

                if (/typing/i.test(cls)) {
                    setBotState("is-thinking");
                } else if (/bot|assistant/i.test(cls)) {
                    reactToBotMessage(node.textContent || node.innerText || "");
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
