# 🗺 BROM AI Network Map

> Updated: **2026-07-10 03:03 MSK**
> Agent: **OWL** (Hermes Cron Backup)

---

## 🖥 Local Machine (RUSLAN-WORK)

| Parameter | Value |
|-----------|-------|
| **Hostname** | RUSLAN-WORK |
| **OS** | Windows 10 |
| **LAN IP** | 192.168.10.14 / 192.168.10.15 |
| **Gateway** | 192.168.10.2 |
| **VPN IP** | 172.16.219.2 (AdGuard VPN) |
| **WSL IP** | 172.21.48.1 |
| **Hyper-V IP** | 172.29.144.1 |

### Services

| Service | Status | Note |
|---------|--------|------|
| Hermes Agent | ✅ Up | Default profile |
| Docker | ⛔ N/A | Not installed |
| AdGuard VPN | ✅ Connected | 46.243.231.30/31 DNS |

---

## 📂 Projects

### brom-casino
- Path: C:\Users\Ruslan\Projects\brom-casino
- Remote: github.com/RuslanStrogov/brom-casino.git
- Last commit: e861198 @bromAiRuslan: daily backup 2026-07-08 - add network map
- Branch: main
- Status: ✅ Clean

### robot-catty
- Path: C:\Users\Ruslan\Projects\robot-catty
- Remote: github.com/RuslanStrogov/robot-catty.git
- Last commit: 5fea865 docs: UI screenshots + index.html
- Branch: master
- Status: ✅ Clean

---

## 🖧 Network Reachability (2026-07-10)

| Host | IP | Ping | Status |
|------|----|------|--------|
| Gateway | 192.168.10.2 | ✅ <1ms | ✅ Online |
| S1 (Ubuntu) | 192.168.10.66 | ✅ <1ms | ✅ Online |
| S2 (Windows) | 192.168.10.44 | ✅ <1ms | ✅ Online |

---

## 🔐 Hermes Agent

| Parameter | Value |
|-----------|-------|
| Config | ~/AppData/Local/hermes/config.yaml (18KB) |
| Skills | ~/AppData/Local/hermes/skills/ + ~/.hermes/skills/ |
| Provider | openrouter |
| Model | deepseek/deepseek-v4-flash |
| State DB | ~/AppData/Local/hermes/state.db (109MB) |

### Active Skills (enabled)
- software-development (2 skills)
- .archive (8 archived skills)

---

## 📡 External

| Endpoint | Type | Status |
|----------|------|--------|
| github.com/RuslanStrogov | Git remote | ✅ Reachable |
| OpenRouter API | LLM Provider | ✅ Active |

---

## 📋 History

| Date | Agent | Changes |
|------|-------|---------|
| 2026-06-30 | OWL | Standalone network map created |
| 2026-07-08 | OWL | Initial network map in casino repo |
| 2026-07-10 | OWL | Full network refresh: ping check, service scan |