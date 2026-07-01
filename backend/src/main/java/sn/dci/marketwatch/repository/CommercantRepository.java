package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.Commercant;
import java.util.List;

public interface CommercantRepository extends JpaRepository<Commercant, Long> {
    List<Commercant> findAllByOrderByRegion_NameAscNameAsc();
}
