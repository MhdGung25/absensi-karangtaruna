import React from "react";
import { db } from "../firebase";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2 } from "lucide-react";

const AttendanceList = ({ peserta, startIndex }) => {

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "absensi", id), {
        status: newStatus
      });
    } catch {
      alert("Gagal update status");
    }
  };

  const updateTanggal = async (id, newDate) => {
    if (!newDate) return;
    try {
      await updateDoc(doc(db, "absensi", id), {
        tanggalRapat: newDate
      });
    } catch (error) {
      console.error(error);
    }
  };

  const hapus = async (id) => {
    if (window.confirm("Hapus data ini?")) {
      await deleteDoc(doc(db, "absensi", id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Hadir": return "bg-emerald-50 text-emerald-600";
      case "Izin": return "bg-amber-50 text-amber-600";
      case "Sakit": return "bg-blue-50 text-blue-600";
      case "Alfa": return "bg-rose-50 text-rose-600";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pt-20 md:pt-8 md:ml-64">

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-center w-14">No</th>
              <th className="px-6 py-3 text-left">Nama</th>
              <th className="px-6 py-3 text-center w-44">Tanggal</th>
              <th className="px-6 py-3 text-center w-40">Status</th>
              <th className="px-6 py-3 text-center w-20">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {peserta.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                
                <td className="px-4 py-4 text-center text-slate-400 font-medium">
                  {startIndex + index + 1}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.nama}`}
                      className="w-10 h-10 rounded-xl bg-slate-100 shrink-0"
                      alt="avatar"
                    />
                    <div>
                      <p className="font-semibold text-slate-700">
                        {item.nama}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.jabatan}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <input
                    type="date"
                    value={item.tanggalRapat || ""}
                    onChange={(e) => updateTanggal(item.id, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </td>

                <td className="px-6 py-4 text-center">
                  <select
                    value={item.status || "Alfa"}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black ${getStatusColor(item.status)}`}
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => hapus(item.id)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARD ================= */}
      <div className="md:hidden space-y-4">
        {peserta.map((item, index) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.nama}`}
                  className="w-12 h-12 rounded-xl bg-slate-100 shrink-0"
                  alt="avatar"
                />
                <div>
                  <p className="font-semibold text-slate-800">
                    {startIndex + index + 1}. {item.nama}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.jabatan}
                  </p>
                </div>
              </div>

              <button
                onClick={() => hapus(item.id)}
                className="text-slate-300 hover:text-rose-600 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Tanggal</p>
                <input
                  type="date"
                  value={item.tanggalRapat || ""}
                  onChange={(e) => updateTanggal(item.id, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <p className="text-slate-400 text-xs mb-1">Status</p>
                <select
                  value={item.status || "Alfa"}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg font-semibold border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black ${getStatusColor(item.status)}`}
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alfa">Alfa</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AttendanceList;
