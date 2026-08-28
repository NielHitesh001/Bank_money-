# Deployment & Service Management

This directory contains service templates and daemon configurations for running the World Money background service.

## macOS (launchd)

1. Clone or place the repository in a stable directory (e.g. `~/Projects/World_money_updates`).
2. Create and configure your Python environment:
   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
3. Copy the plist template:
   ```bash
   cp deploy/com.worldmoney.finance-daemon.plist.template ~/Library/LaunchAgents/com.worldmoney.finance-daemon.plist
   ```
4. Replace `__REPO_DIR__` with the absolute repository path and `__VAULT_DIR__` with the target vault path (e.g., `~/Projects/World_money_updates/FinanceVault`).
5. Load the service:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.worldmoney.finance-daemon.plist
   ```
6. To stop/unload:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.worldmoney.finance-daemon.plist
   ```
