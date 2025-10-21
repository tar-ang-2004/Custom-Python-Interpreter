print('Enter marks for 5 subjects (out of 100):')

subjects = []
for i in range(1, 6):
    mark = float(input(f'Subject {i}: '))
    subjects.append(mark)

total = sum(subjects)
average = total / 5

print(f"\n📊 Results:")
print(f"Total marks: {total}/500")
print(f"Average: {average:.2f}%")

if average >= 90:
    print("Grade: A+ ⭐")
elif average >= 80:
    print("Grade: A 🌟")
elif average >= 70:
    print("Grade: B+ 🔥")
elif average >= 60:
    print("Grade: B 🟡")
else:
    print("Grade: C 📚")
