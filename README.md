# Ambleloft Extension Samples

**English** · [简体中文](README.zh-CN.md)

Independent examples for operations, project conversations, forms, notifications, and enterprise services. **Flagship: [Travel Expense Assistant](expense-workflow/README.md)**, with three-step claims, records, and drop-after-write recovery.

![Expense form inside the real host](expense-workflow/screenshots/03-expenses.png)

*Real Ambleloft desktop with a local demo service and fixture model; fictional data only.*

## Start

SDK/CLI `0.1.0-alpha.7` are published on npm. Use Node ≥22.13. Inside any sample run `npm ci`, `npm run build`, `npm run validate`, `npm test`, and `npm run pack`. Every runnable directory has its own lockfile and no adjacent-repository dependency.

To start a new project from the official template:

```sh
npm create ambleloft-extension@0.1.0-alpha.7 my-expense -- --template expense
```

The official template is a starting point; this repository adds a records home and independent verification.

## Catalog

| Sample | Purpose | Status |
| --- | --- | --- |
| [Text statistics](hello-operation/README.md) | Call the same text statistics operation from a page or the agent. | preview |
| [CSV to JSON](npm-data-transform/README.md) | Parse pasted CSV using a bundled npm dependency. | preview |
| [Project card](project-card/README.md) | Choose a project to read its details. Directory access requires a separate grant. | preview |
| [Extension home](extension-home/README.md) | Read business records through the extension page bridge. | preview |
| [Theme and language](theme-and-i18n/README.md) | Switch the host language and theme to update this page. | preview |
| [Extension icons](extension-icons/README.md) | Inspect packaged light and dark icons in the host sidebar and extension details. | preview |
| [Local notebook](storage-notebook/README.md) | Read the revision before saving. Concurrent edits are never silently overwritten. | preview |
| [Configuration](configuration/README.md) | Change settings in the host, then inspect the observed configuration. | preview |
| [Secure input](secret-input/README.md) | Enter a fictional secret using the host. This page sees only whether it exists. | preview |
| [Conditional entry](contextual-entry/README.md) | Show an extra command after linking a task; hide it after unlinking. | preview |
| [Task conversations](conversation-launcher/README.md) | Create a draft in an authorized project and open it by ID. Creation never runs a model. | preview |
| [Operation confirmation](operation-confirmation/README.md) | Add or remove a local record through host-controlled confirmation. | preview |
| [Cancellation and errors](cancellation-and-errors/README.md) | Start a slow read and cancel waiting. Cancellation is not a business rollback. | preview |
| [Local messages](local-messages/README.md) | Publish, query, update, and withdraw a local business notification. | preview |
| [Team intake](declarative-intake/README.md) | Fill seven field types in chat and confirm before sending. | preview |
| [Enterprise service connection](enterprise-auth/README.md) | Connect through the host and read a declared HTTPS resource. | preview |
| [Message actions](message-actions/README.md) | Submit from a notification and reconcile its result without repeating a write. | preview |
| [Business event push](service-events/README.md) | Connect to a local SSE service and publish versioned progress notifications. | preview |
| [In-chat travel card](mcp-apps-card/README.md) | Edit a travel card in chat and save a local record after confirmation. | preview |
| [Team workbench](team-workbench/README.md) | Connect projects, tasks, and conversations to continue your work. | preview |
| [Extension showcase](extension-showcase/README.md) | Explore projects, forms, messages, business actions, and enterprise connections. | preview |
| [Travel expense assistant](expense-workflow/README.md) | Fill, review, and submit a claim in chat, then reconcile uncertain results. | preview |
| [Submission recovery](submission-recovery/README.md) | Drop a write response and reconcile the original submission without replay. | preview |
| [Conversation events](conversation-events/README.md) | Waiting for public conversation hooks and versioned turn reads. | planned |
| [Conversation business sync](conversation-business-sync/README.md) | Waiting for public conversation hooks and versioned turn reads. | planned |

23 buildable preview samples and 2 M2 planning directories. Preview does not mean every desktop flow is verified; see [verification](docs/verification.md). Enterprise authentication uses placeholder resources until a real IdP is configured.

```sh
# Maintain all samples / 批量维护
npm ci
npm run setup
npm run build
npm run validate
npm run pack
npm test
```

[Requirements](docs/requirements.md) · [Compatibility](docs/compatibility.md) · [Contributing](CONTRIBUTING.md) · [License](LICENSE)
