import { motion } from 'motion/react';
import { Settings, Clock } from 'lucide-react';

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

        <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl border border-dashed border-[#E2E8F0] rounded-lg bg-gray-50/50">
          <Clock className="w-8 h-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-bold text-[#1E293B] mb-2">Global Settings Coming Soon</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Platform-wide configuration (like pausing new vendor applications or toggling mandatory KYC) will be available in a future update. 
          </p>
          <p className="text-xs text-[#FF6B00] font-semibold mt-4">
            Note: To reinstate (unrevoke) a user, locate their revoked application in the Student KYC or Vendors tab and click "Reinstate Access".
          </p>
        </div>
      </div>
    </motion.div>
  );
}
