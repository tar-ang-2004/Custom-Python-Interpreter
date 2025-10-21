# Custom Python Interpreter — Web IDE

This repository contains a lightweight, self-hosted web-based Python interpreter and Web IDE. It provides an interactive environment to write, execute, and debug Python code from a browser. The project is ideal for learning, teaching, prototyping, and demos where a simple, embeddable Python execution environment is useful.

The project includes a Flask server that hosts multiple front-end editor pages (modern, advanced, simple, and original CodeMirror variants), a reusable `PythonInterpreter` backend, and a small set of utilities and static assets (CSS/JS) for a web-based IDE experience.

Table of contents
- Overview
- Features
- Architecture
- Installation
- Running the app
- Usage
- API reference
- Security considerations
- Development
- Testing
- Troubleshooting
- Contributing
- License
- Credits

## Overview

The Custom Python Interpreter Web IDE provides an in-browser coding environment backed by a Python execution engine. It exposes REST endpoints for executing code, validating syntax, inspecting variables, retrieving execution history, and controlling a REPL-like interaction (including providing input values to paused runs).

Key goals:
- Offer a minimal, self-contained Python Web IDE that runs locally.
- Make it easy to embed a Python execution surface into other web apps or teaching tools.
- Provide multiple front-end editor templates (simple, modern, advanced) so you can pick the UI that suits your needs.

## Features

- In-browser code editor pages (templates: `advanced.html`, `modern.html`, `simple.html`, `index.html`).
- Execute multi-line scripts or single-line REPL-style commands.
- Syntax validation without execution.
- Inspect variables and serialized values in the current interpreter namespace.
- Execution history retrieval and interpreter reset.
- Per-request or global interpreter instance management (current default: single global interpreter).
- Input provisioning for code that calls `input()` (queue values to be consumed by the interpreter).
- Spotify integration helpers in the backend (optional: login, playback control, search) — included in `app.py` for convenience when running the advanced UI.

## Architecture

- Flask application (`app.py`) serves HTML pages and a JSON API.
- `python_interpreter.py` contains the `PythonInterpreter` class that manages execution, variables, history, input handling, and safe serialization of objects. (See the file for implementation details.)
- Frontend templates in `templates/` use static assets from `static/` to create different editor experiences.

The server currently uses a single global `PythonInterpreter` instance for simplicity (all users share a namespace). The code includes commented-out logic to switch to per-session interpreters if desired.

## Installation

Prerequisites
- Python 3.10+ (the codebase uses language features compatible with modern Python; adjust if needed).
- pip (for installing Python packages).

Install dependencies

1. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install required Python packages:

```powershell
pip install -r requirements.txt
```

The `requirements.txt` in this repository declares:

- Flask==3.0.0
- Werkzeug==3.0.1

If you plan to use the Spotify integration, the server uses the `requests` library which is included in the standard environment for many Python installations. If `requests` is missing, install it with `pip install requests`.

## Running the app

Start the Flask server from the repository root:

```powershell
python app.py
```

By default the server starts in debug mode and listens on port 5000. Open your browser at http://localhost:5000 to load the advanced editor UI. Alternative pages:

- `/modern` — modern Tailwind-based UI
- `/simple` — minimal working editor
- `/original` — original CodeMirror-based editor
- `/test` — simple test page

Note: The app sets a random `app.secret_key` at startup using `secrets.token_hex(32)`, so session-based state is ephemeral between restarts.

## Usage

Open the UI in your browser and use the on-page editor to write Python code. The editor interacts with backend endpoints to run code, validate syntax, and fetch variables/history.

Common flows:
- Execute multi-line code: POST to `/api/execute` with JSON { code: "...", mode: "exec" }.
- Execute a single REPL line: POST to `/api/execute_line` with JSON { line: "..." }.
- Provide queued input values: POST to `/api/provide_input` with JSON { value: "..." }.
- Validate syntax: POST to `/api/validate` with JSON { code: "..." }.
- List variables: GET `/api/variables`.
- Get history: GET `/api/history`.
- Reset interpreter: POST `/api/reset`.

For client-side integrations, the endpoints return JSON describing success, captured stdout/stderr, result values, and serialized variables.

