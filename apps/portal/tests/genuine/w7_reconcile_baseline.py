#!/usr/bin/env python3
"""Offline W7 reconciliation. Never starts, queries, or reuses a fixture."""
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[4]
BASELINE = "8c5c6b2d72e75f620487f1b2b110655b03551b17"
PRODUCT = "d4eb83dec33ec68cc553228fa87922ce14de1b80"
DOC = ROOT / "docs/portal-rebuild"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(*args):
    return subprocess.check_output(
        ["git", "-C", str(ROOT), *args], text=True,
        env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"},
    ).strip()


def read(path):
    return json.loads(path.read_text())


def pin(path, expected_hash=None, expected_size=None, expected_mode=None):
    path = Path(path)
    actual = {"path": str(path)}
    errors = []
    try:
        info = path.lstat()
        actual.update(bytes=info.st_size, mode=stat.S_IMODE(info.st_mode))
        if not stat.S_ISREG(info.st_mode):
            errors.append("not a regular file")
        else:
            actual["sha256"] = digest(path)
            if expected_hash and actual["sha256"] != expected_hash:
                errors.append("sha256 mismatch")
        if expected_size is not None and info.st_size != expected_size:
            errors.append("size mismatch")
        if expected_mode is not None:
            mode = int(expected_mode, 8) if isinstance(expected_mode, str) else expected_mode
            if stat.S_IMODE(info.st_mode) != mode:
                errors.append("mode mismatch")
    except OSError as error:
        errors.append(type(error).__name__)
    actual["errors"] = errors
    return actual


def reconcile():
    capabilities = read(DOC / "acceptance/ACCEPTED_CAPABILITIES_20261103.json")
    preflight = read(DOC / "transition/20261103/W0_BASELINE_PREFLIGHT.json")
    result = {
        "schemaVersion": 1,
        "owner": "Kanuj",
        "method": "Offline read-only Git and saved-filesystem hash/size/mode reconciliation",
        "execution": {"resourceQueries": 0, "fixtureReruns": 0, "fixtureReuse": False},
        "baseline": BASELINE,
        "headObserved": git("rev-parse", "HEAD"),
        "productCode": PRODUCT,
        "capabilities": [],
        "requirementPins": [],
        "interfacePins": [],
        "errors": [],
    }
    git("merge-base", "--is-ancestor", BASELINE, "HEAD")
    product_paths = ["apps/portal/src", "apps/portal/session-integration/runtime",
                     "supabase/functions", "supabase/migrations", "src/contracts"]
    changed = git("diff", "--name-only", PRODUCT, "HEAD", "--", *product_paths)
    result["runtimeDeltaFromAcceptedProduct"] = changed.splitlines() if changed else []
    if changed:
        result["errors"].append("runtime differs from accepted product; review equivalence before carrying acceptance")
    for row in preflight["originalRequirementsVerified"]:
        result["requirementPins"].append(pin(ROOT / row["file"], row["sha256"], row["bytes"]))
    for row in preflight["interfaceFreeze"]:
        result["interfacePins"].append(pin(ROOT / row["path"], row["sha256"]))
    for capability in capabilities["capabilities"]:
        packet_ref = capability["evidencePacket"]
        packet_path = Path(packet_ref["path"])
        packet_pin = pin(packet_path, packet_ref["sha256"], expected_mode=0o600)
        report = capability["independentReview"]
        report_path = (DOC / "acceptance" / report["report"]).resolve()
        record = {
            "id": capability["id"], "acceptedRevision": capability["acceptedRevision"],
            "packet": packet_pin, "report": pin(report_path, report["sha256"]),
            "scope": "Preserve prior independently accepted bounded capability; no fresh product execution",
            "wholeScreenAccepted": False, "wholeJourneyAccepted": False,
        }
        if packet_pin["errors"]:
            record["artifactCount"] = 0
            record["artifactErrors"] = ["packet pin failed; artifact contents not read"]
        else:
            packet = read(packet_path)
            artifacts = packet.get("fileAllowlist", packet.get("artifacts", []))
            checks = [pin(row.get("path", row.get("file")), row["sha256"],
                          row["bytes"], row["mode"]) for row in artifacts]
            record["artifactCount"] = len(checks)
            record["artifactErrors"] = [row for row in checks if row["errors"]]
        custody = capability["resourceDisposition"]
        stop_path = Path(custody["receipt"])
        record["stopReceipt"] = pin(stop_path, custody["receiptSha256"], expected_mode=0o600)
        if not record["stopReceipt"]["errors"]:
            # Inspect only terminal metadata, never execute saved commands or contact resources.
            record["savedStage"] = read(stop_path).get("stage")
            if record["savedStage"] != "STOPPED_RETAINED":
                result["errors"].append(capability["id"] + " lacks terminal saved stop")
        result["capabilities"].append(record)
    for group in ("requirementPins", "interfacePins"):
        if any(row["errors"] for row in result[group]):
            result["errors"].append(group + " failed")
    for row in result["capabilities"]:
        if row["packet"]["errors"] or row["report"]["errors"] or row["stopReceipt"]["errors"] or row["artifactErrors"]:
            result["errors"].append(row["id"] + " saved evidence pin failed")
    result["status"] = "PASS_OFFLINE_RECONCILIATION" if not result["errors"] else "HOLD"
    return result


if __name__ == "__main__":
    result = reconcile()
    if len(sys.argv) == 2:
        target = Path(sys.argv[1])
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "errors": result["errors"],
                      "capabilities": [{"id": row["id"], "artifacts": row["artifactCount"],
                                        "artifactErrors": len(row["artifactErrors"])}
                                       for row in result["capabilities"]],
                      "requirements": len(result["requirementPins"]),
                      "interfaces": len(result["interfacePins"])}))
    sys.exit(0 if result["status"] == "PASS_OFFLINE_RECONCILIATION" else 1)
