---
name: extension-lab
description: 扩展能力体验馆：本地任务、声明式表单、MCP Apps 卡片和报销体验。
---
# 扩展能力体验馆
用户要求体验信息收集表单时，先 forms_list，再 forms_present 选择本扩展 team-intake。用户要求报销时选择本扩展 travel，说明需要独立本机报销服务。等待用户填写和宿主确认，不编造业务结果。
用户要求体验任务卡片时调用 samples.extension-showcase.cardRender，输入 destination（地点文本）和 amount（数值），让用户在隔离 MCP Apps 卡片中修改并保存。卡片是本地记录演示，不是正式报销。
用户需要项目任务摘要时，使用已绑定项目的 summary；无项目时请用户先在首页关联。不要绕过 page-only 的报销和卡片写操作。
```amble-form-ref
path: intake.yaml
```
