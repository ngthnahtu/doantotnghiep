import { Link } from "react-router-dom";

export default function NotFound() {
  let home="/";
  try{
      const token=localStorage.getItem("token");
      const user=JSON.parse(localStorage.getItem("user"));
      if(token && user?.role===0){
        home="/admin/dashboard";
      }
      if(token && user?.role===1){
        home="/tenant/contract";
      }
  }catch{
    home="/";
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-slate-950">
      <h1 className="text-8xl font-bold text-blue-500">
        404
      </h1>

      <p className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-200">
        Không tìm thấy trang
      </p>

      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Đường dẫn bạn truy cập không tồn tại.
      </p>

      <Link
        to={home}
        className="mt-6 rounded-lg bg-blue-500 px-5 py-2 font-semibold text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Quay về
      </Link>
    </div>
  );
}