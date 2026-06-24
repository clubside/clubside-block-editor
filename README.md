# **clubside-block-editor (CSBE)**

A lightweight, browser‑native, ESM‑only block editor designed for clarity, predictability, and long‑term document stability.
CSBE uses a simple JSON document format with a versioned schema and a MIME type (`application/csbe`) to support future interchange and export modules.

This is **v0.1.0**, the first public release.

---

## **Features (v0.1.0)**

- Paragraph, heading, and image blocks
- Deterministic block splitting and merging
- Clean HTML paste handling
- Plain‑text paste handling
- Versioned document wrapper
- Schema identifier for future migrations
- Fully browser‑native — no build step required
- Comprehensive Playwright test suite
- Historical demo under `/tests/0.1.0/index.html`

---

## **Running the Demo**

Because CSBE uses ESM modules, it **cannot** be loaded from `file://`.

Use any static server. Two easy options:

### **Option 1 — Live Server (VS Code)**

Open the workspace and Live Server will use the configured root and port.

### **Option 2 — Node server included in the repo**

```bash
node server.js
```

Then open:

```text
http://localhost:5173/tests/0.1.0/index.html
```

This page serves as both:

- the **public demo**, and
- the **historical reference** for v0.1.0 behavior.

---

## **Running Tests**

CSBE uses Playwright for browser‑based testing.

### **1. Install dependencies**

```bash
npm install
```

### **2. Install Playwright browsers**

```bash
npx playwright install
```

### **3. Run the test suite**

```bash
npm test
```

This automatically:

- starts a local static server on port 5173
- runs all Playwright tests in headless Chromium
- shuts down the server when finished

---

## **Document Format**

CSBE documents use a stable wrapper:

```json
{
  "type": "application/csbe",
  "version": "0.1.0",
  "schema": "csbe-blocks-0.1",
  "blocks": [ ... ]
}
```

Each block is stored as:

```json
{
  "type": "paragraph",
  "version": "0.1.0",
  "meta": { "author": "Chris Rowley", "description": "Simple paragraph" },
  "content": "Text content…",
  "settings": { "align": "inherit", "uuid": "…" }
}
```

This structure is intentionally minimal and forward‑compatible.

---

## **Why Copilot Is Disabled in This Workspace**

The `.code-workspace` file explicitly disables GitHub Copilot for this project.

CSBE’s core must remain:

- deterministic
- hand‑written
- predictable
- free of AI‑generated code

This ensures long‑term maintainability and avoids subtle behavioral drift.

---

## **Roadmap**

### **v0.2.x**

- Inline formatting (bold, italic)
- Block‑level property UI
- Improved paste transforms
- Selection persistence (optional)

### **v0.3.x**

- Full inline engine
- Links
- Rich HTML paste
- Image resizing

### **v1.0.0**

- Stable API
- Export modules (HTML, Markdown, Word)
- WordPress REST import/export
- Plugin architecture
- Document metadata
- Schema migrations

---

## **License**

MIT
