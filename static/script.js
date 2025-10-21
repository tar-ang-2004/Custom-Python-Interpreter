// Python Interpreter Web IDE - JavaScript Controller

// Initialize CodeMirror editor
let editor;

// Example code templates
const examples = {
    hello: `# Hello World Example
print("Hello, World!")
name = "Python User"
print(f"Nice to meet you, {name}!")

# Basic calculations
x = 10
y = 20
print(f"Sum: {x + y}")
print(f"Product: {x * y}")`,
    
    fibonacci: `# Fibonacci Sequence
def fibonacci(n):
    """Generate fibonacci sequence up to n terms"""
    a, b = 0, 1
    sequence = []
    for _ in range(n):
        sequence.append(a)
        a, b = b, a + b
    return sequence

# Generate first 15 fibonacci numbers
result = fibonacci(15)
print("Fibonacci sequence:", result)

# Calculate specific fibonacci number
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(f"10th fibonacci number: {fib(10)}")`,
    
    class: `# Class Example - Bank Account
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.transactions = []
    
    def deposit(self, amount):
        if amount > 0:
            self.balance += amount
            self.transactions.append(f"Deposit: +${amount}")
            return f"Deposited ${amount}. New balance: ${self.balance}"
        return "Invalid amount"
    
    def withdraw(self, amount):
        if amount > self.balance:
            return "Insufficient funds"
        if amount > 0:
            self.balance -= amount
            self.transactions.append(f"Withdrawal: -${amount}")
            return f"Withdrew ${amount}. New balance: ${self.balance}"
        return "Invalid amount"
    
    def get_statement(self):
        statement = f"Account holder: {self.owner}\\n"
        statement += f"Current balance: ${self.balance}\\n"
        statement += "Transactions:\\n"
        for transaction in self.transactions:
            statement += f"  - {transaction}\\n"
        return statement

# Create account and perform transactions
account = BankAccount("Alice", 1000)
print(account.deposit(500))
print(account.withdraw(200))
print(account.withdraw(50))
print("\\n" + account.get_statement())`,
    
    sorting: `# Sorting Algorithms
def bubble_sort(arr):
    """Bubble sort implementation"""
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(arr):
    """Quick sort implementation"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

# Test sorting algorithms
import random
test_data = [random.randint(1, 100) for _ in range(10)]
print(f"Original: {test_data}")
print(f"Bubble Sort: {bubble_sort(test_data.copy())}")
print(f"Quick Sort: {quick_sort(test_data.copy())}")`,
    
    comprehension: `# List Comprehensions and Generators
# List comprehension examples
squares = [x**2 for x in range(10)]
print("Squares:", squares)

evens = [x for x in range(20) if x % 2 == 0]
print("Even numbers:", evens)

# Nested comprehension
matrix = [[i * j for j in range(1, 6)] for i in range(1, 6)]
print("\\nMultiplication table:")
for row in matrix:
    print(row)

# Dictionary comprehension
word = "python"
char_count = {char: word.count(char) for char in set(word)}
print(f"\\nCharacter count in '{word}':", char_count)

# Set comprehension
unique_lengths = {len(word) for word in ["hello", "world", "python", "code", "hi"]}
print("Unique word lengths:", unique_lengths)

# Generator expression
gen = (x**2 for x in range(1000000))
print("\\nFirst 10 from generator:", [next(gen) for _ in range(10)])`,
    
    decorator: `# Decorators Example
import time
from functools import wraps

def timer(func):
    """Decorator to measure execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

def memoize(func):
    """Decorator to cache function results"""
    cache = {}
    @wraps(func)
    def wrapper(*args):
        if args in cache:
            print(f"Cache hit for {args}")
            return cache[args]
        print(f"Cache miss for {args}")
        result = func(*args)
        cache[args] = result
        return result
    return wrapper

@timer
@memoize
def fibonacci(n):
    """Calculate fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Test decorators
print("Calculating fibonacci(10):")
result = fibonacci(10)
print(f"Result: {result}\\n")

print("Calculating again (should use cache):")
result = fibonacci(10)
print(f"Result: {result}")`
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing...');
    try {
        initializeEditor();
        setupEventListeners();
        updateStatus('Ready');
        console.log('Initialization complete!');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing editor: ' + error.message);
    }
});

