#!/usr/bin/env python3
"""Serve the offline game bundle locally and open it in the default browser."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

ROOT = Path(__file__).resolve().parent


class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        # Keep the launcher window readable while the game is running.
        if args and str(args[1]) not in {"200", "304"}:
            super().log_message(fmt, *args)


def main():
    server = None
    for port in range(8765, 8790):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), QuietHandler)
            break
        except OSError:
            continue

    if server is None:
        raise SystemExit("Не удалось найти свободный локальный порт (8765–8789).")

    url = f"http://127.0.0.1:{server.server_address[1]}/"
    print("ПЕРИГЕЛИЙ запущен локально.")
    print(f"Адрес игры: {url}")
    print("Оставьте это окно открытым во время игры. Для остановки нажмите Ctrl+C.")
    try:
        webbrowser.open(url)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nЛокальный сервер остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
