package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.Region;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {
    Optional<Region> findByName(String name);
}
