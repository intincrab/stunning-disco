export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  source: string;
}

const JAKES_RESUME = String.raw`\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}

\begin{center}
    \textbf{\Huge \scshape Jake Ryan} \\ \vspace{1pt}
    \small 123-456-7890 $|$ \href{mailto:x@x.com}{\underline{jake@su.edu}} $|$
    \href{https://linkedin.com/in/...}{\underline{linkedin.com/in/jake}} $|$
    \href{https://github.com/...}{\underline{github.com/jake}}
\end{center}

\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Southwestern University}{Georgetown, TX}
      {Bachelor of Arts in Computer Science, Minor in Business}{Aug. 2018 -- May 2021}
    \resumeSubheading
      {Blinn College}{Bryan, TX}
      {Associate's in Liberal Arts}{Aug. 2014 -- May 2018}
  \resumeSubHeadingListEnd

\section{Experience}
  \resumeSubHeadingListStart

    \resumeSubheading
      {Undergraduate Research Assistant}{June 2020 -- Present}
      {Texas A\&M University}{College Station, TX}
      \resumeItemListStart
        \resumeItem{Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems}
        \resumeItem{Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data}
        \resumeItem{Explored ways to visualize GitHub collaboration in a classroom setting}
      \resumeItemListEnd

    \resumeSubheading
      {Information Technology Support Specialist}{Sep. 2018 -- Present}
      {Southwestern University}{Georgetown, TX}
      \resumeItemListStart
        \resumeItem{Communicate with managers to set up campus computers used on campus}
        \resumeItem{Assess and troubleshoot computer problems brought by students, faculty and staff}
        \resumeItem{Maintain upkeep of computers, classroom equipment, and 200 printers across campus}
    \resumeItemListEnd

    \resumeSubheading
      {Artificial Intelligence Research Assistant}{May 2019 -- July 2019}
      {Southwestern University}{Georgetown, TX}
      \resumeItemListStart
        \resumeItem{Explored methods to generate video game dungeons based off of \emph{The Legend of Zelda}}
        \resumeItem{Developed a game in Java to test the generated dungeons}
        \resumeItem{Contributed 50K+ lines of code to an established codebase via Git}
        \resumeItem{Conducted a human subject study to determine which video game dungeon generation technique is enjoyable}
        \resumeItem{Wrote an 8-page paper and gave multiple presentations on-campus}
        \resumeItem{Presented virtually to the World Conference on Computational Intelligence}
      \resumeItemListEnd

  \resumeSubHeadingListEnd

\section{Projects}
    \resumeSubHeadingListStart
      \resumeProjectHeading
          {\textbf{Gitlytics} $|$ \emph{Python, Flask, React, PostgreSQL, Docker}}{June 2020 -- Present}
          \resumeItemListStart
            \resumeItem{Developed a full-stack web application using with Flask serving a REST API with React as the frontend}
            \resumeItem{Implemented GitHub OAuth to get data from user's repositories}
            \resumeItem{Visualized GitHub data to show collaboration}
            \resumeItem{Used Celery and Redis for asynchronous tasks}
          \resumeItemListEnd
      \resumeProjectHeading
          {\textbf{Simple Paintball} $|$ \emph{Spigot API, Java, Maven, TravisCI, Git}}{May 2018 -- May 2020}
          \resumeItemListStart
            \resumeItem{Developed a Minecraft server plugin to entertain kids during free time for a previous job}
            \resumeItem{Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review}
            \resumeItem{Implemented continuous delivery using TravisCI to build the plugin upon new a release}
            \resumeItem{Collaborated with Minecraft server administrators to suggest features and get feedback about the plugin}
          \resumeItemListEnd
    \resumeSubHeadingListEnd

\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages}{: Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R} \\
     \textbf{Frameworks}{: React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI} \\
     \textbf{Developer Tools}{: Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse} \\
     \textbf{Libraries}{: pandas, NumPy, Matplotlib}
    }}
 \end{itemize}

\end{document}`;

const ACADEMIC_CV = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=1in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}

\titleformat{\section}{\Large\bfseries}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{16pt}{8pt}

\pagestyle{plain}

\begin{document}

