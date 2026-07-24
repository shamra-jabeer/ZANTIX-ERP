import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getInvoices, updateInvoiceStatus } from "../utils/db";
import { LuFileText, LuSearch, LuPrinter, LuCheckCircle2, LuAlertCircle, LuEye } from "react-icons/lu";

function Orders() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = async () => {
    const data = await getInvoices();
    setInvoices(data);
  };

  useEffect(() => {
    loadInvoices();
    window.addEventListener("zantix-db-update", loadInvoices);
    window.addEventListener("storage", loadInvoices);

    return () => {
      window.removeEventListener("zantix-db-update", loadInvoices);
      window.removeEventListener("storage", loadInvoices);
    };
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Paid" ? "Pending" : "Paid";
    await updateInvoiceStatus(id, nextStatus);
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; line-height: 1.4; }
            .receipt { max-width: 400px; margin: 0 auto; border: 1px dashed #ccc; padding: 15px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 0; font-size: 22px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; }
            .meta { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
            .meta div { display: flex; justify-content: space-between; }
            table { width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 15px; }
            table th, table td { text-align: left; padding: 5px 0; }
            table th { border-bottom: 1px solid #333; }
            .total-row { border-top: 1px dashed #ccc; padding-top: 10px; font-weight: bold; font-size: 14px; text-align: right; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; border-top: 1px dashed #ccc; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              .receipt { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>ZANTIX ERP</h2>
              <p>Wholesale Stock & Order Engine</p>
              <p>Receipt / Invoice Statement</p>
            </div>
            <div class="meta">
              <div><span>Invoice Ref:</span> <span>${invoice.id}</span></div>
              <div><span>Date:</span> <span>${invoice.date}</span></div>
              <div><span>Client:</span> <span>${typeof invoice.customer === 'object' ? invoice.customer.shopName : invoice.customer}</span></div>
              <div><span>Settlement:</span> <span>${invoice.status}</span></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.name} (${item.size || '-'}) @ Rs. ${Number(item.price).toLocaleString()}</td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right;">Rs. ${(item.price * item.qty).toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="total-row">
              Grand Total: Rs. ${Number(invoice.total).toLocaleString()}
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Powered by Zantix ERP v1.0.0</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredInvoices = invoices.filter((invoice) =>
    [invoice.id, typeof invoice.customer === 'object' ? invoice.customer.shopName : invoice.customer].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Layout>
      <div className="w-full">
        {/* Header section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Sales Records & Log</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review generated retail invoices, toggle pending invoice collections, and trigger thermal receipt printouts.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Client or Invoice ID..."
                className="border border-slate-200 bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64 shadow-sm"
              />
              <LuSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px] text-left text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Billing Date</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4 text-right">Invoice Sum</th>
                  <th className="p-4 text-center">Settlement Status</th>
                  <th className="p-4 text-center">Action Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-650">{invoice.id}</td>
                    <td className="p-4 text-slate-500">{invoice.date}</td>
                    <td className="p-4 font-semibold text-slate-800">{typeof invoice.customer === 'object' ? invoice.customer.shopName : invoice.customer}</td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      Rs. {Number(invoice.total).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(invoice.id, invoice.status)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                          invoice.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                          invoice.status === "Paid" ? "bg-emerald-500" : "bg-amber-500"
                        }`} />
                        {invoice.status}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                          title="View items"
                        >
                          <LuEye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="p-1.5 text-blue-650 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                          title="Print thermal receipt"
                        >
                          <LuPrinter className="w-4 h-4" />
                          <span>Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">
                      No invoices matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Details Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">
                  Billing Details: {selectedInvoice.id}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div>
                    <span>Client Name:</span>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{typeof selectedInvoice.customer === 'object' ? selectedInvoice.customer.shopName : selectedInvoice.customer}</div>
                  </div>
                  <div>
                    <span>Date Issued:</span>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{selectedInvoice.date}</div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="p-3">Product Item</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="p-3 text-center">{item.qty} units</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            Rs. {(item.price * item.qty).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-800">Total Settlement Sum:</span>
                  <span className="text-xl font-extrabold text-blue-600">
                    Rs. {Number(selectedInvoice.total).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handlePrint(selectedInvoice)}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                >
                  <LuPrinter className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Orders;