fetch("http://localhost:5000/api/invoices", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer: { shopName: "Test 2", ownerName: "Unknown", contactNumber: "", address: "", email: "" },
    date: "2026-07-10",
    items: [{ productId: 1, category: "Toys", brand: "Lego", name: "Teddy Bear", size: "Standard", price: 2500, qty: 1 }],
    total: 2500,
    status: "Paid"
  })
}).then(r => r.text()).then(console.log);
