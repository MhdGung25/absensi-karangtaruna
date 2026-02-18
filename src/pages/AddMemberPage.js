import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Zap,
} from "lucide-react";

const AddMembers = () => {
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [peran, setPeran] = useState("Anggota");
  const [statusAwal, setStatusAwal] = useState("Hadir");
  const [loading, setLoading] = useState(false);
  const [inputCount, setInputCount] = useState(0); // Counter kuota input
  const [fetching, setFetching] = useState(true);

  const todayString = new Date().toISOString().split("T")[0];
  const MAX_INPUT = 2; // Kesempatan input 2x biar tidak salah

  // ================= CEK RIWAYAT INPUT HARI INI =================
  useEffect(() => {
    const checkHistory = async () => {
      try {
        // Cek apakah sudah ada kegiatan yang diarsip hari ini
        const q = query(
          collection(db, "kegiatan"),
          where("tanggalString", "==", todayString)
        );
        const snapshot = await getDocs(q);
        setInputCount(snapshot.size);
      } catch (err) {
        console.error("Gagal cek riwayat:", err);
      } finally {
        setFetching(false);
      }
    };

    checkHistory();
  }, [todayString]);

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) return alert("Nama wajib diisi!");
    if (inputCount >= MAX_INPUT) return alert("Kuota input hari ini sudah habis!");

    setLoading(true);
    try {
      const namaFix = nama.trim();
      const namaLower = namaFix.toLowerCase();

      // Cek Duplikat Nama
      const qNama = query(collection(db, "members"), where("namaLower", "==", namaLower));
      const snapNama = await getDocs(qNama);
      
      if (!snapNama.empty) {
        alert("Nama ini sudah terdaftar!");
        setLoading(false);
        return;
      }

      // Simpan data ke Firestore
      await setDoc(doc(collection(db, "members")), {
        nama: namaFix,
        namaLower: namaLower,
        jabatan: peran === "Pengurus" ? jabatan.trim() : "Anggota",
        peran: peran,
        statusDefault: statusAwal,
        createdAt: serverTimestamp(),
      });

      alert("Member berhasil ditambahkan!");
      setNama("");
      setJabatan("");
      setPeran("Anggota");
      
      // Catatan: Di sini kita tidak menambah inputCount manual 
      // karena penambahan member biasanya tidak dihitung sebagai "arsip kegiatan"
      // Tapi karena Anda minta logika yang sama dengan Absensi (2x kunci):
      // setInputCount(prev => prev + 1); 

    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
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
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pt-24 md:pt-10 md:ml-64 transition-all">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-3 rounded-2xl shadow-xl">
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Tambah Member</h1>
              <p className="text-sm text-slate-500 font-medium">Sisa Kuota Akses: {MAX_INPUT - inputCount}x</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-slate-600">
            <Calendar size={14} />
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {/* INFO BOX */}
        {isLocked && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-center text-amber-700 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              Sistem Terkunci: Absensi hari ini sudah diarsip (2/2). Anda tidak dapat menambah member untuk sementara guna menjaga validitas laporan.
            </p>
          </div>
        )}

        {/* FORM INPUT */}
        <form 
          onSubmit={handleSubmit} 
          className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6 transition-all ${isLocked ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}
        >
          {/* NAMA */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
            <input
              type="text"
              disabled={isLocked}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder={isLocked ? "Form tidak dapat digunakan..." : "Masukkan nama anggota baru..."}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all font-medium disabled:cursor-not-allowed"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* KATEGORI */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
              <select
                disabled={isLocked}
                value={peran}
                onChange={(e) => setPeran(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
              >
                <option value="Anggota">Anggota Biasa</option>
                <option value="Pengurus">Pengurus Inti</option>
              </select>
            </div>
            
            {/* STATUS DEFAULT */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kehadiran Default</label>
              <select
                disabled={isLocked}
                value={statusAwal}
                onChange={(e) => setStatusAwal(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
              >
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Tanpa Keterangan">Alpha</option>
              </select>
            </div>
          </div>

          {/* JABATAN (CONDITIONAL) */}
          {peran === "Pengurus" && (
            <div className="animate-in fade-in zoom-in duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jabatan Pengurus</label>
              <input
                type="text"
                disabled={isLocked}
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Misal: Sekretaris, Bendahara..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
              />
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || isLocked || !nama.trim()}
            className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl 
              ${isLocked || !nama.trim()
                ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                : 'bg-black text-white hover:bg-zinc-800 shadow-slate-200 active:scale-[0.98]'}`}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isLocked ? (
              <AlertCircle size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            {loading ? "Memproses..." : isLocked ? "Pendaftaran Ditutup" : "Daftarkan Member Sekarang"}
          </button>
        </form>

        {/* FOOTER HINT */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">
          <Zap size={12} className="fill-slate-400" />
          <span>Sistem sinkronisasi otomatis dengan firebase</span>
        </div>
      </div>
    </div>
  );
};

export default AddMembers;