import { useState, useEffect } from 'react';
import { RefreshCw, MessageCircle, Heart, Bookmark, Share2, Play, Plus, X, Camera, Video, Trash2, Pencil, PackageSearch, Zap, Search } from 'lucide-react';
import logoByLuxo from '../assets/logo.jpeg';

const ContentGallery = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [activePlatform, setActivePlatform] = useState('Instagram');
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTermGallery, setSearchTermGallery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [modalFiltroCategoria, setModalFiltroCategoria] = useState('');
    const [modalOcultarAgotados, setModalOcultarAgotados] = useState(true);

    const hoy = new Date().toISOString().split('T')[0];
    const [nuevoVideo, setNuevoVideo] = useState({ titulo: '', plataforma: 'Instagram', formato: 'Reel', fechaPublicacion: hoy, cantidadFotos: '' });
    const [joyasSeleccionadas, setJoyasSeleccionadas] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resPubs, resJoyas] = await Promise.all([
                fetch('https://joyas-byluxo1.onrender.com/api/publicaciones'),
                fetch('https://joyas-byluxo1.onrender.com/api/joyas')
            ]);

            if (resPubs.ok && resJoyas.ok) {
                const pubsData = await resPubs.json();
                pubsData.sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
                setPublicaciones(pubsData);
                setInventario(await resJoyas.json());
            }
        } catch (error) {
            console.error("Error conectando:", error);
        }
    };

    const handleEliminarVideo = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este video del registro?")) return;
        try {
            const res = await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${id}`, { method: 'DELETE' });
            if (res.ok) cargarDatos();
            else alert("Error al eliminar el video. Revisa el servidor.");
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    // --- ABRIR PARA CREAR CON PLATAFORMA POR DEFECTO ---
    const abrirParaCrear = () => {
        setEditingId(null);
        setNuevoVideo({
            titulo: '',
            plataforma: activePlatform,
            formato: activePlatform === 'Instagram' ? 'Reel' : 'Video',
            fechaPublicacion: hoy,
            cantidadFotos: ''
        });
        setJoyasSeleccionadas([]);
        setIsModalOpen(true);
    };

    const abrirParaEditar = (pub) => {
        setEditingId(pub.id);
        setNuevoVideo({
            titulo: pub.titulo,
            plataforma: pub.plataforma,
            formato: pub.formato,
            fechaPublicacion: pub.fechaPublicacion || hoy,
            cantidadFotos: pub.cantidadFotos || ''
        });
        setJoyasSeleccionadas(pub.relaciones ? pub.relaciones.map(r => r.joya.id) : []);
        setIsModalOpen(true);
    };

    const cerrarModal = () => {
        setNuevoVideo({ titulo: '', plataforma: activePlatform, formato: 'Reel', fechaPublicacion: hoy, cantidadFotos: '' });
        setJoyasSeleccionadas([]);
        setEditingId(null);
        setIsModalOpen(false);
    };

    const toggleJoyaSeleccionada = (id) => {
        setJoyasSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
        );
    };

    const handleRegistrarVideo = async (e) => {
        e.preventDefault();

        const crearPayload = (plat, form) => ({
            titulo: nuevoVideo.titulo,
            plataforma: plat,
            formato: form,
            fechaPublicacion: nuevoVideo.fechaPublicacion,
            cantidadFotos: form.includes('Carrusel') ? Number(nuevoVideo.cantidadFotos) : null,
            joyas: joyasSeleccionadas.map(id => ({ id: Number(id) }))
        });

        try {
            // Lógica para crear en ambas plataformas a la vez
            if (nuevoVideo.plataforma === 'Ambas (IG + TikTok)' && !editingId) {
                const formatoIG = nuevoVideo.formato.includes('Carrusel') ? 'Carrusel' : 'Reel';
                const formatoTK = nuevoVideo.formato.includes('Carrusel') ? 'Carrusel' : 'Video';

                const payloadIG = crearPayload('Instagram', formatoIG);
                const payloadTK = crearPayload('TikTok', formatoTK);

                await fetch('https://joyas-byluxo1.onrender.com/api/publicaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadIG) });
                await fetch('https://joyas-byluxo1.onrender.com/api/publicaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadTK) });
            } else {
                const payload = crearPayload(nuevoVideo.plataforma, nuevoVideo.formato);
                const url = editingId ? `https://joyas-byluxo1.onrender.com/api/publicaciones/${editingId}` : 'https://joyas-byluxo1.onrender.com/api/publicaciones';
                const method = editingId ? 'PUT' : 'POST';
                await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            }

            cerrarModal();
            cargarDatos();
        } catch (error) {
            console.error("Error al registrar/editar video:", error);
        }
    };

    const getEstadoVideo = (pubJoyasRelacion) => {
        if (!pubJoyasRelacion || pubJoyasRelacion.length === 0) {
            return { msg: "VLOG / GENERAL", color: "text-green-400 bg-green-400/10 border-green-500/30" };
        }

        let totalJoyasVideo = pubJoyasRelacion.length;
        let joyasAgotadas = 0;
        let joyasDescuadradas = 0;

        pubJoyasRelacion.forEach(pjRel => {
            const stockCongelado = pjRel.stockAlSubir;
            const joyaActual = inventario.find(j => j.id === pjRel.joya.id);

            if (joyaActual) {
                if (joyaActual.stock === 0) {
                    joyasAgotadas++;
                } else if (joyaActual.stock !== stockCongelado) {
                    joyasDescuadradas++;
                }
            }
        });

        if (joyasAgotadas === totalJoyasVideo) return { msg: "🚨 BORRAR: Joya(s) Agotada(s)", color: "text-red-400 bg-red-400/10 border-red-500/30 font-bold" };
        if (joyasDescuadradas > 0 || (joyasAgotadas > 0 && joyasAgotadas < totalJoyasVideo)) return { msg: "⚠️ ACTIVO - Falta Actualizar Lote", color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/30 font-bold" };
        return { msg: "✅ ACTIVO - Stock Blindado", color: "text-green-400 bg-green-400/10 border-green-500/30" };
    };

    const pubsVisualizar = publicaciones
        .filter(p => p.plataforma === activePlatform)
        .filter(p => {
            if (!searchTermGallery) return true;
            if (p.titulo.toLowerCase().includes(searchTermGallery.toLowerCase())) return true;
            if (p.relaciones && p.relaciones.some(rel => rel.joya.nombre.toLowerCase().includes(searchTermGallery.toLowerCase()))) return true;
            return false;
        });

    const joyasParaElModal = inventario.filter(joya => {
        const matchesCat = modalFiltroCategoria === '' || joya.categoria === modalFiltroCategoria;
        const matchesStock = modalOcultarAgotados ? joya.stock > 0 : true;
        return (matchesCat && matchesStock) || joyasSeleccionadas.includes(joya.id);
    });

    const generarReporteEstratega = () => {
        setIsGenerating(true);
        const pubsPlataforma = publicaciones.filter(p => p.plataforma === activePlatform);

        let reporteTexto = `📊 REPORTE DE CONTENIDO - ${activePlatform.toUpperCase()} 📊\n`;
        reporteTexto += `(Generado para análisis comparativo de retención y limpieza del feed)\n\n`;

        pubsPlataforma.forEach(pub => {
            const estadoVideo = getEstadoVideo(pub.relaciones);
            let joyasTexto = pub.relaciones && pub.relaciones.length > 0
                ? pub.relaciones.map(rel => rel.joya.nombre).join(" + ")
                : "Contenido General (Vlog)";

            reporteTexto += `📌 [${pub.formato.toUpperCase()}] ${pub.titulo}\n`;
            reporteTexto += `🗓️ Fecha Subida: ${pub.fechaPublicacion || 'N/A'}\n`;
            reporteTexto += `💎 Joya(s): ${joyasTexto}\n`;
            if (pub.formato.includes('Carrusel') && pub.cantidadFotos) {
                reporteTexto += `📸 Cantidad de Fotos: ${pub.cantidadFotos}\n`;
            }
            reporteTexto += `🔴 Estado de Inventario: ${estadoVideo.msg.replace(/[🚨⚠️✅]/g, '')}\n`;
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

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-xl shadow-2xl border border-zinc-800 font-sans mt-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <img src={logoByLuxo} alt="Joyas" className="w-16 h-16 rounded-full border border-zinc-700 shadow-md" />
                    <div>
                        <h2 className="text-2xl font-light tracking-widest text-zinc-100 uppercase">Vitrina de Contenidos</h2>
                        <p className="text-sm text-zinc-500">Auditoría Visual y Control Operativo</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={abrirParaCrear} className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded hover:bg-zinc-200 transition-colors shadow-lg text-sm tracking-widest">
                        <Plus className="w-4 h-4" /> ANOTAR VIDEO
                    </button>
                    <button onClick={cargarDatos} className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors" title="Actualizar Datos">
                        <RefreshCw className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-2">
                    <button onClick={() => setActivePlatform('Instagram')} className={`px-8 py-3 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all ${activePlatform === 'Instagram' ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-900/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'}`}>
                        <Camera className="w-5 h-5" /> INSTAGRAM
                    </button>
                    <button onClick={() => setActivePlatform('TikTok')} className={`px-8 py-3 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all ${activePlatform === 'TikTok' ? 'bg-black text-white border border-zinc-700 shadow-lg shadow-zinc-800/50' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'}`}>
                        <Video className="w-5 h-5" /> TIKTOK
                    </button>
                </div>

                <div className="flex flex-1 items-center gap-3">
                    <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 w-full">
                        <Search className="w-4 h-4 text-zinc-500 mr-2" />
                        <input
                            type="text"
                            placeholder="Buscar video o joya..."
                            value={searchTermGallery}
                            onChange={(e) => setSearchTermGallery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 w-full"
                        />
                    </div>
                    <button onClick={generarReporteEstratega} disabled={isGenerating} className="w-full md:w-auto bg-zinc-800 text-zinc-300 font-bold px-6 py-2.5 rounded hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors shadow-lg text-xs tracking-wider">
                        {isGenerating ? 'Generando...' : `📋 COPIAR REPORTE`}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pubsVisualizar.length === 0 ? (
                    <div className="col-span-full p-10 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl">
                        No hay videos registrados o ninguno coincide con la búsqueda.
                    </div>
                ) : (
                    pubsVisualizar.map((pub) => {
                        const estado = getEstadoVideo(pub.relaciones);
                        return (
                            <div key={pub.id} className={`bg-zinc-900 border rounded-xl overflow-hidden flex flex-col transition-all hover:border-zinc-500 ${estado.msg.includes('BORRAR') ? 'border-red-900/50 shadow-lg shadow-red-900/10' : 'border-zinc-800'}`}>

                                <div className="p-4 border-b border-zinc-800 bg-black/40">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{pub.formato}</span>
                                            <span className="text-[10px] text-zinc-600">{pub.fechaPublicacion}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => abrirParaEditar(pub)} className="text-zinc-600 hover:text-white transition-colors" title="Editar Video">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEliminarVideo(pub.id)} className="text-zinc-600 hover:text-red-500 transition-colors" title="Borrar Video">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-sm text-zinc-200 line-clamp-2 leading-tight min-h-[2.5rem]">{pub.titulo}</h3>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div className={`text-[10px] px-2 py-1.5 rounded text-center mb-4 uppercase tracking-widest ${estado.color}`}>
                                        {estado.msg}
                                    </div>

                                    <div className="space-y-1.5">
                                        {(!pub.relaciones || pub.relaciones.length === 0) ? (
                                            <p className="text-xs text-zinc-500 italic text-center">Video general. No expone joyas.</p>
                                        ) : (
                                            pub.relaciones.map(rel => {
                                                const joyaEnInventario = inventario.find(j => j.id === rel.joya.id);
                                                const stockActualVal = joyaEnInventario ? joyaEnInventario.stock : 0;
                                                const descuadrado = rel.stockAlSubir !== stockActualVal;

                                                return (
                                                    <div key={rel.id} className={`text-xs p-2 rounded border flex flex-col gap-1 ${descuadrado ? 'bg-yellow-950/20 border-yellow-700/50 text-yellow-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                                        <span className="truncate font-bold text-zinc-200">{rel.joya.nombre}</span>
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <Zap className="w-3 h-3 text-zinc-500" />
                                                                <span>G: {rel.stockAlSubir}u</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <PackageSearch className={`w-3.5 h-3.5 ${descuadrado ? 'text-yellow-400' : 'text-zinc-500'}`} />
                                                                <span className={descuadrado ? 'font-bold' : ''}>A: {stockActualVal}u</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                            <h3 className="text-xl font-light tracking-widest text-zinc-100 uppercase">
                                {editingId ? '✏️ Editar Video' : '🎬 Anotar Nuevo Video'}
                            </h3>
                            <button onClick={cerrarModal} className="text-zinc-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Título del Video</label>
                                <input type="text" placeholder="Ej: Gancho Cadena Cartier" value={nuevoVideo.titulo} onChange={(e) => setNuevoVideo({...nuevoVideo, titulo: e.target.value})} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                            </div>

                            <div className="flex flex-col md:col-span-1">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Fecha de Subida</label>
                                <input
                                    type="date"
                                    value={nuevoVideo.fechaPublicacion}
                                    onChange={(e) => setNuevoVideo({...nuevoVideo, fechaPublicacion: e.target.value})}
                                    className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400 [color-scheme:dark]"
                                />
                            </div>

                            <div className="flex flex-col md:col-span-1">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Plataforma</label>
                                <select value={nuevoVideo.plataforma} onChange={(e) => setNuevoVideo({...nuevoVideo, plataforma: e.target.value, formato: e.target.value.includes('Instagram') ? 'Reel' : 'Video'})} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 text-sm focus:outline-none focus:border-zinc-400">
                                    <option value="Instagram">Instagram</option>
                                    <option value="TikTok">TikTok</option>
                                    {!editingId && <option value="Ambas (IG + TikTok)">Ambas (IG + TikTok)</option>}
                                </select>
                            </div>

                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Formato</label>
                                <select value={nuevoVideo.formato} onChange={(e) => setNuevoVideo({...nuevoVideo, formato: e.target.value})} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 text-sm focus:outline-none focus:border-zinc-400">
                                    {nuevoVideo.plataforma === 'Instagram' ? (
                                        <>
                                            <option value="Reel">Reel</option>
                                            <option value="Carrusel">Carrusel</option>
                                            <option value="Historia">Historia</option>
                                            <option value="Reel + Historia">Reel + Historia</option>
                                            <option value="Carrusel + Historia">Carrusel + Historia</option>
                                        </>
                                    ) : nuevoVideo.plataforma === 'TikTok' ? (
                                        <>
                                            <option value="Video">Video</option>
                                            <option value="Carrusel">Carrusel</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Reel / Video">Reel (IG) / Video (TK)</option>
                                            <option value="Carrusel">Carrusel (IG y TK)</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {nuevoVideo.formato.includes('Carrusel') && (
                                <div className="flex flex-col md:col-span-2">
                                    <label className="text-[10px] text-green-400 uppercase tracking-wider mb-1 pl-1 font-bold">Cantidad de Fotos</label>
                                    <input type="number" placeholder="Ej: 4" value={nuevoVideo.cantidadFotos} onChange={(e) => setNuevoVideo({...nuevoVideo, cantidadFotos: e.target.value})} className="p-2.5 bg-zinc-900/50 border border-green-800/50 rounded text-green-400 text-sm focus:outline-none focus:border-green-500 placeholder:text-zinc-600" />
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800 mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-bold tracking-wide text-zinc-100 uppercase">💎 ¿Qué joyas aparecen?</h3>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={modalFiltroCategoria}
                                        onChange={(e) => setModalFiltroCategoria(e.target.value)}
                                        className="text-xs bg-zinc-800 border border-zinc-700 text-white rounded p-1 focus:outline-none focus:border-zinc-500"
                                    >
                                        <option value="">Todas</option>
                                        <option value="Cadena">Cadena</option>
                                        <option value="Pulsera">Pulsera</option>
                                        <option value="Aro">Aro</option>
                                        <option value="Tobillera">Tobillera</option>
                                        <option value="Colgante">Colgante</option>
                                        <option value="Anillo">Anillo</option>
                                    </select>
                                    <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer hover:text-white transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={modalOcultarAgotados}
                                            onChange={(e) => setModalOcultarAgotados(e.target.checked)}
                                            className="w-3 h-3 accent-white bg-zinc-800 border-zinc-700 rounded cursor-pointer"
                                        />
                                        Ocultar agotados
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                                {joyasParaElModal.map(joya => (
                                    <button
                                        type="button"
                                        key={joya.id}
                                        onClick={() => toggleJoyaSeleccionada(joya.id)}
                                        className={`p-2 text-left text-xs rounded border transition-colors ${joyasSeleccionadas.includes(joya.id) ? 'bg-green-500/20 border-green-500 text-green-400 font-bold' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                    >
                                        {joyasSeleccionadas.includes(joya.id) && '✓ '}
                                        {joya.nombre}
                                    </button>
                                ))}
                                {joyasParaElModal.length === 0 && (
                                    <p className="text-xs text-zinc-500 col-span-3 text-center py-4">No hay joyas que coincidan con estos filtros.</p>
                                )}
                            </div>
                        </div>

                        <button onClick={handleRegistrarVideo} className="w-full bg-white text-black hover:bg-zinc-200 font-bold tracking-widest py-3 rounded transition-colors shadow-lg text-sm">
                            🚀 {editingId ? 'GUARDAR CAMBIOS' : 'GUARDAR VIDEO'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentGallery;