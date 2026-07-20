package com.liucho.backend.Service;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Publicacion;
import com.liucho.backend.Model.PublicacionJoya;
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
    @Autowired private RecalculoService recalculoService;

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
            for(PublicacionJoya pj : nuevaPub.getRelaciones()) recalculoService.recalcularEstadoJoya(pj.getJoya().getId());
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

        // Limpiamos las relaciones viejas usando el método nativo de la lista
        pub.getRelaciones().clear();
        publicacionRepository.flush();

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
        for(Long joyaId : idsParaRecalcular) recalculoService.recalcularEstadoJoya(joyaId);

        return pubGuardada;
    }

    @Transactional
    public void eliminarPublicacion(Long id) {
        Publicacion pub = publicacionRepository.findById(id).orElse(null);
        if(pub != null) {
            Set<Long> idsAfectados = new HashSet<>();
            if(pub.getRelaciones() != null) {
                pub.getRelaciones().forEach(r -> idsAfectados.add(r.getJoya().getId()));
            }

            // Eliminamos la publicación de una, el CascadeType.ALL en Publicacion se encarga de las relaciones
            publicacionRepository.delete(pub);
            publicacionRepository.flush();

            // Recalculamos las joyas que quedaron huérfanas
            for(Long jId : idsAfectados) recalculoService.recalcularEstadoJoya(jId);
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