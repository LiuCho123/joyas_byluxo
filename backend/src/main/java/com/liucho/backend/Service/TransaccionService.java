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

@Service
public class TransaccionService {

    @Autowired
    private TransaccionRepository transaccionRepository;

    @Autowired
    private JoyaRepository joyaRepository;

    @Transactional
    public Transaccion registrarVenta(Transaccion venta){
        int sumaPreciosOriginales = 0;

        if (venta.getItems() != null && !venta.getItems().isEmpty()) {
            for (ItemVenta item : venta.getItems()) {
                Joya joyaReal = joyaRepository.findById(item.getJoya().getId())
                        .orElseThrow(() -> new RuntimeException("Joya no encontrada"));

                if (joyaReal.getStock() < item.getCantidad()){
                    throw new RuntimeException("Stock insuficiente para: " + joyaReal.getNombre());
                }

                joyaReal.setStock(joyaReal.getStock() - item.getCantidad());
                joyaRepository.save(joyaReal);

                item.setSubtotal(joyaReal.getPrecio() * item.getCantidad());
                item.setTransaccion(venta);

                sumaPreciosOriginales += item.getSubtotal();
            }
        }

        // Respetamos la fecha manual del frontend. Si viene vacía, usa la de hoy.
        if (venta.getFecha() == null) {
            venta.setFecha(LocalDate.now());
        }

        // Flexibilidad de precio: Si el frontend manda un monto, lo respeta (descuento).
        // Si manda 0, cobra la suma original de las joyas.
        int ingresoFinal = (venta.getEntra() > 0) ? venta.getEntra() : sumaPreciosOriginales;

        venta.setTipo("Ingreso");
        venta.setCategoria("Venta de Joya");
        venta.setEntra(ingresoFinal);
        venta.setSale(0);

        // La comisión del 10% se calcula sobre el ingreso final cobrado
        venta.setComision((int) (ingresoFinal * 0.10));

        return transaccionRepository.save(venta);
    }

    public Transaccion registrarMovimientoSimple(Transaccion movimiento){
        if (movimiento.getFecha() == null) {
            movimiento.setFecha(LocalDate.now());
        }
        movimiento.setComision(0);
        return transaccionRepository.save(movimiento);
    }
}