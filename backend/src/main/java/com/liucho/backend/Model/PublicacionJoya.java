package com.liucho.backend.Model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "publicacion_joya")
public class PublicacionJoya {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "publicacion_id")
    private Publicacion publicacion;

    @ManyToOne
    @JoinColumn(name = "joya_id")
    private Joya joya;

    private Integer stockAlSubir;
}
