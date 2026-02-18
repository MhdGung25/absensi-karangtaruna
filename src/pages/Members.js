import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Save,
  UserCheck,
  Loader2,

  Calendar,
  Trash2,
  AlertCircle,
} from "lucide-react";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputCount, setInputCount] = useState(0); // Counter untuk kuota
  const [fetching, setFetching] = useState(true);

  const todayString = new Date().toISOString().split("T")[0];
  const MAX_INPUT = 2; // Batas input harian

  // ================= STYLE STATUS BADGE =================
  const getStatusStyle = (status) => {
    switch (status) {
      case "Hadir": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Izin": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Sakit": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Tanpa Keterangan": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // ================= FETCH DATA & CEK RIWAYAT =================
  useEffect(() => {
    const initData = async () => {
      try {
        // Cek berapa banyak kegiatan yang sudah diinput hari ini
        const q = query(collection(db, "kegiatan"), where("tanggalString", "==", todayString));
        const snap = await getDocs(q);
        setInputCount(snap.size);

        const unsub = onSnapshot(collection(db, "members"), (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().statusDefault || "Hadir",
          }));
          setMembers(data);
          setFetching(false);
        });

        return () => unsub();
      } catch (err) {
        console.error(err);
        setFetching(false);
      }
    };
    initData();
  }, [todayString]);

  // ================= ACTION HANDLERS =================
  const handleSimpanAbsensi = async () => {
    if (!namaKegiatan.trim()) return alert("Nama kegiatan wajib diisi!");
    if (inputCount >= MAX_INPUT) return alert("Kuota input hari ini sudah habis!");

    setLoading(true);
    try {
      const kegiatanRef = await addDoc(collection(db, "kegiatan"), {
        nama: namaKegiatan.trim(),
        createdAt: serverTimestamp(),
        tanggalString: todayString,
      });

      const promises = members.map((m) =>
        setDoc(doc(db, "kegiatan", kegiatanRef.id, "absensi", m.id), {
          nama: m.nama,
          jabatan: m.jabatan || "Anggota",
          status: m.status,
          tanggal: serverTimestamp(),
        })
      );

      await Promise.all(promises);
      
      // Update local state
      setInputCount(prev => prev + 1);
      setNamaKegiatan("");
      alert("Absensi berhasil diarsipkan!");
      
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleHapusMember = async (id) => {
    if (!window.confirm("Hapus member permanen?")) return;
    await deleteDoc(doc(db, "members", id));
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 md:ml-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const isLocked = inputCount >= MAX_INPUT;

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-12 px-4 md:px-8 md:ml-64 transition-all font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-3 rounded-2xl shadow-lg">
              <UserCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Input Absensi</h1>
              <p className="text-sm text-slate-500 font-medium">Sisa Kuota Input: {MAX_INPUT - inputCount}x</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* INPUT CARD */}
        <div className={`bg-white rounded-3xl border p-6 shadow-sm transition-opacity ${isLocked ? 'opacity-50' : 'opacity-100'}`}>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
            {isLocked ? "Input Terkunci" : "Nama Kegiatan"}
          </label>
          <input
            type="text"
            disabled={isLocked}
            value={namaKegiatan}
            onChange={(e) => setNamaKegiatan(e.target.value)}
            placeholder={isLocked ? "Batas input harian tercapai." : "Masukkan nama kegiatan..."}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-medium disabled:cursor-not-allowed"
          />
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-5 px-6 text-center w-16">No</th>
                  <th className="px-6 text-left">Member</th>
                  <th className="px-6 text-left">Jabatan</th>
                  <th className="px-6 text-center">Status</th>
                  <th className="px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m, index) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-5 px-6 text-center text-slate-400 font-medium">{index + 1}</td>
                    <td className="px-6">
                      <span className="font-bold text-slate-700 block capitalize">{m.nama}</span>
                    </td>
                    <td className="px-6 text-slate-500 font-medium text-xs">{m.jabatan || "Anggota"}</td>
                    <td className="px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusStyle(m.status)}`}>
                        {m.status === "Tanpa Keterangan" ? "Alpha" : m.status}
                      </span>
                    </td>
                    <td className="px-6 text-center">
                      <button 
                        onClick={() => handleHapusMember(m.id)} 
                        className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            <AlertCircle size={14} />
            <span>Pastikan data sudah benar sebelum simpan</span>
          </div>
          
          <button
            onClick={handleSimpanAbsensi}
            disabled={loading || isLocked || !namaKegiatan.trim()}
            className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl 
              ${isLocked || !namaKegiatan.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-black text-white hover:bg-zinc-800 shadow-slate-200'}`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isLocked ? "Kuota Habis (2/2)" : `Simpan Absensi (${inputCount}/2)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Members;