package com.liucho.backend.Service;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Publicacion;
import com.liucho.backend.Model.PublicacionJoya;
import com.liucho.backend.Repository.EstadoRedesRepository;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Repository.PublicacionJoyaRepository;
import com.liucho.backend.Repository.PublicacionRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PublicacionService {

    @Autowired private PublicacionRepository publicacionRepository;
    @Autowired private JoyaRepository joyaRepository;
    @Autowired private PublicacionJoyaRepository publicacionJoyaRepository;
    @Autowired private EstadoRedesRepository estadoRedesRepository;

    @Transactional
    public void recalcularEstadoJoya(Long joyaId) {
        try {
            Joya joya = joyaRepository.findById(joyaId).orElse(null);
            if (joya == null) return;

            publicacionJoyaRepository.flush();
            List<PublicacionJoya> relaciones = publicacionJoyaRepository.findByJoyaId(joya.getId());

            boolean enIg = false, enTk = false, enMkp = false, enWsp = false;
            boolean igDesc = false, tkDesc = false, mkpDesc = false, wspDesc = false;

            String ultFechaIg = "", ultFormatoIg = "";
            String ultFechaTk = "", ultFormatoTk = "";
            String ultFechaMkp = "";
            String ultFechaWsp = "";

            int stockActual = joya.getStock() != null ? joya.getStock() : 0;

            for (PublicacionJoya r : relaciones) {
                Publicacion p = r.getPublicacion();
                if (p == null) continue;

                String plat = p.getPlataforma() != null ? p.getPlataforma() : "";
                String form = p.getFormato() != null ? p.getFormato() : "";
                String fechaPub = p.getFechaPublicacion() != null ? p.getFechaPublicacion().toString() : "";
                int stockGrabado = r.getStockAlSubir() != null ? r.getStockAlSubir() : 0;
                boolean descuadrado = stockGrabado != stockActual;

                if (plat.equalsIgnoreCase("Instagram")) {
                    enIg = true; if(descuadrado) igDesc = true;
                    ultFechaIg = fechaPub; ultFormatoIg = form;
                }
                if (plat.equalsIgnoreCase("TikTok")) {
                    enTk = true; if(descuadrado) tkDesc = true;
                    ultFechaTk = fechaPub; ultFormatoTk = form;
                }
                if (plat.equalsIgnoreCase("Marketplace")) {
                    enMkp = true; if(descuadrado) mkpDesc = true;
                    ultFechaMkp = fechaPub;
                }
                if (plat.equalsIgnoreCase("WhatsApp")) {
                    if ("Catálogo".equalsIgnoreCase(form)) {
                        enWsp = true; if(descuadrado) wspDesc = true;
                    } else {
                        ultFechaWsp = fechaPub;
                    }
                }
            }

            EstadoRedes redes = joya.getEstadoRedes();
            if (redes == null) {
                redes = new EstadoRedes();
                redes.setJoya(joya);
                joya.setEstadoRedes(redes);
            }

            if (enIg) { redes.setIgUltimaFecha(ultFechaIg); redes.setIgFormato(ultFormatoIg); }
            if (enTk) { redes.setTkUltimaFecha(ultFechaTk); redes.setTkFormato(ultFormatoTk); }
            if (enMkp) { redes.setMkpUltimaFecha(ultFechaMkp); }
            if (!ultFechaWsp.isEmpty()) { redes.setWspUltimaFecha(ultFechaWsp); }

            if (stockActual == 0) {
                redes.setIgEstado("Archivado"); redes.setTkEstado("Archivado");
                redes.setMkpEstado("Archivado"); redes.setWspCatalogo("Archivado");
            } else {
                redes.setIgEstado(enIg ? (igDesc ? "Falta actualizar" : "Activo") : "No subido");
                redes.setTkEstado(enTk ? (tkDesc ? "Falta actualizar" : "Activo") : "No subido");
                redes.setMkpEstado(enMkp ? (mkpDesc ? "Falta actualizar" : "Activo") : "No subido");
                redes.setWspCatalogo(enWsp ? (wspDesc ? "Falta actualizar" : "Activo") : "No subido");
            }

            estadoRedesRepository.saveAndFlush(redes);
            joyaRepository.saveAndFlush(joya);

        } catch (Exception e) {
            System.out.println("Error al recalcular la joya: " + e.getMessage());
        }
    }

    @Transactional
    public Publicacion registrarPublicacion(Publicacion publicacion) {
        if (publicacion.getFechaPublicacion() == null) publicacion.setFechaPublicacion(LocalDate.now());
        publicacion.setEstado("Activo");
        Publicacion nuevaPub = publicacionRepository.save(publicacion);

        if (publicacion.getJoyas() != null) {
            for (Joya joyaRef : publicacion.getJoyas()) {
                Joya joyaReal = joyaRepository.findById(joyaRef.getId()).orElse(null);
                if(joyaReal != null) {
                    PublicacionJoya relacion = new PublicacionJoya();
                    relacion.setPublicacion(nuevaPub);
                    relacion.setJoya(joyaReal);
                    relacion.setStockAlSubir(joyaReal.getStock());
                    publicacionJoyaRepository.save(relacion);
                    nuevaPub.getRelaciones().add(relacion);
                }
            }
        }
        publicacionRepository.saveAndFlush(nuevaPub);

        if (nuevaPub.getRelaciones() != null) {
            for(PublicacionJoya pj : nuevaPub.getRelaciones()) recalcularEstadoJoya(pj.getJoya().getId());
        }
        return nuevaPub;
    }

    @Transactional
    public Publicacion editarPublicacion(Long id, Publicacion datosActualizados) {
        Publicacion pub = publicacionRepository.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));

        Set<Long> idsParaRecalcular = new HashSet<>();
        if (pub.getRelaciones() != null) {
            pub.getRelaciones().forEach(r -> idsParaRecalcular.add(r.getJoya().getId()));
        }

        pub.setTitulo(datosActualizados.getTitulo());
        pub.setPlataforma(datosActualizados.getPlataforma());
        pub.setFormato(datosActualizados.getFormato());
        pub.setFechaPublicacion(datosActualizados.getFechaPublicacion());
        pub.setCantidadFotos(datosActualizados.getCantidadFotos());
        pub.setPrecioCombo(datosActualizados.getPrecioCombo());

        if(!pub.getRelaciones().isEmpty()) {
            publicacionJoyaRepository.deleteAll(pub.getRelaciones());
            publicacionJoyaRepository.flush();
            pub.getRelaciones().clear();
        }

        if(datosActualizados.getJoyas() != null) {
            for(Joya joyaRef : datosActualizados.getJoyas()) {
                Joya joyaReal = joyaRepository.findById(joyaRef.getId()).orElse(null);
                if(joyaReal != null) {
                    PublicacionJoya relacion = new PublicacionJoya();
                    relacion.setPublicacion(pub);
                    relacion.setJoya(joyaReal);
                    relacion.setStockAlSubir(joyaReal.getStock());
                    publicacionJoyaRepository.save(relacion);
                    pub.getRelaciones().add(relacion);
                    idsParaRecalcular.add(joyaReal.getId());
                }
            }
        }

        Publicacion pubGuardada = publicacionRepository.saveAndFlush(pub);
        for(Long joyaId : idsParaRecalcular) recalcularEstadoJoya(joyaId);

        return pubGuardada;
    }

    @Transactional
    public void eliminarPublicacion(Long id) {
        Publicacion pub = publicacionRepository.findById(id).orElse(null);
        if(pub != null) {
            Set<Long> idsAfectados = new HashSet<>();
            if(pub.getRelaciones() != null) {
                pub.getRelaciones().forEach(r -> idsAfectados.add(r.getJoya().getId()));
                publicacionJoyaRepository.deleteAll(pub.getRelaciones());
                publicacionJoyaRepository.flush();
            }
            publicacionRepository.delete(pub);
            publicacionRepository.flush();
            for(Long jId : idsAfectados) recalcularEstadoJoya(jId);
        }
    }

    @Transactional
    public void limpiarHistoriasViejas() {
        List<Publicacion> todas = publicacionRepository.findAll();
        LocalDate hoy = LocalDate.now();
        LocalDate hace5Dias = hoy.minusDays(5);
        LocalDate hace1Dia = hoy.minusDays(1); // Para WhatsApp

        for (Publicacion pub : todas) {
            boolean esHistoriaIg = "Historia".equalsIgnoreCase(pub.getFormato()) &&
                    pub.getFechaPublicacion() != null &&
                    pub.getFechaPublicacion().isBefore(hace5Dias);

            boolean esEstadoWsp = "WhatsApp".equalsIgnoreCase(pub.getPlataforma()) &&
                    "Estado".equalsIgnoreCase(pub.getFormato()) &&
                    pub.getFechaPublicacion() != null &&
                    pub.getFechaPublicacion().isBefore(hace1Dia);

            if (esHistoriaIg || esEstadoWsp) {
                eliminarPublicacion(pub.getId());
            }
        }
    }

    @Transactional
    public Publicacion actualizarMetricas(Long id, Publicacion statsNuevas){
        Publicacion pubReal = publicacionRepository.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));
        pubReal.setReproducciones(statsNuevas.getReproducciones());
        pubReal.setLikes(statsNuevas.getLikes());
        pubReal.setComentarios(statsNuevas.getComentarios());
        pubReal.setGuardados(statsNuevas.getGuardados());
        pubReal.setCompartidos(statsNuevas.getCompartidos());

        pubReal.setReproduccionesHistoria(statsNuevas.getReproduccionesHistoria());
        pubReal.setLikesHistoria(statsNuevas.getLikesHistoria());
        pubReal.setRespuestasHistoria(statsNuevas.getRespuestasHistoria());

        return publicacionRepository.save(pubReal);
    }

    @Transactional
    public Publicacion registrarMensajeMarketplace(Long id) {
        Publicacion pub = publicacionRepository.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));
        int msjsActuales = pub.getMensajesMarketplace() != null ? pub.getMensajesMarketplace() : 0;
        pub.setMensajesMarketplace(msjsActuales + 1);

        String fechaHoy = LocalDate.now().toString();
        if (pub.getRelaciones() != null) {
            for (PublicacionJoya pj : pub.getRelaciones()) {
                Joya j = pj.getJoya();
                if (j != null && j.getEstadoRedes() != null) {
                    j.getEstadoRedes().setMkpConversacion(fechaHoy);
                    estadoRedesRepository.save(j.getEstadoRedes());
                }
            }
        }
        return publicacionRepository.save(pub);
    }

    // --- NUEVO: RESTAR MENSAJE ---
    @Transactional
    public Publicacion restarMensajeMarketplace(Long id) {
        Publicacion pub = publicacionRepository.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));
        int msjsActuales = pub.getMensajesMarketplace() != null ? pub.getMensajesMarketplace() : 0;
        if (msjsActuales > 0) {
            pub.setMensajesMarketplace(msjsActuales - 1);
        }
        return publicacionRepository.save(pub);
    }
}