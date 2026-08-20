'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Building2, Loader2, LogOut, Lock, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import VendorTopBar from '@/components/layout/VendorTopBar';

interface VendorProfileForm {
  business_name: string;
  contact_name: string;
  phone: string;
  address: string;
  campus_proximity: string;
  email: string;
}

const emptyForm: VendorProfileForm = {
  business_name: '',
  contact_name: '',
  phone: '',
  address: '',
  campus_proximity: '',
  email: '',
};

export default function VendorSettings() {
  const router = useRouter();
  const [form, setForm] = useState<VendorProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        .select('business_name, contact_name, phone, address, campus_proximity, email')
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
