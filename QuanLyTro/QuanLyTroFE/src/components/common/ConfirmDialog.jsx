import Button from "./Button";

function ConfirmDialog({
  title,
  message,
  isOpen,
  onCancel,
  onConfirm,
  loading = false,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 flex h-screen w-full items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow dark:bg-slate-900 dark:text-slate-200">
        <h2 className="mb-1 text-xl font-semibold">{title}</h2>

        <p>{message}</p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            className="bg-gray-400 transition-colors duration-200 hover:bg-gray-500"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </Button>

          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Chờ..." : "Xác nhận"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;