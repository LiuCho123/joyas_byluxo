package com.liucho.backend.Repository;

import com.liucho.backend.Model.EstadoRedes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EstadoRedesRepository extends JpaRepository<EstadoRedes, Long> {
}
