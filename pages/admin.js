import React, { useState, useEffect } from "react";
import { generateProductCode } from "./utils";
import { useRouter } from "next/router";
import ProtectedRoute from "./ProtectedRoute";

export default function AdminPage() {
    const handleLogout = () => {
  localStorage.removeItem("isLoggedIn");
  router.push("/login");
};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [products, setProducts] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);

  // Untuk edit
  const [editId, setEditId] = useState(null);
  const router = useRouter();

  // Untuk modal konfirmasi hapus
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin-products");
    if (saved) {
      setProducts(JSON.parse(saved));
    }
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editIdFromUrl = urlParams.get("editId");

    if (editIdFromUrl && hasMounted && products.length > 0) {
      const product = products.find(p => p.id.toString() === editIdFromUrl);
      if (product) {
        setTitle(product.title);
        setDescription(product.description);
        setImage(product.image);
        setLink(product.link);
        setEditId(product.id);
      }
    }
  }, [hasMounted, products]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage("");
    setLink("");
    setEditId(null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (editId !== null) {
    // Edit mode
    const updatedProducts = products.map((product) =>
      product.id === editId
        ? { ...product, title, description, image, link }
        : product
    );
    setProducts(updatedProducts);
    localStorage.setItem("admin-products", JSON.stringify(updatedProducts));
    resetForm();
    await router.push("/admin"); // tunggu redirect selesai
  } else {
    // Tambah mode
    const newProduct = {
      id: Date.now(),
      title,
      description,
      image,
      link,
      code: generateProductCode(Date.now()),
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    localStorage.setItem("admin-products", JSON.stringify(updatedProducts));
    resetForm();
    await router.push("/admin"); // tunggu redirect selesai
  }
};

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    const filtered = products.filter((product) => product.id !== deleteId);
    setProducts(filtered);
    localStorage.setItem("admin-products", JSON.stringify(filtered));
    closeDeleteModal();
    if (editId === deleteId) resetForm();
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button
  onClick={handleLogout}
  className="mb-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
>
  Logout
</button>

        <h1 className="text-3xl font-bold mb-6 text-center">
  🛠️ {editId !== null ? "Edit Produk" : "Admin Panel"}
</h1>


        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nama Produk"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
            required
          />
          <textarea
            placeholder="Deskripsi Produk"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
            required
          ></textarea>
          <input
            type="text"
            placeholder="Link Gambar (URL)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
            required
          />
          <input
            type="text"
            placeholder="Link Pembelian"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
            required
          />
          <button
            type="submit"
            
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold"
          >
            {editId !== null ? "Simpan Perubahan" : "Tambahkan Produk"}
          </button>
          {editId !== null && (
            <button
  type="button"
  onClick={() => {
    resetForm();
    router.push("/admin");
  }}
              className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold"
            >
              Batal Edit
            </button>
          )}
        </form>

        {/* Hanya tampilkan daftar produk jika tidak sedang edit dari URL */}
        {editId === null && (
          <>
            <h2 className="text-xl font-bold mt-10 mb-4">🗃️ Produk Tersimpan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasMounted &&
                products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#0f172a] border border-gray-700 rounded-xl p-4"
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-32 object-contain rounded mb-2"
                    />
                    <h3 className="font-bold text-lg mb-1 truncate">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1 truncate">
                      {product.description}
                    </p>
                    <p className="text-gray-500 text-xs mb-2">
                      Kode: {product.code}
                    </p>
                    <button
                      onClick={() =>
                        window.open(`/admin?editId=${product.id}`, "_blank")
                      }
                      className="inline-block px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded mr-2"
                    >
                      Edit Produk
                    </button>
                    <button
                      onClick={() => openDeleteModal(product.id)}
                      className="inline-block px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      Hapus Produk
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Modal konfirmasi hapus */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={closeDeleteModal}
          >
            <div
              className="bg-[#1e293b] rounded-lg p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-white">
                Apakah kamu yakin untuk hapus produk ini?
              </h3>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
