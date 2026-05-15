import { useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  X,
  ShoppingCart,
  Loader2,
  Star,
  Search,
  Pencil,
} from "lucide-react";
import { useShoppingList } from "../hooks/useShoppingList";
import { toast } from "../lib/toast";
import { CATEGORIES } from "../lib/products";

const UNITS = [
  { value: "u", label: "Unidades" },
  { value: "g", label: "Gramos" },
  { value: "kg", label: "Kilos" },
  { value: "L", label: "Litros" },
  { value: "ml", label: "Mililitros" },
];

export default function ShoppingListPage({ userId }) {
  const {
    items,
    loading,
    addItem,
    deleteItem,
    toggleComplete,
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    catalogProducts,
    addProductToCatalog,
    removeProductFromCatalog,
    updateProductInCatalog,
  } = useShoppingList(userId);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    quantity: 1,
    unit: "u",
    category: "Otros",
    price: "",
    notes: "",
  });
  const [filterCompleted, setFilterCompleted] = useState("pending");
  const [catalogTab, setCatalogTab] = useState("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "Otros",
    price: "",
    size: "",
    unit: "u",
  });
  const [addFromCatalogModal, setAddFromCatalogModal] = useState(null);
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    category: "Otros",
    price: "",
    size: "",
    unit: "u",
  });

  const completed = items.filter((i) => i.completed);
  const pending = items.filter((i) => !i.completed);
  const displayed =
    filterCompleted === "pending"
      ? pending
      : filterCompleted === "completed"
        ? completed
        : items;

  const totalPrice = items.reduce((sum, i) => {
    if (i.completed) return sum;
    return sum + (i.price ? parseFloat(i.price) * (i.quantity || 1) : 0);
  }, 0);

  const totalPaid = items.reduce((sum, i) => {
    if (!i.completed) return sum;
    return sum + (i.price ? parseFloat(i.price) * (i.quantity || 1) : 0);
  }, 0);

  const filteredCatalog =
    catalogTab === "favorites"
      ? favorites.filter((p) =>
          p.name.toLowerCase().includes(catalogSearch.toLowerCase()),
        )
      : catalogProducts.filter((p) =>
          p.name.toLowerCase().includes(catalogSearch.toLowerCase()),
        );

  async function handleAddItem(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast("Por favor ingresa el nombre del item", "error");
      return;
    }
    const result = await addItem({
      name: formData.name.trim(),
      brand: formData.brand.trim() || null,
      quantity: formData.quantity || 1,
      unit: formData.unit,
      category: formData.category,
      price: formData.price ? parseFloat(formData.price) : null,
      notes: formData.notes.trim() || null,
    });
    if (!result?.error) {
      toast("Item agregado a la lista");
      setFormData({
        name: "",
        brand: "",
        quantity: 1,
        unit: "u",
        category: "Otros",
        price: "",
        notes: "",
      });
      setFormOpen(false);
    } else {
      toast(result.error, "error");
    }
  }

  function handleAddProductToCatalog(e) {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      toast("Por favor ingresa el nombre del producto", "error");
      return;
    }
    const product = {
      name: newProduct.name.trim(),
      brand: newProduct.brand.trim() || null,
      category: newProduct.category,
      price: newProduct.price ? parseFloat(newProduct.price) : null,
      size: newProduct.size ? parseFloat(newProduct.size) : null,
      unit: newProduct.unit,
    };
    addProductToCatalog(product);
    toast('"' + product.name + '" agregado al catalogo');
    setNewProduct({
      name: "",
      brand: "",
      category: "Otros",
      price: "",
      size: "",
      unit: "u",
    });
    setShowAddProductForm(false);
  }

  function handleAddFromCatalog(product) {
    setAddFromCatalogModal(product);
    setQuickAddQuantity(1);
  }

  function handleStartEdit(product) {
    setEditingProduct(product.name);
    setEditForm({
      name: product.name,
      brand: product.brand || "",
      category: product.category || "Otros",
      price: product.price != null ? String(product.price) : "",
      size: product.size != null ? String(product.size) : "",
      unit: product.unit || "u",
    });
  }

  function handleSaveEdit(e, oldName) {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast("El nombre no puede estar vacio", "error");
      return;
    }
    const updated = {
      name: editForm.name.trim(),
      brand: editForm.brand.trim() || null,
      category: editForm.category,
      price: editForm.price ? parseFloat(editForm.price) : null,
      size: editForm.size ? parseFloat(editForm.size) : null,
      unit: editForm.unit,
    };
    updateProductInCatalog(oldName, updated);
    toast('"' + updated.name + '" actualizado');
    setEditingProduct(null);
  }

  async function handleQuickAddFromCatalog() {
    if (!addFromCatalogModal) return;
    const result = await addItem({
      name: addFromCatalogModal.name,
      brand: addFromCatalogModal.brand || null,
      quantity: quickAddQuantity,
      size: addFromCatalogModal.size || null,
      unit: addFromCatalogModal.unit || "u",
      category: addFromCatalogModal.category || "Otros",
      price: addFromCatalogModal.price || null,
      notes: null,
    });
    if (!result?.error) {
      toast(
        '"' + addFromCatalogModal.name + '" x' + quickAddQuantity + " agregado",
      );
      setAddFromCatalogModal(null);
      setQuickAddQuantity(1);
    } else {
      toast(result.error, "error");
    }
  }

  async function handleDeleteItem(id) {
    const result = await deleteItem(id);
    if (result?.error) toast(result.error, "error");
    else toast("Item eliminado");
  }

  async function handleToggleComplete(id, isCompleted) {
    const result = await toggleComplete(id, isCompleted);
    if (result?.error) toast(result.error, "error");
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 shadow-sm flex justify-center">
        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Catalogo */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sticky top-4">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setCatalogTab("all");
                  setCatalogSearch("");
                }}
                className={
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors " +
                  (catalogTab === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")
                }
              >
                Catalogo
              </button>
              <button
                onClick={() => setCatalogTab("favorites")}
                className={
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 " +
                  (catalogTab === "favorites"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")
                }
              >
                <Star className="w-4 h-4" />
                <span>{favorites.length}</span>
              </button>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Product Form */}
            {catalogTab === "all" && (
              <div className="mb-4">
                {!showAddProductForm ? (
                  <button
                    onClick={() => setShowAddProductForm(true)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Producto
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddProductToCatalog}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Marca (opcional)"
                      value={newProduct.brand}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, brand: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Contenido del envase
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Ej: 1, 500, 2"
                          value={newProduct.size}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              size: e.target.value,
                            })
                          }
                          step="0.01"
                          min="0"
                          className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={newProduct.unit}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              unit: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="Precio por envase (opcional)"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddProductForm(false)}
                        className="flex-1 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Catalog Items */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredCatalog.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4">
                  {catalogSearch
                    ? "No hay productos"
                    : catalogTab === "favorites"
                      ? "Sin favoritos aun"
                      : "El catalogo esta vacio"}
                </p>
              ) : (
                filteredCatalog.map((product) => {
                  const fav = isFavorite(product.name);
                  return (
                    <div key={product.name + "-" + product.category}>
                      {editingProduct === product.name ? (
                        <form
                          onSubmit={(e) => handleSaveEdit(e, product.name)}
                          className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 space-y-2"
                        >
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            placeholder="Nombre"
                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.brand}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                brand: e.target.value,
                              })
                            }
                            placeholder="Marca (opcional)"
                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Contenido del envase
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                placeholder="Ej: 1, 500"
                                value={editForm.size}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    size: e.target.value,
                                  })
                                }
                                step="0.01"
                                min="0"
                                className="px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <select
                                value={editForm.unit}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    unit: e.target.value,
                                  })
                                }
                                className="px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {UNITS.map((u) => (
                                  <option key={u.value} value={u.value}>
                                    {u.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Precio"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  price: e.target.value,
                                })
                              }
                              step="0.01"
                              min="0"
                              className="px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={editForm.category}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  category: e.target.value,
                                })
                              }
                              className="px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(null)}
                              className="flex-1 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                          <button
                            onClick={() => handleAddFromCatalog(product)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                              {product.name}
                              {product.brand ? (
                                <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">
                                  {product.brand}
                                </span>
                              ) : null}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                              <span>{product.category}</span>
                              {product.size ? (
                                <span>
                                  · {product.size} {product.unit}
                                </span>
                              ) : product.unit && product.unit !== "u" ? (
                                <span>· {product.unit}</span>
                              ) : null}
                              {product.price ? (
                                <>
                                  <span>-</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    ${parseFloat(product.price).toFixed(2)}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              if (fav) {
                                removeFavorite(product.name);
                                toast("Eliminado de favoritos");
                              } else {
                                addFavorite(product);
                                toast("Agregado a favoritos");
                              }
                            }}
                            className={
                              "flex-shrink-0 p-2 rounded-lg transition-colors " +
                              (fav
                                ? "text-amber-500 bg-amber-50 dark:bg-amber-950"
                                : "text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950")
                            }
                          >
                            <Star
                              className="w-4 h-4"
                              fill={fav ? "currentColor" : "none"}
                            />
                          </button>

                          {catalogTab === "all" && (
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {catalogTab === "all" && (
                            <button
                              onClick={() => {
                                removeProductFromCatalog(product.name);
                                toast("Producto eliminado del catalogo");
                              }}
                              className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Mi Lista */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Lista de Compras
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(true)}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Total Items
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {items.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                  Pendientes
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {pending.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                  A pagar
                </p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  ${totalPrice.toFixed(0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950">
                <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">
                  Pagado
                </p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                  ${totalPaid.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Add Item Form manual */}
          {formOpen && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  Agregar Item
                </h3>
                <button
                  onClick={() => setFormOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddItem} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Marca (opcional)"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                    min="0.01"
                    step="0.01"
                    className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Precio (opcional)"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    step="0.01"
                    className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Notas (opcional)"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["pending", "completed", "all"].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterCompleted(filter)}
                className={
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                  (filterCompleted === filter
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600")
                }
              >
                {filter === "pending"
                  ? "Pendientes (" + pending.length + ")"
                  : filter === "completed"
                    ? "Completados (" + completed.length + ")"
                    : "Todos"}
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {displayed.length === 0 ? (
              <div className="p-8 text-center">
                {items.length === 0 ? (
                  <>
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">
                      La lista esta vacia
                    </p>
                    <p className="text-slate-300 text-xs mt-1">
                      Agrega items o usa el catalogo de la izquierda
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">
                    No hay items con este filtro
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {displayed.map((item) => (
                  <div
                    key={item.id}
                    className={
                      "p-4 flex items-center gap-3 transition-opacity " +
                      (item.completed ? "opacity-60" : "")
                    }
                  >
                    <button
                      onClick={() =>
                        handleToggleComplete(item.id, item.completed)
                      }
                      className={
                        "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors " +
                        (item.completed
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-emerald-500")
                      }
                    >
                      {item.completed && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={
                          "font-medium text-sm " +
                          (item.completed
                            ? "text-slate-400 dark:text-slate-500 line-through"
                            : "text-slate-800 dark:text-slate-100")
                        }
                      >
                        {item.name}
                        {item.brand ? (
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
                            {item.brand}
                          </span>
                        ) : null}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                          {item.category}
                        </span>
                        {item.quantity ? (
                          <span>
                            {item.size
                              ? item.quantity +
                                " x " +
                                item.size +
                                " " +
                                (item.unit || "u")
                              : item.quantity + " " + (item.unit || "u")}
                          </span>
                        ) : null}
                        {item.notes ? (
                          <span className="italic">{item.notes}</span>
                        ) : null}
                      </div>
                    </div>

                    {item.price ? (
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          $
                          {(
                            parseFloat(item.price) * (item.quantity || 1)
                          ).toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-400">
                          ${parseFloat(item.price).toFixed(0)}/
                          {item.unit || "u"}
                        </p>
                      </div>
                    ) : null}

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Quick Add from Catalog */}
      {addFromCatalogModal ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              Agregar {addFromCatalogModal.name}
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                    Categoria
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {addFromCatalogModal.category}
                  </p>
                </div>
                {addFromCatalogModal.brand ? (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      Marca
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {addFromCatalogModal.brand}
                    </p>
                  </div>
                ) : null}
                {addFromCatalogModal.size ? (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      Contenido
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {addFromCatalogModal.size}{" "}
                      {addFromCatalogModal.unit || "u"}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                    Unidad
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {UNITS.find((u) => u.value === addFromCatalogModal.unit)
                      ?.label || "Unidades"}
                  </p>
                </div>
              </div>

              {addFromCatalogModal.price ? (
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Precio unitario
                  </p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(addFromCatalogModal.price).toFixed(2)}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                  Cantidad (
                  {UNITS.find((u) => u.value === addFromCatalogModal.unit)
                    ?.label || "Unidades"}
                  )
                </label>
                <input
                  type="number"
                  value={quickAddQuantity}
                  onChange={(e) =>
                    setQuickAddQuantity(
                      Math.max(0.01, parseFloat(e.target.value) || 1),
                    )
                  }
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {addFromCatalogModal.price ? (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    $
                    {(
                      parseFloat(addFromCatalogModal.price) * quickAddQuantity
                    ).toFixed(2)}
                  </p>
                </div>
              ) : null}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setAddFromCatalogModal(null);
                    setQuickAddQuantity(1);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleQuickAddFromCatalog}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
