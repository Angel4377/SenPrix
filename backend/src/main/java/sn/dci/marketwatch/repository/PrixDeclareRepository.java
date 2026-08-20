package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.PrixDeclare;

import java.util.List;
import java.util.Optional;

public interface PrixDeclareRepository extends JpaRepository<PrixDeclare, Long> {

    List<PrixDeclare> findByCommercant_Id(Long commercantId);

    Optional<PrixDeclare> findByCommercant_IdAndProduct_Id(Long commercantId, Long productId);

    /** Utilisé par le comparateur de prix (Consommateur) : tous les prix déclarés
     *  pour un produit donné, chez les commerçants d'une région donnée. */
    List<PrixDeclare> findByProduct_IdAndCommercant_Region_IdOrderByPriceAsc(Long productId, Long regionId);
}
