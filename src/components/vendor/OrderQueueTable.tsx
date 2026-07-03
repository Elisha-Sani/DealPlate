"use client";

import { useMemo } from "react";
import { Eye } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Order } from "@/types";

interface OrderQueueTableProps {
    orders: Order[];
}

export default function OrderQueueTable({ orders }: OrderQueueTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeTab = searchParams.get("tab") ?? "all";

    const { awaitingOrders, collectedOrders } = useMemo(() => {
        return {
            awaitingOrders: orders.filter((o) => o.status === "Active"),
            collectedOrders: orders.filter((o) => o.status === "Completed"),
        };
    }, [orders]);

    const visibleOrders = useMemo(() => {
        if (activeTab === "awaiting") return awaitingOrders;
        if (activeTab === "collected") return collectedOrders;
        return orders;
    }, [activeTab, awaitingOrders, collectedOrders, orders]);

    function setTab(tab: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`${pathname}?${params.toString()}`);
    }

    const tabClass = (tab: string) =>
        `px-4 py-1.5 rounded-full text-sm font-medium hover:cursor-pointer ${
            activeTab === tab
                ? "bg-[#1E293B] text-white"
                : "bg-white border border-[#E2E8F0] text-gray-600 hover:bg-gray-100"
        }`;

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-4 bg-[#F8FAFC]">
                <div className="flex gap-2">
                    <button
                        className={tabClass("all")}
                        onClick={() => setTab("all")}
                    >
                        All Orders ({orders.length})
                    </button>
                    <button
                        className={tabClass("awaiting")}
                        onClick={() => setTab("awaiting")}
                    >
                        Awaiting Pickup ({awaitingOrders.length})
                    </button>
                    <button
                        className={tabClass("collected")}
                        onClick={() => setTab("collected")}
                    >
                        Collected ({collectedOrders.length})
                    </button>
                </div>
                <select className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-gray-600 outline-none">
                    <option>Filter by Status</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-[#E2E8F0]">
                        <tr>
                            <th className="px-6 py-4 font-semibold">
                                Order ID
                            </th>
                            <th className="px-6 py-4 font-semibold">
                                Student Details
                            </th>
                            <th className="px-6 py-4 font-semibold">
                                Deal Title
                            </th>
                            <th className="px-6 py-4 font-semibold">Payment</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {visibleOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50">
                                <td
                                    className="px-6 py-4 text-sm text-gray-500 font-mono"
                                    title={order.id}
                                >
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-[#1E293B]">
                                        {order.student?.full_name ||
                                            "Unknown Student"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {order.student?.phone || "No phone"}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 bg-[#F1F5F9] text-gray-600 rounded text-xs font-medium">
                                        {order.deal.title}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        Ksh {order.totalPaid} Paid
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                                            order.status === "Active"
                                                ? "bg-orange-50 text-[#FF6B00]"
                                                : order.status === "Completed"
                                                  ? "bg-green-50 text-green-600"
                                                  : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {order.status === "Active" ? (
                                        <button
                                            onClick={() =>
                                                router.push("/vendor/pickup")
                                            }
                                            className="px-4 py-1.5 border border-[#E2E8F0] hover:border-[#1E293B] rounded-lg text-sm font-medium text-[#1E293B] transition-colors"
                                        >
                                            Mark Collected
                                        </button>
                                    ) : (
                                        <button className="p-1.5 text-gray-400 hover:text-[#1E293B] transition-colors">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {visibleOrders.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] flex justify-between items-center text-sm text-gray-500">
                <span>
                    Showing 1 to {visibleOrders.length} of{" "}
                    {visibleOrders.length} orders
                </span>
                <div className="flex gap-1">
                    <button className="w-8 h-8 rounded border border-transparent hover:bg-gray-100 flex items-center justify-center">
                        &lt;
                    </button>
                    <button className="w-8 h-8 rounded bg-[#FF6B00] text-white font-bold flex items-center justify-center">
                        1
                    </button>
                    <button className="w-8 h-8 rounded border border-transparent hover:bg-gray-100 flex items-center justify-center">
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}
