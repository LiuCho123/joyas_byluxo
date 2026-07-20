package com.liucho.backend.Repository;

import com.liucho.backend.Model.PublicacionJoya;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicacionJoyaRepository extends JpaRepository<PublicacionJoya, Long> {

    @Query("SELECT pj FROM PublicacionJoya pj WHERE pj.joya.id = :joyaId")
    List<PublicacionJoya> findByJoyaId(@Param("joyaId") Long joyaId);
}