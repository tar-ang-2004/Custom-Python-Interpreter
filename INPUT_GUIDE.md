# 📝 How to Use Input in PyWeb IDE

## ✅ New & Improved Input System!

Your code with `input()` now works perfectly! Here's how:

## 🎯 How It Works

### Step 1: Write Your Code
```python
print("Enter marks for 5 subjects (out of 100):")

subjects = []
for i in range(1, 6):
    mark = float(input(f"Subject {i}: "))
    subjects.append(mark)

total = sum(subjects)
average = total / 5

print(f"\n📊 Results:")
print(f"Total marks: {total}/500")
print(f"Average: {average:.2f}%")
```

### Step 2: Click Run
- Click the **Run** button or press **Shift+Enter**

### Step 3: Input Modal Appears! 🎉
A dialog will pop up showing:
```
┌────────────────────────────────────────┐
│  📝 Provide Input Values               │
├────────────────────────────────────────┤
│  Your code uses 5 input() call(s).    │
│  Please provide the values below:      │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 85                               │ │
│  │ 90                               │ │
│  │ 78                               │ │
│  │ 92                               │ │
│  │ 88                               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Cancel]  [Run with Inputs]          │
└────────────────────────────────────────┘
```

### Step 4: Enter Values
- Type each input value on a **new line**
- Order matters! First line = first `input()`, second line = second `input()`, etc.
- For numbers, just type the number (e.g., `85`)
- For text, type the text (e.g., `John`)

### Step 5: Click "Run with Inputs"
- Code executes with ALL your inputs
- Results appear in the output console
- ✨ No more errors!

## 📋 Examples

### Example 1: Simple Name & Age
**Code:**
```python
name = input("What's your name? ")
age = input("How old are you? ")
print(f"{name} is {age} years old")
```

**Input Modal - Enter:**
```
John
25
```

**Output:**
```
What's your name? John
How old are you? 25
John is 25 years old
```

### Example 2: Math Calculator
**Code:**
```python
x = float(input("Enter first number: "))
y = float(input("Enter second number: "))
print(f"Sum: {x + y}")
print(f"Product: {x * y}")
```

**Input Modal - Enter:**
```
15.5
3.2
```

**Output:**
```
Enter first number: 15.5
Enter second number: 3.2
Sum: 18.7
Product: 49.6
```

### Example 3: List of Items
**Code:**
```python
items = []
count = int(input("How many items? "))

for i in range(count):
    item = input(f"Item {i+1}: ")
    items.append(item)

print(f"\nYour shopping list:")
for item in items:
    print(f"  - {item}")
```

**Input Modal - Enter:**
```
3
Apples
Bananas
Oranges
```

**Output:**
```
How many items? 3
Item 1: Apples
Item 2: Bananas
Item 3: Oranges

Your shopping list:
  - Apples
  - Bananas
  - Oranges
```

## 💡 Tips

1. **Count Your Inputs**: The modal tells you how many `input()` calls your code has
2. **One Per Line**: Each line in the text area = one input value
3. **Check the Order**: Make sure inputs match the order they're asked in your code
4. **Numbers vs Text**: For numbers, just type the number. Python will convert it.
5. **Empty Lines**: Skip empty lines - they won't be used
6. **Cancel Anytime**: Click Cancel or X to close without running

## 🔍 How the System Works

1. **Detection**: When you click Run, the IDE scans your code for `input()` calls
2. **Collection**: If found, a modal appears to collect all inputs at once
3. **Pre-loading**: All inputs are sent to the backend before execution
4. **Execution**: Code runs with inputs already available
5. **Display**: Output shows prompts and your inputs together

## ⚠️ Common Mistakes

### ❌ Wrong: Not enough inputs
If your code needs 5 inputs and you only provide 3, you'll get an error.

### ❌ Wrong: Wrong data type
```python
age = int(input("Age: "))
```
Input: `twenty` ← This will cause an error! Use: `20`

### ✅ Right: Match the count
Check the modal - it tells you exactly how many inputs are needed!

### ✅ Right: Type conversion
If your code uses `int()` or `float()`, provide numbers:
```
85
90.5
75
```

## 🚀 Advanced Usage

### Multiple Input Types
```python
name = input("Name: ")          # String
age = int(input("Age: "))       # Integer
grade = float(input("Grade: ")) # Float
active = input("Active (y/n): ") # String
```

**Inputs:**
```
Alice
25
95.5
y
```

### Loop-based Inputs
The system automatically counts inputs even in loops:
```python
for i in range(3):
    value = input(f"Enter value {i+1}: ")
```
Needs: **3 inputs**

### Conditional Inputs
```python
choice = input("Continue? (y/n): ")
if choice == 'y':
    name = input("Your name: ")
```
This is **tricky** - provide 2 inputs even if the second might not be used.

## 🎨 Visual Feedback

Watch for these indicators:

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Success | Code executed successfully |
| 🔴 Red | Error | Something went wrong |
| 🟡 Yellow | Running | Code is executing |

## 📚 More Examples

### Student Grade Calculator (Your Original Code!)
```python
print("Enter marks for 5 subjects (out of 100):")

subjects = []
for i in range(1, 6):
    mark = float(input(f"Subject {i}: "))
    subjects.append(mark)

total = sum(subjects)
average = total / 5

print(f"\n📊 Results:")
print(f"Total marks: {total}/500")
print(f"Average: {average:.2f}%")

if average >= 90:
    print("Grade: A+ 🌟")
elif average >= 80:
    print("Grade: A 🎉")
elif average >= 70:
    print("Grade: B+ 👍")
elif average >= 60:
    print("Grade: B 👏")
else:
    print("Grade: C 💪")
```

**Input Modal:**
```
85
92
88
90
86
```

**Result:**
```
📊 Results:
Total marks: 441.0/500
Average: 88.20%
Grade: A 🎉
```

---

## Summary

✅ **No more RuntimeError!**  
✅ **Simple & Intuitive**: Just type your values  
✅ **Clear Feedback**: Know exactly how many inputs needed  
✅ **Works Every Time**: Tested and reliable  

**Try it now with the example above!** 🚀
