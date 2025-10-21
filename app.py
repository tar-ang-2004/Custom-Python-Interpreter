"""
Flask Web Application for Python Interpreter
Provides a web interface to write and execute Python code
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from python_interpreter import PythonInterpreter
import ast
import builtins as _builtins
import secrets
import os
from datetime import datetime
import requests
import base64
import time

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Use a single global interpreter instead of per-session (simpler and works better)
global_interpreter = PythonInterpreter()

# Store interpreters per session (backup approach)
interpreters = {}


def get_interpreter():
    """Get or create an interpreter for the current session."""
    # For now, use a single global interpreter to avoid session issues
    # This means all users share the same interpreter, but it works reliably
    return global_interpreter
    
    # Original per-session code (commented out for now):
    # session_id = session.get('session_id')
    # if not session_id:
    #     session_id = secrets.token_hex(16)
    #     session['session_id'] = session_id
    # if session_id not in interpreters:
    #     interpreters[session_id] = PythonInterpreter()
    # return interpreters[session_id]


@app.route('/')
def index():
    """Render the advanced poontHER version."""
    # If Spotify redirected here with an authorization code, exchange it for tokens.
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        # Let the page render and the frontend show status; avoid failing the whole app.
        return render_template('advanced.html')
    if code:
        try:
            url = 'https://accounts.spotify.com/api/token'
            data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': SPOTIFY_REDIRECT_URI,
                'client_id': SPOTIFY_CLIENT_ID,
                'client_secret': SPOTIFY_CLIENT_SECRET
            }
            resp = requests.post(url, data=data, timeout=10)
            if resp.status_code == 200:
                j = resp.json()
                tok = {
                    'access_token': j.get('access_token'),
                    'refresh_token': j.get('refresh_token'),
                    'expires_at': time.time() + int(j.get('expires_in', 3600))
                }
                session['spotify'] = tok
            else:
                app.logger.warning('Spotify token exchange failed on / redirect: %s %s', resp.status_code, resp.text)
        except Exception as e:
            app.logger.exception('Spotify token exchange exception on / redirect')
        # Redirect to clean URL (remove code param)
        return redirect(url_for('index'))

    return render_template('advanced.html')


@app.route('/modern')
def modern_page():
    """Render the modern Tailwind CSS version."""
    return render_template('modern.html')


@app.route('/simple')
def simple_page():
    """Render the simple interpreter page (working version)."""
    return render_template('simple.html')


@app.route('/original')
def original_page():
    """Render the original CodeMirror version."""
    return render_template('index.html')


@app.route('/test')
def test_page():
    """Render a simple test page."""
    return render_template('test.html')


@app.route('/api/execute', methods=['POST'])
def execute_code():
    """
    Execute Python code and return results.
    
    Expected JSON:
        {
            "code": "Python code to execute",
            "mode": "exec" or "eval" (optional, defaults to "exec")
        }
    
    Returns JSON:
        {
            "success": bool,
            "output": str,
            "error": str,
            "result": any,
            "variables": dict,
            "timestamp": str
        }
    """
    try:
        data = request.get_json()
        code = data.get('code', '')
        mode = data.get('mode', 'exec')
        
        print(f"\n[EXECUTE] Received code:\n{code}\n")  # Debug logging
        
        if not code:
            return jsonify({
                'success': False,
                'error': 'No code provided',
                'output': '',
                'result': None,
                'variables': {},
                'timestamp': datetime.now().isoformat()
            })
        
        interpreter = get_interpreter()
        print(f"[EXECUTE] Using interpreter: {id(interpreter)}")  # Debug logging
        print(f"[EXECUTE] Current variables before: {list(interpreter.get_all_variables().keys())}")  # Debug
        
        # Handle input values if provided
        input_values = data.get('inputs', [])
        if input_values:
            interpreter.set_input_values(input_values)
            print(f"[EXECUTE] Set input values: {input_values}")  # Debug
        
        result = interpreter.execute(code, mode=mode)
        result['timestamp'] = datetime.now().isoformat()
        
        print(f"[EXECUTE] Success: {result['success']}")  # Debug logging
        print(f"[EXECUTE] Output: {result['output'][:100] if result['output'] else 'None'}")  # Debug
        print(f"[EXECUTE] Variables after: {list(result['variables'].keys())}\n")  # Debug
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'output': '',
            'result': None,
            'variables': {},
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/execute_line', methods=['POST'])
def execute_line():
    """
    Execute a single line of Python code (REPL-style).
    
    Expected JSON:
        {
            "line": "Single line of Python code"
        }
    
    Returns JSON: Same as /api/execute
    """
    try:
        data = request.get_json()
        line = data.get('line', '')
        
        interpreter = get_interpreter()
        result = interpreter.execute_line(line)
        result['timestamp'] = datetime.now().isoformat()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'output': '',
            'result': None,
            'variables': {},
            'timestamp': datetime.now().isoformat()
        }), 500




@app.route('/api/provide_input', methods=['POST'])
def provide_input():
    """
    Provide input value to continue execution.
    
    Expected JSON:
        {
            "value": "Input value"
        }
    
    Returns JSON: Same as /api/execute
    """
    try:
        data = request.get_json()
        value = data.get('value', '')
        
        interpreter = get_interpreter()
        result = interpreter.provide_input(value)
        result['timestamp'] = datetime.now().isoformat()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'output': '',
            'result': None,
            'variables': {},
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/validate', methods=['POST'])
def validate_syntax():
    """
    Validate Python code syntax without executing.
    
    Expected JSON:
        {
            "code": "Python code to validate"
        }
    
    Returns JSON:
        {
            "valid": bool,
            "error": str or null
        }
    """
    try:
        data = request.get_json()
        code = data.get('code', '')
        
        interpreter = get_interpreter()
        is_valid, error = interpreter.validate_syntax(code)
        
        return jsonify({
            'valid': is_valid,
            'error': error
        })
    
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': f'Server error: {str(e)}'
        }), 500


@app.route('/api/validate_lines', methods=['POST'])
def validate_lines():
    """
    Validate multiple lines of Python code (useful for per-line checks in the editor).

    Expected JSON:
        { "lines": ["line1", "line2", ...] }

    Returns JSON:
        { "results": [{"valid": True/False/null, "error": str or null}, ...] }
        - valid: True if syntax valid, False if invalid, null if line is empty/ignored
        - error: error message for invalid lines
    """
    try:
        data = request.get_json() or {}
        lines = data.get('lines', [])
        interpreter = get_interpreter()

        results = []

        # We'll accumulate names defined by earlier lines (in-document symbols).
        # Start with current interpreter variables so previously executed code counts.
        defined_names = set(interpreter.get_all_variables().keys())
        builtin_names = set(dir(_builtins))

        # Helper to collect defined targets from an AST node
        def collect_defined(node):
            names = set()
            for n in ast.walk(node):
                if isinstance(n, ast.Assign):
                    for t in n.targets:
                        for idn in extract_target_names(t):
                            names.add(idn)
                elif isinstance(n, ast.AnnAssign):
                    for idn in extract_target_names(n.target):
                        names.add(idn)
                elif isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    names.add(n.name)
                elif isinstance(n, ast.Import):
                    for alias in n.names:
                        names.add(alias.asname or alias.name.split('.')[0])
                elif isinstance(n, ast.ImportFrom):
                    for alias in n.names:
                        names.add(alias.asname or alias.name)
                elif isinstance(n, ast.For):
                    for idn in extract_target_names(n.target):
                        names.add(idn)
                elif isinstance(n, ast.With):
                    for item in getattr(n, 'items', []):
                        if getattr(item, 'optional_vars', None) is not None:
                            for idn in extract_target_names(item.optional_vars):
                                names.add(idn)
            return names

        # Helper to extract names from assignment targets (handles tuples, names, attributes)
        def extract_target_names(target):
            out = []
            if isinstance(target, ast.Name):
                out.append(target.id)
            elif isinstance(target, (ast.Tuple, ast.List)):
                for elt in target.elts:
                    out.extend(extract_target_names(elt))
            elif isinstance(target, ast.Attribute):
                # attribute assignment (obj.attr) - don't introduce a plain name
                pass
            return out

        for line in lines:
            # Treat purely empty/whitespace lines as ignored
            if not isinstance(line, str) or line.strip() == '':
                results.append({'valid': None, 'error': None})
                continue

            # Validate syntax first
            try:
                is_valid, error = interpreter.validate_syntax(line)
            except Exception as e:
                is_valid, error = False, str(e)

            # If syntax is OK, do a lightweight semantic check for undefined names
            # using the document-level defined_names accumulated so far.
            if is_valid:
                try:
                    tree = ast.parse(line)
                    used_names = set()

                    class NameCollector(ast.NodeVisitor):
                        def visit_Name(self, node):
                            if isinstance(node.ctx, ast.Load):
                                used_names.add(node.id)

                    NameCollector().visit(tree)

                    undefined = [n for n in used_names if n not in builtin_names and n not in defined_names]

                    if undefined:
                        undef = undefined[0]
                        is_valid = False
                        error = f"NameError: name '{undef}' is not defined"
                except Exception:
                    pass

            results.append({'valid': is_valid, 'error': error})

            # After checking this line, add any defined names from it so later lines see them
            try:
                tree = ast.parse(line)
                defs = collect_defined(tree)
                defined_names.update(defs)
            except Exception:
                # ignore parsing errors here for definition collection
                pass

        return jsonify({'results': results})

    except Exception as e:
        return jsonify({'results': [], 'error': f'Server error: {str(e)}'}), 500


@app.route('/api/variables', methods=['GET'])
def get_variables():
    """
    Get all variables in the current session's namespace.
    
    Returns JSON:
        {
            "variables": dict
        }
    """
    try:
        interpreter = get_interpreter()
        variables = interpreter.get_all_variables()
        
        # Serialize variables
        serialized = {
            k: interpreter._serialize_value(v)
            for k, v in variables.items()
        }
        
        return jsonify({
            'variables': serialized
        })
    
    except Exception as e:
        return jsonify({
            'variables': {},
            'error': f'Server error: {str(e)}'
        }), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Get execution history for the current session.
    
    Returns JSON:
        {
            "history": list
        }
    """
    try:
        interpreter = get_interpreter()
        history = interpreter.get_history()
        
        return jsonify({
            'history': history
        })
    
    except Exception as e:
        return jsonify({
            'history': [],
            'error': f'Server error: {str(e)}'
        }), 500


