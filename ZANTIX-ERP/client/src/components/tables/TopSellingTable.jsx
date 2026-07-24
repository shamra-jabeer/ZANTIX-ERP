function TopSellingTable({ products }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold mb-4">Top Selling Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="p-3">Product</th>
              <th className="p-3">Sold Quantity</th>
              <th className="p-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.name} className="border-b hover:bg-slate-50">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.sold}</td>
                <td className="p-3">{p.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TopSellingTable;
