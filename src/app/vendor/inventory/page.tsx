"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
    Edit3,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Loader2,
    PackageOpen,
    Plus,
    RotateCcw,
    Save,
    Search,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import VendorTopBar from "@/components/layout/VendorTopBar";
import { supabase } from "@/lib/supabase/client";
import Price from "@/components/ui/Price";
import { cn } from "@/lib/utils";
import { generateDealDescription } from "@/app/actions/generateDescription";

interface VendorProfile {
    id: string;
    business_name: string;
}

interface InventoryItem {
    id: string;
    title: string;
    vendor: string;
    campus: string;
    originalPrice: number;
    dealPrice: number;
    image: string;
    discountPercentage: number;
    timeStart: string;
    timeEnd: string;
    category: string;
    description: string;
    briefDescription: string;
    detailedDescription: string;
    stockCount: number;
    isPublished: boolean;
    expiresAt: string;
    createdAt: string;
}

interface InventoryForm {
    title: string;
    originalPrice: string;
    dealPrice: string;
    stockCount: number;
    timeStart: string;
    timeEnd: string;
    category: string;
    campus: string;
    image: string;
    briefDescription: string;
    detailedDescription: string;
    isPublished: boolean;
    activeHours: number;
}

const emptyForm: InventoryForm = {
    title: "",
    originalPrice: "",
    dealPrice: "",
    stockCount: 1,
    timeStart: "",
    timeEnd: "",
    category: "Bakery",
    campus: "Main Campus",
    image: "",
    briefDescription: "",
    detailedDescription: "",
    isPublished: true,
    activeHours: 2,
};

const categories = [
    "Bakery",
    "Pizza",
    "Sushi",
    "Burgers",
    "Beverages",
    "Desserts",
    "Other",
];
const fallbackImage =
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop&q=80";

function mapInventoryItem(row: any): InventoryItem {
    return {
        id: row.id,
        title: row.title,
        vendor: row.vendor,
        campus: row.campus,
        originalPrice: Number(row.original_price),
        dealPrice: Number(row.deal_price),
        image: row.image,
        discountPercentage: Number(row.discount_percentage),
        timeStart: String(row.time_start || "").slice(0, 5),
        timeEnd: String(row.time_end || "").slice(0, 5),
        category: row.category,
        description: row.description || "",
        briefDescription: row.brief_description || "",
        detailedDescription: row.detailed_description || "",
        stockCount: Number(row.stock_count),
        isPublished: row.is_published !== false,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
    };
}

