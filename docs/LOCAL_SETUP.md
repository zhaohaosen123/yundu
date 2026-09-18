# 本机搭建与验收手册

## 1. 环境准备

- Docker Desktop（Linux containers）
- Bun 1.3+
- Go 1.25+（只有需要本地编译后端时才需要；Docker 镜像运行不依赖本机 Go）

## 2. 启动开发环境

```powershell
Copy-Item .env.local.example .env.local
# 编辑 .env.local，替换 SESSION_SECRET 为随机高熵字符串
docker compose --env-file .env.local -f docker-compose.local.yml -p new-api-local up -d
```

浏览器访问 `http://localhost:3000`。首次启动完成管理员初始化后，建议立即修改管理员密码并启用 MFA。

停止服务：

```powershell
docker compose --env-file .env.local -f docker-compose.local.yml -p new-api-local down
```

本机 SQLite 数据位于 `./data`，日志位于 `./logs`。不要把 `.env.local`、`data` 或 `logs` 提交到代码仓库。

## 3. 导入上游 API 并自动进入资源池

1. 登录管理端，进入“渠道/资源”页面，点击“创建渠道”。
2. 选择供应商类型，填写合法授权的 Base URL 和 API Key。
3. 点击“从上游获取模型”，检查返回模型列表，去掉不准备公开的模型。
4. 设置公开分组、优先级和权重后保存。
5. 保存会自动重建模型能力索引；打开“资源池概览”检查模型的健康资源数、权重、优先级和平均延迟。
6. 为同一模型添加第二个不同区域或供应商的渠道，使用不同权重进行灰度验证。

失败、鉴权错误或空模型列表不得直接发布；先检查 Base URL、凭据权限、网络出口和上游模型权限。

## 4. 用户端验收

- 注册/登录后可以查看模型价格目录。
- 在 API Key 页面创建、复制一次性 Key、设置过期时间和模型范围。
- 在钱包页面创建充值订单；未配置支付商户时必须显示“未启用/待人工处理”，不得伪造支付成功。
- 使用 OpenAI Chat Completions、Responses、Claude Messages 或 Gemini 兼容格式发起测试请求。
- 用户消费明细只显示公开模型别名和计量，不显示渠道、Base URL、供应商和上游真实模型。
- 右下角“支持聊天”可打开交流面板；当前消息保存在页面会话中，正式上线前需接入工单或客服服务。

## 5. 上线前必须替换的配置

- `SESSION_SECRET`、数据库密码、Redis 密码、支付密钥、OAuth Client Secret、邮件凭据
- `SESSION_COOKIE_SECURE=true` 和精确 `SESSION_COOKIE_TRUSTED_URL`
- PostgreSQL/MySQL 生产 DSN、Redis 集群、备份策略、日志保留策略
- 支付回调域名、发票服务商、税率和企业开票信息
- 反向代理 HTTPS、可信代理 CIDR、WAF、限流和告警

## 6. 验收命令

```powershell
docker compose --env-file .env.local.example -f docker-compose.local.yml -p new-api-local config --quiet
cd web
bun install --frozen-lockfile
bun run typecheck
bun run i18n:sync
```

若完整前端构建因上游依赖版本冲突失败，应先锁定与当前 New API 提交匹配的依赖快照，再进行发布；不能把失败的构建当作上线通过。

