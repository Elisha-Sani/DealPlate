'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Building2, Camera, Loader2, LogOut, Lock, Save, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import VendorTopBar from '@/components/layout/VendorTopBar';

interface VendorProfileForm {
  business_name: string;
  contact_name: string;
  phone: string;
  address: string;
  campus_proximity: string;
  email: string;
  logo_url: string | null;
}

const emptyForm: VendorProfileForm = {
  business_name: '',
  contact_name: '',
  phone: '',
  address: '',
  campus_proximity: '',
  email: '',
  logo_url: null,
};

export default function VendorSettings() {
  const router = useRouter();
  const [form, setForm] = useState<VendorProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [logoStatus, setLogoStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      supabase
        .from('vendors')
        .select('business_name, contact_name, phone, address, campus_proximity, email, logo_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setForm(data as VendorProfileForm);
          setIsLoading(false);
        });
    });
  }, []);

  const updateField = (key: keyof VendorProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ text: 'Your session expired — please sign in again.', type: 'error' });
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('vendors')
      .update({
        business_name: form.business_name,
        contact_name: form.contact_name,
        phone: form.phone,
        address: form.address,
        campus_proximity: form.campus_proximity,
      })
      .eq('id', user.id);

    setIsSaving(false);
    setMessage(
      error
        ? { text: error.message, type: 'error' }
        : { text: 'Business profile updated.', type: 'success' }
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      setPasswordMessage({ text: error.message, type: 'error' });
      return;
    }

    setNewPassword('');
    setPasswordMessage({ text: 'Password updated.', type: 'success' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/vendor/sign-in');
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2_000_000) {
      setLogoStatus('Use an image under 2MB.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setLogoStatus('Uploading...');
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);

      const { error: dbError } = await supabase.from('vendors').update({ logo_url: publicUrl }).eq('id', user.id);
      if (dbError) throw dbError;

      setForm((prev) => ({ ...prev, logo_url: publicUrl }));
      setLogoStatus('Logo updated.');
    } catch (error) {
      console.error(error);
      setLogoStatus('Could not upload logo. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 pb-10">
      <VendorTopBar title="Settings" />
      <div className="p-8 max-w-3xl w-full mx-auto space-y-6">
        <section className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col items-center text-center">
          <div className="relative mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Business logo"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-opacity group-hover:opacity-80"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#1E293B]/5 border-4 border-white shadow-md flex items-center justify-center text-[#1E293B]/30 group-hover:opacity-80 transition-opacity">
                <Store className="w-9 h-9" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-white border border-[#F3F4F6] rounded-full p-2 text-[#FF6B00] hover:bg-[#FFF8F6] transition-colors shadow-sm active:scale-90 z-10"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          {logoStatus && <p className="text-xs font-semibold text-[#FF6B00]">{logoStatus}</p>}
          <p className="text-xs text-gray-400 mt-1">Tap to change your business logo</p>
        </section>

        <section className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="w-9 h-9 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#1E293B] leading-tight">Business Profile</h2>
              <p className="text-xs text-gray-400">Keep your storefront details up to date.</p>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-sm font-semibold border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Business Name</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Contact Person</label>
                <input
                  required
                  value={form.contact_name}
                  onChange={(e) => updateField('contact_name', e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Phone</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Physical Address</label>
              <input
                required
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Campus Proximity</label>
              <input
                required
                value={form.campus_proximity}
                onChange={(e) => updateField('campus_proximity', e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Business Email</label>
              <input
                disabled
                value={form.email}
                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1.5">Contact support to change your login email.</p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 bg-[#FF6B00] disabled:bg-orange-300 text-white rounded-lg font-bold hover:bg-[#e66000] flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="w-9 h-9 rounded-lg bg-[#1E293B]/5 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#1E293B]" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#1E293B] leading-tight">Change Password</h2>
              <p className="text-xs text-gray-400">Update your login password.</p>
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`rounded-lg p-3 text-sm font-semibold border ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex gap-3">
            <input
              type="password"
              required
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isChangingPassword}
              className="h-11 px-5 bg-[#1E293B] disabled:opacity-60 text-white rounded-lg font-bold hover:bg-[#334155] shrink-0"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </button>
          </form>
        </section>

        <button
          onClick={handleSignOut}
          className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-[#5a4136] font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
        >
          <LogOut className="w-4 h-4 text-[#E11D48]" />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
}
