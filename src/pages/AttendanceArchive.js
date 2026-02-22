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

  const toTitleCase = (text) => {
    if (!text) return "";
    return text.toString().toUpperCase();
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
      alert("Gagal menghapus data!");
    } finally {
      setLoadingDelete(false);
    }
  };

  const formatTanggalLengkap = (timestamp) => {
    if (!timestamp?.toDate) return "TANPA TANGGAL";
    const date = timestamp.toDate();
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white md:ml-64">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-20 pb-20 px-4 md:px-8 md:ml-64 transition-all text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section - Ukuran Standar Laptop */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <Archive size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-[900] tracking-tighter uppercase leading-none">Arsip Absensi</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-zinc-500">Riwayat Absen Karta 18</p>
            </div>
          </div>
          
          <div className="border-[2.5px] border-black px-4 py-2 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 rounded-xl">
            <Users size={16} strokeWidth={3} />
            <span className="font-black text-xs uppercase pt-0.5">Total: {kegiatanList.length} Agenda</span>
          </div>
        </div>

        <hr className="border-t-[2.5px] border-black opacity-10" />

        {kegiatanList.length === 0 ? (
          <div className="border-[2.5px] border-dashed border-zinc-300 py-16 text-center rounded-3xl">
            <Archive className="mx-auto text-zinc-200 mb-3" size={48} />
            <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Belum ada arsip tersimpan.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {kegiatanList.map((kegiatan) => {
              const absensiData = absensiMap[kegiatan.id] || [];
              const stats = {
                Hadir: absensiData.filter((a) => a.status === "Hadir").length,
                Izin: absensiData.filter((a) => a.status === "Izin").length,
                Sakit: absensiData.filter((a) => a.status === "Sakit").length,
                Alpha: absensiData.filter((a) => a.status === "Tanpa Keterangan" || a.status === "Alpha").length,
              };

              return (
                <div key={kegiatan.id} className="border-[2.5px] border-black rounded-[2rem] overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  {/* Card Header */}
                  <div className="p-5 md:p-6 border-b-[2.5px] border-black bg-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 text-black">
                            <Calendar size={18} strokeWidth={3}/>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-[900] uppercase tracking-tight leading-none">
                                {toTitleCase(kegiatan.nama)}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                <span className="text-black font-black">{formatTanggalLengkap(kegiatan.createdAt)}</span>
                                <span className="text-zinc-300">|</span>
                                <div className="flex items-center gap-1">
                                    <MapPin size={10} strokeWidth={3} />
                                    {kegiatan.lokasi || "LOKASI TIDAK DISET"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                      onClick={() => setSelectedDelete(kegiatan)}
                      className="border-[2px] border-black bg-white hover:bg-red-50 text-red-600 px-4 py-1.5 rounded-lg font-black uppercase text-[10px] transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Trash2 size={14} strokeWidth={3} /> Hapus
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 md:p-6 space-y-6">
                    {/* Stats Grid - Proporsional */}
                    <div className="grid grid-cols-4 gap-3">
                      <StatBox label="Hadir" value={stats.Hadir} />
                      <StatBox label="Izin" value={stats.Izin} />
                      <StatBox label="Sakit" value={stats.Sakit} />
                      <StatBox label="Alpha" value={stats.Alpha} />
                    </div>

                    {/* Table View - Laptop Size */}
                    <div className="border-[2px] border-black rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-black text-white text-[9px] font-black uppercase tracking-widest">
                                <th className="py-3 px-4 w-12 text-center">#</th>
                                <th className="py-3 px-4">Nama Lengkap</th>
                                <th className="py-3 px-4 text-center">Status Kehadiran</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y-[1.5px] divide-zinc-100">
                            {absensiData.map((a, index) => (
                                <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="py-3 px-4 text-[10px] font-black text-zinc-300 text-center">{index + 1}</td>
                                <td className="py-3 px-4">
                                    <p className="text-xs font-[900] uppercase tracking-tight">{toTitleCase(a.nama)}</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase italic leading-none mt-0.5">{a.jabatan || "ANGGOTA"}</p>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`text-[9px] font-[900] px-3 py-1 rounded-full border-[1.5px] uppercase tracking-tighter ${getStatusStyle(a.status)}`}>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal - Ukuran Laptop */}
      {selectedDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4">
          <div className="bg-white border-[3px] border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm text-center">
            <div className="w-16 h-16 border-[3px] border-black bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
               <AlertTriangle size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-[900] uppercase tracking-tighter mb-1 text-black">Hapus Arsip?</h3>
            <p className="text-[11px] font-bold text-zinc-500 mb-6 uppercase leading-tight tracking-tight px-4">
              KEGIATAN <span className="text-black font-black underline underline-offset-2">"{selectedDelete.nama}"</span> AKAN DIHAPUS PERMANEN.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="w-full py-3 bg-black text-white rounded-xl font-[900] text-xs uppercase tracking-widest hover:bg-zinc-800 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
              >
                {loadingDelete ? <Loader2 className="animate-spin mx-auto" size={18} /> : "YA, HAPUS SEKARANG"}
              </button>
              <button
                onClick={() => setSelectedDelete(null)}
                className="w-full py-3 bg-white border-[2px] border-black text-black rounded-xl font-[900] text-xs uppercase tracking-widest hover:bg-zinc-50 transition"
              >
                BATALKAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value }) => {
  return (
    <div className="py-2.5 px-2 rounded-xl border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
      <p className="text-lg font-[900] leading-none">{value}</p>
    </div>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Hadir":
      return "border-black bg-black text-white";
    case "Izin":
      return "border-zinc-200 bg-zinc-50 text-zinc-500";
    case "Sakit":
      return "border-zinc-200 bg-zinc-50 text-zinc-500";
    default:
      return "border-black text-black font-[900] italic bg-zinc-50";
  }
};

export default AttendanceArchive;