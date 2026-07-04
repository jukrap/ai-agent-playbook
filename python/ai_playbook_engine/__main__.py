from __future__ import annotations

import argparse
import json
import sys

from .writing_naturalness import analyze_writing_naturalness


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ai_playbook_engine")
    subparsers = parser.add_subparsers(dest="command")

    writing = subparsers.add_parser("writing-naturalness", help="Analyze Korean or English writing naturalness from JSON stdin.")
    writing.add_argument("--json", action="store_true", help="Emit JSON. This is the only supported output format.")

    args = parser.parse_args(argv)
    if args.command == "writing-naturalness":
        payload = read_json_stdin()
        write_json(analyze_writing_naturalness(payload))
        return 0

    parser.print_help()
    return 0


def read_json_stdin() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        return {
            "schemaVersion": "1",
            "ok": False,
            "conflicts": [{
                "id": "python-engine.invalid-json",
                "message": f"Could not parse stdin JSON: {exc.msg}"
            }]
        }
    return parsed if isinstance(parsed, dict) else {}


def write_json(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")


if __name__ == "__main__":
    raise SystemExit(main())
