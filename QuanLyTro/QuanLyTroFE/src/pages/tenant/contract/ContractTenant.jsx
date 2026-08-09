import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";

import { getContracts } from "../../../services/contractService";

import ContentLayout from "../../../layouts/ContentLayout";
import Loading from "../../../components/common/Loading";
import Paginate from "../../../components/common/Paginate";
import Toast from "../../../components/common/Toast";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";

import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

import ContractView from "../../admin/contract/ContractView";

const statusList = [
  {
    text: "Đang hiệu lực",
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300",
  },
  {
    text: "Đã thanh lý",
    color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
  {
    text: "Đã hủy",
    color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  },
];

export default function ContractTenant() {
  const [contracts, setContracts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(keyword.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [keyword]);

  const clearSearch = () => {
    setKeyword("");
    setSearch("");
    if (page !== 1) {
      setPage(1);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, search, filter]);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);

      const response = await getContracts(page, search, filter);

      setContracts(response.data.data.data || []);
      setTotalPage(response.data.data.last_page || 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách hợp đồng.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (contract) => {
    const status = statusList[Number(contract.status)] || {
      text: "Không xác định",
      color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
    };

    if (Number(contract.status) === 0) {
      const today = new Date().toLocaleDateString("en-CA");
      const endDate = contract.end_date?.slice(0, 10);

      if (endDate && endDate < today) {
        return {
          text: "Quá hạn",
          color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
        };
      }
    }

    return status;
  };

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout
        title="Hợp đồng của tôi"
        toolbar={
          <div
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 w-50 h-8
          dark:border-slate-600 dark:bg-slate-800"
          >
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full text-sm outline-none dark:bg-slate-800 dark:text-slate-100"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button onClick={clearSearch}>
                <X />
              </button>
            )}
          </div>
        }
        filter={
          <select
            name="filter"
            id="filter"
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            value={filter}
            className="text-center border border-slate-300 rounded-lg
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Toàn bộ</option>
            <option value="0">Đang hiệu lực</option>
            <option value="1">Đã thanh lý</option>
            <option value="2">Đã hủy</option>
          </select>
        }
      >
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Mã hợp đồng</Th>
              <Th>Phòng</Th>
              <Th>Ngày bắt đầu</Th>
              <Th>Ngày hết hạn</Th>
              <Th>Giá thuê</Th>
              <Th>Tiền cọc</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <td className="text-center" colSpan={8}>
                  <Loading />
                </td>
              </Tr>
            ) : contracts.length === 0 ? (
              <Tr>
                <td className="text-center p-3 text-lg" colSpan={8}>
                  Bạn chưa có hợp đồng.
                </td>
              </Tr>
            ) : (
              contracts.map((contract) => {
                const status = getStatus(contract);

                return (
                  <Tr key={contract.id}>
                    <Td>{contract.contract_code}</Td>

                    <Td>{contract.rooms?.room_name || "Không xác định"}</Td>

                    <Td>{formatDate(contract.start_date)}</Td>

                    <Td>{formatDate(contract.end_date)}</Td>

                    <Td>{formatCurrency(contract.rent_price)}</Td>

                    <Td>{formatCurrency(contract.deposit)}</Td>

                    <Td>
                      <span className={`inline-block rounded-xl px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>

                    <Td>
                      <button
                        type="button"
                        title="Xem chi tiết"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setViewing(contract)}
                      >
                        <Eye size={20} />
                      </button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>
      </ContentLayout>

      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {viewing && <ContractView contract={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
