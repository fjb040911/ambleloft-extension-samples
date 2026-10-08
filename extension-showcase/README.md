# Extension showcase

**English** · [简体中文](README.zh-CN.md)

Explore projects, forms, messages, business actions, and enterprise connections.

## Run

Requires Node.js ≥22.13 and an Ambleloft host with extension support. SDK/CLI are installed from npm, pinned to `0.1.0-alpha.7`; no adjacent source repository is needed.

```sh
cd extension-showcase
npm ci
npm run build
npm run validate
npm test
npm run pack
```

In host **Settings → Extensions → Install**, choose `dist/extension-showcase.amble-extension`, trust it, grant the declared permissions, and open its home where available. Extension ID: `samples.extension-showcase`.

## Walkthrough

Follow the labeled controls on the extension home using fictional sample data. The result area shows the actual operation response.

See the [detailed service walkthrough (Chinese)](GUIDE.zh-CN.md). Services are optional and separately started; basic project/task features do not require an enterprise account.

## Screenshots and verification

Captured from the real Ambleloft desktop on macOS with an isolated profile, fictional data, local demo services, and a deterministic fixture model. Extension page images come from actual isolated WebContents; forms and messages come from the host window. These are not design mockups or browser mocks.

![Extension home running in the real host.](screenshots/01-home.png)

Extension home running in the real host.

[Full verification and remaining gaps](../docs/verification.md). The sample remains preview; screenshots do not imply all platforms and failure modes have passed.

## Permissions and implementation

`projects.read, projects.path.read, conversations.create, conversations.open, storage, configuration, secrets`

Project permissions are scoped to the user-selected project; storage/configuration/secrets are extension-local. Declaration is not a grant. Node uses the public SDK; pages use the host bridge. MCP Apps has a separate task UI protocol.

| Operation | Handler | Effect | Caller |
| --- | --- | --- | --- |
| `samples.extension-showcase.status` | `status` | read | page |
| `samples.extension-showcase.addTask` | `addTask` | write | page, agent |
| `samples.extension-showcase.removeTask` | `removeTask` | write | page |
| `samples.extension-showcase.createChat` | `createChat` | write | page |
| `samples.extension-showcase.openChat` | `openChat` | read | page |
| `samples.extension-showcase.unlinkChat` | `unlinkChat` | write | page |
| `samples.extension-showcase.acknowledgeUnknown` | `acknowledgeUnknown` | write | page |
| `samples.extension-showcase.summary` | `summary` | read | page, agent |
| `samples.extension-showcase.projectPath` | `projectPath` | read | page, agent |
| `samples.extension-showcase.publish` | `publish` | write | page |
| `samples.extension-showcase.query` | `query` | read | page |
| `samples.extension-showcase.update` | `update` | write | page |
| `samples.extension-showcase.withdraw` | `withdraw` | write | page |
| `samples.extension-showcase.preferences` | `preferences` | read | page |
| `samples.extension-showcase.connection` | `connection` | write | page |
| `samples.extension-showcase.secretStatus` | `secretStatus` | read | page |
| `samples.extension-showcase.secretDelete` | `secretDelete` | write | page |
| `samples.extension-showcase.kvCheck` | `kvCheck` | write | page |
| `samples.extension-showcase.saveDraft` | `saveDraft` | write | page |
| `samples.extension-showcase.lookupDraft` | `lookupDraft` | read | page |
| `samples.extension-showcase.submitExpense` | `submitExpense` | write | page |
| `samples.extension-showcase.lookupExpense` | `lookupExpense` | read | page |
| `samples.extension-showcase.cardRender` | `cardRender` | read | agent |
| `samples.extension-showcase.cardSave` | `cardSave` | write | page |
| `samples.extension-showcase.actionPublish` | `actionPublish` | write | page |
| `samples.extension-showcase.actionRun` | `actionRun` | write | page |
| `samples.extension-showcase.actionRecords` | `actionRecords` | read | page |
| `samples.extension-showcase.actionReconcile` | `actionReconcile` | write | page |
| `samples.extension-showcase.authStatus` | `authStatus` | read | page |
| `samples.extension-showcase.authConnect` | `authConnect` | read | page |
| `samples.extension-showcase.authDisconnect` | `authDisconnect` | write | page |
| `samples.extension-showcase.authRequest` | `authRequest` | read | page |

## Errors, limits, and cleanup

Cancelling confirmation prevents dispatch. Cancelling waiting is not rollback; reconcile unknown results before any new write. Refused permissions must fail; new permissions require a new user grant.

These are alpha previews. Form YAML and some demo controls are Chinese; bilingual docs do not imply automatic form localization. Enterprise authentication needs a deployed IdP. Messages are local; remind is not an OS delivery receipt.

Disable/uninstall in extension settings and choose whether to retain data. Stop standalone services with Ctrl+C. Delete only your own demo SQLite files after stopping the service; never remove a real user profile.
