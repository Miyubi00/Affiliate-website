// components/FloatingButtons.js
import React, { useState } from 'react';
import { ShoppingCartIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function FloatingButtons({ handleLogout, Katalog }) { // Menerima handleLogout dan Katalog sebagai props
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const requestLogoutConfirmation = () => {
    setShowLogoutModal(true);
  };

  const confirmAndLogout = () => {
    handleLogout(); // Panggil fungsi logout yang diterima dari props
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-center space-y-4 z-50">
        {/* Tombol Katalog */}
        <button
          onClick={Katalog} // Katalog dipanggil langsung karena tidak butuh konfirmasi
          className="w-10 h-10 mb-2 rounded-full bg-[#F2C078] hover:bg-[#FFFECE] hover:text-gray-700 text-white flex items-center justify-center shadow-lg sm:w-13 sm:h-13"
        >
          <ShoppingCartIcon className="w-6 h-6" />
        </button>

        {/* Tombol Logout (memicu modal) */}
        <button
          onClick={requestLogoutConfirmation}
          className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-red-600 hover:bg-[#FFFECE] hover:text-gray-700 text-white flex items-center justify-center shadow-lg"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#E69DB8] rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-white-400">Konfirmasi Logout</h2>
            <p className="mb-6 text-white-400">Apakah Anda yakin ingin keluar?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={confirmAndLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}