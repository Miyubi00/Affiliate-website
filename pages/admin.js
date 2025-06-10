import React, { useState, useEffect } from "react";
import { generateProductCode } from "../utils/utils";
import { useRouter } from "next/router";
import ProtectedRoute from "../utils/ProtectedRoute";
import { supabase } from "../utils/supabaseClient";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/solid";
import FloatingButtons from "../utils/FloatingButtons";

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


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
      setEditId(null);

      if (!error) {
        await fetchProducts();
        resetForm();
        setIsEditModalOpen(false);
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
        <div className="min-h-screen bg-[#F1E7E7] text-white py-10 px-4">
          <FloatingButtons handleLogout={handleLogout} Katalog={Katalog} />
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-[#948979] text-center">
              🛠️Admin Panel
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nama Produk"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
                required
              />
              <textarea
                placeholder="Deskripsi Produk"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
                required
              ></textarea>
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-[#948979]">Gambar Produk</label>
                <div className="relative border border-gray-600 rounded-lg bg-[#FFC6C6] p-4 flex items-center justify-center h-40">
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
                      <PhotoIcon className="w-12 h-12 text-[#948979]" />
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
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#D76C82] hover:text-[#948979] hover:bg-[#FFFECE] text-white rounded-lg font-semibold"
              >
                {editId !== null ? "Simpan Perubahan" : "Tambahkan Produk"}
              </button>
              {editId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setEditId(null);
                  }}
                  className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold"
                >
                  Batal Edit
                </button>
              )}
            </form>

            {editId === null && (
              <>
                <h2 className="text-xl text-[#948979] font-bold mt-10 mb-4">🗃️ Produk Tersimpan</h2>

                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama atau kode"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
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
                          onClick={() => setSelectedProduct(product)}
                          className="cursor-pointer bg-[#E69DB8] border-yellow rounded-xl p-4 shadow-xl hover:shadow-yellow-500/20 transition duration-300 flex flex-col relative"
                        >
                          <div className="w-full aspect-square flex items-center justify-center mb-4">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-contain rounded-2xl"
                            />
                          </div>

                          <h2 className="text-white text-[16px] font-medium text-left leading-snug break-words mb-[60px]">
                            <span className="block sm:hidden">
                              {product.title.length > 20 ? `${product.title.slice(0, 20)}...` : product.title}
                            </span>
                            <span className="hidden sm:block">{product.title}</span>
                          </h2>

                          <div className="mt-5 absolute bottom-4 left-4 right-4">
                            <p className="text-white-400 text-sm truncate mb-1">{product.description}</p>
                            <p className="text-yellow-100 text-xs">Kode: {product.code}</p>
                          </div>
                        </div>
                      ))}
                </div>
              </>
            )}

            {selectedProduct && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedProduct(null)}
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
                  <h2 className="text-xl font-bold mb-2 break-words">{selectedProduct.title}</h2>
                  <p className="text-white-400 text-sm mb-2">{selectedProduct.description}</p>
                  <p className="text-yellow-300 mb-4 text-sm">Kode: {selectedProduct.code}</p>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setTitle(selectedProduct.title);
                        setDescription(selectedProduct.description);
                        setImage(selectedProduct.image);
                        setPreviewUrl(selectedProduct.image);
                        setLink(selectedProduct.link);
                        setEditId(selectedProduct.id); // jangan lupa ini juga
                        setIsEditModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#F2C078] hover:bg-[#FFFECE] hover:text-gray-700 text-white rounded-lg"
                    >
                      Edit Produk
                    </button>

                    <button
                      onClick={() => openDeleteModal(selectedProduct.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                    >
                      Hapus Produk
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isEditModalOpen && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="bg-[#E69DB8] rounded-xl p-6 w-full max-w-md overflow-auto max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-bold mb-4 text-white">Edit Produk</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nama Produk"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
                      required
                    />
                    <textarea
                      placeholder="Deskripsi Produk"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
                      required
                    ></textarea>
                    <div className="w-full">
                      <label className="block mb-2 text-sm font-medium text-[#948979]">Gambar Produk</label>
                      <div className="relative border border-gray-600 rounded-lg bg-[#FFC6C6] p-4 flex items-center justify-center h-40">
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
                            <PhotoIcon className="w-12 h-12 text-[#948979]" />
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full mb-2 py-2 bg-[#D76C82] hover:text-[#948979] hover:bg-[#FFFECE] text-white rounded-lg font-medium"
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsEditModalOpen(false);
                      }}
                      className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium"
                    >
                      Batal Edit
                    </button>
                  </form>
                </div>
              </div>
            )}

            {modalOpen && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={closeDeleteModal}
              >
                <div
                  className="bg-[#E69DB8] rounded-lg p-6 max-w-sm w-full"
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
