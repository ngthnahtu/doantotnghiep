import { ChevronLeft, ChevronRight } from "lucide-react";

function Paginate({
    page, totalPage, setPage
}) {
    return (
        <div className="flex justify-center items-center gap-8 mt-4">
            <button onClick={ ()=>setPage(page-1) } disabled={page===1} className="rounded-full p-3 hover:bg-gray-200 dark:hover:bg-slate-800">
                <ChevronLeft></ChevronLeft>
            </button>

            <span>
                {page} / {totalPage}
            </span>

            <button onClick={ ()=>setPage(page+1) } disabled={page===totalPage} className="rounded-full p-3 hover:bg-gray-200 dark:hover:bg-slate-800">
                <ChevronRight></ChevronRight>
            </button>
        </div>
    );
}
export default Paginate;