@app.route('/api/reset', methods=['POST'])
def reset_interpreter():
    """
    Reset the interpreter (clear all variables and history).
    
    Returns JSON:
        {
            "success": bool,
            "message": str
        }
    """
    try:
        interpreter = get_interpreter()
        interpreter.reset()
        
        return jsonify({
            'success': True,
            'message': 'Interpreter reset successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


@app.route('/api/set_variable', methods=['POST'])
def set_variable():
    """
    Set a variable in the interpreter namespace.
    
    Expected JSON:
        {
            "name": "variable_name",
            "value": "Python expression that evaluates to the value"
        }
    
    Returns JSON:
        {
            "success": bool,
            "message": str
        }
    """
    try:
        data = request.get_json()
        name = data.get('name', '')
        value_expr = data.get('value', '')
        
        if not name:
            return jsonify({
                'success': False,
                'message': 'Variable name is required'
            })
        
        interpreter = get_interpreter()
        
        # Execute the value expression to get the actual value
        result = interpreter.execute(f"{name} = {value_expr}")
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f'Variable {name} set successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': result['error']
            })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'active_sessions': len(interpreters)
    })


# ============================================
# Spotify integration
# ============================================
SPOTIFY_CLIENT_ID = '8917fa4a3eef438c9a7b2cbf3cd597b2'
SPOTIFY_CLIENT_SECRET = '3977f4db4c57497784a9ba6c254ae6ef'
SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5000/'
SPOTIFY_SCOPE = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

