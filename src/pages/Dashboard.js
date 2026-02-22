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
  Loader2,
  ArrowUpRight,
  LayoutDashboard,
  ClipboardList
} from "lucide-react";

const Dashboard = () => {
  const [absensi, setAbsensi] = useState([]);
  const [kegiatanAktif, setKegiatanAktif] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const qKegiatan = query(collection(db, "kegiatan"), orderBy("createdAt", "desc"), limit(1));
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
  const countAlpha = () => absensi.filter((a) => ["Tanpa Keterangan", "Alpha", "Alfa"].includes(a.status)).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white md:ml-[290px]">
        <Loader2 className="animate-spin text-black" size={24} />
        <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-4">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFDFD] min-h-screen pt-24 pb-10 px-4 md:px-8 md:ml-[290px] transition-all">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-black p-3 rounded-xl text-white shadow-lg shadow-black/10">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Ringkasan Data
              </p>
              <h1 className="text-2xl font-bold text-black tracking-tight">
                Dashboard Utama
              </h1>
            </div>
          </div>
          <div className="bg-white border border-zinc-200 px-4 py-2 rounded-xl text-[11px] font-bold text-zinc-600 shadow-sm flex items-center gap-2 w-fit">
            <CalendarDays size={14} className="text-black" />
            {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* --- INFO KEGIATAN FORMAL --- */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} className="text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Informasi Kegiatan Terakhir</span>
          </div>
          {kegiatanAktif ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">
                  {kegiatanAktif.nama}
                </h2>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                  <MapPin size={14} />
                  <span>{kegiatanAktif.lokasi}</span>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Status: Selesai</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 italic">Belum ada riwayat kegiatan yang tercatat.</p>
          )}
        </div>

        {absensi.length > 0 && (
          <>
            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total Anggota" value={absensi.length} icon={<Users />} active />
              <StatCard title="Hadir" value={count("Hadir")} icon={<CheckCircle2 />} />
              <StatCard title="Izin" value={count("Izin")} icon={<Clock />} />
              <StatCard title="Sakit" value={count("Sakit")} icon={<Activity />} />
              <StatCard title="Alpha" value={countAlpha()} icon={<AlertCircle />} />
            </div>

            {/* --- TABEL KEHADIRAN --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-6">
              <div className="p-5 border-b border-zinc-50 flex justify-between items-center bg-white">
                <h3 className="font-bold text-black text-sm uppercase tracking-tight">Daftar Kehadiran</h3>
                <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Synced</span>
                </div>
              </div>
              
              <div className="overflow-x-auto px-5 pb-4">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-zinc-400 font-bold text-[9px] uppercase tracking-widest">
                      <th className="pb-2 px-4 text-center w-16">ID</th>
                      <th className="pb-2 px-4">Nama Lengkap & Jabatan</th>
                      <th className="pb-2 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absensi.map((item, index) => (
                      <tr key={item.id} className="group transition-all duration-200">
                        <td className="py-3 px-4 text-center text-zinc-400 font-bold text-xs bg-zinc-50 rounded-l-xl">{index + 1}</td>
                        <td className="py-3 px-4 bg-zinc-50">
                          <p className="font-bold text-black text-[13px] tracking-tight">{item.nama}</p>
                          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">{item.jabatan}</p>
                        </td>
                        <td className="py-3 px-4 text-center bg-zinc-50 rounded-r-xl">
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

/* --- STAT CARD SUB-COMPONENT --- */
const StatCard = ({ title, value, icon, active }) => (
  <div className={`p-5 rounded-2xl border transition-all duration-300 ${active ? 'bg-black border-black shadow-md shadow-black/5' : 'bg-white border-zinc-100 hover:border-zinc-200'}`}>
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${active ? 'bg-zinc-800 text-white' : 'bg-zinc-50 text-zinc-400'}`}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</p>
    <div className="flex items-end justify-between mt-1">
      <h2 className={`text-xl font-bold tracking-tight ${active ? 'text-white' : 'text-black'}`}>{value}</h2>
      {active && <ArrowUpRight size={14} className="text-zinc-500 mb-1" />}
    </div>
  </div>
);

/* --- STATUS BADGE SUB-COMPONENT --- */
const StatusBadge = ({ status }) => {
  const label = (status === "Tanpa Keterangan" || status === "Alfa" || status === "Alpha") ? "Alpha" : status;

  const styles = {
    "Hadir": "bg-black text-white border-black",
    "Izin": "bg-white text-zinc-900 border-zinc-200",
    "Sakit": "bg-white text-zinc-400 border-zinc-100",
    "Alpha": "bg-white text-rose-500 border-rose-100",
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-widest transition-all ${styles[label] || "bg-zinc-50 text-zinc-400 border-zinc-100"}`}>
      {label}
    </span>
  );
};

export default Dashboard;