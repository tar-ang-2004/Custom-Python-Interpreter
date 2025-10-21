"""
Python Interpreter - A comprehensive interpreter for Python code
Supports variables, functions, classes, control flow, and more
"""

import ast
import sys
import io
import traceback
from typing import Any, Dict, Optional
import builtins
import time
import json
from datetime import datetime
import pprint
import re

# Ensure pandas console display shows full DataFrame content (no truncation)
try:
    import pandas as pd
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    pd.set_option('display.max_colwidth', None)
    pd.set_option('display.max_rows', None)
    pd.set_option('display.expand_frame_repr', False)
except Exception:
    # pandas may not be installed or needed; ignore if import fails
    pd = None


class PythonInterpreter:
    """
    A Python interpreter that can execute Python code with proper scope management,
    error handling, and output capturing.
    """
    
    def __init__(self):
        """Initialize the interpreter with a clean global namespace."""
        self.global_namespace = {
            '__builtins__': builtins,
            '__name__': '__main__',
            '__doc__': None,
        }
        self.local_namespace = {}
        self.output_buffer = io.StringIO()
        self.error_buffer = io.StringIO()
        self.execution_history = []
        self.input_values = []  # Queue of input values to use
        self.input_prompts = []  # Track prompts asked
        self.waiting_for_input = False  # Track if execution is waiting for input
        self.current_input_prompt = ""  # Current input prompt text
        self.pending_code = ""  # Code that's waiting for input to continue
        self.magic_commands = self._init_magic_commands()  # Magic command registry
        # Buffer where plt.show() captured figures will be stored as dicts
        self._show_capture_buffer = []
        # Flags and holders for wrapping plt.show()
        self._plt_show_installed = False
        self._orig_plt_show = None
        
    def reset(self):
        """Reset the interpreter to initial state."""
        self.__init__()
    
    def _init_magic_commands(self):
        """Initialize magic command registry."""
        return {
            '%time': self._magic_time,
            '%timeit': self._magic_timeit,
            '%clear': self._magic_clear,
            '%vars': self._magic_vars,
            '%reset': self._magic_reset,
            '%help': self._magic_help,
            '%history': self._magic_history,
            '%save': self._magic_save,
            '%load': self._magic_load,
            '%who': self._magic_who,
            '%whos': self._magic_whos,
            '%delete': self._magic_delete,
            '%pprint': self._magic_pprint,
            '%json': self._magic_json,
            '%table': self._magic_table,
        }
    
    def _is_magic_command(self, code: str) -> bool:
        """Check if code is a magic command."""
        return code.strip().startswith('%')
    
    def _execute_magic_command(self, code: str) -> Dict[str, Any]:
        """Execute a magic command."""
        code = code.strip()
        parts = code.split(maxsplit=1)
        command = parts[0]
        args = parts[1] if len(parts) > 1 else ''
        
        if command in self.magic_commands:
            try:
                return self.magic_commands[command](args)
            except Exception as e:
                return {
                    'success': False,
                    'output': '',
                    'error': f'Magic command error: {str(e)}',
                    'result': None,
                    'variables': {},
                    'is_magic': True
                }
        else:
            return {
                'success': False,
                'output': '',
                'error': f'Unknown magic command: {command}. Type %help for available commands.',
                'result': None,
                'variables': {},
                'is_magic': True
            }
    
    # Magic Command Implementations
    
    def _magic_time(self, args: str) -> Dict[str, Any]:
        """Time the execution of code."""
        if not args:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %time <code>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        start_time = time.time()
        result = self.execute(args)
        end_time = time.time()
        execution_time = end_time - start_time
        
        result['output'] = f"⏱️ Execution time: {execution_time:.6f} seconds\n\n" + result['output']
        result['is_magic'] = True
        result['execution_time'] = execution_time
        return result
    
    def _magic_timeit(self, args: str) -> Dict[str, Any]:
        """Time code execution multiple times for accuracy."""
        if not args:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %timeit <code>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        # Run 3 times and take average
        iterations = 3
        times = []
        for _ in range(iterations):
            start_time = time.time()
            self.execute(args)
            end_time = time.time()
            times.append(end_time - start_time)
        
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        output = f"""⏱️ Execution statistics ({iterations} runs):
  Average: {avg_time:.6f} seconds
  Fastest: {min_time:.6f} seconds
  Slowest: {max_time:.6f} seconds"""
        
        return {
            'success': True,
            'output': output,
            'error': '',
            'result': None,
            'variables': self.get_all_variables(),
            'is_magic': True
        }
    
    def _magic_clear(self, args: str) -> Dict[str, Any]:
        """Clear output (instruction for frontend)."""
        return {
            'success': True,
            'output': '',
            'error': '',
            'result': None,
            'variables': {},
            'is_magic': True,
            'clear_output': True
        }
    
    def _magic_vars(self, args: str) -> Dict[str, Any]:
        """List all variables."""
        vars_dict = self.get_all_variables()
        if not vars_dict:
            output = "No variables defined."
        else:
            output = "📋 Variables:\n" + "\n".join([f"  {k} = {v}" for k, v in vars_dict.items()])
        
        return {
            'success': True,
            'output': output,
            'error': '',
            'result': None,
            'variables': vars_dict,
            'is_magic': True
        }
    
    def _magic_reset(self, args: str) -> Dict[str, Any]:
        """Reset the interpreter."""
        self.reset()
        return {
            'success': True,
            'output': '🔄 Interpreter reset complete. All variables cleared.',
            'error': '',
            'result': None,
            'variables': {},
            'is_magic': True
        }
    
    def _magic_help(self, args: str) -> Dict[str, Any]:
        """Show help for magic commands."""
        help_text = """
🪄 Magic Commands Available:

📊 Timing & Performance:
  %time <code>      - Time code execution once
  %timeit <code>    - Time code execution multiple times for accuracy

🔍 Variable Management:
  %vars             - List all variables with values
  %who              - List all variable names
  %whos             - Detailed variable information (type, size)
  %delete <var>     - Delete a specific variable

🎨 Output Formatting:
  %pprint <expr>    - Pretty print any Python object
  %json <expr>      - Format as JSON with syntax highlighting
  %table <list>     - Format list of dicts as a table

🗂️ Session Management:
  %history          - Show execution history
  %save <file>      - Save session to file
  %load <file>      - Load and execute Python file
  %reset            - Reset interpreter (clear all variables)

🧹 Utility:
  %clear            - Clear output screen
  %help             - Show this help message

📝 Usage Examples:
  %time sum(range(1000000))
  %json {"name": "Alice", "age": 30}
  %table [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]
  %pprint my_dict
  %vars
  %delete x
  %save my_session.py
"""
        return {
            'success': True,
            'output': help_text,
            'error': '',
            'result': None,
            'variables': {},
            'is_magic': True
        }
    
    def _magic_history(self, args: str) -> Dict[str, Any]:
        """Show execution history."""
        if not self.execution_history:
            output = "No execution history yet."
        else:
            output = "📜 Execution History:\n\n"
            for i, item in enumerate(self.execution_history[-10:], 1):  # Last 10
                code = item.get('code', '').strip()
                success = item.get('success', False)
                status = "✓" if success else "✗"
                output += f"{i}. {status} {code[:60]}{'...' if len(code) > 60 else ''}\n"
        
        return {
            'success': True,
            'output': output,
            'error': '',
            'result': None,
            'variables': {},
            'is_magic': True
        }
    
    def _magic_save(self, args: str) -> Dict[str, Any]:
        """Save session to file."""
        filename = args.strip() or f'session_{datetime.now().strftime("%Y%m%d_%H%M%S")}.py'
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(f"# Python Interpreter Session\n")
                f.write(f"# Saved: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                for item in self.execution_history:
                    if item.get('success') and item.get('code'):
                        f.write(f"{item['code']}\n\n")
            
            return {
                'success': True,
                'output': f'💾 Session saved to: {filename}',
                'error': '',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        except Exception as e:
            return {
                'success': False,
                'output': '',
                'error': f'Failed to save session: {str(e)}',
                'result': None,
                'variables': {},
                'is_magic': True
            }
    
    def _magic_load(self, args: str) -> Dict[str, Any]:
        """Load and execute Python file."""
        filename = args.strip()
        if not filename:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %load <filename>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                code = f.read()
            
            result = self.execute(code)
            result['output'] = f"📂 Loaded and executed: {filename}\n\n" + result['output']
            result['is_magic'] = True
            return result
        except FileNotFoundError:
            return {
                'success': False,
                'output': '',
                'error': f'File not found: {filename}',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        except Exception as e:
            return {
                'success': False,
                'output': '',
                'error': f'Failed to load file: {str(e)}',
                'result': None,
                'variables': {},
                'is_magic': True
            }
    
    def _magic_who(self, args: str) -> Dict[str, Any]:
        """List all variable names."""
        vars_dict = self.get_all_variables()
        if not vars_dict:
            output = "No variables defined."
        else:
            output = "Variables: " + ", ".join(sorted(vars_dict.keys()))
        
        return {
            'success': True,
            'output': output,
            'error': '',
            'result': None,
            'variables': vars_dict,
            'is_magic': True
        }
    
    def _magic_whos(self, args: str) -> Dict[str, Any]:
        """Show detailed variable information."""
        vars_dict = self.get_all_variables()
        if not vars_dict:
            output = "No variables defined."
        else:
            output = "Variable            Type            Value\n"
            output += "─" * 60 + "\n"
            for name, value in sorted(vars_dict.items()):
                var_type = type(eval(value) if value != 'None' else None).__name__
                value_str = value[:30] + "..." if len(value) > 30 else value
                output += f"{name:18} {var_type:15} {value_str}\n"
        
        return {
            'success': True,
            'output': output,
            'error': '',
            'result': None,
            'variables': vars_dict,
            'is_magic': True
        }
    
    def _magic_delete(self, args: str) -> Dict[str, Any]:
        """Delete a variable."""
        var_name = args.strip()
        if not var_name:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %delete <variable_name>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        if var_name in self.global_namespace:
            del self.global_namespace[var_name]
            output = f"🗑️ Deleted variable: {var_name}"
            success = True
        elif var_name in self.local_namespace:
            del self.local_namespace[var_name]
            output = f"🗑️ Deleted variable: {var_name}"
            success = True
        else:
            output = ""
            success = False
            error = f"Variable '{var_name}' not found"
        
        return {
            'success': success,
            'output': output if success else '',
            'error': '' if success else error,
            'result': None,
            'variables': self.get_all_variables(),
            'is_magic': True
        }
    
    def _magic_pprint(self, args: str) -> Dict[str, Any]:
        """Pretty print a variable or expression."""
        if not args:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %pprint <variable or expression>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        try:
            # Evaluate the expression
            value = eval(args, self.global_namespace, self.local_namespace)
            formatted = pprint.pformat(value, width=80, compact=False, indent=2)
            
            return {
                'success': True,
                'output': formatted,
                'error': '',
                'result': None,
                'variables': self.get_all_variables(),
                'is_magic': True
            }
        except Exception as e:
            return {
                'success': False,
                'output': '',
                'error': f'Error: {str(e)}',
                'result': None,
                'variables': {},
                'is_magic': True
            }
    
    def _magic_json(self, args: str) -> Dict[str, Any]:
        """Format variable as JSON."""
        if not args:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %json <variable or expression>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        try:
            # Evaluate the expression
            value = eval(args, self.global_namespace, self.local_namespace)
            formatted = json.dumps(value, indent=2, default=str, ensure_ascii=False)
            
            return {
                'success': True,
                'output': formatted,
                'error': '',
                'result': None,
                'variables': self.get_all_variables(),
                'is_magic': True,
                'format_type': 'json'
            }
        except Exception as e:
            return {
                'success': False,
                'output': '',
                'error': f'Error: {str(e)}',
                'result': None,
                'variables': {},
                'is_magic': True
            }
    
    def _magic_table(self, args: str) -> Dict[str, Any]:
        """Format list of dicts as a table."""
        if not args:
            return {
                'success': False,
                'output': '',
                'error': 'Usage: %table <variable containing list of dicts>',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
        try:
            # Evaluate the expression
            value = eval(args, self.global_namespace, self.local_namespace)
            
            if not isinstance(value, (list, tuple)):
                return {
                    'success': False,
                    'output': '',
                    'error': 'Value must be a list or tuple',
                    'result': None,
                    'variables': {},
                    'is_magic': True
                }
            
            formatted = self._format_table(value)
            
            return {
                'success': True,
                'output': formatted,
                'error': '',
                'result': None,
                'variables': self.get_all_variables(),
                'is_magic': True,
                'format_type': 'table'
            }
        except Exception as e:
            return {
                'success': False,
                'output': '',
                'error': f'Error: {str(e)}',
                'result': None,
                'variables': {},
                'is_magic': True
            }
        
    def capture_output(self, func):
        """Decorator to capture stdout and stderr."""
        def wrapper(*args, **kwargs):
            old_stdout = sys.stdout
            old_stderr = sys.stderr
            
            try:
                sys.stdout = self.output_buffer
                sys.stderr = self.error_buffer
                result = func(*args, **kwargs)
                return result
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr
                
        return wrapper
    
    def mock_input(self, prompt=''):
        """
        Mock input function that uses pre-provided values or raises an error.
        """
        # Store prompt for tracking
        if prompt:
            self.input_prompts.append(prompt)
        
        if self.input_values:
            # We have pre-provided values, use them
            value = self.input_values.pop(0)
            # Do not print prompt/value here. Frontends or callers should
            # control display of prompts to avoid duplicate echoing.
            return str(value)
        else:
            # No values provided - request input from frontend
            # DON'T print the prompt here - it will be shown in the UI
            self.waiting_for_input = True
            self.current_input_prompt = prompt if prompt else "Enter input: "
            raise RuntimeError(
                f"INPUT_REQUIRED:{self.current_input_prompt}"
            )
    
    def set_input_values(self, values: list):
        """Set the input values to be used by input() calls."""
        self.input_values = values.copy()
        self.input_prompts = []
        self.waiting_for_input = False
    
    def provide_input(self, value: str) -> Dict[str, Any]:
        """
        Provide input value and continue execution.
        
        Args:
            value: The input value to provide
            
        Returns:
            Execution result dictionary
        """
        if not self.pending_code:
            return {
                'success': False,
                'error': 'No pending code execution waiting for input',
                'output': '',
                'result': None,
                'variables': {}
            }
        
        # Add the input value
        self.input_values.append(value)
        self.waiting_for_input = False
        
        # Continue execution with the pending code
        code = self.pending_code
        self.pending_code = ""
        
        return self.execute(code)
    
    def validate_syntax(self, code: str) -> tuple[bool, Optional[str]]:
        """
        Validate Python syntax without executing.
        
        Args:
            code: Python code string to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            ast.parse(code)
            return True, None
        except SyntaxError as e:
            error_msg = f"Syntax Error at line {e.lineno}: {e.msg}"
            return False, error_msg
        except Exception as e:
            return False, str(e)

    def _configure_matplotlib_backend(self):
        """
        Ensure matplotlib uses a non-interactive backend (Agg).
        This avoids GUI backends that try to set wakeup file descriptors
        which fail when code runs in a background thread (ValueError).
        Safe no-op if matplotlib is not installed.
        """
        try:
            # Prefer environment variable first for processes that check it early
            import os
            os.environ.setdefault('MPLBACKEND', 'Agg')

            # Import matplotlib and force the Agg backend. Use force=True to
            # ensure backend switch even if a backend was selected earlier.
            import importlib, sys
            try:
                import matplotlib
                try:
                    matplotlib.use('Agg', force=True)
                except Exception:
                    # Some matplotlib versions may raise when changing backend;
                    # ignore and continue — Agg will be used where possible.
                    pass

                # If pyplot was already imported, try to switch its backend safely.
                if 'matplotlib.pyplot' in sys.modules:
                    try:
                        plt = importlib.reload(sys.modules['matplotlib.pyplot'])
                        try:
                            plt.switch_backend('Agg')
                        except Exception:
                            # switch_backend may not be available for some builds
                            pass

                        # Install a wrapper for plt.show() so we capture figures
                        # into self._show_capture_buffer when user calls plt.show()
                        try:
                            if not getattr(self, '_plt_show_installed', False):
                                orig_show = getattr(plt, 'show', None)

                                def _capturing_show(*args, **kwargs):
                                    try:
                                        figs = self._capture_matplotlib_figures()
                                        if figs:
                                            # append captured figures to the buffer
                                            self._show_capture_buffer.extend(figs)
                                    except Exception:
                                        pass
                                    # Do not call original show to avoid GUI attempts
                                    return None

                                plt.show = _capturing_show
                                self._orig_plt_show = orig_show
                                self._plt_show_installed = True
                        except Exception:
                            # ignore failures to wrap show
                            pass
                    except Exception:
                        # ignore reload failures
                        pass
            except Exception:
                # matplotlib not installed or other import error — ignore
                pass
        except Exception:
            # defensive: never raise from backend configuration
            pass

    def _capture_matplotlib_figures(self) -> list:
        """
        Capture any open matplotlib figures as PNG base64 strings.
        Returns a list of dicts: { 'mime': 'image/png', 'data': '<base64>' }
        Safe no-op if matplotlib is not available.
        """
        figs = []
        try:
            import io, base64, sys
            # Import pyplot if available
            if 'matplotlib' not in sys.modules:
                try:
                    import matplotlib
                except Exception:
                    return figs

            # Try to import pyplot and work with current figures
            try:
                import matplotlib.pyplot as plt
            except Exception:
                return figs

            # Get current figure numbers
            try:
                fnums = plt.get_fignums()
            except Exception:
                fnums = []

            for num in fnums:
                try:
                    fig = plt.figure(num)
                    buf = io.BytesIO()
                    # Save as PNG into buffer using Agg backend
                    fig.savefig(buf, format='png', bbox_inches='tight')
                    buf.seek(0)
                    b64 = base64.b64encode(buf.read()).decode('ascii')
                    figs.append({'mime': 'image/png', 'data': b64})
                    buf.close()
                except Exception:
                    # Ignore figure capture errors and continue
                    continue

            # Close all figures to free memory (we captured them already)
            try:
                plt.close('all')
            except Exception:
                pass

        except Exception:
            # defensive: never raise
            return figs

        return figs
    
    def execute(self, code: str, mode: str = 'exec') -> Dict[str, Any]:
        """
        Execute Python code and return results.
        
        Args:
            code: Python code to execute
            mode: Execution mode ('exec', 'eval', or 'single')
            
        Returns:
            Dictionary containing:
                - success: Boolean indicating if execution was successful
                - output: Captured stdout output
                - error: Error message if any
                - result: Return value (for eval mode)
                - variables: Current variables in namespace
                - is_magic: True if this was a magic command
        """
        # Ensure plotting uses a safe non-interactive backend
        try:
            self._configure_matplotlib_backend()
        except Exception:
            pass

        # Check if this is a magic command
        if self._is_magic_command(code):
            return self._execute_magic_command(code)
        
        # Clear buffers
        self.output_buffer = io.StringIO()
        self.error_buffer = io.StringIO()
        
        result = {
            'success': False,
            'output': '',
            'error': '',
            'result': None,
            'variables': {},
            'code': code
        }
        
        # Validate syntax first
        is_valid, syntax_error = self.validate_syntax(code)
        if not is_valid:
            result['error'] = syntax_error
            return result
        
        # Execute the code
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        old_input = builtins.input  # Save original input
        
        try:
            sys.stdout = self.output_buffer
            sys.stderr = self.error_buffer
            builtins.input = self.mock_input  # Replace input with our mock
            
            # Use a single unified namespace for globals and locals when
            # executing/evaluating code. This ensures that imports and
            # definitions at module level are visible to functions defined
            # within the same executed block (avoids NameError for names
            # that would otherwise end up only in the locals dict).
            ns = self.global_namespace
            if mode == 'eval':
                # Evaluate expression and return result
                exec_result = eval(code, ns, ns)
                result['result'] = exec_result
            else:
                # Execute statements
                exec(code, ns, ns)
            
            result['success'] = True
            result['output'] = self.output_buffer.getvalue()
            
            # Capture current variables (excluding builtins and private vars)
            result['variables'] = {
                k: self._serialize_value(v) 
                for k, v in {**self.global_namespace, **self.local_namespace}.items()
                if not k.startswith('__') and k != '__builtins__'
            }
            
        except Exception as e:
            error_msg = str(e)
            
            # Check if this is an input request
            if error_msg.startswith("INPUT_REQUIRED:"):
                prompt = error_msg.replace("INPUT_REQUIRED:", "")
                self.pending_code = code  # Store the code for retry
                result['error'] = ''
                result['output'] = self.output_buffer.getvalue()
                result['input_required'] = True
                result['input_prompt'] = prompt
                return result
            
            result['error'] = self._format_exception(e)
            result['output'] = self.output_buffer.getvalue()
            
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr
            builtins.input = old_input  # Restore original input
            
        # Add to history
        self.execution_history.append(result)
        # Capture any matplotlib figures (PNG base64) and include in result
        try:
            figures = self._capture_matplotlib_figures()
            if figures:
                result['figures'] = figures
        except Exception:
            # don't let capture errors affect execution result
            pass
        
        return result
    
    def execute_line(self, line: str) -> Dict[str, Any]:
        """
        Execute a single line of Python code (REPL-style).
        Automatically determines if it's an expression or statement.
        
        Args:
            line: Single line of Python code
            
        Returns:
            Execution result dictionary
        """
        line = line.strip()
        
        if not line:
            return {
                'success': True,
                'output': '',
                'error': '',
                'result': None,
                'variables': {},
                'code': line
            }
        
        # Try to execute as expression first (to get return value)
        try:
            ast.parse(line, mode='eval')
            result = self.execute(line, mode='eval')
            if result['success'] and result['result'] is not None:
                result['output'] = str(result['result']) + '\n' + result['output']
            return result
        except SyntaxError:
            # Not an expression, execute as statement
            return self.execute(line, mode='exec')
    
    def _format_exception(self, exception: Exception) -> str:
        """Format exception with traceback."""
        exc_type, exc_value, exc_traceback = sys.exc_info()
        
        # Get the traceback without system frames
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        
        # Filter out interpreter internal frames
        filtered_lines = []
        skip_next = False
        for line in tb_lines:
            if 'python_interpreter.py' in line:
                skip_next = True
                continue
            if skip_next and line.startswith('  '):
                skip_next = False
                continue
            filtered_lines.append(line)
        
        return ''.join(filtered_lines)
    
    def _format_output(self, value: Any) -> str:
        """
        Format output with enhanced pretty-printing for complex data structures.
        """
        if value is None:
            return ''
        
        # Check if it's a pandas DataFrame
        if hasattr(value, 'to_string') and 'DataFrame' in str(type(value)):
            return value.to_string()
        
        # Check if it's a dict - pretty print JSON-style
        if isinstance(value, dict):
            return self._format_dict(value)
        
        # Check if it's a list or tuple with dicts
        if isinstance(value, (list, tuple)) and len(value) > 0 and isinstance(value[0], dict):
            return self._format_table(value)
        
        # Check if it's a complex structure
        if isinstance(value, (list, tuple, set)) and len(str(value)) > 80:
            return pprint.pformat(value, width=80, compact=False)
        
        return str(value)
    
    def _format_dict(self, d: dict, indent: int = 0) -> str:
        """Format dictionary as pretty JSON."""
        try:
            return json.dumps(d, indent=2, default=str, ensure_ascii=False)
        except:
            return pprint.pformat(d, width=80)
    
    def _format_table(self, data: list) -> str:
        """Format list of dicts as a table."""
        if not data:
            return '[]'
        
        # Get all keys
        keys = set()
        for item in data:
            if isinstance(item, dict):
                keys.update(item.keys())
        keys = sorted(keys)
        
        if not keys:
            return str(data)
        
        # Calculate column widths
        col_widths = {k: len(str(k)) for k in keys}
        for item in data:
            for key in keys:
                if key in item:
                    col_widths[key] = max(col_widths[key], len(str(item[key])))
        
        # Build table
        lines = []
        
        # Header
        header = ' | '.join(str(k).ljust(col_widths[k]) for k in keys)
        lines.append(header)
        lines.append('-' * len(header))
        
        # Rows
        for item in data:
            row = ' | '.join(str(item.get(k, '')).ljust(col_widths[k]) for k in keys)
            lines.append(row)
        
        return '\n'.join(lines)
    
    def _serialize_value(self, value: Any) -> str:
        """Convert a value to a string representation."""
        try:
            # Handle common types
            if isinstance(value, (int, float, str, bool, type(None))):
                return repr(value)
            elif isinstance(value, (list, tuple, set)):
                return repr(value)
            elif isinstance(value, dict):
                return repr(value)
            elif callable(value):
                return f"<function {getattr(value, '__name__', 'unknown')}>"
            elif hasattr(value, '__class__'):
                return f"<{value.__class__.__name__} object>"
            else:
                return str(value)
        except:
            return "<unserializable object>"
    
    def get_variable(self, name: str) -> Optional[Any]:
        """Get the value of a variable from namespace."""
        if name in self.local_namespace:
            return self.local_namespace[name]
        elif name in self.global_namespace:
            return self.global_namespace[name]
        return None
    
    def set_variable(self, name: str, value: Any):
        """Set a variable in the global namespace."""
        self.global_namespace[name] = value
    
    def get_all_variables(self) -> Dict[str, Any]:
        """Get all variables in the current namespace."""
        return {
            k: v for k, v in {**self.global_namespace, **self.local_namespace}.items()
            if not k.startswith('__') and k != '__builtins__'
        }
    
    def get_history(self) -> list:
        """Get execution history."""
        return self.execution_history
    
    def clear_history(self):
        """Clear execution history."""
        self.execution_history = []


# Demo usage
if __name__ == "__main__":
    print("=" * 60)
    print("Python Interpreter Demo")
    print("=" * 60)
    
    interpreter = PythonInterpreter()
    
    # Test 1: Simple expressions
    print("\n1. Simple Expression:")
    result = interpreter.execute("2 + 2")
    print(f"Code: 2 + 2")
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    
    # Test 2: Variable assignment
    print("\n2. Variable Assignment:")
    result = interpreter.execute("x = 10\ny = 20\nz = x + y")
    print(f"Code: x = 10; y = 20; z = x + y")
    print(f"Success: {result['success']}")
    print(f"Variables: {result['variables']}")
    
    # Test 3: Print statement
    print("\n3. Print Statement:")
    result = interpreter.execute("print('Hello, World!')")
    print(f"Code: print('Hello, World!')")
    print(f"Output: {result['output']}")
    
    # Test 4: Function definition and call
    print("\n4. Function Definition:")
    code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
"""
    result = interpreter.execute(code)
    print("Code: fibonacci function")
    print(f"Success: {result['success']}")
    print(f"Output:\n{result['output']}")
    
    # Test 5: Class definition
    print("\n5. Class Definition:")
    code = """
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hi, I'm {self.name} and I'm {self.age} years old"

person = Person("Alice", 30)
print(person.greet())
"""
    result = interpreter.execute(code)
    print("Code: Person class")
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    
    # Test 6: Error handling
    print("\n6. Error Handling:")
    result = interpreter.execute("x = 1 / 0")
    print(f"Code: x = 1 / 0")
    print(f"Success: {result['success']}")
    print(f"Error: {result['error']}")
    
    # Test 7: List comprehension
    print("\n7. List Comprehension:")
    result = interpreter.execute("squares = [x**2 for x in range(10)]\nprint(squares)")
    print(f"Code: List comprehension")
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    
    # Test 8: REPL-style line execution
    print("\n8. REPL-style Execution:")
    repl_commands = [
        "a = 5",
        "b = 10",
        "a + b",
        "print(f'a={a}, b={b}, sum={a+b}')",
    ]
    
    for cmd in repl_commands:
        result = interpreter.execute_line(cmd)
        print(f">>> {cmd}")
        if result['output']:
            print(result['output'].rstrip())
    
    print("\n" + "=" * 60)
    print("Demo Complete!")
    print("=" * 60)
