import { useState, useEffect } from 'react';
import logoByLuxo from '../assets/logo.jpeg';

const initialMetrics = {
    likes: '', comentarios: '', enviados: '', reposts: '', guardados: '',
    reproduccionesIG: '', reproduccionesFB: '', cuentasAlcanzadas: '', personasVieron: '', tiempoMedio: '',
    tasaOmisionReel: '', likesPorFoto: '',
    actividadPerfilTotal: '', visitasPerfil: '', nuevosSeguidores: '',
    vistasSeguidores: '', reproduccionesSeguidores: '', interaccionesSeguidores: '',
    respuestas: '', navegacionTotal: '', avanzar: '', abandonos: '', retrocesos: '', siguienteHistoria: '',
    reproduccionesTotalesTK: '', tiempoTotal: '', videoCompleto: '', fotosVisualizadas: ''
};

const InputBox = ({ label, name, type = "number", placeholder, value, onChange, borderClass = "" }) => (
    <div className="flex flex-col">
        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">{label}</label>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full p-2 bg-zinc-800/80 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400 transition-colors ${borderClass}`}
        />
    </div>
);

const StatsGenerator = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [reporteGenerado, setReporteGenerado] = useState('');
    const [publicacionSeleccionada, setPublicacionSeleccionada] = useState('');
    const [formData, setFormData] = useState({ tituloVideo: '', plataforma: 'Instagram', formato: 'Reel', ...initialMetrics });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resPubs = await fetch('https://joyas-byluxo1.onrender.com/api/publicaciones');
            if (resPubs.ok) setPublicaciones(await resPubs.json());
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    const handleSeleccionarPublicacionParaReporte = (id) => {
        setPublicacionSeleccionada(id);
        const pub = publicaciones.find(p => p.id === Number(id));
        if (pub) {
            setFormData({
                ...initialMetrics,
                tituloVideo: pub.titulo,
                plataforma: pub.plataforma,
                formato: pub.formato,
                likes: pub.likes || '',
                comentarios: pub.comentarios || '',
                guardados: pub.guardados || '',
                enviados: pub.compartidos || '',
                reproduccionesIG: pub.plataforma === 'Instagram' ? pub.reproducciones || '' : '',
                reproduccionesTotalesTK: pub.plataforma === 'TikTok' ? pub.reproducciones || '' : ''
            });
        }
        setReporteGenerado('');
    };

    const handleChangeForm = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generarReporteYActualizarBD = async () => {
        if (!publicacionSeleccionada) {
            alert("Selecciona un video de la lista para actualizar sus métricas.");
            return;
        }

        const repros = formData.plataforma === 'Instagram'
            ? (Number(formData.reproduccionesIG) + Number(formData.reproduccionesFB))
            : Number(formData.reproduccionesTotalesTK);

        const metricasBD = {
            reproducciones: repros || 0,
            likes: Number(formData.likes) || 0,
            comentarios: Number(formData.comentarios) || 0,
            guardados: Number(formData.guardados) || 0,
            compartidos: Number(formData.enviados) || 0
        };

        try {
            await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${publicacionSeleccionada}/metricas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metricasBD)
            });
            cargarDatos();
        } catch (error) {
            console.error("Error al actualizar métricas en BD:", error);
        }

        let reporte = `📊 [STATS ${formData.plataforma.toUpperCase()} - ${formData.formato.toUpperCase()}]\n`;
        reporte += `📌 Joya/Título: ${formData.tituloVideo}\n\n`;

        if (formData.plataforma === 'Instagram') {
            reporte += `💬 Interacciones Principales:\n`;
            if (Number(formData.likes) > 0) reporte += `- Likes: ${formData.likes}\n`;
            if (Number(formData.comentarios) > 0) reporte += `- Comentarios: ${formData.comentarios}\n`;
            if (Number(formData.reposts) > 0) reporte += `- Reposts: ${formData.reposts}\n`;
            if (Number(formData.enviados) > 0) reporte += `- Compartidos: ${formData.enviados}\n`;
            if (Number(formData.guardados) > 0) reporte += `- Guardados: ${formData.guardados}\n\n`;

            const reproTotalesCalc = (Number(formData.reproduccionesIG) || 0) + (Number(formData.reproduccionesFB) || 0);
            reporte += `📈 Resumen de Alcance:\n`;
            if (reproTotalesCalc > 0) reporte += `- Repro Totales: ${reproTotalesCalc} (IG: ${formData.reproduccionesIG || 0} | FB: ${formData.reproduccionesFB || 0})\n`;
            if (Number(formData.cuentasAlcanzadas) > 0) reporte += `- Cuentas Alcanzadas: ${formData.cuentasAlcanzadas}\n`;
            if (formData.tiempoMedio) reporte += `- Tiempo Medio: ${formData.tiempoMedio}s\n`;

            reporte += `👥 Perfil y Audiencia:\n`;
            if (Number(formData.visitasPerfil) > 0) reporte += `- Visitas al Perfil: ${formData.visitasPerfil}\n`;
            if (Number(formData.nuevosSeguidores) > 0) reporte += `- Nuevos Seguidores: ${formData.nuevosSeguidores}\n`;
        }

        if (formData.plataforma === 'TikTok') {
            reporte += `📈 Alcance y Retención:\n`;
            if (Number(formData.reproduccionesTotalesTK) > 0) reporte += `- Reproducciones: ${formData.reproduccionesTotalesTK}\n`;
            if (formData.tiempoTotal) reporte += `- Tiempo Total: ${formData.tiempoTotal}\n`;
            if (formData.videoCompleto) reporte += `- Vio Completo: ${formData.videoCompleto}%\n\n`;

            reporte += `💬 Interacciones:\n`;
            if (Number(formData.likes) > 0) reporte += `- Likes: ${formData.likes}\n`;
            if (Number(formData.comentarios) > 0) reporte += `- Comentarios: ${formData.comentarios}\n`;
            if (Number(formData.guardados) > 0) reporte += `- Guardados: ${formData.guardados}\n`;
            if (Number(formData.enviados) > 0) reporte += `- Compartidos: ${formData.enviados}\n\n`;
        }

        setReporteGenerado(reporte);
    };

    const copiarAlPortapapeles = () => {
        navigator.clipboard.writeText(reporteGenerado);
        alert('¡Reporte copiado con éxito!');
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-xl shadow-2xl border border-zinc-800 font-sans mt-6">
            <div className="flex flex-col items-center mb-6 border-b border-zinc-800 pb-6">
                <img src={logoByLuxo} alt="Joyas byLuxo" className="w-20 h-20 object-cover rounded-full mb-3 border border-zinc-700 shadow-md" />
                <h2 className="text-xl font-light tracking-widest text-zinc-100 uppercase">Actualización de Métricas</h2>
            </div>

            <div className="animate-fade-in">
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 pl-1 font-bold block">🔍 Seleccionar Video Subido</label>
                    <select
                        value={publicacionSeleccionada}
                        onChange={(e) => handleSeleccionarPublicacionParaReporte(e.target.value)}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                        <option value="">-- Elige el contenido que deseas actualizar --</option>
                        {[...publicaciones].reverse().map(pub => (
                            <option key={pub.id} value={pub.id}>
                                {pub.fechaPublicacion} | {pub.plataforma} ({pub.formato}) - {pub.titulo}
                            </option>
                        ))}
                    </select>
                </div>

                {publicacionSeleccionada && (
                    <>
                        {formData.plataforma === 'Instagram' && formData.formato === 'Reel' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase">💬 Interacciones</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <InputBox label="Likes" name="likes" value={formData.likes} onChange={handleChangeForm} />
                                        <InputBox label="Comentarios" name="comentarios" value={formData.comentarios} onChange={handleChangeForm} />
                                        <InputBox label="Compartidos" name="enviados" value={formData.enviados} onChange={handleChangeForm} />
                                        <InputBox label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} />
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase">📈 Resumen & Alcance</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <InputBox label="Repro Instagram" name="reproduccionesIG" value={formData.reproduccionesIG} onChange={handleChangeForm} />
                                        <InputBox label="Cuentas Alcanzadas" name="cuentasAlcanzadas" value={formData.cuentasAlcanzadas} onChange={handleChangeForm} />
                                        <InputBox label="Tiempo Medio (Segs)" name="tiempoMedio" value={formData.tiempoMedio} onChange={handleChangeForm} />
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase">👥 Perfil</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <InputBox label="Visitas al Perfil" name="visitasPerfil" value={formData.visitasPerfil} onChange={handleChangeForm} />
                                        <InputBox label="Nuevos Seguidores" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.plataforma === 'TikTok' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase">📈 Reproducciones</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <InputBox label="Reproducciones Totales" name="reproduccionesTotalesTK" value={formData.reproduccionesTotalesTK} onChange={handleChangeForm} />
                                        <InputBox type="text" label="Tiempo Total" name="tiempoTotal" value={formData.tiempoTotal} onChange={handleChangeForm} />
                                        <InputBox label="% Vio Completo" name="videoCompleto" value={formData.videoCompleto} onChange={handleChangeForm} />
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase">💬 Interacciones</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <InputBox label="Likes" name="likes" value={formData.likes} onChange={handleChangeForm} />
                                        <InputBox label="Comentarios" name="comentarios" value={formData.comentarios} onChange={handleChangeForm} />
                                        <InputBox label="Compartidos" name="enviados" value={formData.enviados} onChange={handleChangeForm} />
                                        <InputBox label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} />
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase">👥 Perfil</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <InputBox label="Nuevos Seguidores" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <button onClick={generarReporteYActualizarBD} className="bg-white text-black hover:bg-zinc-200 font-bold tracking-widest py-3 px-8 rounded transition-colors shadow-lg text-sm w-full md:w-auto">
                                ✨ ACTUALIZAR BD Y GENERAR REPORTE
                            </button>
                        </div>

                        {reporteGenerado && (
                            <div className="mt-6 animate-fade-in">
                                <textarea readOnly value={reporteGenerado} className="w-full h-48 p-4 bg-zinc-900 text-zinc-300 font-mono text-xs rounded-lg border border-zinc-700 focus:outline-none mb-3 resize-none leading-relaxed shadow-inner"></textarea>
                                <button onClick={copiarAlPortapapeles} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded transition-colors border border-zinc-600 shadow-lg text-sm">
                                    📋 COPIAR TEXTO AL PORTAPAPELES
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StatsGenerator;