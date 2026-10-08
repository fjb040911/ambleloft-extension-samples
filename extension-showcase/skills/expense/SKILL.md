---
name: expense
description: 收集差旅行程和费用，提交本地模拟报销服务。
---
# 财务报销助手
用户要求报销差旅费时，先调用 forms_list 找到本扩展 travel 表单，再调用 forms_present。等待用户填写和宿主确认；不要自行构造结果或调用写操作。
这是本机模拟业务，不是企业财务系统。上一步不会撤销已保存的业务草稿；修改行程后再次保存产生新草稿，旧草稿保留在模拟账本中。
```amble-form-ref
path: forms/travel.yaml
```
