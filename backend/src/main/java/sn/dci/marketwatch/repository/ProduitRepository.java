package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.Produit;
import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    List<Produit> findAllByOrderByCategoryAscNameAsc();
}
