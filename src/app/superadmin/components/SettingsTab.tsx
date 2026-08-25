import { motion } from 'motion/react';
import { Settings, ShieldAlert, Bell, Mail } from 'lucide-react';

export function SettingsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Platform Settings</h2>
            <p className="text-sm text-gray-500">Manage global configurations</p>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-bold text-[#1E293B]">Require KYC for Students</p>
                <p className="text-sm text-gray-500">Students must verify email before ordering</p>
              </div>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-bold text-[#1E293B]">Admin Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts for new vendor applications</p>
              </div>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-bold text-[#1E293B]">Support Email</p>
                <p className="text-sm text-gray-500">Contact email for platform issues</p>
              </div>
            </div>
            <input type="email" defaultValue="support@dealplate.com" className="h-9 px-3 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#FF6B00]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
