/**
 * poontHER - Advanced JavaScript Controller
 * Comprehensive Python Interpreter with Modern Features
 */

// ============================================
// Global State Management
// ============================================
const AppState = {
    editor: null,
    terminal: null,
    terminalFitAddon: null,
    terminalActive: false,
    lastPromptText: null,
    lastInputValue: undefined,
    lastInputType: null,
    executionCount: 0,
    sessionId: generateSessionId(),
    commandHistory: [],
    replHistory: [],
    historyIndex: -1,
    replHistoryIndex: -1,
    currentMode: 'editor', // 'editor' or 'repl'
    currentFilename: 'untitled.py',
    settings: {
        theme: 'dark',
        editorTheme: 'monokai',
        editorFontSize: 14,
        consoleFontSize: 13,
        lineNumbers: true,
        autoComplete: true,
        soundEnabled: false
    },
    executionStats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        totalTime: 0
    }
};

// View button modes (global so all handlers share the same state)
const VIEW_MODES = ['View', 'Classes', 'Variables', 'Functions', 'Decorators'];
// Short labels shown on the view button when cycling
const VIEW_LABELS = {
    'View': 'view',
    'Classes': 'cls',
    'Functions': 'fns',
    'Variables': 'vars',
    'Decorators': 'decs'
};
let currentViewModeIndex = 0; // 0 => 'View'

function getCurrentViewMode() { return VIEW_MODES[currentViewModeIndex]; }

function renderViewButtonLabel() {
    const btn = document.getElementById('viewOutlineBtn');
    if (!btn) return;
    const text = getCurrentViewMode();
    const short = VIEW_LABELS[text] || text.toLowerCase();
    btn.textContent = short;
    btn.title = text + ' Outline';
}


// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing poontHER...');
    
    try {
        loadSettings();
        initializeEditor();
        initializeTerminal();
        initializeSplitPanels();
        setupEventListeners();
        setupKeyboardShortcuts();
        loadCommandHistory();
        updateSessionInfo();
        
    showToast('success', 'Welcome!', 'poontHER is ready to use.');
        console.log('✅ Initialization complete!');
    // Ensure the editor's current content is represented as a tab
    ensureInitialTab();
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('error', 'Error', 'Failed to initialize IDE: ' + error.message);
    }
    // Create a reusable confirm modal and append to body if not present
    if (!document.getElementById('confirmModal')) {
        const modal = document.createElement('div');
        modal.id = 'confirmModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="confirmModalTitle">Confirm</h2>
                    <button id="confirmModalClose" class="close-btn">&times;</button>
                </div>
                <div class="modal-body" id="confirmModalBody"></div>
                <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="confirmCancelBtn" class="btn btn-secondary">Cancel</button>
                    <button id="confirmOkBtn" class="btn btn-primary">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Hook up close/cancel
        modal.querySelector('#confirmModalClose').addEventListener('click', () => { modal.classList.remove('active'); });
        modal.querySelector('#confirmCancelBtn').addEventListener('click', () => { modal.classList.remove('active'); });
    }

    // Helper: animate the Run button falling to the status bar then bouncing back.
    function animateRunButtonToStatus() {
        try {
            const runBtn = document.getElementById('runCodeBtn');
            const statusBar = document.querySelector('.status-bar');
            if (!runBtn || !statusBar) return;

            // Clone current transform/position so the animation uses absolute coordinates
            const btnRect = runBtn.getBoundingClientRect();
            const statusRect = statusBar.getBoundingClientRect();

            // Compute vector from button center to status bar center
            const btnCenterX = btnRect.left + btnRect.width / 2;
            const btnCenterY = btnRect.top + btnRect.height / 2;
            const statusCenterX = statusRect.left + statusRect.width / 2;
            const statusCenterY = statusRect.top + statusRect.height / 2;

            const dx = statusCenterX - btnCenterX;
            const dy = statusCenterY - btnCenterY;

            // Set CSS variables for the animation (allow CSS to use them)
            runBtn.style.setProperty('--fall-x', `${dx}px`);
            runBtn.style.setProperty('--fall-y', `${dy}px`);

            // Add class to trigger CSS animation
            runBtn.classList.add('run-fall');

            // Remove class after animation ends to restore normal behavior
            const cleanup = () => {
                runBtn.classList.remove('run-fall');
                runBtn.style.removeProperty('--fall-x');
                runBtn.style.removeProperty('--fall-y');
                runBtn.removeEventListener('animationend', onEnd);
            };
            const onEnd = () => cleanup();
            runBtn.addEventListener('animationend', onEnd);
        } catch (e) {
            console.warn('Run button animation failed', e);
        }
    }
});

// ============================================
// CodeMirror Editor Setup
// ============================================
function initializeEditor() {
    const textarea = document.getElementById('codeEditor');
    // Create breadcrumb container above the editor if not present
    let breadcrumb = document.getElementById('editorBreadcrumb');
    if (!breadcrumb) {
        breadcrumb = document.createElement('div');
        breadcrumb.id = 'editorBreadcrumb';
        breadcrumb.className = 'editor-breadcrumb';
        const leftPanel = document.getElementById('leftPanel') || document.body;
        // insert at top of left panel, before the editor wrapper if possible
        const editorWrapper = document.querySelector('.editor-wrapper') || textarea.parentElement;
        if (editorWrapper && editorWrapper.parentElement) editorWrapper.parentElement.insertBefore(breadcrumb, editorWrapper);
        else leftPanel.insertBefore(breadcrumb, leftPanel.firstChild);
    }
    
    AppState.editor = CodeMirror.fromTextArea(textarea, {
        mode: 'python',
        theme: AppState.settings.editorTheme,
        lineNumbers: AppState.settings.lineNumbers,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        foldGutter: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: true,
        styleActiveLine: true,
        extraKeys: {
            'Shift-Enter': () => executeCode(),
            'Ctrl-S': () => { saveCode(); return false; },
            'Ctrl-L': () => { clearConsole(); return false; },
            'Ctrl-N': () => { newSession(); return false; },
            'Ctrl-/': 'toggleComment',
            'Ctrl-Space': 'autocomplete',
            'Ctrl-Q': (cm) => {
                try {
                    // prefer indent-based folding for Python
                    const rangeFinder = (CodeMirror && CodeMirror.fold && CodeMirror.fold.indent) ? CodeMirror.fold.indent : null;
                    if (typeof CodeMirror.foldCode === 'function') {
                        if (rangeFinder) CodeMirror.foldCode(cm, cm.getCursor(), {rangeFinder: rangeFinder});
                        else CodeMirror.foldCode(cm, cm.getCursor());
                    }
                } catch (e) { /* ignore if folding addons missing */ }
            }
        }
    });
    
    // Set initial code
    AppState.editor.setValue(`# Welcome to poontHER! 🐍
# Press Shift+Enter to run your code

print("Hello, World!")
print("Type %help for magic commands")
`);
    // Immediately ensure there's a tab representing this initial content.
    // This synchronous creation guarantees the first open file is always visible
    // in the tabs strip even if later initialization steps race.
    try {
        if (Tabs.list.length === 0) {
            const initialName = AppState.currentFilename || 'untitled.py';
            const initialContent = (AppState.editor && typeof AppState.editor.getValue === 'function') ? AppState.editor.getValue() : '';
            // create a tab and activate it
            const id = 'tab_' + Math.random().toString(36).slice(2,9);
            Tabs.list.push({ id: id, name: initialName, content: initialContent });
            Tabs.activeId = id;
            renderTabs();
            // Do not call loadTabContent here to avoid resetting any later boot state,
            // but ensure file display reflects the name.
            const fileNameEl = document.getElementById('fileNameDisplay');
            if (fileNameEl) fileNameEl.textContent = initialName;
        }
    } catch (e) { console.warn('failed to create initial tab synchronously:', e); }
    
    // Update cursor position
    AppState.editor.on('cursorActivity', updateCursorInfo);

    // ===== Line-status (lint-like) gutter coloring =====
    // Define keywords for quick heuristic scanning. These can be extended later
    // or sourced from a real linter output. Case-insensitive match.
    const ERROR_KEYWORDS = ['syntaxerror', 'syntax error', 'error', 'exception', 'nameerror', 'typeerror', 'indenterror', 'taberror', 'wrong'];
    const WARNING_KEYWORDS = ['warning', 'deprecated', 'todo', 'fixme', 'note'];

    // Common Python builtins to help detect likely-typoed builtin names like `intt` -> `int`
    const PY_BUILTINS = ['int','float','str','list','dict','set','tuple','len','range','open','input','print','bool','sum','min','max','sorted','reversed','enumerate','map','filter','zip','type','isinstance'];

    // small Levenshtein distance (optimized for short strings)
    function levenshtein(a, b) {
        if (a === b) return 0;
        const la = a.length, lb = b.length;
        if (la === 0) return lb;
        if (lb === 0) return la;
        const v0 = new Array(lb + 1).fill(0);
        const v1 = new Array(lb + 1).fill(0);
        for (let j = 0; j <= lb; j++) v0[j] = j;
        for (let i = 0; i < la; i++) {
            v1[0] = i + 1;
            const ai = a.charAt(i);
            for (let j = 0; j < lb; j++) {
                const cost = ai === b.charAt(j) ? 0 : 1;
                v1[j+1] = Math.min(v1[j] + 1, v0[j+1] + 1, v0[j] + cost);
            }
            for (let j = 0; j <= lb; j++) v0[j] = v1[j];
        }
        return v0[lb];
    }

    let _gutterUpdateTimer = null;

    function getLineStatus(text) {
        if (!text) return 'ok';
        const raw = String(text);
        const t = raw.toLowerCase();
        // First, obvious keyword matches
        for (const k of ERROR_KEYWORDS) {
            if (t.indexOf(k) !== -1) return 'error';
        }
        for (const k of WARNING_KEYWORDS) {
            if (t.indexOf(k) !== -1) return 'warning';
        }

        // Heuristic: detect likely-typoed builtin usage on right-hand side of assignment
        // Examples: `a = intt` or `a = intt(5)` -> treat as error (typo of 'int')
        try {
            const assignMatch = raw.match(/^[\s\w\[\]\.,'"\(\)\+\-]*=\s*(.+)$/); // capture RHS
            if (assignMatch && assignMatch[1]) {
                let rhs = assignMatch[1].trim();
                // strip trailing comments
                rhs = rhs.split('#')[0].trim();
                // if it's a function call like foo(...), take the name before '('
                const callMatch = rhs.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
                if (callMatch) rhs = callMatch[1];
                // if RHS is a single identifier (no dots, no operators), check builtin closeness
                const idMatch = rhs.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
                if (idMatch) {
                    const id = idMatch[1];
                    const low = id.toLowerCase();
                    for (const b of PY_BUILTINS) {
                        if (b === low) return 'ok';
                        const d = levenshtein(low, b);
                        if (d <= 1) {
                            // If it's a single-character insertion that duplicates a letter
                            // (e.g. `intt` -> `int`) treat as stronger error. Otherwise
                            // treat single-edit differences as warnings (e.g. `inpu` -> `input`).
                            if (d === 1) {
                                // detect duplicate-letter insertion: if `low` is longer than `b`
                                // and removing one of the adjacent duplicate characters equals b
                                if (low.length > b.length) {
                                    let isDupInsert = false;
                                    for (let k = 0; k < low.length - 1; k++) {
                                        if (low[k] === low[k+1]) {
                                            const candidate = low.slice(0, k) + low.slice(k+1);
                                            if (candidate === b) { isDupInsert = true; break; }
                                        }
                                    }
                                    if (isDupInsert) return 'error';
                                }
                                // otherwise mark as warning
                                return 'warning';
                            }
                            // distance 0 already handled; distance >1 treated as ok for now
                        }
                    }
                }
            }
        } catch (e) {
            /* ignore heuristic failures */
        }

        return 'ok';
    }

    function applyLineGutterClasses() {
        try {
            const doc = AppState.editor.getDoc();
            const last = doc.lastLine();
            for (let i = 0; i <= last; i++) {
                const handle = doc.getLineHandle(i);
                if (!handle) continue;
                // remove any previous classes
                AppState.editor.removeLineClass(handle, 'gutter', 'cm-line-error');
                AppState.editor.removeLineClass(handle, 'gutter', 'cm-line-warning');
                AppState.editor.removeLineClass(handle, 'gutter', 'cm-line-ok');

                const lineText = doc.getLine(i) || '';
                // Prefer explicit inline markers (set via markText) — if the
                // highlighter marked a token as error/warning, use that to
                // decide the gutter color. This keeps gutter in sync with
                // visible inline highlights like 'cm-highlight-error'.
                let status = null;
                try {
                    const marks = AppState.editor.findMarks({line: i, ch: 0}, {line: i, ch: Math.max(0, lineText.length)});
                    if (marks && marks.length) {
                        for (let mi = 0; mi < marks.length; mi++) {
                            const m = marks[mi];
                            // className is commonly present for markText markers
                            const cls = m.className || (m.__marker && m.__marker.className) || '';
                            if (cls && cls.indexOf('cm-highlight-error') !== -1) { status = 'error'; break; }
                            if (!status && cls && cls.indexOf('cm-highlight-warning') !== -1) status = 'warning';
                        }
                    }
                } catch (e) {
                    // ignore marker inspection failures
                }
                if (!status) status = getLineStatus(lineText);
                if (status === 'error') {
                    AppState.editor.addLineClass(handle, 'gutter', 'cm-line-error');
                } else if (status === 'warning') {
                    AppState.editor.addLineClass(handle, 'gutter', 'cm-line-warning');
                } else {
                    AppState.editor.addLineClass(handle, 'gutter', 'cm-line-ok');
                }
            }
        } catch (e) {
            console.warn('Failed to update line gutter classes', e);
        }
    }

    // Debounced updates on content change for performance
    AppState.editor.on('change', () => {
        if (_gutterUpdateTimer) clearTimeout(_gutterUpdateTimer);
        _gutterUpdateTimer = setTimeout(() => {
            applyLineGutterClasses();
        }, 220);
    });

    // Initial pass
    setTimeout(() => applyLineGutterClasses(), 50);

    // Breadcrumb: show filename > class/function > function based on cursor
    function parseStructure(content) {
        // simple parser: find lines starting with optional spaces then 'class' or 'def'
        const lines = content.split('\n');
        const elems = [];
        const stack = [];
        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i];
            const m = raw.match(/^(\s*)(class|def)\s+([A-Za-z0-9_]+)\s*[:(]/);
            if (m) {
                const indent = m[1].length;
                const kind = m[2];
                const name = m[3];
                // pop stack to current indent
                while (stack.length && stack[stack.length-1].indent >= indent) stack.pop();
                const entry = { kind, name, line: i, indent };
                stack.push(entry);
                elems.push(entry);
            }
        }
        return elems;
    }

    function updateBreadcrumb() {
        try {
            const content = AppState.editor.getValue();
            const structure = parseStructure(content);
            const cursor = AppState.editor.getCursor();
            const cursorLine = cursor.line;

            // Build an indentation-based ancestor stack up to the cursor line.
            // This ensures we only show nested parents (filename > parent > child)
            const ancestorStack = [];
            for (let i = 0; i < structure.length; i++) {
                const s = structure[i];
                // stop after we've passed the cursor line
                if (s.line > cursorLine) break;
                // pop any entries that are at or deeper than current indent
                while (ancestorStack.length && ancestorStack[ancestorStack.length - 1].indent >= s.indent) {
                    ancestorStack.pop();
                }
                ancestorStack.push(s);
            }
            const ancestors = ancestorStack;

            // format breadcrumb: filename > ClassName > funcName
            const bc = document.getElementById('editorBreadcrumb');
            bc.innerHTML = '';
            // filename (clickable to show file menu)
            const fileSpan = document.createElement('span');
            fileSpan.className = 'bc-item bc-file';
            fileSpan.textContent = AppState.currentFilename || 'untitled.py';
            fileSpan.title = 'File';
            bc.appendChild(fileSpan);

            ancestors.forEach((a, idx) => {
                const sep = document.createElement('span'); sep.className = 'bc-sep'; sep.textContent = '›'; bc.appendChild(sep);
                // Use a plain span for breadcrumb items to avoid global button styles
                const node = document.createElement('span');
                node.className = 'bc-item bc-' + a.kind;
                node.textContent = a.name;
                node.title = `${a.kind} ${a.name}`;
                // Make it keyboard-accessible like a button
                node.setAttribute('role', 'button');
                node.setAttribute('tabindex', '0');
                node.addEventListener('click', () => {
                    AppState.editor.focus();
                    AppState.editor.setCursor({ line: a.line, ch: 0 });
                    AppState.editor.scrollIntoView({ line: a.line, ch: 0 }, 100);
                });
                node.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        node.click();
                    }
                });
                bc.appendChild(node);
            });
        } catch (e) { /* ignore breadcrumb errors */ }
    }

    // Update breadcrumb on cursor movement and content change (debounced)
    let bcTimeout = null;
    AppState.editor.on('cursorActivity', () => {
        if (bcTimeout) clearTimeout(bcTimeout);
        bcTimeout = setTimeout(updateBreadcrumb, 80);
    });
    AppState.editor.on('changes', () => {
        if (bcTimeout) clearTimeout(bcTimeout);
        bcTimeout = setTimeout(updateBreadcrumb, 180);
    });

    // initialize breadcrumb once
    setTimeout(updateBreadcrumb, 120);
    
    // Add keyboard sound effects for ALL keys (not just text input)
    const editorElement = AppState.editor.getWrapperElement();
    editorElement.addEventListener('keydown', (e) => {
        if (window.keyboardSounds && window.keyboardSounds.enabled) {
            // Exclude only modifier keys when pressed alone
            const modifierOnlyKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'];
            
            if (!modifierOnlyKeys.includes(e.key)) {
                window.keyboardSounds.playKeySound();
            }
        }
    });
    
    // Update line count
    AppState.editor.on('change', () => {
        updateLineCount();
        saveCodeToLocalStorage();
    });

    // Per-line syntax validation (real-time)
    // We'll debounce network requests to avoid flooding the server.
    let validateTimeout = null;
    const VALIDATE_DEBOUNCE_MS = 350;

    AppState.editor.on('changes', () => {
        // Clear previous debounce
        if (validateTimeout) clearTimeout(validateTimeout);
        validateTimeout = setTimeout(() => {
            runPerLineValidation();
        }, VALIDATE_DEBOUNCE_MS);
    });

    // --- Inline highlighter for warning/error words ---
    // We'll highlight occurrences of 'warning' (yellow) and 'error' (red)
    // using CodeMirror's markText. This is case-insensitive and updates
    // on editor changes with a small debounce to avoid reflow thrash.
    let highlighterMarkers = [];
    let highlighterTimeout = null;
    const HIGHLIGHT_DEBOUNCE_MS = 200;

    function clearHighlighterMarkers() {
        try {
            highlighterMarkers.forEach(m => { try { m.clear(); } catch (e) {} });
        } finally {
            highlighterMarkers = [];
        }
    }

    function applyHighlighter() {
        if (!AppState.editor) return;
        const cm = AppState.editor;
        clearHighlighterMarkers();

        try {
            const content = cm.getValue();
            if (!content) return;

            // Collect ranges of string literals so we can ignore tokens inside them
            const stringRanges = [];
            const commentRanges = [];
            (function collectStringRanges() {
                let mm;
                // triple-double quotes
                const td = /"""([\s\S]*?)"""/g;
                while ((mm = td.exec(content)) !== null) stringRanges.push([mm.index, mm.index + mm[0].length]);
                // triple-single quotes
                const ts = /'''([\s\S]*?)'''/g;
                while ((mm = ts.exec(content)) !== null) stringRanges.push([mm.index, mm.index + mm[0].length]);
                // double-quoted strings
                const dq = /"(?:\\.|[^"\\])*"/g;
                while ((mm = dq.exec(content)) !== null) stringRanges.push([mm.index, mm.index + mm[0].length]);
                // single-quoted strings
                const sq = /'(?:\\.|[^'\\])*'/g;
                while ((mm = sq.exec(content)) !== null) stringRanges.push([mm.index, mm.index + mm[0].length]);
            })();

            // Collect comment ranges (from a # that's not inside a string to the end of line)
            (function collectCommentRanges() {
                const lines = content.split('\n');
                let offset = 0;
                for (let li = 0; li < lines.length; li++) {
                    const line = lines[li];
                    // find first # in the line that is not within any string range
                    for (let ci = 0; ci < line.length; ci++) {
                        if (line.charAt(ci) !== '#') continue;
                        const globalIdx = offset + ci;
                        // if inside a string, skip
                        if (rangeOverlapsAny(globalIdx, globalIdx + 1, stringRanges)) continue;
                        // mark from this index to end of line
                        commentRanges.push([globalIdx, offset + line.length]);
                        break; // only first # starts a comment
                    }
                    offset += line.length + 1; // +1 for the newline
                }
            })();

            function rangeOverlapsAny(start, end, ranges) {
                for (let i = 0; i < ranges.length; i++) {
                    const r = ranges[i];
                    if (start < r[1] && end > r[0]) return true;
                }
                return false;
            }

            function rangeOverlapsStringsOrComments(start, end) {
                if (rangeOverlapsAny(start, end, stringRanges)) return true;
                if (rangeOverlapsAny(start, end, commentRanges)) return true;
                return false;
            }

            // simple regex to find whole words 'warning' and 'error' (case-insensitive)
            const warningRe = /\bwarning\b/gi;
            const errorRe = /\berror\b/gi;

            // Helper to mark all matches for a regex with a given className
            function markAll(re, className) {
                let match;
                while ((match = re.exec(content)) !== null) {
                    const startIdx = match.index;
                    const endIdx = match.index + match[0].length;
                    if (rangeOverlapsStringsOrComments(startIdx, endIdx)) continue; // skip matches inside strings or comments
                    const from = cm.posFromIndex(startIdx);
                    const to = cm.posFromIndex(endIdx);
                    try {
                        const marker = cm.markText(from, to, { className: className, inclusiveLeft: false, inclusiveRight: false });
                        highlighterMarkers.push(marker);
                    } catch (e) {
                        // ignore marker failures (e.g., indexes out of range)
                    }
                }
            }

            // Mark literal special words first
            markAll(warningRe, 'cm-highlight-warning');
            markAll(errorRe, 'cm-highlight-error');

            // --- Heuristic fuzzy keyword detection ---
            // Small Python keyword/builtin list to check for misspellings or incomplete words
            const PY_KEYWORDS = [
                'and','as','assert','break','class','continue','def','del','elif','else','except','finally',
                'for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise',
                'return','try','while','with','yield','True','False','None','int','float','str','print','input'
            ];
            const kwLower = PY_KEYWORDS.map(s => s.toLowerCase());

            // small, fast Levenshtein distance for short strings
            function levenshtein(a, b) {
                if (a === b) return 0;
                const al = a.length, bl = b.length;
                if (al === 0) return bl;
                if (bl === 0) return al;
                const v0 = new Array(bl + 1);
                const v1 = new Array(bl + 1);
                for (let j = 0; j <= bl; j++) v0[j] = j;
                for (let i = 0; i < al; i++) {
                    v1[0] = i + 1;
                    const ai = a.charAt(i);
                    for (let j = 0; j < bl; j++) {
                        const cost = ai === b.charAt(j) ? 0 : 1;
                        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
                    }
                    for (let j = 0; j <= bl; j++) v0[j] = v1[j];
                }
                return v1[bl];
            }

            // Tokenize identifiers/words and check against keywords
            const identRe = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;
            let m;
            // characters considered 'symbols' that should be included when highlighting
            const SYMBOL_CHARS = '()[]{}.,:;+-*/%=&|<>!~^';

            function expandRangeToSymbols(content, startIdx, endIdx) {
                // expand left to include immediately preceding symbol characters
                let s = startIdx;
                while (s - 1 >= 0 && SYMBOL_CHARS.indexOf(content.charAt(s - 1)) !== -1) s--;
                // expand right to include immediately following symbol characters
                let e = endIdx;
                while (e < content.length && SYMBOL_CHARS.indexOf(content.charAt(e)) !== -1) e++;
                return [s, e];
            }
            while ((m = identRe.exec(content)) !== null) {
                const token = m[0];
                const tokenLower = token.toLowerCase();
                // normalize repeated-character runs (e.g. inputttt -> input)
                const normalizedToken = tokenLower.replace(/(.)\1+/g, '$1');
                // skip tokens that are inside string literals or comments
                if (rangeOverlapsStringsOrComments(m.index, m.index + token.length)) continue;

                // don't run fuzzy/prefix detection on single-letter tokens (they are often variables)
                if (token.length < 2) continue;

                // if it's exactly a known keyword, skip
                if (kwLower.indexOf(tokenLower) !== -1) continue;

                // If the normalized token exactly matches a keyword but the original token doesn't,
                // this is likely a repeated-character typo (e.g., "inputttt") — mark as an error.
                if (kwLower.indexOf(normalizedToken) !== -1 && normalizedToken !== tokenLower) {
                    try {
                        let [sidx, eidx] = expandRangeToSymbols(content, m.index, m.index + token.length);
                        const from = cm.posFromIndex(sidx);
                        const to = cm.posFromIndex(eidx);
                        const marker = cm.markText(from, to, { className: 'cm-highlight-error', inclusiveLeft: false, inclusiveRight: false });
                        highlighterMarkers.push(marker);
                    } catch (e) {}
                    continue;
                }

                // check prefix: if normalized token is a prefix of a keyword => probably incomplete (warning)
                let warned = false;
                for (let i = 0; i < kwLower.length; i++) {
                    const kw = kwLower[i];
                    if (kw.startsWith(normalizedToken) && normalizedToken.length >= 2) {
                        // mark as warning (incomplete word)
                        try {
                            let [sidx, eidx] = expandRangeToSymbols(content, m.index, m.index + token.length);
                            const from = cm.posFromIndex(sidx);
                            const to = cm.posFromIndex(eidx);
                            const marker = cm.markText(from, to, { className: 'cm-highlight-warning', inclusiveLeft: false, inclusiveRight: false });
                            highlighterMarkers.push(marker);
                        } catch (e) {}
                        warned = true;
                        break;
                    }
                }
                if (warned) continue;

                // check fuzzy (Levenshtein distance). If distance is 1 then mark as error
                for (let i = 0; i < kwLower.length; i++) {
                    const kw = kwLower[i];
                    const d = levenshtein(normalizedToken, kw);
                    if (d === 1) {
                        // likely a misspelling -> mark as error
                        try {
                            let [sidx, eidx] = expandRangeToSymbols(content, m.index, m.index + token.length);
                            const from = cm.posFromIndex(sidx);
                            const to = cm.posFromIndex(eidx);
                            const marker = cm.markText(from, to, { className: 'cm-highlight-error', inclusiveLeft: false, inclusiveRight: false });
                            highlighterMarkers.push(marker);
                        } catch (e) {}
                        break;
                    }
                }
            }

            // --- Operator symbol-run detection ---
            // Find contiguous runs of operator characters and mark sequences
            // that are not valid Python operators as errors (e.g. "=!").
            const VALID_OPS = new Set([
                '=', '+', '-', '*', '/', '%', '**', '//', '==', '!=', '<', '>', '<=', '>=',
                '+=', '-=', '*=', '/=', '%=', '//=', '**=', '&', '|', '^', '>>', '<<', '~',
                ':', ':=', '->'
            ]);

            const opRunRe = /[+\-*/%=&|<>!~^:]+/g;
            let opm;
            while ((opm = opRunRe.exec(content)) !== null) {
                const seq = opm[0];
                // skip operator runs that are inside strings or comments
                if (rangeOverlapsStringsOrComments(opm.index, opm.index + seq.length)) continue;
                // If the exact sequence is not a known operator, mark it as an error.
                if (!VALID_OPS.has(seq)) {
                    try {
                        // Use expandRangeToSymbols to include contiguous symbol run
                        let [sidx, eidx] = expandRangeToSymbols(content, opm.index, opm.index + seq.length);
                        const from = cm.posFromIndex(sidx);
                        const to = cm.posFromIndex(eidx);
                        const marker = cm.markText(from, to, { className: 'cm-highlight-error', inclusiveLeft: false, inclusiveRight: false });
                        highlighterMarkers.push(marker);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } catch (e) {
            // defensive: if something goes wrong, clear markers
            clearHighlighterMarkers();
        }
    }

    // Debounced trigger
    function scheduleHighlighter() {
        if (highlighterTimeout) clearTimeout(highlighterTimeout);
        highlighterTimeout = setTimeout(() => applyHighlighter(), HIGHLIGHT_DEBOUNCE_MS);
    }

    // Run on initial load and on changes
    scheduleHighlighter();
    AppState.editor.on('changes', () => scheduleHighlighter());

    // Gutter click folding: if foldCode is available, toggle fold on gutter click
    try {
        const cm = AppState.editor;
        if (typeof CodeMirror.foldCode === 'function') {
            cm.on('gutterClick', (instance, line, gutter, event) => {
                if (gutter === 'CodeMirror-foldgutter') {
                    try {
                        const rangeFinder = (CodeMirror && CodeMirror.fold && CodeMirror.fold.indent) ? CodeMirror.fold.indent : null;
                        if (rangeFinder) CodeMirror.foldCode(instance, CodeMirror.Pos(line, 0), {rangeFinder: rangeFinder});
                        else CodeMirror.foldCode(instance, CodeMirror.Pos(line, 0));
                    } catch (e) { /* ignore */ }
                }
            });
        }
    } catch (e) { /* ignore if CodeMirror folding addons are not included */ }

    // Clear markers when content replaced programmatically
    const originalSetValue = AppState.editor.setValue.bind(AppState.editor);
    AppState.editor.setValue = function(v) {
        clearHighlighterMarkers();
        originalSetValue(v);
        // apply after next tick so CodeMirror internal state is updated
        setTimeout(scheduleHighlighter, 0);
    };
    
    console.log('✅ CodeMirror editor initialized');
}

