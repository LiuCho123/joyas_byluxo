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

@Service
public class PublicacionService {

    @Autowired
    private PublicacionRepository publicacionRepository;

    @Autowired
    private JoyaRepository joyaRepository;

    @Autowired
    private PublicacionJoyaRepository publicacionJoyaRepository;

    @Transactional
    public Publicacion registrarPublicacion(Publicacion publicacion) {

        if (publicacion.getFechaPublicacion() == null) {
            publicacion.setFechaPublicacion(LocalDate.now());
        }

        publicacion.setEstado("Activo");
        Publicacion nuevaPub = publicacionRepository.save(publicacion);

        if (publicacion.getJoyas() != null && !publicacion.getJoyas().isEmpty()){
            for (Joya joyaRef : publicacion.getJoyas()) {
                Joya joyaReal = joyaRepository.findById(joyaRef.getId())
                        .orElseThrow(() -> new RuntimeException("Joya no encontrada"));

                EstadoRedes redes = joyaReal.getEstadoRedes();
                String fechaHoy = LocalDate.now().toString();
                String plat = publicacion.getPlataforma();
                String form = publicacion.getFormato();

                // LÓGICA DE ECOSISTEMA COMPLETO
                if ("Instagram".equalsIgnoreCase(plat)){
                    redes.setIgEstado("Activo");
                    redes.setIgUltimaFecha(fechaHoy);
                    redes.setIgFormato(form);
                } else if ("TikTok".equalsIgnoreCase(plat)){
                    redes.setTkEstado("Activo");
                    redes.setTkUltimaFecha(fechaHoy);
                    redes.setTkFormato(form);
                } else if ("Marketplace".equalsIgnoreCase(plat)){
                    redes.setMkpEstado("Activo");
                    redes.setMkpUltimaFecha(fechaHoy);
                } else if ("WhatsApp".equalsIgnoreCase(plat)){
                    if ("Catálogo".equalsIgnoreCase(form)) {
                        redes.setWspCatalogo("Activo");
                    } else if ("Estado".equalsIgnoreCase(form)) {
                        redes.setWspUltimaFecha(fechaHoy);
                    }
                }

                joyaRepository.save(joyaReal);

                PublicacionJoya relacion = new PublicacionJoya();
                relacion.setPublicacion(nuevaPub);
                relacion.setJoya(joyaReal);
                relacion.setStockAlSubir(joyaReal.getStock());

                publicacionJoyaRepository.save(relacion);
            }
        }
        return nuevaPub;
    }

    @Transactional
    public Publicacion actualizarMetricas(Long id, Publicacion statsNuevas){
        Publicacion pubReal = publicacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publicacion no encontrada"));

        pubReal.setReproducciones(statsNuevas.getReproducciones());
        pubReal.setLikes(statsNuevas.getLikes());
        pubReal.setComentarios(statsNuevas.getComentarios());
        pubReal.setGuardados(statsNuevas.getGuardados());
        pubReal.setCompartidos(statsNuevas.getCompartidos());

        return publicacionRepository.save(pubReal);
    }
}