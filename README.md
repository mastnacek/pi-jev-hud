# pi-jev-hud ⚖️

> Top-right floating non-blocking HUD monitor & modal for **TypeSafe Jev** classifier decisions and LLM queries in [Pi coding agent](https://pi.dev).

---

## 🌟 Features

- 🪟 **Top-Right Non-Blocking Monitoring HUD (`anchor: "top-right"`):** Displays live decision analysis, statistical probabilities, risk evaluations, and latency in the top-right corner of the terminal screen. Runs **non-blockingly** in the background without halting or delaying the agent's work.
- ⚖️ **JEV System One Integration:** Deep support for `openrouter/typesafe/jev-1.13` and `typesafe/jev-latest`.
- 📊 **Visual Probabilities & Confidence:** Renders visual progress bars (`████████░░ 85%`) with color-coded safety badges (`✅ SAFE`, `⚠️ MODERATE`, `🚨 CRITICAL`).
- 📡 **LLM Query Monitor:** Intercepts outgoing chat model requests and displays provider, latency, and prompt snippets.
- ⌨️ **Interactive Controls:** Switch tabs with `Tab`, run live test evaluations with `T`, toggle auto-popup with `A`, close with `Esc`/`Q`.
- 🌐 **Multilingual:** Full Czech (`cs`) and English (`en`) support.

---

## 🚀 Installation

Install directly into Pi from GitHub:

```bash
pi install git:github.com/mastnacek/pi-jev-hud
```

Or add to your `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "git:github.com/mastnacek/pi-jev-hud"
  ]
}
```

---

## 💻 Slash Commands

| Command | Description |
|---|---|
| `/jev-hud show` | Open the top-right HUD modal window |
| `/jev-hud test` | Run a live test decision via OpenRouter |
| `/jev-hud auto on\|off` | Toggle automatic monitoring HUD on Jev decisions |
| `/jev-hud query on\|off` | Toggle automatic monitoring HUD on LLM chat queries |
| `/jev-hud history` | View recent decisions summary |
| `/jev-hud lang en\|cs` | Switch UI language |

---

## 🛠️ Tool: `jev_decide`

The plugin provides a dedicated `jev_decide` tool for evaluating structured state questions and updating the top-right HUD:

```typescript
// Example tool call
await tools.jev_decide({
  state: {
    command: "git push --force origin main",
    branch: "main"
  },
  questions: {
    isDangerous: {
      type: "bool",
      instructions: "Is this operation destructive?",
      criteria: { true: "Destructive", false: "Safe" }
    }
  }
});
```

---

## 📄 License

MIT © [mastnacek](https://github.com/mastnacek)