// ==========================
// Tab Management for multi-file editor
// ==========================
const Tabs = {
    list: [], // { id, name, content }
    activeId: null
};

// Ensure the editor has its content represented as a tab.
function ensureInitialTab() {
    try {
        // If tabs already exist, nothing to do
        if (Tabs.list.length > 0) return;

        // If editor exists and has content, capture it; otherwise use default welcome
        let currentContent = '';
        try {
            if (AppState.editor && typeof AppState.editor.getValue === 'function') {
                currentContent = AppState.editor.getValue();
            }
        } catch (e) { /* ignore */ }

        // Prefer saved localStorage code if present and editor is empty
    const saved = localStorage.getItem('poonther_code');
        if ((!currentContent || currentContent.trim() === '') && saved) {
            currentContent = saved;
        }

        // Use a named tab if AppState.currentFilename exists
        const name = AppState.currentFilename || 'untitled.py';
    createTab(name, currentContent || '# Welcome to poontHER!\n\n');
    } catch (e) {
        console.warn('ensureInitialTab failed:', e);
    }
}

function renderTabs() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;
    container.innerHTML = '';
    Tabs.list.forEach((t, idx) => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', t.id === Tabs.activeId ? 'true' : 'false');
        if (t.id === Tabs.activeId) tab.classList.add('active');
        tab.dataset.tabId = t.id;

        // icon (Python logo via Font Awesome) + filename
        const icon = document.createElement('i');
        icon.className = 'fab fa-python tab-icon';
        icon.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'tab-name';
    // Use the visible label (name). The actual file identity is t.filename.
    name.textContent = t.name || t.filename || 'untitled.py';
    // Provide a title attribute with full name/path for hover readability
    name.title = name.textContent;

        tab.appendChild(icon);
        tab.appendChild(name);

        const actions = document.createElement('span');
        actions.className = 'tab-actions';

        // Drag handle (visual) and close button
        const grip = document.createElement('i'); grip.className = 'fas fa-grip-vertical'; grip.title = 'Drag to reorder';
        const close = document.createElement('i'); close.className = 'fas fa-times'; close.title = 'Close';
        actions.appendChild(grip);
        actions.appendChild(close);
        tab.appendChild(actions);

        // Make tab draggable
        tab.setAttribute('draggable', 'true');

        // Click to switch (ignore clicks on actions)
        tab.addEventListener('click', (e) => {
            if (e.target === close || e.target === grip) return;
            switchTab(t.id);
        });

        // Double-click to rename
        tab.addEventListener('dblclick', () => renameTabInline(t.id));

        // Right-click (context menu) to rename
        tab.addEventListener('contextmenu', (e) => { e.preventDefault(); renameTabInline(t.id); });

        // Close
        close.addEventListener('click', (ev) => { ev.stopPropagation(); closeTab(t.id); });

        // Drag events
        tab.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', t.id);
            tab.classList.add('dragging');
        });
        tab.addEventListener('dragend', () => { tab.classList.remove('dragging'); });
        tab.addEventListener('dragover', (e) => { e.preventDefault(); });
        tab.addEventListener('drop', (e) => {
            e.preventDefault();
            const srcId = e.dataTransfer.getData('text/plain');
            const dstId = t.id;
            if (!srcId || srcId === dstId) return;
            const srcIdx = Tabs.list.findIndex(x => x.id === srcId);
            const dstIdx = Tabs.list.findIndex(x => x.id === dstId);
            if (srcIdx === -1 || dstIdx === -1) return;
            const [item] = Tabs.list.splice(srcIdx, 1);
            // If source was before dest, inserting at dstIdx will place after shifting
            Tabs.list.splice(dstIdx, 0, item);
            renderTabs();
        });

        container.appendChild(tab);
    });
    // After rendering, ensure all tabs use the same visual width.
    // We prefer measuring the 'untitled.py' tab (or the active tab if none match)
    // and expose it as a CSS variable so CSS can apply a uniform width.
    try {
        // Look for a tab whose name is exactly 'untitled.py' (common initial tab)
        const untitledEl = Array.from(container.querySelectorAll('.tab .tab-name'))
            .find(el => el && el.textContent && el.textContent.trim() === 'untitled.py');
        let baseTabEl = null;
        if (untitledEl) baseTabEl = untitledEl.closest('.tab');
        // fallback to active tab
        if (!baseTabEl) baseTabEl = container.querySelector('.tab.active');
        // fallback to first tab
        if (!baseTabEl) baseTabEl = container.querySelector('.tab');

        if (baseTabEl) {
            // compute width including paddings and borders
            const rect = baseTabEl.getBoundingClientRect();
            const computedWidth = Math.round(rect.width);
            document.documentElement.style.setProperty('--tab-width', computedWidth + 'px');
        } else {
            // ensure fallback default is present
            document.documentElement.style.setProperty('--tab-width', '160px');
        }
    } catch (e) { /* ignore measurement errors */ }
}

// Render a separate REPL tabs area. For now REPL sessions are represented
// by a simple list derived from AppState.replHistory (most recent commands)
// which allows quick recall; this can be extended to session-based tabs.
function renderReplTabs() {
    const container = document.getElementById('replTabsContainer');
    if (!container) return;
    container.innerHTML = '';
    // Show a small set of recent REPL commands as clickable items
    const items = (AppState.replHistory && AppState.replHistory.length) ? AppState.replHistory.slice(0, 8) : [];
    items.forEach((cmd, idx) => {
        const tab = document.createElement('div');
        tab.className = 'tab repl-tab';
        tab.dataset.replIndex = idx;
        const icon = document.createElement('i'); icon.className = 'fab fa-python tab-icon'; icon.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span'); name.className = 'tab-name';
        name.textContent = (cmd.length > 28) ? (cmd.substring(0, 25) + '...') : cmd;
        tab.appendChild(icon);
        tab.appendChild(name);
        tab.addEventListener('click', () => {
            const input = document.getElementById('replInput');
            if (input) { input.value = cmd; input.focus(); }
        });
        container.appendChild(tab);
    });
}

function createTab(name = 'untitled.py', content = '') {
    // If there are no existing tabs but the editor already has content,
    // capture that content first as the initial tab to avoid losing it.
    try {
        if (Tabs.list.length === 0) {
            const existing = (AppState.editor && typeof AppState.editor.getValue === 'function') ? AppState.editor.getValue() : '';
            if (existing && existing.trim() !== '' && name === 'untitled.py' && (content === '' || content === null)) {
                // create the initial tab with existing editor content
                const initialId = 'tab_' + Math.random().toString(36).slice(2,9);
                Tabs.list.push({ id: initialId, name: AppState.currentFilename || 'untitled.py', content: existing });
                Tabs.activeId = initialId;
                renderTabs();
            }
        }
    } catch (e) { /* ignore */ }

    const id = 'tab_' + Math.random().toString(36).slice(2,9);
    // keep `name` as the visible tab label and `filename` as the actual file name
    // to decouple user-visible tab labeling from the file identity used in the status bar
    Tabs.list.push({ id, name, filename: name, content });
    Tabs.activeId = id;
    renderTabs();
    loadTabContent(id);
}

function loadTabContent(id) {
    const tab = Tabs.list.find(t => t.id === id);
    if (!tab) return;
    Tabs.activeId = id;
    // set editor content
    if (AppState.editor && typeof AppState.editor.setValue === 'function') {
        AppState.editor.setValue(tab.content || '');
    }
    // update file display name
    const fileNameEl = document.getElementById('fileNameDisplay');
    // Prefer explicit filename field (true file identity). Fall back to name for older entries.
    const filename = tab.filename || tab.name || 'untitled.py';
    if (fileNameEl) fileNameEl.textContent = filename;
    // Keep AppState.currentFilename and the tab entry.filename in sync (do not overwrite tab.label/name)
    AppState.currentFilename = filename;
    const listEntry = Tabs.list.find(x => x.id === id);
    if (listEntry && listEntry.filename !== AppState.currentFilename) listEntry.filename = AppState.currentFilename;
    // update current filename for saving
    updateSessionInfo();
    renderTabs();
}

function persistCurrentTabContent() {
    try {
        if (!Tabs.activeId) return;
        const tab = Tabs.list.find(t => t.id === Tabs.activeId);
        if (!tab) return;
        tab.content = AppState.editor.getValue();
    } catch (e) { /* ignore */ }
}

function switchTab(id) {
    if (id === Tabs.activeId) return;
    persistCurrentTabContent();
    loadTabContent(id);
}

function renameTabInline(id) {
    const tabEl = document.querySelector(`.tab[data-tab-id="${id}"]`);
    if (!tabEl) return;
    const nameSpan = tabEl.querySelector('.tab-name');
    const old = nameSpan.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = old;
    input.style.minWidth = '80px';
    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    function finish() {
        const newName = input.value.trim() || old;
        const tab = Tabs.list.find(t => t.id === id);
        // Only update the visible tab label (name). Do NOT change the actual filename
        // to avoid coupling tab labeling with file identity.
        if (tab) tab.name = newName;
        input.replaceWith(nameSpan);
        nameSpan.textContent = newName;
        // If needed, re-render tabs to apply layout changes. Do not touch fileNameDisplay or AppState.currentFilename.
        renderTabs();
    }

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { finish(); }
        if (e.key === 'Escape') { input.value = old; finish(); }
    });
}

function moveTabLeft(id) {
    const idx = Tabs.list.findIndex(t => t.id === id);
    if (idx > 0) {
        const temp = Tabs.list[idx-1];
        Tabs.list[idx-1] = Tabs.list[idx];
        Tabs.list[idx] = temp;
        renderTabs();
    }
}

function moveTabRight(id) {
    const idx = Tabs.list.findIndex(t => t.id === id);
    if (idx >= 0 && idx < Tabs.list.length - 1) {
        const temp = Tabs.list[idx+1];
        Tabs.list[idx+1] = Tabs.list[idx];
        Tabs.list[idx] = temp;
        renderTabs();
    }
}

function closeTab(id) {
    const idx = Tabs.list.findIndex(t => t.id === id);
    if (idx === -1) return;
    // if closing active, switch to neighbor
    const wasActive = Tabs.activeId === id;
    Tabs.list.splice(idx, 1);
    if (wasActive) {
        const next = Tabs.list[Math.max(0, idx-1)];
        if (next) loadTabContent(next.id);
        else {
            // no tabs left: create a fresh one
            createTab();
        }
    }
    renderTabs();
}


// ============================================
// xterm.js Terminal Setup
// ============================================
function initializeTerminal() {
    if (typeof Terminal === 'undefined') {
        console.warn('⚠️ xterm.js not loaded');
        return;
    }
    
    AppState.terminal = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
        theme: {
            background: '#232323ff',
            foreground: '#d4d4d4',
            cursor: '#9cdcfe',
            selection: 'rgba(255, 255, 255, 0.3)',
            black: '#000000',
            red: '#f48771',
            green: '#4ec9b0',
            yellow: '#dcdcaa',
            blue: '#9cdcfe',
            magenta: '#c586c0',
            cyan: '#4fc1ff',
            white: '#d4d4d4',
            brightBlack: '#808080',
            brightRed: '#f48771',
            brightGreen: '#4ec9b0',
            brightYellow: '#dcdcaa',
            brightBlue: '#9cdcfe',
            brightMagenta: '#c586c0',
            brightCyan: '#4fc1ff',
            brightWhite: '#ffffff'
        },
        scrollback: 1000,
        convertEol: true
    });
    
    AppState.terminalFitAddon = new FitAddon.FitAddon();
    AppState.terminal.loadAddon(AppState.terminalFitAddon);
    
    const xtermContainer = document.getElementById('xtermContainer');
    AppState.terminal.open(xtermContainer);
    AppState.terminalFitAddon.fit();
    
    console.log('✅ xterm.js terminal initialized');
}

