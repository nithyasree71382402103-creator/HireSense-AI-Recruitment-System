from typing import List, Dict, Any

# Knowledge base of high-quality courses & certifications per skill
RECOMMENDATION_CATALOG: Dict[str, Dict[str, Any]] = {
    "Docker": {
        "course_name": "Docker & Container Mastery",
        "platform": "Coursera / Udemy",
        "reason": "Docker is listed as a required containerization tool for modern deployment and orchestration.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://www.coursera.org/learn/docker-for-developers",
    },
    "Kubernetes": {
        "course_name": "Kubernetes for Production Microservices",
        "platform": "Linux Foundation / edX",
        "reason": "Container orchestration via Kubernetes is critical for scalable cloud-native architectures.",
        "difficulty": "Advanced",
        "priority": "High",
        "url": "https://www.edx.org/course/introduction-to-kubernetes",
    },
    "PostgreSQL": {
        "course_name": "PostgreSQL: Advanced Queries & Performance Optimization",
        "platform": "Datacamp / Udemy",
        "reason": "PostgreSQL is a standard enterprise relational database requiring query indexing and schema design skills.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://www.datacamp.com/courses/intro-to-sql-for-data-science",
    },
    "AWS": {
        "course_name": "AWS Certified Solutions Architect Associate Prep",
        "platform": "AWS Skill Builder / Coursera",
        "reason": "AWS cloud infrastructure services (EC2, S3, RDS, Lambda) are standard across modern tech teams.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    },
    "TypeScript": {
        "course_name": "Complete TypeScript: Object-Oriented & Modern Patterns",
        "platform": "Frontend Masters / Udemy",
        "reason": "TypeScript provides static type checking that prevents runtime errors in enterprise codebases.",
        "difficulty": "Beginner to Intermediate",
        "priority": "High",
        "url": "https://www.typescriptlang.org/docs/",
    },
    "React": {
        "course_name": "Advanced React & Modern State Management",
        "platform": "Egghead / Udemy",
        "reason": "React component architecture and hook patterns are essential for frontend candidate profiles.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://react.dev/learn",
    },
    "FastAPI": {
        "course_name": "High-Performance Python Web APIs with FastAPI",
        "platform": "TestDriven.io",
        "reason": "FastAPI is the leading asynchronous Python framework for low-latency microservices.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://fastapi.tiangolo.com/tutorial/",
    },
    "Redis": {
        "course_name": "Redis In-Memory Data Structures & Caching Patterns",
        "platform": "Redis University",
        "reason": "In-memory caching with Redis drastically minimizes database load in production.",
        "difficulty": "Intermediate",
        "priority": "Medium",
        "url": "https://university.redis.com/",
    },
    "GraphQL": {
        "course_name": "Fullstack GraphQL: Schemas, Resolvers & Clients",
        "platform": "Apollo Odyssey",
        "reason": "GraphQL offers declarative client queries that eliminate API over-fetching.",
        "difficulty": "Intermediate",
        "priority": "Medium",
        "url": "https://www.apollographql.com/tutorials/",
    },
    "CI/CD": {
        "course_name": "Continuous Integration & Deployment with GitHub Actions",
        "platform": "GitHub Learning / Coursera",
        "reason": "Automated build, test, and release workflows ensure software reliability.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://docs.github.com/en/actions",
    },
    "Machine Learning": {
        "course_name": "Machine Learning Specialization by Andrew Ng",
        "platform": "Coursera (DeepLearning.AI)",
        "reason": "Foundational supervised and unsupervised learning algorithms for AI applications.",
        "difficulty": "Intermediate",
        "priority": "High",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
    },
    "System Design": {
        "course_name": "Grokking Modern System Design for Engineers",
        "platform": "Educative",
        "reason": "System architecture, scalability, partitioning, and reliability are key for senior grading.",
        "difficulty": "Advanced",
        "priority": "High",
        "url": "https://www.educative.io/courses/grokking-modern-system-design",
    },
}

def generate_recommendations(missing_skills: List[str]) -> List[Dict[str, Any]]:
    """
    Generates structured course and certification recommendations for missing skills.
    Includes suggested learning order, difficulty, reason, and platform.
    """
    recommendations: List[Dict[str, Any]] = []
    order = 1

    for skill in missing_skills:
        clean_skill = skill.strip()
        catalog_item = RECOMMENDATION_CATALOG.get(clean_skill)
        
        if catalog_item:
            recommendations.append({
                "skill_name": clean_skill,
                "course_name": catalog_item["course_name"],
                "platform": catalog_item["platform"],
                "reason": catalog_item["reason"],
                "difficulty": catalog_item["difficulty"],
                "priority": catalog_item["priority"],
                "learning_order": order,
                "url": catalog_item["url"],
            })
        else:
            # High-quality fallback recommendation for uncatalogued skill
            recommendations.append({
                "skill_name": clean_skill,
                "course_name": f"Comprehensive {clean_skill} Bootcamp & Practical Labs",
                "platform": "Coursera / Udemy / Official Documentation",
                "reason": f"{clean_skill} is highlighted in target job requirements for this position.",
                "difficulty": "Intermediate",
                "priority": "Medium",
                "learning_order": order,
                "url": f"https://www.google.com/search?q={clean_skill}+course+tutorial",
            })
        order += 1

    return recommendations