export default function VendorInventory() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [vendor, setVendor] = useState<VendorProfile | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [form, setForm] = useState<InventoryForm>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "all" | "published" | "unpublished" | "sold_out"
    >("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    // AI Model
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dietaryTags, setDietaryTags] = useState("");
    const [allergens, setAllergens] = useState("");
    const [mainIngredients, setMainIngredients] = useState("");
    const [isMysteryBag, setIsMysteryBag] = useState(false);

    const fetchVendorInventory = useCallback(async () => {
        setIsLoading(true);
        setMessage("");

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
            setVendor(null);
            setItems([]);
            setIsLoading(false);
            setMessage("You must be signed in as a vendor to manage inventory.");
            return;
        }

        const { data: vendorData, error: vendorError } = await supabase
            .from("vendors")
            .select("id, business_name")
            .eq("id", session.user.id)
            .maybeSingle();
        if (vendorError || !vendorData) {
            setVendor(null);
            setItems([]);
            setIsLoading(false);
            setMessage(
                "No vendor profile found. The vendor must be approved before inventory can be managed.",
            );
            return;
        }

        setVendor(vendorData as VendorProfile);

        const { data: dealsData, error: dealsError } = await supabase
            .from("deals")
            .select("*")
            .eq("vendor_id", vendorData.id)
            .order("created_at", { ascending: false });

        if (dealsError) {
            setMessage(dealsError.message);
            setItems([]);
        } else {
            setItems((dealsData || []).map(mapInventoryItem));
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchVendorInventory();
    }, [fetchVendorInventory]);

    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return items.filter((item) => {
            const matchesQuery =
                !query ||
                item.title.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query);
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "published" &&
                    item.isPublished &&
                    item.stockCount > 0) ||
                (statusFilter === "unpublished" && !item.isPublished) ||
                (statusFilter === "sold_out" && item.stockCount === 0);
            return matchesQuery && matchesStatus;
        });
    }, [items, searchQuery, statusFilter]);

    const updateForm = <K extends keyof InventoryForm>(
        key: K,
        value: InventoryForm[K],
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setForm({
            title: item.title,
            originalPrice: String(item.originalPrice),
            dealPrice: String(item.dealPrice),
            stockCount: item.stockCount,
            timeStart: item.timeStart,
            timeEnd: item.timeEnd,
            category: item.category,
            campus: item.campus,
            image: item.image,
            briefDescription: item.briefDescription || item.description,
            detailedDescription: item.detailedDescription,
            isPublished: item.isPublished,
            activeHours: 2,
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1_500_000) {
            setMessage("Use an image under 1.5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => updateForm("image", reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleGenerateAI = async () => {
        if (!form.title || !form.originalPrice || !form.dealPrice) {
            alert(
                "Please fill in the Meal Title, Original Value, and Deal Price first!",
            );
            return;
        }

        setIsGenerating(true);
        const result = await generateDealDescription({
            title: form.title,
            originalPrice: Number(form.originalPrice),
            dealPrice: Number(form.dealPrice),
            dietaryTags,
            allergens,
            mainIngredients,
            isMysteryBag,
        });

        if (result.success) {
            updateForm("briefDescription", result.briefDescription || "");
            updateForm("detailedDescription", result.detailedDescription || "");
            setIsAiModalOpen(false);
        } else {
            alert("AI Generation failed. Check console or verify API key.");
            console.error(result.error);
        }
        setIsGenerating(false);
    };

    const buildPayload = () => {
        if (!vendor) return null;
        const original = Number(form.originalPrice) || 0;
        const deal = Number(form.dealPrice) || 0;
        const discount =
            original > 0
                ? Math.max(0, Math.round(((original - deal) / original) * 100))
                : 0;

        const payload: {
            vendor_id: string;
            vendor: string;
            title: string;
            campus: string;
            original_price: number;
            deal_price: number;
            image: string;
            discount_percentage: number;
            time_start: string;
            time_end: string;
            category: string;
            tags: string[];
            description: string;
            brief_description: string;
            detailed_description: string;
            stock_count: number;
            is_published: boolean;
            expires_at?: string;
        } = {
            vendor_id: vendor.id,
            vendor: vendor.business_name,
            title: form.title.trim(),
            campus: form.campus.trim() || "Main Campus",
            original_price: original,
            deal_price: deal,
            image: form.image || fallbackImage,
            discount_percentage: discount,
            time_start: form.timeStart,
            time_end: form.timeEnd,
            category: form.category,
            tags: [form.category],
            description:
                form.briefDescription || form.detailedDescription || form.title,
            brief_description: form.briefDescription,
            detailed_description: form.detailedDescription,
            stock_count: form.stockCount,
            is_published: form.isPublished,
        };

        // Only set a fresh expiry when creating a new item — editing an
        // existing one (e.g. fixing a typo) shouldn't silently reset its
        // countdown. Use "Publish"/"Extend" on an expired item instead.
        if (!editingId) {
            payload.expires_at = new Date(
                Date.now() + form.activeHours * 60 * 60 * 1000,
            ).toISOString();
        }

        return payload;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = buildPayload();
        if (!payload) return;

        if (
            !payload.title ||
            payload.original_price <= 0 ||
            payload.deal_price <= 0 ||
            !payload.time_start ||
            !payload.time_end
        ) {
            setMessage("Fill in title, prices, and collection window.");
            return;
        }

        setIsSaving(true);
        setMessage(editingId ? "Saving item..." : "Creating item...");

        const request = editingId
            ? supabase.from("deals").update(payload).eq("id", editingId)
            : supabase.from("deals").insert(payload);

        const { error } = await request;
        setIsSaving(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage(
            editingId ? "Inventory item updated." : "Inventory item created.",
        );
        resetForm();
        await fetchVendorInventory();
    };

    const togglePublished = async (item: InventoryItem) => {
        const willPublish = !item.isPublished;
        const isExpired = new Date(item.expiresAt).getTime() <= Date.now();
        // Re-publishing something that already expired needs a fresh
        // window too, otherwise the next auto-unpublish sweep would just
        // immediately hide it again.
        const needsFreshExpiry = willPublish && isExpired;

        setMessage(willPublish ? "Publishing item..." : "Unpublishing item...");

        const update: { is_published: boolean; expires_at?: string } = {
            is_published: willPublish,
        };
        if (needsFreshExpiry) {
            update.expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        }

        const { error } = await supabase.from("deals").update(update).eq("id", item.id);

        if (error) {
            setMessage(error.message);
            return;
        }

        setItems((prev) =>
            prev.map((current) =>
                current.id === item.id
                    ? { ...current, isPublished: willPublish, expiresAt: update.expires_at || current.expiresAt }
                    : current,
            ),
        );
        setMessage(
            willPublish
                ? needsFreshExpiry
                    ? "Item republished with a fresh 2-hour window."
                    : "Item published to Explore."
                : "Item hidden from Explore.",
        );
    };

    const handleDeleteProduct = async (item: InventoryItem) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete "${item.title}"?`);
        if (!confirmDelete) return;

        setMessage("Deleting item...");

        const { error } = await supabase.from("deals").delete().eq("id", item.id);

        if (error) {
            if (error.code === '23503') { // Foreign key violation
                setMessage(`Cannot delete "${item.title}" because it has existing orders. Please unpublish it instead.`);
            } else {
                setMessage(`Failed to delete: ${error.message}`);
            }
            return;
        }

        setItems((prev) => prev.filter((current) => current.id !== item.id));
        setMessage(`Item "${item.title}" deleted successfully.`);
        if (editingId === item.id) {
            resetForm();
        }
    };

    const stats = {
        total: items.length,
        published: items.filter(
            (item) => item.isPublished && item.stockCount > 0,
        ).length,
        hidden: items.filter((item) => !item.isPublished).length,
        soldOut: items.filter((item) => item.stockCount === 0).length,
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col flex-1 pb-10 relative"
        >
            <VendorTopBar title="Inventory" />
            <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1E293B]">
                            Manage surplus items
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Edit stock, pricing, collection windows, and publish
                            status from one place.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="h-10 px-4 rounded-lg bg-[#FF6B00] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#e66000] active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        New Item
                    </button>
                </div>

                {message && (
                    <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-sm font-semibold text-[#1E293B] shadow-sm">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-bold uppercase">
                            Total
                        </p>
                        <p className="text-2xl font-black text-[#1E293B]">
                            {stats.total}
                        </p>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-bold uppercase">
                            Published
                        </p>
                        <p className="text-2xl font-black text-green-600">
                            {stats.published}
                        </p>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-bold uppercase">
                            Hidden
                        </p>
                        <p className="text-2xl font-black text-gray-600">
                            {stats.hidden}
                        </p>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-bold uppercase">
                            Sold Out
                        </p>
                        <p className="text-2xl font-black text-[#E11D48]">
                            {stats.soldOut}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <section className="xl:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4 mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-[#1E293B]">
                                    {editingId ? "Edit item" : "Create item"}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Published items with stock appear in
                                    Explore.
                                </p>
                            </div>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-gray-600 flex items-center gap-1 hover:bg-gray-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Item title
                                </label>
                                <input
                                    value={form.title}
                                    onChange={(e) =>
                                        updateForm("title", e.target.value)
                                    }
                                    required
                                    className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    placeholder="Mystery Pastry Bag"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Original price
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.originalPrice}
                                        onChange={(e) =>
                                            updateForm(
                                                "originalPrice",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Deal price
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.dealPrice}
                                        onChange={(e) =>
                                            updateForm(
                                                "dealPrice",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.stockCount}
                                        onChange={(e) =>
                                            updateForm(
                                                "stockCount",
                                                Math.max(
                                                    0,
                                                    Number(e.target.value) || 0,
                                                ),
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) =>
                                            updateForm(
                                                "category",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    >
                                        {categories.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {!editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Active for (hours)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="24"
                                        value={form.activeHours}
                                        onChange={(e) =>
                                            updateForm(
                                                "activeHours",
                                                Math.max(1, Number(e.target.value) || 1),
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        The deal automatically unpublishes once this window ends — you can republish it any time from the list below.
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Start
                                    </label>
                                    <input
                                        type="time"
                                        value={form.timeStart}
                                        onChange={(e) =>
                                            updateForm(
                                                "timeStart",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        End
                                    </label>
                                    <input
                                        type="time"
                                        value={form.timeEnd}
                                        onChange={(e) =>
                                            updateForm(
                                                "timeEnd",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Campus
                                </label>
                                <input
                                    value={form.campus}
                                    onChange={(e) =>
                                        updateForm("campus", e.target.value)
                                    }
                                    className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Product image
                                </label>
                                <div className="flex gap-4 items-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="h-11 px-4 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1E293B] hover:bg-gray-50 flex items-center gap-2 shrink-0"
                                    >
                                        <ImageIcon className="w-4 h-4" /> Upload
                                    </button>
                                    {form.image && (
                                        <div className="relative group rounded-lg overflow-hidden border border-[#E2E8F0] w-16 h-16 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => updateForm("image", "")}
                                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    {!form.image && (
                                        <span className="text-xs text-gray-500 truncate">
                                            Default image used if empty
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-[#1E293B]">
                                    Brief description
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="text-xs font-bold text-[#FF6B00] hover:text-[#e66000] flex items-center gap-1"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />{" "}
                                    Generate with AI
                                </button>
                            </div>
                            <textarea
                                value={form.briefDescription}
                                onChange={(e) =>
                                    updateForm(
                                        "briefDescription",
                                        e.target.value,
                                    )
                                }
                                className="w-full h-20 p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm resize-none"
                            />

                            {/* <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Brief description
                                </label>
                                <textarea
                                    value={form.briefDescription}
                                    onChange={(e) =>
                                        updateForm(
                                            "briefDescription",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full h-20 p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm resize-none"
                                />
                            </div> */}

                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Detailed description
                                </label>
                                <textarea
                                    value={form.detailedDescription}
                                    onChange={(e) =>
                                        updateForm(
                                            "detailedDescription",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full h-28 p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm resize-none"
                                />
                            </div>

                            <label className="flex items-center justify-between gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 cursor-pointer">
                                <span>
                                    <span className="block text-sm font-bold text-[#1E293B]">
                                        Publish to Explore
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        Turn off to keep this item hidden from
                                        students.
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={form.isPublished}
                                    onChange={(e) =>
                                        updateForm(
                                            "isPublished",
                                            e.target.checked,
                                        )
                                    }
                                    className="w-5 h-5 accent-[#FF6B00]"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-12 rounded-lg bg-[#FF6B00] disabled:bg-orange-300 text-white font-bold flex items-center justify-center gap-2 hover:bg-[#e66000] active:scale-95 transition-all"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {editingId
                                    ? "Save Changes"
                                    : "Create Inventory Item"}
                            </button>
                        </form>
                    </section>

                    <section className="xl:col-span-7 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[#E2E8F0] space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-[#1E293B]">
                                    Inventory Items
                                </h2>
                                {isLoading && (
                                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        placeholder="Search items"
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00]"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target
                                                .value as typeof statusFilter,
                                        )
                                    }
                                    className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00]"
                                >
                                    <option value="all">All items</option>
                                    <option value="published">Published</option>
                                    <option value="unpublished">
                                        Unpublished
                                    </option>
                                    <option value="sold_out">Sold out</option>
                                </select>
                            </div>
                        </div>

                        <div className="divide-y divide-[#E2E8F0]">
                            {filteredItems.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <PackageOpen className="w-10 h-10 text-gray-300 mb-3" />
                                    <h3 className="font-bold text-[#1E293B]">
                                        No inventory items found
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Create an item or adjust the filters
                                        above.
                                    </p>
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <article
                                        key={item.id}
                                        className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-[#F8FAFC] transition-colors"
                                    >
                                        <img
                                            src={item.image || fallbackImage}
                                            alt={item.title}
                                            className="w-full md:w-24 h-32 md:h-20 object-cover rounded-lg border border-[#E2E8F0] bg-gray-100 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-[#1E293B] truncate">
                                                    {item.title}
                                                </h3>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                        item.isPublished
                                                            ? "bg-green-50 text-green-600"
                                                            : "bg-gray-100 text-gray-500",
                                                    )}
                                                >
                                                    {item.isPublished
                                                        ? "Published"
                                                        : "Hidden"}
                                                </span>
                                                {item.stockCount === 0 && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-[#E11D48]">
                                                        Sold out
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {item.briefDescription ||
                                                    item.description ||
                                                    item.category}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                                                <span>{item.category}</span>
                                                <span>{item.campus}</span>
                                                <span>
                                                    {item.timeStart} -{" "}
                                                    {item.timeEnd}
                                                </span>
                                                <span>
                                                    {item.stockCount} left
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex md:flex-col items-center md:items-end justify-between gap-3 md:w-36 shrink-0">
                                            <Price
                                                amount={item.dealPrice}
                                                size="sm"
                                                className="text-[#FF6B00]"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEdit(item)
                                                    }
                                                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#1E293B] hover:bg-white flex items-center gap-1"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />{" "}
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        togglePublished(item)
                                                    }
                                                    className={cn(
                                                        "h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1",
                                                        item.isPublished
                                                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                            : "bg-green-600 text-white hover:bg-green-700",
                                                    )}
                                                >
                                                    {item.isPublished ? (
                                                        <EyeOff className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5" />
                                                    )}
                                                    {item.isPublished
                                                        ? "Unpublish"
                                                        : "Publish"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteProduct(item)
                                                    }
                                                    className="h-9 px-3 rounded-lg border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {isAiModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-lg w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#1E293B]">
                                Generate description with AI
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAiModalOpen(false)}
                                className="text-gray-400 hover:text-[#1E293B]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Uses the title, original price, and deal price
                            already entered in the form on the left, plus the
                            details below.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                Dietary tags
                            </label>
                            <input
                                value={dietaryTags}
                                onChange={(e) => setDietaryTags(e.target.value)}
                                placeholder="Vegetarian, Halal, Gluten-free..."
                                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                Allergens
                            </label>
                            <input
                                value={allergens}
                                onChange={(e) => setAllergens(e.target.value)}
                                placeholder="Nuts, Dairy, Shellfish..."
                                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                Main ingredients
                            </label>
                            <input
                                value={mainIngredients}
                                onChange={(e) =>
                                    setMainIngredients(e.target.value)
                                }
                                placeholder="Chicken, rice, mixed vegetables..."
                                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                            />
                        </div>

                        <label className="flex items-center justify-between gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 cursor-pointer">
                            <span className="text-sm font-bold text-[#1E293B]">
                                This is a mystery bag
                            </span>
                            <input
                                type="checkbox"
                                checked={isMysteryBag}
                                onChange={(e) =>
                                    setIsMysteryBag(e.target.checked)
                                }
                                className="w-5 h-5 accent-[#FF6B00]"
                            />
                        </label>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAiModalOpen(false)}
                                className="flex-1 h-11 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1E293B] hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="flex-1 h-11 rounded-lg bg-[#FF6B00] disabled:bg-orange-300 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#e66000]"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {isGenerating ? "Generating..." : "Generate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
