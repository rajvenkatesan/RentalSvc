interface DatePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export default function DatePicker({ startDate, endDate, onChange }: DatePickerProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          min={today}
          onChange={(e) => onChange(e.target.value, endDate)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          min={startDate || today}
          onChange={(e) => onChange(startDate, e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
