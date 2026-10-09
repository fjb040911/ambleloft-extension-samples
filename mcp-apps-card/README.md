# In-chat travel card

**English** · [简体中文](README.zh-CN.md)

Edit a travel card in chat and save a local record after confirmation.


**Chat UI: extension-authored HTML embedded in a host iframe (MCP Apps).** `form.html` implements the UI. The agent calls render to trigger display; the page requests saving through the MCP Apps protocol. This is not a host-rendered YAML form and has no independent extension home.

[Compare both approaches and screenshots](../docs/chat-ui-rendering.md).

## Run

Requires Node.js ≥22.13 and an Ambleloft host with extension support. SDK/CLI are installed from npm, pinned to `0.1.0-alpha.7`; no adjacent source repository is needed.

```sh
cd mcp-apps-card
npm ci
npm run build
npm run validate
npm test
npm run pack
```

In host **Settings → Extensions → Install**, choose `dist/mcp-apps-card.amble-extension`, trust it, grant the declared permissions, then open the card in chat using the prompt below. Extension ID: `samples.mcp-apps-card`.

## Walkthrough

Grant storage. Ask the agent to render a travel card for Shanghai and CNY 1,200. Open the card, edit the fields, save, and confirm through the host.

## Screenshots and verification

Captured from the real Ambleloft desktop on macOS with an isolated profile, fictional data, local demo services, and a deterministic fixture model. Extension page images come from actual isolated WebContents; forms and messages come from the host window. These are not design mockups or browser mocks.

![Extension-authored travel card rendered in a host iframe.](screenshots/01-card.png)

Extension-authored travel card rendered in a host iframe.

![A local record saved after user confirmation.](screenshots/02-saved.png)

A local record saved after user confirmation.

[Full verification and remaining gaps](../docs/verification.md). The sample remains preview; screenshots do not imply all platforms and failure modes have passed.

## Permissions and implementation

`storage`

Project permissions are scoped to the user-selected project; storage/configuration/secrets are extension-local. Declaration is not a grant. The Node backend uses the public SDK. The chat iframe requests operations through the MCP Apps UI protocol, not the independent extension-home webview bridge.

| Operation | Handler | Effect | Caller |
| --- | --- | --- | --- |
| `samples.mcp-apps-card.render` | `render` | read | agent |
| `samples.mcp-apps-card.save` | `save` | write | page |

## Errors, limits, and cleanup

Cancelling confirmation prevents dispatch. Cancelling waiting is not rollback; reconcile unknown results before any new write. Refused permissions must fail; new permissions require a new user grant.

These are alpha previews. Form YAML and some demo controls are Chinese; bilingual docs do not imply automatic form localization. Enterprise authentication needs a deployed IdP. Messages are local; remind is not an OS delivery receipt.

Disable/uninstall in extension settings and choose whether to retain data. Stop standalone services with Ctrl+C. Delete only your own demo SQLite files after stopping the service; never remove a real user profile.
