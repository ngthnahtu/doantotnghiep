import { X } from "lucide-react";

function Modal({ title, isOpen, onClose, children, className = "max-w-lg" }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 z-50 w-full h-screen flex items-center justify-center bg-black/30">
      <div
        className={`w-full rounded-xl bg-white shadow p-6 transition-all duration-200 dark:bg-slate-900 dark:text-slate-100 ${className}`}
      >
        <div className="mb-6 flex items-center justify-between border-b dark:border-slate-700">
          <h2 className="text-2xl font-semibold">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-red-100 transition-colors duration-200 dark:hover:bg-red-950"
          >
            <X size={28} className="text-red-500" />
          </button>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