// ============================================
// Split Panels Setup
// ============================================
function initializeSplitPanels() {
    // Check if we're on mobile (screen width <= 767px)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    
    // Only initialize horizontal split on desktop
    if (!isMobile) {
        // Try custom panel resizer first
        if (window.panelResizer && window.panelResizer.initHorizontal) {
            try {
                window.panelResizer.initHorizontal('leftPanel', 'rightPanel');
                console.log('✅ Custom panel resizer initialized (horizontal)');
            } catch (error) {
                console.warn('Custom resizer failed, falling back to Split.js:', error);
            }
        }

        // If Split.js already initialized by another module (themes.js), skip to avoid double gutters
        if (window.__split_initialized) {
            console.log('Split.js already initialized (advanced.js) - skipping horizontal init');
        } else if (typeof Split !== 'undefined') {
            // Initialize Split with thin gutters and shared drag handlers
            try {
                const mainInitialSizes = [50, 50];
                const mainSplit = Split(['#leftPanel', '#rightPanel'], {
                    sizes: mainInitialSizes.slice(),
                    minSize: [300, 300],
                    gutterSize: 6,
                    cursor: 'col-resize',
                    onDragStart: () => document.querySelectorAll('.gutter').forEach(g => g.classList.add('gutter-dragging')),
                    onDragEnd: () => {
                        try { AppState.editor.refresh(); } catch (e) {}
                        document.querySelectorAll('.gutter').forEach(g => g.classList.remove('gutter-dragging'));
                    }
                });
                window.__split_main = mainSplit;
                // attach dblclick reset to horizontal gutters
                setTimeout(() => {
                    try {
                        document.querySelectorAll('.gutter.gutter-horizontal').forEach(g => {
                            if (g.__pyinter_dbl_attached) return;
                            g.addEventListener('dblclick', () => {
                                try {
                                    if (window.__split_main && typeof window.__split_main.setSizes === 'function') {
                                        window.__split_main.setSizes(mainInitialSizes.slice());
                                    }
                                } catch (e) {}
                            });
                            g.__pyinter_dbl_attached = true;
                        });
                    } catch (e) {}
                }, 40);
                window.__split_initialized = true;
                console.log('✅ Split panels initialized (horizontal)');
            } catch (e) {
                console.warn('Split init failed (horizontal):', e);
            }
        } else {
            console.warn('⚠️ Split.js not loaded');
        }
    } else {
        console.log('📱 Mobile mode - horizontal split disabled');
    }

    // Initialize vertical split for output console and variable explorer
    // On mobile, use smaller minSize
    if (typeof Split !== 'undefined') {
        const outputContainer = document.getElementById('outputContainer');
        const variablesContainer = document.getElementById('variablesContainer');

        if (window.__split_initialized && !outputContainer.classList.contains('split-managed')) {
            // If Split was initialized elsewhere, try to find existing gutters and mark managed
            document.querySelectorAll('.gutter').forEach(g => g.classList.add('gutter-managed'));
        }

        if (outputContainer && variablesContainer) {
            // If vertical split wasn't already created by themes.js, create it here with matching handlers
            if (!window.__split_initialized) {
                try {
                    const rightInitialSizes = isMobile ? [55, 45] : [60, 40];
                    const rightSplit = Split(['#outputContainer', '#variablesContainer'], {
                        direction: 'vertical',
                        sizes: rightInitialSizes.slice(),
                        minSize: isMobile ? [100, 80] : [100, 100],
                        gutterSize: isMobile ? 6 : 6,
                        cursor: 'row-resize',
                        onDragStart: () => document.querySelectorAll('.gutter').forEach(g => g.classList.add('gutter-dragging')),
                        onDragEnd: () => document.querySelectorAll('.gutter').forEach(g => g.classList.remove('gutter-dragging'))
                    });
                    window.__split_right = rightSplit;
                    // attach dblclick handler to vertical gutters
                    setTimeout(() => {
                        try {
                            document.querySelectorAll('.gutter.gutter-vertical').forEach(g => {
                                if (g.__pyinter_dbl_attached) return;
                                g.addEventListener('dblclick', () => {
                                    try {
                                        if (window.__split_right && typeof window.__split_right.setSizes === 'function') {
                                            window.__split_right.setSizes(rightInitialSizes.slice());
                                        }
                                    } catch (e) {}
                                });
                                g.__pyinter_dbl_attached = true;
                            });
                        } catch (e) {}
                    }, 40);

                    console.log(`✅ Vertical split initialized (${isMobile ? 'mobile' : 'desktop'})`);
                } catch (e) {
                    console.warn('Vertical split init failed:', e);
                }
            } else {
                console.log('Vertical split assumed initialized by other module');
            }
        } else {
            console.warn('⚠️ Output or variables container not found for vertical split');
        }
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Helper function to safely add event listeners
    const safeAddListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element not found: ${id}`);
        }
    };
    
    // Navigation buttons
    // Top-nav New should open a new file tab
    safeAddListener('newSessionBtn', 'click', () => createTab());
    safeAddListener('newTabBtn', 'click', () => createTab());
    safeAddListener('saveCodeBtn', 'click', saveCode);
    // Clicking Load opens a small dropdown to choose Single / Multiple / Folder
    safeAddListener('loadFileBtn', 'click', (ev) => {
        try {
            const existing = document.getElementById('loadOptionsDropdown');
            if (existing) { existing.remove(); return; }

            const dd = document.createElement('div');
            dd.id = 'loadOptionsDropdown';
            dd.className = 'load-options-dropdown';
            dd.style.position = 'absolute';
            dd.style.zIndex = 14000;
            dd.style.background = 'var(--panel-bg, white)';
            dd.style.border = '1px solid var(--border-color)';
            dd.style.borderRadius = '8px';
            dd.style.padding = '8px';
            dd.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';

            const optSingle = document.createElement('div');
            optSingle.className = 'load-option';
            optSingle.textContent = 'Single file';
            optSingle.style.padding = '8px'; optSingle.style.cursor = 'pointer';
            optSingle.addEventListener('click', () => { document.getElementById('fileInput')?.click(); dd.remove(); });

            const optMultiple = document.createElement('div');
            optMultiple.className = 'load-option';
            optMultiple.textContent = 'Multiple files';
            optMultiple.style.padding = '8px'; optMultiple.style.cursor = 'pointer';
            optMultiple.addEventListener('click', () => { document.getElementById('multiFileInput')?.click(); dd.remove(); });

            const optFolder = document.createElement('div');
            optFolder.className = 'load-option';
            optFolder.textContent = 'Folder';
            optFolder.style.padding = '8px'; optFolder.style.cursor = 'pointer';
            optFolder.addEventListener('click', () => { document.getElementById('folderInput')?.click(); dd.remove(); });

            dd.appendChild(optSingle); dd.appendChild(optMultiple); dd.appendChild(optFolder);
            document.body.appendChild(dd);

            // Position under the Load button
            const btn = document.getElementById('loadFileBtn');
            if (btn && btn.getBoundingClientRect) {
                const r = btn.getBoundingClientRect();
                dd.style.left = (r.left + window.scrollX) + 'px';
                dd.style.top = (r.bottom + window.scrollY + 6) + 'px';
            }

            // Click outside to remove
            const onDoc = (e) => { if (!dd.contains(e.target) && e.target !== btn) { dd.remove(); document.removeEventListener('click', onDoc); } };
            setTimeout(() => document.addEventListener('click', onDoc), 10);
        } catch (e) { console.warn('Failed to open load options', e); }
    });

    // Wire inputs: single file -> loadFile (existing), multi -> loadMultipleFiles, folder -> loadFolder (existing)
    safeAddListener('fileInput', 'change', (ev) => {
        try { if (ev && ev.target && ev.target.files && ev.target.files.length) loadFile(ev); } catch (e) { console.warn(e); }
        if (ev && ev.target) ev.target.value = '';
    });
    safeAddListener('multiFileInput', 'change', (ev) => {
        try { if (ev && ev.target && ev.target.files && ev.target.files.length) loadMultipleFiles(ev.target.files); } catch (e) { console.warn(e); }
        if (ev && ev.target) ev.target.value = '';
    });
    safeAddListener('folderInput', 'change', loadFolder);

    // Helper to open each selected file into its own tab
    function loadMultipleFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        (async () => {
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                try {
                    const content = await new Promise((res, rej) => {
                        const r = new FileReader();
                        r.onload = (e) => res(e.target.result);
                        r.onerror = (err) => rej(err);
                        r.readAsText(f);
                    });
                    createTab(f.name, content);
                } catch (e) { console.warn('Failed to open file', f.name, e); }
            }
            showToast('success', 'Loaded', `Opened ${files.length} files`);
        })();
    }
    safeAddListener('renameFileBtn', 'click', renameFile);
    // View Outline (classes / functions / decorators)
    // Use the global VIEW_MODES/currentViewModeIndex and render helper so the
    // mode state is shared across listeners and dropdown close/reset logic.
    const viewBtnEl = document.getElementById('viewOutlineBtn');
    if (viewBtnEl) {
        // ensure label matches global state
        renderViewButtonLabel();

        // hover fade
        viewBtnEl.addEventListener('mouseenter', () => { viewBtnEl.classList.add('hovering'); viewBtnEl.style.opacity = '0.88'; });
        viewBtnEl.addEventListener('mouseleave', () => { viewBtnEl.classList.remove('hovering'); viewBtnEl.style.opacity = ''; });

        // Wheel to cycle global modes
        viewBtnEl.addEventListener('wheel', (ev) => {
            ev.preventDefault();
            const delta = Math.sign(ev.deltaY || -ev.wheelDelta || 0);
            if (delta === 0) return;
            if (delta > 0) currentViewModeIndex = (currentViewModeIndex + 1) % VIEW_MODES.length;
            else currentViewModeIndex = (currentViewModeIndex - 1 + VIEW_MODES.length) % VIEW_MODES.length;
            renderViewButtonLabel();
            viewBtnEl.classList.add('mode-active');
            setTimeout(() => viewBtnEl.classList.remove('mode-active'), 280);

            // If the outline dropdown is currently open, refresh it to reflect the new mode
            const existingDropdown = document.querySelector('.outline-dropdown');
            if (existingDropdown) {
                // Simulate a re-open using the new mode to update contents
                try {
                    // Remove the old dropdown and render a fresh one for the new mode
                    existingDropdown.remove();
                    toggleOutlineDropdown(ev, getCurrentViewMode());
                } catch (e) { console.warn('Failed to refresh outline dropdown:', e); }
            }
        }, { passive: false });

        // Click opens dropdown for current global mode
        viewBtnEl.addEventListener('click', (e) => {
            toggleOutlineDropdown(e, getCurrentViewMode());
        });
    } else {
        safeAddListener('viewOutlineBtn', 'click', (e) => { toggleOutlineDropdown(e); });
    }
    // Nav Clear button: clear all four main panels (editor, output, repl, variables)
    safeAddListener('clearConsoleBtn', 'click', clearAllPanels);
    safeAddListener('settingsBtn', 'click', openSettings);
    safeAddListener('themeToggleBtn', 'click', toggleTheme);
    
    // Mode switcher
    safeAddListener('modeToggle', 'change', toggleMode);
    
    // Editor actions
    // Replace direct binding with an animated wrapper: fall to status and run
    safeAddListener('runCodeBtn', 'click', (e) => {
        try { animateRunButtonToStatus(); } catch (err) { /* ignore animation errors */ }
        executeCode();
    });
    safeAddListener('validateSyntaxBtn', 'click', validateSyntax);
    safeAddListener('clearOutputBtn', 'click', clearConsole);
    safeAddListener('refreshVarsBtn', 'click', refreshVariables);
    
    // REPL input
    const replInput = document.getElementById('replInput');
    if (replInput) {
        replInput.addEventListener('keydown', handleReplKeydown);
    }
    
    // Interactive input prompt
    const inputPromptField = document.getElementById('inputPromptField');
    if (inputPromptField) {
        inputPromptField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitInput();
            } else if (e.key === 'Escape') {
                hideInputPrompt();
                updateStatus('ready', 'Input cancelled');
            }
        });
    }
    
    // Clear variables button (replaces previous collapse toggle)
    safeAddListener('clearVarsBtn', 'click', function() {
        try {
            const varsContent = document.getElementById('variablesContent');
            if (varsContent) {
                varsContent.innerHTML = '<div class="empty-state">No variables</div>';
                showToast('success', 'Cleared', 'Variable explorer cleared');
            }
        } catch (e) {
            console.warn('Failed to clear variables:', e);
            showToast('error', 'Error', 'Failed to clear variables');
        }
    });
    
    // History sidebar toggle
    safeAddListener('toggleHistoryBtn', 'click', function() {
        const sidebar = document.getElementById('historySidebar');
        const icon = this.querySelector('i');
        if (sidebar && icon) {
            sidebar.classList.toggle('collapsed');
            
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-left');
            }
        }
    });
    
    // Settings modal
    safeAddListener('closeSettingsBtn', 'click', closeSettings);
    safeAddListener('saveSettingsBtn', 'click', saveSettings);
    safeAddListener('resetSettingsBtn', 'click', resetSettings);
    
    // Input modal
    safeAddListener('closeInputModalBtn', 'click', hideInputModal);
    safeAddListener('cancelInputBtn', 'click', hideInputModal);
    safeAddListener('submitInputsBtn', 'click', submitInputValues);
    
    // Settings controls
    safeAddListener('editorTheme', 'change', function() {
        if (AppState.editor) {
            AppState.editor.setOption('theme', this.value);
        }
    });
    
    safeAddListener('editorFontSize', 'input', function() {
        const fontSizeValue = document.getElementById('fontSizeValue');
        if (fontSizeValue) {
            fontSizeValue.textContent = this.value + 'px';
        }
        const codeMirror = document.querySelector('.CodeMirror');
        if (codeMirror) {
            codeMirror.style.fontSize = this.value + 'px';
        }
    });

    // Persist current tab content on editor changes
    if (AppState.editor) {
        AppState.editor.on('change', () => persistCurrentTabContent());
    }
    
    safeAddListener('consoleFontSize', 'input', function() {
        const consoleFontSizeValue = document.getElementById('consoleFontSizeValue');
        if (consoleFontSizeValue) {
            consoleFontSizeValue.textContent = this.value + 'px';
        }
        const outputConsole = document.getElementById('outputConsole');
        if (outputConsole) {
            outputConsole.style.fontSize = this.value + 'px';
        }
    });
    
    safeAddListener('lineNumbersToggle', 'change', function() {
        if (AppState.editor) {
            AppState.editor.setOption('lineNumbers', this.checked);
        }
    });
    
    // Double-click the filename display to rename the file (user-requested UX)
    try {
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        if (fileNameDisplay) {
            // affordance
            if (!fileNameDisplay.style.cursor) fileNameDisplay.style.cursor = 'pointer';
            fileNameDisplay.setAttribute('title', fileNameDisplay.getAttribute('title') || 'Double-click to rename');
            console.debug('Attaching dblclick handler to #fileNameDisplay');
            fileNameDisplay.addEventListener('dblclick', (e) => {
                e.preventDefault();
                console.debug('dblclick fired on #fileNameDisplay');
                try {
                    // show inline modern popover anchored to the element
                    showFilenamePopover(fileNameDisplay);
                } catch (err) {
                    console.warn('Filename popover failed, falling back to modal', err);
                    try { renameFile(); } catch (err2) { console.warn('Rename handler error', err2); }
                }
            });
        }
    } catch (err) { console.warn('Failed to attach dblclick to fileNameDisplay', err); }

    // Fallback: delegated dblclick on the parent container in case the
    // #fileNameDisplay element is replaced dynamically by other code.
    try {
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.addEventListener('dblclick', (e) => {
                try {
                    const fd = e.target.closest && e.target.closest('#fileNameDisplay');
                    if (fd) {
                        console.debug('delegated dblclick detected on #fileInfo -> #fileNameDisplay');
                        e.preventDefault();
                        showFilenamePopover(fd);
                    }
                } catch (err) { /* ignore */ }
            });
        }
    } catch (err) { console.warn('Failed to attach delegated dblclick on #fileInfo', err); }

    console.log('✅ Event listeners attached');
}

// Defensive delegated dblclick on document to catch cases where #fileNameDisplay
// is replaced dynamically or initial listeners didn't attach.
document.addEventListener('dblclick', function (e) {
    try {
        const fd = e.target && (e.target.id === 'fileNameDisplay' ? e.target : e.target.closest && e.target.closest('#fileNameDisplay'));
        if (fd) {
            e.preventDefault();
            // prefer inline popover; fallback to rename modal
            try { showFilenamePopover(fd); } catch (err) { try { renameFile(); } catch (err2) {} }
        }
    } catch (err) { /* swallow */ }
}, true); // use capture to run early

// ============================================
// Spotify frontend integration (basic)
// Adds a modal, login flow, search and basic playback controls that call the backend API
// ============================================
function initSpotifyUI() {
    const spotifyBtn = document.getElementById('spotifyBtn');
    const spotifyModal = document.getElementById('spotifyModal');
    const closeSpotifyBtn = document.getElementById('closeSpotifyBtn');
    const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
    const spotifyAuthStatus = document.querySelector('#spotifyAuth .spotify-status');
    const spotifyControls = document.getElementById('spotifyControls');
    const spotifySearchInput = document.getElementById('spotifySearchInput');
    const spotifySearchBtn = document.getElementById('spotifySearchBtn');
    const spotifyTypeSelect = document.getElementById('spotifyTypeSelect');
    const spotifyResults = document.getElementById('spotifyResults');
    const spotifyDeviceSelect = document.getElementById('spotifyDeviceSelect');
    const spotifyRefreshDevicesBtn = document.getElementById('spotifyRefreshDevicesBtn');
    const playPauseBtn = document.getElementById('spotifyPlayPauseBtn');
    const nextBtn = document.getElementById('spotifyNextBtn');
    const prevBtn = document.getElementById('spotifyPrevBtn');
    const nowPlaying = document.getElementById('spotifyNowPlaying');

    if (!spotifyBtn || !spotifyModal) return;

    function openModal() { spotifyModal.classList.add('active'); }
    function closeModal() { spotifyModal.classList.remove('active'); }

    spotifyBtn.addEventListener('click', async () => {
        openModal();
        // populate devices and refresh status when opening
    try { await fetchAndPopulateDevices(); } catch (e) { /* ignore */ }
        // give the modal a moment to appear then refresh status (useful after redirect back)
        setTimeout(() => { try { refreshSpotifyStatusUI(); } catch (e) { /* ignore */ } }, 120);
    });
    closeSpotifyBtn?.addEventListener('click', closeModal);

    // Navigate to /spotify/login which performs a server-side redirect to Spotify
    spotifyLoginBtn?.addEventListener('click', () => {
        try {
            window.location.href = '/spotify/login';
        } catch (e) {
            console.error('spotify login navigate', e);
            showToast('error', 'Spotify', 'Login navigation failed');
        }
    });

    spotifySearchBtn?.addEventListener('click', async () => {
        const q = spotifySearchInput.value.trim();
        if (!q) return;
        spotifyResults.innerHTML = '<div class="empty-state">Searching...</div>';
        try {
            const type = spotifyTypeSelect.value || 'track';
            const res = await fetch('/api/spotify/search?q=' + encodeURIComponent(q) + '&type=' + encodeURIComponent(type));
            if (!res.ok) throw new Error('Search failed');
            const j = await res.json();
            renderSpotifyResults(j, type);
        } catch (e) {
            spotifyResults.innerHTML = '<div class="empty-state">Search failed</div>';
            console.error('spotify search', e);
        }
    });

    function renderSpotifyResults(resp, type) {
        spotifyResults.innerHTML = '';
        if (!resp) { spotifyResults.innerHTML = '<div class="empty-state">No results</div>'; return; }
        let items = [];
        if (type === 'track' && resp.tracks && resp.tracks.items) items = resp.tracks.items;
        else if (type === 'album' && resp.albums && resp.albums.items) items = resp.albums.items;
        else if (type === 'artist' && resp.artists && resp.artists.items) items = resp.artists.items;
        if (!items.length) { spotifyResults.innerHTML = '<div class="empty-state">No results</div>'; return; }

            items.forEach(it => {
            const row = document.createElement('div');
            row.className = 'spotify-result-row';
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.style.padding = '8px';
            row.style.borderBottom = '1px solid var(--border-color)';
            row.style.alignItems = 'center';

            const img = document.createElement('img');
            img.src = (it.album && it.album.images && it.album.images[2]) ? it.album.images[2].url : (it.images && it.images[2] && it.images[2].url) || '';
            img.style.width = '48px'; img.style.height = '48px'; img.style.objectFit = 'cover'; img.style.borderRadius = '6px';

            const meta = document.createElement('div');
            meta.style.flex = '1';
            const title = document.createElement('div'); title.textContent = it.name || it.id; title.style.fontWeight = '600';
            const sub = document.createElement('div'); sub.style.fontSize = '12px'; sub.style.color = 'var(--text-secondary)';
            if (type === 'track') sub.textContent = (it.artists || []).map(a => a.name).join(', ') + ' — ' + (it.album && it.album.name ? it.album.name : '');
            else if (type === 'album') sub.textContent = (it.artists || []).map(a => a.name).join(', ');
            else if (type === 'artist') sub.textContent = it.genres ? it.genres.join(', ') : '';

            const actions = document.createElement('div');
            actions.style.display = 'flex'; actions.style.gap = '6px';
            const playBtn = document.createElement('button'); playBtn.className = 'btn btn-primary'; playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.addEventListener('click', async () => {
                try {
                    const uri = it.uri || it.id;
                    const body = { uri: uri };
                    try {
                        const sel = spotifyDeviceSelect && spotifyDeviceSelect.value;
                        if (sel) body.device_id = sel;
                    } catch (e) {}

                    // Ensure the selected device is actually active. If not, try to transfer playback to it.
                    if (body.device_id) {
                        try {
                            // Refresh device list from backend
                            const dres = await fetch('/api/spotify/devices');
                            const dj = dres.ok ? await dres.json().catch(()=>null) : null;
                            const dev = dj && dj.devices && dj.devices.find(x => x.id === body.device_id);
                            if (dev && !dev.is_active) {
                                try {
                                    showToast('info','Spotify','Activating device...');
                                } catch(e){}
                                try {
                                    // Best-effort transfer; server may expose an endpoint to forward this request
                                    await fetch('/api/spotify/transfer', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ device_ids: [body.device_id], play: false }) }).catch(()=>null);
                                    // small pause to let Spotify register the transfer
                                    await new Promise(r => setTimeout(r, 350));
                                } catch (e) {
                                    // ignore transfer failures — play call below will handle errors
                                }
                            }
                        } catch (e) {
                            // ignore device refresh errors
                        }
                    }

                    const resp = await fetch('/api/spotify/play', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
                    const pj = await resp.json().catch(()=>null);
                    if (!resp.ok || (pj && pj.status && pj.status >= 400)) {
                        const raw = pj || { error: pj };
                        let msg = raw.body || raw.error || ('HTTP ' + resp.status);
                        // Attempt to parse a JSON error body from Spotify proxy
                        try {
                            if (raw.body) {
                                const parsed = JSON.parse(raw.body);
                                if (parsed && parsed.error && parsed.error.message) msg = parsed.error.message;
                                // If there is no active device, try opening the user's Spotify app
                                // via deep link; if that fails, fall back to the Spotify web player.
                                const noDeviceMsg = (parsed && parsed.error && parsed.error.message && String(parsed.error.message).toLowerCase().indexOf('no active device') !== -1) || (String(msg).toLowerCase().indexOf('no active device') !== -1) || (String(msg).toLowerCase().indexOf('no device') !== -1);
                                if (noDeviceMsg) {
                                    // Build deep link and web URL
                                    let deepUri = null;
                                    let openUrl = null;
                                    try {
                                        if (body && body.uri) {
                                            if (body.uri.startsWith('spotify:')) deepUri = body.uri;
                                            if (body.uri.startsWith('spotify:track:')) {
                                                const tid = body.uri.split(':').pop();
                                                openUrl = 'https://open.spotify.com/track/' + tid;
                                            } else if (body.uri.startsWith('https://open.spotify.com/')) {
                                                openUrl = body.uri;
                                            }
                                        }
                                        // fallback: if we only have id, try track link
                                        if (!openUrl && body && body.uri && body.uri.length && !body.uri.startsWith('spotify:')) {
                                            try { openUrl = body.uri; } catch (e) {}
                                        }
                                        // If we don't have an openUrl but an id-like uri, try to craft one
                                        if (!openUrl && body && body.uri && typeof body.uri === 'string') {
                                            const maybeId = body.uri.split(':').pop();
                                            openUrl = 'https://open.spotify.com/track/' + maybeId;
                                            deepUri = 'spotify:track:' + maybeId;
                                        }
                                    } catch (e) {}

                                    // Use helper to open app or web fallback
                                    try { openSpotifyAppOrWeb(deepUri || body.uri, openUrl || ('https://open.spotify.com/')); } catch (e) {}
                                    await refreshSpotifyStatusUI();
                                    return;
                                }

                                // Handle Spotify specific premium requirement
                                if (parsed && parsed.error && parsed.error.reason === 'PREMIUM_REQUIRED') {
                                    const uri = body && body.uri;
                                    let openUrl = null;
                                    try {
                                        if (uri && uri.startsWith('spotify:track:')) {
                                            const tid = uri.split(':').pop();
                                            openUrl = 'https://open.spotify.com/track/' + tid;
                                        } else if (uri && uri.startsWith('https://open.spotify.com/')) {
                                            openUrl = uri;
                                        }
                                    } catch (e) {}
                                    const actions = [];
                                    if (openUrl) actions.push({ label: 'Open in Spotify', url: openUrl });
                                    actions.push({ label: 'Learn more', url: 'https://www.spotify.com' });
                                    showToast('error','Spotify','Play failed: ' + String(msg).slice(0,200), 8000, actions);
                                    await refreshSpotifyStatusUI();
                                    return;
                                }
                            }
                        } catch (e) {
                            // ignore JSON parse errors
                        }
                        showToast('error','Spotify','Play failed: ' + String(msg).slice(0,200));
                    } else {
                        showToast('info', 'Spotify', 'Play command sent');
                    }
                    await refreshSpotifyStatusUI();
                    // Clear the search UI: remove results and empty the search input
                    try {
                        if (spotifyResults) spotifyResults.innerHTML = '';
                        if (spotifySearchInput) spotifySearchInput.value = '';
                    } catch (e) { /* ignore clearing errors */ }
                    // Close the search modal and open the consolidated Spotify modal
                    try {
                        closeModal();
                        setTimeout(() => { try { openModal(); refreshSpotifyStatusUI(); } catch(e){} }, 220);
                    } catch (e) { /* ignore UI errors */ }
                } catch (e) { console.error('play', e); showToast('error','Spotify','Play failed'); }
            });
            actions.appendChild(playBtn);

            row.appendChild(img);
            meta.appendChild(title); meta.appendChild(sub);
            row.appendChild(meta);
            row.appendChild(actions);
            spotifyResults.appendChild(row);
        });
    }

    playPauseBtn?.addEventListener('click', async () => {
        try {
            const st = await fetch('/api/spotify/status');
            const j = await st.json();
            const playing = j && j.player && j.player.is_playing;
            if (playing) {
                // include device if selected
                const body = {};
                try { const sel = spotifyDeviceSelect && spotifyDeviceSelect.value; if (sel) body.device_id = sel; } catch (e) {}
                await fetch('/api/spotify/pause', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
            } else {
                const body = {};
                try { const sel = spotifyDeviceSelect && spotifyDeviceSelect.value; if (sel) body.device_id = sel; } catch (e) {}

                // If a device is selected, attempt to transfer playback to it first
                if (body.device_id) {
                    try {
                        const dres = await fetch('/api/spotify/devices');
                        const dj = dres.ok ? await dres.json().catch(()=>null) : null;
                        const dev = dj && dj.devices && dj.devices.find(x => x.id === body.device_id);
                        if (dev && !dev.is_active) {
                            try { showToast('info','Spotify','Activating device...'); } catch(e){}
                            await fetch('/api/spotify/transfer', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ device_ids: [body.device_id], play: false }) }).catch(()=>null);
                            await new Promise(r => setTimeout(r, 350));
                        }
                    } catch (e) { /* ignore */ }
                }

                await fetch('/api/spotify/play', { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
            }
            await refreshSpotifyStatusUI();
        } catch (e) { console.error('playpause', e); }
    });
    nextBtn?.addEventListener('click', async () => { try { const body = {}; try { const sel = spotifyDeviceSelect && spotifyDeviceSelect.value; if (sel) body.device_id = sel; } catch(e){}; const resp = await fetch('/api/spotify/next', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); const pj = await resp.json().catch(()=>null); if (!resp.ok) showToast('error','Spotify','Next failed: ' + (pj && pj.error ? pj.error : resp.status)); await refreshSpotifyStatusUI(); } catch (e) { console.error(e); } });
    prevBtn?.addEventListener('click', async () => { try { const body = {}; try { const sel = spotifyDeviceSelect && spotifyDeviceSelect.value; if (sel) body.device_id = sel; } catch(e){}; const resp = await fetch('/api/spotify/previous', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); const pj = await resp.json().catch(()=>null); if (!resp.ok) showToast('error','Spotify','Previous failed: ' + (pj && pj.error ? pj.error : resp.status)); await refreshSpotifyStatusUI(); } catch (e) { console.error(e); } });

    // hook up refresh devices button if present
    if (spotifyRefreshDevicesBtn) {
        spotifyRefreshDevicesBtn.addEventListener('click', async () => {
            try { await fetchAndPopulateDevices(); showToast('success','Spotify','Device list refreshed'); } catch (e) { showToast('error','Spotify','Failed to refresh devices'); }
        });
    }

    // Fetch available devices and populate the selector
    async function fetchAndPopulateDevices() {
        try {
            if (!spotifyDeviceSelect) return;
            spotifyDeviceSelect.innerHTML = '<option value="">(loading...)</option>';
            const res = await fetch('/api/spotify/devices');
            if (!res.ok) throw new Error('failed to fetch devices');
            const j = await res.json();
            spotifyDeviceSelect.innerHTML = '';
            if (!j || !j.devices || !j.devices.length) {
                const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No devices found'; spotifyDeviceSelect.appendChild(opt);
                return;
            }
            // sort devices by active first
            j.devices.sort((a,b) => (b.is_active === true) - (a.is_active === true));
            let firstActive = null;
            j.devices.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id || '';
                opt.textContent = (d.name || 'Unknown') + (d.is_active ? ' (active)' : '') + (d.is_restricted ? ' (restricted)' : '');
                spotifyDeviceSelect.appendChild(opt);
                if (!firstActive && d.is_active) firstActive = d.id;
            });
            // if there's an active device, select it by default
            try { if (firstActive) spotifyDeviceSelect.value = firstActive; } catch (e) {}
        } catch (e) {
            console.error('devices', e);
            if (spotifyDeviceSelect) { spotifyDeviceSelect.innerHTML = ''; const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'Error loading devices'; spotifyDeviceSelect.appendChild(opt); }
        }
    }

    async function refreshSpotifyStatusUI() {
        try {
            const res = await fetch('/api/spotify/status');
            const j = await res.json();
            if (!j || !j.authenticated) {
                spotifyAuthStatus.textContent = 'Not connected';
                spotifyControls.classList.add('hidden');
                document.getElementById('spotifyAuth').classList.remove('hidden');
                return;
            }
            document.getElementById('spotifyAuth').classList.add('hidden');
            spotifyControls.classList.remove('hidden');
            const player = j.player || {};
            if (player && player.item) {
                const track = player.item;
                // update compact now-playing meta
                const coverEl = document.getElementById('spotifyNowCover');
                const titleEl = document.getElementById('spotifyNowTitle');
                const artistEl = document.getElementById('spotifyNowArtist');
                try {
                    const imgUrl = (track.album && track.album.images && track.album.images[2] && track.album.images[2].url) || (track.images && track.images[2] && track.images[2].url) || '';
                    if (coverEl && imgUrl) { coverEl.src = imgUrl; coverEl.style.display = ''; }
                    else if (coverEl) { coverEl.style.display = 'none'; }
                } catch (e) { if (coverEl) coverEl.style.display = 'none'; }
                try { if (titleEl) titleEl.textContent = track.name || ''; } catch (e) {}
                try { if (artistEl) artistEl.textContent = (track.artists || []).map(a=>a.name).join(', ') || ''; } catch (e) {}

                // update play/pause icon
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                // not playing
                const coverEl = document.getElementById('spotifyNowCover'); if (coverEl) coverEl.style.display = 'none';
                const titleEl = document.getElementById('spotifyNowTitle'); if (titleEl) titleEl.textContent = 'Not playing';
                const artistEl = document.getElementById('spotifyNowArtist'); if (artistEl) artistEl.textContent = '';
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        } catch (e) { console.error('status ui', e); }
    }

    // --- Spotify seek/slider support ---
    // Format milliseconds as M:SS
    function formatMs(ms) {
        if (!ms && ms !== 0) return '0:00';
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2,'0')}`;
    }

    let spotifyPollingInterval = null;
    let spotifyIsDragging = false;

    async function updateSeekFromStatus() {
        try {
            const res = await fetch('/api/spotify/status');
            if (!res.ok) return;
            const j = await res.json();
            const player = j.player || {};
            const progress = (player && typeof player.progress_ms === 'number') ? player.progress_ms : null;
            const dur = (player && player.item && typeof player.item.duration_ms === 'number') ? player.item.duration_ms : null;

            const slider = document.getElementById('spotifySeekSlider');
            const cur = document.getElementById('spotifyCurrentTime');
            const tot = document.getElementById('spotifyTotalTime');
            if (!slider || !cur || !tot) return;

            if (dur) {
                // Update max in milliseconds
                slider.max = Math.max(1, Math.floor(dur));
                tot.textContent = formatMs(dur);
            } else {
                slider.max = 100;
                tot.textContent = '0:00';
            }

            if (progress !== null && !spotifyIsDragging) {
                // Set slider value to current progress
                slider.value = Math.min(slider.max, Math.floor(progress));
                cur.textContent = formatMs(progress);
            }
        } catch (e) {
            // ignore transient errors
        }
    }

    function startSpotifyPolling() {
        if (spotifyPollingInterval) return;
        // initial immediate update
        updateSeekFromStatus();
        spotifyPollingInterval = setInterval(updateSeekFromStatus, 1200);
    }

    function stopSpotifyPolling() {
        if (spotifyPollingInterval) { clearInterval(spotifyPollingInterval); spotifyPollingInterval = null; }
    }

    // Wire slider interaction: suspend polling while dragging, send seek when released
    function setupSpotifySeekHandlers() {
        const slider = document.getElementById('spotifySeekSlider');
        if (!slider) return;

        let pointerDown = false;
        // For mouse/touch interactions
        slider.addEventListener('pointerdown', (e) => {
            spotifyIsDragging = true;
            stopSpotifyPolling();
            pointerDown = true;
        });

        const endDrag = async (e) => {
            if (!pointerDown) return;
            pointerDown = false;
            // send seek request
            try {
                const pos = parseInt(slider.value, 10) || 0;
                // Call server seek endpoint (PUT)
                await fetch('/api/spotify/seek', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ position_ms: pos })
                });
            } catch (err) {
                console.warn('seek failed', err);
            }
            spotifyIsDragging = false;
            // refresh UI and resume polling
            updateSeekFromStatus();
            startSpotifyPolling();
        };

        slider.addEventListener('pointerup', endDrag);
        slider.addEventListener('pointercancel', endDrag);

        // Also support keyboard changes (left/right arrows) and mouse change events
        slider.addEventListener('change', async (e) => {
            if (spotifyIsDragging) return; // pointer events will handle
            try {
                const pos = parseInt(slider.value, 10) || 0;
                await fetch('/api/spotify/seek', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ position_ms: pos })
                });
                updateSeekFromStatus();
            } catch (err) { console.warn('seek change failed', err); }
        });
    }

    // Start polling when Spotify modal is opened; ensure handlers exist
    // We hook into the existing spotify modal open logic by starting polling now
    // and setting up handlers (safe to call multiple times).
    try { setupSpotifySeekHandlers(); startSpotifyPolling(); } catch (e) {}

    // Helper: attempt to open the Spotify desktop app via protocol (deep link).
    // If that fails (likely because app/protocol handler isn't available),
    // fall back to opening the Spotify web player URL. This is best-effort —
    // browsers may block protocol opens without a direct user gesture.
    function openSpotifyAppOrWeb(deepUri, webUrl) {
        try {
            webUrl = webUrl || 'https://open.spotify.com/';

            // Normalize deepUri
            if (deepUri && typeof deepUri === 'string') deepUri = deepUri.trim();

            // 1) Try window.open with the deep link. If it returns a window handle, assume success.
            try {
                if (deepUri) {
                    const w = window.open(deepUri, '_blank');
                    // Some browsers return null when popup/open blocked — treat as failure
                    if (w) {
                        try { w.focus(); } catch (e) {}
                        return;
                    }
                }
            } catch (e) {
                // ignore and try iframe fallback
            }

            // 2) Fallback: create a hidden iframe and set src to the protocol link.
            // After a short timeout, open the webUrl in a new tab.
            if (deepUri) {
                const ifr = document.createElement('iframe');
                ifr.style.width = '0';
                ifr.style.height = '0';
                ifr.style.border = '0';
                ifr.style.position = 'absolute';
                ifr.style.left = '-9999px';
                // Ensure it's not focusable
                ifr.setAttribute('aria-hidden', 'true');
                document.body.appendChild(ifr);
                let cleaned = false;
                try {
                    ifr.src = deepUri;
                } catch (e) {
                    // ignore
                }

                // After timeout, remove iframe and open web URL as fallback
                setTimeout(() => {
                    try { if (ifr && ifr.parentNode) ifr.parentNode.removeChild(ifr); } catch (e) {}
                    try { window.open(webUrl, '_blank', 'noopener'); } catch (e) { window.location.href = webUrl; }
                }, 900);

                return;
            }

            // 3) If no deepUri provided or previous attempts didn't run, open webUrl
            try { window.open(webUrl, '_blank', 'noopener'); } catch (e) { window.location.href = webUrl; }
        } catch (e) {
            try { window.open(webUrl || 'https://open.spotify.com/', '_blank', 'noopener'); } catch (err) { window.location.href = webUrl || 'https://open.spotify.com/'; }
        }
    }

    // -----------------------------
    // Now-Playing Modal (legacy) — REMOVED
    // -----------------------------
    // The legacy floating Now-Playing modal has been removed and its UI
    // consolidated into the main #spotifyModal. We keep a tiny shim for
    // any stray references that may still call openNowPlayingModal(track).
    // Call sites should instead open the primary spotify modal and call
    // refreshSpotifyStatusUI().

    function openNowPlayingModal(track) {
        // Legacy shim: open consolidated Spotify modal and refresh its status
        try {
            try { closeModal(); } catch (e) {}
            // openModal is defined in the Spotify modal code path
            if (typeof openModal === 'function') openModal();
            if (window.refreshSpotifyStatusUI) setTimeout(() => { try { const p = window.refreshSpotifyStatusUI(); if (p && typeof p.then === 'function') p.catch(()=>{}); } catch(e){ try{ window.refreshSpotifyStatusUI(); }catch{} } }, 120);
        } catch (e) {
            // swallow errors for shim
            console.warn('openNowPlayingModal shim failed', e);
        }
    }

    // Bind the main Spotify toolbar/button to open the consolidated Spotify modal
    function bindSpotifyToolbarButton() {
        const btn = document.getElementById('spotifyBtn');
        if (!btn) return;
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch('/api/spotify/status');
                if (!res.ok) { showToast('warning','Spotify','Unable to fetch status'); return; }
                const j = await res.json();
                if (!j || !j.authenticated) { showToast('info','Spotify','Please connect your Spotify account'); return; }
                const player = j.player || {};
                const item = player.item || null;
                if (!item) { showToast('info','Spotify','No track is currently playing'); return; }
                // close search modal if open
                try { closeModal(); } catch (e) {}
                // Open the main Spotify modal and refresh its UI
                try { if (typeof openModal === 'function') openModal(); } catch(e) {}
                try { if (window.refreshSpotifyStatusUI) { const p = window.refreshSpotifyStatusUI(); if (p && typeof p.then === 'function') p.catch(()=>{}); } } catch (e) {}
            } catch (e) { console.error('spotifyBtn click', e); showToast('error','Spotify','Failed to open Spotify'); }
        });
    }

    // run toolbar binding during init
    try { bindSpotifyToolbarButton(); } catch (e) {}

    window.refreshSpotifyStatusUI = refreshSpotifyStatusUI;
}

document.addEventListener('DOMContentLoaded', () => { try { initSpotifyUI(); } catch (e) { console.warn('initSpotifyUI failed', e); } });

// If the page loaded after Spotify redirected back with tokens, refresh status so UI updates
document.addEventListener('DOMContentLoaded', () => {
    try {
        // small delay to let session cookie be applied
        setTimeout(() => { if (window.refreshSpotifyStatusUI) window.refreshSpotifyStatusUI().catch(()=>{}); }, 220);
    } catch (e) { /* ignore */ }
});

// Helper: enable wheel-to-scroll for the tabsContainer (vertical wheel -> horizontal scroll)
function enableTabsWheelScroll() {
    const tabs = document.getElementById('tabsContainer');
    if (!tabs) return;

    // On wheel, translate vertical delta to horizontal scroll so users can
    // scroll through many open tabs by using the mouse wheel. Up -> scroll left,
    // Down -> scroll right. We implement a small animated scroller using
    // requestAnimationFrame to ease the scroll for smoothness and inertial feel.
    tabs.addEventListener('wheel', (e) => {
        // Only handle vertical wheel movements (deltaY)
        const deltaY = e.deltaY || (e.wheelDelta ? -e.wheelDelta : 0);
        if (!deltaY) return;
        // Prevent the page or other containers from scrolling while over tabs
        e.preventDefault();

        // Respect user preference for reduced motion
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Cap the delta so very fast wheels don't overshoot
        const capped = Math.max(-400, Math.min(400, deltaY));

        // If user prefers reduced motion, perform direct jump without easing
        if (prefersReduced) {
            tabs.scrollLeft += capped;
            // Also sync target if present
            tabs._targetScrollLeft = tabs.scrollLeft;
            return;
        }

        // Initialize target scroll position if needed
        if (typeof tabs._targetScrollLeft !== 'number' || tabs._dragging) tabs._targetScrollLeft = tabs.scrollLeft;
        tabs._targetScrollLeft += capped;
        // Clamp to valid range
        tabs._targetScrollLeft = Math.max(0, Math.min(tabs.scrollWidth - tabs.clientWidth, tabs._targetScrollLeft));

        // If an animation is already running, just update the target and let it continue
        if (tabs._scrollAnimating) return;
        tabs._scrollAnimating = true;

        // Animation loop: ease toward target using an exponential/lerp blend
        const animate = () => {
            const cur = tabs.scrollLeft;
            const target = tabs._targetScrollLeft;
            const diff = target - cur;
            const abs = Math.abs(diff);

            // Stop condition
            if (abs < 0.5) {
                tabs.scrollLeft = target;
                tabs._scrollAnimating = false;
                return;
            }

            // Easing factor: lower => slower/smoother, higher => snappier
            const ease = 0.18;
            tabs.scrollLeft = cur + diff * ease;

            // Continue
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, { passive: false });

    // Improve pointer UX: when hovering tabs, allow horizontal drag via click+drag.
    // Do NOT capture pointer immediately on pointerdown (that interferes with clicks).
    // Instead enter a "pending drag" state and only activate dragging (and pointer capture)
    // after the pointer moves beyond a small threshold. Also ignore attempts when the
    // initial target is an interactive element (tab-actions or tab-name) so ordinary
    // clicks still work.
    let isPending = false;
    let isDragging = false;
    let startX = 0, scrollStart = 0, pendingId = null;
    const DRAG_THRESHOLD = 6; // pixels

    tabs.addEventListener('pointerdown', (e) => {
        // If the user clicked on a tab action (close/grip) or the tab name, don't start drag
        if (e.target.closest && e.target.closest('.tab-actions, .tab .tab-name, .tab .tab-actions i')) {
            isPending = false;
            return;
        }

        // Cancel any running scroll animation while user begins potential dragging
        tabs._scrollAnimating = false;
        if (typeof tabs._targetScrollLeft === 'number') tabs._targetScrollLeft = tabs.scrollLeft;

        isPending = true;
        pendingId = e.pointerId;
        startX = e.clientX;
        scrollStart = tabs.scrollLeft;
        tabs.classList.add('dragging-tabs');
        // Do NOT setPointerCapture yet; wait until movement exceeds threshold
    });

    tabs.addEventListener('pointermove', (e) => {
        if (!isPending && !isDragging) return;

        const dx = e.clientX - startX;

        // If pending and movement exceeds threshold, activate dragging mode
        if (isPending && Math.abs(dx) > DRAG_THRESHOLD) {
            isPending = false;
            isDragging = true;
            tabs._dragging = true;
            // Try to capture pointer now to ensure consistent move/up events
            try { tabs.setPointerCapture(pendingId); } catch (err) {}
        }

        if (isDragging) {
            tabs.scrollLeft = Math.max(0, Math.min(tabs.scrollWidth - tabs.clientWidth, scrollStart - dx));
        }
    });

    const finishDrag = (e) => {
        if (isPending || isDragging) {
            isPending = false;
            isDragging = false;
            tabs._dragging = false;
            tabs.classList.remove('dragging-tabs');
            try { if (e && e.pointerId) tabs.releasePointerCapture(e.pointerId); } catch (err) {}
            // sync target scroll position
            tabs._targetScrollLeft = tabs.scrollLeft;
        }
    };

    tabs.addEventListener('pointerup', finishDrag);
    tabs.addEventListener('pointercancel', finishDrag);
}

// Enable tabs wheel scrolling once DOM is ready
document.addEventListener('DOMContentLoaded', () => { setTimeout(enableTabsWheelScroll, 50); });

// Enable breadcrumb wheel->horizontal scrolling (only mouse wheel, no visible slider)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const bc = document.querySelector('.editor-breadcrumb');
        if (!bc) return;

        // Translate vertical wheel to horizontal scroll. Respect reduced-motion.
        bc.addEventListener('wheel', (e) => {
            // Only handle vertical delta (mouse wheel). If user used shift+wheel
            // or horizontal wheel we let the browser handle it.
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // already horizontal
            const deltaY = e.deltaY || (e.wheelDelta ? -e.wheelDelta : 0);
            if (!deltaY) return;
            e.preventDefault();

            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const step = prefersReduced ? deltaY : deltaY * 1.2; // slight amplification for feel

            // Smooth scroll if supported
            if ('scrollBy' in bc && typeof bc.scrollBy === 'function') {
                try {
                    bc.scrollBy({ left: step, behavior: prefersReduced ? 'auto' : 'smooth' });
                } catch (err) {
                    bc.scrollLeft += step;
                }
            } else {
                bc.scrollLeft += step;
            }
        }, { passive: false });
    }, 60);
});

