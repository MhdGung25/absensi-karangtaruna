import React, { useState } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AddMembers = () => {
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [peran, setPeran] = useState('Anggota');
  const [statusAwal, setStatusAwal] = useState('Hadir');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nama.trim()) {
      alert("Nama wajib diisi!");
      return;
    }

    if (peran === "Pengurus" && !jabatan.trim()) {
      alert("Jabatan wajib diisi untuk Pengurus!");
      return;
    }

    try {
      setLoading(true);

      const namaFix = nama.trim().toLowerCase();

      // 🔎 CEK DUPLIKAT NAMA
      const q = query(
        collection(db, "members"),
        where("namaLower", "==", namaFix)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("Nama sudah terdaftar! Tidak boleh menambahkan nama yang sama.");
        setLoading(false);
        return;
      }

      // ✅ SIMPAN DATA BARU
      await addDoc(collection(db, "members"), {
        nama: nama.trim(),
        namaLower: namaFix, // untuk cek duplikat
        jabatan: peran === "Pengurus" ? jabatan.trim() : "Anggota",
        peran: peran,
        statusDefault: statusAwal,
        createdAt: serverTimestamp()
      });

      // RESET FORM
      setNama('');
      setJabatan('');
      setPeran('Anggota');
      setStatusAwal('Hadir');

      alert("Member baru berhasil terdaftar!");

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pt-24 md:pt-8 md:ml-64">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-black text-white p-3 rounded-2xl shadow">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Tambah Member Baru
            </h1>
            <p className="text-sm text-slate-500">
              Registrasi anggota Karang Taruna RW 18 ke database.
            </p>
          </div>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5"
        >
          
          {/* NAMA */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>

          {/* PERAN & STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Jenis Keanggotaan
              </label>
              <select
                value={peran}
                onChange={(e) => {
                  setPeran(e.target.value);
                  if (e.target.value === "Anggota") setJabatan("");
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black"
              >
                <option value="Pengurus">Pengurus</option>
                <option value="Anggota">Anggota</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Status Kehadiran Default
              </label>
              <select
                value={statusAwal}
                onChange={(e) => setStatusAwal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black"
              >
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Tanpa Keterangan">Tanpa Keterangan</option>
              </select>
            </div>
          </div>

          {/* JABATAN */}
          {peran === "Pengurus" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Jabatan Pengurus
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Ketua, Sekretaris..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-black"
              />
            </div>
          )}

          {/* INFO */}
          <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex gap-3">
            <AlertCircle size={20} className="text-black shrink-0" />
            <p className="text-[12px] text-slate-600">
              Sistem tidak mengizinkan nama yang sama lebih dari satu kali.
            </p>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Simpan ke Daftar
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddMembers;