def _spotify_auth_header():
    token = session.get('spotify', {})
    access = token.get('access_token')
    if not access:
        return {}
    return {'Authorization': f'Bearer {access}'}

def _spotify_token_is_expired(tok):
    if not tok: return True
    exp = tok.get('expires_at')
    if not exp: return True
    return time.time() > exp - 30

def _spotify_refresh_token():
    tok = session.get('spotify')
    if not tok or not tok.get('refresh_token'):
        return False
    try:
        url = 'https://accounts.spotify.com/api/token'
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': tok['refresh_token']
        }
        auth = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
        headers = {'Authorization': f'Basic {auth}'}
        resp = requests.post(url, data=data, headers=headers, timeout=10)
        if resp.status_code != 200:
            print('Spotify refresh failed', resp.status_code, resp.text)
            return False
        j = resp.json()
        # update session token
        tok['access_token'] = j.get('access_token')
        expires_in = j.get('expires_in', 3600)
        tok['expires_at'] = time.time() + int(expires_in)
        # Spotify may return a new refresh_token sometimes
        if j.get('refresh_token'):
            tok['refresh_token'] = j.get('refresh_token')
        session['spotify'] = tok
        return True
    except Exception as e:
        print('Spotify refresh exception', e)
        return False


@app.route('/spotify/login')
def spotify_login():
    # Redirect user to Spotify authorization page (server-side redirect)
    params = {
        'client_id': SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'scope': SPOTIFY_SCOPE,
        'show_dialog': 'true'
    }
    from urllib.parse import urlencode
    auth_url = 'https://accounts.spotify.com/authorize?' + urlencode(params)
    return redirect(auth_url)


