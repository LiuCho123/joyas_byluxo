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
        int totalIngreso = 0;

        if (venta.getItems() != null && !venta.getItems().isEmpty()) {
            for (ItemVenta item :  venta.getItems()) {
                Joya joyaReal = joyaRepository.findById(item.getJoya().getId())
                        .orElseThrow(() -> new RuntimeException("Joya no encontrado"));

                if (joyaReal.getStock() < item.getCantidad()){
                    throw new RuntimeException("Stock insuficiente para: " + joyaReal.getNombre());
                }

                joyaReal.setStock(joyaReal.getStock() - item.getCantidad());
                joyaRepository.save(joyaReal);

                item.setSubtotal(joyaReal.getPrecio() * item.getCantidad());
                item.setTransaccion(venta);

                totalIngreso += item.getSubtotal();
            }
        }

        venta.setFecha(LocalDate.now());
        venta.setTipo("Ingreso");
        venta.setCategoria("Venta de Joya");
        venta.setEntra(totalIngreso);
        venta.setSale(0);

        venta.setComision((int) (totalIngreso * 0.10));
        return transaccionRepository.save(venta);
    }

    public Transaccion registrarMovimientoSimple(Transaccion movimiento){
        movimiento.setFecha(LocalDate.now());
        movimiento.setComision(0);
        return transaccionRepository.save(movimiento);
    }
}
