# 🐍 Python Interpreter Web IDE

A comprehensive web-based Python interpreter built with pure Python and Flask. Write, execute, and debug Python code directly in your browser with a beautiful, modern interface.

## ✨ Features

### ✨ Delight & Micro-Interactions (NEW!)
- **Animated Feedback**: Smooth, professional animations
  - Code editor focus pulse effect
  - Success checkmark draw-in animation
  - Command execution progress bar with gradient shimmer
  - Status icon pop animations

- **Enhanced Toast Notifications**: Non-intrusive feedback
  - Slide-in from right with bounce
  - Auto-dismiss with progress countdown
  - Type-based icons (✓ success, ✗ error, ⚠ warning, ℹ info)
  - Manual close option
  - Beautiful glass effect with blur

- **Welcome Screen**: Professional first-time experience
  - Animated logo with pulse
  - Version information
  - Quick keyboard shortcuts reference
  - Smooth fade-in/fade-out transitions
  - "Start New Session" CTA button

- **Visual Success/Error Cues**: Instant feedback
  - Green checkmark for successful execution
  - Red error flash with shake animation
  - Fire flicker for critical errors
  - Automatic 2-second display

- **Button Ripple Effects**: Material Design interactions
  - Click position-aware ripples
  - Applied to all buttons automatically
  - Smooth fade-out animation
  - Professional tactile feedback

- **Progress Indicators**: Real-time execution feedback
  - Top progress bar (3px gradient)
  - Shimmer animation during execution
  - Smooth width transitions (0% → 30% → 100%)
  - Long command notifications (> 2s)

### 📊 Information Visualization
- **Enhanced Variable Explorer**: Advanced variable inspection
  - Expandable collections (lists, dicts, tuples, sets)
  - Color-coded type indicators
  - Size information for collections
  - Detailed views with first 20 items
  - Quick copy and delete actions
  - Real-time search and filtering

- **Execution Stats Panel**: Real-time performance metrics
  - ⏱️ Execution time tracking (ms)
  - 💾 Memory usage estimates
  - ⚡ Total execution count
  - Automatic updates after each run

- **Command History Panel**: Full execution history
  - Last 50 commands stored
  - Searchable and filterable
  - Re-run any command instantly (▶ Run)
  - Edit commands before re-running (✎ Edit)
  - Delete individual items (🗑 Delete)
  - Clear all history option
  - Timestamp and success/failure indicators

- **Output Renderer**: Enhanced output display (foundation)
  - Styled error messages
  - Code formatting
  - Ready for DataFrames, charts, JSON, images

### 🎯 Interactive Features
- **Autocomplete & IntelliSense**: Smart code suggestions as you type
  - 21 Python keywords (if, for, def, class, etc.)
  - 22 Built-in functions (print, len, range, etc.)
  - 23 Common methods (append, split, join, etc.)
  - Session variables tracking
  - Type indicators (🔑 keyword, ⚡ function, 🔧 method, 📦 variable)

