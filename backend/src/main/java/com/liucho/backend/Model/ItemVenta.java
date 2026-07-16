package com.liucho.backend.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "items_venta")
public class ItemVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer cantidad;
    private Integer subtotal;

    @ManyToOne
    @JoinColumn(name = "joya_id")
    private Joya joya;

    @ManyToOne
    @JoinColumn(name = "transaccion_id")
    @JsonIgnore
    private Transaccion transaccion;
}