// Initialize CodeMirror editor
function initializeEditor() {
    console.log('Initializing CodeMirror editor...');
    const textarea = document.getElementById('codeEditor');
    if (!textarea) {
        throw new Error('Code editor textarea not found!');
    }
    
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: true,
        styleActiveLine: true,
        extraKeys: {
            "Ctrl-Enter": function() { runCode(); },
            "Ctrl-Space": "autocomplete"
        }
    });
    
    console.log('CodeMirror initialized successfully');
    
    // Update line count on change
    editor.on('change', function() {
        updateLineCount();
    });
    
    // Set initial example (without input())
    editor.setValue('# Hello World Example\nprint("Hello, World!")\nprint("Welcome to Python Interpreter!")');
    updateLineCount();
    console.log('Initial code set');
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Main buttons
    const runBtn = document.getElementById('runBtn');
    const validateBtn = document.getElementById('validateBtn');
    const clearEditorBtn = document.getElementById('clearEditorBtn');
    
    if (!runBtn || !validateBtn || !clearEditorBtn) {
        console.error('Button elements not found!');
        throw new Error('Required button elements not found');
    }
    
    runBtn.addEventListener('click', function() {
        console.log('Run button clicked');
        runCode();
    });
    validateBtn.addEventListener('click', function() {
        console.log('Validate button clicked');
        validateCode();
    });
    clearEditorBtn.addEventListener('click', function() {
        console.log('Clear editor button clicked');
        clearEditor();
    });
    
    document.getElementById('clearOutputBtn').addEventListener('click', clearOutput);
    document.getElementById('resetBtn').addEventListener('click', resetInterpreter);
    document.getElementById('downloadBtn').addEventListener('click', downloadCode);
    document.getElementById('clearReplBtn').addEventListener('click', clearRepl);
    document.getElementById('refreshVarsBtn').addEventListener('click', refreshVariables);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    
    // REPL input
    document.getElementById('replInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            executeReplLine();
        }
    });
    
    // File upload
    document.getElementById('fileUpload').addEventListener('change', handleFileUpload);
    
    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const example = this.getAttribute('data-example');
            if (examples[example]) {
                editor.setValue(examples[example]);
                updateStatus(`Loaded ${this.textContent} example`);
            }
        });
    });
    
    console.log('Event listeners set up successfully');
}

// Run code from editor
async function runCode() {
    console.log('runCode() called');
    const code = editor.getValue().trim();
    
    console.log('Code to execute:', code);
    
    if (!code) {
        showError('No code to execute');
        return;
    }
    
    updateStatus('Executing...');
    
    try {
        console.log('Sending POST request to /api/execute');
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code, mode: 'exec' })
        });
        
        console.log('Response received:', response.status);
        const result = await response.json();
        console.log('Result:', result);
        
        displayOutput(result);
        refreshVariables();
        addToHistory(result);
        
        if (result.success) {
            updateStatus('Execution completed successfully');
        } else {
            updateStatus('Execution failed');
        }
    } catch (error) {
        console.error('Error in runCode():', error);
        showError('Network error: ' + error.message);
        updateStatus('Error');
    }
}

// Execute single line in REPL
async function executeReplLine() {
    const input = document.getElementById('replInput');
    const line = input.value.trim();
    
    if (!line) return;
    
    // Display input in REPL
    addReplLine(`>>> ${line}`, 'input');
    input.value = '';
    
    try {
        const response = await fetch('/api/execute_line', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ line: line })
        });
        
        const result = await response.json();
        
        // Display output
        if (result.output) {
            addReplLine(result.output.trim(), 'output');
        }
        
        // Display error
        if (result.error) {
            addReplLine(result.error, 'error');
        }
        
        refreshVariables();
    } catch (error) {
        addReplLine('Error: ' + error.message, 'error');
    }
}

// Add line to REPL output
function addReplLine(text, type) {
    const replOutput = document.getElementById('replOutput');
    const line = document.createElement('div');
    line.className = `repl-line repl-${type}-line`;
    line.textContent = text;
    replOutput.appendChild(line);
    replOutput.scrollTop = replOutput.scrollHeight;
}

// Clear REPL
function clearRepl() {
    document.getElementById('replOutput').innerHTML = '';
}

