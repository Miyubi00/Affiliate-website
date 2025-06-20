import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

const baseProducts = [];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [extraProducts, setExtraProducts] = useState([]);

  // Ganti load dari Supabase
  const loadProductsFromSupabase = async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Gagal memuat produk dari Supabase:", error.message);
      return;
    }
    setExtraProducts(data || []);
  };

  useEffect(() => {
    const handleBack = () => {
      if (selectedProduct) {
        setSelectedProduct(null); // Tutup modal
        window.history.pushState(null, "", window.location.href); // Tambah state dummy lagi
      }
    };

    window.history.pushState(null, "", window.location.href); // Tambah state dummy saat modal dibuka
    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [selectedProduct]);


  useEffect(() => {
    loadProductsFromSupabase();

    // Optional: Re-fetch setiap 30 detik
    const interval = setInterval(() => {
      loadProductsFromSupabase();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const products = useMemo(() => {
    const combined = [...baseProducts, ...extraProducts];
    return combined; // tidak generate code manual lagi
  }, [extraProducts]);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleBackdropClick = (e) => {
    if (e.target.id === "popup-backdrop") {
      setSelectedProduct(null);
    }
  };

  function InfoButton({ onClick }) {
    return (
      <button
        onClick={onClick}>
        <InformationCircleIcon className="cursor-pointer ml-1 w-11 h-11" />
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#F1E7E7] text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-[#948979] text-center">✨ Paimon Link ✨</h1>
        <p className="mb-6 text-[#948979] text-center">Temukan produk favorit Paimon!</p>

        <div className="flex justify-center mb-10">
          <input
            type="text"
            placeholder="Cari produk (nama / kode)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="cursor-pointer bg-[#E69DB8] border border-yellow rounded-xl p-4 shadow-xl hover:shadow-yellow-500/20 transition duration-300 flex flex-col"
            >
              <div className="w-full aspect-square flex items-center justify-center mb-4">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>

              <h2 className="text-white text-[16px] font-medium text-left leading-snug break-words mb-4">
                <span className="block sm:hidden">
                  {product.title.length > 20 ? `${product.title.slice(0, 20)}...` : product.title}
                </span>
                <span className="hidden sm:block">
                  {product.title}
                </span>
              </h2>

              <div className="flex items-center justify-between mt-auto">
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#D76C82] hover:text-[#948979] hover:bg-[#FFFECE] text-white rounded-lg w-full text-center font-semibold"
                >
                  Beli
                </a>
                <InfoButton onClick={() => setSelectedProduct(product)} />
              </div>
            </div>
          ))}
        </div>

        {/* Popup Detail */}
        {selectedProduct && (
          <div
            id="popup-backdrop"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-[#E69DB8] rounded-xl p-6 w-full max-w-md relative overflow-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="mb-5 w-full h-full object-contain rounded-md"
              />
              <h2 className="text-xl font-bold mb-2 break-words text-white">
                {selectedProduct.title}
              </h2>
              <p className="text-yellow-300 mb-2 font-medium">
                Kode Produk: {selectedProduct.code}
              </p>
              <p className="text-white break-words whitespace-pre-wrap">
                {selectedProduct.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