// ============================================
// Font size overlay indicator (per-panel)
// Shows a large transient number in the center of the panel when user changes font size
// via the settings range inputs or mouse wheel while focused/hovering a panel.
// This implementation also listens to the editor/console range inputs so the
// overlay appears when users use the sliders.
// ============================================
(function setupFontSizeIndicators() {
    const panelSelectors = ['.left-panel', '.output-container', '.variables-container', '.repl-wrapper'];

    // WeakMap to store per-indicator timeout ids
    const hideTimers = new WeakMap();

    function readAccentRGBA() {
        const root = getComputedStyle(document.documentElement);
        let accent = root.getPropertyValue('--theme-accent') || root.getPropertyValue('--accent-primary') || '#007acc';
        accent = (accent || '#007acc').trim();
        if (accent.startsWith('#')) {
            const hex = accent.replace('#','');
            const normalized = hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex;
            const bigint = parseInt(normalized, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, 0.8)`;
        }
        if (accent.startsWith('rgb')) {
            return accent.replace(/rgba?\(([^)]+)\)/, (m, inner) => {
                const parts = inner.split(',').map(s=>s.trim());
                return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.8)`;
            });
        }
        // fallback to a sensible color
        return 'rgba(0, 122, 204, 0.8)';
    }

    function createIndicator(panelEl) {
        if (!panelEl) return null;
        const ind = document.createElement('div');
        ind.className = 'font-size-indicator';

        // Force inline styles to avoid accidental overrides from heavy CSS elsewhere
        Object.assign(ind.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            fontSize: '40px',
            fontWeight: '600',
            background: 'transparent',
            border: 'none',
            padding: '0',
            margin: '0',
            zIndex: '99999',
            opacity: '0',
            transition: 'opacity 0.08s linear',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: '1',
            textShadow: '0 1px 0 rgba(0,0,0,0.6)'
        });

        // Ensure the panel can position children absolutely without changing layout
        const cs = window.getComputedStyle(panelEl);
        if (cs.position === 'static') panelEl.style.position = 'relative';

        panelEl.appendChild(ind);
        return ind;
    }

    const panelIndicators = [];
    panelSelectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        const ind = createIndicator(el);
        if (ind) panelIndicators.push({ panel: el, indicator: ind });
    });

    function show(panelEl, value) {
        const entry = panelIndicators.find(p => p.panel === panelEl);
        if (!entry) return;
        const ind = entry.indicator;

        // Compute the actual displayed font-size from the rendered element so
        // the overlay always matches the number shown in the small black box.
        function resolvedFontSize() {
            try {
                // Editor (CodeMirror)
                if (panelEl.classList.contains('left-panel')) {
                    const cm = document.querySelector('.CodeMirror');
                    if (cm) return parseInt(getComputedStyle(cm).fontSize, 10);
                }

                // Output console
                if (panelEl.classList.contains('output-container')) {
                    const out = document.getElementById('outputConsole') || document.querySelector('.output-console');
                    if (out) return parseInt(getComputedStyle(out).fontSize, 10);
                }

                // Variables pane
                if (panelEl.classList.contains('variables-container')) {
                    const vars = document.getElementById('variablesContent') || document.querySelector('.variables-content');
                    if (vars) return parseInt(getComputedStyle(vars).fontSize, 10);
                }

                // REPL
                if (panelEl.classList.contains('repl-wrapper')) {
                    const repl = document.getElementById('replOutput') || document.querySelector('.repl-output');
                    if (repl) return parseInt(getComputedStyle(repl).fontSize, 10);
                }

                // Fallback to panel computed size
                const fs = parseInt(getComputedStyle(panelEl).fontSize, 10);
                if (!isNaN(fs)) return fs;
            } catch (e) {
                // ignore and fall back
            }
            // Last resort: use provided value
            return parseInt(value, 10) || AppState.settings.editorFontSize || 14;
        }

        const actualSize = resolvedFontSize();

        ind.textContent = actualSize + 'px';
        ind.style.color = readAccentRGBA();
        ind.style.background = 'transparent';
        ind.style.boxShadow = 'none';
        ind.style.opacity = '0.8';
        // Also add a visible class so CSS-based rules can apply reliably
        ind.classList.add('visible');

        // clear previous timer
        const prev = hideTimers.get(ind);
        if (prev) clearTimeout(prev);

        // hide quickly after 300ms (practical visible duration) but remain snappy
        const t = setTimeout(() => {
            ind.style.opacity = '0';
            ind.classList.remove('visible');
        }, 300);
        hideTimers.set(ind, t);
    }

    function whichPanelFromTarget(target) {
        for (const entry of panelIndicators) {
            if (entry.panel.contains(target)) return entry.panel;
        }
        return null;
    }

    // Track middle-button (wheel button) state so ordinary scrolling doesn't
    // trigger font-size overlays. We only show overlays when middle is held,
    // or when the event target is a range input (user intentionally changing size).
    let isMiddleDown = false;
    document.addEventListener('pointerdown', (e) => {
        if (e.button === 1) isMiddleDown = true;
    });
    document.addEventListener('pointerup', (e) => {
        if (e.button === 1) isMiddleDown = false;
    });

    // Wheel handler: show indicator when user uses Ctrl+wheel (common pattern)
    // or when wheel occurs while hovering a panel (non-destructive: we don't
    // prevent scrolling unless ctrlKey is pressed). This allows the overlay
    // to appear even if the user uses a mouse wheel without modifier when
    // the panel is focused (but it won't block scrolling).
    function handleWheel(e) {
        const panelEl = whichPanelFromTarget(e.target) || whichPanelFromTarget(document.elementFromPoint(e.clientX, e.clientY));
        if (!panelEl) return; // not over a tracked panel

        // Determine delta direction
        const delta = Math.sign(e.deltaY || e.wheelDelta || -e.detail) || 0;

    // Only treat as font-size change when user is holding the middle button
    // (isMiddleDown) or the event target is a range input (slider). This avoids
    // showing overlays during normal mousewheel scrolling.
    const treatAsFontChange = isMiddleDown || e.target.type === 'range';
    if (!treatAsFontChange) return; // ignore ordinary scrolls
    // Prevent page scroll when intentionally changing font
    e.preventDefault();

        if (panelEl.classList.contains('left-panel')) {
            AppState.settings.editorFontSize = Math.max(8, Math.min(48, AppState.settings.editorFontSize - delta));
            const codeMirror = document.querySelector('.CodeMirror');
            if (codeMirror) codeMirror.style.fontSize = AppState.settings.editorFontSize + 'px';
            show(panelEl, AppState.settings.editorFontSize);
        } else {
            AppState.settings.consoleFontSize = Math.max(8, Math.min(48, AppState.settings.consoleFontSize - delta));
            const outputConsole = document.getElementById('outputConsole');
            if (outputConsole) outputConsole.style.fontSize = AppState.settings.consoleFontSize + 'px';
            show(panelEl, AppState.settings.consoleFontSize);
        }
    }

    // Also listen to the settings range inputs so the overlay appears when
    // the user drags or clicks the slider.
    const editorRange = document.getElementById('editorFontSize');
    const consoleRange = document.getElementById('consoleFontSize');
    if (editorRange) {
        editorRange.addEventListener('input', (e) => {
            const panelEl = document.querySelector('.left-panel');
            const val = parseInt(e.target.value, 10) || AppState.settings.editorFontSize;
            AppState.settings.editorFontSize = val;
            const codeMirror = document.querySelector('.CodeMirror');
            if (codeMirror) codeMirror.style.fontSize = val + 'px';
            if (panelEl) show(panelEl, val);
        });
    }
    if (consoleRange) {
        consoleRange.addEventListener('input', (e) => {
            const panelEl = document.querySelector('.output-container');
            const val = parseInt(e.target.value, 10) || AppState.settings.consoleFontSize;
            AppState.settings.consoleFontSize = val;
            const outputConsole = document.getElementById('outputConsole');
            if (outputConsole) outputConsole.style.fontSize = val + 'px';
            if (panelEl) show(panelEl, val);
        });
    }

    document.addEventListener('wheel', handleWheel, { passive: false });

    // Expose a test helper to manually flash all indicators (useful for debugging)
    window.flashFontSizeIndicators = function() {
        panelIndicators.forEach(({panel, indicator}) => {
            const val = panel.classList.contains('left-panel') ? AppState.settings.editorFontSize : (panel.classList.contains('output-container') ? AppState.settings.consoleFontSize : AppState.settings.consoleFontSize);
            show(panel, val);
        });
    };

    // If URL contains ?flashIndicators=1 flash on load to help debugging
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('flashIndicators') === '1') {
            setTimeout(() => window.flashFontSizeIndicators(), 600);
        }
    } catch (e) { /* ignore */ }

})();

// ============================================
// Keyboard Shortcuts
// ============================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S - Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCode();
        }
        
        // Ctrl+L - Clear Console
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            clearConsole();
        }
        
        // Ctrl+N - New Session
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newSession();
        }
        
        // Arrow keys for history navigation (when editor is focused)
        if (AppState.editor.hasFocus()) {
            if (e.ctrlKey && e.key === 'ArrowUp') {
                e.preventDefault();
                navigateHistory('up');
            }
            if (e.ctrlKey && e.key === 'ArrowDown') {
                e.preventDefault();
                navigateHistory('down');
            }
        }
    });
    
    console.log('✅ Keyboard shortcuts enabled');
}

// ============================================
// Code Execution
// ============================================
async function executeCode() {
    const code = AppState.editor.getValue().trim();
    
    if (!code) {
        showToast('warning', 'Empty Code', 'Please write some code first.');
        return;
    }
    
    // Execute code - interactive input will be handled during execution
    await executeCodeInteractive(code);
}

async function executeCodeInteractive(code, collectedInputs = []) {
    // Clear console only on first execution (not during recursive calls for multiple inputs)
    if (collectedInputs.length === 0) {
        const outputConsole = document.getElementById('outputConsole');
        const welcome = outputConsole.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        // Don't clear completely, just remove old output except input prompts
        AppState.executionCount++;
    }
    
    // Debounce status update to avoid a millisecond flash when execution
    // completes very quickly. Only show running state after 140ms.
    let statusTimer = setTimeout(() => {
        // Use an empty message so the running spinner appears without the
        // transient "Executing..." text that caused a brief flash.
        updateStatus('running', '');
        showLoading(true);
        statusTimer = null;
    }, 140);
    
    const startTime = performance.now();
    
    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code: code, 
                mode: 'exec',
                inputs: collectedInputs
            })
        });
        
        const result = await response.json();
        const endTime = performance.now();
        const executionTime = ((endTime - startTime) / 1000).toFixed(3);
        
        // Check if more input is required
        if (result.input_required) {
            // Show what we have so far
            displayOutputPartial(result);
            
            // Show input prompt and wait for user input
            updateStatus('waiting', 'Waiting for input...');
            showLoading(false);
            
            const userInput = await promptForInput(result.input_prompt);
            
            if (userInput === null) {
                // User cancelled
                updateStatus('ready', 'Execution cancelled');
                return;
            }
            
            // Add input to collection and continue execution
            collectedInputs.push(userInput);
            await executeCodeInteractive(code, collectedInputs);
            return;
        }
        
        // Execution complete
        displayOutput(result, executionTime);
        updateExecutionStats(result.success, executionTime);
        addToHistory(code, result.success, executionTime);
        
        if (result.success) {
            updateStatus('ready', 'Execution completed');
            showToast('success', 'Success', `Code executed in ${executionTime}s`);
            playSound('success');
        } else {
            updateStatus('error', 'Execution failed');
            showToast('error', 'Error', 'Code execution failed');
            playSound('error');
        }
        
        // Auto-refresh variables
        await refreshVariables();
        
    } catch (error) {
        if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
        updateStatus('error', 'Network error');
        showToast('error', 'Error', 'Failed to execute code: ' + error.message);
        console.error('Execution error:', error);
    } finally {
        if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
        showLoading(false);
    }
}

function displayOutputPartial(result) {
    // Render partial output into the Output Console so input prompts
    // appear in the same place as final output. This avoids switching
    // to a separate terminal UI when input() is required.
    try {
        const outputConsole = document.getElementById('outputConsole');
        if (!outputConsole) return;

        // If there's textual output, append it line-by-line similar to displayOutput
        // When the server returns an input prompt (input_required) it may include
        // multiple prompt labels. Render those so the first prompt line shows the
        // arrow prefix (-->) and subsequent prompt lines are aligned under it
        // (empty prefix span) so the console looks like a single grouped block.
        const isInputPrompt = result && result.input_required && result.input_prompt;
        if (result && result.output) {
            const lines = String(result.output).split('\n');
            lines.forEach((line, index) => {
                const processedLine = line.replace(/^\s+/, '');
                if (processedLine === '') {
                    if (index < lines.length - 1) outputConsole.appendChild(document.createElement('br'));
                    return;
                }
                const lineDiv = document.createElement('div');
                // Keep output-stdout so prefix alignment styles apply
                lineDiv.className = 'output-line output-stdout';
                const linePrefixSpan = document.createElement('span');
                linePrefixSpan.className = 'output-prefix';
                // For input prompts: show arrow only on the first returned line;
                // subsequent lines get an empty prefix placeholder for alignment.
                if (isInputPrompt) {
                    linePrefixSpan.textContent = index === 0 ? '--> ' : '';
                } else {
                    linePrefixSpan.textContent = index === 0 ? '--> ' : '';
                }
                lineDiv.appendChild(linePrefixSpan);
                lineDiv.appendChild(document.createTextNode(processedLine));
                outputConsole.appendChild(lineDiv);
            });
        }

        // Errors in partial output (if any) -> show as stderr lines
        if (result && result.error) {
            const errLines = String(result.error).split('\n');
            errLines.forEach((ln, i) => {
                const processed = ln.replace(/^\s+/, '');
                if (processed === '') { outputConsole.appendChild(document.createElement('br')); return; }
                const lineDiv = document.createElement('div');
                lineDiv.className = 'output-line output-stderr';
                const prefix = document.createElement('span'); prefix.className = 'output-prefix';
                prefix.textContent = i === 0 ? '--> ' : '';
                lineDiv.appendChild(prefix);
                lineDiv.appendChild(document.createTextNode(processed));
                outputConsole.appendChild(lineDiv);
            });
        }

        outputConsole.scrollTop = outputConsole.scrollHeight;
        try { updateOutputCounts(); } catch (e) { }
    } catch (e) {
        console.warn('displayOutputPartial failed', e);
    }
}

function promptForInput(promptText) {
    return new Promise((resolve) => {
        try {
            const outputConsole = document.getElementById('outputConsole');
            if (!outputConsole) { resolve(prompt(promptText) || ''); return; }

            // Remove any welcome message so the prompt appears cleanly
            const welcome = outputConsole.querySelector('.welcome-message');
            if (welcome) welcome.remove();

            // Ensure the full-page loading spinner/overlay is not visible
            // while we show the inline prompt. Some flows previously left
            // the overlay visible which blocked pointer events and left
            // the circling spinner stuck on screen. We add a prompt-active
            // marker so CSS can hide the spinner while the prompt is active.
            try {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) {
                    overlay.classList.remove('active');
                    overlay.classList.add('prompt-active');
                    // mark dataset so showLoading will ignore attempts to show
                    overlay.dataset.promptActive = '1';
                }
            } catch (e) { /* ignore overlay toggling errors */ }

            // Determine if the server already printed the prompt text in the
            // partial output. If so, avoid adding the same label again and
            // only show a caret/input element so we don't duplicate lines.
            const recentLines = Array.from(outputConsole.querySelectorAll('.output-line.output-info, .output-line.output-stdout'));
            const lastLine = recentLines.length ? recentLines[recentLines.length - 1] : null;
            const promptTextStr = String(promptText || '').trim();
            const promptAlreadyShown = lastLine && lastLine.textContent && lastLine.textContent.trim() === promptTextStr;

            // Create an inline prompt row inside the output console
            const promptRow = document.createElement('div');
            promptRow.className = 'output-line output-prompt';

            const prefix = document.createElement('span');
            prefix.className = 'output-prefix';
            // If the prompt was already printed, don't show another arrow prefix
            prefix.textContent = promptAlreadyShown ? '' : '--> ';
            promptRow.appendChild(prefix);

            // Only add the visible prompt label when it wasn't already printed
            if (!promptAlreadyShown) {
                const promptLabel = document.createElement('span');
                promptLabel.className = 'prompt-label';
                promptLabel.textContent = promptTextStr;
                promptLabel.style.marginRight = '8px';

                // Determine a prompt type based on common prompt text patterns
                const lower = promptTextStr.toLowerCase();
                let pclass = '';
                if (lower.includes('int') || /\bint\b/.test(lower)) pclass = 'prompt-int';
                else if (lower.includes('float')) pclass = 'prompt-float';
                else if (lower.includes('str') || lower.includes('string')) pclass = 'prompt-str';
                else if (lower.includes('list')) pclass = 'prompt-list';
                else if (lower.includes('tuple')) pclass = 'prompt-tuple';
                else if (lower.includes('dict') || lower.includes('dictionary')) pclass = 'prompt-dict';
                else if (lower.includes('set')) pclass = 'prompt-set';

                if (pclass) promptLabel.classList.add(pclass);
                promptRow.appendChild(promptLabel);
            }

            // Record last prompt info in AppState so other UI parts can reference it
            try {
                AppState.lastPromptText = promptTextStr;
                // normalize class name (e.g. 'prompt-int' -> 'int')
                if (pclass) AppState.lastInputType = pclass.replace('prompt-', '');
                else AppState.lastInputType = null;
            } catch (e) { /* ignore */ }

            // Create a minimal caret input using a contenteditable span so the
            // UI shows a thin blinking caret instead of a boxed input.
            const inputEl = document.createElement('span');
            inputEl.contentEditable = 'true';
            inputEl.className = 'inline-input-caret';
            // Inline styles to make the span look like just a caret
            Object.assign(inputEl.style, {
                display: 'inline-block',
                minWidth: '6px',
                padding: '0 2px',
                marginLeft: '6px',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                caretColor: 'var(--accent-primary, #9cdcfe)',
                whiteSpace: 'pre',
                verticalAlign: 'baseline'
            });
            // Prevent the span from receiving extra whitespace nodes
            inputEl.innerText = '';
            promptRow.appendChild(inputEl);

            // Add helpful hint for submit (kept subtle to the right)
            const hint = document.createElement('span');
            hint.className = 'input-hint';
            hint.textContent = ' (Enter to submit, Esc to cancel)';
            hint.style.marginLeft = '8px';
            hint.style.color = 'var(--text-tertiary)';
            promptRow.appendChild(hint);

            outputConsole.appendChild(promptRow);
            // Ensure visible
            outputConsole.scrollTop = outputConsole.scrollHeight;

            // Focus input and place caret at the end
            setTimeout(() => {
                try {
                    inputEl.focus();
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(inputEl);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch (e) { /* ignore */ }
            }, 20);

            function cleanupAndResolve(val) {
                try {
                    // If the prompt label was already printed by the server,
                    // append the typed value to that existing line. Otherwise
                    // convert the promptRow into a final stdout line and
                    // append the value there.
                    if (val !== null && val !== undefined) {
                        const valStr = String(val);
                        if (promptAlreadyShown && lastLine) {
                            // Append a small spacer and the value span to lastLine
                            const spacer = document.createTextNode(' ');
                            lastLine.appendChild(spacer);
                            const valueSpan = document.createElement('span');
                            valueSpan.className = 'input-value';
                            valueSpan.textContent = valStr;
                            valueSpan.style.color = 'var(--text-primary)';
                            lastLine.appendChild(valueSpan);
                            // Remove the transient caret row (we used server line)
                            try { promptRow.remove(); } catch (e) {}
                        } else {
                            // Convert the promptRow (which contains the caret) into
                            // a permanent stdout line and append the value to it.
                            promptRow.className = 'output-line output-stdout';
                            const pref = promptRow.querySelector('.output-prefix');
                            if (pref) pref.textContent = '--> ';
                            // Remove caret and hint elements before finalizing
                            const caret = promptRow.querySelector('.inline-input-caret');
                            if (caret) caret.remove();
                            const hintEl = promptRow.querySelector('.input-hint');
                            if (hintEl) hintEl.remove();
                            const valueSpan = document.createElement('span');
                            valueSpan.className = 'input-value';
                            valueSpan.textContent = valStr;
                            valueSpan.style.marginLeft = '6px';
                            promptRow.appendChild(valueSpan);
                        }
                        outputConsole.scrollTop = outputConsole.scrollHeight;
                    } else {
                        // User cancelled: just remove the transient prompt row
                        try { promptRow.remove(); } catch (e) {}
                    }
                } catch (e) {
                    try { promptRow.remove(); } catch (err) {}
                }
                // Remove prompt-active marker so overlay/spinner returns to normal
                try {
                    const overlay = document.getElementById('loadingOverlay');
                    if (overlay) {
                        overlay.classList.remove('prompt-active');
                        delete overlay.dataset.promptActive;
                    }
                } catch (e) { /* ignore */ }
                resolve(val);
            }

            // Key handlers
            const onKey = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Read textContent to preserve typed characters
                    const v = inputEl.textContent.replace(/\u00A0/g, '');
                    cleanupAndResolve(v);
                    inputEl.removeEventListener('keydown', onKey);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cleanupAndResolve(null);
                    inputEl.removeEventListener('keydown', onKey);
                }
            };

            // Listen on keydown for Enter/Escape
            inputEl.addEventListener('keydown', onKey);
            // Optional: prevent pasting HTML
            inputEl.addEventListener('paste', (ev) => {
                ev.preventDefault();
                const text = (ev.clipboardData || window.clipboardData).getData('text') || '';
                document.execCommand('insertText', false, text);
            });

        } catch (err) {
            console.warn('promptForInput fallback', err);
            resolve(prompt(promptText) || '');
        }
    });
}

function switchBackToConsole(outputConsole, xtermContainer) {
    // Add the last input interaction to console with color coding
    if (AppState.lastPromptText && AppState.lastInputValue !== undefined) {
        // Echo user input as plain text (no arrow prefix) to avoid
        // mixing with output prefix semantics.
    const inputEcho = document.createElement('div');
    inputEcho.className = 'output-line output-info';
    const promptText = String(AppState.lastPromptText).replace(trimLeading, '');

    // Create a span for the prompt text and a separate span for the value so
    // we can color the prompt and/or value separately based on type.
    const promptSpan = document.createElement('span');
    promptSpan.className = 'prompt-label';
    promptSpan.textContent = promptText;

    // add type class if available
    if (AppState.lastInputType) promptSpan.classList.add('prompt-' + AppState.lastInputType);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'input-value';
    valueSpan.textContent = String(AppState.lastInputValue).replace(trimLeading, '');
    valueSpan.style.marginLeft = '6px';

    inputEcho.appendChild(promptSpan);
    inputEcho.appendChild(valueSpan);
    outputConsole.appendChild(inputEcho);
        
        // Reset
        AppState.lastPromptText = null;
        AppState.lastInputValue = undefined;
        AppState.lastInputType = null;
    }
    
    xtermContainer.style.display = 'none';
    outputConsole.style.display = 'block';
    AppState.terminalActive = false;
    outputConsole.scrollTop = outputConsole.scrollHeight;
    try { updateOutputCounts(); } catch (e) { }
}

