# Travel expense assistant

**English** · [简体中文](README.zh-CN.md)

Fill, review, and submit a claim in chat, then reconcile uncertain results.


**Chat UI: host-rendered declarative form (YAML).** The extension declares fields, steps and submission behavior; the host renders the chat controls. This chat form is not an iframe page. The independent extension home provides guidance or queries, not the chat form renderer.

[Compare both approaches and screenshots](../docs/chat-ui-rendering.md).

## Run

Requires Node.js ≥22.13 and an Ambleloft host with extension support. SDK/CLI are installed from npm, pinned to `0.1.0-alpha.7`; no adjacent source repository is needed.

```sh
cd expense-workflow
npm ci
npm run build
npm run validate
npm test
npm run pack
```

In host **Settings → Extensions → Install**, choose `dist/expense-workflow.amble-extension`, trust it, grant the declared permissions, and open its home where available. Extension ID: `samples.expense-workflow`.

## Walkthrough

Run `npm run service`. In extension settings set `serviceUrl=http://127.0.0.1:47832`. In chat ask the travel expense assistant to claim CNY 1,280 for a Shanghai visit. Fill the three steps, confirm, then inspect the returned claim ID. The home page checks service health and lists records.

## Screenshots and verification

Home screenshots show an independent extension page; chat fields and steps show a host-rendered YAML form.

Captured from the real Ambleloft desktop on macOS with an isolated profile, fictional data, local demo services, and a deterministic fixture model. Extension page images come from actual isolated WebContents; forms and messages come from the host window. These are not design mockups or browser mocks.

![Extension home running in the real host.](screenshots/01-home.png)

Extension home running in the real host.

![Step 1: review destination and date, then confirm saving the business draft.](screenshots/02-itinerary.png)

Step 1: review destination and date, then confirm saving the business draft.

![Step 2: enter CNY 1,280.00 and explain the costs.](screenshots/03-expenses.png)

Step 2: enter CNY 1,280.00 and explain the costs.

![Step 3: explicitly review and submit.](screenshots/04-confirmation.png)

Step 3: explicitly review and submit.

![Successful submission: the original form displays the demo service result.](screenshots/05-completed.png)

Successful submission: the original form displays the demo service result.

![Intentionally dropped response: the form remains unknown and never automatically resubmits.](screenshots/05-unknown.png)

Intentionally dropped response: the form remains unknown and never automatically resubmits.

![The home queries recent claims from the demo service.](screenshots/06-records.png)

The home queries recent claims from the demo service.

![Reconciliation changes the status to submitted; ledger assertions confirm one claim. The host still displays the stale error; see known gaps.](screenshots/06-recovered.png)

Reconciliation changes the status to submitted; ledger assertions confirm one claim. The host still displays the stale error; see known gaps.

![Dark English view after a host language change; see compatibility for the initial-locale limitation.](screenshots/07-english-dark.png)

Dark English view after a host language change; see compatibility for the initial-locale limitation.

[Full verification and remaining gaps](../docs/verification.md). The sample remains preview; screenshots do not imply all platforms and failure modes have passed.

## Permissions and implementation

`configuration`

Project permissions are scoped to the user-selected project; storage/configuration/secrets are extension-local. Declaration is not a grant. The Node backend uses the public SDK; the independent extension home uses the webview bridge. The host interprets and renders the YAML form in chat.

| Operation | Handler | Effect | Caller |
| --- | --- | --- | --- |
| `samples.expense-workflow.saveDraft` | `saveDraft` | write | page |
| `samples.expense-workflow.lookupDraft` | `lookupDraft` | read | page |
| `samples.expense-workflow.submitExpense` | `submitExpense` | write | page |
| `samples.expense-workflow.lookupExpense` | `lookupExpense` | read | page |
| `samples.expense-workflow.status` | `status` | read | page, agent |
| `samples.expense-workflow.records` | `records` | read | page, agent |

## Errors, limits, and cleanup

Cancelling confirmation prevents dispatch. Cancelling waiting is not rollback; reconcile unknown results before any new write. Refused permissions must fail; new permissions require a new user grant.

These are alpha previews. Form YAML and some demo controls are Chinese; bilingual docs do not imply automatic form localization. Enterprise authentication needs a deployed IdP. Messages are local; remind is not an OS delivery receipt.

Disable/uninstall in extension settings and choose whether to retain data. Stop standalone services with Ctrl+C. Delete only your own demo SQLite files after stopping the service; never remove a real user profile.

## Drop-after-write recovery

Before final submission, run the following command. The service persists the claim and drops its response. Use Check submission result in the original form: the same claim ID must return and the ledger must show exactly one new claim.

```sh
curl http://127.0.0.1:47832/control -H 'content-type: application/json' -d '{"operation":"submitExpense","mode":"drop"}'
curl http://127.0.0.1:47832/ledger
# Restore normal service behavior / 恢复正常模式
curl http://127.0.0.1:47832/control -H 'content-type: application/json' -d '{"operation":"submitExpense","mode":"normal"}'
```

This delivery targets F0/F1: three-step forms, service health, read-only records, and recovery. Expense progress notifications/actions and enterprise service adaptation are not integrated into this sample yet; see the separate capability samples. No attachments, OCR, dynamic fields, payment, or automatic approval.

Known host limitations / 宿主已知限制：[docs/gaps.md](../docs/gaps.md)。
