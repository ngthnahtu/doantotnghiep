function TableLayout({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 
    dark:bg-slate-900 ${className}`}>
      <table className="w-full min-w-[800px] border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

function Thead({ children, className = "" }) {
  return (
    <thead className={`bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 ${className}`}>
      {children}
    </thead>
  );
}

function Tbody({ children, className = "" }) {
  return (
    <tbody className={`divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>
      {children}
    </tbody>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-center ${className}`}>
      {children}
    </th>
  );
}

function Tr({ children, onClick, className = "" }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${className}`}
    >
      {children}
    </tr>
  );
}

function Td({ children, onClick, className = "" }) {
  return (
    <td
      onClick={onClick}
      className={`px-4 py-3 text-center text-sm text-slate-700 dark:text-slate-300 ${className}`}
    >
      {children}
    </td>
  );
}

export {
  TableLayout,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
};