// Validate code syntax
async function validateCode() {
    const code = editor.getValue().trim();
    
    if (!code) {
        showError('No code to validate');
        return;
    }
    
    updateStatus('Validating...');
    
    try {
        const response = await fetch('/api/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        });
        
        const result = await response.json();
        
        if (result.valid) {
            showSuccess('✓ Syntax is valid');
            updateStatus('Validation passed');
        } else {
            showError('✗ ' + result.error);
            updateStatus('Validation failed');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
        updateStatus('Error');
    }
}

// Display output
function displayOutput(result) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';
    
    if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'output-error';
        errorDiv.textContent = result.error;
        outputDiv.appendChild(errorDiv);
    }
    
    if (result.output) {
        const outputText = document.createElement('div');
        outputText.className = 'output-success';
        outputText.textContent = result.output;
        outputDiv.appendChild(outputText);
    }
    
    if (!result.error && !result.output) {
        outputDiv.innerHTML = '<div class="output-placeholder">Code executed successfully with no output</div>';
    }
    
    if (result.timestamp) {
        const timestamp = document.createElement('div');
        timestamp.className = 'output-timestamp';
        timestamp.textContent = `Executed at: ${new Date(result.timestamp).toLocaleString()}`;
        outputDiv.appendChild(timestamp);
    }
}

// Refresh variables display
async function refreshVariables() {
    try {
        const response = await fetch('/api/variables');
        const data = await response.json();
        
        const varsDiv = document.getElementById('variables');
        varsDiv.innerHTML = '';
        
        if (Object.keys(data.variables).length === 0) {
            varsDiv.innerHTML = '<div class="variables-placeholder">No variables defined</div>';
            return;
        }
        
        for (const [name, value] of Object.entries(data.variables)) {
            const varItem = document.createElement('div');
            varItem.className = 'variable-item';
            
            const varName = document.createElement('span');
            varName.className = 'variable-name';
            varName.textContent = name;
            
            const varValue = document.createElement('span');
            varValue.className = 'variable-value';
            varValue.textContent = value;
            varValue.title = value; // Show full value on hover
            
            varItem.appendChild(varName);
            varItem.appendChild(varValue);
            varsDiv.appendChild(varItem);
        }
    } catch (error) {
        console.error('Error refreshing variables:', error);
    }
}

// Add to history
function addToHistory(result) {
    const historyDiv = document.getElementById('history');
    
    // Remove placeholder
    const placeholder = historyDiv.querySelector('.history-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item ' + (result.success ? '' : 'error');
    
    const code = document.createElement('div');
    code.className = 'history-code';
    code.textContent = result.code.substring(0, 50) + (result.code.length > 50 ? '...' : '');
    
    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = new Date().toLocaleTimeString();
    
    historyItem.appendChild(code);
    historyItem.appendChild(time);
    
    // Click to load code
    historyItem.addEventListener('click', function() {
        editor.setValue(result.code);
        updateStatus('Loaded code from history');
    });
    
    historyDiv.insertBefore(historyItem, historyDiv.firstChild);
}

// Clear history
function clearHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '<div class="history-placeholder">Execution history will appear here</div>';
}

// Reset interpreter
async function resetInterpreter() {
    if (!confirm('Reset interpreter? This will clear all variables and history.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/reset', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            clearOutput();
            clearRepl();
            clearHistory();
            document.getElementById('variables').innerHTML = '<div class="variables-placeholder">No variables defined</div>';
            showSuccess('Interpreter reset successfully');
            updateStatus('Reset complete');
        }
    } catch (error) {
        showError('Error resetting interpreter: ' + error.message);
    }
}

// Clear editor
function clearEditor() {
    if (confirm('Clear editor content?')) {
        editor.setValue('');
        updateStatus('Editor cleared');
    }
}

// Clear output
function clearOutput() {
    document.getElementById('output').innerHTML = '<div class="output-placeholder">Output will appear here...</div>';
}

// Download code
function downloadCode() {
    const code = editor.getValue();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.py';
    a.click();
    URL.revokeObjectURL(url);
    updateStatus('Code downloaded');
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        editor.setValue(e.target.result);
        updateStatus(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
}

// Update status bar
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Update line count
function updateLineCount() {
    const lineCount = editor.lineCount();
    document.getElementById('lineCount').textContent = `Lines: ${lineCount}`;
}

// Show success message
function showSuccess(message) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = `<div class="output-success">${message}</div>`;
}

// Show error message
function showError(message) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = `<div class="output-error">${message}</div>`;
}
