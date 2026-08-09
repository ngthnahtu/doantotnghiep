import { useEffect } from "react";
import { X, CircleCheck, CircleX } from "lucide-react";

export default function Toast({ title, type, onClose }) {
  useEffect(() => {
    if (!title) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [title]);

  if (!title) return null;

  const isError = type === "error";

  return (
    <div className="fixed top-5 left-1/2 z-70 -translate-x-1/2">
      <div
        className={`flex w-[350px] items-center gap-3 rounded-xl border p-3 text-sm shadow-lg ${
          isError
            ? "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
            : "border-green-300 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        }`}
      >
        {isError ? <CircleX size={21} className="shrink-0" /> : <CircleCheck size={21} className="shrink-0" />}

        <p className="flex-1">{title}</p>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
