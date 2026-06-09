package com.linksaver;

import com.linksaver.collection.Collection;
import com.linksaver.collection.CollectionRepository;
import com.linksaver.link.Link;
import com.linksaver.link.LinkRepository;
import com.linksaver.tag.Tag;
import com.linksaver.tag.TagRepository;
import com.linksaver.team.*;
import com.linksaver.user.User;
import com.linksaver.user.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class SeedConfig {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, CollectionRepository collectionRepository,
                               LinkRepository linkRepository, TagRepository tagRepository,
                               PasswordEncoder passwordEncoder,
                               OrganizationRepository organizationRepository,
                               TeamRepository teamRepository,
                               TeamMemberRepository teamMemberRepository,
                               TeamProjectRepository teamProjectRepository,
                               EntityManager entityManager,
                               PlatformTransactionManager transactionManager) {
        return args -> {
            TransactionTemplate tx = new TransactionTemplate(transactionManager);
            tx.execute(status -> {
                // --- Migration: Merge per-user Public collections into a single org-wide Public ---
                // After this, only admin@test.com's personal "Public" remains — shared by everyone.
                User adminUser = userRepository.findByEmail("admin@test.com").orElse(null);
                if (adminUser != null) {
                    Collection adminPublic = collectionRepository.findByUserIdAndName(adminUser.getId(), "Public").orElse(null);
                    if (adminPublic != null) {
                        List<Collection> otherPublics = collectionRepository.findByNameAndTeamIdIsNull("Public")
                                .stream()
                                .filter(c -> !c.getUserId().equals(adminUser.getId()))
                                .collect(Collectors.toList());
                        if (!otherPublics.isEmpty()) {
                            for (Collection pc : otherPublics) {
                                Query moveQuery = entityManager.createNativeQuery(
                                        "UPDATE links SET collection_id = :targetId WHERE collection_id = :oldId");
                                moveQuery.setParameter("targetId", adminPublic.getId());
                                moveQuery.setParameter("oldId", pc.getId());
                                moveQuery.executeUpdate();
                                collectionRepository.delete(pc);
                            }
                        }
                                if (!adminPublic.isLocked()) {
                            adminPublic.setLocked(true);
                            collectionRepository.save(adminPublic);
                        }
                    }
                }
                // --- Migration: Remove team-scoped "Public" collections, move their links to org-wide Public ---
                List<Collection> teamPublics = collectionRepository.findAll().stream()
                        .filter(c -> c.getTeamId() != null && "Public".equals(c.getName()))
                        .collect(Collectors.toList());
                if (!teamPublics.isEmpty()) {
                    for (Collection tp : teamPublics) {
                        Collection orgPublic = collectionRepository.findByNameAndTeamIdIsNull("Public")
                                .stream().findFirst().orElse(null);
                        if (orgPublic != null) {
                            Query moveQuery = entityManager.createNativeQuery(
                                    "UPDATE links SET collection_id = :targetId WHERE collection_id = :oldId");
                            moveQuery.setParameter("targetId", orgPublic.getId());
                            moveQuery.setParameter("oldId", tp.getId());
                            moveQuery.executeUpdate();
                        }
                        collectionRepository.delete(tp);
                    }
                }
                return null;
            });

            // --- Seed test users (only if DB is empty) ---
            if (userRepository.count() == 0) {
                String[][] testUsers = {
                    {"test@example.com", "password123", "Test", "User"},
                    {"test@gmail.com", "password123", "Test", "Gmail"},
                    {"jane@example.com", "password123", "Jane", "Doe"},
                };

                for (String[] userData : testUsers) {
                    String email = userData[0];
                    String password = passwordEncoder.encode(userData[1]);
                    String firstName = userData[2];
                    String lastName = userData[3];

                    User user = new User(email, password, firstName, lastName);
                    user = userRepository.save(user);

                    // Create default collections (no Public — it's shared org-wide from admin)
                    String[][] defaults = {
                        {"Private", "#1a1a2e", "1"},
                        {"Learning", "#16213e", "2"}
                    };
                    for (String[] col : defaults) {
                        Collection c = new Collection(user.getId(), col[0], col[1],
                                Integer.parseInt(col[2]), col[0].equals("Private"));
                        collectionRepository.save(c);
                    }

                    // Seed links for test@example.com
                    if (email.equals("test@example.com")) {
                        Link l1 = new Link();
                        l1.setUserId(user.getId());
                        l1.setCollectionId(collectionRepository.findByUserIdAndName(user.getId(), "Learning").get().getId());
                        l1.setUrl("https://www.google.com");
                        l1.setTitle("Google");
                        l1.setDescription("Search engine");
                        linkRepository.save(l1);

                        Link l2 = new Link();
                        l2.setUserId(user.getId());
                        l2.setCollectionId(collectionRepository.findByUserIdAndName(user.getId(), "Learning").get().getId());
                        l2.setUrl("https://www.wikipedia.org");
                        l2.setTitle("Wikipedia");
                        l2.setDescription("Free encyclopedia");
                        linkRepository.save(l2);

                        Link l3 = new Link();
                        l3.setUserId(user.getId());
                        l3.setCollectionId(collectionRepository.findByUserIdAndName(user.getId(), "Learning").get().getId());
                        l3.setUrl("https://www.github.com");
                        l3.setTitle("GitHub");
                        l3.setDescription("Code hosting");
                        linkRepository.save(l3);

                        // Create common tags
                        String[][] commonTags = {{"frontend"}, {"backend"}, {"devtools"}, {"reference"}};
                        for (String[] tagData : commonTags) {
                            if (tagRepository.findByName(tagData[0]).isEmpty()) {
                                tagRepository.save(new Tag(tagData[0]));
                            }
                        }
                    }

                    // Seed 25 links for test@gmail.com
                    if (email.equals("test@gmail.com")) {
                        String[][] gmailLinks = {
                            {"https://www.google.com", "Google", "Learning"},
                            {"https://www.youtube.com", "YouTube", "Learning"},
                            {"https://www.github.com", "GitHub", "Learning"},
                            {"https://www.stackoverflow.com", "Stack Overflow", "Learning"},
                            {"https://react.dev", "React Docs", "Learning"},
                            {"https://nextjs.org", "Next.js Docs", "Learning"},
                            {"https://nodejs.org", "Node.js Docs", "Learning"},
                            {"https://www.typescriptlang.org", "TypeScript Docs", "Learning"},
                            {"https://www.mongodb.com", "MongoDB", "Learning"},
                            {"https://www.postgresql.org", "PostgreSQL", "Learning"},
                            {"https://redis.io", "Redis", "Learning"},
                            {"https://www.docker.com", "Docker", "Learning"},
                            {"https://kubernetes.io", "Kubernetes", "Learning"},
                            {"https://aws.amazon.com", "AWS", "Learning"},
                            {"https://azure.microsoft.com", "Azure", "Learning"},
                            {"https://cloud.google.com", "Google Cloud", "Learning"},
                            {"https://www.linux.org", "Linux", "Learning"},
                            {"https://www.python.org", "Python", "Learning"},
                            {"https://www.java.com", "Java", "Learning"},
                            {"https://spring.io", "Spring Boot", "Learning"},
                            {"https://www.wikipedia.org", "Wikipedia", "Learning"},
                            {"https://medium.com", "Medium", "Learning"},
                            {"https://dev.to", "Dev.to", "Learning"},
                            {"https://news.ycombinator.com", "Hacker News", "Learning"},
                            {"https://www.reddit.com", "Reddit", "Learning"},
                        };
                        for (String[] linkData : gmailLinks) {
                            Link l = new Link();
                            l.setUserId(user.getId());
                            l.setCollectionId(collectionRepository.findByUserIdAndName(user.getId(), linkData[2]).get().getId());
                            l.setUrl(linkData[0]);
                            l.setTitle(linkData[1]);
                            linkRepository.save(l);
                        }
                    }

                    // Seed 1 link for jane@example.com
                    if (email.equals("jane@example.com")) {
                        Link l = new Link();
                        l.setUserId(user.getId());
                        l.setCollectionId(collectionRepository.findByUserIdAndName(user.getId(), "Learning").get().getId());
                        l.setUrl("https://www.wikipedia.org");
                        l.setTitle("Wikipedia");
                        linkRepository.save(l);
                    }
                }
            }

            // --- Seed MASTER_ADMIN (if not exists) ---
            if (!teamMemberRepository.existsByRole(TeamMember.TeamRole.MASTER_ADMIN)) {
                // Create master admin user
                User masterUser = userRepository.findByEmail("master@sn.com")
                        .orElseGet(() -> {
                            User u = new User("master@sn.com", passwordEncoder.encode("password123"), "MASTER", "ADMIN");
                            return userRepository.save(u);
                        });

                // Create default collections for master (no Public — handled org-wide)
                if (collectionRepository.findByUserIdAndName(masterUser.getId(), "Private").isEmpty()) {
                    String[][] defaults = {
                        {"Private", "#1a1a2e", "1"},
                        {"Learning", "#16213e", "2"}
                    };
                    for (String[] col : defaults) {
                        Collection c = new Collection(masterUser.getId(), col[0], col[1],
                                Integer.parseInt(col[2]), col[0].equals("Private"));
                        collectionRepository.save(c);
                    }
                }

                // Create organization
                Organization org = new Organization("Springer Nature", "springer-nature", masterUser.getId());
                org = organizationRepository.save(org);

                // Create team
                Team team = new Team(org.getId(), "RevEx", "revex", "RevEx team project");
                team = teamRepository.save(team);

                // Create MASTER_ADMIN membership
                teamMemberRepository.save(new TeamMember(team.getId(), masterUser.getId(), TeamMember.TeamRole.MASTER_ADMIN));

                // Create team project
                TeamProject project = new TeamProject(team.getId(), "RevEx", "RevEx project", masterUser.getId());
                teamProjectRepository.save(project);

                // Create team-scoped default collections (no separate Public — org-wide Public is shared)
                String[][] teamDefaults = {
                    {"Private", "#1a1a2e", "1", "true"},
                    {"RevEx", "#10b981", "2", "false"},
                };
                for (String[] col : teamDefaults) {
                    Collection c = new Collection(masterUser.getId(), col[0], col[1],
                            Integer.parseInt(col[2]), Boolean.parseBoolean(col[3]));
                    c.setTeamId(team.getId());
                    collectionRepository.save(c);
                }

                // Create ADMIN user for RevEx team
                User adminUser2 = userRepository.findByEmail("admin@test.com")
                        .orElseGet(() -> {
                            User u = new User("admin@test.com", passwordEncoder.encode("password123"), "Team", "Admin");
                            return userRepository.save(u);
                        });
                // Create personal collections for admin (including Public — shared org-wide)
                if (collectionRepository.findByUserIdAndName(adminUser2.getId(), "Private").isEmpty()) {
                    String[][] defaults = {
                        {"Private", "#1a1a2e", "1"},
                        {"Public", "#0f3460", "0"},
                        {"Learning", "#16213e", "2"}
                    };
                    for (String[] col : defaults) {
                        Collection c = new Collection(adminUser2.getId(), col[0], col[1],
                                Integer.parseInt(col[2]), col[0].equals("Private"));
                        // Lock Public since it's the org-wide shared collection
                        if (col[0].equals("Public")) c.setLocked(true);
                        collectionRepository.save(c);
                    }
                }
                teamMemberRepository.save(new TeamMember(team.getId(), adminUser2.getId(), TeamMember.TeamRole.ADMIN));

                // Create MEMBER user for RevEx team
                User memberUser = userRepository.findByEmail("member@test.com")
                        .orElseGet(() -> {
                            User u = new User("member@test.com", passwordEncoder.encode("password123"), "Team", "Member");
                            return userRepository.save(u);
                        });
                // Create personal collections for member (no Public — shared org-wide)
                if (collectionRepository.findByUserIdAndName(memberUser.getId(), "Private").isEmpty()) {
                    String[][] defaults = {
                        {"Private", "#1a1a2e", "1"},
                        {"Learning", "#16213e", "2"}
                    };
                    for (String[] col : defaults) {
                        Collection c = new Collection(memberUser.getId(), col[0], col[1],
                                Integer.parseInt(col[2]), col[0].equals("Private"));
                        collectionRepository.save(c);
                    }
                }
                teamMemberRepository.save(new TeamMember(team.getId(), memberUser.getId(), TeamMember.TeamRole.MEMBER));

                // Create team project links for RevEx (all in RevEx collection, org-wide Public is shared separately)
                Collection revExCol = collectionRepository.findByUserIdAndTeamIdAndName(masterUser.getId(), team.getId(), "RevEx").orElse(null);
                if (revExCol != null) {
                    String[][] teamLinks = {
                        {"https://github.com", "GitHub", "Code hosting platform", revExCol.getId()},
                        {"https://vercel.com", "Vercel", "Deployment platform", revExCol.getId()},
                        {"https://linear.app", "Linear", "Project management", revExCol.getId()},
                        {"https://postman.com", "Postman", "API testing", revExCol.getId()},
                    };
                    for (String[] linkData : teamLinks) {
                        Link l = new Link();
                        l.setUserId(masterUser.getId());
                        l.setCollectionId(linkData[3]);
                        l.setUrl(linkData[0]);
                        l.setTitle(linkData[1]);
                        l.setDescription(linkData[2]);
                        l.setTeamProjectId(project.getId());
                        linkRepository.save(l);
                    }
                }
            }
            // --- Update team member names (runs every startup, idempotent) ---
            userRepository.findByEmail("admin@test.com").ifPresent(u -> {
                if (!"Pooja".equals(u.getFirstName()) || !"J".equals(u.getLastName())) {
                    u.setFirstName("Pooja");
                    u.setLastName("J");
                    userRepository.save(u);
                }
            });
            userRepository.findByEmail("member@test.com").ifPresent(u -> {
                if (!"Vitthal".equals(u.getFirstName()) || !"P".equals(u.getLastName())) {
                    u.setFirstName("Vitthal");
                    u.setLastName("P");
                    userRepository.save(u);
                }
            });
            // Create Rushikesh K as a team MEMBER if not exists
            userRepository.findByEmail("rushikesh@test.com").orElseGet(() -> {
                User u = userRepository.save(
                    new User("rushikesh@test.com", passwordEncoder.encode("password123"), "Rushikesh", "K")
                );
                final String uid = u.getId();
                // Create personal collections
                String[][] defaults = {
                    {"Private", "#1a1a2e", "1"},
                    {"Learning", "#16213e", "2"}
                };
                for (String[] col : defaults) {
                    Collection c = new Collection(uid, col[0], col[1],
                            Integer.parseInt(col[2]), col[0].equals("Private"));
                    collectionRepository.save(c);
                }
                // Add to RevEx team as MEMBER
                teamRepository.findBySlug("revex").ifPresent(team -> {
                    teamMemberRepository.save(new TeamMember(team.getId(), uid, TeamMember.TeamRole.MEMBER));
                });
                return u;
            });
        };
    }
}