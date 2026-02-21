import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import {
  Trash2,
  Archive,
  Calendar,
  Users,
  AlertTriangle,
  Loader2,
  MapPin,
} from "lucide-react";

const AttendanceArchive = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [absensiMap, setAbsensiMap] = useState({});
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fungsi helper untuk merapikan teks
  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const q = query(collection(db, "kegiatan"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kegiatan = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setKegiatanList(kegiatan);
      setFetching(false);

      kegiatan.forEach((k) => {
        const absensiRef = collection(db, "kegiatan", k.id, "absensi");
        onSnapshot(absensiRef, (snap) => {
          setAbsensiMap((prev) => ({
            ...prev,
            [k.id]: snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
          }));
        });
      });
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!selectedDelete) return;
    try {
      setLoadingDelete(true);
      const absensiRef = collection(db, "kegiatan", selectedDelete.id, "absensi");
      const absensiSnap = await getDocs(absensiRef);
      const deletePromises = absensiSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "kegiatan", selectedDelete.id));
      setSelectedDelete(null);
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data!");
    } finally {
      setLoadingDelete(false);
    }
  };

  const formatTanggalLengkap = (timestamp) => {
    if (!timestamp?.toDate) return "Tanpa Tanggal";
    const date = timestamp.toDate();
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-24 pb-20 px-4 md:px-8 md:ml-64 transition-all">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm text-slate-600">
              <Archive size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Arsip Absensi</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Riwayat Kegiatan Unit 18</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm flex items-center gap-2 w-fit">
            <Users size={14} className="text-slate-400" />
            Total: {kegiatanList.length} Agenda
          </div>
        </div>

        {kegiatanList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Archive className="mx-auto text-slate-200 mb-3" size={48} />
            <p className="text-slate-400 font-semibold text-sm">Belum ada arsip yang tersimpan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {kegiatanList.map((kegiatan) => {
              const absensiData = absensiMap[kegiatan.id] || [];
              const stats = {
                Hadir: absensiData.filter((a) => a.status === "Hadir").length,
                Izin: absensiData.filter((a) => a.status === "Izin").length,
                Sakit: absensiData.filter((a) => a.status === "Sakit").length,
                Alpha: absensiData.filter((a) => a.status === "Tanpa Keterangan" || a.status === "Alpha").length,
              };

              return (
                <div key={kegiatan.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
                        <Calendar size={18} />
                      </div>
                      <div>
                        {/* PERBAIKAN: Fungsi toTitleCase digunakan di sini */}
                        <h2 className="text-md font-bold text-slate-800 uppercase leading-tight">
                          {toTitleCase(kegiatan.nama)}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-slate-500 font-medium">
                            {formatTanggalLengkap(kegiatan.createdAt)}
                          </p>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold italic">
                            <MapPin size={10} />
                            {kegiatan.lokasi || "Lokasi tidak diset"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDelete(kegiatan)}
                      className="flex items-center justify-center gap-2 bg-white border border-rose-100 text-rose-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 p-4 bg-white">
                    <StatBox label="Hadir" value={stats.Hadir} color="emerald" />
                    <StatBox label="Izin" value={stats.Izin} color="amber" />
                    <StatBox label="Sakit" value={stats.Sakit} color="blue" />
                    <StatBox label="Alpha" value={stats.Alpha} color="rose" />
                  </div>

                  <div className="px-4 pb-5">
                    <div className="overflow-x-auto rounded-xl border border-slate-100 hide-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="py-3 px-3 w-10 text-center">#</th>
                            <th className="py-3 px-3">Nama</th>
                            <th className="py-3 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {absensiData.map((a, index) => (
                            <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3 text-[10px] font-bold text-slate-300 text-center">{index + 1}</td>
                              <td className="py-3 px-3">
                                {/* PERBAIKAN: Fungsi toTitleCase digunakan di sini */}
                                <p className="text-xs font-bold text-slate-700 uppercase leading-none">
                                  {toTitleCase(a.nama)}
                                </p>
                                <p className="text-[8px] text-slate-400 uppercase mt-1 italic tracking-tighter">{a.jabatan || "Anggota"}</p>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${getStatusColor(a.status)}`}>
                                  {a.status === "Tanpa Keterangan" ? "ALPHA" : a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[99] p-6">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-tight">Hapus Arsip?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Data absensi kegiatan <span className="font-bold text-slate-700">"{toTitleCase(selectedDelete.nama)}"</span> akan dihapus selamanya.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-rose-600 transition active:scale-95 shadow-lg shadow-rose-100"
              >
                {loadingDelete ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Ya, Hapus Sekarang"}
              </button>
              <button
                onClick={() => setSelectedDelete(null)}
                className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color }) => {
  const themes = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className={`p-2 rounded-xl text-center border ${themes[color]}`}>
      <p className="text-[8px] font-black uppercase tracking-tighter opacity-70 mb-0.5">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "Hadir":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "Izin":
      return "bg-amber-50 text-amber-600 border-amber-100";
    case "Sakit":
      return "bg-blue-50 text-blue-600 border-blue-100";
    default:
      return "bg-rose-50 text-rose-600 border-rose-100";
  }
};

export default AttendanceArchive;