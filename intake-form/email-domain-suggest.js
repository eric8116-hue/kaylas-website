// Complete common email domains while keeping the browser's saved-email autofill.
// This changes only the field value after the visitor picks a suggestion.
(() => {
  const domains = [
    ["Gmail", "gmail.com"],
    ["Yahoo", "yahoo.com"],
    ["Outlook", "outlook.com"],
    ["iCloud", "icloud.com"],
    ["Hotmail", "hotmail.com"],
    ["AOL", "aol.com"],
    ["Proton Mail", "proton.me"],
  ];
  const selector = 'input[type="email"], input[id="c_email"]';
  let nextId = 0;

  function attach(input) {
    if (input.dataset.emailDomainSuggest === "ready") return;
    input.dataset.emailDomainSuggest = "ready";
    const host = document.createElement("span");
    host.className = "email-domain-field";
    input.before(host);
    host.append(input);
    const list = document.createElement("span");
    list.className = "email-domain-list";
    list.id = `email-domain-list-${++nextId}`;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Suggested email domains");
    list.hidden = true;
    host.append(list);
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    let matches = [];
    let active = -1;

    function close() {
      list.hidden = true;
      list.replaceChildren();
      matches = [];
      active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function choose(index) {
      const match = matches[index];
      const at = input.value.indexOf("@");
      if (!match || at < 1) return;
      input.value = input.value.slice(0, at).trim() + "@" + match[1];
      close();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch { /* email inputs do not expose selection ranges */ }
    }

    function highlight(index) {
      active = index;
      [...list.children].forEach((button, i) => {
        button.classList.toggle("active", i === index);
        button.setAttribute("aria-selected", String(i === index));
      });
      if (index < 0) input.removeAttribute("aria-activedescendant");
      else input.setAttribute("aria-activedescendant", `${list.id}-option-${index}`);
    }

    function update() {
      const value = input.value;
      const at = value.indexOf("@");
      if (at < 1 || value.indexOf("@", at + 1) !== -1 || (input.selectionStart !== null && input.selectionStart !== value.length)) {
        close();
        return;
      }
      const typed = value.slice(at + 1).trim().toLowerCase();
      if (!/^[a-z0-9.-]*$/.test(typed) || domains.some(([, domain]) => domain === typed)) {
        close();
        return;
      }
      matches = domains.filter(([, domain]) => domain.startsWith(typed)).slice(0, 5);
      if (!matches.length) { close(); return; }
      active = -1;
      list.replaceChildren(...matches.map(([name, domain], index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "email-domain-option";
        button.id = `${list.id}-option-${index}`;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");
        const brand = document.createElement("strong");
        brand.textContent = name;
        const suffix = document.createElement("span");
        suffix.textContent = `@${domain}`;
        button.append(brand, suffix);
        button.addEventListener("pointerdown", event => { event.preventDefault(); choose(index); });
        button.addEventListener("click", () => choose(index));
        return button;
      }));
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", update);
    input.addEventListener("focus", update);
    input.addEventListener("keydown", event => {
      if (list.hidden) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        highlight((active + (event.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
      } else if (event.key === "Enter" && active >= 0) {
        event.preventDefault();
        choose(active);
      } else if (event.key === "Escape") {
        close();
      }
    });
    input.addEventListener("blur", () => setTimeout(close, 120));
  }

  function scan() { document.querySelectorAll(selector).forEach(attach); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, { once: true });
  else scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
