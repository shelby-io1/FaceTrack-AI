"use client";

const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Accounting & Finance",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Law",
  "Architecture",
  "Medicine",
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function DepartmentCombobox({ value, onChange, required }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">Department</label>
      <input
        list="departments"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
        placeholder="Select or type a department"
      />
      <datalist id="departments">
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
    </div>
  );
}
