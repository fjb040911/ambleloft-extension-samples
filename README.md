# Ambleloft Extension Samples

**English** · [简体中文](README.zh-CN.md)

**Bring your application into chat so users can fill forms, confirm decisions, and act on business data.**

Build chat interactions with host-rendered forms or custom pages. Connect their actions to your services and keep users informed through task messages. These **23 runnable preview samples** take you from a first operation to business submissions, event subscriptions, and enterprise service connections.

[Run your first sample](#run-your-first-sample) · [Browse by capability](#browse-by-capability) · [Try the expense workflow](expense-workflow/README.md)

![Expense entry in chat, with fields and steps rendered by the host](expense-workflow/screenshots/03-expenses.png)

*Real Ambleloft desktop capture using fictional data, a local demo service, and a deterministic model fixture.*

## Make chat an entry point to your application

After describing a task, users can enter information, adjust parameters, review results, and confirm a submission within the conversation. You supply form declarations or page code, then connect those interactions to your application through extension handlers.

| What users need to do | How an extension supports it | Start here |
| --- | --- | --- |
| Fill out and submit a business form | Host renders YAML fields and steps, then invokes the declared operation after confirmation | [Information intake](declarative-intake/README.md), [expense workflow](expense-workflow/README.md) |
| Use a custom interface in chat | Extension supplies HTML/CSS/JS inside a host iframe | [Travel card](mcp-apps-card/README.md) |
| Read or update application data | Operations connect to backend services with declared schemas, permissions, and read/write effects | [First operation](hello-operation/README.md), [enterprise connection](enterprise-auth/README.md) |
| Receive task updates and act on them | Extension subscribes to service events and publishes or updates messages with business actions | [Event subscriptions](service-events/README.md), [message actions](message-actions/README.md) |

You could connect support ticket changes, approval requests, build results, or order updates to the message center. Users could then inspect or act on those updates. These are application ideas to build from the samples; the current examples use a local task service, and your application supplies the business rules.

**Subscription scope:** `service-events` subscribes to SSE task events from your own service. Ambleloft conversation lifecycle events and turn reads are not yet public; those samples remain planned.

## Choose how to render UI in chat

| | Host-rendered form | Extension page in a chat iframe |
| --- | --- | --- |
| You author | YAML fields, steps, and submission mappings | HTML, CSS, and JavaScript |
| Controls are rendered by | Host form components | Your extension page |
| Best fit | Data collection, multi-step entry, confirmed submission | Custom layouts, controls, and interaction logic |
| Samples | `declarative-intake`, `expense-workflow` | `mcp-apps-card` |

The agent calls tools to trigger display. An independent extension home uses the SDK webview bridge; a chat iframe uses the MCP Apps UI protocol. Follow the matching sample for initialization and calls. See the [comparison with flows and screenshots](docs/chat-ui-rendering.md).

## Run your first sample

Install **Node.js ≥22.13.0**, npm, and an Ambleloft desktop with extension support. Samples pin the published npm SDK/CLI to `0.1.0-alpha.7`. Each sample has its own dependencies and lockfile.

```sh
git clone https://github.com/fjb040911/ambleloft-extension-samples.git
cd ambleloft-extension-samples/hello-operation
npm ci
npm run build
npm run validate
npm test
npm run pack
npm run validate:archive
```

In Ambleloft, open **Settings → Extensions → Install** and select `dist/hello-operation.amble-extension`. Trust the extension and grant any requested permissions. Open its Text statistics home, enter text, and run the operation.

Next, try `declarative-intake` or `mcp-apps-card` to explore each chat UI approach. Samples with services document their startup commands, settings, and conversation prompts in their own README.

## Develop your own extension

1. **Choose the business task and interaction.** Identify what users should read, enter, or submit. Pick the closest sample from the directory below.
2. **Declare the extension and operations.** In `extension.json`, define identity, entry points, permissions, and operations with input/output schemas, callers, and read/write effects.
3. **Connect your service.** Implement backend handlers against your API. Add settings, secrets, or enterprise authentication as needed. Your service owns persistence, idempotency, and result lookup.
4. **Build the interaction.** Reference YAML forms from a Skill, associate a custom chat page with an MCP Apps resource, or use the SDK webview bridge for an independent home. Add event subscriptions and message actions when users need ongoing updates.
5. **Build, install, and verify.** Run build, validate, test, pack, and validate:archive. Install in the host and check authorization, confirmation, cancellation, and recovery. Rebuild and reinstall after changes.

To create a new project from the official template, run this in a separate directory:

```sh
npm create ambleloft-extension@0.1.0-alpha.7 my-expense -- --template expense
```

When copying a sample, update its extension ID, operation IDs, and references in forms or pages together. Before sharing, add instructions, permission details, and real screenshots using the [contribution guide](CONTRIBUTING.md).

## Flagship sample: travel expense workflow

[expense-workflow](expense-workflow/README.md) connects a chat interaction to a business service. Users enter travel details and costs, review them, and submit a claim. An extension home displays service status and saved claims. If the response is lost after a successful write, users can reconcile the original submission to avoid creating another claim.

Follow the complete path from **host multi-step form → backend operation → service persistence → result lookup and recovery**. The current F0/F1 implementation uses a local demo service. Progress-message integration and an enterprise finance adapter remain later milestones; explore their building blocks in `message-actions` and `enterprise-auth`.

## Browse by capability

All 23 samples below are `preview`. Each directory links to setup instructions, permissions, implementation notes, and real screenshots.

### Forms and interactive pages in chat

| Directory | What you can try | Capabilities |
| --- | --- | --- |
| [`declarative-intake`](declarative-intake/README.md) | Collect team information | Host form · YAML · seven field types · confirmed chat submission |
| [`mcp-apps-card`](mcp-apps-card/README.md) | Edit a travel card in chat | Chat iframe · HTML/CSS/JS · MCP Apps · confirmed save |
| [`expense-workflow`](expense-workflow/README.md) | Flagship: travel expense workflow | Host multi-step form · business service · idempotent submission · records |
| [`submission-recovery`](submission-recovery/README.md) | Reconcile an uncertain submission | Host form · lost response after write · unknown state · read-only reconciliation |

### Event subscriptions and message actions

| Directory | What you can try | Capabilities |
| --- | --- | --- |
| [`service-events`](service-events/README.md) | Subscribe to business task events | SSE subscription · message delivery · version deduplication · ordering |
| [`local-messages`](local-messages/README.md) | Manage local business messages | Publish · query · update · withdraw |
| [`message-actions`](message-actions/README.md) | Act on a business message | Message buttons · user confirmation · backend writes · reconciliation |

### Connect your application and data

| Directory | What you can try | Capabilities |
| --- | --- | --- |
| [`hello-operation`](hello-operation/README.md) | Build your first operation | Operation shared by agent and page · input/output schemas |
| [`npm-data-transform`](npm-data-transform/README.md) | Transform CSV data | Bundled npm dependency · structured parsing · operation results |
| [`enterprise-auth`](enterprise-auth/README.md) | Connect an enterprise service | Host-managed account sessions · declared HTTPS resources · authenticated requests |
| [`configuration`](configuration/README.md) | Read extension settings | Configuration declarations · settings UI · backend reads |
| [`secret-input`](secret-input/README.md) | Enter a secret securely | Host secret input · extension secrets · presence check |
| [`storage-notebook`](storage-notebook/README.md) | Store a local note | Extension storage · revisions · CAS conflict protection |
| [`operation-confirmation`](operation-confirmation/README.md) | Confirm business writes | Read/write effects · confirmation before create and delete |
| [`cancellation-and-errors`](cancellation-and-errors/README.md) | Handle cancellation and errors | Cancel a read · timeout/error display · write boundaries |

### Extension pages, projects and chat entry points

| Directory | What you can try | Capabilities |
| --- | --- | --- |
| [`extension-home`](extension-home/README.md) | Build an extension home | Independent page · SDK webview bridge · backend invocation |
| [`theme-and-i18n`](theme-and-i18n/README.md) | Follow host theme and language | Host context · light/dark themes · locale change events |
| [`extension-icons`](extension-icons/README.md) | Package extension icons | Packaged icons · light/dark assets · host entry points |
| [`project-card`](project-card/README.md) | Show a project card | Project selection and grants · metadata · separate path permission |
| [`contextual-entry`](contextual-entry/README.md) | Show contextual entry points | Context keys · conditional entries · link and unlink |
| [`conversation-launcher`](conversation-launcher/README.md) | Create and continue a conversation | Project scope · conversation drafts · open an existing chat |

### Combined examples

| Directory | What you can try | Capabilities |
| --- | --- | --- |
| [`team-workbench`](team-workbench/README.md) | Team workbench | Project linking · business tasks · related conversations |
| [`extension-showcase`](extension-showcase/README.md) | Extension showcase | Projects · forms · messages · operations · enterprise connections |

### Planned conversation event capabilities

| Directory | Intended behavior | Status |
| --- | --- | --- |
| [`conversation-events`](conversation-events/README.md) | Subscribe to conversation lifecycle events and read turn progress | Awaiting public APIs; not runnable |
| [`conversation-business-sync`](conversation-business-sync/README.md) | Sync conversation outcomes to business systems | Awaiting conversation events and turn reads; not runnable |

## Verification and compatibility

The 2026-10-08 baseline records build and archive checks for 23 samples, 30 automated tests, real host installations, and 50 desktop screenshots. Samples remain previews; see the [verification report](docs/verification.md) for interaction coverage.

Enterprise authentication requires a real IdP configuration. Windows/Linux desktop flows have not been verified. Initial page locale and stale errors after expense reconciliation have known host limitations; see [known gaps](docs/gaps.md).

To maintain all runnable samples:

```sh
npm ci
npm run setup
npm run build
npm run validate
npm run pack
npm run validate:archives
npm test
```

[Requirements](docs/requirements.md) · [Compatibility](docs/compatibility.md) · [Machine-readable catalog](catalog.json) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [License](LICENSE)
