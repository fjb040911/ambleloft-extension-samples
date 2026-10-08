# Known gaps / 已知缺口

## Host: newly opened page can receive the system locale

Observed on host 237e8c6746e8e0ed6a17edffe44877a3118068d3: after setting the UI language to English, opening a different extension page can initialize it with zh-CN. Updating language while that page is open delivers the correct context event. `electron/extensions/page-host.cjs` creates the page without seeding its locale from the owner context, while `context(p)` falls back to the system locale. The sample does not replace the SDK or fabricate a host locale. Appearance evidence records the initial check as blocked and the subsequent real context update separately.

首次新开页面的语言可能与宿主设置不一致；打开页面后通过宿主切换语言可触发正确更新。此问题属于宿主，不在案例中伪造兼容层。深浅主题与现有页面的语言变更已验证。

## Planned capability boundaries

- Conversation hooks and versioned turn reads remain unavailable: two planning directories have no fake runnable extension.
- No public forms_resume or direct SDK form presentation/migration API. Use existing host-owned instances.
- Production enterprise IdP registration/resource/tenant compatibility, real OS banner delivery, Windows/Linux desktop behavior: not run.
- Expense flagship F0/F1 implemented. F2 progress notifications/actions and F3 enterprise business adapter remain separate milestones; capability demos are available in message-actions/enterprise-auth.
- Form templates remain Chinese. Bilingual docs and home labels do not imply automatically localized YAML.
- Composed team/showcase samples retain upstream demo diagnostics; they are not production task-management products.

## Host: stale error after successful reconciliation

The expense and recovery screenshots show a completed (已提交) form with an old `提交未完成：INTERNAL` alert. The host retains its previous form error when reconciliation succeeds. The completed state and demo-service ledger were checked independently: recovery does not create another claim. The form also does not render the returned claim ID; use the expense home record list to inspect it. These screenshots intentionally retain the actual host display.

核实成功后，当前宿主仍显示旧错误，容易让用户误以为提交失败。案例服务与核实状态已经成功，账本只新增一次；这仍是需要修复的宿主体验缺口，不能把该页面描述为已完成全部交互验收。
