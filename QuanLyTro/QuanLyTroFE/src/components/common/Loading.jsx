import { LoaderCircle } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center py-10">
            <LoaderCircle
                className="animate-spin text-gray-700 dark:text-slate-300"
                size={40}
            />
        </div>
    );
}