// ============================================
// Output Display
// ============================================
function displayOutput(result, executionTime) {
    // If terminal was used for input, show final output in terminal too
    if (AppState.terminalActive && AppState.terminal) {
        if (result.output) {
            const lines = result.output.split('\n');
            lines.forEach(line => {
                AppState.terminal.writeln(line);
            });
        }
        
        if (result.error) {
            AppState.terminal.writeln('\x1b[31m' + result.error + '\x1b[0m'); // Red text for errors
        }
        
        AppState.terminal.writeln('');
        AppState.terminal.writeln(`\x1b[32m✓ Execution completed in ${executionTime}s\x1b[0m`); // Green success message
        
        // Keep terminal visible for a moment, then switch back
        setTimeout(() => {
            const outputConsole = document.getElementById('outputConsole');
            const xtermContainer = document.getElementById('xtermContainer');
            switchBackToConsole(outputConsole, xtermContainer);
        }, 1000);
    }
    
    const outputConsole = document.getElementById('outputConsole');
    
    // Clear welcome message
    const welcome = outputConsole.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    
    // Don't add timestamp - we'll add output prefix instead
    
    // Handle magic commands (keep styled for special outputs)
    if (result.is_magic) {
        const magicOutput = document.createElement('div');
        magicOutput.className = 'output-line output-magic';
        
        if (result.format_type === 'json') {
            magicOutput.innerHTML = `<pre>${syntaxHighlightJSON(result.output)}</pre>`;
        } else if (result.format_type === 'table') {
            magicOutput.innerHTML = `<pre>${result.output}</pre>`;
        } else {
            magicOutput.textContent = result.output;
        }
        
        outputConsole.appendChild(magicOutput);
    } else {
        // Standard output - PLAIN TEXT ONLY with --> prefix
        if (result.output) {
            // Split by lines and add as text nodes. For consistent spacing
            // create a small inline container for each line that contains
            // the prefix and the trimmed text. This avoids stray gaps
            // between the prefix and the first line caused by separate
            // appended nodes.
            const lines = result.output.split('\n');
            lines.forEach((line, index) => {
                // Remove leading whitespace (including various Unicode spaces)
                // to avoid extra indentation before the visible text.
                const unicodeSpaces = '[\\s\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]';
                const leadingSpacesRe = new RegExp('^' + unicodeSpaces + '+');
                const processedLine = line.replace(leadingSpacesRe, '');

                // If the processed line is empty, preserve a blank line
                // visually without adding a prefix-only element. For
                // trailing empty lines (last element) skip entirely.
                if (processedLine === '') {
                    if (index < lines.length - 1) {
                        outputConsole.appendChild(document.createElement('br'));
                    }
                    return; // skip creating a prefixed line
                }

                // Create a block-level output line container so styling and
                // padding/borders from .output-line/output-stdout apply and
                // alignment matches other outputs.
                const lineDiv = document.createElement('div');
                lineDiv.className = 'output-line output-stdout';

                // For the first line only, show the arrow prefix. For
                // subsequent lines, add an empty placeholder span with the
                // same width so text aligns under the first line.
                const linePrefixSpan = document.createElement('span');
                linePrefixSpan.className = 'output-prefix';
                if (index === 0) {
                    linePrefixSpan.textContent = '--> ';
                } else {
                    // leave text empty — placeholder for alignment
                    linePrefixSpan.textContent = '';
                }
                lineDiv.appendChild(linePrefixSpan);

                // Text node for the line content
                const textNode = document.createTextNode(processedLine);
                lineDiv.appendChild(textNode);

                // Append line div to console
                outputConsole.appendChild(lineDiv);
            });
            
            // Add execution time as an aligned output-meta line so it
            // lines up with output text (uses same output-prefix placeholder)
            const timeLine = document.createElement('div');
            timeLine.className = 'output-line output-meta';
            const timePrefix = document.createElement('span');
            timePrefix.className = 'output-prefix';
            timePrefix.textContent = ''; // no arrow on meta line
            timeLine.appendChild(timePrefix);
            timeLine.appendChild(document.createTextNode(`[Execution time: ${executionTime}s]`));
            outputConsole.appendChild(timeLine);
        }
        
        // Error output with collapsible traceback (keep styled for visibility)
        if (result.error) {
            // Render error lines with prefix only on the first visible line
            const errLines = result.error.split('\n');
            errLines.forEach((ln, i) => {
                const processed = ln.replace(/^\s+/, '');
                if (processed === '') {
                    outputConsole.appendChild(document.createElement('br'));
                    return;
                }

                const lineDiv = document.createElement('div');
                lineDiv.className = 'output-line output-stderr';

                const prefix = document.createElement('span');
                prefix.className = 'output-prefix';
                if (i === 0) prefix.textContent = '--> ';
                else prefix.textContent = '';
                lineDiv.appendChild(prefix);

                lineDiv.appendChild(document.createTextNode(processed));
                outputConsole.appendChild(lineDiv);
            });

            // Add collapsible full traceback beneath
            const tb = document.createElement('div');
            tb.className = 'traceback-container';
            tb.innerHTML = `
                <div class="traceback-header" onclick="toggleTraceback(this)">
                    <i class="fas fa-chevron-right"></i>
                    <span>Show traceback</span>
                </div>
                <div class="traceback-content">
                    <pre>${escapeHtml(result.error)}</pre>
                </div>
            `;
            outputConsole.appendChild(tb);
        }
    }
    
    // Render any captured figures (images) returned by the execution result
    // result.figures is expected to be an array of either base64 strings or
    // objects containing a base64 payload in .data / .base64 / .b64.
    try {
        if (result.figures && Array.isArray(result.figures) && result.figures.length) {
            result.figures.forEach((fig, idx) => {
                let b64 = null;
                if (typeof fig === 'string') b64 = fig;
                else if (fig.data) b64 = fig.data;
                else if (fig.base64) b64 = fig.base64;
                else if (fig.b64) b64 = fig.b64;

                if (!b64) return;

                const imgLine = document.createElement('div');
                imgLine.className = 'output-line output-figure';

                // Keep a prefix placeholder for alignment with text outputs
                const prefix = document.createElement('span');
                prefix.className = 'output-prefix';
                prefix.textContent = '';
                imgLine.appendChild(prefix);

                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + b64;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '480px';
                img.style.display = 'block';
                img.style.marginTop = '6px';
                img.alt = `figure_${AppState.executionCount || '0'}_${idx+1}`;
                imgLine.appendChild(img);

                // Download link for convenience
                const dl = document.createElement('a');
                dl.textContent = 'Download';
                dl.href = img.src;
                dl.download = `figure_${AppState.executionCount || '0'}_${idx+1}.png`;
                dl.className = 'output-figure-download';
                dl.style.display = 'inline-block';
                dl.style.marginTop = '6px';
                dl.style.marginLeft = '8px';
                dl.style.fontSize = '12px';
                imgLine.appendChild(dl);

                outputConsole.appendChild(imgLine);
            });
        }
    } catch (e) {
        console.warn('Failed to render figures:', e);
    }

    // Scroll to bottom
    outputConsole.scrollTop = outputConsole.scrollHeight;
    

// ============================================
// Interactive View: open clicked figures in a dedicated panel
// ============================================
function enableInteractiveFigures() {
    const outputConsole = document.getElementById('outputConsole');
    const interactiveContainer = document.getElementById('interactiveContainer');
    const interactiveContent = document.getElementById('interactiveContent');
    const interactiveSwitch = document.getElementById('interactiveSwitch');
    // new: slider checkbox used for toggling Output <-> InView
    const interactiveToggle = document.getElementById('interactiveToggle');

    if (!outputConsole) return;

    // Delegate clicks on output images
    outputConsole.addEventListener('click', (ev) => {
        const target = ev.target;
        if (target && target.tagName === 'IMG' && target.closest('.output-figure')) {
            openInInteractiveView(target.src);
        }
    });

    // Slider toggle handler (checkbox)
    if (interactiveToggle) {
        interactiveToggle.addEventListener('change', () => {
            if (interactiveToggle.checked) showInteractiveView();
            else showOutputView();
        });
    }

    // Helper: open a data-url image in interactive view
    function openInInteractiveView(dataUrl) {
        // Clear previous content
        interactiveContent.innerHTML = '';

        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Interactive Figure';
        // Fill available area
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';

        interactiveContent.appendChild(img);

        // Reveal interactive container and switch
        if (interactiveContainer) interactiveContainer.classList.remove('hidden');
        if (interactiveSwitch) {
            interactiveSwitch.classList.remove('hidden');
            interactiveSwitch.setAttribute('aria-hidden', 'false');
        }

        // Ensure the toggle is checked (InView)
        if (interactiveToggle) interactiveToggle.checked = true;

        // Focus the interactive view
        showInteractiveView();
    }

    function showInteractiveView() {
        // Hide output console, show interactive container
        const outputConsoleEl = document.getElementById('outputConsole');
        if (outputConsoleEl) outputConsoleEl.style.display = 'none';
        if (interactiveContainer) interactiveContainer.style.display = 'flex';
        // Update indicator visually
        // Visual indicator: move pill knob (already handled below) — keep visual parity
        // Sync slider state
        if (interactiveToggle) interactiveToggle.checked = true;
        // Update header: switch title to Interactive View and hide exec-time and delete
        try {
            const headerTitle = document.querySelector('#outputContainer .panel-title');
            const execTimeEl = document.getElementById('executionTime');
            const clearBtn = document.getElementById('clearOutputBtn');
            if (headerTitle) headerTitle.innerHTML = '<i class="fas fa-image"></i> Interactive View';
            if (execTimeEl) execTimeEl.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
        } catch (e) { /* ignore */ }
    }

    function showOutputView() {
        const outputConsoleEl = document.getElementById('outputConsole');
        if (outputConsoleEl) outputConsoleEl.style.display = 'block';
        if (interactiveContainer) interactiveContainer.style.display = 'none';
        // Sync slider state
        if (interactiveToggle) interactiveToggle.checked = false;
        // Restore header: set title back to Output Console and show exec-time and delete
        try {
            const headerTitle = document.querySelector('#outputContainer .panel-title');
            const execTimeEl = document.getElementById('executionTime');
            const clearBtn = document.getElementById('clearOutputBtn');
            if (headerTitle) headerTitle.innerHTML = '<i class="fas fa-terminal"></i> Output Console';
            if (execTimeEl) execTimeEl.style.display = '';
            if (clearBtn) clearBtn.style.display = '';
        } catch (e) { /* ignore */ }
    }

    // If the user double-clicks inside the interactive area, return to output
    if (interactiveContainer) {
        interactiveContainer.addEventListener('dblclick', () => {
            showOutputView();
        });
    }

}

// Initialize interactive figure handlers on load
try { enableInteractiveFigures(); } catch (e) { console.warn('Interactive view init failed', e); }
    // Update small status execution time element (keeps numeric status synced)
    const execTimeEl = document.getElementById('executionTime');
    if (execTimeEl) execTimeEl.textContent = executionTime + 's';
    
    // Update output counts in status bar
    try { updateOutputCounts(); } catch (e) { /* ignore */ }
}

function toggleTraceback(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');
    const span = header.querySelector('span');
    
    content.classList.toggle('expanded');
    
    if (content.classList.contains('expanded')) {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
        span.textContent = 'Hide traceback';
    } else {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
        span.textContent = 'Show traceback';
    }
}

// ============================================
// Variable Explorer
// ============================================
async function refreshVariables() {
    try {
        const response = await fetch('/api/variables');
        const data = await response.json();
        
        const varsContent = document.getElementById('variablesContent');
        varsContent.innerHTML = '';
        
        if (Object.keys(data.variables).length === 0) {
            varsContent.innerHTML = '<div class="empty-state">No variables defined</div>';
            return;
        }
        
        for (const [name, value] of Object.entries(data.variables)) {
            const varItem = createVariableItem(name, value);
            varsContent.appendChild(varItem);
        }
        
    } catch (error) {
        console.error('Error refreshing variables:', error);
    }
}

function createVariableItem(name, value) {
    const item = document.createElement('div');
    item.className = 'variable-item';
    
    // Determine type and size
    const type = inferType(value);
    const size = estimateSize(value);
    
    item.innerHTML = `
        <div class="variable-header">
            <span class="variable-name">${escapeHtml(name)}</span>
            <span class="variable-type">${type}</span>
        </div>
        <div class="variable-value">${escapeHtml(truncateValue(value, 100))}</div>
        <div class="variable-size">${size}</div>
    `;
    
    return item;
}

function inferType(value) {
    if (value === 'None') return 'NoneType';
    if (value.startsWith("'") || value.startsWith('"')) return 'str';
    if (value.match(/^-?\d+$/)) return 'int';
    if (value.match(/^-?\d+\.\d+$/)) return 'float';
    if (value === 'True' || value === 'False') return 'bool';
    if (value.startsWith('[')) return 'list';
    if (value.startsWith('{') && value.includes(':')) return 'dict';
    if (value.startsWith('{')) return 'set';
    if (value.startsWith('(')) return 'tuple';
    if (value.startsWith('<function')) return 'function';
    if (value.startsWith('<')) return 'object';
    return 'unknown';
}

function estimateSize(value) {
    const bytes = new Blob([value]).size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function truncateValue(value, maxLength) {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + '...';
}

// ============================================
// Command History
// ============================================
function addToHistory(code, success, time) {
    const historyItem = {
        code: code,
        success: success,
        time: time,
        timestamp: new Date().toISOString()
    };
    
    AppState.commandHistory.unshift(historyItem);
    
    // Keep only last 50 commands
    if (AppState.commandHistory.length > 50) {
        AppState.commandHistory = AppState.commandHistory.slice(0, 50);
    }
    
    saveCommandHistory();
    updateHistoryUI();
}

function updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (AppState.commandHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No command history yet</div>';
        return;
    }
    
    AppState.commandHistory.slice(0, 20).forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.success ? 'success' : 'error'}`;
        historyItem.onclick = () => loadFromHistory(index);
        
        const codePreview = item.code.substring(0, 60) + (item.code.length > 60 ? '...' : '');
        
        historyItem.innerHTML = `
            <div class="history-code">${escapeHtml(codePreview)}</div>
            <div class="history-time">
                ${new Date(item.timestamp).toLocaleTimeString()} (${item.time}s)
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function loadFromHistory(index) {
    const item = AppState.commandHistory[index];
    if (item) {
        AppState.editor.setValue(item.code);
        showToast('info', 'Loaded', 'Code loaded from history');
    }
}

function navigateHistory(direction) {
    if (AppState.commandHistory.length === 0) return;
    
    if (direction === 'up') {
        AppState.historyIndex = Math.min(
            AppState.historyIndex + 1,
            AppState.commandHistory.length - 1
        );
    } else {
        AppState.historyIndex = Math.max(AppState.historyIndex - 1, -1);
    }
    
    if (AppState.historyIndex >= 0) {
        const item = AppState.commandHistory[AppState.historyIndex];
        AppState.editor.setValue(item.code);
    }
}

// ============================================
// Syntax Validation
// ============================================
async function validateSyntax() {
    const code = AppState.editor.getValue().trim();
    
    if (!code) {
        showToast('warning', 'Empty Code', 'Please write some code first.');
        return;
    }
    
    try {
        const response = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        
        const result = await response.json();
        
        if (result.valid) {
            showToast('success', 'Valid Syntax', '✓ Your code syntax is correct!');
        } else {
            showToast('error', 'Syntax Error', result.error);
        }
        
    } catch (error) {
        showToast('error', 'Error', 'Failed to validate: ' + error.message);
    }
}

// ============================================
// File Operations
// ============================================
function saveCode() {
    const code = AppState.editor.getValue();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    // Use current filename when saving (ensure .py extension)
    let filename = AppState.currentFilename || 'untitled.py';
    if (!filename.toLowerCase().endsWith('.py')) filename += '.py';
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('success', 'Saved', 'Code saved successfully');
    playSound('success');
}

function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        // Open loaded file in a new tab (preserve existing tabs)
        createTab(file.name, e.target.result);
        // Reflect filename in session info
        AppState.currentFilename = file.name;
        updateSessionInfo();
        showToast('success', 'Loaded', `File "${file.name}" loaded successfully`);
        playSound('success');
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Load a folder selected via an <input webkitdirectory> element.
// Builds a tree of directories/files and shows a persistent sidebar
// allowing the user to open single files or "Upload" (open) whole folders.
function loadFolder(event) {
    try {
        const fileList = (event && event.target && event.target.files) ? Array.from(event.target.files) : (Array.isArray(event) ? event : []);
        if (!fileList || fileList.length === 0) return;

        // Build a nested tree from webkitRelativePath or name
        const root = { name: '', children: {}, files: [] };

        fileList.forEach(f => {
            const path = f.webkitRelativePath && f.webkitRelativePath.trim() ? f.webkitRelativePath : f.name;
            const parts = path.split('/').filter(p => p && p.length);
            let node = root;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isFile = (i === parts.length - 1);
                if (isFile) {
                    if (!node.files) node.files = [];
                    node.files.push({ name: part, file: f, rel: parts.join('/') });
                } else {
                    if (!node.children[part]) node.children[part] = { name: part, children: {}, files: [] };
                    node = node.children[part];
                }
            }
        });

        // Ensure leftPanel exists
        const leftPanel = document.getElementById('leftPanel') || document.body;
        const mainContainer = leftPanel.parentElement || document.querySelector('.main-container') || document.body;

        // Use a dedicated folder panel (sibling before leftPanel) so it becomes
        // a left column that appears only when a folder is loaded.
        let panel = document.getElementById('folderPanel');
        const created = !panel;
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'folderPanel';
            panel.className = 'folder-panel';
            // Accessibility
            panel.setAttribute('role', 'complementary');
            panel.setAttribute('aria-label', 'Folder panel');

            // Insert before leftPanel so it sits to the left of the code editor panel
            try {
                mainContainer.insertBefore(panel, leftPanel);
            } catch (e) {
                // fallback: append and adjust via CSS
                mainContainer.appendChild(panel);
            }
        }

        // Render tree into panel
        panel.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'folder-sidebar-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '8px';
        const title = document.createElement('div');
        // Use a simple static header for the folder panel per user request
        title.textContent = ' SIDE PANEL';
        title.style.fontWeight = '600';
        header.appendChild(title);

        // Header contains only the title now (Clear/Close buttons removed per user request)
        panel.appendChild(header);

        const treeRoot = document.createElement('div');
        treeRoot.className = 'folder-tree-root';

        // Return total number of files contained in this node (including nested children)
        function countFiles(node) {
            if (!node) return 0;
            let total = 0;
            if (Array.isArray(node.files)) total += node.files.length;
            const children = node.children || {};
            Object.keys(children).forEach(k => { total += countFiles(children[k]); });
            return total;
        }

    // Map to remember assigned colors for folder nodes so siblings/children
    // keep their own color for the session
    const _folderColorMap = new WeakMap();

    function makeNode(node, container) {
            // render folders
            Object.keys(node.children || {}).sort().forEach(k => {
                const child = node.children[k];
                const entry = document.createElement('div');
                entry.className = 'folder-node';
                entry.style.padding = '4px 6px';
                entry.style.borderRadius = '6px';
                entry.style.cursor = 'pointer';
                entry.style.display = 'flex';
                entry.style.alignItems = 'center';
                entry.style.justifyContent = 'space-between';

                const left = document.createElement('div');
                left.style.display = 'flex'; left.style.alignItems = 'center'; left.style.gap = '8px';
                const icon = document.createElement('i'); icon.className = 'fas fa-folder';
                // Assign a distinct color per folder node. Use a WeakMap keyed by the
                // child object so color persists while the node exists in memory.
                try {
                    let color = _folderColorMap.get(child);
                    if (!color) {
                        // generate a pleasantly saturated pastel color
                        const h = Math.floor(Math.random() * 360);
                        const s = 60 + Math.floor(Math.random() * 20); // 60-80%
                        const l = 45 + Math.floor(Math.random() * 10); // 45-55%
                        color = `hsl(${h}deg ${s}% ${l}%)`;
                        _folderColorMap.set(child, color);
                    }
                    icon.style.color = color;
                } catch (e) {
                    // ignore if WeakMap fails in older browsers
                }
                const name = document.createElement('span'); name.textContent = child.name; name.className = 'folder-name';
                // add count badge for this folder (including nested files)
                const count = document.createElement('span');
                count.className = 'folder-count';
                try { const n = countFiles(child); count.textContent = `(${n})`; } catch(e) { count.textContent = ''; }
                left.appendChild(icon); left.appendChild(name); left.appendChild(count);

                // Create a right-side actions container and place the '+' button there
                const right = document.createElement('div');
                right.style.display = 'flex';
                right.style.alignItems = 'center';
                right.style.gap = '8px';
                const addBtn = document.createElement('button');
                addBtn.className = 'folder-add-btn';
                addBtn.type = 'button';
                addBtn.title = 'Create new file or folder';
                addBtn.textContent = '+';
                addBtn.style.cursor = 'pointer';

                // Dropdown container (appended to body and positioned on click)
                const dd = document.createElement('div'); dd.className = 'folder-add-dd'; dd.style.position = 'absolute'; dd.style.zIndex = 16000; dd.style.display = 'none'; dd.style.background = 'var(--panel-bg)'; dd.style.border = '1px solid var(--border-color)'; dd.style.padding = '6px'; dd.style.borderRadius = '6px';
                const optFile = document.createElement('div'); optFile.className = 'folder-add-opt'; optFile.textContent = 'New file'; optFile.style.padding = '6px'; optFile.style.cursor = 'pointer';
                const optFolder = document.createElement('div'); optFolder.className = 'folder-add-opt'; optFolder.textContent = 'New folder'; optFolder.style.padding = '6px'; optFolder.style.cursor = 'pointer';
                dd.appendChild(optFile); dd.appendChild(optFolder);

                // Click to toggle dropdown
                addBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    // position the dropdown relative to the button
                    try {
                        const r = addBtn.getBoundingClientRect();
                        dd.style.left = (r.left + window.scrollX) + 'px';
                        dd.style.top = (r.bottom + window.scrollY + 6) + 'px';
                        dd.style.display = (dd.style.display === 'none' || dd.style.display === '') ? 'block' : 'none';
                    } catch (e) { dd.style.display = 'block'; }
                });

                // Helper to close any open dropdowns
                function closeAllAddDD() { document.querySelectorAll('.folder-add-dd').forEach(x=>x.style.display='none'); }

                // New file handler
                optFile.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeAllAddDD();
                    const namePrompt = prompt('Enter new file name (with extension):', 'new_file.py');
                    if (!namePrompt) return;
                    // update data model and DOM: add file to child.files
                    if (!child.files) child.files = [];
                    const newFileMeta = { name: namePrompt, file: null, rel: (child.name ? (child.name + '/' + namePrompt) : namePrompt) };
                    child.files.push(newFileMeta);
                    // create DOM row
                    const fileRow = document.createElement('div'); fileRow.className = 'folder-file'; fileRow.style.padding = '4px 6px'; fileRow.style.cursor = 'pointer'; fileRow.style.display = 'flex'; fileRow.style.justifyContent = 'space-between';
                    const label = document.createElement('span'); label.textContent = namePrompt;
                    fileRow.appendChild(label);
                    // find childrenWrap (next sibling)
                    const childrenWrapRef = entry.nextSibling;
                    if (childrenWrapRef) childrenWrapRef.appendChild(fileRow);
                });

                // New folder handler
                optFolder.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeAllAddDD();
                    const folderName = prompt('Enter new folder name:', 'NewFolder');
                    if (!folderName) return;
                    if (!child.children) child.children = {};
                    child.children[folderName] = { name: folderName, children: {}, files: [] };
                    // create a minimal DOM representation for the new folder under childrenWrap
                    const childrenWrapRef = entry.nextSibling;
                    if (childrenWrapRef) {
                        const newEntry = document.createElement('div');
                        newEntry.className = 'folder-node';
                        newEntry.style.padding = '4px 6px';
                        newEntry.style.borderRadius = '6px';
                        newEntry.style.display = 'flex';
                        newEntry.style.alignItems = 'center';
                        newEntry.style.justifyContent = 'space-between';
                        const newLeft = document.createElement('div'); newLeft.style.display='flex'; newLeft.style.alignItems='center'; newLeft.style.gap='8px';
                        const newIcon = document.createElement('i'); newIcon.className='fas fa-folder'; try { let c = _folderColorMap.get(child.children[folderName]); if(!c){ const h = Math.floor(Math.random()*360); c = `hsl(${h}deg 70% 50%)`; _folderColorMap.set(child.children[folderName], c);} newIcon.style.color = c; } catch(e){}
                        const newName = document.createElement('span'); newName.textContent = folderName; newName.className = 'folder-name';
                        const newCount = document.createElement('span'); newCount.className='folder-count'; newCount.textContent='(0)';
                        newLeft.appendChild(newIcon); newLeft.appendChild(newName); newLeft.appendChild(newCount);
                        newEntry.appendChild(newLeft);
                        childrenWrapRef.appendChild(newEntry);
                        const newChildrenWrap = document.createElement('div'); newChildrenWrap.className='folder-children'; newChildrenWrap.style.marginLeft='12px'; newChildrenWrap.style.paddingLeft='6px';
                        try { newChildrenWrap.style.borderLeft = '1px dashed ' + (c || 'var(--border-color)'); } catch(e) { newChildrenWrap.style.borderLeft = '1px dashed var(--border-color)'; }
                        childrenWrapRef.appendChild(newChildrenWrap);
                    }
                });

                // close dropdown on outside click
                document.addEventListener('click', (ev) => { if (dd && dd.style) dd.style.display = 'none'; });

                // append left label first, then the right-side actions area (so '+' appears at the end)
                entry.appendChild(left);
                right.appendChild(addBtn);
                entry.appendChild(right);
                document.body.appendChild(dd);

                // Double-clicking the folder entry toggles expansion
                entry.addEventListener('dblclick', (e) => {
                    try {
                        e.stopPropagation && e.stopPropagation();
                        const next = entry.nextSibling;
                        if (next && next.classList && next.classList.contains('folder-children')) {
                            if (next.style.display === 'none') next.style.display = '';
                            else next.style.display = 'none';
                        }
                    } catch (err) { /* ignore */ }
                });

                container.appendChild(entry);

                const childrenWrap = document.createElement('div');
                childrenWrap.className = 'folder-children';
                childrenWrap.style.marginLeft = '12px';
                childrenWrap.style.paddingLeft = '6px';
                // Match the dashed expansion line color to the folder icon color
                try { childrenWrap.style.borderLeft = '1px dashed ' + (icon.style.color || 'var(--border-color)'); } catch(e) { childrenWrap.style.borderLeft = '1px dashed var(--border-color)'; }
                container.appendChild(childrenWrap);

                // render files directly inside folder
                if (child.files && child.files.length) {
                    child.files.sort((a,b)=>a.name.localeCompare(b.name)).forEach(fmeta => {
                        const fileRow = document.createElement('div');
                        fileRow.className = 'folder-file';
                        fileRow.style.padding = '4px 6px';
                        fileRow.style.cursor = 'pointer';
                        fileRow.style.display = 'flex'; fileRow.style.justifyContent = 'space-between';
                        const label = document.createElement('span'); label.textContent = fmeta.name;
                        // Open file on double-click
                        fileRow.addEventListener('dblclick', (ev) => {
                            ev.stopPropagation && ev.stopPropagation();
                            readAndOpenFile(fmeta.file, fmeta.name);
                        });
                        fileRow.appendChild(label);
                        childrenWrap.appendChild(fileRow);
                    });
                }

                // recursive for deeper folders
                makeNode(child, childrenWrap);
            });

            // render files at this level (if root)
            if (node.files && node.files.length) {
                node.files.sort((a,b)=>a.name.localeCompare(b.name)).forEach(fmeta => {
                    const fileRow = document.createElement('div');
                    fileRow.className = 'folder-file';
                    fileRow.style.padding = '4px 6px';
                    fileRow.style.cursor = 'pointer';
                    fileRow.style.display = 'flex'; fileRow.style.justifyContent = 'space-between';
                    const label = document.createElement('span'); label.textContent = fmeta.name;
                    // Open file on double-click
                    fileRow.addEventListener('dblclick', (ev) => {
                        ev.stopPropagation && ev.stopPropagation();
                        readAndOpenFile(fmeta.file, fmeta.name);
                    });
                    fileRow.appendChild(label);
                    container.appendChild(fileRow);
                });
            }
        }

        // collectFiles was removed since per-folder "Upload" actions were removed.

        function readAndOpenFile(fileObj, displayName) {
            const reader = new FileReader();
            reader.onload = (e) => {
                createTab(displayName, e.target.result);
                AppState.currentFilename = displayName;
                updateSessionInfo();
                showToast('success','Loaded', `Opened ${displayName}`);
            };
            reader.onerror = (e) => { showToast('error','Error','Failed to read file'); };
            reader.readAsText(fileObj);
        }

    makeNode(root, treeRoot);
    panel.appendChild(treeRoot);

        // Add small hint at bottom
    const hint = document.createElement('div'); hint.className = 'folder-hint'; hint.style.marginTop = '10px'; hint.style.fontSize = '12px'; hint.style.color = 'var(--text-tertiary)';
    hint.textContent = 'Double-click a file to open it. Double-click a folder to expand or collapse its contents.';
    panel.appendChild(hint);

        // Reset input value so same folder can be reselected later
        try { if (event && event.target) event.target.value = ''; } catch (e) {}

    // If panel newly created, notify
    if (created) showToast('info','Folder','Folder panel opened');
    } catch (err) {
        console.error('loadFolder failed', err);
        showToast('error','Folder','Failed to load folder');
    }
}

// ============================================
// Session Management
// ============================================
function newSession() {
    if (AppState.editor.getValue().trim() && 
        !confirm('Start a new session? Current code will be cleared.')) {
        return;
    }
    
    // Reset interpreter
    fetch('/api/reset', { method: 'POST' })
        .then(() => {
            // Create a new untitled tab for the fresh session
            createTab('untitled.py', '# New session started\n\n');
            clearConsole();
            AppState.sessionId = generateSessionId();
            updateSessionInfo();
            showToast('info', 'New Session', 'Session reset successfully');
        })
        .catch(error => {
            showToast('error', 'Error', 'Failed to reset session');
        });
}

function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
}

function updateSessionInfo() {
    const sessionEl = document.getElementById('sessionId');
    if (sessionEl) sessionEl.textContent = AppState.sessionId.substr(0, 8);

    const fileNameEl = document.getElementById('fileNameDisplay');
    if (fileNameEl) fileNameEl.textContent = AppState.currentFilename || 'untitled.py';
    // Also reflect current filename in the active tab element
    try {
        if (Tabs.activeId) {
            const tabEntry = Tabs.list.find(t => t.id === Tabs.activeId);
            if (tabEntry && tabEntry.name !== AppState.currentFilename) {
                tabEntry.name = AppState.currentFilename || tabEntry.name;
                // update DOM label if present
                const dom = document.querySelector(`.tab[data-tab-id="${Tabs.activeId}"] .tab-name`);
                if (dom) dom.textContent = tabEntry.name;
            }
        }
    } catch (e) { /* ignore */ }
}