## Screenshots

Below is a screenshot of the IDE (the image is bundled in the repository under the `poontHER images/` folder):

![IDE Screenshot](poontHER%20images/Screenshot%202025-10-21%20161831.png)

## API reference (summary)

- GET `/` — Render the advanced UI page.
- GET `/modern`, `/simple`, `/original`, `/test` — Render other UI variants.
- POST `/api/execute` — Execute code (accepts `code`, `mode`, optional `inputs` array). Returns a JSON object with `success`, `output`, `error`, `result`, `variables`, `timestamp`.
- POST `/api/execute_line` — Execute single line REPL.
- POST `/api/provide_input` — Supply input value to the interpreter's input queue.
- POST `/api/validate` — Syntax-only validation.
- POST `/api/validate_lines` — Validate multiple lines with basic semantic checks (undefined names detection using AST analysis).
- GET `/api/variables` — Get serialized variables in the current namespace.
- GET `/api/history` — Get execution history.
- POST `/api/reset` — Reset interpreter state.
- POST `/api/set_variable` — Set a variable via expression evaluation.
- GET `/health` — Basic health check.

Spotify-related endpoints (optional; require a Spotify account and the client ID/secret in `app.py`):
- `/spotify/login`, `/spotify/callback`, and `/api/spotify/*` endpoints for search, playback control and status.

## Security considerations

Important: This project executes arbitrary Python code on the server. Running it on a machine exposed to untrusted users or over the public internet is dangerous. Consider the following before deploying:

- Never run this server on a publicly reachable host without additional sandboxing.
- Use OS-level sandboxing (containers, VMs) and resource limits to contain executions.
- Consider running the interpreter worker as a separate process with restricted privileges and communication via IPC with strict timeouts.
- Limit available builtins and shadow dangerous modules (the `PythonInterpreter` implementation may include serialization/sandboxing helpers — review it thoroughly).
- Log and monitor activity; set execution timeouts and memory limits.

If you're using this for teaching in a closed classroom environment on a local network, it's reasonably safe, but still treat code execution with caution.

## Development

Project layout (important files):

- `app.py` — The Flask web server and API routes.
- `python_interpreter.py` — Core interpreter abstraction (execution, variable management, history, serialization).
- `templates/` — HTML templates for the front-end editor pages.
- `static/` — CSS, JS and images used by the UIs.
- `test_interpreter.py` — Basic tests / examples for the interpreter (use as a reference and test harness).
- `marks_calculator.py`, `diagnostics.py`, `FINAL_INPUT_GUIDE.md`, `INPUT_GUIDE.md` — additional utilities and docs included in the repo.

Coding tips
- The app currently uses a single global interpreter. To switch to per-session interpreters, uncomment and adapt the session-based logic in `get_interpreter()` in `app.py`.
- `python_interpreter.py` likely exposes these useful methods used by `app.py`: `execute`, `execute_line`, `provide_input`, `validate_syntax`, `get_all_variables`, `get_history`, `reset`, `_serialize_value`, `set_input_values`.

Running locally with code reload (development):

```powershell
$Env:FLASK_APP='app.py'
$Env:FLASK_ENV='development'
python -m flask run
```

Or simply run `python app.py` which already starts Flask with `debug=True`.

## Testing

There is `test_interpreter.py` included as an example/test harness. You can run it directly:

```powershell
python test_interpreter.py
```

Consider adding unit tests for `python_interpreter.py` focusing on:
- Execution success/failure cases
- Input queuing and `input()` behavior
- Variable serialization edge cases
- Reset behavior and history management

## Troubleshooting

- If the server fails to start: ensure your Python environment has the packages in `requirements.txt` and that no other process is using port 5000.
- Template rendering issues: make sure the `templates/` directory is present and Flask can access it from the running working directory.
- Spotify endpoints failing: replace the client ID/secret with your own app credentials and ensure the redirect URI configured in Spotify Developer Dashboard matches `SPOTIFY_REDIRECT_URI`.

Inspect the Flask console logs — `app.py` prints helpful debug messages for execution requests.

## Contributing

Contributions are welcome. A suggested workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-change`.
3. Run and add tests for new behavior.
4. Open a pull request describing your changes.