- **Command Palette**: VSCode-style quick access (Ctrl+Shift+P)
  - Change Theme 🎨
  - Clear Console 🧹
  - List Variables 📋
  PyInter — Custom Python Interpreter & Web IDE

  PyInter is a lightweight custom Python interpreter exposed via a web-based IDE. It provides a browser interface to write, run, and debug Python code with features such as per-line syntax validation, REPL-style execution, variable inspection, input provisioning, execution history, and optional Spotify integration in the UI.

  This repository contains a Flask web application that serves multiple editor pages (a modern Tailwind-based UI, a CodeMirror-based editor, a simple page, and an 'advanced' view) and a small custom interpreter backend implemented in `python_interpreter.py`.

  Table of contents
  - Features
  - Quick start
  - Running the app (development)
  - Project structure
  - API endpoints
  - Security and sandboxing notes
  - Development & testing
  - Contributing
  - License


  ## Features

  - Web IDE pages (served from `templates/`):
    - `advanced.html` — feature-rich UI with extra integrations.
    - `modern.html` — Tailwind-based modern UI.
    - `index.html` (original) — CodeMirror-based editor.
    - `simple.html` and `test.html` — lightweight pages for quick testing.
  - Custom Python interpreter with:
    - Execute full scripts (`exec`) or expressions (`eval`).
    - Execute single lines (REPL-style).
    - Per-line syntax validation and lightweight semantic checks.
    - Inspection of variables and serialized values.
    - Execution history tracking.
    - Programmatic input provisioning for code that uses `input()`.
  - Spotify helper endpoints to enable playback and search integration from the UI (optional and requires Spotify OAuth).


  ## Quick start

  Requirements

  - Python 3.10+ recommended.
  - The minimal dependencies are listed in `requirements.txt` (Flask and Werkzeug pinned there).

  Install dependencies

  ```powershell
  python -m venv .venv
  .\\.venv\\Scripts\\Activate.ps1
  pip install -r requirements.txt
  ```

  Run the app (development)

  ```powershell
  # from repository root
  python app.py
  ```

  By default the Flask app runs on http://localhost:5000. Open that URL in your browser and choose one of the editor pages.


  ## Project structure (important files)

  - `app.py` — Flask application and HTTP API that powers the Web IDE.
  - `python_interpreter.py` — the custom interpreter implementation (execution, history, variables, serialization).
  - `templates/` — HTML templates for different UI pages (`advanced.html`, `modern.html`, `index.html`, `simple.html`, `test.html`).
  - `static/` — CSS, JS, images and other frontend assets used by the editor pages.
  - `requirements.txt` — pinned Python dependencies for the project.
  - `test_interpreter.py` — tests for the interpreter (if present).


  ## API endpoints

  The server exposes a small JSON API used by the frontend. All API routes are under `/api` unless noted.

  - `POST /api/execute` — Execute a block of Python code.
    - Body JSON: `{ "code": "...", "mode": "exec" | "eval", "inputs": ["...", ...] }`
    - Response: `{ success, output, error, result, variables, timestamp }`

  - `POST /api/execute_line` — Execute a single line (REPL-style).
    - Body JSON: `{ "line": "..." }`

  - `POST /api/provide_input` — Provide a value to continue a paused execution waiting for input.
    - Body JSON: `{ "value": "..." }`

  - `POST /api/validate` — Syntax-only validation for a code block.
    - Body JSON: `{ "code": "..." }`
    - Response: `{ valid: true|false, error: null|string }`

  - `POST /api/validate_lines` — Validate multiple lines and run a simple semantic check for undefined names.
    - Body JSON: `{ "lines": ["line1", "line2", ...] }`
    - Response: `{ results: [{ valid: true|false|null, error }, ...] }`

  - `GET /api/variables` — Returns serialized variables from the interpreter namespace.

  - `GET /api/history` — Returns execution history.

  - `POST /api/reset` — Reset the interpreter state (clear variables and history).

  - `POST /api/set_variable` — Set a variable by evaluating a value expression.

  Additionally the app exposes several Spotify helper endpoints used by the advanced UI (login, callback, play, pause, search, devices, etc.). These require Spotify OAuth credentials to be useful.


  ## Security and sandboxing notes (important)

  This project runs user-provided Python code on the server. By design the interpreter provides convenience features (full execution, variable access, history), but running arbitrary Python code on a server is inherently dangerous. Consider the following before deploying publicly:

  - Current repo is suitable for local development or trusted networks only. It does not provide a secure sandbox for untrusted code.
  - The interpreter shares a global interpreter instance by default (all users share the same namespace). This is simpler for local use, but not suitable for multi-tenant public deployments. You can revert to per-session interpreters in `app.py` (code is present in comments).
  - If you plan to expose this publicly, consider one or more of:
    - Running each session inside a dedicated, short-lived container (Docker, Firecracker, gVisor).
    - Enforcing strict resource limits (CPU, memory, execution timeouts).
    - Running code under a restricted user with filesystem and network access limited.
    - Using language-level sandboxing (e.g., restricted AST evaluation) and whitelisting safe modules only.
    - Disallowing dangerous builtins and modules. The interpreter already serializes values carefully, but it does not fully sandbox import/use of system resources.

  Treat this project as an educational and local tool unless you add strong sandboxing.


  ## Development notes

  - The server's entrypoint is `app.py`. It uses Flask to serve HTML pages and JSON API endpoints.
  - The custom interpreter implementation is in `python_interpreter.py`. It manages execution, captured stdout/stderr, variable serialization, and history.
  - Frontend assets live in `static/` and `templates/`. The modern UI uses Tailwind classes (if you want a prettier UI, you can add a Tailwind build step).

  Testing

  - If `test_interpreter.py` exists, run it with pytest:

  ```powershell
  pip install pytest
  pytest -q
  ```


  ## Contributing

  If you'd like to contribute:

  1. Open an issue describing your idea or bug.
  2. Create a branch with a clear name (e.g., `feature/repl-timeout`, `fix/serialize-bytes`).
  3. Add tests for new behavior where appropriate.
  4. Open a pull request and describe the change.

  Suggested improvements

  - Add a `.gitignore` to exclude `__pycache__`, virtual env folders, and large media files.
  - Move Spotify client secrets into environment variables or a config file (don't commit secrets).
  - Improve sandboxing for secure public hosting.
  - Add CI (GitHub Actions) to run tests and linting.


  ## License

  This repository does not include a license file. If you intend to make this open-source, add an appropriate `LICENSE` file (MIT, Apache-2.0, etc.).


  ---

  If you'd like, I can:

  - Add a helpful `.gitignore` and remove `__pycache__` and large media from the repo history.
  - Move Spotify secrets to environment variables and update `app.py` to read them.
  - Add a small GitHub Actions workflow to run tests on push.

  Tell me which of those you'd like next and I'll implement them.

- **Custom Prompts**: Terminal-style prompts with:
  - Current time display [HH:MM:SS]
  - Directory indicator (~/PyCode)
  - Professional formatting

- **Output Labels**: Color-coded execution results
  - 📥 INPUT (green) - User code input
  - 📤 OUTPUT (blue) - Execution results
  - ❌ ERROR (red) - Error messages
  - SVG icons with labels

- **Typography**: Fira Code font with ligatures
  - Professional code display
  - Enhanced readability
  - Syntax highlighting ready

### Core Interpreter Features
- **Full Python Support**: Execute complete Python programs including:
  - Variables and data types
  - Functions and lambda expressions
  - Classes and object-oriented programming
  - Control flow (if/else, loops, etc.)
  - List comprehensions and generators
  - Decorators and context managers
  - Exception handling
  - Import statements and modules

### Web Interface Features
- **Code Editor**: Modern editor with:
  - Line numbers
  - Syntax highlighting
  - Bracket matching
  - Auto-indentation
  - Real-time autocomplete

- **REPL Console**: Interactive Python shell for quick testing
- **Real-time Output**: See execution results immediately
- **Variable Inspector**: View all defined variables and their values
- **Execution History**: Track all your code executions
- **Syntax Validation**: Check code syntax before execution
- **Error Handling**: Clear error messages with smart suggestions
- **Code Templates**: Pre-built examples for common tasks
- **File Operations**: Upload Python files or download your code

## 🚀 Quick Start

### Installation

1. **Clone or download this repository**

2. **Install dependencies**:
```powershell
pip install -r requirements.txt
```

### Running the Application

**Option 1: Using Python directly**
```powershell
python app.py
```

**Option 2: Using Flask command**
```powershell
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"
flask run
```

3. **Open your browser** and navigate to:
```
http://localhost:5000
```

## 📖 Usage Guide

### Code Editor
1. Write your Python code in the main editor
2. Click **Run** button or press `Ctrl+Enter` to execute
3. View output in the Output panel
4. Check variables in the Variables panel

### REPL Console
1. Type Python code in the REPL input at the bottom
2. Press `Enter` to execute
3. See results immediately in the REPL output

### Example Templates
Click any example button to load pre-built code:
- **Hello World**: Basic print and input
- **Fibonacci**: Recursive functions
- **Class Example**: Object-oriented programming
- **Sorting**: Algorithm implementations
- **List Comprehension**: Advanced list operations
- **Decorator**: Function decorators

### Keyboard Shortcuts
- `Ctrl+Shift+P`: Open Command Palette (quick access to all features)
- `Ctrl+Enter`: Run code
- `Shift+Tab`: Show function signature help
- `Escape`: Close popups/palette
- `Arrow Keys`: Navigate in Command Palette
- `Enter`: Execute selected command

### Interactive Features Tutorial
For a comprehensive guide to all interactive features, see:
- **[INTERACTION_FEATURES.md](INTERACTION_FEATURES.md)** - Complete documentation
- **[QUICK_START.md](QUICK_START.md)** - 5-minute tutorial
- **[TESTING_PLAN.md](TESTING_PLAN.md)** - Testing checklist

## 🏗️ Project Structure

```
RandomPI/
├── app.py                  # Flask web application
├── python_interpreter.py   # Core Python interpreter
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── style.css          # Styling
    └── script.js          # Frontend JavaScript
```

## 🔧 API Endpoints

### Execute Code
```
POST /api/execute
Body: { "code": "print('Hello')", "mode": "exec" }
```

### Execute Single Line (REPL)
```
POST /api/execute_line
Body: { "line": "2 + 2" }
```

### Validate Syntax
```
POST /api/validate
Body: { "code": "print('test')" }
```

### Get Variables
```
GET /api/variables
```

### Get History
```
GET /api/history
```

### Reset Interpreter
```
POST /api/reset
```

### Set Variable
```
POST /api/set_variable
Body: { "name": "x", "value": "10" }
```

## 🎨 Features in Detail

### Python Interpreter (`python_interpreter.py`)

The core interpreter class provides:

**Methods**:
- `execute(code, mode)`: Execute Python code
- `execute_line(line)`: Execute single line (REPL-style)
- `validate_syntax(code)`: Check syntax without executing
- `get_variable(name)`: Get variable value
- `set_variable(name, value)`: Set variable value
- `get_all_variables()`: Get all defined variables
- `reset()`: Reset interpreter state
- `get_history()`: Get execution history

**Features**:
- Proper namespace management (global/local)
- Output capturing (stdout/stderr)
- Exception formatting and tracking
- Execution history
- Variable serialization

### Flask Application (`app.py`)

**Session Management**:
- Each browser session gets its own interpreter instance
- Sessions persist across page reloads
- Automatic cleanup

**Security**:
- Session-based isolation
- Secure secret key generation
- Input validation

## 🛠️ Advanced Usage

### Running in Production

For production deployment, use a WSGI server like Gunicorn:

```powershell
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Custom Configuration

Modify `app.py` to change:
- Port number (default: 5000)
- Host (default: 0.0.0.0)
- Debug mode (default: True)

### Adding Custom Examples

Edit `static/script.js` and add to the `examples` object:

```javascript
examples.myexample = `# My Custom Example
print("Hello from custom example!")`;
```

## 📝 Examples

### Simple Calculation
```python
x = 10
y = 20
result = x + y
print(f"Sum: {result}")
```

### Function Definition
```python
def greet(name):
    return f"Hello, {name}!"

message = greet("World")
print(message)
```

### Class Example
```python
class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b

calc = Calculator()
print(calc.add(5, 3))
print(calc.multiply(4, 7))
```

## 🐛 Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Import Errors
Make sure all dependencies are installed:
```powershell
pip install -r requirements.txt
```

### Browser Issues
- Clear browser cache
- Try a different browser
- Check browser console for JavaScript errors

## 🔒 Security Considerations

**Important**: This interpreter executes arbitrary Python code. For production use:

1. **Sandboxing**: Implement code sandboxing
2. **Resource Limits**: Set memory and CPU limits
3. **Authentication**: Add user authentication
4. **Input Validation**: Sanitize all inputs
5. **Timeout**: Implement execution timeouts
6. **Restricted Imports**: Limit dangerous module imports

## 📚 Documentation

This project includes comprehensive documentation:

- **[README.md](README.md)** (this file) - Main project overview and setup guide

- **[DELIGHT_FEATURES.md](DELIGHT_FEATURES.md)** - Phase 4 delight & micro-interactions (NEW!)
  - Animated Feedback
  - Enhanced Toast Notifications
  - Welcome Screen
  - Visual Success/Error Cues
  - Button Ripple Effects
  - Progress Indicators
  - Usage examples and customization

- **[VISUALIZATION_FEATURES.md](VISUALIZATION_FEATURES.md)** - Phase 3 features documentation
  - Enhanced Variable Explorer
  - Execution Stats Panel
  - Command History Panel
  - Output Renderer
  - Usage examples and technical details

- **[INTERACTION_FEATURES.md](INTERACTION_FEATURES.md)** - Phase 2 interactive features
  - Autocomplete & IntelliSense
  - Command Palette
  - Smart Error Hints
  - Hover Documentation
  - Signature Help
  - Keyboard Shortcuts
  - Technical implementation details
  - 350+ lines of detailed documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick start guide
  - 5-minute tutorial
  - Essential shortcuts
  - Tips & tricks
  - Troubleshooting

- **[TESTING_PLAN.md](TESTING_PLAN.md)** - Comprehensive testing checklist
  - 75+ test cases
  - Cross-browser testing
  - Performance tests
  - Edge case scenarios

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation details
  - Feature checklist
  - Code statistics
  - Implementation timeline

## 🤝 Contributing

Feel free to enhance this project! Areas for improvement:
- Add more function documentation to hover system
- Implement variable value previews
- Add code snippets library
- Support for custom keyboard shortcuts
- Expand autocomplete with import suggestions
- Add code formatting (PEP 8)
- Implement linting integration
- Multi-file project support
- Debugger integration
- Package manager integration

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Built with Flask web framework
- Tailwind CSS for modern styling
- Fira Code font for code typography
- Python's AST module for syntax validation
- Inspired by VSCode's interactive features

## 📞 Support

For issues or questions:
1. Check the troubleshooting section in documentation
2. Review QUICK_START.md for common issues
3. Check INTERACTION_FEATURES.md for feature details
4. Test with the provided examples
5. Open browser console to check for JavaScript errors

## 🎯 Version History

- **v2.2.0** (December 2024) - Delight & Micro-Interactions Update ✨
  - Welcome Screen with animated logo and shortcuts
  - Enhanced Toast Notifications with progress bars
  - Command Execution Progress Bar with gradient
  - Success/Error Visual Cues (checkmarks, error flash)
  - Button Ripple Effects (Material Design)
  - 15+ CSS animations (focus pulse, shake, flicker, etc.)
  - Input focus glow animations
  - Long command completion notifications
  - ~500 lines of CSS animations
  - ~200 lines of JavaScript
  - Complete Phase 4 documentation (DELIGHT_FEATURES.md)

- **v2.1.0** (December 2024) - Visualization & Productivity Update
  - Enhanced Variable Explorer with expandable objects
  - Execution Stats Panel (time, memory, count)
  - Command History Panel with search and re-run
  - Output Renderer foundation (ready for DataFrames, charts, JSON)
  - ~350 lines of new code
  - Complete Phase 3 documentation

- **v2.0.0** (December 2024) - Interactive Features Update
  - Added Autocomplete & IntelliSense
  - Added Command Palette (Ctrl+Shift+P)
  - Added Smart Error Hints
  - Added Hover Documentation
  - Added Signature Help (Shift+Tab)
  - Added comprehensive keyboard shortcuts
  - ~997 lines of new code
  - Complete documentation suite

- **v1.0.0** - Visual Design Update
  - 5 professional themes
  - Custom terminal prompts
  - Color-coded output labels
  - Fira Code typography

---

**Happy Coding! 🎉✨**
