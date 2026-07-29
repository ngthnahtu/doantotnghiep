import { Search } from "lucide-react";

export default function ContentLayout({ title, children, action }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center p-3">
        <h1 className="font-semibold text-3xl dark:text-slate-100">{title}</h1>

        <div className="flex gap-4">
          {action}

          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 w-50 dark:border-slate-600 dark:bg-slate-800">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />

            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full text-sm outline-none dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl p-3 dark:bg-slate-900 dark:text-slate-100">{children}</div>
    </div>
  );
}
