(() => {
  /**********************************************************************************
   * Stores Salesforce Messaging API configuration values.
   * ********************************************************************************/
  const CONFIG = {
    orgId: "00Dg8000006eGtp",
    esDeveloperName: "Lumina_Custom_Client",
    scrt2URL: "https://os1779160828320.my.salesforce-scrt.com",
    language: "en_US"
  };

  /**********************************************************************************
   * Tracks the active chat session and event stream state.
   * ********************************************************************************/
  const state = {
    accessToken: "",
    conversationId: "",
    connected: false,
    isNewMessagingSession: true,
    abortController: null,
    connectPromise: null,
    lastEventId: "",
    outboundTexts: []
  };

  /**********************************************************************************
   * Maps chat UI elements to their DOM ids.
   * ********************************************************************************/
  const selectors = {
    launcher: "luminaChatLauncher",
    panel: "luminaChatPanel",
    close: "luminaChatClose",
    end: "luminaChatEnd",
    menu: "luminaChatMenu",
    menuDropdown: "luminaChatMenuDropdown",
    messages: "luminaChatMessages",
    form: "luminaChatForm",
    input: "luminaChatInput",
    status: "luminaChatStatus"
  };

  /**********************************************************************************
   * Initializes markup, events, and the default status once the page loads.
   * ********************************************************************************/
  document.addEventListener("DOMContentLoaded", initLuminaChatClient);

  /**********************************************************************************
   * Builds and prepares the Lumina chat client.
   * ********************************************************************************/
  function initLuminaChatClient() {
    injectChatMarkup();
    bindChatEvents();
    setStatus("Ready");
  }

  /**********************************************************************************
   * Injects the chat launcher and panel markup into the page.
   * ********************************************************************************/
  function injectChatMarkup() {
    if (document.getElementById(selectors.panel)) return;

    const wrapper = document.createElement("section");
    wrapper.className = "lumina-chat";
    wrapper.innerHTML = `
      <button id="${selectors.launcher}" class="lumina-chat__launcher" type="button" aria-label="Open Lumina chat">
        <span class="lumina-chat__launcher-icon" aria-hidden="true">
          <svg viewBox="0 0 52 52" focusable="false">
            <path d="M14 17.5c0-3 2.4-5.5 5.5-5.5h13c3 0 5.5 2.4 5.5 5.5v7c0 3-2.4 5.5-5.5 5.5h-8.1l-7.8 6.4V30h-1.1c-3 0-5.5-2.4-5.5-5.5v-7Z"></path>
            <circle cx="20.5" cy="21" r="1.8"></circle>
            <circle cx="26" cy="21" r="1.8"></circle>
            <circle cx="31.5" cy="21" r="1.8"></circle>
          </svg>
        </span>
      </button>
      <aside id="${selectors.panel}" class="lumina-chat__panel" aria-label="Lumina concierge chat" aria-hidden="true">
        <header class="lumina-chat__header">
          <button id="${selectors.menu}" class="lumina-chat__menu" type="button" aria-label="Chat options" aria-expanded="false" aria-controls="${selectors.menuDropdown}">
            <span aria-hidden="true"></span>
          </button>
          <div class="lumina-chat__heading">
            <div class="lumina-chat__title">Lumina</div>
            <div id="${selectors.status}" class="lumina-chat__status">Ready</div>
          </div>
          <button id="${selectors.close}" class="lumina-chat__close" type="button" aria-label="Minimize chat">
            <span aria-hidden="true"></span>
          </button>
        </header>
        <div id="${selectors.menuDropdown}" class="lumina-chat__menu-dropdown" aria-hidden="true">
          <button id="${selectors.end}" class="lumina-chat__menu-item" type="button">End Conversation</button>
        </div>
        <div id="${selectors.messages}" class="lumina-chat__messages" role="log" aria-live="polite"></div>
        <form id="${selectors.form}" class="lumina-chat__form">
          <input id="${selectors.input}" class="lumina-chat__input" type="text" autocomplete="off" placeholder="Send a message..." />
        </form>
      </aside>
    `;
    document.body.appendChild(wrapper);
  }

  /**********************************************************************************
   * Connects UI events to chat actions and exposes the public client API.
   * ********************************************************************************/
  function bindChatEvents() {
    /**********************************************************************************
     * References the button that opens the chat panel.
     * ********************************************************************************/
    const launcher = document.getElementById(selectors.launcher);
    /**********************************************************************************
     * References the chat panel container.
     * ********************************************************************************/
    const panel = document.getElementById(selectors.panel);
    /**********************************************************************************
     * References the button that minimizes the chat panel.
     * ********************************************************************************/
    const close = document.getElementById(selectors.close);
    /**********************************************************************************
     * References the menu item that ends the conversation.
     * ********************************************************************************/
    const end = document.getElementById(selectors.end);
    /**********************************************************************************
     * References the chat options menu button.
     * ********************************************************************************/
    const menu = document.getElementById(selectors.menu);
    /**********************************************************************************
     * References the chat options dropdown.
     * ********************************************************************************/
    const menuDropdown = document.getElementById(selectors.menuDropdown);
    /**********************************************************************************
     * References the message submission form.
     * ********************************************************************************/
    const form = document.getElementById(selectors.form);
    /**********************************************************************************
     * References the user message input.
     * ********************************************************************************/
    const input = document.getElementById(selectors.input);

    launcher?.addEventListener("click", async () => {
      setPanelOpen(true);
      input?.focus();
      if (!state.connected) {
        await connect();
      }
    });

    close?.addEventListener("click", () => {
      setMenuOpen(false);
      setPanelOpen(false);
      launcher?.focus();
    });

    menu?.addEventListener("click", () => {
      /**********************************************************************************
       * Tracks whether the chat options menu should be opened or closed.
       * ********************************************************************************/
      const shouldOpen = !panel.classList.contains("is-menu-open");
      setMenuOpen(shouldOpen);
    });

    end?.addEventListener("click", async () => {
      setMenuOpen(false);
      await endConversation();
    });

    document.addEventListener("click", (event) => {
      if (!panel.contains(event.target)) setMenuOpen(false);
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      /**********************************************************************************
       * Stores the trimmed message entered by the user.
       * ********************************************************************************/
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      renderMessage("user", text);
      await sendMessage(text);
    });

    /**********************************************************************************
     * Opens or closes the chat panel and keeps accessibility state aligned.
     * ********************************************************************************/
    function setPanelOpen(isOpen) {
      panel.classList.toggle("is-open", isOpen);
      panel.setAttribute("aria-hidden", String(!isOpen));
    }

    /**********************************************************************************
     * Opens or closes the chat options menu and keeps accessibility state aligned.
     * ********************************************************************************/
    function setMenuOpen(isOpen) {
      panel.classList.toggle("is-menu-open", isOpen);
      menu?.setAttribute("aria-expanded", String(isOpen));
      menuDropdown?.setAttribute("aria-hidden", String(!isOpen));
    }
  }

  /**********************************************************************************
   * Starts the Salesforce chat session and server event stream.
   * ********************************************************************************/
  async function connect() {
    if (state.connectPromise) return state.connectPromise;

    state.connectPromise = openConnection();
    try {
      await state.connectPromise;
    } finally {
      state.connectPromise = null;
    }
  }

  /**********************************************************************************
   * Performs the Salesforce connection workflow for a single in-flight connect attempt.
   * ********************************************************************************/
  async function openConnection() {
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

  /**********************************************************************************
   * Ends the active Salesforce conversation and resets local state.
   * ********************************************************************************/
  async function endConversation() {
    /**********************************************************************************
     * Keeps the current conversation id available during cleanup.
     * ********************************************************************************/
    const conversationId = state.conversationId;
    try {
      setStatus("Ending...");
      if (conversationId && state.accessToken) {
        await fetch(`${CONFIG.scrt2URL}/iamessage/api/v2/conversation/${conversationId}?esDeveloperName=${CONFIG.esDeveloperName}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            "X-Org-Id": CONFIG.orgId
          }
        });
      }
    } catch (error) {
      console.warn("Lumina chat end request failed", error);
    } finally {
      state.abortController?.abort();
      resetConversationState();
      appendSystemMessage("Chat ended.");
      setStatus("Ended");
    }
  }

  /**********************************************************************************
   * Clears session fields so a new chat can start cleanly.
   * ********************************************************************************/
  function resetConversationState() {
    state.accessToken = "";
    state.conversationId = "";
    state.connected = false;
    state.isNewMessagingSession = true;
    state.abortController = null;
    state.connectPromise = null;
    state.lastEventId = "";
    state.outboundTexts = [];
  }

  /**********************************************************************************
   * Requests an unauthenticated Salesforce Messaging access token.
   * ********************************************************************************/
  async function requestAccessToken() {
    /**********************************************************************************
     * Contains the access-token HTTP response from Salesforce.
     * ********************************************************************************/
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

    /**********************************************************************************
     * Stores the parsed access-token response payload.
     * ********************************************************************************/
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Access token request failed (${response.status})`);
    }

    if (payload.lastEventId) {
      state.lastEventId = payload.lastEventId;
    }

    /**********************************************************************************
     * Holds the token value returned by Salesforce.
     * ********************************************************************************/
    const accessToken = payload.accessToken || payload.token;
    if (!accessToken) {
      throw new Error("Salesforce did not return an access token.");
    }

    return accessToken;
  }

  /**********************************************************************************
   * Creates the Salesforce Messaging conversation for the current session.
   * ********************************************************************************/
  async function createConversation() {
    /**********************************************************************************
     * Contains the conversation creation HTTP response.
     * ********************************************************************************/
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

    /**********************************************************************************
     * Stores the parsed conversation creation response payload.
     * ********************************************************************************/
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Conversation creation failed (${response.status})`);
    }
  }

  /**********************************************************************************
   * Sends a user text message to the active Salesforce conversation.
   * ********************************************************************************/
  async function sendMessage(text) {
    try {
      if (!state.connected) {
        await connect();
      }

      rememberOutboundText(text);
      /**********************************************************************************
       * Contains the message-send HTTP response from Salesforce.
       * ********************************************************************************/
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

      /**********************************************************************************
       * Stores the parsed message-send response payload.
       * ********************************************************************************/
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

  /**********************************************************************************
   * Opens the Salesforce server-sent event stream for incoming chat updates.
   * ********************************************************************************/
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

  /**********************************************************************************
   * Reads streamed server-sent events and forwards complete events for parsing.
   * ********************************************************************************/
  async function readEventStream(stream) {
    /**********************************************************************************
     * Reads byte chunks from the event stream.
     * ********************************************************************************/
    const reader = stream.getReader();
    /**********************************************************************************
     * Decodes streamed bytes into text.
     * ********************************************************************************/
    const decoder = new TextDecoder();
    /**********************************************************************************
     * Buffers partial event text between stream reads.
     * ********************************************************************************/
    let buffer = "";

    while (true) {
      /**********************************************************************************
       * Stores the latest stream read result.
       * ********************************************************************************/
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      /**********************************************************************************
       * Holds complete event blocks split from the buffer.
       * ********************************************************************************/
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      events.forEach(parseServerSentEvent);
    }
  }

  /**********************************************************************************
   * Parses one server-sent event block and routes JSON payloads.
   * ********************************************************************************/
  function parseServerSentEvent(rawEvent) {
    /**********************************************************************************
     * Accumulates fields from one server-sent event.
     * ********************************************************************************/
    const event = {};
    rawEvent.split(/\r?\n/).forEach(line => {
      /**********************************************************************************
       * Finds the field/value separator in an SSE line.
       * ********************************************************************************/
      const separator = line.indexOf(":");
      if (separator === -1) return;
      /**********************************************************************************
       * Stores the SSE field name.
       * ********************************************************************************/
      const key = line.slice(0, separator);
      /**********************************************************************************
       * Stores the SSE field value.
       * ********************************************************************************/
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
      handleSalesforceEvent(JSON.parse(event.data), event.data, event.id || "");
    } catch (error) {
      console.warn("Ignoring non-JSON Salesforce event", event.data, error);
    }
  }

  /**********************************************************************************
   * Handles Salesforce conversation events and renders agent messages.
   * ********************************************************************************/
  function handleSalesforceEvent(eventPayload, rawSseData = "", eventId = "") {
    /**********************************************************************************
     * References the Salesforce conversation entry in the event payload.
     * ********************************************************************************/
    const entry = eventPayload?.conversationEntry;
    /**********************************************************************************
     * Stores the Salesforce conversation entry type.
     * ********************************************************************************/
    const entryType = entry?.entryType;
    logRawAgentforceMessage(entry, rawSseData, eventId);
    /**********************************************************************************
     * Stores the parsed conversation entry payload.
     * ********************************************************************************/
    const entryPayload = parseEntryPayload(entry?.entryPayload);

    if (entryType === "SessionStatusChanged" && entryPayload?.sessionStatus) {
      setStatus(entryPayload.sessionStatus === "Active" ? "Connected to Lumina" : entryPayload.sessionStatus);
      return;
    }

    if (entryType === "ParticipantChanged" && hasChatbotParticipant(entryPayload)) {
      setStatus("Connected to Lumina");
      return;
    }

    if (entryType !== "Message") return;

    /**********************************************************************************
     * Identifies who sent the Salesforce message.
     * ********************************************************************************/
    const senderRole = entry?.sender?.role || entryPayload?.sender?.role;
    if (senderRole === "EndUser") return;

    /**********************************************************************************
     * Stores displayable text values extracted from the payload.
     * ********************************************************************************/
    console.log('payload', entryPayload);
    const texts = extractTextCandidates(entryPayload);
    texts.forEach(handleIncomingText);
  }

  /**********************************************************************************
   * Logs raw Agentforce message data before parsing, trimming, or side-channel filtering.
   * ********************************************************************************/
  function logRawAgentforceMessage(entry, rawSseData, eventId) {
    if (entry?.entryType !== "Message") return;
    if (entry?.sender?.role === "EndUser") return;

    console.groupCollapsed("[Lumina Agentforce RAW before parser]", {
      eventId,
      senderRole: entry?.sender?.role,
      senderDisplayName: entry?.senderDisplayName,
      identifier: entry?.identifier
    });
    console.log("Raw SSE data string:", rawSseData);
    console.log("Raw conversationEntry:", entry);
    console.log("Raw conversationEntry.entryPayload:", entry?.entryPayload);
    console.groupEnd();
  }

  /**********************************************************************************
   * Converts a Salesforce entry payload into an object when possible.
   * ********************************************************************************/
  function parseEntryPayload(entryPayload) {
    if (!entryPayload) return null;
    if (typeof entryPayload === "object") return entryPayload;
    try {
      return JSON.parse(entryPayload);
    } catch {
      return { text: String(entryPayload) };
    }
  }

  /**********************************************************************************
   * Detects whether a participant update includes the chatbot.
   * ********************************************************************************/
  function hasChatbotParticipant(entryPayload) {
    return Array.isArray(entryPayload?.entries) &&
      entryPayload.entries.some(entry => entry?.participant?.role === "Chatbot");
  }

  /**********************************************************************************
   * Recursively extracts likely display text from nested payload values.
   * ********************************************************************************/
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
      /**********************************************************************************
       * Lists payload keys that commonly contain display text.
       * ********************************************************************************/
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

  /**********************************************************************************
   * Checks whether a value is suitable to display as chat text.
   * ********************************************************************************/
  function looksLikeDisplayText(value) {
    /**********************************************************************************
     * Stores the normalized candidate text.
     * ********************************************************************************/
    const text = value.trim();
    if (!text) return false;
    if (text === state.conversationId) return false;
    return text.length < 4000;
  }

  /**********************************************************************************
   * Processes inbound agent text and forwards payloads or visible messages.
   * ********************************************************************************/
  function handleIncomingText(text) {
    console.log("[Lumina Agentforce raw text]", text);
    if (isOutboundEcho(text)) return;

    /**********************************************************************************
     * Splits mixed human text and Lumina side-channel lines.
     * ********************************************************************************/
    const parts = splitHumanAndPayloadLines(text);
    parts.forEach(part => {
      if (handlePayloadText(part)) return;
      /**********************************************************************************
       * Removes accidental storefront route text before rendering a visible chat bubble.
       * ********************************************************************************/
      // const visiblePart = stripStorefrontRouteText(part);
      const visiblePart = part;
      if (!visiblePart) return;
      renderMessage("agent", visiblePart);
      window.LuminaStorefront?.handleAgentText?.(visiblePart);
    });
  }

  /**********************************************************************************
   * Splits multi-line messages into human text and Lumina side-channel parts.
   * ********************************************************************************/
  function splitHumanAndPayloadLines(text) {
    /**********************************************************************************
     * Stores the normalized inbound text.
     * ********************************************************************************/
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];

    /**********************************************************************************
     * Stores non-empty trimmed message lines.
     * ********************************************************************************/
    const lines = trimmed.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return (tryParseJson(trimmed)?.luminaType || isLuminaRouteCommand(trimmed) || !isHiddenStorefrontLine(trimmed)) ? [trimmed] : [];
    }

    /**********************************************************************************
     * Collects ordered human text and payload parts.
     * ********************************************************************************/
    const parts = [];
    /**********************************************************************************
     * Buffers consecutive human-readable lines.
     * ********************************************************************************/
    let currentHuman = [];
    lines.forEach(line => {
      console.log('line', line)
      if (tryParseJson(line)?.luminaType || isLuminaRouteCommand(line)) {
        if (currentHuman.length) {
          parts.push(currentHuman.join("\n"));
          currentHuman = [];
        }
        parts.push(line);
      } else if (isHiddenStorefrontLine(line)) {
        if (currentHuman.length === 1 && /:\s*$/.test(currentHuman[0])) {
          currentHuman = [];
        }
      } else {
        currentHuman.push(line);
      }
    });
    if (currentHuman.length) parts.push(currentHuman.join("\n"));
    return parts;
  }

  /**********************************************************************************
   * Detects storefront-only route or legacy token lines that must not render in chat.
   * ********************************************************************************/
  function isHiddenStorefrontLine(line) {
    /**********************************************************************************
     * Stores the normalized line used for storefront side-channel checks.
     * ********************************************************************************/
    const value = String(line || "").trim();
    if (!value) return false;

    return /^#\/?product\/[A-Za-z0-9_-]+$/i.test(value) ||
      /^#\/?add-to-cart\/[A-Za-z0-9_-]+$/i.test(value) ||
      /^#\/?recommendation\/(?:\[[^\]]+\]|[A-Za-z0-9_,%/-]+)$/i.test(value) ||
      /^Storefront Route:\s*#\/?product\/[A-Za-z0-9_-]+$/i.test(value) ||
      /^View Product:\s*#\/?product\/[A-Za-z0-9_-]+$/i.test(value) ||
      isLuminaRouteCommand(value);
  }

  /**********************************************************************************
   * Removes inline storefront hash routes from otherwise human-readable chat text.
   * ********************************************************************************/
  function stripStorefrontRouteText(text) {
    /**********************************************************************************
     * Stores text after removing accidental storefront hash routes from visible output.
     * ********************************************************************************/
    const cleaned = String(text || "")
      .replace(/\s*#\/?product\/[A-Za-z0-9_-]+/gi, "")
      .replace(/\s*#\/?add-to-cart\/[A-Za-z0-9_-]+/gi, "")
      .replace(/\s*#\/?recommendation\/(?:\[[^\]]+\]|[A-Za-z0-9_,%/-]+)/gi, "")
      .replace(/[ \t]+\n/g, "\n")
      .trim();

    return cleaned;
  }

  /**********************************************************************************
   * Detects Lumina side-channel route commands emitted by Agentforce.
   * ********************************************************************************/
  function isLuminaRouteCommand(text) {
    return /^LUMINA_(NAVIGATE_PRODUCT|ADD_TO_CART|RECOMMENDATION)\|/i.test(String(text || "").trim());
  }

  /**********************************************************************************
   * Converts Lumina route commands into the storefront payload shape.
   * ********************************************************************************/
  function parseLuminaRouteCommand(text) {
    /**********************************************************************************
     * Stores the normalized command text before command parsing.
     * ********************************************************************************/
    const commandText = String(text || "").trim();
    if (!isLuminaRouteCommand(commandText)) return null;

    /**********************************************************************************
     * Splits the matcher from pipe-delimited key/value fields.
     * ********************************************************************************/
    const [matcher, ...fieldParts] = commandText.split("|");
    /**********************************************************************************
     * Stores parsed command fields such as route, productId, name, and checkout.
     * ********************************************************************************/
    const fields = fieldParts.reduce((result, field) => {
      const separator = field.indexOf("=");
      if (separator === -1) return result;
      const key = field.slice(0, separator).trim();
      const value = field.slice(separator + 1).trim();
      if (key) result[key] = value;
      return result;
    }, {});

    /**********************************************************************************
     * Stores the explicit product id or the product id inferred from the route.
     * ********************************************************************************/
    const productId = fields.productId || fields.productCode || extractProductIdFromRoute(fields.route);
    if (/^LUMINA_NAVIGATE_PRODUCT$/i.test(matcher) && productId) {
      return {
        luminaType: "navigationAction",
        action: "openProduct",
        productCode: productId,
        name: fields.name || "",
        route: fields.route || `#product/${productId}`
      };
    }

    if (/^LUMINA_ADD_TO_CART$/i.test(matcher) && productId) {
      return {
        luminaType: "cartAction",
        action: "addToCart",
        productCode: productId,
        name: fields.name || "",
        checkout: /^true$/i.test(fields.checkout || "")
      };
    }

    if (/^LUMINA_RECOMMENDATION$/i.test(matcher)) {
      /**********************************************************************************
       * Stores product ids from productIds or the recommendation hash route.
       * ********************************************************************************/
      const productCodes = parseRecommendationProductIds(fields.productIds || fields.productCodes || fields.route);
      if (!productCodes.length) return null;
      return {
        luminaType: "recommendationAction",
        productCodes
      };
    }

    return null;
  }

  /**********************************************************************************
   * Extracts a single product id from a Lumina product or add-to-cart hash route.
   * ********************************************************************************/
  function extractProductIdFromRoute(route) {
    const match = String(route || "").match(/^#\/?(?:product|add-to-cart)\/([^|]+)$/i);
    return match ? decodeURIComponent(match[1]).trim() : "";
  }

  /**********************************************************************************
   * Extracts recommendation product ids from a slash, comma, or bracketed route value.
   * ********************************************************************************/
  function parseRecommendationProductIds(value) {
    /**********************************************************************************
     * Stores the product-id list after removing the hash route prefix.
     * ********************************************************************************/
    const listText = String(value || "")
      .replace(/^#\/?recommendation\//i, "")
      .trim()
      .replace(/^\[/, "")
      .replace(/\]$/, "");

    return listText
      .split(/[\/,]+/)
      .map(productId => decodeURIComponent(productId).trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean)
      .slice(0, 3);
  }

  /**********************************************************************************
   * Parses and routes Lumina side-channel messages to the storefront.
   * ********************************************************************************/
  function handlePayloadText(text) {
    /**********************************************************************************
     * Converts API-like route commands to storefront payloads before JSON parsing.
     * ********************************************************************************/
    const routePayload = parseLuminaRouteCommand(text);
    if (routePayload) {
      const handled = window.LuminaStorefront?.handleAgentPayload?.(routePayload);
      if (handled) appendSystemMessage(routePayload.checkout ? "Cart updated for checkout." : "Storefront updated.");
      return true;
    }

    /**********************************************************************************
     * Stores the parsed Lumina payload when the text is JSON.
     * ********************************************************************************/
    const payload = tryParseJson(text);
    if (!payload?.luminaType) return false;

    /**********************************************************************************
     * Indicates whether the storefront accepted the payload.
     * ********************************************************************************/
    const handled = window.LuminaStorefront?.handleAgentPayload?.(payload);
    if (handled) {
      appendSystemMessage(payload.checkout ? "Cart updated for checkout." : "Storefront updated.");
    }
    return true;
  }

  /**********************************************************************************
   * Safely parses JSON text and returns null for invalid input.
   * ********************************************************************************/
  function tryParseJson(text) {
    try {
      return JSON.parse(String(text || "").trim());
    } catch {
      return null;
    }
  }

  /**********************************************************************************
   * Builds standard Salesforce Messaging API request headers.
   * ********************************************************************************/
  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.accessToken}`,
      "X-Org-Id": CONFIG.orgId
    };
  }

  /**********************************************************************************
   * Remembers recent outbound messages to suppress echoed responses.
   * ********************************************************************************/
  function rememberOutboundText(text) {
    state.outboundTexts.push(String(text || "").trim());
    state.outboundTexts = state.outboundTexts.slice(-8);
  }

  /**********************************************************************************
   * Checks and removes a matching outbound echo from recent messages.
   * ********************************************************************************/
  function isOutboundEcho(text) {
    /**********************************************************************************
     * Stores the normalized inbound text for echo matching.
     * ********************************************************************************/
    const normalized = String(text || "").trim();
    /**********************************************************************************
     * Finds the matching outbound text index.
     * ********************************************************************************/
    const index = state.outboundTexts.indexOf(normalized);
    if (index === -1) return false;
    state.outboundTexts.splice(index, 1);
    return true;
  }

  /**********************************************************************************
   * Reads a response body as JSON, falling back to a message object.
   * ********************************************************************************/
  async function readJsonResponse(response) {
    /**********************************************************************************
     * Stores the raw response body text.
     * ********************************************************************************/
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  /**********************************************************************************
   * Renders a user or agent message in the chat log.
   * ********************************************************************************/
  function renderMessage(author, text) {
    /**********************************************************************************
     * References the chat message log container.
     * ********************************************************************************/
    const messages = document.getElementById(selectors.messages);
    if (!messages) return;

    /**********************************************************************************
     * Represents one rendered chat message row.
     * ********************************************************************************/
    const row = document.createElement("div");
    row.className = `lumina-chat__message lumina-chat__message--${author}`;
    row.innerHTML = formatChatText(text);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  /**********************************************************************************
   * Escapes and formats chat text for safe HTML rendering.
   * ********************************************************************************/
  function formatChatText(text) {
    return escapeHtml(String(text || ""))
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\r?\n/g, "<br>");
  }

  /**********************************************************************************
   * Escapes text content by using the browser DOM encoder.
   * ********************************************************************************/
  function escapeHtml(value) {
    /**********************************************************************************
     * Temporarily holds text so the browser can encode HTML characters.
     * ********************************************************************************/
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  /**********************************************************************************
   * Appends a system status message to the chat log.
   * ********************************************************************************/
  function appendSystemMessage(text) {
    /**********************************************************************************
     * References the chat message log container.
     * ********************************************************************************/
    const messages = document.getElementById(selectors.messages);
    if (!messages) return;

    /**********************************************************************************
     * Represents one rendered system message row.
     * ********************************************************************************/
    const row = document.createElement("div");
    row.className = "lumina-chat__system";
    row.textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  /**********************************************************************************
   * Updates the visible chat connection status text.
   * ********************************************************************************/
  function setStatus(text) {
    /**********************************************************************************
     * References the status text element in the chat header.
     * ********************************************************************************/
    const status = document.getElementById(selectors.status);
    if (status) status.textContent = text;
  }
})();
