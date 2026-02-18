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
  Loader2 
} from "lucide-react";

const AttendanceArchive = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [absensiMap, setAbsensiMap] = useState({});
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ================= TITLE CASE FORMATTER =================
  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // ================= FETCH DATA KEGIATAN & ABSENSI =================
  useEffect(() => {
    const q = query(collection(db, "kegiatan"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kegiatan = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setKegiatanList(kegiatan);
      setFetching(false);

      // Fetch sub-collection absensi untuk setiap kegiatan
      kegiatan.forEach((k) => {
        const absensiRef = collection(db, "kegiatan", k.id, "absensi");
        onSnapshot(absensiRef, (snap) => {
          setAbsensiMap((prev) => ({
            ...prev,
            [k.id]: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          }));
        });
      });
    });

    return () => unsubscribe();
  }, []);

  // ================= HANDLE HAPUS (MEMBUKA KUOTA KEMBALI) =================
  const handleDelete = async () => {
    if (!selectedDelete) return;

    try {
      setLoadingDelete(true);

      // 1. Hapus isi sub-collection 'absensi' terlebih dahulu
      const absensiRef = collection(db, "kegiatan", selectedDelete.id, "absensi");
      const absensiSnap = await getDocs(absensiRef);
      
      const deletePromises = absensiSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // 2. Hapus dokumen utama 'kegiatan'
      // Setelah ini dihapus, query 'where tanggalString == today' di halaman Member 
      // otomatis berkurang jumlahnya (Kuota Terbuka Kembali)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 md:ml-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pt-24 md:pt-10 md:ml-64 transition-all">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-3 rounded-2xl shadow-lg">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Arsip Absensi</h1>
            <p className="text-sm text-slate-500 font-medium">Riwayat data kegiatan yang tersimpan</p>
          </div>
        </div>

        {kegiatanList.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-20 text-center">
            <Users className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold">Belum ada arsip tersimpan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {kegiatanList.map((kegiatan) => {
              const absensiData = absensiMap[kegiatan.id] || [];
              const stats = {
                Hadir: absensiData.filter((a) => a.status === "Hadir").length,
                Izin: absensiData.filter((a) => a.status === "Izin").length,
                Sakit: absensiData.filter((a) => a.status === "Sakit").length,
                Alpha: absensiData.filter((a) => a.status === "Tanpa Keterangan").length,
              };

              return (
                <div key={kegiatan.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                  
                  {/* BARIS ATAS: JUDUL & TOMBOL HAPUS */}
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-800 leading-tight">
                          {toTitleCase(kegiatan.nama)}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                          {formatTanggalLengkap(kegiatan.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedDelete(kegiatan)}
                      className="group flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-bold text-xs"
                    >
                      <Trash2 size={14} />
                      Hapus Permanen
                    </button>
                  </div>

                  {/* STATISTIK RINGKAS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-white">
                    <StatBox label="Hadir" value={stats.Hadir} color="emerald" />
                    <StatBox label="Izin" value={stats.Izin} color="amber" />
                    <StatBox label="Sakit" value={stats.Sakit} color="blue" />
                    <StatBox label="Alpha" value={stats.Alpha} color="rose" />
                  </div>

                  {/* TABEL DATA */}
                  <div className="overflow-x-auto px-6 pb-6">
                    <table className="w-full text-sm border-t border-slate-50">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <th className="py-4 text-left w-12">No</th>
                          <th className="py-4 text-left">Nama Member</th>
                          <th className="py-4 text-left">Jabatan</th>
                          <th className="py-4 text-center w-32">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {absensiData.map((a, index) => (
                          <tr key={a.id} className="group">
                            <td className="py-3 text-slate-300 font-bold">{index + 1}</td>
                            <td className="py-3 font-bold text-slate-700">{toTitleCase(a.nama)}</td>
                            <td className="py-3 text-slate-500 font-medium text-xs">{toTitleCase(a.jabatan || "Anggota")}</td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${getStatusColor(a.status)}`}>
                                {a.status === "Tanpa Keterangan" ? "ALPHA" : a.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL KONFIRMASI HAPUS */}
      {selectedDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 animate-in zoom-in duration-200">
            <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Hapus Arsip?</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              Data kegiatan <span className="text-slate-800 font-bold">"{selectedDelete.nama}"</span> akan dihapus selamanya. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
              >
                {loadingDelete ? <Loader2 className="animate-spin" size={18} /> : "Ya, Hapus Permanen"}
              </button>
              <button
                onClick={() => setSelectedDelete(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= HELPER COMPONENTS & FUNCTIONS =================

const StatBox = ({ label, value, color }) => {
  const themes = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <div className={`p-4 rounded-2xl border ${themes[color]} text-center`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "Hadir": return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "Izin": return "bg-amber-50 text-amber-600 border-amber-100";
    case "Sakit": return "bg-blue-50 text-blue-600 border-blue-100";
    default: return "bg-rose-50 text-rose-600 border-rose-100";
  }
};

export default AttendanceArchive;