package com.liucho.backend.Service;

import com.liucho.backend.Model.ItemVenta;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Transaccion;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Repository.TransaccionRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Service
public class TransaccionService {

    @Autowired private TransaccionRepository transaccionRepository;
    @Autowired private JoyaRepository joyaRepository;

    // AQUÍ ESTABA EL ERROR: Ahora inyectamos el servicio correcto
    @Autowired private RecalculoService recalculoService;

    @Transactional
    public Transaccion registrarVenta(Transaccion venta){
        int sumaPreciosOriginales = 0;
        Set<Long> joyasModificadas = new HashSet<>();

        if (venta.getItems() != null && !venta.getItems().isEmpty()) {
            for (ItemVenta item : venta.getItems()) {
                Joya joyaReal = joyaRepository.findById(item.getJoya().getId())
                        .orElseThrow(() -> new RuntimeException("Joya no encontrada"));

                if (joyaReal.getStock() < item.getCantidad()){
                    throw new RuntimeException("Stock insuficiente para: " + joyaReal.getNombre());
                }

                joyaReal.setStock(joyaReal.getStock() - item.getCantidad());
                joyaRepository.save(joyaReal);

                joyasModificadas.add(joyaReal.getId());

                item.setSubtotal(joyaReal.getPrecio() * item.getCantidad());
                item.setTransaccion(venta);
                sumaPreciosOriginales += item.getSubtotal();
            }
        }

        if (venta.getFecha() == null) venta.setFecha(LocalDate.now());

        int ingresoFinal = (venta.getEntra() > 0) ? venta.getEntra() : sumaPreciosOriginales;

        venta.setTipo("Ingreso");
        venta.setCategoria("Venta de Joya");
        venta.setEntra(ingresoFinal);
        venta.setSale(0);
        venta.setComision((int) (ingresoFinal * 0.10));

        Transaccion tGuardada = transaccionRepository.save(venta);

        // Ahora llama al motor desde el lugar correcto
        for(Long jId : joyasModificadas) {
            recalculoService.recalcularEstadoJoya(jId);
        }

        return tGuardada;
    }

    public Transaccion registrarMovimientoSimple(Transaccion movimiento){
        if (movimiento.getFecha() == null) movimiento.setFecha(LocalDate.now());
        movimiento.setComision(0);
        return transaccionRepository.save(movimiento);
    }
}