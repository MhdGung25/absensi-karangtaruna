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
  CalendarDays
} from "lucide-react";

const Dashboard = () => {
  const [absensi, setAbsensi] = useState([]);
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [loading, setLoading] = useState(true);

  const toTitleCase = (text) => {
    if (!text) return "";
    return text.toString().toLowerCase().trim().split(" ").filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  useEffect(() => {
    const qKegiatan = query(collection(db, "kegiatan"), orderBy("createdAt", "desc"), limit(1));
    const unsubscribeKegiatan = onSnapshot(qKegiatan, (snapshot) => {
      if (!snapshot.empty) {
        const kegiatanDoc = snapshot.docs[0];
        setNamaKegiatan(toTitleCase(kegiatanDoc.data().nama));

        const absensiRef = collection(db, "kegiatan", kegiatanDoc.id, "absensi");
        const unsubscribeAbsensi = onSnapshot(absensiRef, (absenSnap) => {
          const dataAbsensi = absenSnap.docs.map((doc) => ({
            id: doc.id,
            nama: toTitleCase(doc.data().nama),
            status: doc.data().status || "Hadir",
            jabatan: doc.data().jabatan ? toTitleCase(doc.data().jabatan) : "Anggota",
          }));
          setAbsensi(dataAbsensi);
          setLoading(false);
        });
        return () => unsubscribeAbsensi();
      } else {
        setNamaKegiatan("");
        setAbsensi([]);
        setLoading(false);
      }
    });
    return () => unsubscribeKegiatan();
  }, []);

  const count = (s) => absensi.filter((a) => a.status === s).length;

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-10 md:pt-8 px-4 md:px-8 md:ml-64 transition-all">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-slate-500 font-medium">Laporan Kegiatan Karang Taruna RW 18</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
            <CalendarDays size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">
              {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

       {namaKegiatan && (
  <div className="bg-white border-l-4 border-black rounded-2xl p-6 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
        Kegiatan Terakhir
      </p>
      <h2 className="text-xl md:text-2xl font-black text-slate-900 capitalize tracking-tight">
        {namaKegiatan}
      </h2>
    </div>
    <div className="bg-slate-50 p-3 rounded-xl">
       <Activity size={24} className="text-slate-900" />
    </div>
  </div>
)}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-black rounded-full animate-spin" />
            <p className="text-sm font-medium">Sinkronisasi Data...</p>
          </div>
        ) : absensi.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400">
            <AlertCircle className="mx-auto mb-3 opacity-20" size={48} />
            <p className="font-medium">Belum ada riwayat absensi yang tersimpan.</p>
          </div>
        ) : (
          <>
            {/* STATS GRID - Responsive 2 columns on mobile, 5 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <StatCard title="Total" value={absensi.length} color="bg-slate-100" icon={<Users className="text-slate-600" />} />
              <StatCard title="Hadir" value={count("Hadir")} color="bg-emerald-50" icon={<CheckCircle2 className="text-emerald-600" />} />
              <StatCard title="Izin" value={count("Izin")} color="bg-amber-50" icon={<Clock className="text-amber-600" />} />
              <StatCard title="Sakit" value={count("Sakit")} color="bg-blue-50" icon={<Activity className="text-blue-600" />} />
              <StatCard title="Alpha" value={count("Tanpa Keterangan")} color="bg-rose-50" icon={<AlertCircle className="text-rose-600" />} />
            </div>

            {/* TABLE SECTION */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Daftar Kehadiran</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500 uppercase">Real-time</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="py-4 px-6 text-center w-16">No</th>
                      <th className="py-4 px-6 text-left">Nama Lengkap</th>
                      <th className="py-4 px-6 text-left">Jabatan</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absensi.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6 text-center text-slate-400 text-sm">{index + 1}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-700 text-sm group-hover:text-black transition-colors">{item.nama}</p>
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-sm">{item.jabatan}</td>
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

/* COMPONENT: STAT CARD */
const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-4 md:p-5 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col gap-3 transition-transform hover:scale-[1.02]`}>
    <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{title}</p>
      <h2 className="text-2xl font-black text-slate-800 leading-none mt-1">{value}</h2>
    </div>
  </div>
);

/* COMPONENT: STATUS BADGE */
const StatusBadge = ({ status }) => {
  const styles = {
    "Hadir": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Izin": "bg-amber-100 text-amber-700 border-amber-200",
    "Sakit": "bg-blue-100 text-blue-700 border-blue-200",
    "Tanpa Keterangan": "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wide ${styles[status] || "bg-slate-100"}`}>
      {status === "Tanpa Keterangan" ? "Alpha" : status}
    </span>
  );
};

export default Dashboard;