package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sn.dci.marketwatch.entity.PrixOfficiel;

import java.util.List;
import java.util.Optional;

public interface PrixOfficielRepository extends JpaRepository<PrixOfficiel, Long> {

    @Query("SELECT op FROM PrixOfficiel op WHERE op.validTo IS NULL AND op.region.name = :regionName ORDER BY op.product.category, op.product.name")
    List<PrixOfficiel> findCurrentByRegion(String regionName);

    @Query("SELECT op FROM PrixOfficiel op WHERE op.validTo IS NULL ORDER BY op.product.category, op.product.name, op.region.name")
    List<PrixOfficiel> findAllCurrent();

    @Query("SELECT op FROM PrixOfficiel op WHERE op.validTo IS NULL AND op.product.id = :productId AND op.region.id = :regionId")
    Optional<PrixOfficiel> findCurrentByProductAndRegion(Long productId, Long regionId);
}
