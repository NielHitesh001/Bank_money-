#!/usr/bin/env python3
"""
================================================================================
 WORLD MONEY DAEMON — SERVICE MANAGEMENT CLI
--------------------------------------------------------------------------------
 Manage the macOS launchd background daemon lifecycle with automated path
 templating and status reporting.

 USAGE:
   python3 scripts/service.py install   # Generate & install launchd plist
   python3 scripts/service.py start     # Start background daemon service
   python3 scripts/service.py stop      # Stop background daemon service
   python3 scripts/service.py restart   # Restart daemon service
   python3 scripts/service.py status    # Check live execution status
   python3 scripts/service.py logs      # Inspect recent log output
================================================================================
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

SERVICE_LABEL = "com.worldmoney.finance-daemon"
PLIST_FILENAME = f"{SERVICE_LABEL}.plist"
REPO_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = REPO_DIR / "deploy" / f"{PLIST_FILENAME}.template"
USER_LAUNCHAGENTS_DIR = Path.home() / "Library" / "LaunchAgents"
TARGET_PLIST_PATH = USER_LAUNCHAGENTS_DIR / PLIST_FILENAME


def cmd_install(args: argparse.Namespace) -> None:
    vault_path = Path(args.vault_path).resolve()
    print(f"[*] Configuring World Money daemon launchd agent...")
    print(f"    Repository Directory: {REPO_DIR}")
    print(f"    Vault Directory:      {vault_path}")

    if not TEMPLATE_PATH.exists():
        print(f"[!] Error: Template plist not found at {TEMPLATE_PATH}", file=sys.stderr)
        sys.exit(1)

    template_content = TEMPLATE_PATH.read_text(encoding="utf-8")
    rendered_content = template_content.replace("__REPO_DIR__", str(REPO_DIR)).replace(
        "__VAULT_DIR__", str(vault_path)
    )

    USER_LAUNCHAGENTS_DIR.mkdir(parents=True, exist_ok=True)
    TARGET_PLIST_PATH.write_text(rendered_content, encoding="utf-8")
    print(f"[+] Plist successfully generated at:\n    {TARGET_PLIST_PATH}")

    if args.start:
        cmd_start(args)


def cmd_start(_args: argparse.Namespace) -> None:
    if not TARGET_PLIST_PATH.exists():
        print(f"[!] Plist not installed yet. Run 'python3 scripts/service.py install' first.", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Loading and starting {SERVICE_LABEL}...")
    res = subprocess.run(["launchctl", "load", str(TARGET_PLIST_PATH)], capture_output=True, text=True)
    if res.returncode == 0:
        print("[+] Service successfully started via launchd.")
    else:
        print(f"[!] launchctl load response: {res.stderr.strip() or res.stdout.strip()}")


def cmd_stop(_args: argparse.Namespace) -> None:
    if not TARGET_PLIST_PATH.exists():
        print(f"[*] Plist not found at {TARGET_PLIST_PATH}; nothing to stop.")
        return

    print(f"[*] Unloading {SERVICE_LABEL}...")
    res = subprocess.run(["launchctl", "unload", str(TARGET_PLIST_PATH)], capture_output=True, text=True)
    if res.returncode == 0:
        print("[+] Service successfully stopped.")
    else:
        print(f"[!] launchctl unload response: {res.stderr.strip() or res.stdout.strip()}")


def cmd_restart(args: argparse.Namespace) -> None:
    cmd_stop(args)
    cmd_start(args)


def cmd_status(_args: argparse.Namespace) -> None:
    print(f"--- Service Status: {SERVICE_LABEL} ---")
    print(f"Installed Plist: {'YES (' + str(TARGET_PLIST_PATH) + ')' if TARGET_PLIST_PATH.exists() else 'NO'}")

    try:
        res = subprocess.run(["launchctl", "list"], capture_output=True, text=True)
        is_loaded = SERVICE_LABEL in res.stdout
        print(f"Launchd Status:  {'ACTIVE / LOADED' if is_loaded else 'INACTIVE / NOT LOADED'}")
    except (OSError, PermissionError) as e:
        print(f"Launchd Status:  UNAVAILABLE ({e})")

    try:
        ps_res = subprocess.run(["ps", "aux"], capture_output=True, text=True)
        daemon_procs = [line for line in ps_res.stdout.splitlines() if "obsidian_finance_daemon.py" in line and "python" in line]
        if daemon_procs:
            print(f"Process Status:  RUNNING ({len(daemon_procs)} process instances)")
            for proc in daemon_procs:
                parts = proc.split()
                pid = parts[1] if len(parts) > 1 else "?"
                print(f"  PID {pid}: {' '.join(parts[10:])}")
        else:
            print("Process Status:  STOPPED")
    except (OSError, PermissionError) as e:
        print(f"Process Status:  UNAVAILABLE ({e})")


def cmd_logs(args: argparse.Namespace) -> None:
    log_dir = REPO_DIR / "FinanceVault" / "_system" / "logs"
    daemon_log = log_dir / "daemon.log"

    if not daemon_log.exists():
        print(f"[*] No daemon log file found at {daemon_log}")
        return

    print(f"--- Showing last {args.lines} lines of {daemon_log} ---")
    lines = daemon_log.read_text(encoding="utf-8", errors="replace").splitlines()
    for line in lines[-args.lines:]:
        print(line)


def main() -> None:
    parser = argparse.ArgumentParser(description="World Money Daemon Service CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # install
    p_install = subparsers.add_parser("install", help="Generate and install launchd plist")
    p_install.add_argument("--vault-path", default=str(REPO_DIR / "FinanceVault"), help="Target vault path")
    p_install.add_argument("--start", action="store_true", help="Start service immediately after installing")
    p_install.set_defaults(func=cmd_install)

    # start
    p_start = subparsers.add_parser("start", help="Start service")
    p_start.set_defaults(func=cmd_start)

    # stop
    p_stop = subparsers.add_parser("stop", help="Stop service")
    p_stop.set_defaults(func=cmd_stop)

    # restart
    p_restart = subparsers.add_parser("restart", help="Restart service")
    p_restart.set_defaults(func=cmd_restart)

    # status
    p_status = subparsers.add_parser("status", help="Check status")
    p_status.set_defaults(func=cmd_status)

    # logs
    p_logs = subparsers.add_parser("logs", help="View logs")
    p_logs.add_argument("--lines", type=int, default=30, help="Number of log lines")
    p_logs.set_defaults(func=cmd_logs)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
