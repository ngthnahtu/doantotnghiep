import { Search } from "lucide-react";

export default function ContentLayout({ title, children, action, toolbar,filter }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center p-3">
        <h1 className="font-semibold text-3xl dark:text-slate-100">{title}</h1>

        <div className="flex gap-4">
          {action}

          {toolbar}

          {filter}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl p-3 dark:bg-slate-900 dark:text-slate-100">{children}</div>
    </div>
  );
}
