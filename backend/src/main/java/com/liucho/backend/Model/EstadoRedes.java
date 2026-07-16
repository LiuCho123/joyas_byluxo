package com.liucho.backend.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "estado_redes")
public class EstadoRedes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String igEstado;
    private String igUltimaFecha;
    private String igFormato;

    private String tkEstado;
    private String tkUltimaFecha;
    private String tkFormato;

    private String mkpEstado;
    private String mkpUltimaFecha;
    private String mkpConversacion;

    private String wspCatalogo;
    private String wspUltimaFecha;

    @OneToOne
    @JoinColumn(name = "joya_id")
    @JsonBackReference
    private Joya joya;
}
