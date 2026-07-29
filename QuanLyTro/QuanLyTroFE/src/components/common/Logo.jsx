import { useEffect, useState } from "react";
import { getSettings } from "../../services/settingService";

export function Logo({ className }) {
  const [houseName, setHouseName] = useState(null);
  useEffect(() => {
    fetchLogo();
  }, []);
  const fetchLogo = async () => {
    try {
      const response = await getSettings();
      const name = response.data?.data?.system?.house_name;
      setHouseName(name);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div
      className={`border-slate-100 text-center dark:border-slate-700 ${className}`}
    >
      <p className="px-3 text-2xl font-black tracking-wide text-blue-600 dark:text-blue-400">
        {houseName}
      </p>
    </div>
  );
}
