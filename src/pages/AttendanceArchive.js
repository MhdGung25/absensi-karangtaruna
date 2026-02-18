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
} from "lucide-react";

const AttendanceArchive = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [absensiMap, setAbsensiMap] = useState({});
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [fetching, setFetching] = useState(true);

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
      const absensiRef = collection(
        db,
        "kegiatan",
        selectedDelete.id,
        "absensi"
      );
      const absensiSnap = await getDocs(absensiRef);
      const deletePromises = absensiSnap.docs.map((docSnap) =>
        deleteDoc(docSnap.ref)
      );
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 md:ml-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16 pt-20 md:pt-10 md:ml-64 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">
              Arsip Absensi
            </h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Riwayat Kegiatan Tarka 18
            </p>
          </div>
        </div>

        {kegiatanList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <Users className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-400 font-semibold">
              Belum ada arsip yang tersimpan.
            </p>
          </div>
        ) : (
          kegiatanList.map((kegiatan) => {
            const absensiData = absensiMap[kegiatan.id] || [];

            const stats = {
              Hadir: absensiData.filter((a) => a.status === "Hadir").length,
              Izin: absensiData.filter((a) => a.status === "Izin").length,
              Sakit: absensiData.filter((a) => a.status === "Sakit").length,
              Alpha: absensiData.filter(
                (a) => a.status === "Tanpa Keterangan"
              ).length,
            };

            return (
              <div
                key={kegiatan.id}
                className="bg-white rounded-3xl shadow border border-slate-100 overflow-hidden"
              >
                {/* TOP */}
                <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-blue-500" size={20} />
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-slate-800">
                        {toTitleCase(kegiatan.nama)}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {formatTanggalLengkap(kegiatan.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDelete(kegiatan)}
                    className="flex items-center gap-2 bg-rose-50 text-rose-500 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500 hover:text-white transition"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 md:p-6">
                  <StatBox label="Hadir" value={stats.Hadir} color="emerald" />
                  <StatBox label="Izin" value={stats.Izin} color="amber" />
                  <StatBox label="Sakit" value={stats.Sakit} color="blue" />
                  <StatBox label="Alpha" value={stats.Alpha} color="rose" />
                </div>

                {/* TABLE */}
                <div className="px-4 md:px-6 pb-6">
  <div className="overflow-x-auto rounded-xl border border-slate-100">
    <table className="w-full min-w-[600px] text-sm table-auto">
      <thead>
        <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
          <th className="py-3 px-3 text-left w-12">No</th>
          <th className="py-3 px-3 text-left min-w-[120px]">Nama</th>
          <th className="py-3 px-3 text-left min-w-[100px]">Jabatan</th>
          <th className="py-3 px-3 text-center min-w-[80px]">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {absensiData.map((a, index) => (
          <tr key={a.id} className="hover:bg-slate-50 transition">
            <td className="py-3 px-3 text-slate-400">{index + 1}</td>
            <td className="py-3 px-3 font-medium text-slate-700 break-words">
              {toTitleCase(a.nama)}
            </td>
            <td className="py-3 px-3 break-words">
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs">
                {a.jabatan || "Anggota"}
              </span>
            </td>
            <td className="py-3 px-3 text-center">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-lg border ${getStatusColor(
                  a.status
                )}`}
              >
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
          })
        )}
      </div>

      {/* MODAL */}
      {selectedDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center">
            <AlertTriangle className="mx-auto text-rose-500 mb-4" size={40} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Hapus Arsip?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Kegiatan <b>{selectedDelete.nama}</b> akan dihapus permanen.
            </p>

            <button
              onClick={handleDelete}
              disabled={loadingDelete}
              className="w-full py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition mb-3"
            >
              {loadingDelete ? "Menghapus..." : "Ya, Hapus"}
            </button>

            <button
              onClick={() => setSelectedDelete(null)}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color }) => {
  const themes = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div
      className={`p-4 rounded-xl text-center border border-slate-100 ${themes[color]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-xl font-bold">{value}</p>
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
