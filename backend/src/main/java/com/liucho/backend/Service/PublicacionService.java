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
    @Autowired private EstadoRedesRepository estadoRedesRepository; // Inyectado para forzar el guardado

    // --- MOTOR MAESTRO DE RECÁLCULO BLINDADO ---
    @Transactional
    public void recalcularEstadoJoya(Long joyaId) {
        Joya joya = joyaRepository.findById(joyaId).orElse(null);
        if (joya == null) return;

        // Limpia basura en memoria antes de leer
        publicacionJoyaRepository.flush();

        // Leemos EXACTAMENTE en qué videos está AHORA MISMO
        List<PublicacionJoya> relaciones = publicacionJoyaRepository.findByJoyaId(joya.getId());

        boolean enIg = false, enTk = false, enMkp = false, enWsp = false;
        boolean igDesc = false, tkDesc = false, mkpDesc = false, wspDesc = false;

        for (PublicacionJoya r : relaciones) {
            Publicacion p = r.getPublicacion();
            if (p == null) continue;

            String plat = p.getPlataforma() != null ? p.getPlataforma() : "";
            boolean descuadrado = !r.getStockAlSubir().equals(joya.getStock());

            if (plat.equalsIgnoreCase("Instagram")) { enIg = true; if(descuadrado) igDesc = true; }
            if (plat.equalsIgnoreCase("TikTok")) { enTk = true; if(descuadrado) tkDesc = true; }
            if (plat.equalsIgnoreCase("Marketplace")) { enMkp = true; if(descuadrado) mkpDesc = true; }
            if (plat.equalsIgnoreCase("WhatsApp") && "Catálogo".equalsIgnoreCase(p.getFormato())) {
                enWsp = true; if(descuadrado) wspDesc = true;
            }
        }

        EstadoRedes redes = joya.getEstadoRedes();
        if (redes == null) {
            redes = new EstadoRedes();
            redes.setJoya(joya);
            joya.setEstadoRedes(redes);
        }

        if (joya.getStock() == null || joya.getStock() == 0) {
            redes.setIgEstado("Archivado"); redes.setTkEstado("Archivado");
            redes.setMkpEstado("Archivado"); redes.setWspCatalogo("Archivado");
        } else {
            redes.setIgEstado(enIg ? (igDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setTkEstado(enTk ? (tkDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setMkpEstado(enMkp ? (mkpDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setWspCatalogo(enWsp ? (wspDesc ? "Falta actualizar" : "Activo") : "No subido");
        }

        // ¡GOLPE DE MARTILLO! Guardamos explícitamente en la BD.
        estadoRedesRepository.save(redes);
        joyaRepository.save(joya);
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

        // Destruimos las relaciones viejas para que no causen interferencia
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

                // DESTRUCCIÓN FÍSICA INMEDIATA
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
        LocalDate hace5Dias = LocalDate.now().minusDays(5);
        for (Publicacion pub : todas) {
            if ("Historia".equalsIgnoreCase(pub.getFormato()) &&
                    pub.getFechaPublicacion() != null &&
                    pub.getFechaPublicacion().isBefore(hace5Dias)) {
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
        return publicacionRepository.save(pubReal);
    }
}