"""
Diagnostic Script - Check Python Interpreter Setup
Run this to verify everything is configured correctly
"""

import os
import sys

def check_files():
    """Check if all required files exist"""
    print("=" * 70)
    print("CHECKING FILES")
    print("=" * 70)
    
    required_files = [
        'app.py',
        'python_interpreter.py',
        'requirements.txt',
        'templates/index.html',
        'templates/test.html',
        'static/script.js',
        'static/style.css',
    ]
    
    all_good = True
    for file in required_files:
        exists = os.path.exists(file)
        status = "✓" if exists else "✗"
        print(f"{status} {file}")
        if not exists:
            all_good = False
    
    return all_good

def check_imports():
    """Check if required modules can be imported"""
    print("\n" + "=" * 70)
    print("CHECKING IMPORTS")
    print("=" * 70)
    
    modules = {
        'Flask': 'flask',
        'Python Interpreter': 'python_interpreter',
    }
    
    all_good = True
    for name, module in modules.items():
        try:
            __import__(module)
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            all_good = False
    
    return all_good

def check_interpreter():
    """Test the interpreter functionality"""
    print("\n" + "=" * 70)
    print("TESTING INTERPRETER")
    print("=" * 70)
    
    try:
        from python_interpreter import PythonInterpreter
        interpreter = PythonInterpreter()
        
        # Test 1: Simple execution
        result = interpreter.execute("x = 5 + 3")
        if result['success'] and interpreter.get_variable('x') == 8:
            print("✓ Basic execution works")
        else:
            print("✗ Basic execution failed")
            return False
        
        # Test 2: Print statement
        result = interpreter.execute("print('Test')")
        if result['success'] and 'Test' in result['output']:
            print("✓ Print statement works")
        else:
            print("✗ Print statement failed")
            return False
        
        # Test 3: Error handling
        result = interpreter.execute("1 / 0")
        if not result['success'] and 'ZeroDivisionError' in result['error']:
            print("✓ Error handling works")
        else:
            print("✗ Error handling failed")
            return False
        
        print("✓ All interpreter tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Interpreter test failed: {e}")
        return False

def check_flask():
    """Check if Flask app can start"""
    print("\n" + "=" * 70)
    print("CHECKING FLASK APP")
    print("=" * 70)
    
    try:
        from app import app
        print("✓ Flask app imports successfully")
        
        # Check routes
        routes = [rule.rule for rule in app.url_map.iter_rules()]
        expected_routes = ['/', '/test', '/api/execute', '/api/validate', '/api/variables']
        
        for route in expected_routes:
            if route in routes:
                print(f"✓ Route {route} exists")
            else:
                print(f"✗ Route {route} missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ Flask app check failed: {e}")
        return False

def check_server_running():
    """Check if server is running"""
    print("\n" + "=" * 70)
    print("CHECKING SERVER STATUS")
    print("=" * 70)
    
    try:
        import urllib.request
        
        try:
            response = urllib.request.urlopen('http://localhost:5000/health', timeout=2)
            data = response.read().decode('utf-8')
            print("✓ Server is running on http://localhost:5000")
            print(f"  Response: {data}")
            return True
        except urllib.error.URLError:
            print("✗ Server is not running")
            print("  Start server with: python app.py")
            return False
            
    except Exception as e:
        print(f"✗ Server check failed: {e}")
        return False

def main():
    """Run all diagnostics"""
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 15 + "PYTHON INTERPRETER DIAGNOSTICS" + " " * 22 + "║")
    print("╚" + "=" * 68 + "╝")
    print()
    
    results = {
        'Files': check_files(),
        'Imports': check_imports(),
        'Interpreter': check_interpreter(),
        'Flask App': check_flask(),
        'Server': check_server_running(),
    }
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    for test, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✓ ALL CHECKS PASSED!")
        print("=" * 70)
        print("\nYour Python Interpreter is ready to use!")
        print("Open your browser: http://localhost:5000")
    else:
        print("✗ SOME CHECKS FAILED")
        print("=" * 70)
        print("\nPlease fix the issues above and run diagnostics again.")
        print("\nCommon fixes:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Start server: python app.py")
        print("3. Check file locations")
    
    print("\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
