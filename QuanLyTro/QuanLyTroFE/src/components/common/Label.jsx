export default function Label({ htmlFor, className = "", children }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1 block font-medium text-slate-900 dark:text-slate-200 ${className}`}
    >
      {children}
    </label>
  );
}