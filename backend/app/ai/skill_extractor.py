import re
from typing import List, Dict, Set

# Curated industry skill taxonomy with variations and category mapping
SKILL_TAXONOMY: Dict[str, Dict[str, any]] = {
    # Programming Languages
    "Python": {"category": "Programming Languages", "aliases": ["python", "python3", "py"]},
    "JavaScript": {"category": "Programming Languages", "aliases": ["javascript", "js", "ecmascript"]},
    "TypeScript": {"category": "Programming Languages", "aliases": ["typescript", "ts"]},
    "Java": {"category": "Programming Languages", "aliases": ["java", "core java", "j2ee"]},
    "C++": {"category": "Programming Languages", "aliases": ["c++", "cpp"]},
    "C#": {"category": "Programming Languages", "aliases": ["c#", "csharp"]},
    "C": {"category": "Programming Languages", "aliases": [r"\bc\b"]},
    "Go": {"category": "Programming Languages", "aliases": ["golang", r"\bgo\b"]},
    "Rust": {"category": "Programming Languages", "aliases": ["rust"]},
    "Ruby": {"category": "Programming Languages", "aliases": ["ruby"]},
    "PHP": {"category": "Programming Languages", "aliases": ["php"]},
    "Swift": {"category": "Programming Languages", "aliases": ["swift"]},
    "Kotlin": {"category": "Programming Languages", "aliases": ["kotlin"]},
    "SQL": {"category": "Programming Languages", "aliases": ["sql", "transact-sql", "pl/sql"]},
    "HTML": {"category": "Programming Languages", "aliases": ["html", "html5"]},
    "CSS": {"category": "Programming Languages", "aliases": ["css", "css3"]},

    # Frameworks & Libraries
    "React": {"category": "Frameworks", "aliases": ["react", "react.js", "reactjs"]},
    "Next.js": {"category": "Frameworks", "aliases": ["next.js", "nextjs", "next"]},
    "Vue.js": {"category": "Frameworks", "aliases": ["vue", "vue.js", "vuejs"]},
    "Angular": {"category": "Frameworks", "aliases": ["angular", "angularjs", "angular 2+"]},
    "Node.js": {"category": "Frameworks", "aliases": ["node.js", "nodejs", "node"]},
    "Express": {"category": "Frameworks", "aliases": ["express", "express.js", "expressjs"]},
    "FastAPI": {"category": "Frameworks", "aliases": ["fastapi", "fast-api"]},
    "Django": {"category": "Frameworks", "aliases": ["django", "django rest framework", "drf"]},
    "Flask": {"category": "Frameworks", "aliases": ["flask"]},
    "Spring Boot": {"category": "Frameworks", "aliases": ["spring boot", "springboot", "spring framework"]},
    "ASP.NET": {"category": "Frameworks", "aliases": ["asp.net", ".net core", "dotnet"]},
    "Tailwind CSS": {"category": "Frameworks", "aliases": ["tailwind", "tailwindcss"]},
    "Bootstrap": {"category": "Frameworks", "aliases": ["bootstrap"]},
    "Redux": {"category": "Frameworks", "aliases": ["redux", "redux toolkit"]},
    "GraphQL": {"category": "Frameworks", "aliases": ["graphql"]},
    "REST API": {"category": "Frameworks", "aliases": ["rest api", "restful api", "rest", "restful apis"]},

    # Databases
    "PostgreSQL": {"category": "Databases", "aliases": ["postgresql", "postgres", "psql"]},
    "MySQL": {"category": "Databases", "aliases": ["mysql"]},
    "MongoDB": {"category": "Databases", "aliases": ["mongodb", "mongo"]},
    "Redis": {"category": "Databases", "aliases": ["redis"]},
    "SQLite": {"category": "Databases", "aliases": ["sqlite", "sqlite3"]},
    "Oracle Database": {"category": "Databases", "aliases": ["oracle db", "oracle database"]},
    "Cassandra": {"category": "Databases", "aliases": ["cassandra", "apache cassandra"]},
    "DynamoDB": {"category": "Databases", "aliases": ["dynamodb", "aws dynamodb"]},
    "Elasticsearch": {"category": "Databases", "aliases": ["elasticsearch", "elastic search"]},
    "Firebase": {"category": "Databases", "aliases": ["firebase", "firestore"]},

    # Tools & DevOps
    "Git": {"category": "Tools", "aliases": ["git", "github", "gitlab", "version control"]},
    "Docker": {"category": "Tools", "aliases": ["docker", "containerization"]},
    "Kubernetes": {"category": "Tools", "aliases": ["kubernetes", "k8s"]},
    "Jenkins": {"category": "Tools", "aliases": ["jenkins"]},
    "GitHub Actions": {"category": "Tools", "aliases": ["github actions", "gh actions"]},
    "Linux": {"category": "Tools", "aliases": ["linux", "unix", "ubuntu", "bash", "shell"]},
    "Terraform": {"category": "Tools", "aliases": ["terraform"]},
    "Nginx": {"category": "Tools", "aliases": ["nginx"]},
    "CI/CD": {"category": "Tools", "aliases": ["ci/cd", "continuous integration", "continuous deployment"]},
    "VS Code": {"category": "Tools", "aliases": ["vs code", "vscode", "visual studio code"]},
    "Postman": {"category": "Tools", "aliases": ["postman"]},
    "Jira": {"category": "Tools", "aliases": ["jira"]},

    # Cloud
    "AWS": {"category": "Cloud", "aliases": ["aws", "amazon web services", "ec2", "s3", "lambda"]},
    "Google Cloud Platform": {"category": "Cloud", "aliases": ["gcp", "google cloud", "google cloud platform"]},
    "Azure": {"category": "Cloud", "aliases": ["azure", "microsoft azure"]},
    "Cloudflare": {"category": "Cloud", "aliases": ["cloudflare"]},

    # AI, ML & Data
    "Machine Learning": {"category": "AI / Data", "aliases": ["machine learning", "ml"]},
    "Deep Learning": {"category": "AI / Data", "aliases": ["deep learning", "dl"]},
    "PyTorch": {"category": "AI / Data", "aliases": ["pytorch"]},
    "TensorFlow": {"category": "AI / Data", "aliases": ["tensorflow", "tf"]},
    "Natural Language Processing": {"category": "AI / Data", "aliases": ["nlp", "natural language processing"]},
    "Pandas": {"category": "AI / Data", "aliases": ["pandas"]},
    "NumPy": {"category": "AI / Data", "aliases": ["numpy"]},
    "Scikit-Learn": {"category": "AI / Data", "aliases": ["scikit-learn", "sklearn"]},
    "Computer Vision": {"category": "AI / Data", "aliases": ["computer vision", "cv", "opencv"]},

    # Soft Skills & Methodologies
    "Agile": {"category": "Methodologies", "aliases": ["agile", "scrum", "kanban"]},
    "Problem Solving": {"category": "Soft Skills", "aliases": ["problem solving", "analytical skills"]},
    "Communication": {"category": "Soft Skills", "aliases": ["communication", "team collaboration"]},
    "Leadership": {"category": "Soft Skills", "aliases": ["leadership", "team leadership", "mentorship"]},
    "System Design": {"category": "Architecture", "aliases": ["system design", "software architecture", "microservices"]},
}

