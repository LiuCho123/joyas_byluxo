import { useState, useEffect } from 'react';
import { RefreshCw, MessageCircle, Heart, Bookmark, Share2, Play, Plus, X, Camera, Video } from 'lucide-react';
import logoByLuxo from '../assets/logo.jpeg';

const ContentGallery = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [activePlatform, setActivePlatform] = useState('Instagram');
    const [isGenerating, setIsGenerating] = useState(false);

    // Estados para el Modal de Anotar Video
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevoVideo, setNuevoVideo] = useState({ titulo: '', plataforma: 'Instagram', formato: 'Reel' });
    const [joyasSeleccionadas, setJoyasSeleccionadas] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resPubs, resJoyas] = await Promise.all([
                fetch('https://joyas-byluxo.onrender.com/api/publicaciones'),
                fetch('https://joyas-byluxo.onrender.com/api/joyas')
            ]);

            if (resPubs.ok && resJoyas.ok) {
                const pubsData = await resPubs.json();
                pubsData.sort((a, b) => new Date(a.fechaPublicacion) - new Date(b.fechaPublicacion));
                setPublicaciones(pubsData);
                setInventario(await resJoyas.json());
            }
        } catch (error) {
            console.error("Error conectando:", error);
        }
    };

    // --- Lógica: Registrar Nuevo Video ---
    const toggleJoyaSeleccionada = (id) => {
        setJoyasSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
        );
    };

    const handleRegistrarVideo = async (e) => {
        e.preventDefault();

        const payload = {
            titulo: nuevoVideo.titulo,
            plataforma: nuevoVideo.plataforma,
            formato: nuevoVideo.formato,
            joyas: joyasSeleccionadas.map(id => ({ id: Number(id) }))
        };

        try {
            const response = await fetch('https://joyas-byluxo.onrender.com/api/publicaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setNuevoVideo({ titulo: '', plataforma: 'Instagram', formato: 'Reel' });
                setJoyasSeleccionadas([]);
                setIsModalOpen(false);
                cargarDatos();
            }
        } catch (error) {
            console.error("Error al registrar video:", error);
        }
    };

    // --- Lógica Maestra de Stock y Alertas ---
    const getEstadoVideo = (pubJoyas) => {
        if (!pubJoyas || pubJoyas.length === 0) {
            return { msg: "VLOG / GENERAL", color: "text-green-400 bg-green-400/10 border-green-500/30" };
        }

        let joyasVendidas = 0;
        pubJoyas.forEach(pj => {
            const joyaEnBD = inventario.find(j => j.id === pj.id);
            if (joyaEnBD && joyaEnBD.stock === 0) joyasVendidas++;
        });

        if (joyasVendidas === pubJoyas.length) {
            return { msg: "🚨 BORRAR: Joya(s) Agotada(s)", color: "text-red-400 bg-red-400/10 border-red-500/30 font-bold" };
        } else if (joyasVendidas > 0) {
            return { msg: "⚠️ ATENCIÓN: Joya parcial agotada", color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/30" };
        } else {
            return { msg: "ACTIVO", color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
        }
    };

    // --- Generador de Reporte para el Estratega ---
    const generarReporteEstratega = () => {
        setIsGenerating(true);
        const pubsPlataforma = publicaciones.filter(p => p.plataforma === activePlatform);

        let reporteTexto = `📊 REPORTE DE CONTENIDO - ${activePlatform.toUpperCase()} 📊\n`;
        reporteTexto += `(Generado para análisis comparativo de retención y limpieza del feed)\n\n`;

        pubsPlataforma.forEach(pub => {
            const estadoVideo = getEstadoVideo(pub.joyas);
            let joyasTexto = pub.joyas && pub.joyas.length > 0
                ? pub.joyas.map(j => j.nombre).join(" + ")
                : "Contenido General (Vlog)";

            reporteTexto += `📌 [${pub.formato.toUpperCase()}] ${pub.titulo}\n`;
            reporteTexto += `🗓️ Fecha Subida: ${pub.fechaPublicacion || 'N/A'}\n`;
            reporteTexto += `💎 Joya(s): ${joyasTexto}\n`;
            reporteTexto += `🔴 Estado de Inventario: ${estadoVideo.msg.replace(/[🚨⚠️]/g, '')}\n`;
            reporteTexto += `📈 Rendimiento Actual:\n`;
            reporteTexto += `   - Reproducciones: ${pub.reproducciones || 0}\n`;
            reporteTexto += `   - Likes: ${pub.likes || 0} | Comentarios: ${pub.comentarios || 0}\n`;
            reporteTexto += `   - Guardados: ${pub.guardados || 0} | Compartidos: ${pub.compartidos || 0}\n`;
            reporteTexto += `--------------------------------------------------\n\n`;
        });

        navigator.clipboard.writeText(reporteTexto);
        setTimeout(() => {
            alert('¡Reporte completo copiado al portapapeles! Listo para pegar al Estratega.');
            setIsGenerating(false);
        }, 500);
    };

    const pubsVisualizar = publicaciones.filter(p => p.plataforma === activePlatform);

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-xl shadow-2xl border border-zinc-800 font-sans mt-6">

            {/* Cabecera */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <img src={logoByLuxo} alt="Joyas" className="w-16 h-16 rounded-full border border-zinc-700 shadow-md" />
                    <div>
                        <h2 className="text-2xl font-light tracking-widest text-zinc-100 uppercase">Vitrina de Contenidos</h2>
                        <p className="text-sm text-zinc-500">Auditoría Visual y Limpieza de Feed</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded hover:bg-zinc-200 transition-colors shadow-lg text-sm tracking-widest"
                    >
                        <Plus className="w-4 h-4" /> ANOTAR VIDEO
                    </button>
                    <button
                        onClick={cargarDatos}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                        title="Actualizar Datos"
                    >
                        <RefreshCw className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>
            </div>

            {/* Pestañas de Plataforma y Botón de Reporte */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActivePlatform('Instagram')}
                        className={`px-8 py-3 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all ${activePlatform === 'Instagram' ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-900/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'}`}
                    >
                        <Camera className="w-5 h-5" /> INSTAGRAM
                    </button>
                    <button
                        onClick={() => setActivePlatform('TikTok')}
                        className={`px-8 py-3 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all ${activePlatform === 'TikTok' ? 'bg-black text-white border border-zinc-700 shadow-lg shadow-zinc-800/50' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'}`}
                    >
                        <Video className="w-5 h-5" /> TIKTOK
                    </button>
                </div>

                <button
                    onClick={generarReporteEstratega}
                    disabled={isGenerating}
                    className="w-full md:w-auto bg-zinc-800 text-zinc-300 font-bold px-6 py-3 rounded hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors shadow-lg text-xs"
                >
                    {isGenerating ? 'Generando...' : `📋 COPIAR REPORTE ${activePlatform.toUpperCase()}`}
                </button>
            </div>

            {/* Grid del "Feed" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pubsVisualizar.length === 0 ? (
                    <div className="col-span-full p-10 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl">
                        No hay videos registrados en {activePlatform} aún.
                    </div>
                ) : (
                    pubsVisualizar.map((pub) => {
                        const estado = getEstadoVideo(pub.joyas);
                        return (
                            <div key={pub.id} className={`bg-zinc-900 border rounded-xl overflow-hidden flex flex-col transition-all hover:border-zinc-500 ${estado.msg.includes('BORRAR') ? 'border-red-900/50 shadow-lg shadow-red-900/10' : 'border-zinc-800'}`}>

                                <div className="p-4 border-b border-zinc-800 bg-black/40">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{pub.formato}</span>
                                        <span className="text-[10px] text-zinc-600">{pub.fechaPublicacion}</span>
                                    </div>
                                    <h3 className="font-bold text-sm text-zinc-200 line-clamp-2 leading-tight min-h-[2.5rem]">{pub.titulo}</h3>
                                </div>

                                <div className="p-4 flex-1">
                                    <div className={`text-[10px] px-2 py-1.5 rounded text-center mb-4 uppercase tracking-widest ${estado.color}`}>
                                        {estado.msg}
                                    </div>

                                    <div className="space-y-2">
                                        {(!pub.joyas || pub.joyas.length === 0) ? (
                                            <p className="text-xs text-zinc-500 italic text-center">Video general. No expone joyas del inventario.</p>
                                        ) : (
                                            pub.joyas.map(j => (
                                                <div key={j.id} className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                                                    <span className="truncate pr-2">{j.nombre}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-zinc-800 bg-black/40 grid grid-cols-2 gap-y-3 gap-x-2">
                                    <div className="flex items-center gap-1.5 text-zinc-400" title="Reproducciones">
                                        <Play className="w-4 h-4 text-white" />
                                        <span className="text-sm font-bold text-white">{pub.reproducciones || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 text-zinc-500" title="Likes">
                                        <Heart className="w-4 h-4 text-pink-500" />
                                        <span className="text-xs">{pub.likes || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-500" title="Comentarios">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="text-xs">{pub.comentarios || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="flex items-center gap-1 text-zinc-500" title="Guardados">
                                            <Bookmark className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">{pub.guardados || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-zinc-500" title="Compartidos">
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">{pub.compartidos || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL: REGISTRAR NUEVO VIDEO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                            <h3 className="text-xl font-light tracking-widest text-zinc-100 uppercase">🎬 Anotar Nuevo Video</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="flex flex-col md:col-span-1">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Título del Video</label>
                                <input type="text" placeholder="Ej: Gancho Cadena Cartier" value={nuevoVideo.titulo} onChange={(e) => setNuevoVideo({...nuevoVideo, titulo: e.target.value})} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Plataforma</label>
                                <select value={nuevoVideo.plataforma} onChange={(e) => setNuevoVideo({...nuevoVideo, plataforma: e.target.value, formato: e.target.value === 'Instagram' ? 'Reel' : 'Video'})} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 text-sm focus:outline-none focus:border-zinc-400">
                                    <option value="Instagram">Instagram</option>
                                    <option value="TikTok">TikTok</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Formato</label>
                                <select value={nuevoVideo.formato} onChange={(e) => setNuevoVideo({...nuevoVideo, formato: e.target.value})} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 text-sm focus:outline-none focus:border-zinc-400">
                                    {nuevoVideo.plataforma === 'Instagram' ? (
                                        <><option value="Reel">Reel</option><option value="Carrusel">Carrusel</option><option value="Historia">Historia</option></>
                                    ) : (
                                        <><option value="Video">Video</option><option value="Carrusel">Carrusel</option></>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800 mb-6">
                            <h3 className="text-xs font-bold tracking-wide mb-3 text-zinc-100 uppercase">💎 ¿Qué joyas aparecen en este contenido?</h3>
                            <p className="text-[10px] text-zinc-500 mb-3">(Si es un vlog o contenido general, puedes dejar esto vacío)</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                                {inventario.map(joya => (
                                    <button
                                        key={joya.id}
                                        onClick={() => toggleJoyaSeleccionada(joya.id)}
                                        className={`p-2 text-left text-xs rounded border transition-colors ${joyasSeleccionadas.includes(joya.id) ? 'bg-green-500/20 border-green-500 text-green-400 font-bold' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                    >
                                        {joyasSeleccionadas.includes(joya.id) && '✓ '}
                                        {joya.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleRegistrarVideo} className="w-full bg-white text-black hover:bg-zinc-200 font-bold tracking-widest py-3 rounded transition-colors shadow-lg text-sm">
                            🚀 GUARDAR VIDEO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentGallery;