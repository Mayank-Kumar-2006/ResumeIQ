'use strict';

const SKILL_ALIASES = {
  JavaScript: ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'es6+', 'vanilla js'],
  TypeScript: ['typescript', 'ts'],
  Python: ['python', 'python3', 'py'],
  Java: ['java', 'java 8', 'java 11', 'java 17'],
  'C++': ['c++', 'cpp', 'c plus plus'],
  'C': ['c', 'c language'],
  'C#': ['c#', 'csharp', 'c sharp'],
  'Go': ['golang', 'go', 'go language'],
  'Rust': ['rust', 'rust lang'],
  'PHP': ['php'],
  'Ruby': ['ruby', 'ruby on rails'],
  'Swift': ['swift'],
  'Kotlin': ['kotlin'],
  'Dart': ['dart'],
  'Scala': ['scala'],
  'R': ['r', 'r language', 'r programming'],

  'React': ['react', 'reactjs', 'react.js', 'react js'],
  'React Native': ['react native', 'react-native', 'rn'],
  'Angular': ['angular', 'angularjs', 'angular.js'],
  'Vue.js': ['vue', 'vuejs', 'vue.js'],
  'Next.js': ['next.js', 'nextjs', 'next js'],
  'Nuxt.js': ['nuxt', 'nuxt.js', 'nuxtjs'],
  'Svelte': ['svelte'],
  'Redux': ['redux', 'redux toolkit', 'rtk'],
  'HTML/CSS': ['html', 'css', 'html5', 'css3', 'html/css'],
  'Tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
  'Bootstrap': ['bootstrap'],
  'Material UI': ['material ui', 'mui', 'material-ui'],

  'Node.js': ['node', 'nodejs', 'node.js', 'node js'],
  'Express': ['express', 'expressjs', 'express.js'],
  'Django': ['django'],
  'Flask': ['flask'],
  'FastAPI': ['fastapi', 'fast api'],
  'Spring': ['spring', 'spring boot', 'spring framework'],
  'Laravel': ['laravel'],
  'Ruby on Rails': ['rails', 'ror', 'ruby on rails'],
  'GraphQL': ['graphql', 'graph ql'],
  'REST': ['rest', 'restful', 'rest api', 'restful api'],
  'Microservices': ['microservices', 'microservice architecture'],

  'MongoDB': ['mongodb', 'mongo', 'mongoose'],
  'PostgreSQL': ['postgresql', 'postgres', 'pg'],
  'MySQL': ['mysql'],
  'SQLite': ['sqlite'],
  'Redis': ['redis'],
  'Elasticsearch': ['elasticsearch', 'elastic search'],
  'Firebase Firestore': ['firestore', 'firebase firestore'],
  'DynamoDB': ['dynamodb', 'dynamo db'],
  'Cassandra': ['cassandra'],
  'Oracle': ['oracle db', 'oracle database'],
  'SQL': ['sql', 'structured query language', 't-sql', 'pl/sql'],
  'NoSQL': ['nosql', 'no-sql'],

  'Docker': ['docker', 'containerization', 'containers'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'AWS': ['aws', 'amazon web services', 'amazon aws'],
  'Google Cloud': ['gcp', 'google cloud', 'google cloud platform'],
  'Azure': ['azure', 'microsoft azure'],
  'CI/CD': ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],
  'Jenkins': ['jenkins'],
  'GitHub Actions': ['github actions', 'gh actions'],
  'Terraform': ['terraform', 'infrastructure as code', 'iac'],
  'Ansible': ['ansible'],
  'Linux': ['linux', 'unix', 'ubuntu', 'debian', 'centos', 'bash scripting'],
  'Nginx': ['nginx'],
  'Heroku': ['heroku'],
  'Vercel': ['vercel'],
  'Netlify': ['netlify'],

  'Jest': ['jest'],
  'Mocha': ['mocha'],
  'Cypress': ['cypress'],
  'Selenium': ['selenium'],
  'React Testing Library': ['react testing library', 'rtl'],
  'PyTest': ['pytest', 'py.test'],
  'JUnit': ['junit'],

  'Machine Learning': ['machine learning', 'ml', 'statistical learning'],
  'Deep Learning': ['deep learning', 'dl', 'neural networks', 'neural network'],
  'TensorFlow': ['tensorflow', 'tf'],
  'PyTorch': ['pytorch', 'torch'],
  'Scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn'],
  'Pandas': ['pandas'],
  'NumPy': ['numpy'],
  'Natural Language Processing': ['nlp', 'natural language processing', 'text processing'],
  'Computer Vision': ['computer vision', 'cv', 'image processing'],
  'Data Analysis': ['data analysis', 'data analytics', 'data science'],
  'Data Visualization': ['data visualization', 'data viz', 'matplotlib', 'seaborn', 'plotly'],
  'Large Language Models': ['llm', 'llms', 'large language model', 'gpt', 'chatgpt', 'openai api'],

  'Git': ['git', 'github', 'gitlab', 'version control', 'svn'],
  'Jira': ['jira', 'atlassian jira'],
  'Figma': ['figma', 'ui/ux', 'ui design'],
  'Postman': ['postman', 'api testing'],
  'VS Code': ['vs code', 'visual studio code', 'vscode'],
  'Webpack': ['webpack'],
  'Vite': ['vite'],
  'npm': ['npm', 'yarn', 'package manager'],

  'Flutter': ['flutter'],
  'Android': ['android', 'android development'],
  'iOS': ['ios', 'ios development', 'xcode'],

  'Object-Oriented Programming': ['oop', 'object oriented', 'object-oriented programming'],
  'Functional Programming': ['functional programming', 'fp'],
  'Data Structures': ['data structures', 'dsa', 'data structures and algorithms', 'algorithms'],
  'System Design': ['system design', 'distributed systems', 'architecture'],
  'Agile': ['agile', 'scrum', 'kanban', 'agile methodology'],
  'API Design': ['api design', 'api development', 'api integration'],
  'Responsive Design': ['responsive design', 'responsive web design', 'mobile-first'],
  'Web Security': ['web security', 'cybersecurity', 'owasp', 'security', 'authentication', 'authorization'],
  'Problem Solving': ['problem solving', 'analytical skills', 'critical thinking'],
  'Communication': ['communication', 'communication skills', 'verbal communication', 'written communication'],
  'Teamwork': ['teamwork', 'team player', 'collaboration', 'cross-functional'],
  'Leadership': ['leadership', 'team lead', 'mentoring', 'managing'],
};

function buildAliasLookup() {
  const lookup = new Map();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const normalizedCanonical = canonical.toLowerCase().trim();
    lookup.set(normalizedCanonical, canonical);
    for (const alias of aliases) {
      lookup.set(alias.toLowerCase().trim(), canonical);
    }
  }
  return lookup;
}

const ALIAS_LOOKUP = buildAliasLookup();

function getAllCanonicalSkills() {
  return Object.keys(SKILL_ALIASES);
}

module.exports = { SKILL_ALIASES, ALIAS_LOOKUP, getAllCanonicalSkills, buildAliasLookup };