def extract_skills_from_text(text: str) -> List[Dict[str, str]]:
    """
    Extract skills from arbitrary resume or job text using normalized pattern matching.
    Returns list of dicts with name, category, and proficiency.
    """
    if not text:
        return []
    
    clean_text = text.lower()
    found_skills: List[Dict[str, str]] = []
    seen_names: Set[str] = set()

    for canonical_name, data in SKILL_TAXONOMY.items():
        matched = False
        for alias in data["aliases"]:
            # If alias contains regex special boundary or is short
            if alias.startswith(r"\b"):
                pattern = alias
            else:
                escaped = re.escape(alias)
                pattern = rf"(?<![a-zA-Z0-9_#+]){escaped}(?![a-zA-Z0-9_#+])"
            
            if re.search(pattern, clean_text, re.IGNORECASE):
                matched = True
                break

        if matched and canonical_name not in seen_names:
            seen_names.add(canonical_name)
            found_skills.append({
                "name": canonical_name,
                "category": data["category"],
                "proficiency": "Intermediate"
            })

    return sorted(found_skills, key=lambda s: (s["category"], s["name"]))

def extract_keywords(text: str, top_n: int = 15) -> List[str]:
    """Extract frequent domain keywords excluding common stopwords."""
    if not text:
        return []
    
    stopwords = {
        "and", "the", "for", "with", "this", "that", "from", "have", "been",
        "will", "your", "more", "work", "team", "such", "using", "into", "year",
        "years", "role", "responsibilities", "skills", "experience", "education",
        "project", "candidate", "must", "able", "well", "good", "across"
    }
    
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    freq = {}
    for w in words:
        if w not in stopwords:
            freq[w] = freq.get(w, 0) + 1
            
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [k[0].capitalize() for k in sorted_keywords[:top_n]]
