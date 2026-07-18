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
        publicacion.setFechaPublicacion(LocalDate.now());
        publicacion.setEstado("Activo");

        // 1. Guardamos la publicación base
        Publicacion nuevaPub = publicacionRepository.save(publicacion);

        if (publicacion.getJoyas() != null && !publicacion.getJoyas().isEmpty()){
            for (Joya joyaRef : publicacion.getJoyas()) {
                Joya joyaReal = joyaRepository.findById(joyaRef.getId())
                        .orElseThrow(() -> new RuntimeException("Joya no encontrada"));

                // 2. ACTUALIZAMOS EL ESTADO DE REDES
                EstadoRedes redes = joyaReal.getEstadoRedes();
                String fechaHoy = LocalDate.now().toString();

                if ("Instagram".equalsIgnoreCase(publicacion.getPlataforma())){
                    redes.setIgEstado("Activo");
                    redes.setIgUltimaFecha(fechaHoy);
                    redes.setIgFormato(publicacion.getFormato());
                } else if ("TikTok".equalsIgnoreCase(publicacion.getPlataforma())){
                    redes.setTkEstado("Activo");
                    redes.setTkUltimaFecha(fechaHoy);
                    redes.setTkFormato(publicacion.getFormato());
                }
                joyaRepository.save(joyaReal);

                // 3. CONGELAMOS EL STOCK EN LA TABLA INTERMEDIA
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