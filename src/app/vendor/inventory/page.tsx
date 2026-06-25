'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Plus, HelpCircle, Image as ImageIcon, X, Sparkles, Loader2 } from 'lucide-react';
import VendorTopBar from '@/components/layout/VendorTopBar';
import { supabase } from '@/lib/supabase/client';
import { generateDealDescription } from '@/app/actions/generateDescription';

export default function VendorInventory() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [briefDescription, setBriefDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dietaryTags, setDietaryTags] = useState('');
  const [allergens, setAllergens] = useState('');
  const [mainIngredients, setMainIngredients] = useState('');
  const [isMysteryBag, setIsMysteryBag] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!title || !originalPrice || !dealPrice) {
      alert("Please fill in the Meal Title, Original Value, and Deal Price first!");
      return;
    }

    setIsGenerating(true);
    const result = await generateDealDescription({
      title,
      originalPrice: Number(originalPrice),
      dealPrice: Number(dealPrice),
      dietaryTags,
      allergens,
      mainIngredients,
      isMysteryBag
    });

    if (result.success) {
      setBriefDescription(result.briefDescription || '');
      setDetailedDescription(result.detailedDescription || '');
      setIsAiModalOpen(false);
    } else {
      alert("AI Generation failed. Check console or verify API key.");
      console.error(result.error);
    }
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const origP = Number(originalPrice) || 0;
    const dealP = Number(dealPrice) || 0;
    const discount = origP > 0 ? Math.round(((origP - dealP) / origP) * 100) : 0;

    // Fetch the auto-generated mock vendor from DB
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name')
      .limit(1)
      .single();

    if (vendorError || !vendorData) {
      setIsSubmitting(false);
      alert("No vendor found in database. Please run the seed script.");
      return;
    }

    const payload = {
      vendor_id: vendorData.id,
      title,
      vendor: vendorData.business_name, // Denormalized name
      campus: 'Main Campus',
      original_price: origP,
      deal_price: dealP,
      image: previewImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop&q=80',
      discount_percentage: discount,
      time_start: timeStart,
      time_end: timeEnd,
      category: 'Bakery',
      brief_description: briefDescription,
      detailed_description: detailedDescription,
      description: briefDescription, // fallback
      stock_count: quantity,
      duration_remaining: '02:00:00'
    };

    const { error } = await supabase.from('deals').insert(payload);
    setIsSubmitting(false);

    if (error) {
      alert("Failed to publish deal. Check console.");
      console.error(error);
    } else {
      router.push('/vendor/dashboard');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 pb-10 relative">
      <VendorTopBar title="List Surplus Inventory" />
      <div className="p-8 max-w-3xl mx-auto w-full">
        <p className="text-gray-500 mb-6">Quickly add excess daily items to the campus feed.</p>
        <form className="bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm space-y-8" onSubmit={handleSubmit}>
          
          {/* Image Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-2">Product Image</h3>
            <div 
              className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${previewImage ? 'border-[#FF6B00] bg-orange-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
              onClick={() => !previewImage && fileInputRef.current?.click()}
            >
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full shadow-md text-red-500 hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-[#FF6B00]">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or WEBP (Max 2MB)</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-2">Item Details</h3>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Meal / Bag Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Mystery Pastry Bag" 
                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Original Value (Ksh)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Ksh</span>
                  <input 
                    type="number" 
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="0.00" 
                    className="w-full h-11 pl-12 pr-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Deal Price (Ksh) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Ksh</span>
                  <input 
                    type="number" 
                    required 
                    value={dealPrice}
                    onChange={e => setDealPrice(e.target.value)}
                    placeholder="0.00" 
                    className="w-full h-11 pl-12 pr-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all" 
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Must be 50-70% off original value.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#E2E8F0] pb-2">
              <h3 className="text-lg font-bold text-[#1E293B]">Descriptions</h3>
              <button 
                type="button" 
                onClick={() => setIsAiModalOpen(true)}
                className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-fill with AI
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Brief Tagline (max 100 chars)</label>
              <textarea 
                value={briefDescription}
                onChange={e => setBriefDescription(e.target.value)}
                placeholder="A single, mouth-watering sentence..."
                className="w-full h-20 p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Detailed Description</label>
              <textarea 
                value={detailedDescription}
                onChange={e => setDetailedDescription(e.target.value)}
                placeholder="List exactly what's inside the meal or bag, along with dietary tags and allergens..."
                className="w-full h-32 p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all resize-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#1E293B] border-b border-[#E2E8F0] pb-2">Availability &amp; Collection</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Quantity Available <span className="text-red-500">*</span></label>
                <div className="flex items-center h-11 border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-11 h-full bg-[#F8FAFC] hover:bg-[#E2E8F0] flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >-</button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-full text-center outline-none bg-white text-sm" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-full bg-[#F8FAFC] hover:bg-[#E2E8F0] flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Collection Window <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    required
                    value={timeStart}
                    onChange={e => setTimeStart(e.target.value)}
                    className="flex-1 h-11 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all text-gray-600" 
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input 
                    type="time" 
                    required
                    value={timeEnd}
                    onChange={e => setTimeEnd(e.target.value)}
                    className="flex-1 h-11 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all text-gray-600" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button type="button" onClick={() => router.push('/vendor/dashboard')} className="px-6 py-2.5 border border-[#E2E8F0] rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#e66000] disabled:bg-orange-300 text-white rounded-lg font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> {isSubmitting ? 'Publishing...' : 'Publish Live to Campus Feed'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Pre-text Questions Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsAiModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-xl font-bold font-display text-gray-900">AI Description Generator</h3>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Provide a few details below to help our AI write an accurate and appetizing description. Leave anything blank if not applicable.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Main Ingredients</label>
                  <input 
                    type="text" 
                    value={mainIngredients}
                    onChange={e => setMainIngredients(e.target.value)}
                    placeholder="e.g. Rice, Chicken breasts, Vegetables" 
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Dietary Tags</label>
                  <input 
                    type="text" 
                    value={dietaryTags}
                    onChange={e => setDietaryTags(e.target.value)}
                    placeholder="e.g. Halal, Vegan, Vegetarian, Gluten-Free" 
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Allergens (if any)</label>
                  <input 
                    type="text" 
                    value={allergens}
                    onChange={e => setAllergens(e.target.value)}
                    placeholder="e.g. Contains Nuts, Dairy, Soy" 
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all" 
                  />
                </div>

                <div className="flex items-center gap-3 mt-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <input
                    type="checkbox"
                    id="mysteryBagToggle"
                    checked={isMysteryBag}
                    onChange={(e) => setIsMysteryBag(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="mysteryBagToggle" className="text-sm font-medium text-purple-900 cursor-pointer select-none">
                    This is a Mystery Bag (Hide exact ingredients)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAiModalOpen(false)} 
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Copy</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
