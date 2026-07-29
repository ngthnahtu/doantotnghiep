import { LogOut, Moon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../../services/authService";

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleTheme = () => {
    const newTheme = !isDark;

    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log(error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return (
    <header className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <button type="button" onClick={handleTheme}>
          {isDark ? (
            <Sun
              size={22}
              className="text-yellow-400 transition hover:text-yellow-300"
            />
          ) : (
            <Moon
              size={22}
              className="text-slate-600 transition hover:text-blue-500 dark:text-slate-300"
            />
          )}
        </button>

        <div className="h-8 border-l border-slate-200 dark:border-slate-700" />

        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <User />
          </div>

          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-white">
              {user?.phone}
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.role === 0 ? "Quản trị viên" : "Khách thuê"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-700 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
          >
            <LogOut />
          </button>
        </div>
      </div>
    </header>
  );
}
