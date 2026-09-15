import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  isBlocked?: boolean;
  forceLoggedOutAt?: string;
  createdAt: string;
}

export interface AdminMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number; // Stored securely on server only
  explanation: string;
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questions: Question[];
  isPublished: boolean;
  createdAt: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  marksAwarded: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: AttemptAnswer[];
  emailNotification: {
    sentToUser: boolean;
    sentToAdmin: boolean;
    userEmail: string;
    adminEmail: string;
    timestamp: string;
    previewUrl?: string;
  };
}

export interface EmailLog {
  id: string;
  attemptId: string;
  recipientEmail: string;
  recipientType: 'user' | 'admin';
  subject: string;
  snippet: string;
  htmlContent: string;
  status: 'sent' | 'simulated' | 'failed';
  timestamp: string;
  previewUrl?: string;
  errorMessage?: string;
}

interface DatabaseSchema {
  users: User[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  emailLogs: EmailLog[];
  messages: AdminMessage[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'portal_database.json');

// Initial seed data
const initialQuizzes: Quiz[] = [
  {
    id: 'quiz-web-dev',
    title: 'Full-Stack Web Development & Modern JavaScript',
    description: 'Assess your deep understanding of asynchronous JavaScript, REST APIs, DOM mechanics, React reconciler, and HTTP security fundamentals.',
    category: 'Web Development',
    difficulty: 'Intermediate',
    timeLimitMinutes: 10,
    totalMarks: 30,
    passingPercentage: 60,
    isPublished: true,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-wd-1',
        questionText: 'What is the primary difference between Promise.all() and Promise.allSettled() in modern JavaScript?',
        options: [
          'Promise.allSettled() rejects immediately on the first rejection, whereas Promise.all() waits for all promises.',
          'Promise.all() rejects immediately when any promise rejects, while Promise.allSettled() waits for all promises to resolve or reject and returns status objects.',
          'Promise.all() executes in parallel, while Promise.allSettled() executes strictly sequentially.',
          'There is no difference; Promise.allSettled is simply an alias for backwards compatibility.'
        ],
        correctOptionIndex: 1,
        explanation: 'Promise.all rejects immediately upon the first rejected promise (fail-fast), whereas Promise.allSettled waits until all input promises have either fulfilled or rejected, returning an array of descriptor objects.',
        marks: 5
      },
      {
        id: 'q-wd-2',
        questionText: 'Which HTTP status code is most appropriate when a client request contains valid authentication credentials, but the user lacks authorization permission to access the resource?',
        options: [
          '401 Unauthorized',
          '403 Forbidden',
          '400 Bad Request',
          '404 Not Found'
        ],
        correctOptionIndex: 1,
        explanation: '401 Unauthorized indicates missing or invalid authentication credentials. 403 Forbidden indicates the user is authenticated, but does not possess the permissions required to access the resource.',
        marks: 5
      },
      {
        id: 'q-wd-3',
        questionText: 'How does React Virtual DOM diffing (Reconciliation) optimize list re-rendering using the "key" prop?',
        options: [
          'It forces React to completely unmount and re-render every item in the array.',
          'It allows React to match children in the original tree with children in the subsequent tree across re-renders to minimize DOM mutations.',
          'It stores component states in local storage across browser refreshes.',
          'It automatically encodes list values against Cross-Site Scripting (XSS).'
        ],
        correctOptionIndex: 1,
        explanation: 'Keys help React identify which items have changed, been added, or been removed. Keys should be given to elements inside the array to give elements a stable identity.',
        marks: 5
      },
      {
        id: 'q-wd-4',
        questionText: 'Why should JSON Web Tokens (JWTs) storing sensitive claims never be placed in client-side localStorage if vulnerability to Cross-Site Scripting (XSS) is a concern?',
        options: [
          'LocalStorage is limited to 10 bytes and cannot fit standard JWT signatures.',
          'LocalStorage is synchronously accessible by any JavaScript running in the page origin, allowing malicious injected scripts to steal the token.',
          'LocalStorage automatically sends all items in HTTP request headers.',
          'LocalStorage encrypts values with keys only known to the web browser vendor.'
        ],
        correctOptionIndex: 1,
        explanation: 'LocalStorage has no protection against scripts running on the same domain. If an attacker succeeds with XSS, they can execute localStorage.getItem("token") and exfiltrate credentials. HttpOnly Secure cookies prevent script access.',
        marks: 5
      },
      {
        id: 'q-wd-5',
        questionText: 'In Node.js Express middleware architecture, what happens if a custom middleware executes without calling next() or sending an HTTP response?',
        options: [
          'Express automatically sends a 200 OK with an empty body.',
          'Express throws an UncaughtException and terminates the Node process.',
          'The client request hangs indefinitely until the client socket or server connection times out.',
          'Express skips to the next route handler in the routing table.'
        ],
        correctOptionIndex: 2,
        explanation: 'Express middleware functions must either end the request-response cycle (e.g. res.json()) or pass control to the next middleware by invoking next(). Without either, the request hangs.',
        marks: 5
      },
      {
        id: 'q-wd-6',
        questionText: 'What is the purpose of the "Content-Security-Policy" (CSP) HTTP response header?',
        options: [
          'To compress response payloads using Brotli or Gzip algorithms.',
          'To restrict the resources (scripts, images, stylesheets) that the browser is allowed to load for a given page, mitigating XSS and data injection.',
          'To mandate HTTPS connections for all future visits for a specified max-age.',
          'To regulate CORS pre-flight OPTIONS requests.'
        ],
        correctOptionIndex: 1,
        explanation: 'CSP is an added layer of security that helps detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks, by declaring approved sources of content.',
        marks: 5
      }
    ]
  },
  {
    id: 'quiz-dsa',
    title: 'Data Structures & Algorithmic Thinking',
    description: 'Test your understanding of Big-O complexity, hash collision resolution, binary search trees, and graph traversal strategies.',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    timeLimitMinutes: 8,
    totalMarks: 25,
    passingPercentage: 60,
    isPublished: true,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-dsa-1',
        questionText: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) of N nodes?',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctOptionIndex: 2,
        explanation: 'In the worst case, an unbalanced BST degenerates into a linked list (skewed tree), yielding O(N) search time.',
        marks: 5
      },
      {
        id: 'q-dsa-2',
        questionText: 'Which data structure is primarily used to implement Breadth-First Search (BFS) traversal of a graph or tree?',
        options: ['Stack (LIFO)', 'Queue (FIFO)', 'Max-Heap', 'Disjoint-Set Union (DSU)'],
        correctOptionIndex: 1,
        explanation: 'BFS explores neighbor nodes level by level, which requires a Queue (First-In-First-Out) to process nodes in the order they were discovered.',
        marks: 5
      },
      {
        id: 'q-dsa-3',
        questionText: 'In a Hash Table with open addressing, what technique probes positions at intervals governed by a second hash function when a collision occurs?',
        options: ['Linear Probing', 'Quadratic Probing', 'Double Hashing', 'Separate Chaining'],
        correctOptionIndex: 2,
        explanation: 'Double hashing uses a secondary hash function hash2(key) to calculate the step size for subsequent collision probes, drastically reducing clustering.',
        marks: 5
      },
      {
        id: 'q-dsa-4',
        questionText: 'What is the average and worst-case time complexity of the standard QuickSort algorithm?',
        options: [
          'Average: O(N log N), Worst: O(N log N)',
          'Average: O(N log N), Worst: O(N²)',
          'Average: O(N²), Worst: O(N²)',
          'Average: O(log N), Worst: O(N)'
        ],
        correctOptionIndex: 1,
        explanation: 'QuickSort has an average case time of O(N log N). However, if poor pivots are consistently chosen (such as already sorted inputs with last-element pivot), it degrades to O(N²).',
        marks: 5
      },
      {
        id: 'q-dsa-5',
        questionText: 'Which algorithmic paradigm solves a problem by combining solutions to subproblems, storing computed subproblem results in a lookup table (memoization or tabulation)?',
        options: ['Greedy Algorithm', 'Dynamic Programming', 'Divide and Conquer without caching', 'Backtracking'],
        correctOptionIndex: 1,
        explanation: 'Dynamic Programming breaks down problems into overlapping subproblems and caches their optimal solutions to avoid redundant recomputations.',
        marks: 5
      }
    ]
  },
  {
    id: 'quiz-cloud-devops',
    title: 'Cloud Computing, Docker & DevOps Essentials',
    description: 'Verify your knowledge of containerization concepts, CI/CD pipelines, Docker layers, and cloud infrastructure patterns.',
    category: 'Cloud & DevOps',
    difficulty: 'Beginner',
    timeLimitMinutes: 8,
    totalMarks: 25,
    passingPercentage: 60,
    isPublished: true,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-cd-1',
        questionText: 'What is the fundamental architectural difference between Docker containers and traditional Virtual Machines (VMs)?',
        options: [
          'Containers virtualize hardware and run full guest OS kernels; VMs share the host kernel.',
          'Containers share the host operating system kernel and isolate user spaces, making them much lighter than VMs which run separate guest OS kernels.',
          'Containers can only run on Linux, while VMs can only run on Windows.',
          'Containers do not have isolated networking or file systems.'
        ],
        correctOptionIndex: 1,
        explanation: 'Containers leverage Linux namespaces and cgroups to share the host kernel while isolating processes and filesystems, whereas VMs require hypervisors to emulate physical hardware and run distinct guest kernels.',
        marks: 5
      },
      {
        id: 'q-cd-2',
        questionText: 'In Dockerfile construction, why should dependency installation commands (e.g., package.json & npm install) precede source code copying (e.g., COPY . .)?',
        options: [
          'Docker will refuse to compile without package.json as the first layer.',
          'To leverage Docker layer caching so npm install only re-executes when package files change, saving build time.',
          'To automatically minify source code before running tests.',
          'To prevent source code files from being inspected by node_modules.'
        ],
        correctOptionIndex: 1,
        explanation: 'Docker caches image layers sequentially. Placing dependency manifests first ensures npm install runs only when dependencies change, rather than on every small source code edit.',
        marks: 5
      },
      {
        id: 'q-cd-3',
        questionText: 'What does "Infrastructure as Code" (IaC) refer to in modern cloud environments?',
        options: [
          'Writing cloud documentation exclusively in HTML and Markdown.',
          'Managing and provisioning cloud and networking resources through machine-readable definition files (e.g. Terraform, Pulumi) rather than manual console clicking.',
          'Running source code directly on physical bare-metal switches.',
          'Writing database migration SQL scripts by hand.'
        ],
        correctOptionIndex: 1,
        explanation: 'IaC enables automated, repeatable, version-controlled provisioning of cloud infrastructure using declarative or imperative configuration files.',
        marks: 5
      },
      {
        id: 'q-cd-4',
        questionText: 'Which CI/CD concept guarantees that newly integrated code is continuously tested and packaged into a deployable artifact upon every commit?',
        options: [
          'Continuous Integration (CI)',
          'Blue-Green Routing',
          'Canary Phasing',
          'Feature Toggling'
        ],
        correctOptionIndex: 0,
        explanation: 'Continuous Integration (CI) is the practice of automating the integration of code changes from multiple contributors into a single software project, with automated building and automated testing.',
        marks: 5
      },
      {
        id: 'q-cd-5',
        questionText: 'In Kubernetes and container orchestrators, what is a "Liveness Probe" primarily used for?',
        options: [
          'Determining whether a pod has valid TLS SSL certificates.',
          'Checking if the application container is still running properly; if it fails, the orchestrator restarts the container.',
          'Counting user page views for billing purposes.',
          'Ensuring container CPU temperature remains below maximum thresholds.'
        ],
        correctOptionIndex: 1,
        explanation: 'A liveness probe indicates whether the container is running. If the liveness probe fails, the kubelet kills the container and initiates its restart policy.',
        marks: 5
      }
    ]
  },
  {
    id: 'quiz-cybersec',
    title: 'Cybersecurity Fundamentals & Web Vulnerabilities',
    description: 'Evaluate essential security principles including OWASP Top 10, SQL injection, CSRF tokens, and zero-trust paradigms.',
    category: 'Cybersecurity',
    difficulty: 'Intermediate',
    timeLimitMinutes: 8,
    totalMarks: 25,
    passingPercentage: 60,
    isPublished: true,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-sec-1',
        questionText: 'What is the most effective defensive technique against SQL Injection (SQLi) vulnerabilities in relational database queries?',
        options: [
          'Filtering out quotes and semicolons using regular expressions on the frontend.',
          'Using parameterized queries (prepared statements) or Object-Relational Mapping (ORM) tools that separate query code from user data.',
          'Encrypting the entire database table with AES-256.',
          'Limiting user input length to fewer than 20 characters.'
        ],
        correctOptionIndex: 1,
        explanation: 'Parameterized queries ensure the database engine treats user input strictly as data parameters, never as executable SQL command syntax, eliminating injection opportunities.',
        marks: 5
      },
      {
        id: 'q-sec-2',
        questionText: 'How does an Anti-CSRF (Cross-Site Request Forgery) token protect a user from unauthorized state-changing actions?',
        options: [
          'It completely encrypts the user password before sending it to the database.',
          'It provides a unique, unpredictable secret associated with the user session that third-party attacker sites cannot read or forge in cross-origin requests.',
          'It blocks all outgoing HTTP GET requests.',
          'It disables JavaScript in the visitor browser.'
        ],
        correctOptionIndex: 1,
        explanation: 'Same-origin policy prevents malicious external sites from reading the anti-CSRF token from the legitimate site; thus the attacker cannot include the correct token in a forged submission.',
        marks: 5
      },
      {
        id: 'q-sec-3',
        questionText: 'What is the primary architectural rule of the "Zero Trust" security model?',
        options: [
          'Trust any device or connection that originates inside the private internal corporate network.',
          '"Never trust, always verify" — every access request must be authenticated, authorized, and encrypted regardless of network location.',
          'Only grant access to users who type their passwords within 3 seconds.',
          'Disable firewalls and rely solely on end-point antivirus.'
        ],
        correctOptionIndex: 1,
        explanation: 'Zero Trust assumes breach and verifies each request as though it originated from an open, untrusted network, eliminating implicit trust based on network perimeter.',
        marks: 5
      },
      {
        id: 'q-sec-4',
        questionText: 'Which cryptographic hash characteristic ensures that even a single-bit change in input drastically changes the resulting hash output?',
        options: ['Collision Resistance', 'Pre-image Resistance', 'The Avalanche Effect', 'Key Stretching'],
        correctOptionIndex: 2,
        explanation: 'The avalanche effect is a desirable property of cryptographic algorithms where a small change in the input produces a significantly different, seemingly random output.',
        marks: 5
      },
      {
        id: 'q-sec-5',
        questionText: 'Why is bcrypt or Argon2 preferred over raw SHA-256 or MD5 for password storage?',
        options: [
          'Because SHA-256 is deprecated and generates longer hash strings.',
          'Because bcrypt and Argon2 incorporate automatic salt generation and configurable work factors (computational cost) to slow down brute-force and GPU cracking attacks.',
          'Because bcrypt allows recovering the plaintext password whenever the user forgets it.',
          'Because bcrypt hashes are stored unencrypted in plain text.'
        ],
        correctOptionIndex: 1,
        explanation: 'Raw fast hashes like MD5 and SHA-256 are engineered for throughput and can be cracked at billions of hashes per second using GPUs. Key-stretching algorithms like bcrypt are intentionally slow and resource-intensive.',
        marks: 5
      }
    ]
  }
];