@app.route('/spotify/callback')
def spotify_callback():
    # This route can be used if you want Spotify to redirect here directly.
    # In our flow the JS can open /spotify/login which returns the URL; the app
    # can also handle a direct redirect here (but advanced.html uses / as redirect URI).
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return jsonify({'success': False, 'error': error})
    if not code:
        return jsonify({'success': False, 'error': 'No code provided'})
    # Exchange code for tokens
    try:
        url = 'https://accounts.spotify.com/api/token'
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': SPOTIFY_REDIRECT_URI,
            'client_id': SPOTIFY_CLIENT_ID,
            'client_secret': SPOTIFY_CLIENT_SECRET
        }
        resp = requests.post(url, data=data, timeout=10)
        if resp.status_code != 200:
            return jsonify({'success': False, 'status': resp.status_code, 'body': resp.text})
        j = resp.json()
        tok = {
            'access_token': j.get('access_token'),
            'refresh_token': j.get('refresh_token'),
            'expires_at': time.time() + int(j.get('expires_in', 3600))
        }
        session['spotify'] = tok
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/spotify/status', methods=['GET'])
def spotify_status():
    tok = session.get('spotify')
    if not tok:
        return jsonify({'authenticated': False})
    if _spotify_token_is_expired(tok):
        ok = _spotify_refresh_token()
        if not ok:
            return jsonify({'authenticated': False})
    # query current playback
    try:
        headers = _spotify_auth_header()
        resp = requests.get('https://api.spotify.com/v1/me/player', headers=headers, timeout=8)
        if resp.status_code == 204:
            return jsonify({'authenticated': True, 'playing': False, 'device': None})
        if resp.status_code == 200:
            return jsonify({'authenticated': True, 'player': resp.json()})
        return jsonify({'authenticated': True, 'error': resp.text}), 200
    except Exception as e:
        return jsonify({'authenticated': True, 'error': str(e)}), 500


@app.route('/api/spotify/search', methods=['GET'])
def spotify_search():
    q = request.args.get('q', '')
    t = request.args.get('type', 'track')
    if not q:
        return jsonify({'results': []})
    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    params = {'q': q, 'type': t, 'limit': 20}
    try:
        resp = requests.get('https://api.spotify.com/v1/search', headers=headers, params=params, timeout=8)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/devices', methods=['GET'])
