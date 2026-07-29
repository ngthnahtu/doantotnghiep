function Input({
  id,
  type = "text",
  placeholder,
  onChange,
  value,
  name,
  className = "",
  required = false,
  readOnly = false,
  disabled = false,
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      className={`w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none 
      focus:border-blue-500 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700 ${className}`}
    />
  );
}

export default Input;