class Database {
  private memoryData: DatabaseSchema;

  constructor() {
    this.memoryData = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        let users: User[] = parsed.users || [];
        
        // Remove legacy admin accounts if any
        users = users.filter((u) => u.email.toLowerCase() !== 'admin@eduquiz.com');

        // Ensure Muhammad Faizan is configured as Administrator
        const adminEmail = 'mf0622192@gmail.com';
        const adminHash = bcrypt.hashSync('FaiZaN786@@@', 10);
        const adminIdx = users.findIndex((u) => u.email.toLowerCase() === adminEmail);

        if (adminIdx >= 0) {
          users[adminIdx].name = 'Muhammad Faizan';
          users[adminIdx].passwordHash = adminHash;
          users[adminIdx].role = 'admin';
          users[adminIdx].isBlocked = false;
        } else {
          users.push({
            id: 'user-admin-faizan',
            name: 'Muhammad Faizan',
            email: adminEmail,
            passwordHash: adminHash,
            role: 'admin',
            isBlocked: false,
            createdAt: new Date().toISOString()
          });
        }

        return {
          users,
          quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
          attempts: parsed.attempts || [],
          emailLogs: parsed.emailLogs || [],
          messages: parsed.messages || []
        };
      }
    } catch (err) {
      console.warn('Failed reading existing db file, initializing fresh memory store:', err);
    }

    // Initialize with pre-seeded demo users and quizzes
    const studentPasswordHash = bcrypt.hashSync('password123', 10);
    const adminPasswordHash = bcrypt.hashSync('FaiZaN786@@@', 10);

    const defaultUsers: User[] = [
      {
        id: 'user-student-1',
        name: 'Alex Rivera',
        email: 'student@eduquiz.com',
        passwordHash: studentPasswordHash,
        role: 'student',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-admin-faizan',
        name: 'Muhammad Faizan',
        email: 'mf0622192@gmail.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        isBlocked: false,
        createdAt: new Date().toISOString()
      }
    ];

    const data: DatabaseSchema = {
      users: defaultUsers,
      quizzes: [],
      attempts: [],
      emailLogs: [],
      messages: []
    };

    this.saveData(data);
    return data;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database to disk:', err);
    }
  }

  // USER OPERATIONS
  public findUserByEmail(email: string): User | undefined {
    return this.memoryData.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public findUserById(id: string): User | undefined {
    return this.memoryData.users.find((u) => u.id === id);
  }

  public createUser(name: string, email: string, passwordHash: string, role: 'student' | 'admin' = 'student'): User {
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };
    this.memoryData.users.push(newUser);
    this.saveData(this.memoryData);
    return newUser;
  }

  // QUIZ OPERATIONS
  /**
   * Returns list of quizzes with questions sanitized (NO correct answers or explanations leaked to client)
   */
  public getPublicQuizzes(): Array<Omit<Quiz, 'questions'> & { questionsCount: number }> {
    return this.memoryData.quizzes
      .filter((q) => q.isPublished)
      .map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        timeLimitMinutes: q.timeLimitMinutes,
        totalMarks: q.totalMarks,
        passingPercentage: q.passingPercentage,
        isPublished: q.isPublished,
        createdAt: q.createdAt,
        questionsCount: q.questions.length
      }));
  }

  /**
   * Returns a quiz sanitized for taking (options are present, but correct answers are omitted)
   */
  public getQuizForTaker(quizId: string): (Omit<Quiz, 'questions'> & {
    questions: Array<Omit<Question, 'correctOptionIndex' | 'explanation'>>;
  }) | null {
    const quiz = this.memoryData.quizzes.find((q) => q.id === quizId);
    if (!quiz) return null;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimitMinutes: quiz.timeLimitMinutes,
      totalMarks: quiz.totalMarks,
      passingPercentage: quiz.passingPercentage,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks
      }))
    };
  }

  /**
   * Internal method used solely during submission evaluation to check answers against correct key
   */
  public getQuizByIdFull(quizId: string): Quiz | undefined {
    return this.memoryData.quizzes.find((q) => q.id === quizId);
  }

  public createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz {
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.memoryData.quizzes.push(newQuiz);
    this.saveData(this.memoryData);
    return newQuiz;
  }

  // ATTEMPT OPERATIONS
  public recordAttempt(attempt: Omit<QuizAttempt, 'id' | 'submittedAt'>): QuizAttempt {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString()
    };
    this.memoryData.attempts.unshift(newAttempt); // Recent first
    this.saveData(this.memoryData);
    return newAttempt;
  }

  public updateAttemptEmailStatus(attemptId: string, emailStatus: QuizAttempt['emailNotification']): void {
    const att = this.memoryData.attempts.find((a) => a.id === attemptId);
    if (att) {
      att.emailNotification = emailStatus;
      this.saveData(this.memoryData);
    }
  }

  public getUserAttempts(userId: string): QuizAttempt[] {
    return this.memoryData.attempts.filter((a) => a.userId === userId);
  }

  public getAttemptById(attemptId: string): QuizAttempt | undefined {
    return this.memoryData.attempts.find((a) => a.id === attemptId);
  }

  public getAllAttempts(): QuizAttempt[] {
    return this.memoryData.attempts;
  }

  // EMAIL LOGS
  public logEmail(log: Omit<EmailLog, 'id' | 'timestamp'>): EmailLog {
    const newLog: EmailLog = {
      ...log,
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.memoryData.emailLogs.unshift(newLog);
    this.saveData(this.memoryData);
    return newLog;
  }

  public getEmailLogs(): EmailLog[] {
    return this.memoryData.emailLogs;
  }

  public getStats() {
    return {
      totalUsers: this.memoryData.users.length,
      totalQuizzes: this.memoryData.quizzes.length,
      totalAttempts: this.memoryData.attempts.length,
      totalEmailsDispatched: this.memoryData.emailLogs.length,
      totalMessages: this.memoryData.messages ? this.memoryData.messages.length : 0
    };
  }

  // ==========================================
  // ADMIN USER MANAGEMENT (BLOCK / FORCE LOGOUT)
  // ==========================================
  public getAllUsers(): Array<Omit<User, 'passwordHash'> & { attemptsCount: number; lastAttemptDate?: string }> {
    return this.memoryData.users.map((u) => {
      const userAttempts = this.memoryData.attempts.filter((a) => a.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isBlocked: Boolean(u.isBlocked),
        forceLoggedOutAt: u.forceLoggedOutAt,
        createdAt: u.createdAt,
        attemptsCount: userAttempts.length,
        lastAttemptDate: userAttempts[0]?.submittedAt
      };
    });
  }

  public setUserBlocked(userId: string, isBlocked: boolean): User | null {
    const user = this.memoryData.users.find((u) => u.id === userId);
    if (!user) return null;
    user.isBlocked = isBlocked;
    if (isBlocked) {
      user.forceLoggedOutAt = new Date().toISOString();
    }
    this.saveData(this.memoryData);
    return user;
  }

  public forceLogoutUser(userId: string): User | null {
    const user = this.memoryData.users.find((u) => u.id === userId);
    if (!user) return null;
    user.forceLoggedOutAt = new Date().toISOString();
    this.saveData(this.memoryData);
    return user;
  }

  // ==========================================
  // ADMIN QUIZ & QUESTION REARRANGEMENT / EDITING
  // ==========================================
  public getAllQuizzesAdmin(): Quiz[] {
    return this.memoryData.quizzes;
  }

  public updateQuiz(quizId: string, updates: Partial<Omit<Quiz, 'id' | 'questions' | 'createdAt'>>): Quiz | null {
    const quiz = this.memoryData.quizzes.find((q) => q.id === quizId);
    if (!quiz) return null;

    if (updates.title !== undefined) quiz.title = updates.title;
    if (updates.description !== undefined) quiz.description = updates.description;
    if (updates.category !== undefined) quiz.category = updates.category;
    if (updates.difficulty !== undefined) quiz.difficulty = updates.difficulty;
    if (updates.timeLimitMinutes !== undefined) quiz.timeLimitMinutes = Number(updates.timeLimitMinutes);
    if (updates.passingPercentage !== undefined) quiz.passingPercentage = Number(updates.passingPercentage);
    if (updates.totalMarks !== undefined) quiz.totalMarks = Number(updates.totalMarks);
    if (updates.isPublished !== undefined) quiz.isPublished = Boolean(updates.isPublished);

    this.saveData(this.memoryData);
    return quiz;
  }

  public updateQuizQuestions(quizId: string, questions: Question[]): Quiz | null {
    const quiz = this.memoryData.quizzes.find((q) => q.id === quizId);
    if (!quiz) return null;

    // Recalculate totalMarks from updated questions
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    quiz.questions = questions;
    quiz.totalMarks = totalMarks;

    this.saveData(this.memoryData);
    return quiz;
  }

  public deleteQuiz(quizId: string): boolean {
    const initialLen = this.memoryData.quizzes.length;
    this.memoryData.quizzes = this.memoryData.quizzes.filter((q) => q.id !== quizId);
    if (this.memoryData.quizzes.length !== initialLen) {
      this.saveData(this.memoryData);
      return true;
    }
    return false;
  }

  // ==========================================
  // STUDENT CONTACT ADMIN INQUIRIES
  // ==========================================
  public createAdminMessage(data: Omit<AdminMessage, 'id' | 'createdAt' | 'status'>): AdminMessage {
    if (!this.memoryData.messages) {
      this.memoryData.messages = [];
    }
    const newMsg: AdminMessage = {
      ...data,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    this.memoryData.messages.unshift(newMsg);
    this.saveData(this.memoryData);
    return newMsg;
  }

  public getAdminMessages(): AdminMessage[] {
    return this.memoryData.messages || [];
  }
}

export const db = new Database();
