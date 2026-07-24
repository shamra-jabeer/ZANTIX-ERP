function LowStockTable({ items }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold mb-4">Inventory Low Stock Alerts</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.sku} className="border-b hover:bg-slate-50">
                <td className="p-3">{it.product}</td>
                <td className="p-3">{it.sku}</td>
                <td className="p-3">{it.category}</td>
                <td className="p-3">{it.stock}</td>
                <td className="p-3">
                  <span className="px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700">Low Stock</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LowStockTable;
