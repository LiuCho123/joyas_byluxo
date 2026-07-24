import { useState, useEffect } from 'react';
import { RefreshCw, MessageCircle, Heart, Play, Plus, Minus, X, Camera, Video, Trash2, Pencil, PackageSearch, Zap, Search, Store, MessageSquare, BarChart3, Bookmark, Share2 } from 'lucide-react';
import logoByLuxo from '../assets/logo.jpeg';

const ContentGallery = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [activePlatform, setActivePlatform] = useState('Instagram');
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTermGallery, setSearchTermGallery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [activeStatsPub, setActiveStatsPub] = useState(null);
    const [tempStats, setTempStats] = useState({});

    const [modalFiltroCategoria, setModalFiltroCategoria] = useState('');
    const [modalOcultarAgotados, setModalOcultarAgotados] = useState(true);

    const getChileanDate = () => {
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;
        const chileanDate = new Date(date.getTime() - offset - (4 * 3600000));
        return chileanDate.toISOString().split('T')[0];
    };

    const hoy = getChileanDate();
    const [nuevoVideo, setNuevoVideo] = useState({ titulo: '', plataforma: 'Instagram', formato: 'Reel', fechaPublicacion: hoy, cantidadFotos: '', precioCombo: '' });
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
        if (!window.confirm("¿Seguro que deseas eliminar este contenido del registro?")) return;
        try {
            const res = await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${id}`, { method: 'DELETE' });
            if (res.ok) cargarDatos();
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    const handleMensajeMarketplace = async (id) => {
        try {
            const res = await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${id}/mensaje-mkp`, { method: 'PUT' });
            if (res.ok) cargarDatos();
        } catch (error) {
            console.error("Error registrando mensaje:", error);
        }
    };

    // --- NUEVO: RESTAR MENSAJE ---
    const handleRestarMensajeMarketplace = async (id) => {
        try {
            const res = await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${id}/restar-mensaje-mkp`, { method: 'PUT' });
            if (res.ok) cargarDatos();
        } catch (error) {
            console.error("Error restando mensaje:", error);
        }
    };

    const abrirParaCrear = () => {
        setEditingId(null);
        let formatoInicial = 'Reel';
        if (activePlatform === 'TikTok') formatoInicial = 'Video';
        if (activePlatform === 'Marketplace') formatoInicial = 'Publicación';
        if (activePlatform === 'WhatsApp') formatoInicial = 'Estado';

        setNuevoVideo({
            titulo: '', plataforma: activePlatform, formato: formatoInicial, fechaPublicacion: hoy, cantidadFotos: '', precioCombo: ''
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
            cantidadFotos: pub.cantidadFotos || '',
            precioCombo: pub.precioCombo || ''
        });
        setJoyasSeleccionadas(pub.relaciones ? pub.relaciones.map(r => r.joya.id) : []);
        setIsModalOpen(true);
    };

    const cerrarModal = () => {
        setNuevoVideo({ titulo: '', plataforma: activePlatform, formato: 'Reel', fechaPublicacion: hoy, cantidadFotos: '', precioCombo: '' });
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
            precioCombo: nuevoVideo.precioCombo ? Number(nuevoVideo.precioCombo) : null,
            joyas: joyasSeleccionadas.map(id => ({ id: Number(id) }))
        });

        try {
            if (nuevoVideo.plataforma === 'Ambas (IG + TikTok)' && !editingId) {
                const formatoIG = nuevoVideo.formato.includes('Carrusel') ? 'Carrusel' : 'Reel';
                const formatoTK = nuevoVideo.formato.includes('Carrusel') ? 'Carrusel' : 'Video';

                await fetch('https://joyas-byluxo1.onrender.com/api/publicaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(crearPayload('Instagram', formatoIG)) });
                await fetch('https://joyas-byluxo1.onrender.com/api/publicaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(crearPayload('TikTok', formatoTK)) });
            } else {
                const url = editingId ? `https://joyas-byluxo1.onrender.com/api/publicaciones/${editingId}` : 'https://joyas-byluxo1.onrender.com/api/publicaciones';
                const method = editingId ? 'PUT' : 'POST';
                await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(crearPayload(nuevoVideo.plataforma, nuevoVideo.formato)) });
            }
            cerrarModal();
            cargarDatos();
        } catch (error) {
            console.error("Error al registrar contenido:", error);
        }
    };

    const abrirModalStats = (pub) => {
        setActiveStatsPub(pub);
        setTempStats({
            reproducciones: pub.reproducciones || 0,
            likes: pub.likes || 0,
            comentarios: pub.comentarios || 0,
            guardados: pub.guardados || 0,
            compartidos: pub.compartidos || 0,
            reproduccionesHistoria: pub.reproduccionesHistoria || 0,
            likesHistoria: pub.likesHistoria || 0,
            respuestasHistoria: pub.respuestasHistoria || 0
        });
        setIsStatsModalOpen(true);
    };

    const handleGuardarStats = async () => {
        try {
            const res = await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${activeStatsPub.id}/metricas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempStats)
            });
            if (res.ok) {
                setIsStatsModalOpen(false);
                cargarDatos();
            }
        } catch (error) {
            console.error("Error actualizando métricas", error);
        }
    };

    const handleStatChange = (e) => {
        setTempStats({ ...tempStats, [e.target.name]: parseInt(e.target.value) || 0 });
    };

    const getEstadoVideo = (pubJoyasRelacion) => {
        if (!pubJoyasRelacion || pubJoyasRelacion.length === 0) return { msg: "VLOG / GENERAL", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" };
        let totalJoyasVideo = pubJoyasRelacion.length;
        let joyasAgotadas = 0;
        let joyasDescuadradas = 0;

        pubJoyasRelacion.forEach(pjRel => {
            const stockCongelado = pjRel.stockAlSubir;
            const joyaActual = inventario.find(j => j.id === pjRel.joya.id);
            if (joyaActual) {
                if (joyaActual.stock === 0) joyasAgotadas++;
                else if (joyaActual.stock !== stockCongelado) joyasDescuadradas++;
            }
        });

        if (joyasAgotadas === totalJoyasVideo) return { msg: "🚨 BORRAR: Agotado", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400 font-bold" };
        if (joyasDescuadradas > 0 || (joyasAgotadas > 0 && joyasAgotadas < totalJoyasVideo)) return { msg: "⚠️ ACTUALIZAR LOTE", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400 font-bold" };
        return { msg: "✅ STOCK BLINDADO", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" };
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
        let reporteTexto = `📊 REPORTE DE CONTENIDO - ${activePlatform.toUpperCase()} 📊\n\n`;

        pubsPlataforma.forEach(pub => {
            const estadoVideo = getEstadoVideo(pub.relaciones);
            let joyasTexto = pub.relaciones && pub.relaciones.length > 0 ? pub.relaciones.map(rel => rel.joya.nombre).join(" + ") : "General";

            reporteTexto += `📌 [${pub.formato.toUpperCase()}] ${pub.titulo}\n`;
            reporteTexto += `🗓️ Fecha Subida: ${pub.fechaPublicacion || 'N/A'}\n`;
            if (pub.precioCombo) reporteTexto += `⚡ PRECIO COMBO: $${pub.precioCombo.toLocaleString('es-CL')}\n`;
            reporteTexto += `💎 Joya(s): ${joyasTexto}\n`;
            if (pub.formato.includes('Carrusel') && pub.cantidadFotos) reporteTexto += `📸 Cantidad de Fotos: ${pub.cantidadFotos}\n`;
            reporteTexto += `🔴 Estado: ${estadoVideo.msg.replace(/[🚨⚠️✅]/g, '')}\n`;

            if (pub.plataforma === 'Instagram' || pub.plataforma === 'TikTok') {
                reporteTexto += `📈 Rendimiento Principal:\n`;
                reporteTexto += `   - Repro: ${pub.reproducciones || 0} | Likes: ${pub.likes || 0} | Coments: ${pub.comentarios || 0}\n`;
                if (pub.formato.includes('Historia')) {
                    reporteTexto += `📈 Rendimiento Historia:\n`;
                    reporteTexto += `   - Repro: ${pub.reproduccionesHistoria || 0} | Likes: ${pub.likesHistoria || 0} | Respuestas: ${pub.respuestasHistoria || 0}\n`;
                }
            }

            if (pub.plataforma === 'Marketplace') {
                reporteTexto += `💬 Mensajes: ${pub.mensajesMarketplace || 0}\n`;
            }

            reporteTexto += `-----------------------------------\n\n`;
        });

        navigator.clipboard.writeText(reporteTexto);
        setTimeout(() => { alert('¡Reporte copiado al portapapeles!'); setIsGenerating(false); }, 500);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-2xl shadow-2xl border border-zinc-800/50 font-sans mt-6">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-600 to-purple-600 blur rounded-full opacity-30"></div>
                        <img src={logoByLuxo} alt="Joyas" className="w-16 h-16 rounded-full border border-zinc-700/50 relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-light tracking-widest text-zinc-100 uppercase">Vitrina de Contenidos</h2>
                        <p className="text-sm text-zinc-500 font-medium">Auditoría Visual y Ecosistema de Redes</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={abrirParaCrear} className="flex items-center gap-2 bg-gradient-to-r from-zinc-100 to-zinc-300 text-black font-bold px-5 py-2.5 rounded-lg hover:from-white hover:to-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm tracking-widest">
                        <Plus className="w-4 h-4" /> AÑADIR PUBLICACIÓN
                    </button>
                    <button onClick={cargarDatos} className="p-2.5 bg-zinc-900 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 transition-colors">
                        <RefreshCw className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
                <div className="flex flex-wrap gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/50">
                    <button onClick={() => setActivePlatform('Instagram')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all text-xs ${activePlatform === 'Instagram' ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}><Camera className="w-4 h-4" /> IG</button>
                    <button onClick={() => setActivePlatform('TikTok')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all text-xs ${activePlatform === 'TikTok' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}><Video className="w-4 h-4" /> TK</button>
                    <button onClick={() => setActivePlatform('Marketplace')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all text-xs ${activePlatform === 'Marketplace' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}><Store className="w-4 h-4" /> MKP</button>
                    <button onClick={() => setActivePlatform('WhatsApp')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 transition-all text-xs ${activePlatform === 'WhatsApp' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}><MessageSquare className="w-4 h-4" /> WSP</button>
                </div>

                <div className="flex flex-1 items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 w-full transition-colors focus-within:border-zinc-500">
                        <Search className="w-4 h-4 text-zinc-500 mr-3" />
                        <input type="text" placeholder="Buscar título o joya..." value={searchTermGallery} onChange={(e) => setSearchTermGallery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-zinc-200 placeholder-zinc-600 w-full" />
                    </div>
                    <button onClick={generarReporteEstratega} disabled={isGenerating} className="w-full md:w-auto bg-zinc-800/50 text-zinc-300 font-bold px-6 py-3 rounded-xl hover:bg-zinc-800 hover:text-white border border-zinc-700/50 shadow-lg text-xs tracking-wider transition-all">
                        {isGenerating ? 'Generando...' : `📋 REPORTE`}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pubsVisualizar.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-2xl bg-zinc-900/20">
                        <div className="mb-3 flex justify-center"><Camera className="w-8 h-8 opacity-50" /></div>
                        <p className="font-medium tracking-wide">No hay contenido registrado o ninguno coincide con la búsqueda.</p>
                    </div>
                ) : (
                    pubsVisualizar.map((pub) => {
                        const estado = getEstadoVideo(pub.relaciones);
                        return (
                            <div key={pub.id} className={`group bg-zinc-900/80 border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-zinc-600 ${estado.msg.includes('BORRAR') ? 'border-rose-900/50' : 'border-zinc-800/80'}`}>
                                <div className="p-5 border-b border-zinc-800/50 bg-gradient-to-b from-zinc-800/30 to-transparent">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-md inline-block w-fit mb-1">{pub.formato}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">{pub.fechaPublicacion}</span>
                                        </div>
                                        <div className="flex gap-2 bg-zinc-950/50 rounded-lg p-1 border border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => abrirParaEditar(pub)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleEliminarVideo(pub.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-sm text-zinc-200 line-clamp-2 min-h-[2.5rem] leading-snug">{pub.titulo}</h3>
                                    {pub.precioCombo && (
                                        <div className="mt-3 text-xs font-black text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                                            <Zap className="w-3.5 h-3.5" /> LOTE: ${pub.precioCombo.toLocaleString('es-CL')}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between bg-zinc-950/30">
                                    <div className={`text-[10px] px-3 py-2 rounded-lg text-center mb-5 uppercase tracking-widest border ${estado.bg} ${estado.border} ${estado.text} font-bold shadow-inner`}>
                                        {estado.msg}
                                    </div>
                                    <div className="space-y-2">
                                        {(!pub.relaciones || pub.relaciones.length === 0) ? (
                                            <div className="py-4 border border-zinc-800/50 border-dashed rounded-xl flex items-center justify-center bg-zinc-900/20">
                                                <p className="text-xs text-zinc-500 font-medium italic">No expone joyas.</p>
                                            </div>
                                        ) : (
                                            pub.relaciones.map(rel => {
                                                const joyaEnInv = inventario.find(j => j.id === rel.joya.id);
                                                const stockActual = joyaEnInv ? joyaEnInv.stock : 0;
                                                const desc = rel.stockAlSubir !== stockActual;
                                                return (
                                                    <div key={rel.id} className={`text-xs p-2.5 rounded-xl border flex flex-col gap-1.5 transition-colors ${desc ? 'bg-amber-950/20 border-amber-700/50 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                                                        <span className="truncate font-bold tracking-wide">{rel.joya.nombre}</span>
                                                        <div className="flex justify-between text-[10px] font-medium bg-black/20 px-2 py-1 rounded-md">
                                                            <span className="flex gap-1 items-center text-zinc-500"><Zap className="w-3 h-3" /> G: {rel.stockAlSubir}</span>
                                                            <span className={`flex gap-1 items-center ${desc ? 'text-amber-400' : 'text-zinc-300'}`}><PackageSearch className="w-3 h-3" /> A: {stockActual}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {(pub.plataforma === 'Instagram' || pub.plataforma === 'TikTok') && (
                                    <div className="p-3 border-t border-zinc-800/50 bg-zinc-900/80 flex justify-between items-center px-5">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-zinc-400"><Play className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-bold">{pub.reproducciones || 0}</span></div>
                                            <div className="flex items-center gap-1.5 text-zinc-400"><Heart className="w-3.5 h-3.5 text-rose-400" /><span className="text-xs font-bold">{pub.likes || 0}</span></div>
                                        </div>
                                        <button onClick={() => abrirModalStats(pub)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700">
                                            <BarChart3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {/* AQUI QUEDÓ EL BOTÓN DOBLE DE MARKETPLACE */}
                                {pub.plataforma === 'Marketplace' && (
                                    <div className="p-3 border-t border-blue-900/30 bg-blue-950/10 flex gap-2">
                                        <button onClick={() => handleMensajeMarketplace(pub.id)} className="flex-1 bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                            <MessageCircle className="w-4 h-4" /> Alguien me habló ({pub.mensajesMarketplace || 0})
                                        </button>
                                        <button onClick={() => handleRestarMensajeMarketplace(pub.id)} className="w-10 bg-blue-900/50 hover:bg-rose-500/80 text-blue-200 hover:text-white rounded-xl flex items-center justify-center transition-all border border-blue-700/50 hover:border-rose-500" title="Restar mensaje (Error)">
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL MÁS BONITO PARA CREAR/EDITAR (Intacto) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-purple-600"></div>
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-800/50">
                            <h3 className="text-xl font-light tracking-widest text-zinc-100 uppercase flex items-center gap-3">
                                {editingId ? <Pencil className="w-5 h-5 text-zinc-400"/> : <Plus className="w-5 h-5 text-zinc-400"/>}
                                {editingId ? 'Editar Contenido' : 'Anotar Contenido'}
                            </h3>
                            <button onClick={cerrarModal} className="text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 pl-1 font-bold">Título / Descripción</label>
                                <input type="text" placeholder="Ej: Gancho Cadena Cartier" value={nuevoVideo.titulo} onChange={(e) => setNuevoVideo({...nuevoVideo, titulo: e.target.value})} className="p-3 bg-zinc-900 border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                            </div>
                            <div className="flex flex-col md:col-span-1">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 pl-1 font-bold">Fecha</label>
                                <input type="date" value={nuevoVideo.fechaPublicacion} onChange={(e) => setNuevoVideo({...nuevoVideo, fechaPublicacion: e.target.value})} className="p-3 bg-zinc-900 border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]" />
                            </div>
                            <div className="flex flex-col md:col-span-1">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 pl-1 font-bold">Plataforma</label>
                                <select value={nuevoVideo.plataforma} onChange={(e) => {
                                    const plat = e.target.value;
                                    let defFormat = 'Reel';
                                    if(plat === 'TikTok') defFormat = 'Video';
                                    if(plat === 'Marketplace') defFormat = 'Publicación';
                                    if(plat === 'WhatsApp') defFormat = 'Estado';
                                    setNuevoVideo({...nuevoVideo, plataforma: plat, formato: defFormat});
                                }} className="p-3 bg-zinc-900 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors">
                                    <option value="Instagram">Instagram</option><option value="TikTok">TikTok</option><option value="Marketplace">Marketplace</option><option value="WhatsApp">WhatsApp</option>
                                    {!editingId && <option value="Ambas (IG + TikTok)">Ambas (IG + TikTok)</option>}
                                </select>
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 pl-1 font-bold">Formato</label>
                                <select value={nuevoVideo.formato} onChange={(e) => setNuevoVideo({...nuevoVideo, formato: e.target.value})} className="p-3 bg-zinc-900 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors">
                                    {nuevoVideo.plataforma === 'Instagram' && <><option value="Reel">Reel</option><option value="Carrusel">Carrusel</option><option value="Historia">Historia</option><option value="Reel + Historia">Reel + Historia</option><option value="Carrusel + Historia">Carrusel + Historia</option></>}
                                    {nuevoVideo.plataforma === 'TikTok' && <><option value="Video">Video</option><option value="Carrusel">Carrusel</option></>}
                                    {nuevoVideo.plataforma === 'Marketplace' && <option value="Publicación">Publicación / Lote</option>}
                                    {nuevoVideo.plataforma === 'WhatsApp' && <><option value="Estado">Estado (Gancho/Vlog)</option><option value="Catálogo">Catálogo Fijo</option></>}
                                    {nuevoVideo.plataforma === 'Ambas (IG + TikTok)' && <><option value="Reel / Video">Reel (IG) / Video (TK)</option><option value="Carrusel">Carrusel (IG y TK)</option></>}
                                </select>
                            </div>

                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] text-amber-400 uppercase tracking-wider mb-1.5 pl-1 font-bold flex items-center gap-1"><Zap className="w-3 h-3"/> Precio Lote (Opcional)</label>
                                <input type="number" placeholder="Si vendes varias joyas en pack..." value={nuevoVideo.precioCombo} onChange={(e) => setNuevoVideo({...nuevoVideo, precioCombo: e.target.value})} className="p-3 bg-amber-900/10 border border-amber-700/50 rounded-xl text-amber-400 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-amber-700/50" />
                            </div>

                            {nuevoVideo.formato.includes('Carrusel') && (
                                <div className="flex flex-col md:col-span-4">
                                    <label className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1.5 pl-1 font-bold">Cantidad de Fotos</label>
                                    <input type="number" placeholder="Ej: 4" value={nuevoVideo.cantidadFotos} onChange={(e) => setNuevoVideo({...nuevoVideo, cantidadFotos: e.target.value})} className="p-3 bg-emerald-900/10 border border-emerald-800/50 rounded-xl text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-emerald-700/50 w-1/2" />
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800/50 mb-8">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800/50">
                                <h3 className="text-xs font-bold tracking-widest text-zinc-300 uppercase flex items-center gap-2"><PackageSearch className="w-4 h-4"/> ¿Qué joyas aparecen?</h3>
                                <div className="flex items-center gap-4">
                                    <select value={modalFiltroCategoria} onChange={(e) => setModalFiltroCategoria(e.target.value)} className="text-xs bg-zinc-950 border border-zinc-700 text-zinc-300 rounded-lg p-2 focus:outline-none">
                                        <option value="">Todas las cat.</option><option value="Cadena">Cadenas</option><option value="Pulsera">Pulseras</option><option value="Aro">Aros</option><option value="Anillo">Anillos</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition-colors">
                                        <input type="checkbox" checked={modalOcultarAgotados} onChange={(e) => setModalOcultarAgotados(e.target.checked)} className="w-3.5 h-3.5 accent-purple-500 bg-zinc-800 rounded cursor-pointer" /> Ocultar agotados
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {joyasParaElModal.map(joya => (
                                    <button type="button" key={joya.id} onClick={() => toggleJoyaSeleccionada(joya.id)} className={`p-2.5 text-left text-xs rounded-lg border transition-all duration-200 shadow-sm ${joyasSeleccionadas.includes(joya.id) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-zinc-950 border-zinc-800/50 text-zinc-400 hover:border-zinc-600'}`}>
                                        <div className="flex items-center gap-2 truncate">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${joyasSeleccionadas.includes(joya.id) ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-zinc-700'}`}></div>
                                            <span className="truncate">{joya.nombre}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleRegistrarVideo} className="w-full bg-gradient-to-r from-zinc-100 to-zinc-300 text-black hover:from-white hover:to-white font-bold tracking-widest py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all text-sm">
                            🚀 {editingId ? 'GUARDAR CAMBIOS' : 'GUARDAR CONTENIDO'}
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DE ESTADÍSTICAS RENOVADO (Intacto) */}
            {isStatsModalOpen && activeStatsPub && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800/50">
                            <h3 className="text-xl font-light tracking-widest text-zinc-100 uppercase flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-indigo-400" /> Rendimiento
                            </h3>
                            <button onClick={() => setIsStatsModalOpen(false)} className="text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <p className="text-sm text-zinc-400 mb-6 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50"><span className="font-bold text-zinc-200">Publicación:</span> {activeStatsPub.titulo}</p>

                        <div className="space-y-6">
                            <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/50">
                                <h4 className="text-xs font-bold tracking-widest text-zinc-300 uppercase mb-4 flex items-center gap-2"><Play className="w-4 h-4 text-indigo-400" /> Principal (Reel/Video/Post)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Vistas</label><input type="number" name="reproducciones" value={tempStats.reproducciones} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-zinc-700/50 rounded-lg text-white text-sm focus:border-indigo-500 outline-none" min="0"/></div>
                                    <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Likes</label><input type="number" name="likes" value={tempStats.likes} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-zinc-700/50 rounded-lg text-white text-sm focus:border-indigo-500 outline-none" min="0"/></div>
                                    <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Comentarios</label><input type="number" name="comentarios" value={tempStats.comentarios} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-zinc-700/50 rounded-lg text-white text-sm focus:border-indigo-500 outline-none" min="0"/></div>
                                    <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Guardados</label><input type="number" name="guardados" value={tempStats.guardados} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-zinc-700/50 rounded-lg text-white text-sm focus:border-indigo-500 outline-none" min="0"/></div>
                                    <div className="flex flex-col col-span-2"><label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Compartidos</label><input type="number" name="compartidos" value={tempStats.compartidos} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-zinc-700/50 rounded-lg text-white text-sm focus:border-indigo-500 outline-none" min="0"/></div>
                                </div>
                            </div>

                            {activeStatsPub.formato.includes('Historia') && (
                                <div className="bg-pink-900/10 p-5 rounded-xl border border-pink-800/30">
                                    <h4 className="text-xs font-bold tracking-widest text-pink-300 uppercase mb-4 flex items-center gap-2"><Camera className="w-4 h-4 text-pink-400" /> Rendimiento Historia</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col"><label className="text-[10px] text-pink-500/70 uppercase tracking-wider mb-1 font-bold">Vistas</label><input type="number" name="reproduccionesHistoria" value={tempStats.reproduccionesHistoria} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-pink-900/50 rounded-lg text-white text-sm focus:border-pink-500 outline-none" min="0"/></div>
                                        <div className="flex flex-col"><label className="text-[10px] text-pink-500/70 uppercase tracking-wider mb-1 font-bold">Likes</label><input type="number" name="likesHistoria" value={tempStats.likesHistoria} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-pink-900/50 rounded-lg text-white text-sm focus:border-pink-500 outline-none" min="0"/></div>
                                        <div className="flex flex-col col-span-2"><label className="text-[10px] text-pink-500/70 uppercase tracking-wider mb-1 font-bold">Respuestas / DMs</label><input type="number" name="respuestasHistoria" value={tempStats.respuestasHistoria} onChange={handleStatChange} className="p-2.5 bg-zinc-950 border border-pink-900/50 rounded-lg text-white text-sm focus:border-pink-500 outline-none" min="0"/></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleGuardarStats} className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold tracking-widest py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all text-sm">
                            💾 ACTUALIZAR MÉTRICAS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentGallery;