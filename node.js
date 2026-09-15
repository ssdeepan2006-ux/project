

const employeeName = "VIJAY";
const employeeId = "EMP1025";
const department = "Software Development";

let monthlySalary = 45000;
let workingDays = 26;
let presentDays = 24;

let isActive = true;
let selectedEmployee = null;


const employee = {
  name: employeeName,
  id: employeeId,
  department: department,
  salary: monthlySalary,
  active: isActive,
};

console.log("Employee Name:", employee.name);
console.log("Employee ID:", employee.id);
console.log("Department:", employee.department);


const dailySalary = monthlySalary / workingDays;
const earnedSalary = dailySalary * presentDays;

console.log("Daily Salary:", dailySalary);
console.log("Earned Salary:", earnedSalary);

let bonus = 5000;

bonus += 1000;

console.log("Bonus:", bonus);

let deduction = 2000;

deduction -= 500;

console.log("Deduction:", deduction);

// ===============================
// 6. Final Salary
// ===============================

let finalSalary = earnedSalary;

finalSalary += bonus;
finalSalary -= deduction;

console.log("Final Salary:", finalSalary);

// ===============================
// 7. Salary Comparison
// ===============================

console.log("Salary is greater than 40000:", finalSalary > 40000);

console.log("Salary is less than or equal to 50000:", finalSalary <= 50000);

// ===============================
// 8. Employee ID Validation
// ===============================

console.log(employeeId === "EMP1025");

console.log(employeeId === "1025");

// ===============================
// 9. Strict Equality vs Loose Equality
// ===============================

let employeeCode = 1025;

console.log(employeeCode === "1025");

console.log(employeeCode == "1025");

// ===============================
// 10. Not Equal Check
// ===============================

console.log(monthlySalary !== 30000); 

// ===============================
// 11. Data Types
// ===============================

console.log("Name Type:", typeof employeeName);
console.log("Salary Type:", typeof monthlySalary);
console.log("Active Type:", typeof isActive);
console.log("Employee Type:", typeof employee);
console.log("Selected Employee:", selectedEmployee);

// ===============================
// 12. Employee Skills
// ===============================

const skills = ["HTML", "CSS", "JavaScript", "Git"];

console.log("First Skill:", skills[0]);
console.log("Second Skill:", skills[1]);
console.log("Third Skill:", skills[2]);

// ===============================
// 13. Skill Count
// ===============================

const skillCount = skills.length;

console.log("Total Skills:", skillCount);

// ===============================
// 14. Working Status
// ===============================

let status = true;

console.log("Employee Working:", status);

status = false;

console.log("Employee Working After Update:", status);

// ===============================
// 15. Increment / Decrement
// ===============================

let performanceScore = 80;

performanceScore++;

console.log("Updated Performance:", performanceScore);

performanceScore--;

console.log("After Deduction:", performanceScore);

// ===============================
// 16. Modulus Example
// ===============================

let totalWorkingDays = 26;

console.log("Remaining After Division:", totalWorkingDays % 5);

// ===============================
// 17. Even / Odd Check
// ===============================

let attendance = 24;

console.log("Attendance Remainder:", attendance % 2);

// ===============================
// 18. Power Calculation
// ===============================

let experience = 3;

console.log("Experience Power:", experience ** 2);

// ===============================
// 19. Final Employee Summary
// ===============================

console.log("----------------------------");
console.log("EMPLOYEE SUMMARY");
console.log("----------------------------");

console.log("Name:", employee.name);
console.log("ID:", employee.id);
console.log("Department:", employee.department);
console.log("Working Days:", workingDays);
console.log("Present Days:", presentDays);
console.log("Final Salary:", finalSalary);
console.log("Skills:", skills);
console.log("Active:", employee.active);

console.log("----------------------------");