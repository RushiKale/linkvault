package com.linksaver.auth;

import com.linksaver.collection.Collection;
import com.linksaver.collection.CollectionRepository;
import com.linksaver.user.User;
import com.linksaver.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CollectionRepository collectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       CollectionRepository collectionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.collectionRepository = collectionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthDto.AuthResponse register(String email, String password, String firstName, String lastName) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User(email, passwordEncoder.encode(password), firstName, lastName);
        user = userRepository.save(user);

        createDefaultCollections(user.getId());

        String token = jwtTokenProvider.generateToken(user.getId());
        return new AuthDto.AuthResponse(token, user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public AuthDto.AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user.getId());
        return new AuthDto.AuthResponse(token, user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public AuthDto.UserInfo getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new AuthDto.UserInfo(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    private void createDefaultCollections(String userId) {
        Collection privateCol = new Collection(userId, "Private", "#1a1a2e", 0, true);
        Collection learningCol = new Collection(userId, "Learning", "#10b981", 2, false);

        collectionRepository.save(privateCol);
        collectionRepository.save(learningCol);
    }
}
