import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  CalendarDays,
  MapPin,
  Loader2
} from "lucide-react";

const Dashboard = () => {
  const [absensi, setAbsensi] = useState([]);
  const [kegiatanAktif, setKegiatanAktif] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi Helper: Otomatis merapikan teks (andi wijaya -> Andi Wijaya)
  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    // 1. Ambil kegiatan terbaru
    const qKegiatan = query(
      collection(db, "kegiatan"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribeKegiatan = onSnapshot(qKegiatan, (snapshot) => {
      if (!snapshot.empty) {
        const kegiatanDoc = snapshot.docs[0];
        const dataKegiatan = kegiatanDoc.data();
        
        setKegiatanAktif({
          id: kegiatanDoc.id,
          nama: toTitleCase(dataKegiatan.nama),
          lokasi: toTitleCase(dataKegiatan.lokasi || "Lokasi tidak diset"),
          tanggal: dataKegiatan.createdAt
        });

        // 2. Ambil data absensi dari sub-koleksi
        const absensiRef = collection(db, "kegiatan", kegiatanDoc.id, "absensi");
        const unsubscribeAbsensi = onSnapshot(absensiRef, (absenSnap) => {
          const dataAbsensi = absenSnap.docs.map((doc) => ({
            id: doc.id,
            nama: toTitleCase(doc.data().nama),
            status: doc.data().status || "Hadir",
            jabatan: toTitleCase(doc.data().jabatan || "Anggota"),
          }));
          
          setAbsensi(dataAbsensi.sort((a, b) => a.nama.localeCompare(b.nama)));
          setLoading(false);
        });

        return () => unsubscribeAbsensi();
      } else {
        setKegiatanAktif(null);
        setAbsensi([]);
        setLoading(false);
      }
    });

    return () => unsubscribeKegiatan();
  }, []);

  const count = (status) => absensi.filter((a) => a.status === status).length;
  const countAlpha = () => absensi.filter((a) => a.status === "Tanpa Keterangan" || a.status === "Alpha" || a.status === "Alfa").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white md:ml-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Sinkronisasi data...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-24 pb-10 px-4 md:px-8 md:ml-64 transition-all">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm text-slate-800">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Dashboard Utama</h1>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Laporan absensi Karta RW 18</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm flex items-center gap-2 w-fit">
            <CalendarDays size={14} className="text-slate-400" />
            {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* --- INFO KEGIATAN TERAKHIR --- */}
        {kegiatanAktif ? (
          <div className="bg-white border-l-4 border-slate-900 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kegiatan Terakhir</p>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {kegiatanAktif.nama}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-slate-500">
                 <div className="flex items-center gap-1 text-[11px] font-medium">
                    <MapPin size={12} className="text-slate-300" />
                    {kegiatanAktif.lokasi}
                 </div>
              </div>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 hidden md:block">
               <p className="text-[9px] font-bold text-emerald-600 uppercase text-center tracking-tighter">Status</p>
               <p className="text-xs font-bold text-emerald-700">Tersimpan</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <AlertCircle className="mx-auto mb-3 text-slate-200" size={48} />
            <p className="text-slate-400 font-bold text-sm uppercase">Belum ada data kegiatan</p>
          </div>
        )}

        {absensi.length > 0 && (
          <>
            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard title="Total" value={absensi.length} color="bg-slate-100" icon={<Users className="text-slate-600" />} />
              <StatCard title="Hadir" value={count("Hadir")} color="bg-emerald-50" icon={<CheckCircle2 className="text-emerald-600" />} />
              <StatCard title="Izin" value={count("Izin")} color="bg-amber-50" icon={<Clock className="text-amber-600" />} />
              <StatCard title="Sakit" value={count("Sakit")} color="bg-blue-50" icon={<Activity className="text-blue-600" />} />
              <StatCard title="Alfa" value={countAlpha()} color="bg-rose-50" icon={<AlertCircle className="text-rose-600" />} />
            </div>

            {/* --- TABLE DAFTAR HADIR --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm tracking-tight">Daftar Kehadiran</h3>
                <span className="text-[9px] bg-slate-200 px-2 py-1 rounded font-black text-slate-500 uppercase">Arsip Terbaru</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                      <th className="py-4 px-6 text-center w-16">#</th>
                      <th className="py-4 px-6">Anggota</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {absensi.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-center text-slate-300 font-bold text-xs">{index + 1}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-700 text-sm">{item.nama}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium italic">{item.jabatan}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: STAT CARD --- */
const StatCard = ({ title, value, icon, color }) => (
  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all">
    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <h2 className="text-xl font-bold text-slate-800 leading-none mt-1">{value}</h2>
    </div>
  </div>
);

/* --- SUB-COMPONENT: STATUS BADGE --- */
const StatusBadge = ({ status }) => {
  const styles = {
    "Hadir": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Izin": "bg-amber-50 text-amber-600 border-amber-100",
    "Sakit": "bg-blue-50 text-blue-600 border-blue-100",
    "Tanpa Keterangan": "bg-rose-50 text-rose-600 border-rose-100",
    "Alpha": "bg-rose-50 text-rose-600 border-rose-100",
    "Alfa": "bg-rose-50 text-rose-600 border-rose-100",
  };

  const label = (status === "Tanpa Keterangan" || status === "Alfa") ? "Alpha" : status;

  return (
    <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${styles[status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {label}
    </span>
  );
};

export default Dashboard;