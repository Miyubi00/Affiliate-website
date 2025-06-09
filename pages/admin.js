import React, { useState, useEffect } from "react";
import { generateProductCode } from "../utils/utils";
import { useRouter } from "next/router";
import ProtectedRoute from "../utils/ProtectedRoute";
import { supabase } from "../utils/supabaseClient";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/solid";

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [link, setLink] = useState("");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const Katalog = () => {
    router.push("/");
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    if (!error) {
      setProducts(data);
      setHasMounted(true);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editIdFromUrl = urlParams.get("editId");

    if (editIdFromUrl && hasMounted && products.length > 0) {
      const product = products.find((p) => p.id.toString() === editIdFromUrl);
      if (product) {
        setTitle(product.title);
        setDescription(product.description);
        setImage(product.image);
        setLink(product.link);
        setEditId(product.id);
        setPreviewUrl(product.image);
      }
    }
  }, [hasMounted, products]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage("");
    setImageFile(null);
    setPreviewUrl("");
    setLink("");
    setEditId(null);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    // Auto crop 1:1 pakai canvas
    const croppedBlob = await autoCropToSquare(imageFile);

    const filename = `${Date.now()}-${imageFile.name}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filename, croppedBlob, {
        contentType: imageFile.type, // penting: supaya tipe file tetap valid
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    if (publicUrlError) {
      console.error("Supabase getPublicUrl error:", publicUrlError);
      return null;
    }

    return publicUrlData.publicUrl;
  };

  const autoCropToSquare = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result;
      };

      img.onload = () => {
        const minSize = Math.min(img.width, img.height);
        const offsetX = (img.width - minSize) / 2;
        const offsetY = (img.height - minSize) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = minSize;
        canvas.height = minSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw tanpa resize
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          minSize,
          minSize,
          0,
          0,
          minSize,
          minSize
        );

        // Compress (masih pakai JPEG dan quality 70%)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              console.error("Failed to crop/compress image.");
            }
          },
          "image/jpeg",
          0.7
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId === null && !imageFile) {
      setErrorMessage("Gambar produk wajib diupload.");
      setErrorModalOpen(true);
      return;
    }
    let imageUrl = image;

    if (imageFile) {
      const oldFilename = image.split("/").pop();
      if (oldFilename) {
        const { error: deleteError } = await supabase.storage
          .from("product-images")
          .remove([oldFilename]);
        if (deleteError) {
          console.error("Error deleting old image:", deleteError);
        }
      }

      const newImageUrl = await uploadImage();
      if (newImageUrl) {
        imageUrl = newImageUrl;
      }
    }

    if (editId !== null) {
      const { error } = await supabase
        .from("products")
        .update({ title, description, image: imageUrl, link })
        .eq("id", editId);

      if (!error) {
        await fetchProducts();
        resetForm();
        await router.push("/admin");
      }
    } else {
      const newProduct = {
        title,
        description,
        image: imageUrl,
        link,
        code: generateProductCode(Date.now()),
      };

      const { error } = await supabase.from("products").insert([newProduct]);

      if (!error) {
        await fetchProducts();
        resetForm();
        await router.push("/admin");
      }
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

  const handleDelete = async () => {
    if (deleteId === null) return;

    const { data: productData, error: fetchError } = await supabase
      .from("products")
      .select("image")
      .eq("id", deleteId)
      .single();

    if (fetchError) {
      console.error("Gagal ambil data produk:", fetchError);
      return;
    }

    const imageUrl = productData?.image;
    const filename = imageUrl?.split("/").pop();

    if (filename) {
      const { error: deleteImageError } = await supabase.storage
        .from("product-images")
        .remove([filename]);

      if (deleteImageError) {
        console.error("Gagal hapus gambar:", deleteImageError);
      }
    }

    const { error: deleteDbError } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteId);

    if (!deleteDbError) {
      await fetchProducts();
      closeDeleteModal();
      if (editId === deleteId) resetForm();
    } else {
      console.error("Gagal hapus produk dari database:", deleteDbError);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-10 px-4">
        <div className="flex justify-end p-4">
          <button
            onClick={handleLogout}
            className="mb-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Logout
          </button>

          <button
            onClick={Katalog}
            className="mb-4 ml-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Lihat Katalog
          </button>
        </div>
        <div className="max-w-3xl mx-auto">
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
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-300">Gambar Produk</label>
              <div className="relative border border-gray-600 rounded-lg bg-[#1e293b] p-4 flex items-center justify-center h-40">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="object-contain max-h-full max-w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl("");
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full p-1"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <PhotoIcon className="w-12 h-12 text-gray-500" />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setImageFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>
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

          {editId === null && (
            <>
              <h2 className="text-xl font-bold mt-10 mb-4">🗃️ Produk Tersimpan</h2>

              <input
                type="text"
                placeholder="Cari produk berdasarkan nama atau kode"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
              />

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {hasMounted &&
                  products
                    .filter((product) =>
                      `${product.title} ${product.code}`
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        className="bg-[#0f172a] border border-gray-700 rounded-xl p-4"
                      >
                        <div className="w-full aspect-square flex items-center justify-center mb-4">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-contain rounded-2xl"
                          />
                        </div>
                        <h3 className="font-bold text-lg mb-1 truncate">{product.title}</h3>
                        <p className="text-gray-400 text-sm mb-1 truncate">{product.description}</p>
                        <p className="text-gray-500 text-xs mb-2">Kode: {product.code}</p>
                        <button
                          onClick={() =>
                            window.open(`/admin?editId=${product.id}`, "_blank")
                          }
                          className="inline-block px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded mb-1 mr-2"
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

          {errorModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
              onClick={() => setErrorModalOpen(false)}
            >
              <div
                className="bg-[#1e293b] rounded-lg p-6 max-w-sm w-full text-center text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold">{errorMessage}</h3>
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