def spotify_devices():
    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    try:
        resp = requests.get('https://api.spotify.com/v1/me/player/devices', headers=headers, timeout=8)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/play', methods=['PUT'])
def spotify_play():
    data = request.get_json() or {}
    uri = data.get('uri')
    device_id = data.get('device_id')
    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    headers['Content-Type'] = 'application/json'
    params = {}
    if device_id: params['device_id'] = device_id
    payload = {}
    if uri:
        # If it's a track/album/playlist URI, use uris or context_uri
        if uri.startswith('spotify:track:'):
            payload['uris'] = [uri]
        else:
            payload['context_uri'] = uri
    try:
        resp = requests.put('https://api.spotify.com/v1/me/player/play', headers=headers, params=params, json=payload, timeout=8)
        return jsonify({'status': resp.status_code, 'body': resp.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/pause', methods=['PUT'])
def spotify_pause():
    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    # allow optional device_id (query param or JSON body)
    device_id = request.args.get('device_id') or (request.get_json() or {}).get('device_id')
    params = {}
    if device_id: params['device_id'] = device_id
    try:
        resp = requests.put('https://api.spotify.com/v1/me/player/pause', headers=headers, params=params, timeout=8)
        return jsonify({'status': resp.status_code, 'body': resp.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/transfer', methods=['PUT'])
def spotify_transfer():
    """Transfer playback to one or more devices. Expects JSON { device_ids: [id], play: bool }
    Proxies to Spotify's PUT /v1/me/player endpoint.
    """
    data = request.get_json() or {}
    device_ids = data.get('device_ids') or []
    play = bool(data.get('play', False))

    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    headers['Content-Type'] = 'application/json'
    payload = {'device_ids': device_ids, 'play': play}
    try:
        resp = requests.put('https://api.spotify.com/v1/me/player', headers=headers, json=payload, timeout=8)
        return jsonify({'status': resp.status_code, 'body': resp.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/seek', methods=['PUT'])
def spotify_seek():
    """Seek playback to a position (position_ms) on current device or specified device_id.
    Expects JSON: { position_ms: int, device_id: optional }
    Proxies to PUT /v1/me/player/seek?position_ms=...&device_id=...
    """
    data = request.get_json() or {}
    pos = data.get('position_ms')
    device_id = data.get('device_id')

    if pos is None:
        return jsonify({'error': 'position_ms required'}), 400

    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()

    headers = _spotify_auth_header()
    params = {'position_ms': int(pos)}
    if device_id:
        params['device_id'] = device_id
    try:
        resp = requests.put('https://api.spotify.com/v1/me/player/seek', headers=headers, params=params, timeout=8)
        return jsonify({'status': resp.status_code, 'body': resp.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/next', methods=['POST'])
def spotify_next():
    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    # allow optional device_id
    device_id = request.args.get('device_id') or (request.get_json() or {}).get('device_id')
    params = {}
    if device_id: params['device_id'] = device_id
    try:
        resp = requests.post('https://api.spotify.com/v1/me/player/next', headers=headers, params=params, timeout=8)
        return jsonify({'status': resp.status_code, 'body': resp.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/spotify/previous', methods=['POST'])
def spotify_previous():
    tok = session.get('spotify')
    if not tok:
        return jsonify({'error': 'not_authenticated'}), 401
    if _spotify_token_is_expired(tok):
        _spotify_refresh_token()
    headers = _spotify_auth_header()
    device_id = request.args.get('device_id') or (request.get_json() or {}).get('device_id')
    params = {}
    if device_id: params['device_id'] = device_id
    try:
        resp = requests.post('https://api.spotify.com/v1/me/player/previous', headers=headers, params=params, timeout=8)
        return jsonify({'status': resp.status_code, 'body': resp.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    print("=" * 60)
    print("Python Interpreter Web Application")
    print("=" * 60)
    print("Starting Flask server...")
    print("Open your browser and navigate to: http://localhost:5000")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