// Outline builder: returns { classes: [], functions: [], decorators: [] }
function buildOutlineFromSource(source) {
    const lines = source.split('\n');
    const classes = [];
    const functions = [];
    const decorators = [];

    // Track the most recent decorator lines to associate with next def/class
    let pendingDecorators = [];

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();
        if (trimmed.startsWith('@')) {
            // capture decorator name (allow optional spaces after @ and before name)
            // match e.g. @decorator, @ decorator, @module.decorator, @decorator(arg)
            const m = trimmed.match(/^@\s*([A-Za-z0-9_\.]+)/);
            if (m) pendingDecorators.push({ name: m[1], line: i });
            continue;
        }

        // class
        const classMatch = raw.match(/^\s*class\s+([A-Za-z0-9_]+)\s*[:(]/);
        if (classMatch) {
            classes.push({ name: classMatch[1], line: i });
            // attach pending decorators (if any) as decorator entries too
            pendingDecorators.forEach(d => decorators.push({ name: d.name, line: d.line }));
            pendingDecorators = [];
            continue;
        }

        // def (function or method)
        const defMatch = raw.match(/^\s*def\s+([A-Za-z0-9_]+)\s*\(/);
        if (defMatch) {
            functions.push({ name: defMatch[1], line: i });
            pendingDecorators.forEach(d => decorators.push({ name: d.name, line: d.line }));
            pendingDecorators = [];
            continue;
        }

        // clear pending decorators if non-empty and we hit other content
        if (pendingDecorators.length && trimmed !== '') pendingDecorators = [];
    }

    return { classes, functions, decorators };
}

// Simple variables extractor: finds top-level assignments like 'x =', 'name =', ignoring imports and defs/classes
function buildVariablesFromSource(source) {
    const lines = source.split('\n');
    const vars = [];
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        // skip indented lines (likely inside functions/classes)
        if (/^\s+/.test(raw)) continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        // ignore comments and imports and defs/classes
        if (trimmed.startsWith('#')) continue;
        if (/^import\b/.test(trimmed) || /^from\b/.test(trimmed)) continue;
        if (/^def\b/.test(trimmed) || /^class\b/.test(trimmed)) continue;
        // match simple assignment or annotated assignment (var: type = value)
        const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=]+)?=\s*/);
        if (m) vars.push({ name: m[1], line: i });
    }
    return vars;
}

// Toggle / render outline dropdown attached to fileInfo
// toggleOutlineDropdown now accepts an optional mode parameter to render specific sections
function toggleOutlineDropdown(event, mode) {
    try {
        const fileInfo = document.getElementById('fileInfo');
        if (!fileInfo) return;

        // If dropdown exists, remove it
        const existing = fileInfo.querySelector('.outline-dropdown');
        if (existing) { existing.remove(); return; }

        // Build outline from current editor content
        const src = (AppState.editor && AppState.editor.getValue) ? AppState.editor.getValue() : '';
        const outline = buildOutlineFromSource(src);
        const variables = buildVariablesFromSource(src);

        const dd = document.createElement('div');
        dd.className = 'outline-dropdown';

        // create a scrollable body that will contain all sections; this allows
        // us to keep the popup size definite and only show ~10 items before
        // scrolling.
        const body = document.createElement('div');
        body.className = 'outline-body';

        // Helper to create section (list only)
        function appendList(title, items) {
            const tokenMap = {
                'Classes': 'class',
                'Functions': 'def',
                'Variables': 'var',
                'Decorators': '@'
            };
            const sec = document.createElement('div');
            sec.className = 'outline-section';
            const token = tokenMap[title] || '';
            const h = document.createElement('h4');
            if (token) {
                // Build header with token span and count span for styling
                h.innerHTML = `${title} <span class="outline-token">( ${escapeHtml(token)} )</span> <span class="outline-count">${items.length}</span>`;
            } else {
                h.textContent = `${title} (${items.length})`;
            }
            sec.appendChild(h);
            if (!items.length) {
                const empty = document.createElement('div'); empty.className = 'outline-empty'; empty.textContent = 'None'; sec.appendChild(empty);
            } else {
                const ul = document.createElement('ol'); ul.className = 'outline-list';
                items.forEach(it => {
                    const li = document.createElement('li'); li.textContent = it.name;
                    li.title = `Line ${it.line + 1}`;
                    li.addEventListener('click', () => {
                        try {
                            AppState.editor.focus();
                            AppState.editor.setCursor({ line: it.line, ch: 0 });
                            AppState.editor.scrollIntoView({ line: it.line, ch: 0 }, 120);
                        } catch (e) { /* ignore */ }
                        dd.remove();
                        // reset the view button back to 'View'
                        try {
                            currentViewModeIndex = 0;
                            renderViewButtonLabel();
                        } catch (e) {}
                    });
                    ul.appendChild(li);
                });
                sec.appendChild(ul);
            }
            body.appendChild(sec);
        }

        // Decide what to render based on mode. If mode is falsy or 'View', show grouped sections.
        const activeMode = (typeof mode === 'string' && mode) ? mode : 'View';

        if (activeMode === 'View') {
            appendList('Classes', outline.classes);
            appendList('Functions', outline.functions);
            appendList('Variables', variables);
            appendList('Decorators', outline.decorators);
        } else if (activeMode === 'Classes') {
            appendList('Classes', outline.classes);
        } else if (activeMode === 'Variables') {
            appendList('Variables', variables);
        } else if (activeMode === 'Functions') {
            appendList('Functions', outline.functions);
        } else if (activeMode === 'Decorators') {
            appendList('Decorators', outline.decorators);
        } else {
            // fallback to full view
            appendList('Classes', outline.classes);
            appendList('Functions', outline.functions);
            appendList('Variables', variables);
            appendList('Decorators', outline.decorators);
        }

        // append the scrollable body to the dropdown
        dd.appendChild(body);

        // Remove any existing dropdown (anywhere) so toggle works reliably
        const old = document.querySelector('.outline-dropdown');
        if (old) old.remove();

        // Position dropdown: attach to the tab-bar area's View button if present
    const viewBtn = document.getElementById('viewOutlineBtn');
    // Append to body to avoid clipping by container overflow or stacking contexts
    document.body.appendChild(dd);

        if (viewBtn && viewBtn.getBoundingClientRect) {
            // compute button position in viewport and position dropdown absolutely
            const btnRect = viewBtn.getBoundingClientRect();
            const left = Math.max(6, btnRect.left + window.scrollX);
            const top = btnRect.bottom + window.scrollY + 8; // small visual gap
            dd.style.left = left + 'px';
            dd.style.top = top + 'px';
            // ensure dropdown appears above everything
            dd.style.zIndex = '999999';
            dd.classList.add('anchored');

            // Auto-size the dropdown to fit the widest content (helps long function names)
            try {
                // measure widest element among headers and list items
                const measureEls = dd.querySelectorAll('.outline-list li, .outline-section h4');
                let maxW = 0;
                measureEls.forEach(el => {
                    // use scrollWidth which reflects rendered width even when overflow:hidden
                    const w = el.scrollWidth || el.getBoundingClientRect().width || 0;
                    if (w > maxW) maxW = w;
                });
                // add extra space for left gutter, badges and padding
                const extra = 110; // left gutter + badge + internal padding
                let desired = Math.max(260, Math.ceil(maxW + extra));
                const screenMax = Math.floor(window.innerWidth - 24);
                if (desired > screenMax) desired = screenMax; // cap to viewport
                dd.style.width = desired + 'px';
            } catch (e) { /* silent fallback */ }
            // ensure dropdown doesn't overflow right edge: adjust if necessary
            const ddRect = dd.getBoundingClientRect ? dd.getBoundingClientRect() : null;
            if (ddRect) {
                const overflow = (ddRect.right) - (window.innerWidth - 12);
                if (overflow > 0) {
                    dd.style.left = Math.max(6, (btnRect.left + window.scrollX) - overflow) + 'px';
                }
                // if it would go off the left edge, clamp
                if (ddRect.left < 6) dd.style.left = '6px';
            }
        } else {
            // fallback: make it appear near the top-right of the fileInfo area
            const rect = fileInfo.getBoundingClientRect ? fileInfo.getBoundingClientRect() : null;
            if (rect) {
                dd.style.left = (rect.left + window.scrollX + 6) + 'px';
                dd.style.top = (rect.bottom + window.scrollY + 8) + 'px';
                dd.style.zIndex = '999999';
            } else {
                dd.style.left = '6px';
                dd.style.top = 'calc(100% + 6px)';
            }
        }

        // click outside to close: when closed, reset the button to 'View'
        const onDocClick = (ev) => {
            const btn = document.getElementById('viewOutlineBtn');
            if (!dd.contains(ev.target) && ev.target.id !== 'viewOutlineBtn' && !(btn && btn.contains(ev.target))) {
                dd.remove();
                document.removeEventListener('click', onDocClick);
                // reset mode back to 'View' and update label
                try {
                    currentViewModeIndex = 0; // reset to View
                    renderViewButtonLabel();
                } catch (e) { }
            }
        };
        setTimeout(() => document.addEventListener('click', onDocClick), 10);

    } catch (e) { console.error('Outline error', e); }
}

function renameFile() {
    // Show the modern rename modal
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    if (!modal || !input) {
        // Fallback to prompt if modal not present
        const current = AppState.currentFilename || 'untitled.py';
        const newName = prompt('Rename file:', current);
        if (!newName) return;
        const sanitized = newName.replace(/\\|\//g, '').trim();
        if (!sanitized) return showToast('warning', 'Invalid name', 'Filename cannot be empty');
        AppState.currentFilename = sanitized.endsWith('.py') ? sanitized : sanitized + '.py';
        updateSessionInfo();
        showToast('success', 'Renamed', `File renamed to ${AppState.currentFilename}`);
        return;
    }

    // Prefill and show
    input.value = AppState.currentFilename || 'untitled.py';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 90);

    // Handler functions
    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        // cleanup listeners so they don't accumulate
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        closeBtn.removeEventListener('click', onCancel);
        input.removeEventListener('keydown', onKeyDown);
    }

    function onConfirm() {
        const val = input.value || '';
        const sanitized = val.replace(/\\|\//g, '').trim();
        if (!sanitized) { showToast('warning', 'Invalid name', 'Filename cannot be empty'); return; }
        AppState.currentFilename = sanitized.endsWith('.py') ? sanitized : sanitized + '.py';
        updateSessionInfo();
        showToast('success', 'Renamed', `File renamed to ${AppState.currentFilename}`);
        closeModal();
    }

    function onCancel() { closeModal(); }

    function onKeyDown(e) {
        if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    }

    const confirmBtn = document.getElementById('confirmRenameBtn');
    const cancelBtn = document.getElementById('cancelRenameBtn');
    const closeBtn = document.getElementById('closeRenameModalBtn');

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
}

