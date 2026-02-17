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
  where
} from "firebase/firestore";
import {
  Save,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle,
  Calendar,
  Trash2
} from "lucide-react";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [sudahSimpan, setSudahSimpan] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "members"), (snapshot) => {
      const memberList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        status: doc.data().statusDefault || "Hadir",
      }));
      setMembers(memberList);
    });
    return () => unsubscribe();
  }, []);

  const handleSimpanAbsensi = async () => {
    if (!namaKegiatan.trim()) {
      alert("❌ Nama kegiatan wajib diisi!");
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "kegiatan"),
        where("nama", "==", namaKegiatan.trim())
      );

      const existing = await getDocs(q);
      if (!existing.empty) {
        alert("⚠️ Nama kegiatan ini sudah ada di arsip!");
        setLoading(false);
        return;
      }

      const kegiatanRef = await addDoc(collection(db, "kegiatan"), {
        nama: namaKegiatan.trim(),
        createdAt: serverTimestamp(),
      });

      for (const member of members) {
        await setDoc(
          doc(db, "kegiatan", kegiatanRef.id, "absensi", member.id),
          {
            nama: member.nama,
            jabatan: member.jabatan || "Anggota",
            status: member.status,
            tanggal: serverTimestamp(),
          }
        );
      }

      setNamaKegiatan("");
      setSudahSimpan(true);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setLoading(false);
    }
  };

  const handleHapusMember = async (id) => {
    const member = members.find((m) => m.id === id);
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus "${member.nama}"?`
    );
    if (!yakin) return;

    await deleteDoc(doc(db, "members", id));
  };

  return (
    <div
      className="
        bg-slate-50
        min-h-screen
        p-4 md:p-8
        pt-20 md:pt-8
        md:ml-64
      "
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">

          <div className="flex items-center gap-3">
            {/* Icon hanya desktop */}
            <div className="bg-black text-white p-3 rounded-xl shadow hidden md:flex items-center justify-center">
              <UserCheck size={24} />
            </div>

            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                Input Absensi
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Karang Taruna RW 18
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-600 font-semibold text-sm">
            <Calendar size={16} className="text-black" />
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {!sudahSimpan ? (
          <>
            {/* ================= INPUT KEGIATAN ================= */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <AlertCircle size={14} />
                <span className="text-xs uppercase font-bold tracking-wider">
                  Informasi Kegiatan
                </span>
              </div>

              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Rapat Pleno Februari"
                className="
                  w-full px-4 py-3
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  focus:bg-white focus:border-blue-500
                  outline-none transition
                  font-semibold text-slate-700
                "
              />
            </div>

            {/* ================= TABLE DESKTOP ================= */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-6 py-3 text-left">Nama</th>
                    <th className="px-6 py-3 text-left">Jabatan</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member, index) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4 text-center text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700 capitalize">
                        {member.nama}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                          {member.jabatan || "Anggota"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-semibold text-slate-700">
                        {member.status}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleHapusMember(member.id)}
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
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 capitalize">
                        {index + 1}. {member.nama}
                      </p>
                      <p className="text-xs text-slate-400">
                        {member.jabatan || "Anggota"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleHapusMember(member.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="text-sm font-semibold text-slate-600 mt-2">
                    Status: {member.status}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= BUTTON ================= */}
            <div className="flex justify-center md:justify-end pb-6">
              <button
                onClick={handleSimpanAbsensi}
                disabled={loading || members.length === 0}
                className="
                  w-full md:w-auto
                  flex items-center justify-center gap-2
                  bg-slate-900 text-white
                  px-6 py-3
                  rounded-2xl
                  font-bold
                  hover:bg-blue-600
                  transition
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {loading ? "MENYIMPAN..." : "SIMPAN & ARSIPKAN"}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white border p-10 rounded-3xl text-center shadow-md max-w-md mx-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Data Tersimpan!
            </h2>
            <p className="text-slate-500 mb-6">
              Absensi berhasil masuk ke arsip sistem.
            </p>
            <button
              onClick={() => setSudahSimpan(false)}
              className="w-full bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition"
            >
              Buat Absensi Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
