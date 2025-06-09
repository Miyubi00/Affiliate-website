import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { generateProductCode } from "../utils/utils";
import { supabase } from "../utils/supabaseClient";

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">✨ Paimon Link ✨</h1>
        <p className="mb-6 text-gray-300 text-center">Temukan produk favorit Paimon!</p>

        <div className="flex justify-center mb-10">
          <input
            type="text"
            placeholder="Cari produk (nama / kode)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#0f172a] border border-gray-700 rounded-xl p-4 shadow-xl hover:shadow-blue-500/20 transition duration-300 flex flex-col"
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-40 sm:h-48 object-contain rounded-md mb-2"
              />
              <h2 className="text-left text-xs text-[16px] font-medium mb-4 truncate">{product.title}</h2>
              <button
                onClick={() => setSelectedProduct(product)}
                className="mb-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
              >
                Detail
              </button>
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
              >
                Beli Sekarang
              </a>
            </div>
          ))}
        </div>

        {/* Popup Detail */}
        {selectedProduct && (
          <div
            id="popup-backdrop"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md relative overflow-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-white text-xl font-bold"
                onClick={() => setSelectedProduct(null)}
              >
                X
              </button>
              <h2 className="text-xl font-bold mb-2 break-words">{selectedProduct.title}</h2>
<p className="text-gray-300 mb-2">Kode Produk: {selectedProduct.code}</p>
<p className="text-gray-400 break-words whitespace-pre-wrap">{selectedProduct.description}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
