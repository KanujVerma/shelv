"""Pinned public-build host. Import/check-only never opens a socket.

Run only under the exact W0-admitted packet. No Auth, API response fixture,
database, persistent product state, source transformation or existing host reuse.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import http.server
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import signal
import threading
import time
from urllib.parse import parse_qsl, unquote, urlsplit


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def utc() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def write_new(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8") as handle:
        os.chmod(path, 0o600)
        json.dump(value, handle, indent=2)
        handle.write("\n")


def pinned_build(root: Path, manifest: Path, expected_hash: str, head: str) -> dict[str, bytes]:
    data = manifest.read_bytes()
    if digest(data) != expected_hash:
        raise ValueError("build_manifest_changed")
    value = json.loads(data)
    if value["sourceHead"] != head or len(value["inputs"]) != 2298 or len(value["assets"]) != 29:
        raise ValueError("unexpected_build_identity")
    files: dict[str, bytes] = {}
    total = 0
    for row in value["buildOutputs"]:
        relative = PurePosixPath(row["path"])
        if relative.is_absolute() or any(part in (".", "..") for part in relative.parts):
            raise ValueError("invalid_build_path")
        source = root / relative
        if source.is_symlink() or not source.resolve().is_relative_to(root.resolve()):
            raise ValueError("build_path_escape")
        raw = source.read_bytes()
        total += len(raw)
        if len(raw) != row["bytes"] or digest(raw) != row["sha256"]:
            raise ValueError("built_bytes_changed")
        key = "/" + relative.as_posix()
        if key in files:
            raise ValueError("duplicate_build_path")
        files[key] = raw
    if len(files) != 95 or total > 64 * 1024 * 1024:
        raise ValueError("unexpected_build_size")
    provenance = json.loads(files["/application-provenance.json"])
    if provenance["sourceHead"] != head or provenance["gatewayIncluded"] is not False:
        raise ValueError("unexpected_built_provenance")
    return files


def response_for(method: str, target: str, files: dict[str, bytes]) -> tuple[int, str, bytes]:
    request = urlsplit(target)
    if request.scheme or request.netloc or request.fragment:
        return 400, "text/plain", b"invalid target\n"
    path = unquote(request.path)
    if "\\" in path or any(part == ".." for part in PurePosixPath(path).parts):
        return 403, "text/plain", b"denied\n"
    if path.startswith("/api/") or path == "/api":
        return 403, "text/plain", b"no API in public test host\n"
    if method not in ("GET", "HEAD"):
        return 405, "text/plain", b"read-only host\n"
    if path == "/maya":
        pairs = parse_qsl(request.query, keep_blank_values=True)
        if len(pairs) > 1 or any(key != "stage" or val not in ("1", "2", "3", "4", "5") for key, val in pairs):
            return 400, "text/plain", b"unknown public route\n"
        return 200, "text/html; charset=utf-8", files["/index.html"]
    if request.query:
        return 400, "text/plain", b"unexpected query\n"
    # Provenance and build metadata are evidence, not runtime page endpoints.
    allowed = path in ("/application.js", "/application.css") or path.startswith(("/assets/", "/fonts/", "/chunks/", "/maya/assets/"))
    if not allowed or path not in files:
        return 404, "text/plain", b"not found\n"
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    return 200, mime, files[path]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-root", type=Path, required=True)
    parser.add_argument("--build-pins", type=Path, required=True)
    parser.add_argument("--expected-pins-sha", required=True)
    parser.add_argument("--source-head", required=True)
    parser.add_argument("--execution-id", required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--deadline-seconds", type=int, required=True)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    if not 49152 <= args.port <= 65535 or not 1 <= args.deadline_seconds <= 270:
        raise ValueError("unsupported_resource_bounds")
    files = pinned_build(args.build_root, args.build_pins, args.expected_pins_sha, args.source_head)
    if args.check_only:
        print(json.dumps({"checkOnly": True, "socketOpened": False, "files": len(files), "head": args.source_head}))
        return
    ready = args.evidence / "READY.json"
    closed = args.evidence / "CLOSED.json"
    requests = args.evidence / "REQUESTS.jsonl"
    if any(path.exists() for path in (ready, closed, requests)):
        raise ValueError("execution_evidence_already_exists_no_reuse")
    args.evidence.mkdir(parents=True, exist_ok=True)
    log = requests.open("x", encoding="utf-8")
    os.chmod(requests, 0o600)
    lock = threading.Lock()
    count = 0
    reason = "unknown"
    started = time.monotonic()

    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Never log cookies, headers, bodies or arbitrary query values.

        def answer(self):
            nonlocal count
            status, mime, body = response_for(self.command, self.path, files)
            with lock:
                count += 1
                if count > 1200:
                    status, mime, body = 429, "text/plain", b"request bound reached\n"
                path = urlsplit(self.path).path
                log.write(json.dumps({"at": utc(), "method": self.command, "path": path[:512], "status": status}) + "\n")
                log.flush()
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
            self.end_headers()
            if self.command == "GET":
                try:
                    self.wfile.write(body)
                except (BrokenPipeError, ConnectionResetError):
                    pass

        do_GET = answer
        do_HEAD = answer
        do_POST = answer
        do_PUT = answer
        do_PATCH = answer
        do_DELETE = answer
        do_OPTIONS = answer

    # Bind exactly once. An occupied port is setup failure, never an old host
    # to query, kill, adopt or replace with a different unadmitted port.
    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.daemon_threads = True

    def stop(why: str):
        nonlocal reason
        if reason == "unknown":
            reason = why
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, lambda *_: stop("owned SIGTERM"))
    signal.signal(signal.SIGINT, lambda *_: stop("owned SIGINT"))
    timer = threading.Timer(args.deadline_seconds, lambda: stop("deadline"))
    timer.daemon = True
    try:
        write_new(ready, {"executionId": args.execution_id, "pid": os.getpid(), "head": args.source_head, "origin": f"http://127.0.0.1:{args.port}", "startedAt": utc(), "deadlineSeconds": args.deadline_seconds})
        timer.start()
        print(json.dumps({"ready": str(ready), "pid": os.getpid(), "origin": f"http://127.0.0.1:{args.port}"}), flush=True)
        server.serve_forever(poll_interval=0.1)
    finally:
        timer.cancel()
        server.server_close()
        with lock:
            log.close()
        write_new(closed, {"executionId": args.execution_id, "pid": os.getpid(), "head": args.source_head, "closedAt": utc(), "reason": reason, "elapsedSeconds": time.monotonic() - started, "requests": count})


if __name__ == "__main__":
    main()
