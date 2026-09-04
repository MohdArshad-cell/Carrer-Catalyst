import asyncio
import sys

# Add the current directory to Python path
sys.path.append('.')

from app.services.tailor_service import execute_tailor_chain

raw_resume = r"""\documentclass[letterpaper,9.8pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage{tabularx, multicol}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-0.7in}
\addtolength{\textheight}{1.35in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-10pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-7pt}]

% --- CORRECTED CUSTOM COMMANDS ---
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-3pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-1pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-6pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-6pt}
}

\newcommand{\resumeItemListStart}{\begin{itemize}[leftmargin=*, label=$\bullet$]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

%----------HEADING----------
\begin{center}
    \textbf{\Huge \scshape Mohd Arshad} \\ \vspace{2pt}
    \small +91-7887096421 $|$ \href{mailto:arshadmohd8574@gmail.com}{\underline{arshadmohd8574@gmail.com}} $|$
    \href{https://www.linkedin.com/in/mohd-arshad-156227314/}{\underline{LinkedIn}} $|$
    \href{https://github.com/MohdArshad-cell}{\underline{GitHub}}$|$
    \href{https://portfolio-2-0-sigma-gray.vercel.app/}{\underline{Portfolio}}
\end{center}


%-----------Summary-----------
\section{Summary}
Backend Engineer specializing in \textbf{Distributed Systems, Event-Driven Architecture, and High-Throughput Microservices}. Core expertise in \textbf{Java, Spring Boot, Apache Kafka, and Redis}, with hands-on focus on solving \textbf{distributed concurrency, database consistency, and fault tolerance}. Experienced in container orchestration and integrating AI-driven pipelines into production systems.

%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Babu Banarsi Das Northern India Institute Of Technology}{Lucknow, India}
      {Bachelor of Technology in Information Technology (GPA: 7.87/10.0)}{2022 -- 2026}
  \resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \item {\small
     \textbf{Languages:}{ Java, Python, SQL (PostgreSQL), TypeScript} \\
     
     \textbf{Backend \& Distributed Systems:}{ Spring Boot 3, Apache Kafka, Redis (Redlock/Caching), Microservices, REST APIs, Resilience4j} \\
     
     \textbf{Databases \& Storage:}{ PostgreSQL, MongoDB, Redis, HikariCP, Indexing \& Query Optimization} \\
     
     \textbf{Cloud, DevOps \& Observability:}{ Docker, Kubernetes, Prometheus, Grafana, Distributed Tracing (Zipkin/OpenTelemetry), Git/GitHub} \\

     \textbf{AI Engineering \& Tools:}{ Spring AI, Gemini API, Vector DBs (pgvector), Testcontainers, Postman, Maven}
    }
 \end{itemize}

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Software Engineer Intern}{Mar 2025 -- Aug 2026}
      {HireEase (AplyEase)}{Remote}
      \resumeItemListStart
        \resumeItem{Engineered an autonomous multi-agent AI pipeline utilizing \textbf{Google Gemini API} to perform contextual extraction and iterative resume optimization, elevating ATS candidate-match scores to \textbf{90\%+}.}
        \resumeItem{Spearheaded backend architecture and cross-functional engineering workflows as interim lead, standardizing structured JSON prompt schemas and modular delivery pipelines for an agile team.}
        \resumeItem{Engineered automated document generation workflows and asynchronous worker handlers, cutting end-to-end client delivery turnaround time by \textbf{40\%} across high-volume production requests.}
      \resumeItemListEnd
  \resumeSubHeadingListEnd

%-----------RESEARCH & PUBLICATIONS-----------
\section{Research \& Publications}
  \resumeSubHeadingListStart
    \resumeProjectHeading
      {\textbf{GeoSentinel: Computational Framework for Conflict Simulation}}{Nov 2025 -- May 2026}
      \resumeItemListStart
        \resumeItem{Engineered a synthetic simulation framework in \textbf{Python} to model non-linear dynamic interactions between physical conflict events and narrative sentiment across discrete state transitions.}
        \resumeItem{Developed a dual-pillar NLP pipeline integrating fine-tuned \textbf{DistilBERT} for high-density sentiment quantification alongside \textbf{PCA} for dynamic feature extraction and dimensionality reduction.}
        \resumeItem{Applied \textbf{Granger Causality tests} on multidimensional time-series data to statistically validate predictive lead-lag relationships between narrative spikes and physical escalation events.}
      \resumeItemListEnd
  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
  \resumeSubHeadingListStart

    % --- Project 1: SentinelLedger ---
    \resumeProjectHeading
      {\textbf{SentinelLedger} $|$ \emph{Java 21, Spring Boot 3, Kafka, Redis, PostgreSQL, ONNX Runtime, Docker}}{}
      \resumeItemListStart
        \resumeItem{Architected an event-driven payment engine processing \textbf{10,000+ RPS}, enforcing strict append-only double-entry bookkeeping schemas to eliminate balance tampering and ensure immutable auditability.}
        \resumeItem{Implemented the \textbf{Saga Orchestration Pattern} with a \textbf{Transactional Outbox} to guarantee at-least-once message delivery and automatic compensating rollbacks across distributed microservices.}
        \resumeItem{Eliminated double-spending vulnerabilities and race conditions under peak concurrency using \textbf{Redis Redlock} paired with cryptographic idempotency validation keys.}
        \resumeItem{Integrated an embedded \textbf{XGBoost fraud model via Java ONNX Runtime}, achieving sub-\textbf{15ms} inference latency by executing in-memory feature scoring and bypassing remote network hops.}
      \resumeItemListEnd

    % --- Project 2: FlashTix ---
    \resumeProjectHeading
      {\textbf{FlashTix} $|$ \emph{Java 21, Spring Boot 3, Redis, PostgreSQL, Lua Scripts, Prometheus, Grafana}}{}
      \resumeItemListStart
        \resumeItem{Engineered a distributed ticketing platform handling \textbf{5,000+ RPS} without overselling anomalies, utilizing atomic \textbf{Redis Lua scripts} for rapid in-memory seat allocation and state management.}
        \resumeItem{Enforced multi-layered data consistency by combining \textbf{Redis Distributed Locking} with \textbf{PostgreSQL Optimistic Locking (@Version)} as a resilient fail-safe boundary under heavy database contention.}
        \resumeItem{Tuned database connection pooling via \textbf{HikariCP} to maximize throughput and established live telemetry monitoring for lock contention, error rates, and p99 latency using \textbf{Prometheus and Grafana}.}
      \resumeItemListEnd

    % --- Project 3: StreamFlow ---
    \resumeProjectHeading
      {\textbf{StreamFlow} $|$ \emph{Java, Spring Boot, Apache Kafka, Redis, MongoDB, Zipkin, Docker}}{}
      \resumeItemListStart
        \resumeItem{Architected a scalable messaging backbone leveraging \textbf{Apache Kafka} custom partition key hashing and manual offset management, guaranteeing at-least-once delivery semantics across worker pools.}
        \resumeItem{Configured an automated fault-recovery pipeline utilizing \textbf{Dead Letter Queues (DLQ)} with exponential backoff and jitter algorithms to isolate and retry transient downstream provider failures.}
        \resumeItem{Implemented a \textbf{Redis Write-Through Caching} layer to serve high-frequency notification reads at sub-\textbf{5ms} latency, offloading \textbf{70\%+} read IOPS from the underlying \textbf{MongoDB} database.}
      \resumeItemListEnd

  \resumeSubHeadingListEnd



%-------------------------------------------
\end{document}"""

