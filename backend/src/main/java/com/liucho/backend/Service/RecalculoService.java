package com.liucho.backend.Service;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Publicacion;
import com.liucho.backend.Model.PublicacionJoya;
import com.liucho.backend.Repository.EstadoRedesRepository;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Repository.PublicacionJoyaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecalculoService {

    @Autowired
    private JoyaRepository joyaRepository;

    @Autowired
    private PublicacionJoyaRepository publicacionJoyaRepository;

    @Autowired
    private EstadoRedesRepository estadoRedesRepository; // ¡CLAVE PARA GUARDAR!

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recalcularEstadoJoya(Long joyaId) {
        Joya joya = joyaRepository.findById(joyaId).orElse(null);
        if (joya == null) return;

        List<PublicacionJoya> relaciones = publicacionJoyaRepository.findByJoyaId(joya.getId());

        boolean enIg = false, enTk = false, enMkp = false, enWsp = false;
        boolean igDesc = false, tkDesc = false, mkpDesc = false, wspDesc = false;

        for (PublicacionJoya r : relaciones) {
            Publicacion p = r.getPublicacion();
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
            redes.setIgEstado("Archivado");
            redes.setTkEstado("Archivado");
            redes.setMkpEstado("Archivado");
            redes.setWspCatalogo("Archivado");
        } else {
            redes.setIgEstado(enIg ? (igDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setTkEstado(enTk ? (tkDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setMkpEstado(enMkp ? (mkpDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setWspCatalogo(enWsp ? (wspDesc ? "Falta actualizar" : "Activo") : "No subido");
        }

        estadoRedesRepository.save(redes);
        joyaRepository.save(joya);
    }
}