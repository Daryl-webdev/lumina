(() => {
  const CONFIG = {
    orgId: "00Dg8000006eGtp",
    esDeveloperName: "Lumina_Custom_Client",
    scrt2URL: "https://os1779160828320.my.salesforce-scrt.com",
    language: "en_US"
  };

  const state = {
    accessToken: "",
    conversationId: "",
    connected: false,
    isNewMessagingSession: true,
    abortController: null,
    lastEventId: "",
    outboundTexts: []
  };

  const selectors = {
    launcher: "luminaChatLauncher",
    panel: "luminaChatPanel",
    close: "luminaChatClose",
    messages: "luminaChatMessages",
    form: "luminaChatForm",
    input: "luminaChatInput",
    status: "luminaChatStatus"
  };

  document.addEventListener("DOMContentLoaded", initLuminaChatClient);

  function initLuminaChatClient() {
    injectChatMarkup();
    bindChatEvents();
    setStatus("Ready");
  }

  function injectChatMarkup() {
    if (document.getElementById(selectors.panel)) return;

    const wrapper = document.createElement("section");
    wrapper.className = "lumina-chat";
    wrapper.innerHTML = `
      <button id="${selectors.launcher}" class="lumina-chat__launcher" type="button" aria-label="Open Lumina chat">
        <span class="lumina-chat__launcher-icon">L</span>
      </button>
      <aside id="${selectors.panel}" class="lumina-chat__panel" aria-label="Lumina concierge chat" aria-hidden="true">
        <header class="lumina-chat__header">
          <div>
            <div class="lumina-chat__title">Lumina Concierge</div>
            <div id="${selectors.status}" class="lumina-chat__status">Ready</div>
          </div>
          <button id="${selectors.close}" class="lumina-chat__close" type="button" aria-label="Close chat">&times;</button>
        </header>
        <div id="${selectors.messages}" class="lumina-chat__messages" role="log" aria-live="polite"></div>
        <form id="${selectors.form}" class="lumina-chat__form">
          <input id="${selectors.input}" class="lumina-chat__input" type="text" autocomplete="off" placeholder="Ask about rings..." />
          <button class="lumina-chat__send" type="submit">Send</button>
        </form>
      </aside>
    `;
    document.body.appendChild(wrapper);
  }

  function bindChatEvents() {
    const launcher = document.getElementById(selectors.launcher);
    const panel = document.getElementById(selectors.panel);
    const close = document.getElementById(selectors.close);
    const form = document.getElementById(selectors.form);
    const input = document.getElementById(selectors.input);

    launcher?.addEventListener("click", async () => {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      input?.focus();
      if (!state.connected) {
        await connect();
      }
    });

    close?.addEventListener("click", () => {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      launcher?.focus();
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      renderMessage("user", text);
      await sendMessage(text);
    });

    window.LuminaChatClient = {
      config: CONFIG,
      connect,
      sendMessage,
      handleIncomingText,
      handlePayloadText
    };
  }

  async function connect() {
    try {
      setStatus("Connecting...");
      appendSystemMessage("Connecting to Lumina Concierge.");
      state.conversationId = state.conversationId || crypto.randomUUID().toLowerCase();
      state.accessToken = await requestAccessToken();
      await createConversation();
      listenForEvents();
      state.connected = true;
      setStatus("Connected");
    } catch (error) {
      console.error("Lumina chat connection failed", error);
      setStatus("Connection failed");
      appendSystemMessage(error.message || "Unable to connect to Salesforce chat.");
    }
  }

  async function requestAccessToken() {
    const response = await fetch(`${CONFIG.scrt2URL}/iamessage/api/v2/authorization/unauthenticated/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orgId: CONFIG.orgId,
        esDeveloperName: CONFIG.esDeveloperName,
        capabilitiesVersion: "1",
        platform: "Web",
        context: {
          appName: "LuminaAtelier",
          clientVersion: "1.0.0"
        }
      })
    });

    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Access token request failed (${response.status})`);
    }

    if (payload.lastEventId) {
      state.lastEventId = payload.lastEventId;
    }

    const accessToken = payload.accessToken || payload.token;
    if (!accessToken) {
      throw new Error("Salesforce did not return an access token.");
    }

    return accessToken;
  }

  async function createConversation() {
    const response = await fetch(`${CONFIG.scrt2URL}/iamessage/api/v2/conversation`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        conversationId: state.conversationId,
        esDeveloperName: CONFIG.esDeveloperName,
        language: CONFIG.language,
        routingAttributes: {}
      })
    });

    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Conversation creation failed (${response.status})`);
    }
  }

  async function sendMessage(text) {
    try {
      if (!state.connected) {
        await connect();
      }

      rememberOutboundText(text);
      const response = await fetch(`${CONFIG.scrt2URL}/iamessage/api/v2/conversation/${state.conversationId}/message`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          message: {
            id: crypto.randomUUID().toLowerCase(),
            messageType: "StaticContentMessage",
            staticContent: {
              formatType: "Text",
              text
            }
          },
          esDeveloperName: CONFIG.esDeveloperName,
          isNewMessagingSession: state.isNewMessagingSession,
          routingAttributes: {},
          language: CONFIG.language
        })
      });

      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || `Message send failed (${response.status})`);
      }
      state.isNewMessagingSession = false;
    } catch (error) {
      console.error("Lumina chat send failed", error);
      appendSystemMessage(error.message || "Message could not be sent.");
      setStatus("Send failed");
    }
  }

  function listenForEvents() {
    state.abortController?.abort();
    state.abortController = new AbortController();

    fetch(`${CONFIG.scrt2URL}/eventrouter/v1/sse`, {
      method: "GET",
      headers: {
        ...apiHeaders(),
        Accept: "text/event-stream",
        ...(state.lastEventId ? { "Last-Event-ID": state.lastEventId } : {})
      },
      signal: state.abortController.signal
    })
      .then(response => {
        if (!response.ok || !response.body) {
          throw new Error(`Event stream failed (${response.status})`);
        }
        return readEventStream(response.body);
      })
      .catch(error => {
        if (error.name === "AbortError") return;
        console.error("Lumina chat event stream failed", error);
        state.connected = false;
        setStatus("Disconnected");
        appendSystemMessage("Salesforce event stream disconnected. Reopen the chat or send a message to reconnect.");
      });
  }

  async function readEventStream(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      events.forEach(parseServerSentEvent);
    }
  }

  function parseServerSentEvent(rawEvent) {
    const event = {};
    rawEvent.split(/\r?\n/).forEach(line => {
      const separator = line.indexOf(":");
      if (separator === -1) return;
      const key = line.slice(0, separator);
      const value = line.slice(separator + 1).trimStart();
      if (key === "data") {
        event.data = event.data ? `${event.data}\n${value}` : value;
      } else {
        event[key] = value;
      }
    });

    if (event.id) {
      state.lastEventId = event.id;
    }
    if (!event.data) return;

    try {
      handleSalesforceEvent(JSON.parse(event.data));
    } catch (error) {
      console.warn("Ignoring non-JSON Salesforce event", event.data, error);
    }
  }

  function handleSalesforceEvent(eventPayload) {
    const texts = extractTextCandidates(eventPayload);
    texts.forEach(handleIncomingText);
  }

  function extractTextCandidates(value, results = []) {
    if (!value || results.length > 10) return results;

    if (typeof value === "string") {
      if (looksLikeDisplayText(value)) results.push(value);
      return results;
    }

    if (Array.isArray(value)) {
      value.forEach(item => extractTextCandidates(item, results));
      return results;
    }

    if (typeof value === "object") {
      const textKeys = ["text", "messageText", "plainText", "content"];
      textKeys.forEach(key => {
        if (typeof value[key] === "string" && looksLikeDisplayText(value[key])) {
          results.push(value[key]);
        }
      });

      if (value.staticContent) extractTextCandidates(value.staticContent, results);
      if (value.abstractMessage) extractTextCandidates(value.abstractMessage, results);
      if (value.message) extractTextCandidates(value.message, results);
      if (value.entryPayload) {
        try {
          extractTextCandidates(typeof value.entryPayload === "string" ? JSON.parse(value.entryPayload) : value.entryPayload, results);
        } catch {
          extractTextCandidates(value.entryPayload, results);
        }
      }
    }

    return [...new Set(results)];
  }

  function looksLikeDisplayText(value) {
    const text = value.trim();
    if (!text) return false;
    if (text === state.conversationId) return false;
    return text.length < 4000;
  }

  function handleIncomingText(text) {
    if (isOutboundEcho(text)) return;

    const parts = splitHumanAndPayloadLines(text);
    parts.forEach(part => {
      if (handlePayloadText(part)) return;
      renderMessage("agent", part);
    });
  }

  function splitHumanAndPayloadLines(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];

    const lines = trimmed.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) return [trimmed];

    const parts = [];
    let currentHuman = [];
    lines.forEach(line => {
      if (tryParseJson(line)?.luminaType) {
        if (currentHuman.length) {
          parts.push(currentHuman.join("\n"));
          currentHuman = [];
        }
        parts.push(line);
      } else {
        currentHuman.push(line);
      }
    });
    if (currentHuman.length) parts.push(currentHuman.join("\n"));
    return parts;
  }

  function handlePayloadText(text) {
    const payload = tryParseJson(text);
    if (!payload?.luminaType) return false;

    const handled = window.LuminaStorefront?.handleAgentPayload?.(payload);
    if (handled) {
      appendSystemMessage(payload.checkout ? "Cart updated for checkout." : "Storefront updated.");
    }
    return true;
  }

  function tryParseJson(text) {
    try {
      return JSON.parse(String(text || "").trim());
    } catch {
      return null;
    }
  }

  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.accessToken}`,
      "X-Org-Id": CONFIG.orgId
    };
  }

  function rememberOutboundText(text) {
    state.outboundTexts.push(String(text || "").trim());
    state.outboundTexts = state.outboundTexts.slice(-8);
  }

  function isOutboundEcho(text) {
    const normalized = String(text || "").trim();
    const index = state.outboundTexts.indexOf(normalized);
    if (index === -1) return false;
    state.outboundTexts.splice(index, 1);
    return true;
  }

  async function readJsonResponse(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  function renderMessage(author, text) {
    const messages = document.getElementById(selectors.messages);
    if (!messages) return;

    const row = document.createElement("div");
    row.className = `lumina-chat__message lumina-chat__message--${author}`;
    row.textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendSystemMessage(text) {
    const messages = document.getElementById(selectors.messages);
    if (!messages) return;

    const row = document.createElement("div");
    row.className = "lumina-chat__system";
    row.textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function setStatus(text) {
    const status = document.getElementById(selectors.status);
    if (status) status.textContent = text;
  }
})();