// Modern inline filename popover (non-blocking)
function showFilenamePopover(anchorEl) {
    // New behavior: embed an inline filename editor into the status bar
    try {
        const fileNameEl = document.getElementById('fileNameDisplay');
        const fileInfo = document.getElementById('fileInfo') || (fileNameEl && fileNameEl.parentElement);
        if (!fileNameEl || !fileInfo) {
            // fallback to modal if anchors are missing
            return renameFile();
        }

        // If modal is open, don't show inline editor
        const existingModal = document.getElementById('renameModal');
        if (existingModal && existingModal.classList.contains('active')) return;

        // If an inline editor already exists, focus it
        const existingEditor = document.getElementById('statusFilenameEditor');
        if (existingEditor) {
            const inp = existingEditor.querySelector('.status-filename-input');
            if (inp) { inp.focus(); inp.select(); }
            return;
        }

        // Create inline editor container
        const wrap = document.createElement('span');
        wrap.id = 'statusFilenameEditor';
        wrap.className = 'status-filename-editor status-item';
        wrap.setAttribute('role', 'group');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'status-filename-input';
        input.value = AppState.currentFilename || (fileNameEl.textContent || 'untitled.py').trim();
        input.setAttribute('aria-label', 'Rename file');

        const actions = document.createElement('span');
        actions.className = 'status-filename-actions';

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'fp-icon-btn fp-close';
        btnCancel.title = 'Cancel';
        btnCancel.setAttribute('aria-label', 'Cancel rename');
        btnCancel.innerHTML = '<i class="fas fa-times"></i>';

        const btnOk = document.createElement('button');
        btnOk.type = 'button';
        btnOk.className = 'fp-icon-btn fp-ok';
        btnOk.title = 'Rename';
        btnOk.setAttribute('aria-label', 'Confirm rename');
        btnOk.innerHTML = '<i class="fas fa-check"></i>';

        actions.appendChild(btnCancel);
        actions.appendChild(btnOk);
        wrap.appendChild(input);
        wrap.appendChild(actions);

        // Temporarily hide the existing fileNameEl text to preserve layout
        fileNameEl.style.display = 'none';
        // Insert the editor after fileNameEl
        fileNameEl.parentElement.insertBefore(wrap, fileNameEl.nextSibling);

        // Focus and select text
        setTimeout(() => { input.focus(); input.select(); }, 40);

        function cleanup(restoreText = true) {
            try {
                btnCancel.removeEventListener('click', onCancel);
                btnOk.removeEventListener('click', onConfirm);
                input.removeEventListener('keydown', onKey);
                window.removeEventListener('click', onDocClick, true);
            } catch (e) {}
            try { wrap.remove(); } catch (e) {}
            if (restoreText) {
                try { fileNameEl.style.display = ''; } catch (e) {}
            }
        }

        function onCancel() { cleanup(true); }

        function onConfirm() {
            const val = (input.value || '').replace(/\\|\//g, '').trim();
            if (!val) { showToast('warning', 'Invalid name', 'Filename cannot be empty'); return; }
            const newFilename = val.endsWith('.py') ? val : val + '.py';
            // capture previous displayed filename so we only update tab label
            // when it previously matched the filename (preserve custom labels)
            const prevDisplayed = (fileNameEl && fileNameEl.textContent) ? fileNameEl.textContent.trim() : (AppState.currentFilename || 'untitled.py');
            AppState.currentFilename = newFilename;
            // Update UI: file display and active tab if any
            try { fileNameEl.textContent = AppState.currentFilename; } catch (e) {}
            try {
                if (Tabs && Tabs.activeId) {
                    const tab = Tabs.list.find(t => t.id === Tabs.activeId);
                    if (tab) {
                        // Set the tab's filename (actual identity). Only overwrite the visible
                        // tab label if it previously matched the old filename (common initial state).
                        tab.filename = AppState.currentFilename;
                        if (tab.name === prevDisplayed) tab.name = AppState.currentFilename;
                        renderTabs();
                    }
                }
            } catch (e) {}
            updateSessionInfo();
            showToast('success', 'Renamed', `File renamed to ${AppState.currentFilename}`);
            cleanup(true);
        }

        function onKey(e) {
            if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
            else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        }

        function onDocClick(e) {
            // if click outside editor and fileNameEl, cancel
            if (!wrap.contains(e.target) && e.target !== fileNameEl) { cleanup(true); }
        }

        btnCancel.addEventListener('click', onCancel);
        btnOk.addEventListener('click', onConfirm);
        input.addEventListener('keydown', onKey);
        // Click outside should cancel; use capture so we get it before other handlers
        window.addEventListener('click', onDocClick, true);

    } catch (err) {
        console.warn('status bar inline rename failed', err);
        // fallback to modal rename
        try { renameFile(); } catch (e) { console.warn('fallback rename failed', e); }
    }
}

// ============================================
// UI Updates
// ============================================
function clearConsole() {
    if (AppState.currentMode === 'repl') {
        clearRepl();
    } else {
        const outputConsole = document.getElementById('outputConsole');
        outputConsole.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-rocket"></i>
                <p>Console cleared</p>
                <p class="subtitle">Ready for new output</p>
            </div>
        `;
        document.getElementById('executionTime').textContent = '0.000s';
    }
    showToast('info', 'Cleared', AppState.currentMode === 'repl' ? 'REPL cleared' : 'Console cleared');
}

// Clear all four panels: Code editor, Output console, REPL (input + output), and Variables
async function clearAllPanels() {
    // Confirm if the editor has unsaved changes (simple heuristic: non-empty)
    if (AppState.editor && AppState.editor.getValue && AppState.editor.getValue().trim()) {
        const proceed = await showConfirm(
            'Clear everything?',
            'This will clear editor, console, REPL and variables.',
            { okText: 'Clear', cancelText: 'Cancel' }
        );
        if (!proceed) return;
    }

    // Clear editor content
    try {
        if (AppState.editor && typeof AppState.editor.setValue === 'function') {
            AppState.editor.setValue('');
        }
    } catch (e) { console.warn('Failed to clear editor:', e); }

    // Clear output console (uses existing helper)
    try { clearConsole(); } catch (e) { console.warn('clearConsole failed:', e); }

    // Clear REPL (input + output)
    try {
        const replInput = document.getElementById('replInput');
        if (replInput) replInput.value = '';
        clearRepl();
    } catch (e) { console.warn('Failed to clear REPL:', e); }

    // Clear variables panel
    try {
        const vars = document.getElementById('variablesContent');
        if (vars) vars.innerHTML = `<div class="empty-state">No variables</div>`;
    } catch (e) { console.warn('Failed to clear variables:', e); }

    // Reset counts and UI indicators
    try {
        document.getElementById('executionTime').textContent = '0.000s';
        updateOutputCounts();
    } catch (e) { /* ignore */ }

    showToast('info', 'Cleared', 'Editor, Console, REPL and Variables cleared');
}

// ============================================
// Interactive Input Handling
// ============================================
function showInputPrompt(promptText) {
    const inputContainer = document.getElementById('inputPromptContainer');
    const inputPromptText = document.getElementById('inputPromptText');
    const inputField = document.getElementById('inputPromptField');
    
    // Hide input container first
    hideInputPrompt();
    
    // Set prompt text
    inputPromptText.textContent = promptText || '>>> ';

    // Save last prompt info for color mapping
    try {
        const promptStr = String(promptText || '').trim();
        AppState.lastPromptText = promptStr;
        const lower = promptStr.toLowerCase();
        if (lower.includes('int') || /\bint\b/.test(lower)) AppState.lastInputType = 'int';
        else if (lower.includes('float')) AppState.lastInputType = 'float';
        else if (lower.includes('str') || lower.includes('string')) AppState.lastInputType = 'str';
        else if (lower.includes('list')) AppState.lastInputType = 'list';
        else if (lower.includes('tuple')) AppState.lastInputType = 'tuple';
        else if (lower.includes('dict') || lower.includes('dictionary')) AppState.lastInputType = 'dict';
        else if (lower.includes('set')) AppState.lastInputType = 'set';
        else AppState.lastInputType = null;
    } catch (e) { /* ignore */ }
    
    // Show container with animation
    setTimeout(() => {
        inputContainer.style.display = 'flex';
        inputField.value = '';
        inputField.focus();
    }, 100);
}

function hideInputPrompt() {
    const inputContainer = document.getElementById('inputPromptContainer');
    inputContainer.style.display = 'none';
}

// showConfirm: modern modal replacement for window.confirm
// options: { okText, cancelText, htmlBody }
function showConfirm(title, message, options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        if (!modal) {
            // fallback to native confirm
            const ok = confirm(message || title);
            resolve(!!ok);
            return;
        }

        const titleEl = modal.querySelector('#confirmModalTitle');
        const bodyEl = modal.querySelector('#confirmModalBody');
        const okBtn = modal.querySelector('#confirmOkBtn');
        const cancelBtn = modal.querySelector('#confirmCancelBtn');

        titleEl.textContent = title || 'Confirm';
        if (options.htmlBody) bodyEl.innerHTML = options.htmlBody;
        else bodyEl.textContent = message || '';

        okBtn.textContent = options.okText || 'OK';
        cancelBtn.textContent = options.cancelText || 'Cancel';

        // Show modal
        modal.classList.add('active');

        // Handlers
        const cleanup = () => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        };

        function onOk() {
            cleanup();
            modal.classList.remove('active');
            resolve(true);
        }

        function onCancel() {
            cleanup();
            modal.classList.remove('active');
            resolve(false);
        }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

async function submitInput() {
    const inputField = document.getElementById('inputPromptField');
    const value = inputField.value;
    
    // Display the input in the console
    const outputConsole = document.getElementById('outputConsole');
    const inputEcho = document.createElement('div');
    inputEcho.className = 'output-line output-info';
    // Trim leading unicode spaces from echoed input to avoid visual gaps
    const promptText = document.getElementById('inputPromptText').textContent || '';
    const unicodeSpaces = '[\\s\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]';
    const trimLeading = new RegExp('^' + unicodeSpaces + '+');
    inputEcho.textContent = (promptText + value).replace(trimLeading, '');
    outputConsole.appendChild(inputEcho);
    outputConsole.scrollTop = outputConsole.scrollHeight;
    try { updateOutputCounts(); } catch (e) { }
    
    // Hide input prompt
    hideInputPrompt();
    
    // Update status
    updateStatus('running', 'Processing input...');
    showLoading(true);
    
    const startTime = performance.now();
    
    try {
        const response = await fetch('/api/provide_input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: value })
        });
        
        const result = await response.json();
        const endTime = performance.now();
        const executionTime = ((endTime - startTime) / 1000).toFixed(3);
        
        // Check if more input is required
        if (result.input_required) {
            displayOutput(result, executionTime);
            showInputPrompt(result.input_prompt);
            updateStatus('waiting', 'Waiting for input...');
            showLoading(false);
            return;
        }
        
        // Display final result
        displayOutput(result, executionTime);
        updateExecutionStats(result.success, executionTime);
        
        if (result.success) {
            updateStatus('ready', 'Execution completed');
            showToast('success', 'Success', `Code executed in ${executionTime}s`);
            playSound('success');
        } else {
            updateStatus('error', 'Execution failed');
            showToast('error', 'Error', 'Code execution failed');
            playSound('error');
        }
        
        // Auto-refresh variables
        await refreshVariables();
        
    } catch (error) {
        updateStatus('error', 'Network error');
        showToast('error', 'Error', 'Failed to process input: ' + error.message);
        console.error('Input error:', error);
    } finally {
        showLoading(false);
    }
}

function updateStatus(status, message) {
    const indicator = document.getElementById('statusIndicator');
    const icon = indicator.querySelector('i');
    
    icon.className = 'fas fa-circle';
    
    if (status === 'ready') {
        icon.classList.add('status-ready');
        indicator.innerHTML = `<i class="${icon.className}" aria-hidden="true"></i> Ready`;
    } else if (status === 'running') {
        icon.classList.add('status-running');
        // If message is empty, keep the label minimal to avoid the brief
        // flash of text; provide an accessible label for screen readers.
        if (message && String(message).trim() !== '') {
            indicator.innerHTML = `<i class="${icon.className}" aria-hidden="true"></i> ${message}`;
        } else {
            indicator.innerHTML = `<i class="${icon.className}" aria-hidden="true"></i> <span class="sr-only">Running</span>`;
        }
    } else if (status === 'waiting') {
        icon.classList.add('status-waiting');
        indicator.innerHTML = `<i class="${icon.className}" aria-hidden="true"></i> ${message}`;
    } else if (status === 'error') {
        icon.classList.add('status-error');
        indicator.innerHTML = `<i class="${icon.className}" aria-hidden="true"></i> ${message}`;
    }
}

function updateCursorInfo() {
    const cursor = AppState.editor.getCursor();
    document.getElementById('cursorLine').textContent = cursor.line + 1;
    document.getElementById('cursorCol').textContent = cursor.ch + 1;
}

function updateLineCount() {
    const lineCount = AppState.editor.lineCount();
    document.getElementById('totalLines').textContent = lineCount;
}

function updateExecutionStats(success, time) {
    AppState.executionStats.totalRuns++;
    if (success) {
        AppState.executionStats.successfulRuns++;
    } else {
        AppState.executionStats.failedRuns++;
    }
    AppState.executionStats.totalTime += parseFloat(time);
}

// ============================================
// Theme Management
// ============================================
function toggleTheme() {
    // Use enhanced theme system if available
    if (window.themeManager && window.themeManager.toggleThemeMode) {
        window.themeManager.toggleThemeMode();
        
        // Update icon based on current theme type
        const currentTheme = window.themeManager.currentTheme;
        const theme = window.THEMES ? window.THEMES[currentTheme] : null;
        const icon = document.querySelector('#themeToggleBtn i');
        
        if (icon && theme) {
            icon.className = theme.type === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Re-apply user-selected accent if present so it persists across theme toggles
        if (window.themeManager && window.themeManager.accentColor) {
            try { window.themeManager.applyAccentColor(window.themeManager.accentColor); } catch (e) {}
        }

        showToast('success', 'Theme Changed', `Switched to ${theme ? theme.name : 'alternate'} theme`);
        return;
    }
    
    // Fallback to basic theme toggle
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    AppState.settings.theme = newTheme;
    
    // Update icon
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Update editor theme
    if (AppState.editor) {
        if (newTheme === 'light') {
            AppState.editor.setOption('theme', 'eclipse');
        } else {
            AppState.editor.setOption('theme', 'monokai');
        }
    }
    
    saveSettings();
    showToast('info', 'Theme Changed', `Switched to ${newTheme} mode`);
}

// ============================================
// Settings Modal
// ============================================
function openSettings() {
    // Use enhanced settings UI if available
    if (window.settingsUI && window.settingsUI.show) {
        window.settingsUI.show();
        return;
    }
    
    // Fallback to basic settings modal
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        console.warn('Settings modal not found');
        return;
    }
    modal.classList.add('active');
    
    // Populate current settings with null checks
    const editorTheme = document.getElementById('editorTheme');
    const editorFontSize = document.getElementById('editorFontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const consoleFontSize = document.getElementById('consoleFontSize');
    const consoleFontSizeValue = document.getElementById('consoleFontSizeValue');
    const lineNumbersToggle = document.getElementById('lineNumbersToggle');
    const autoCompleteToggle = document.getElementById('autoCompleteToggle');
    const soundToggle = document.getElementById('soundToggle');
    
    if (editorTheme) editorTheme.value = AppState.settings.editorTheme;
    if (editorFontSize) editorFontSize.value = AppState.settings.editorFontSize;
    if (fontSizeValue) fontSizeValue.textContent = AppState.settings.editorFontSize + 'px';
    if (consoleFontSize) consoleFontSize.value = AppState.settings.consoleFontSize;
    if (consoleFontSizeValue) consoleFontSizeValue.textContent = AppState.settings.consoleFontSize + 'px';
    if (lineNumbersToggle) lineNumbersToggle.checked = AppState.settings.lineNumbers;
    if (autoCompleteToggle) autoCompleteToggle.checked = AppState.settings.autoComplete;
    if (soundToggle) soundToggle.checked = AppState.settings.soundEnabled;
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================
// Input Modal Functions
// ============================================
function submitInputValues() {
    const textarea = document.getElementById('inputValuesTextarea');
    const inputText = textarea.value.trim();
    
    if (!inputText) {
        showToast('warning', 'No Inputs', 'Please provide at least one input value');
        return;
    }
    
    // Split by newlines and filter empty lines
    const inputs = inputText.split('\n').filter(line => line.trim() !== '');
    
    // Get the code
    const code = AppState.editor.getValue().trim();
    
    // Hide modal
    hideInputModal();
    
    // Execute with inputs
    executeCodeWithInputs(code, inputs);
}

function saveSettings() {
    // Get all setting elements with null checks
    const editorTheme = document.getElementById('editorTheme');
    const editorFontSize = document.getElementById('editorFontSize');
    const consoleFontSize = document.getElementById('consoleFontSize');
    const lineNumbersToggle = document.getElementById('lineNumbersToggle');
    const autoCompleteToggle = document.getElementById('autoCompleteToggle');
    const soundToggle = document.getElementById('soundToggle');
    
    // Update AppState settings
    if (editorTheme) AppState.settings.editorTheme = editorTheme.value;
    if (editorFontSize) AppState.settings.editorFontSize = parseInt(editorFontSize.value);
    if (consoleFontSize) AppState.settings.consoleFontSize = parseInt(consoleFontSize.value);
    if (lineNumbersToggle) AppState.settings.lineNumbers = lineNumbersToggle.checked;
    if (autoCompleteToggle) AppState.settings.autoComplete = autoCompleteToggle.checked;
    if (soundToggle) AppState.settings.soundEnabled = soundToggle.checked;
    
    // Apply settings
    if (AppState.editor) {
        AppState.editor.setOption('theme', AppState.settings.editorTheme);
        AppState.editor.setOption('lineNumbers', AppState.settings.lineNumbers);
    }
    
    const codeMirror = document.querySelector('.CodeMirror');
    if (codeMirror) {
        codeMirror.style.fontSize = AppState.settings.editorFontSize + 'px';
    }
    
    const outputConsole = document.getElementById('outputConsole');
    if (outputConsole) {
        outputConsole.style.fontSize = AppState.settings.consoleFontSize + 'px';
    }
    
    // Save to localStorage
    try {
    localStorage.setItem('poonther_settings', JSON.stringify(AppState.settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
    
    closeSettings();
    showToast('success', 'Settings Saved', 'Your preferences have been saved');
}

function loadSettings() {
    const saved = localStorage.getItem('poonther_settings');
    if (saved) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(saved) };
        document.body.setAttribute('data-theme', AppState.settings.theme);
    }
}

function resetSettings() {
    if (confirm('Reset all settings to default?')) {
        AppState.settings = {
            theme: 'dark',
            editorTheme: 'monokai',
            editorFontSize: 14,
            consoleFontSize: 13,
            lineNumbers: true,
            autoComplete: true,
            soundEnabled: false
        };
    localStorage.removeItem('poonther_settings');
        location.reload();
    }
}

// ============================================
// Toast Notifications
// ============================================
function showToast(type, title, message, duration = 3000, actions = null) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // If actions provided, append action buttons inside the toast-content
    if (actions && Array.isArray(actions) && actions.length > 0) {
        try {
            const content = toast.querySelector('.toast-content');
            const actWrap = document.createElement('div');
            actWrap.className = 'toast-actions';
            actions.forEach(a => {
                const btn = document.createElement('button');
                btn.className = 'btn toast-action-btn';
                btn.type = 'button';
                btn.textContent = a.label || 'Open';
                btn.addEventListener('click', (ev) => {
                    try {
                        if (a.url) window.open(a.url, '_blank', 'noopener');
                        if (typeof a.onClick === 'function') a.onClick(ev);
                    } catch (e) { console.warn('toast action failed', e); }
                });
                actWrap.appendChild(btn);
            });
            content.appendChild(actWrap);
            // Extend visible duration so user has time to click
            if (!duration || duration < 6000) duration = 8000;
        } catch (e) {
            console.warn('failed to append toast actions', e);
        }
    }

    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// Loading Overlay
// ============================================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    // If an inline prompt is active, do not show the full-page overlay.
    if (overlay.dataset && overlay.dataset.promptActive === '1' && show) return;
    if (show) {
        overlay.classList.add('active');
        overlay.style.display = 'flex';
    } else {
        overlay.classList.remove('active');
        // also ensure prompt-active marker doesn't accidentally persist
        if (overlay.dataset) overlay.dataset.promptActive = overlay.dataset.promptActive || '';
        overlay.style.display = '';
    }
}

// ============================================
// LocalStorage Persistence
// ============================================
function saveCodeToLocalStorage() {
    localStorage.setItem('poonther_code', AppState.editor.getValue());
}

function loadCodeFromLocalStorage() {
    const saved = localStorage.getItem('poonther_code');
    if (saved) {
        // If there are no tabs yet, create the initial tab with saved content
        if (Tabs.list.length === 0) {
            createTab('untitled.py', saved);
        } else if (Tabs.activeId) {
            const tab = Tabs.list.find(t => t.id === Tabs.activeId);
            if (tab) {
                tab.content = saved;
                if (AppState.editor && AppState.editor.setValue) AppState.editor.setValue(saved);
            }
        } else {
            createTab('untitled.py', saved);
        }
    }
    // Guarantee that if editor has content but no tab exists, we create one
    ensureInitialTab();
}

function saveCommandHistory() {
    localStorage.setItem('poonther_history', JSON.stringify(AppState.commandHistory));
}

function loadCommandHistory() {
    const saved = localStorage.getItem('poonther_history');
    if (saved) {
        AppState.commandHistory = JSON.parse(saved);
        updateHistoryUI();
    }
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update counts for passes, warnings and errors shown in the status bar
function updateOutputCounts() {
    const outputConsole = document.getElementById('outputConsole');
    const replOutput = document.getElementById('replOutput');

    const outputErrors = outputConsole ? outputConsole.querySelectorAll('.output-stderr').length : 0;
    const replErrors = replOutput ? replOutput.querySelectorAll('.repl-error-line').length : 0;
    const totalErrors = outputErrors + replErrors;

    const outputWarnings = outputConsole ? outputConsole.querySelectorAll('.output-warning').length : 0;
    const outputInfos = outputConsole ? outputConsole.querySelectorAll('.output-info').length : 0;
    const replWarnings = replOutput ? replOutput.querySelectorAll('.repl-warning-line').length : 0;
    const totalWarnings = outputWarnings + outputInfos + replWarnings;

    const outputPasses = outputConsole ? outputConsole.querySelectorAll('.output-magic, .output-stdout').length : 0;
    const replPasses = replOutput ? replOutput.querySelectorAll('.repl-output-line, .repl-result-line').length : 0;
    const totalPasses = outputPasses + replPasses;

    const errEl = document.getElementById('errorCountNum');
    const warnEl = document.getElementById('warningCountNum');
    const passEl = document.getElementById('passCountNum');
    if (errEl) errEl.textContent = totalErrors;
    if (warnEl) warnEl.textContent = totalWarnings;
    if (passEl) passEl.textContent = totalPasses;
}

function syntaxHighlightJSON(json) {
    return json
        .replace(/("[\w]+")/g, '<span style="color: #9cdcfe">$1</span>')
        .replace(/(\d+)/g, '<span style="color: #b5cea8">$1</span>')
        .replace(/(true|false|null)/g, '<span style="color: #569cd6">$1</span>');
}

// Real-time per-line validation
async function runPerLineValidation() {
    try {
        if (!AppState.editor) return;

        const totalLines = AppState.editor.lineCount();
        const lines = [];

        for (let i = 0; i < totalLines; i++) {
            const text = AppState.editor.getLine(i) || '';
            lines.push(text);
        }

        // Determine the current cursor line. Any line above the cursor is
        // considered 'finalized' by the user and should be validated even
        // if it looks incomplete locally (e.g. "a =").
        let cursorLine = totalLines;
        try {
            const cur = AppState.editor.getCursor();
            if (cur && typeof cur.line === 'number') cursorLine = cur.line;
        } catch (e) {
            cursorLine = totalLines;
        }

        // Helper: check if a line looks like a block header (ends with ':')
        function isBlockHeader(line) {
            if (!line || typeof line !== 'string') return false;
            return /:\s*$/.test(line);
        }

        // Helper: determine if a block header at index `idx` has an indented
        // non-empty line following it (a simple body). We skip blank lines
        // and comments. If the next meaningful line has greater indentation
        // than the header, we consider the header to have a body.
        function leadingIndent(line) {
            const m = line.match(/^(\s*)/);
            return m ? m[1].length : 0;
        }

        function hasBodyBelow(linesArr, headerIdx) {
            const header = linesArr[headerIdx] || '';
            const headerIndent = leadingIndent(header);
            for (let j = headerIdx + 1; j < linesArr.length; j++) {
                const nxt = linesArr[j];
                if (!nxt || typeof nxt !== 'string') continue;
                const trimmed = nxt.trim();
                if (trimmed === '' || trimmed.startsWith('#')) continue; // skip blank/comment
                const nxtIndent = leadingIndent(nxt);
                if (nxtIndent > headerIndent) return true; // found indented body
                // If we find a non-indented meaningful line, the block has no body
                return false;
            }
            return false;
        }

        // Pre-process lines to ignore incomplete ones locally so they are
        // not reported as errors while the user is still typing. We still
        // treat non-block lines above the cursor as finalized, but for
        // block-headers (ending with ':') we require an actual indented
        // body below to consider them final. Otherwise we keep them ignored
        // until the user provides the body.
        const sendLines = lines.map((l, idx) => {
            // If the line is above cursor, it's usually finalized; however
            // if it is a block header with no body below, treat as incomplete.
            if (idx < cursorLine) {
                if (isBlockHeader(l) && !hasBodyBelow(lines, idx)) return '';
                return l;
            }
            // For lines at/after cursor, use the local completeness heuristic
            return isLineComplete(l) ? l : '';
        });

        // Send to server for validation
        const response = await fetch('/api/validate_lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lines: sendLines })
        });

        const result = await response.json();
        const results = result.results || [];

        // DEBUG: Log what we sent and what the server returned so we can
        // diagnose cases where a correct-looking line is being flagged.
        try {
            console.debug('[per-line] sentLines=', sendLines);
            console.debug('[per-line] serverResults=', results);
        } catch (e) { /* ignore console issues */ }

        // Count passes/errors/warnings per line. We'll treat valid:true as pass,
        // valid:false as error, and valid:null as ignored (empty/incomplete line).
        let pass = 0, error = 0, warn = 0;

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (!r) continue;
            if (r.valid === true) pass++;
            else if (r.valid === false) error++;
            else if (r.valid === null) {
                // ignored (empty or incomplete line)
            }
        }

        // Update DOM counters
        const errEl = document.getElementById('errorCountNum');
        const warnEl = document.getElementById('warningCountNum');
        const passEl = document.getElementById('passCountNum');
        if (errEl) errEl.textContent = error;
        if (warnEl) warnEl.textContent = warn; // currently warnings not produced by backend
        if (passEl) passEl.textContent = pass;

    } catch (e) {
        // Ignore validation network errors silently
        // console.warn('Per-line validation failed:', e);
    }
}

// Heuristic to determine if a single line can be considered a complete
// standalone Python statement for per-line validation. If this returns
// false the line will be ignored (treated neutral) until completed.
function isLineComplete(line) {
    if (!line || typeof line !== 'string') return false;
    const s = line.replace(/\t/g, '    ');
    const trimmed = s.trim();
    if (trimmed === '') return false;

    // If line ends with an explicit line continuation
    if (/\\\s*$/.test(s)) return false;

    // If there's an unmatched opening bracket, it's likely incomplete
    const opens = { '(': 0, '[': 0, '{': 0 };
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '(') opens['(']++;
        if (ch === ')') opens['(']--;
        if (ch === '[') opens['[']++;
        if (ch === ']') opens['[']--;
        if (ch === '{') opens['{']++;
        if (ch === '}') opens['{']--;
    }
    if (opens['('] > 0 || opens['['] > 0 || opens['{'] > 0) return false;

    // If last non-space char is an assignment-like single '=' (not '==', '!=', '>=', '<=')
    const m_eq = s.match(/(.*?)([^=<>!])?=\s*$/);
    if (m_eq && /=$/.test(s.trim())) {
        // Ensure it's not comparison like '==' or '!=' which would have '=' preceded by '=' or '!' etc
        const trimmedLast = s.trim();
        if (!/([!=<>])=\s*$/.test(trimmedLast)) {
            return false;
        }
    }

    // If line ends with an operator commonly indicating continuation
    if (/[+\-*/%&|^<>]$/.test(s.trim())) return false;

    // If line ends with a colon and there's nothing after it, it's a block header
    // and probably incomplete if no inline body present
    if (/:\s*$/.test(s)) return false;

    // If line is a lone statement-starting keyword or clearly incomplete keyword use
    // examples: 'import', 'from os', 'def', 'class', 'return', 'pass', etc.
    // We consider common starters incomplete when they don't have required parts.
    const starters = [
        /^\s*import(?:\s+\w+)?\s*$/,
        /^\s*from\s+\S+\s*$/,
        /^\s*def\s+\w+\s*(\(|:\s*$)/,
        /^\s*class\s+\w+\s*(\(|:\s*$)/,
        /^\s*return\s*$/,
        /^\s*pass\s*$/,
        /^\s*break\s*$/,
        /^\s*continue\s*$/
    ];

    for (const re of starters) {
        if (re.test(s)) return false;
    }

    // Otherwise consider it complete enough for single-line parse
    return true;
}

function playSound(type) {
    // Use the KeyboardSounds class for better sound effects
    if (window.keyboardSounds) {
        if (type === 'success') {
            window.keyboardSounds.playSuccessSound();
        } else if (type === 'error') {
            // Keep the error sound simple for now
            if (!window.keyboardSounds.audioContext) {
                window.keyboardSounds.init();
            }
            const audioContext = window.keyboardSounds.audioContext;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }
}

// ============================================
// Performance Monitoring
// ============================================
setInterval(() => {
    if (performance.memory) {
        const memoryUsage = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        document.getElementById('memoryUsage').textContent = memoryUsage + ' MB';
    }
}, 5000);
// ============================================
// Auto-save (save all open tabs every 10 minutes)
// ============================================
// Track autosave state on AppState
AppState.autosaveInProgress = false;
AppState.autosaveIntervalId = null;

function createAutosaveIndicatorIfNeeded() {
    try {
        if (document.getElementById('autosaveIndicator')) return;
        const fileInfo = document.getElementById('fileInfo');
        const target = fileInfo && fileInfo.parentElement ? fileInfo.parentElement : document.querySelector('.status-left');
        if (!target) return;

        const wrap = document.createElement('span');
        wrap.className = 'status-item';
        wrap.id = 'autosaveIndicator';
        wrap.title = 'Autosave status';
        wrap.style.display = 'inline-flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '8px';

        wrap.innerHTML = `
            <span class="autosave-label" style="display:none;">Autosaving</span>
            <span class="autosave-spinner" aria-hidden="true" style="display:none;"></span>
        `;

        // append after fileInfo if possible, otherwise to the left status group
        if (fileInfo && fileInfo.parentElement) fileInfo.parentElement.insertBefore(wrap, fileInfo.nextSibling);
        else document.querySelector('.status-left')?.appendChild(wrap);
    } catch (e) { console.warn('Failed to create autosave indicator', e); }
}

function setAutosaveActive(active, lastTimestamp) {
    try {
        createAutosaveIndicatorIfNeeded();
        const el = document.getElementById('autosaveIndicator');
        if (!el) return;
        const spinner = el.querySelector('.autosave-spinner');
        const label = el.querySelector('.autosave-label');
        if (active) {
            AppState.autosaveInProgress = true;
            if (spinner) {
                spinner.style.display = 'inline-block';
                spinner.classList.add('autosaving');
            }
            if (label) {
                label.style.display = 'none';
            }
            el.setAttribute('aria-live', 'polite');
            el.title = 'Autosaving...';
        } else {
            AppState.autosaveInProgress = false;
            if (spinner) {
                spinner.style.display = 'none';
                spinner.classList.remove('autosaving');
            }
            if (label) {
                label.style.display = 'none';
            }
            if (lastTimestamp) {
                const ts = new Date(lastTimestamp);
                el.title = 'Last autosave: ' + ts.toLocaleString();
            } else {
                el.title = 'Autosave idle';
            }
        }
    } catch (e) { console.warn('setAutosaveActive failed', e); }
}

async function autosaveAll() {
    // Avoid overlapping autosave runs
    if (AppState.autosaveInProgress) return;

    try {
        setAutosaveActive(true);

        // Persist current editor content into its tab object
        try { persistCurrentTabContent(); } catch (e) {}

        // Snapshot tabs (id, name, content, lastSaved)
        const snapshot = Tabs.list.map(t => ({
            id: t.id,
            name: t.name,
            filename: t.filename || t.name,
            content: t.content || '',
            lastSaved: new Date().toISOString()
        }));

        try {
            localStorage.setItem('poonther_tabs', JSON.stringify(snapshot));
            localStorage.setItem('poonther_autosave_meta', JSON.stringify({ lastAutosave: new Date().toISOString() }));
        } catch (e) {
            console.warn('Autosave failed to write to localStorage', e);
        }

        // Optionally also save the currently focused editor value under the legacy key
        try { saveCodeToLocalStorage(); } catch (e) {}

        // Update small UI feedback
        setAutosaveActive(false, new Date().toISOString());
    } catch (e) {
        console.error('autosaveAll error', e);
        setAutosaveActive(false);
    }
}

// Start autosave timer: every 10 minutes (600000 ms)
document.addEventListener('DOMContentLoaded', () => {
    createAutosaveIndicatorIfNeeded();
    // Clear any previously set interval (defensive) and set ours
    try { if (AppState.autosaveIntervalId) clearInterval(AppState.autosaveIntervalId); } catch (e) {}
    AppState.autosaveIntervalId = setInterval(() => { autosaveAll(); }, 10 * 60 * 1000);

    // Run one initial autosave shortly after load (gives other init a moment)
    setTimeout(() => { try { autosaveAll(); } catch (e) {} }, 2000);

    // Ensure we autosave on unload to reduce data loss risk
    window.addEventListener('beforeunload', () => {
        try {
            // synchronous localStorage write
            persistCurrentTabContent();
            const snapshot = Tabs.list.map(t => ({ id: t.id, name: t.name, filename: t.filename || t.name, content: t.content || '', lastSaved: new Date().toISOString() }));
            localStorage.setItem('poonther_tabs', JSON.stringify(snapshot));
            localStorage.setItem('poonther_autosave_meta', JSON.stringify({ lastAutosave: new Date().toISOString() }));
        } catch (e) { /* best-effort */ }
    });
});

// ============================================
// Mode Switching
// ============================================
function toggleMode() {
    const modeToggle = document.getElementById('modeToggle');
    const editorMode = document.getElementById('editorMode');
    const replMode = document.getElementById('replMode');
    const panelTitle = document.getElementById('panelTitle');
    const panelIcon = document.getElementById('panelIcon');
    const runBtn = document.getElementById('runCodeBtn');
    const validateBtn = document.getElementById('validateSyntaxBtn');
    
    if (modeToggle.checked) {
        // Switch to REPL mode
        // Reset REPL output to remove any file header or leftover lines
        try { clearRepl(); } catch (e) { }
        // Re-render the REPL welcome message (keeps behavior of clearRepl for explicit clears)
        try { renderReplWelcome(); } catch (e) { }
    AppState.currentMode = 'repl';
    // Smoothly fade panels: animate editor out, repl in
    fadeOutPanel(editorMode);
    fadeInPanel(replMode);
        // Show repl tabs, hide editor tabs
        const editorTabs = document.getElementById('tabsContainer');
        const replTabs = document.getElementById('replTabsContainer');
    if (editorTabs) fadeOutPanel(editorTabs);
    if (replTabs) fadeInPanel(replTabs);
        // render repl tabs
        try { renderReplTabs(); } catch (e) { }
        panelTitle.textContent = 'REPL Console';
        panelIcon.className = 'fas fa-terminal';
    // animate Run/Validate disappearance
    if (runBtn) fadeOutPanel(runBtn);
    if (validateBtn) fadeOutPanel(validateBtn);
        // hide new/view tab controls in REPL mode
        const tabControls = document.getElementById('tabControls');
    if (tabControls) fadeOutPanel(tabControls);
        // hide editor breadcrumb (filename row) when in REPL
        const breadcrumb = document.getElementById('editorBreadcrumb');
    if (breadcrumb) fadeOutPanel(breadcrumb);
        
        // Focus REPL input
        setTimeout(() => { document.getElementById('replInput').focus(); }, 220);
        // Add a class to body to trigger CSS transitions (smooth button animations)
        try { document.body.classList.add('repl-mode'); } catch (e) { }

        showToast('info', 'REPL Mode', 'Interactive Python REPL activated');
    } else {
        // Switch to Editor mode
    AppState.currentMode = 'editor';
    // Smoothly swap panels back
    fadeInPanel(editorMode);
    fadeOutPanel(replMode);
        // Show editor tabs, hide repl tabs
        const editorTabs = document.getElementById('tabsContainer');
        const replTabs = document.getElementById('replTabsContainer');
    if (editorTabs) fadeInPanel(editorTabs);
    if (replTabs) fadeOutPanel(replTabs);
        // render editor tabs
        try { renderTabs(); } catch (e) { }
        panelTitle.textContent = 'Code Editor';
        panelIcon.className = 'fas fa-code';
    if (runBtn) fadeInPanel(runBtn);
    if (validateBtn) fadeInPanel(validateBtn);
        // show new/view tab controls in Editor mode
        const tabControls = document.getElementById('tabControls');
    if (tabControls) fadeInPanel(tabControls);
        // restore breadcrumb in Editor mode
        const breadcrumb = document.getElementById('editorBreadcrumb');
    if (breadcrumb) fadeInPanel(breadcrumb);
        
    // Refresh editor after animation completes to avoid layout thrash
    setTimeout(() => { try { AppState.editor.refresh(); } catch (e) {} }, 260);
        // Remove the repl-mode class to animate controls back in
        try { document.body.classList.remove('repl-mode'); } catch (e) { }
        
        showToast('info', 'Editor Mode', 'Code editor activated');
    }
}

// Helper: fade out a panel element smoothly then add .hidden
function fadeOutPanel(elem) {
    if (!elem) return;
    // Ensure the element is configured for fading
    elem.classList.add('panel-fade');
    // If already hidden, ensure hidden class
    if (elem.classList.contains('hidden')) return;
    // Start fade-out
    elem.classList.remove('fading-in');
    elem.classList.add('fading-out');
    // After transition complete, set .hidden to remove from flow if the element used display:none elsewhere
    const onEnd = (ev) => {
        // Only respond to opacity/transform transitions
        if (ev && ev.propertyName && !/(opacity|transform)/.test(ev.propertyName)) return;
        elem.classList.add('hidden');
        elem.classList.remove('fading-out');
        elem.removeEventListener('transitionend', onEnd);
    };
    elem.addEventListener('transitionend', onEnd);
    // Fallback: ensure hidden after max duration
    setTimeout(() => { if (!elem.classList.contains('hidden')) { elem.classList.add('hidden'); elem.classList.remove('fading-out'); } }, 360);
}

// Helper: make element visible and animate in
function fadeInPanel(elem) {
    if (!elem) return;
    elem.classList.add('panel-fade');
    // Remove hidden so transition can run
    elem.classList.remove('hidden');
    // force a layout so transition starts
    // eslint-disable-next-line no-unused-expressions
    elem.offsetWidth;
    elem.classList.remove('fading-out');
    elem.classList.add('fading-in');
    // Remove fading-in class at end so future toggles can reuse
    const onEnd = (ev) => {
        if (ev && ev.propertyName && !/(opacity|transform)/.test(ev.propertyName)) return;
        elem.classList.remove('fading-in');
        elem.removeEventListener('transitionend', onEnd);
    };
    elem.addEventListener('transitionend', onEnd);
    // Safety: clear classes after max duration
    setTimeout(() => { elem.classList.remove('fading-in'); }, 420);
}

// ============================================
// REPL Functions
// ============================================
function handleReplKeydown(e) {
    const replInput = document.getElementById('replInput');
    
    if (e.key === 'Enter') {
        e.preventDefault();
        executeReplLine();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateReplHistory('up');
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateReplHistory('down');
    }
}

async function executeReplLine() {
    const replInput = document.getElementById('replInput');
    const line = replInput.value.trim();
    
    if (!line) return;
    
    // Display input
    addReplLine('>>> ' + line, 'input');
    
    // Clear input
    replInput.value = '';
    
    // Add to REPL history
    AppState.replHistory.unshift(line);
    if (AppState.replHistory.length > 50) {
        AppState.replHistory = AppState.replHistory.slice(0, 50);
    }
    AppState.replHistoryIndex = -1;
    
    // Execute
    try {
        const response = await fetch('/api/execute_line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line: line })
        });
        
        const result = await response.json();
        
        // Display output
        if (result.output && result.output.trim()) {
            addReplLine(result.output.trim(), 'output');
        }
        
        // Display result (for expressions)
        if (result.result !== null && result.result !== undefined) {
            addReplLine(String(result.result), 'result');
        }
        
        // Display error
        if (result.error) {
            addReplLine(result.error, 'error');
        }
        
        // Refresh variables
        await refreshVariables();
        
    } catch (error) {
        addReplLine('Error: ' + error.message, 'error');
    }
}

function addReplLine(text, type) {
    const replOutput = document.getElementById('replOutput');
    
    // Remove welcome message if present
    const welcome = replOutput.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    
    const line = document.createElement('div');
    line.className = `repl-line repl-${type}-line`;
    
    if (type === 'error') {
        // Format error nicely
        const lines = text.split('\n');
        const errorMsg = lines[lines.length - 1] || lines[lines.length - 2];
        line.innerHTML = `<strong>Error:</strong> ${escapeHtml(errorMsg)}`;
        
        // Add collapsible traceback if there's more
        if (lines.length > 1) {
            const traceback = document.createElement('details');
            traceback.style.marginTop = '8px';
            traceback.innerHTML = `
                <summary style="cursor: pointer; color: var(--text-tertiary);">
                    <i class="fas fa-chevron-right"></i> Show traceback
                </summary>
                <pre style="margin-top: 8px; font-size: 11px;">${escapeHtml(text)}</pre>
            `;
            line.appendChild(traceback);
        }
    } else {
        line.textContent = text;
    }
    
    replOutput.appendChild(line);
    replOutput.scrollTop = replOutput.scrollHeight;
    // Refresh counts to reflect new repl lines
    try { updateOutputCounts(); } catch (e) { }
}

function navigateReplHistory(direction) {
    if (AppState.replHistory.length === 0) return;
    
    const replInput = document.getElementById('replInput');
    
    if (direction === 'up') {
        AppState.replHistoryIndex = Math.min(
            AppState.replHistoryIndex + 1,
            AppState.replHistory.length - 1
        );
    } else {
        AppState.replHistoryIndex = Math.max(AppState.replHistoryIndex - 1, -1);
    }
    
    if (AppState.replHistoryIndex >= 0) {
        replInput.value = AppState.replHistory[AppState.replHistoryIndex];
    } else {
        replInput.value = '';
    }
}

function clearRepl() {
    const replOutput = document.getElementById('replOutput');
    // Clear all REPL output. Do not inject a "cleared" welcome message so
    // the REPL doesn't show an extra trailing line when switched or cleared.
    replOutput.innerHTML = '';
}

// Render the default REPL welcome block (icon + instructions).
// This is called when entering REPL mode so users see the same welcome
// affordance as the Output Console. We avoid inserting this on every clear
// (clearRepl intentionally empties the output) so manual clears remain empty.
function renderReplWelcome() {
    const replOutput = document.getElementById('replOutput');
    if (!replOutput) return;
    // If there is already content (user has typed commands), don't overwrite it
    if (replOutput.children && replOutput.children.length > 0) return;

    const welcome = document.createElement('div');
    welcome.className = 'welcome-message';
    welcome.innerHTML = `
        <i class="fas fa-terminal"></i>
        <p>Python REPL Mode</p>
        <p class="subtitle">Type Python commands and press <kbd>Enter</kbd> to execute.</p>
        <p class="subtitle">Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate history.</p>
    `;

    replOutput.appendChild(welcome);
}

console.log('✅ poontHER loaded successfully!');

// Brand name per-letter jingle setup
(function setupBrandJingle() {
    function splitLetters(el) {
        if (!el) return;
        const text = el.textContent || '';
        el.innerHTML = '';

        // A small, pleasant palette. You can change these to theme variables
        // or compute them dynamically if you prefer.
        const palette = [
            '#0f542dff', // red
            '#368751ff', // orange
            '#0f542dff', // yellow
            '#368751ff', // green
            '#0f542dff', // teal
            '#368751ff', // blue
            '#0f542dff', // purple
            '#368751ff'  // pink
        ];

    // Use a uniform bounce amplitude (px) for all letters so every
    // character moves the same distance up and down.
    const uniformAmp = 10; // px — adjust this value to change global amplitude

        // animationDuration must match the CSS animation-duration for sync
        const animationDuration = 900; // ms (matches advanced.css)
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const span = document.createElement('span');
            span.className = 'letter';
            // preserve spaces
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            span.style.setProperty('--i', String(i));
            // color per-letter (as before)
            const color = palette[i % palette.length];
            span.style.setProperty('color', color, 'important');
            span.style.setProperty('-webkit-text-fill-color', color, 'important');
            span.style.setProperty('opacity', '1', 'important');
            // set uniform per-letter bounce amplitude (same for all characters)
            span.style.setProperty('--bounce', uniformAmp + 'px', 'important');
            // Give each letter a different phase by assigning a negative
            // animation-delay (so they start part-way through the cycle).
            // Use a pseudo-random deterministic value so timing differs but is
            // repeatable on each load (based on index). If you prefer true
            // randomness, switch to Math.random().
            const seed = (i * 9973) % animationDuration; // simple deterministic spread
            const offset = Math.floor(seed); // 0..animationDuration-1
            // negative delay to offset the animation phase
            span.style.setProperty('animation-delay', `${-offset}ms`, 'important');
            span.style.setProperty('-webkit-animation-delay', `${-offset}ms`, 'important');
            el.appendChild(span);
        }
    }

    // Continuous bounce replaces the jingle; no trigger required.

    document.addEventListener('DOMContentLoaded', () => {
        try {
            const brand = document.querySelector('.brand-name');
            if (!brand) return;
            // Wrap letters once
            if (!brand.dataset.jingleSplit) {
                // assign split letters and per-letter bounce amplitudes
                splitLetters(brand);
                brand.dataset.jingleSplit = '1';
                // ensure the brand has the class that enables per-letter animation
                brand.classList.add('brand-bouncing');
            }
            // No hover/click triggers needed; animation runs continuously.
            // Allow keyboard focus for accessibility only.
            brand.setAttribute('tabindex', '0');
        } catch (e) { console.warn('Brand jingle setup failed', e); }
    });
    // If the user prefers reduced motion, do not start JS animation.
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Start a JS-driven animation loop for smoother per-letter motion.
    // This uses sine waves so motion is continuous and hardware-friendly.
    function startJsBounce() {
        if (prefersReduced) return;
        const brand = document.querySelector('.brand-name');
        if (!brand) return;
        const letters = Array.from(brand.querySelectorAll('.letter'));
        if (!letters.length) return;

        // Use the same amplitude values from splitLetters (they're stored as --bounce)
        const amps = letters.map((el, i) => {
            const v = getComputedStyle(el).getPropertyValue('--bounce') || '8px';
            return parseFloat(v);
        });

        // phases and speed
        const basePeriod = 0.9; // seconds (matches previous 900ms)
        const twoPi = Math.PI * 2;
        const startTime = performance.now();

        // Make sure CSS animations are disabled while JS runs
        brand.classList.add('js-bounce');

        function frame(now) {
            const t = (now - startTime) / 1000; // seconds
            // Keep fixed angular velocity so speed stays consistent
            const omega = twoPi / basePeriod;
            // spatial frequency controls how fast the wave travels across letters
            const k = 0.8; // spatial wave number
            for (let i = 0; i < letters.length; i++) {
                const el = letters[i];
                // traveling wave: angle = omega * t - k * i
                const angle = omega * t - k * i;
                const amp = amps[i] || 8;
                // vertical displacement
                const y = Math.sin(angle) * amp;
                // small lateral sway and rotation to emulate crawling
                const x = Math.cos(angle * 0.9) * (amp * 0.12); // small x offset
                const rot = Math.sin(angle * 0.9) * 6; // rotation degrees
                // apply transform: translate3d + rotate
                const tx = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
                el.style.transform = tx;
                el.style.webkitTransform = tx;
                el.style.opacity = '1';
            }
            // request next frame
            brand._bounceRaf = requestAnimationFrame(frame);
        }

        brand._bounceRaf = requestAnimationFrame(frame);
    }

    // Start when DOM loaded and letters exist
    if (!window.__brandBounceStarted) {
        window.addEventListener('load', startJsBounce);
        window.__brandBounceStarted = true;
    }

})();

// ============================================
// Panel drag-and-drop swapping
// Allows user to hold and drag any element with .split-panel and drop
// it onto another .split-panel to swap their positions in the DOM.
// This also attempts to preserve Split.js behavior by swapping element ids
// so existing splits that refer to '#leftPanel' / '#rightPanel' continue to work.
// ============================================
(function setupPanelDragSwap() {
    function swapElements(a, b) {
        const aNext = a.nextSibling;
        const bNext = b.nextSibling;
        const aParent = a.parentNode;
        const bParent = b.parentNode;

        // If same parent and adjacent, use simple insertBefore
        if (aParent === bParent) {
            aParent.insertBefore(a, bNext);
            aParent.insertBefore(b, aNext);
            return;
        }

        // General swap for different parents: use placeholders to avoid losing refs
        const aPlaceholder = document.createElement('div');
        const bPlaceholder = document.createElement('div');
        aParent.insertBefore(aPlaceholder, a);
        bParent.insertBefore(bPlaceholder, b);

        aParent.replaceChild(b, aPlaceholder);
        bParent.replaceChild(a, bPlaceholder);
    }

    function swapIds(elA, elB) {
        try {
            // swap id attributes safely
            const idA = elA.id || '';
            const idB = elB.id || '';
            // use temporary id to avoid duplicates
            const tmp = '__tmp_swap_' + Math.random().toString(36).slice(2,8);
            if (idA) elA.id = tmp;
            if (idB) elB.id = idA;
            if (idA) elA.id = idB;
        } catch (e) { /* ignore id swap failures */ }
    }

    function onDragStart(e) {
        const el = e.currentTarget;
        e.dataTransfer.setData('text/plain', el.id || '');
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
        // store reference on window to simplify drop logic
        window.__pyinter_draggingPanel = el;
    }

    function onDragEnd(e) {
        const el = e.currentTarget;
        el.classList.remove('dragging');
        window.__pyinter_draggingPanel = null;
        // cleanup any drop-target classes
        document.querySelectorAll('.split-panel.drop-target').forEach(x => x.classList.remove('drop-target'));
    }

    function onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = e.currentTarget;
        // highlight target
        if (target && !target.classList.contains('dragging')) {
            target.classList.add('drop-target');
        }
    }

    function onDragLeave(e) {
        const target = e.currentTarget;
        if (target) target.classList.remove('drop-target');
    }

    function swapContents(a, b) {
        // Swap child nodes between containers while preserving the containers themselves
        try {
            // If one container contains the other, swapping contents would remove
            // the inner container from the DOM and can cause both to disappear.
            // In that case, fall back to swapping the container elements themselves.
            if (a.contains(b) || b.contains(a)) {
                swapElements(a, b);
                return;
            }
            const fragA = document.createDocumentFragment();
            const fragB = document.createDocumentFragment();

            while (a.firstChild) fragA.appendChild(a.firstChild);
            while (b.firstChild) fragB.appendChild(b.firstChild);

            // move fragA into b, fragB into a
            b.appendChild(fragA);
            a.appendChild(fragB);
        } catch (e) {
            console.warn('swapContents failed', e);
        }
    }

    function onDrop(e) {
        e.preventDefault();
        // If called via delegation using .call(target, e), prefer 'this' as the destination.
        const dst = (this && this.nodeType === 1) ? this : (e.currentTarget || getDropTargetFrom(e.target));
        const src = window.__pyinter_draggingPanel || document.getElementById((e.dataTransfer && e.dataTransfer.getData) ? e.dataTransfer.getData('text/plain') : '');
        if (!src || !dst || src === dst) return;

        try {
            const srcIsSplit = src.classList && src.classList.contains('split-panel');
            const dstIsSplit = dst.classList && dst.classList.contains('split-panel');

            // If swapping between different split levels (e.g., a top-level .split-panel and
            // a nested container like #outputContainer or #variablesContainer) swap their
            // inner contents instead of replacing entire containers to preserve Split.js structure.
            const isCrossLevelSwap = (srcIsSplit && !dstIsSplit) || (!srcIsSplit && dstIsSplit);

            if (isCrossLevelSwap) {
                // swap the inner contents so gutters and split structure remain stable
                swapContents(src, dst);
                // refresh editors/terminals if present
                try { if (AppState && AppState.editor && typeof AppState.editor.refresh === 'function') AppState.editor.refresh(); } catch (e) {}
            } else if (srcIsSplit && dstIsSplit) {
                // swapping two top-level split panels: swap the elements themselves
                swapElements(src, dst);
                swapIds(src, dst);
                try { if (AppState && AppState.editor && typeof AppState.editor.refresh === 'function') AppState.editor.refresh(); } catch (e) {}
            } else {
                // swapping two sibling child panels (e.g., output <-> variables): swap elements
                swapElements(src, dst);
            }
        } catch (err) {
            console.warn('Panel swap failed', err);
        } finally {
            // cleanup classes
            document.querySelectorAll('.split-panel.drop-target, #outputContainer.drop-target, #variablesContainer.drop-target').forEach(x => x.classList.remove('drop-target'));
            if (window.__pyinter_draggingPanel) window.__pyinter_draggingPanel.classList.remove('dragging');
            window.__pyinter_draggingPanel = null;
        }
    }

    function getDropTargetFrom(el) {
        if (!el) return null;
        // prefer exact output/vars containers if inside them
        const out = el.closest && el.closest('#outputContainer');
        if (out) return out;
        const vars = el.closest && el.closest('#variablesContainer');
        if (vars) return vars;
        // else return the nearest split-panel
        return el.closest && el.closest('.split-panel');
    }
    // Attach drag + hold-and-shake handlers to panel headers
    // Helper: toggle fullscreen state for a panel element
    function togglePanelFullscreen(panel) {
        if (!panel) return;
        // If user toggles a nested container (e.g. #outputContainer or #variablesContainer)
        // make sure the top-level .split-panel ancestor also gets the fullscreen class
        const topSplit = panel.closest && panel.closest('.split-panel') ? panel.closest('.split-panel') : panel;
        const isNow = panel.classList.toggle('panel-fullscreen');
        // apply same fullscreen marker to the top-level split so CSS that targets
        // top-level .split-panel:not(.panel-fullscreen) behaves correctly
        try { topSplit.classList.toggle('panel-fullscreen', isNow); } catch (e) {}
        panel.setAttribute('aria-expanded', String(isNow));
        console.debug('[fullscreen] toggled', { panel: panel.id || panel.className, topSplit: topSplit && (topSplit.id || topSplit.className), state: isNow });
        // add/remove a body-level marker so CSS can scope hide/show behavior safely
        try {
            if (isNow) document.body.classList.add('panel-fullscreen-active');
            else {
                // if no other panels are fullscreen, remove marker
                const any = document.querySelector('.panel-fullscreen');
                if (!any) document.body.classList.remove('panel-fullscreen-active');
            }
        } catch (e) {}

        // If we've just activated fullscreen, some split.js inline sizing (width/flex-basis)
        // may keep the panel limited to half the viewport. Save previous inline styles
        // and force full-size styles; restore them on exit.
        try {
            const target = topSplit || panel;
                if (isNow) {
                // Save previous inline sizing so we can restore later
                const prev = {
                    width: target.style.width || null,
                    flexBasis: target.style.flexBasis || null,
                    maxWidth: target.style.maxWidth || null
                };
                try { target.dataset.__pf_saved = JSON.stringify(prev); } catch (e) {}
                // Force full coverage
                target.style.setProperty('width', '100%','important');
                target.style.setProperty('flex-basis', '100%','important');
                target.style.setProperty('max-width', 'none','important');
                // If the left-folder sidebar exists and the target is the leftPanel
                // (or inside it), keep the folder visible and offset the fullscreen
                // panel to the right of the folder instead of hiding it.
                try {
                    const leftPanel = document.getElementById('leftPanel');
                    const folder = document.getElementById('folderPanel') || document.getElementById('folderSidebar');
                    const isLeftTarget = (target && leftPanel && (leftPanel === target || leftPanel.contains(target)));
                    if (folder && isLeftTarget) {
                        // Save folder visibility state (so restore won't overwrite)
                        try { folder.dataset.__pf_kept = '1'; } catch (e) {}
                        // compute folder width (use computed if not inline)
                        const folderRect = folder.getBoundingClientRect();
                        const folderWidth = folderRect && folderRect.width ? Math.round(folderRect.width) : null;
                        if (folderWidth) {
                            // Save any existing left/width inline styles for target
                            try {
                                const savedMeta = JSON.parse(target.dataset.__pf_saved || '{}');
                                savedMeta.__pf_folder_offset = folderWidth;
                                target.dataset.__pf_saved = JSON.stringify(savedMeta);
                            } catch (e) { /* ignore */ }
                            // Apply an inline left margin to avoid covering the folder
                            target.style.setProperty('margin-left', folderWidth + 'px', 'important');
                            // Reduce width so it doesn't overflow the viewport (use calc)
                            target.style.setProperty('width', `calc(100% - ${folderWidth}px)`, 'important');
                            target.style.setProperty('flex-basis', `calc(100% - ${folderWidth}px)`, 'important');
                        }
                    }
                } catch (e) { console.debug('[fullscreen] folder offset failed', e); }
                // If we're fullscreening a nested container (panel !== topSplit), hide its siblings
                try {
                    if (panel !== topSplit) {
                        const parent = panel.parentElement;
                        if (parent && parent.children && parent.children.length > 1) {
                            Array.from(parent.children).forEach(ch => {
                                if (ch === panel) return;
                                // Do not hide folder sidebar when editor is fullscreen
                                if (ch && (ch.id === 'folderPanel' || ch.id === 'folderSidebar')) return;
                                try { ch.dataset.__pf_disp = ch.style.display || ''; } catch (e) {}
                                ch.style.display = 'none';
                            });
                        }
                    }
                } catch (e) { console.debug('[fullscreen] hide siblings failed', e); }
            } else {
                // restore saved inline styles
                let restored = null;
                try { restored = target.dataset && target.dataset.__pf_saved ? JSON.parse(target.dataset.__pf_saved) : null; } catch (e) { restored = null; }
                if (restored) {
                    // If we saved a folder offset, remove margin-left and restore width accordingly
                    const folderOffset = restored.__pf_folder_offset ? parseInt(restored.__pf_folder_offset, 10) : 0;
                    if (folderOffset) {
                        target.style.removeProperty('margin-left');
                        // If original width was null, remove property; otherwise restore saved value
                        if (restored.width === null) target.style.removeProperty('width'); else target.style.width = restored.width;
                        if (restored.flexBasis === null) target.style.removeProperty('flex-basis'); else target.style.flexBasis = restored.flexBasis;
                    } else {
                        if (restored.width === null) target.style.removeProperty('width'); else target.style.width = restored.width;
                        if (restored.flexBasis === null) target.style.removeProperty('flex-basis'); else target.style.flexBasis = restored.flexBasis;
                        if (restored.maxWidth === null) target.style.removeProperty('max-width'); else target.style.maxWidth = restored.maxWidth;
                    }
                } else {
                    // if no saved data, remove forced props
                    target.style.removeProperty('width');
                    target.style.removeProperty('flex-basis');
                    target.style.removeProperty('max-width');
                    target.style.removeProperty('margin-left');
                }
                try { delete target.dataset.__pf_saved; } catch (e) {}
                // restore siblings display if we hid them earlier
                try {
                    if (panel !== topSplit) {
                        const parent = panel.parentElement;
                        if (parent && parent.children && parent.children.length > 0) {
                            Array.from(parent.children).forEach(ch => {
                                if (ch === panel) return;
                                try {
                                    const prev = ch.dataset && ch.dataset.__pf_disp !== undefined ? ch.dataset.__pf_disp : null;
                                    if (prev === null || prev === '') ch.style.removeProperty('display'); else ch.style.display = prev;
                                    try { delete ch.dataset.__pf_disp; } catch (e) {}
                                } catch (e) { /* ignore */ }
                            });
                        }
                    }
                } catch (e) { console.debug('[fullscreen] restore siblings failed', e); }
            }
        } catch (e) { console.debug('[fullscreen] style override failed', e); }
        // If there is a CodeMirror editor inside, refresh it so it resizes properly
        try {
            if (window.AppState && AppState.editor && typeof AppState.editor.refresh === 'function') {
                AppState.editor.refresh();
            }
        } catch (e) {}
        // If there are other components that need a resize, users can add refresh hooks here.
    }

    // Attach handlers to a single header element (used for existing and dynamically added headers)
    function attachHeaderHandlers(h) {
        if (!h || h.__pyinter_attached) return;
        h.__pyinter_attached = true;
        // Make the header visually draggable but ensure interactive children
        // (buttons, inputs, sliders, links) are not draggable so they behave
        // as expected and don't trigger header-level drag gestures.
        h.setAttribute('draggable', 'true');
        try {
            const interactiveSelector = 'button, a, input, select, textarea, .panel-actions, .icon-btn, .nav-btn, input[type="range"], .slider';
            const interactiveChildren = h.querySelectorAll && h.querySelectorAll(interactiveSelector);
            if (interactiveChildren && interactiveChildren.length) {
                interactiveChildren.forEach((ch) => {
                    try { ch.setAttribute && ch.setAttribute('draggable', 'false'); } catch (e) {}
                });
            }
        } catch (e) { /* non-fatal */ }

    // Sensitivity tunables (easy to adjust)
    const SHAKE_WINDOW = 1200; // ms window to analyze motion (wider)
    const MIN_CHANGES = 1;     // allow a single direction change to trigger (very permissive)
    const MIN_AMPLITUDE = 4;   // px minimum move to count as a change (small)
    const MAX_HISTORY = 36;    // keep more recent points
    const PRUNE_TIMEOUT = 3000; // ms to auto-clear

    let isDragging = false; // HTML5 drag lifecycle
    let pointerDown = false;
    let pointerId = null;
    let positions = [];
    let shakePruneTimer = null;

        function clearShakeState() {
            positions = [];
            if (shakePruneTimer) { clearTimeout(shakePruneTimer); shakePruneTimer = null; }
        }

        h.addEventListener('dragstart', (e) => {
            // If drag originated from an interactive control inside the header, ignore it
            if (e.target && e.target.closest && e.target.closest('.panel-actions, button, a, input, select, textarea, .icon-btn, .nav-btn, input[type="range"], .slider')) {
                e.preventDefault();
                return;
            }
            isDragging = true;
            const panel = h.closest('#variablesContainer') || h.closest('#outputContainer') || h.closest('.split-panel');
            if (!panel) return;
            window.__pyinter_draggingPanel = panel;
            try { e.dataTransfer.setData('text/plain', panel.id || ''); } catch (err) {}
            panel.classList.add('dragging');
            // Cancel any ongoing shake detection when a real drag begins
            pointerDown = false; pointerId = null; clearShakeState();
        });

        h.addEventListener('dragend', (e) => {
            isDragging = false;
            const panel = window.__pyinter_draggingPanel;
            if (panel) panel.classList.remove('dragging');
            window.__pyinter_draggingPanel = null;
            pointerDown = false; pointerId = null; clearShakeState();
        });

        // Hold-and-shake detection via pointer events:
        h.addEventListener('pointerdown', (e) => {
            // If pointerdown started on an interactive control, ignore so native
            // controls (buttons, sliders, inputs) behave normally and don't get
            // captured by the header gesture logic.
            if (e.target && e.target.closest && e.target.closest('.panel-actions, button, a, input, select, textarea, .icon-btn, .nav-btn, input[type="range"], .slider')) return;
            // Only consider primary button or touch
            if (e.button && e.button !== 0) return;
            if (isDragging) return;
            pointerDown = true; pointerId = e.pointerId;
            positions = [{ x: e.clientX, y: e.clientY, t: Date.now() }];
            try { h.setPointerCapture && h.setPointerCapture(pointerId); } catch (err) {}
            console.debug('[shake] pointerdown', { id: pointerId, x: e.clientX, y: e.clientY });
            // prune state after short timeout to avoid memory buildup
            shakePruneTimer = setTimeout(() => { clearShakeState(); }, PRUNE_TIMEOUT);
        });

        h.addEventListener('pointermove', (e) => {
            if (!pointerDown || e.pointerId !== pointerId) return;
            if (e.button && e.button !== 0) return;
            // Ignore pointerdown that starts on interactive controls inside the header
            if (e.target && e.target.closest && e.target.closest('.panel-actions, button, a, input, select, textarea, .icon-btn, .nav-btn')) return;
            // keep recent history small
            if (positions.length > MAX_HISTORY) positions.shift();

            // examine recent motion window
            const now = Date.now();
            const recent = positions.filter(p => now - p.t <= SHAKE_WINDOW);
            if (recent.length < 5) return; // need some movement

            // count rapid direction changes on X and Y axes (amplitude-aware)
            let changes = 0;
            for (let i = 2; i < recent.length; i++) {
                const dx1 = recent[i - 1].x - recent[i - 2].x;
                const dx2 = recent[i].x - recent[i - 1].x;
                if (Math.abs(dx1) > MIN_AMPLITUDE && Math.abs(dx2) > MIN_AMPLITUDE && (dx1 * dx2 < 0)) changes++;
                const dy1 = recent[i - 1].y - recent[i - 2].y;
                const dy2 = recent[i].y - recent[i - 1].y;
                if (Math.abs(dy1) > MIN_AMPLITUDE && Math.abs(dy2) > MIN_AMPLITUDE && (dy1 * dy2 < 0)) changes++;
            }

            // require MIN_CHANGES direction changes to consider it a shake
            console.debug('[shake] pointermove recentCount', recent.length, 'changes', changes);
            if (changes >= MIN_CHANGES) {
                // detach pointer capture and reset state
                try { h.releasePointerCapture && h.releasePointerCapture(pointerId); } catch (err) {}
                pointerDown = false; pointerId = null; clearShakeState();
                // Toggle fullscreen on the panel the header belongs to
                const panel = h.closest('#variablesContainer') || h.closest('#outputContainer') || h.closest('.split-panel');
                if (panel) togglePanelFullscreen(panel);
            }
        });

        // Quick fallback: double-click header to toggle fullscreen immediately
        // Restrict dblclick to only the empty area of the header (i.e. the
        // header element itself). This prevents clicks on buttons/controls
        // from toggling fullscreen.
        h.addEventListener('dblclick', (e) => {
            // avoid double-click accidentally triggering while dragging
            if (isDragging) return;
            // Only allow dblclick when the header element itself was the target
            // (not its child elements like .panel-actions, .panel-title, buttons)
            if (e.target !== h) return;
            const panel = h.closest('#variablesContainer') || h.closest('#outputContainer') || h.closest('.split-panel');
            if (panel) togglePanelFullscreen(panel);
        });

        h.addEventListener('pointerup', (e) => {
            if (e.pointerId === pointerId) {
                try { h.releasePointerCapture && h.releasePointerCapture(pointerId); } catch (err) {}
                pointerDown = false; pointerId = null; clearShakeState();
            }
        });

        h.addEventListener('pointercancel', (e) => {
            if (e.pointerId === pointerId) {
                try { h.releasePointerCapture && h.releasePointerCapture(pointerId); } catch (err) {}
                pointerDown = false; pointerId = null; clearShakeState();
            }
        });
    }

    function init() {
        // Make panel headers act as drag handles. This reduces accidental drags
        // from inner elements and ensures we always find the intended panel container.
        const headers = document.querySelectorAll('.panel-header');
        headers.forEach(h => attachHeaderHandlers(h));

        // Delegated dragover / drop on main container so nested children don't swallow events
        const container = document.querySelector('.main-container') || document.body;
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            const target = getDropTargetFrom(e.target);
            // visual highlight
            document.querySelectorAll('.drop-target').forEach(x => { if (x !== target) x.classList.remove('drop-target'); });
            if (target) target.classList.add('drop-target');
        });

        container.addEventListener('dragleave', function(e) {
            // remove highlights when leaving the main container
            if (!container.contains(e.relatedTarget)) {
                document.querySelectorAll('.drop-target').forEach(x => x.classList.remove('drop-target'));
            }
        });

        container.addEventListener('drop', function(e) {
            e.preventDefault();
            const target = getDropTargetFrom(e.target);
            const src = window.__pyinter_draggingPanel || document.getElementById((e.dataTransfer && e.dataTransfer.getData) ? e.dataTransfer.getData('text/plain') : '') || null;
            // if we couldn't identify source via dataTransfer, fall back to stored reference
            const srcPanel = src || window.__pyinter_draggingPanel;
            if (!srcPanel || !target || srcPanel === target) {
                document.querySelectorAll('.drop-target').forEach(x => x.classList.remove('drop-target'));
                return;
            }
            // call existing onDrop logic but using target as drop destination
            try { onDrop.call(target, e); } catch (err) { console.warn('delegated drop failed', err); }
        });

        // Observe for dynamically added panel headers and attach handlers
        const mo = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.addedNodes && m.addedNodes.length) {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType !== 1) return;
                        if (node.matches && node.matches('.panel-header')) {
                            // attach handlers to the newly added header
                            attachHeaderHandlers(node);
                        }
                        // attach to any panel-header inside added node
                        const inner = node.querySelectorAll && node.querySelectorAll('.panel-header');
                        if (inner && inner.length) inner.forEach(h => { attachHeaderHandlers(h); });
                    });
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('DOMContentLoaded', init);
})();

// Center nav search wiring
(function() {
    function initCenterSearch() {
        try {
            const input = document.getElementById('centerSearchInput');
            const clearBtn = document.getElementById('centerSearchClear');
            const resultsEl = document.getElementById('centerSearchResults');
            if (!input || !resultsEl) return;

            let timer = null;
            input.addEventListener('input', (e) => {
                const q = (e.target.value || '').trim();
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => performCenterSearch(q), 200);
            });

            clearBtn?.addEventListener('click', () => { input.value = ''; input.focus(); resultsEl.innerHTML = ''; resultsEl.classList.remove('active'); });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') { input.value = ''; resultsEl.innerHTML = ''; resultsEl.classList.remove('active'); input.blur(); }
                if (e.key === 'Enter') {
                    const first = resultsEl.querySelector('.result-item'); if (first) first.click();
                }
            });

            function performCenterSearch(q) {
                resultsEl.innerHTML = '';
                if (!q) { resultsEl.classList.remove('active'); return; }
                const nq = q.toLowerCase();
                const hits = [];

                // Search open tabs
                try {
                    if (window.Tabs && Array.isArray(Tabs.list)) {
                        for (const t of Tabs.list) {
                            if (t && t.name && t.name.toLowerCase().includes(nq)) hits.push({ type: 'file', title: t.name, tabId: t.id });
                        }
                    }
                } catch (e) { }

                // Search editor content (current)
                try {
                    if (AppState.editor && typeof AppState.editor.getValue === 'function') {
                        const txt = String(AppState.editor.getValue() || '');
                        const idx = txt.toLowerCase().indexOf(nq);
                        if (idx !== -1) {
                            const snippet = snippetFrom(txt, idx, nq.length);
                            hits.push({ type: 'code', title: AppState.currentFilename || 'Editor', snippet, index: idx });
                        }
                    }
                } catch (e) {}

                // Search output
                try {
                    const out = document.getElementById('outputConsole');
                    if (out) {
                        const txt = out.innerText || out.textContent || '';
                        const idx = txt.toLowerCase().indexOf(nq);
                        if (idx !== -1) hits.push({ type: 'output', title: 'Output', snippet: snippetFrom(txt, idx, nq.length), index: idx });
                    }
                } catch (e) {}

                // Search variables
                try {
                    const vars = document.getElementById('variablesContent');
                    if (vars) {
                        const txt = vars.innerText || vars.textContent || '';
                        const idx = txt.toLowerCase().indexOf(nq);
                        if (idx !== -1) hits.push({ type: 'variables', title: 'Variables', snippet: snippetFrom(txt, idx, nq.length), index: idx });
                    }
                } catch (e) {}

                // Search REPL history
                try {
                    if (AppState.replHistory && AppState.replHistory.length) {
                        for (let i = AppState.replHistory.length - 1; i >= 0; i--) {
                            const cmd = AppState.replHistory[i];
                            if (cmd && cmd.toLowerCase().includes(nq)) {
                                hits.push({ type: 'repl', title: 'REPL: ' + cmd.slice(0, 80), index: i });
                                if (hits.length > 40) break;
                            }
                        }
                    }
                } catch (e) {}

                renderCenterResults(hits, resultsEl);                
            }

            function snippetFrom(text, idx, len) {
                const start = Math.max(0, idx - 40); const end = Math.min(text.length, idx + len + 40);
                return text.substring(start, end).replace(/\n/g, ' ');
            }

            function renderCenterResults(items, container) {
                container.innerHTML = '';
                if (!items || !items.length) { const none = document.createElement('div'); none.className = 'result-item'; none.textContent = 'No results'; container.appendChild(none); container.classList.add('active'); return; }
                for (const it of items) {
                    const el = document.createElement('div'); el.className = 'result-item';
                    if (it.type === 'file') {
                        el.textContent = `File: ${it.title}`;
                        el.addEventListener('click', () => { try { if (it.tabId) loadTabContent(it.tabId); } catch (e){} container.classList.remove('active'); });
                    } else if (it.type === 'code') {
                        el.innerHTML = `<strong>${escapeHtml(it.title)}</strong><div style="font-size:12px;color:var(--text-secondary)">${escapeHtml(it.snippet)}</div>`;
                        el.addEventListener('click', () => { try { if (AppState.editor) { AppState.editor.focus(); const doc = AppState.editor.getDoc(); const pre = AppState.editor.getValue().slice(0, it.index); const line = pre.split('\n').length - 1; const ch = pre.split('\n').pop().length; AppState.editor.setCursor({line, ch}); AppState.editor.scrollIntoView({line, ch}, 80); } } catch(e){} container.classList.remove('active'); });
                    } else if (it.type === 'output') {
                        el.innerHTML = `<strong>Output</strong><div style="font-size:12px;color:var(--text-secondary)">${escapeHtml(it.snippet)}</div>`;
                        el.addEventListener('click', () => { try { const out = document.getElementById('outputConsole'); if (out) out.scrollTop = it.index; } catch(e){} container.classList.remove('active'); });
                    } else if (it.type === 'variables') {
                        el.innerHTML = `<strong>Variables</strong><div style="font-size:12px;color:var(--text-secondary)">${escapeHtml(it.snippet)}</div>`;
                        el.addEventListener('click', () => { try { const vars = document.getElementById('variablesContent'); if (vars) vars.scrollTop = it.index; } catch(e){} container.classList.remove('active'); });
                    } else if (it.type === 'repl') {
                        el.textContent = it.title;
                        el.addEventListener('click', () => { try { const repl = document.getElementById('replInput'); if (repl) { repl.value = AppState.replHistory[it.index]; repl.focus(); } } catch(e){} container.classList.remove('active'); });
                    }
                    container.appendChild(el);
                }
                container.classList.add('active');
            }

            function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

        } catch (e) { console.warn('center search init failed', e); }
    }

    document.addEventListener('DOMContentLoaded', initCenterSearch);
})();