\begin{center}
  {\LARGE\bfseries Dr. Jane Smith}\\[6pt]
  Department of Computer Science\\
  University Name, City, State 12345\\
  jane.smith@university.edu \quad | \quad (555) 987-6543\\
  \href{https://janesmith.com}{janesmith.com}
\end{center}

\section{Research Interests}
Machine learning, natural language processing, computational linguistics, and human-computer interaction.

\section{Education}
\textbf{Ph.D. in Computer Science} \hfill 2018 -- 2023\\
University Name, City, State\\
Dissertation: \textit{Advances in Neural Language Understanding}\\
Advisor: Prof. John Doe

\textbf{M.S. in Computer Science} \hfill 2016 -- 2018\\
University Name, City, State

\textbf{B.S. in Mathematics} \hfill 2012 -- 2016\\
University Name, City, State \hfill \textit{Summa Cum Laude}

\section{Publications}
\begin{enumerate}
  \item Smith, J., Doe, J. (2023). "Neural approaches to semantic parsing." \textit{Proceedings of ACL 2023}.
  \item Smith, J. (2022). "Transfer learning for low-resource languages." \textit{Journal of AI Research}, 45(2), 112--134.
  \item Smith, J., Lee, K. (2021). "Attention mechanisms in document summarization." \textit{Proceedings of EMNLP 2021}.
\end{enumerate}

\section{Teaching Experience}
\textbf{Instructor} -- Introduction to Machine Learning \hfill Fall 2022, Spring 2023\\
University Name

\textbf{Teaching Assistant} -- Advanced Algorithms \hfill Fall 2019 -- Spring 2021\\
University Name

\section{Awards \& Grants}
\textbf{NSF Graduate Research Fellowship} \hfill 2019 -- 2022\\
\textbf{Best Paper Award}, ACL 2023 \hfill 2023\\
\textbf{Outstanding Teaching Award}, CS Department \hfill 2022

\end{document}`;

const BLANK_DOC = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}

\pagestyle{empty}

\begin{document}

% Start writing your resume here

\end{document}`;

const MINIMALIST = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.8in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}

\pagestyle{empty}
\setlength{\parindent}{0pt}

\begin{document}

{\Large\bfseries Alex Johnson}\\[2pt]
\textit{Full-Stack Developer}

\medskip
\hrule
\medskip

\begin{tabular}{@{}ll@{}}
Email: & alex@example.com\\
Phone: & (555) 234-5678\\
GitHub: & \href{https://github.com/alexjohnson}{github.com/alexjohnson}\\
Location: & San Francisco, CA
\end{tabular}

\bigskip
{\large\bfseries About}

\medskip
Full-stack developer with 5+ years of experience building scalable web applications. Passionate about clean code, developer experience, and shipping products that matter.

\bigskip
{\large\bfseries Experience}

\medskip
\textbf{Senior Developer} \hfill 2022 -- Present\\
\textit{TechCorp Inc.}
\begin{itemize}[leftmargin=*,noitemsep,topsep=4pt]
  \item Led migration from monolith to microservices, improving deploy frequency by 4x
  \item Mentored 3 junior developers through code reviews and pair programming
  \item Designed real-time notification system handling 1M+ events/day
\end{itemize}

\medskip
\textbf{Developer} \hfill 2019 -- 2022\\
\textit{StartupXYZ}
\begin{itemize}[leftmargin=*,noitemsep,topsep=4pt]
  \item Built customer-facing dashboard from scratch using React and GraphQL
  \item Reduced API response times by 60\% through query optimization
  \item Implemented CI/CD pipeline with automated testing and deployment
\end{itemize}

\bigskip
{\large\bfseries Skills}

\medskip
\textbf{Languages:} TypeScript, Python, Go, SQL\\
\textbf{Frontend:} React, Next.js, Tailwind CSS\\
\textbf{Backend:} Node.js, PostgreSQL, Redis, Docker, Kubernetes\\
\textbf{Cloud:} AWS (Lambda, ECS, RDS), Vercel

\bigskip
{\large\bfseries Education}

\medskip
\textbf{B.S. Computer Science} \hfill 2015 -- 2019\\
University of California, Berkeley

\end{document}`;

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "blank",
    name: "Blank Document",
    description: "Start from scratch with an empty LaTeX document",
    source: BLANK_DOC,
  },
  {
    id: "jakes",
    name: "Jake's Resume",
    description: "Popular single-column developer resume template",
    source: JAKES_RESUME,
  },
  {
    id: "academic",
    name: "Academic CV",
    description: "Formal CV for academic and research positions",
    source: ACADEMIC_CV,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, minimal design with elegant typography",
    source: MINIMALIST,
  },
];

export const DEFAULT_LATEX_TEMPLATE = TEMPLATES[1].source;