jd_text = """About Motorq

Motorq is the leading vehicle infrastructure and analytics software company that tells you everything you need to know about your fleet's vehicles by connecting to them directly. Our Connected Vehicle Data Platform allows businesses to gain powerful insights from their fleet's data without the need for hardware while also serving mixed fleets by integrating with aftermarket devices. Through partnerships with 13 of the largest global auto manufacturers, Motorq has developed industry-defining benchmarks for EVs and ICE vehicles.
Motorq is expanding and seeking world-class candidates to join our growing team.
The future of mobility is built here—tackling big problems with elite peers to create massive impact. Motorq sits at the center of an industry shift, maintaining direct relationships with the world's leading automakers. Our team members have built category-defining companies and hold each other to a high standard: do right by the work and by one another.


About the Job

We are looking for a proactive and skilled software engineer to join our growing team.
• Design, build, and ship features end-to-end from technical design through production owning quality, cost, and security along the way
• Write clean, well-tested code that is maintainable, observable, and built to scale
• Raise the bar through continuous improvement refactoring, code reviews, and clean code principles
• Drive projects forward with an ownership mindset, partnering with cross-functional teams to keep integration and alignment seamless
• Bring innovative design ideas and stay ahead of emerging technologies


Requirements

• Bachelor's degree in Computer Science or a related field, with 2+ years building production software
• Strong CS fundamentals with excellent problem-solving, data structures, and algorithms skills
• Proficiency in one or more server-side languages (e.g., Java, Go, Python, C#) and the ability to pick up new ones quickly
• Experience designing and operating distributed systems at scale — reliability, fault tolerance, and performance under high throughput
• Hands-on experience shipping and running services on AWS, Azure, or GCP
• Fluency with AI-assisted and agentic development tools (coding assistants, LLM APIs) as part of your daily workflow
• Ownership mindset — you take features from design to production and care about quality, cost, and security
• Strong collaboration and communication skills across cross-functional teams


Good to Have

• Experience designing RESTful or streaming APIs and working with large-scale telemetry or time-series data
• Exposure to stream processing (e.g., Kafka, Flink) and event-driven architectures
• Prior startup or high-growth environment experience
If you are passionate about delivering high-quality solutions and thriving in a collaborative environment, we'd love to hear from you."""

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    try:
        print("Starting tailoring engine test...")
        result = execute_tailor_chain(raw_resume, jd_text)
        print("\n\n====== TEST COMPLETED SUCCESSFULLY ======")
        print(f"Target Title Extracted: {result.get('jd_data', {}).get('target_job_title')}")
        
        # Save output latex to a file for review
        with open("test_tailored_resume.tex", "w", encoding="utf-8") as f:
            f.write(result['tailored_latex'])
        print("\nWrote tailored resume to test_tailored_resume.tex")
    except Exception as e:
        print(f"ERROR: {e}")
