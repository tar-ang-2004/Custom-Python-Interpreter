"""
Test script for the Python Interpreter
Run this to verify the interpreter functionality
"""

from python_interpreter import PythonInterpreter

def test_interpreter():
    """Run comprehensive tests on the interpreter"""
    print("=" * 70)
    print("TESTING PYTHON INTERPRETER")
    print("=" * 70)
    
    interpreter = PythonInterpreter()
    tests_passed = 0
    tests_failed = 0
    
    # Test 1: Simple arithmetic
    print("\nTest 1: Simple Arithmetic")
    result = interpreter.execute("result = 5 + 3")
    if result['success'] and interpreter.get_variable('result') == 8:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 2: Print statement
    print("\nTest 2: Print Statement")
    result = interpreter.execute("print('Hello, World!')")
    if result['success'] and 'Hello, World!' in result['output']:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 3: Function definition
    print("\nTest 3: Function Definition")
    code = """
def square(x):
    return x * x

result = square(5)
"""
    result = interpreter.execute(code)
    if result['success'] and interpreter.get_variable('result') == 25:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 4: Class definition
    print("\nTest 4: Class Definition")
    code = """
class Counter:
    def __init__(self):
        self.count = 0
    
    def increment(self):
        self.count += 1
        return self.count

counter = Counter()
counter.increment()
counter.increment()
final_count = counter.count
"""
    result = interpreter.execute(code)
    if result['success'] and interpreter.get_variable('final_count') == 2:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 5: List comprehension
    print("\nTest 5: List Comprehension")
    result = interpreter.execute("squares = [x**2 for x in range(5)]")
    expected = [0, 1, 4, 9, 16]
    if result['success'] and interpreter.get_variable('squares') == expected:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 6: Error handling
    print("\nTest 6: Error Handling")
    result = interpreter.execute("x = 1 / 0")
    if not result['success'] and 'ZeroDivisionError' in result['error']:
        print("✓ PASSED - Error correctly caught")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 7: Syntax validation
    print("\nTest 7: Syntax Validation")
    valid, error = interpreter.validate_syntax("print('valid code')")
    if valid and error is None:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 8: Invalid syntax detection
    print("\nTest 8: Invalid Syntax Detection")
    valid, error = interpreter.validate_syntax("print('invalid")
    if not valid and error is not None:
        print("✓ PASSED - Invalid syntax detected")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 9: REPL-style execution
    print("\nTest 9: REPL-style Execution")
    result = interpreter.execute_line("2 + 2")
    if result['success'] and '4' in result['output']:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 10: Loop execution
    print("\nTest 10: Loop Execution")
    code = """
total = 0
for i in range(10):
    total += i
"""
    result = interpreter.execute(code)
    if result['success'] and interpreter.get_variable('total') == 45:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 11: Dictionary operations
    print("\nTest 11: Dictionary Operations")
    code = """
data = {'name': 'Python', 'version': 3.11}
data['type'] = 'language'
data_keys = list(data.keys())
"""
    result = interpreter.execute(code)
    expected_keys = ['name', 'version', 'type']
    if result['success'] and interpreter.get_variable('data_keys') == expected_keys:
        print("✓ PASSED")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Test 12: Reset functionality
    print("\nTest 12: Reset Functionality")
    interpreter.reset()
    variables = interpreter.get_all_variables()
    if len(variables) == 0:
        print("✓ PASSED - Interpreter reset successful")
        tests_passed += 1
    else:
        print("✗ FAILED")
        tests_failed += 1
    
    # Print summary
    print("\n" + "=" * 70)
    print(f"TESTS COMPLETED: {tests_passed + tests_failed}")
    print(f"✓ PASSED: {tests_passed}")
    print(f"✗ FAILED: {tests_failed}")
    print(f"Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
    print("=" * 70)
    
    return tests_passed, tests_failed

if __name__ == "__main__":
    test_interpreter()
