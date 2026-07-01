package sn.dci.marketwatch.security;

import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import sn.dci.marketwatch.repository.UtilisateurRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository userRepository;

    public UserDetailsServiceImpl(UtilisateurRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé : " + email));
        return new UserDetailsImpl(user);
    }
}
